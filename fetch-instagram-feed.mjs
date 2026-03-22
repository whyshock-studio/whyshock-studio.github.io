import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const USERNAME = "whyshock.studio";
const FEED_PATH = resolve(process.cwd(), "data", "instagram-feed.json");
const FEED_JS_PATH = resolve(process.cwd(), "data", "instagram-feed.js");
const MEDIA_DIR = resolve(process.cwd(), "data", "media");
const PROFILE_URL = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${USERNAME}`;

function pickCaption(node) {
  return node?.edge_media_to_caption?.edges?.[0]?.node?.text ?? "";
}

function toIsoFromTimestamp(timestamp) {
  if (!timestamp) return null;
  return new Date(timestamp * 1000).toISOString();
}

function normalizeType(typename) {
  const map = {
    GraphImage: "Photo",
    GraphSidecar: "Carousel",
    GraphVideo: "Video",
  };

  return map[typename] || "Post";
}

async function fetchProfile() {
  const response = await fetch(PROFILE_URL, {
    headers: {
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      "x-ig-app-id": "936619743392459",
      accept: "application/json",
      referer: `https://www.instagram.com/${USERNAME}/`,
    },
  });

  if (!response.ok) {
    throw new Error(`Instagram request failed with status ${response.status}`);
  }

  return response.json();
}

async function downloadImage(url, outputPath) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      referer: `https://www.instagram.com/${USERNAME}/`,
    },
  });

  if (!response.ok) {
    throw new Error(`Image download failed with status ${response.status} for ${url}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, bytes);
}

function shapeFeed(payload) {
  const user = payload?.data?.user;

  if (!user) {
    throw new Error("Instagram response did not include a public user profile.");
  }

  const edges = user?.edge_owner_to_timeline_media?.edges ?? [];

  return {
    source: "instagram_public_profile",
    username: USERNAME,
    fetched_at: new Date().toISOString(),
    profile: {
      username: user.username,
      full_name: user.full_name,
      biography: user.biography,
      external_url: user.external_url,
      profile_pic_url: user.profile_pic_url_hd || user.profile_pic_url,
      followers: user?.edge_followed_by?.count ?? 0,
      following: user?.edge_follow?.count ?? 0,
      posts_count: user?.edge_owner_to_timeline_media?.count ?? 0,
    },
    posts: edges.map(({ node }) => ({
      id: node.id,
      shortcode: node.shortcode,
      permalink: `https://www.instagram.com/p/${node.shortcode}/`,
      type: normalizeType(node.__typename),
      caption: pickCaption(node),
      taken_at: toIsoFromTimestamp(node.taken_at_timestamp),
      timestamp: node.taken_at_timestamp ?? null,
      location: node?.location?.name ?? null,
      image_url: node.display_url || node.thumbnail_src,
      thumbnail_url: node.thumbnail_src || node.display_url,
      width: node?.dimensions?.width ?? null,
      height: node?.dimensions?.height ?? null,
      likes: node?.edge_liked_by?.count ?? node?.edge_media_preview_like?.count ?? 0,
      comments: node?.edge_media_to_comment?.count ?? 0,
      alt: node.accessibility_caption || null,
    })),
  };
}

async function downloadPostMedia(feed) {
  await rm(MEDIA_DIR, { recursive: true, force: true });
  await mkdir(MEDIA_DIR, { recursive: true });

  const profileImageName = "profile.jpg";
  const profileImagePath = resolve(MEDIA_DIR, profileImageName);
  await downloadImage(feed.profile.profile_pic_url, profileImagePath);
  feed.profile.local_profile_pic = `data/media/${profileImageName}`;

  for (const [index, post] of feed.posts.entries()) {
    const baseName = `${String(index + 1).padStart(2, "0")}-${post.shortcode}.jpg`;
    const imagePath = resolve(MEDIA_DIR, baseName);

    await downloadImage(post.image_url || post.thumbnail_url, imagePath);

    post.local_image = `data/media/${baseName}`;
    post.local_thumbnail = post.local_image;
  }
}

async function main() {
  const payload = await fetchProfile();
  const feed = shapeFeed(payload);
  await downloadPostMedia(feed);

  await mkdir(resolve(process.cwd(), "data"), { recursive: true });
  await writeFile(FEED_PATH, `${JSON.stringify(feed, null, 2)}\n`, "utf8");
  await writeFile(
    FEED_JS_PATH,
    `window.__WHYSHOCK_FEED__ = ${JSON.stringify(feed, null, 2)};\n`,
    "utf8"
  );

  console.log(
    `Saved ${feed.posts.length} posts, media files, and feed bundles for @${feed.profile.username}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
