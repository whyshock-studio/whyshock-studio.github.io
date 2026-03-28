const galleryGrid = document.querySelector("#gallery-grid");
const feedStatus = document.querySelector("#feed-status");

const heroBackdropImage = document.querySelector("#hero-backdrop-image");
const siteHeader = document.querySelector(".site-header");
const cameraLoader = document.querySelector("#camera-loader");
const flashWash = document.querySelector("#flash-wash");
const scrollCamera = document.querySelector("#scroll-camera");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const numberFormatter = new Intl.NumberFormat("en", { notation: "compact" });

let cameraCueCooldownUntil = 0;
let cameraCueTimers = [];
let flashWashTimer = null;

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = value;
  }
}

function setLink(selector, value, fallback) {
  const element = document.querySelector(selector);
  if (element) {
    element.href = value || fallback;
  }
}

function formatDate(value) {
  if (!value) return "Recently";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function stripHashtags(text) {
  if (!text) return "";
  return text.replace(/#[\w.]+/g, "").replace(/\s{2,}/g, " ").trim();
}

function truncate(text, length = 150) {
  if (!text) return "Open the post on Instagram to see more.";
  const clean = stripHashtags(text).replace(/\s+/g, " ").trim();
  if (!clean) return "Open the post on Instagram to see more.";
  return clean.length > length ? `${clean.slice(0, length - 3)}...` : clean;
}

function buildTitle(post) {
  if (post.location) return post.location;
  if (post.caption) {
    const firstLine = stripHashtags(post.caption.split("\n")[0]).slice(0, 72);
    if (firstLine) return firstLine;
  }
  return "Instagram post";
}

function imageFor(post) {
  return post.local_image || post.local_thumbnail || post.image_url || post.thumbnail_url;
}

function selectPostGroups(posts) {
  const all = Array.isArray(posts) ? [...posts] : [];
  return {
    hero: all.shift() || null,
    gallery: all.slice(0, 12),
  };
}

function renderProfile(profile, fetchedAt) {
  setText("#posts-count", numberFormatter.format(profile.posts_count || 0));
  setText("#followers-count", numberFormatter.format(profile.followers || 0));
  setText("#last-updated", formatDate(fetchedAt));
  setText("#profile-heading", profile.full_name || "WhyShock Studio");
  setText("#profile-handle", `@${profile.username || "whyshock.studio"}`);
  setText("#profile-bio", profile.biography || "Photography and cinematography portfolio");

  const profileImage = document.querySelector("#profile-image");
  if (profileImage && (profile.local_profile_pic || profile.profile_pic_url)) {
    profileImage.src = profile.local_profile_pic || profile.profile_pic_url;
  }

  setLink(
    "#profile-link",
    `https://www.instagram.com/${profile.username || "whyshock.studio"}/`,
    "https://www.instagram.com/whyshock.studio/"
  );
}

function renderHero(post) {
  if (!heroBackdropImage || !post) return;
  heroBackdropImage.src = imageFor(post);
  heroBackdropImage.alt = post.alt || buildTitle(post);
}

let lightboxPosts = [];
let lightboxIndex = 0;

function openLightbox(posts, index) {
  lightboxPosts = posts;
  lightboxIndex = index;

  const overlay = document.querySelector("#lightbox-overlay");
  if (!overlay) return;

  updateLightboxContent(posts[index]);
  overlay.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  const overlay = document.querySelector("#lightbox-overlay");
  if (!overlay) return;

  overlay.classList.remove("is-open");
  document.body.style.overflow = "";
}

function navigateLightbox(direction) {
  if (!lightboxPosts.length) return;
  lightboxIndex = (lightboxIndex + direction + lightboxPosts.length) % lightboxPosts.length;
  updateLightboxContent(lightboxPosts[lightboxIndex]);
}

function updateLightboxContent(post) {
  const overlay = document.querySelector("#lightbox-overlay");
  if (!overlay) return;

  const img = overlay.querySelector(".lightbox-image");
  const meta = overlay.querySelector(".lightbox-meta");
  const title = overlay.querySelector(".lightbox-title");
  const caption = overlay.querySelector(".lightbox-caption");
  const link = overlay.querySelector(".lightbox-link");

  img.src = imageFor(post);
  img.alt = post.alt || buildTitle(post);
  meta.textContent = `${formatDate(post.taken_at)} | ${(post.type || "Photo").toUpperCase()}`;
  title.textContent = buildTitle(post);
  caption.textContent = truncate(post.caption, 240);

  if (link) {
    link.href = post.permalink;
  }
}

function renderGalleryGrid(posts) {
  if (!galleryGrid) return;

  galleryGrid.innerHTML = "";

  posts.forEach((post, index) => {
    const tile = document.createElement("div");
    const image = document.createElement("img");
    const copy = document.createElement("div");
    const meta = document.createElement("p");
    const title = document.createElement("h3");

    tile.className = "bento-tile";
    tile.style.setProperty("--delay", `${index * 60}ms`);
    tile.addEventListener("click", () => openLightbox(posts, index));

    image.className = "bento-image";
    image.src = imageFor(post);
    image.alt = post.alt || buildTitle(post);
    image.loading = "lazy";

    copy.className = "bento-copy";
    meta.className = "bento-meta";
    meta.textContent = `${formatDate(post.taken_at)} | ${(post.type || "Photo").toUpperCase()}`;
    title.className = "bento-title";
    title.textContent = buildTitle(post);

    copy.append(meta, title);
    tile.append(image, copy);
    galleryGrid.append(tile);
  });

  if (feedStatus) {
    feedStatus.textContent = `${posts.length} recent posts from @whyshock.studio`;
  }

  const galleryObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    { threshold: 0.15 }
  );

  galleryObserver.observe(galleryGrid);
}

function updateHeroZoom() {
  const hero = document.querySelector(".hero-shell");
  if (!hero) return;

  const rect = hero.getBoundingClientRect();
  const progress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight * 1.5)));
  const scale = 1 + progress * 0.12;
  document.documentElement.style.setProperty("--hero-scale", scale.toFixed(3));
}

function runScrollEffects() {
  if (siteHeader) {
    siteHeader.classList.toggle("is-scrolled", window.scrollY > 28);
  }
  updateHeroZoom();
}

function finishLoader() {
  if (!document.body || document.body.classList.contains("is-loaded")) return;

  document.body.classList.remove("is-loading");
  document.body.classList.add("is-loaded");

  if (cameraLoader) {
    window.setTimeout(() => {
      cameraLoader.setAttribute("hidden", "");
    }, 720);
  }
}

function fireFlashWash(duration = 820, originX = "50%", originY = "50%") {
  if (!flashWash || prefersReducedMotion.matches) return;

  if (flashWashTimer) {
    window.clearTimeout(flashWashTimer);
  }

  flashWash.style.setProperty("--flash-duration", `${duration}ms`);
  flashWash.style.setProperty("--flash-origin-x", originX);
  flashWash.style.setProperty("--flash-origin-y", originY);
  flashWash.classList.remove("is-firing");
  void flashWash.offsetWidth;
  flashWash.classList.add("is-firing");

  flashWashTimer = window.setTimeout(() => {
    flashWash.classList.remove("is-firing");
  }, duration);
}

function initCameraLoader() {
  if (!document.body) return;

  if (prefersReducedMotion.matches) {
    finishLoader();
    return;
  }

  let settled = false;
  const start = performance.now();

  const settle = () => {
    if (settled) return;
    settled = true;

    const elapsed = performance.now() - start;
    const remaining = Math.max(0, 1200 - elapsed);
    window.setTimeout(() => {
      fireFlashWash(1150, "50%", "50%");
      window.setTimeout(finishLoader, 170);
    }, remaining);
  };

  if (document.readyState === "complete") {
    settle();
  } else {
    window.addEventListener("load", settle, { once: true });
    window.setTimeout(settle, 1800);
  }
}

function clearCameraCueTimers() {
  cameraCueTimers.forEach((timer) => window.clearTimeout(timer));
  cameraCueTimers = [];
}

function triggerCameraCue(side = "right", message = "Hold that frame") {
  if (!scrollCamera || prefersReducedMotion.matches) return;

  const now = Date.now();
  if (now < cameraCueCooldownUntil) return;
  cameraCueCooldownUntil = now + 3200;

  clearCameraCueTimers();

  const copy = scrollCamera.querySelector(".scroll-camera-copy");
  if (copy) {
    copy.textContent = message;
  }

  scrollCamera.classList.remove("from-left", "is-active", "is-firing");
  if (side === "left") {
    scrollCamera.classList.add("from-left");
  }

  requestAnimationFrame(() => {
    scrollCamera.classList.add("is-active");
  });

  cameraCueTimers.push(
    window.setTimeout(() => {
      scrollCamera.classList.add("is-firing");
      fireFlashWash(820, side === "left" ? "8%" : "92%", "50%");
    }, 980)
  );

  cameraCueTimers.push(
    window.setTimeout(() => {
      scrollCamera.classList.remove("is-firing");
    }, 1560)
  );

  cameraCueTimers.push(
    window.setTimeout(() => {
      scrollCamera.classList.remove("is-active");
    }, 2380)
  );
}

function initCameraCue() {
  const sections = Array.from(document.querySelectorAll(".scene-section"));
  if (!sections.length || !scrollCamera || prefersReducedMotion.matches) return;

  const messages = ["Hold that frame", "Flash incoming", "One clean shot", "Stay in focus"];

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.target.dataset.cameraCueSeen === "true") return;

        const index = sections.indexOf(entry.target);
        entry.target.dataset.cameraCueSeen = "true";
        triggerCameraCue(index % 2 === 0 ? "right" : "left", messages[index % messages.length]);
      });
    },
    { threshold: 0.45 }
  );

  sections.forEach((section) => observer.observe(section));
}

function getBundledFeed() {
  if (typeof window !== "undefined" && window.__WHYSHOCK_FEED__) {
    return window.__WHYSHOCK_FEED__;
  }

  return null;
}

function renderExperience(data) {
  const posts = Array.isArray(data.posts) ? data.posts : [];
  const groups = selectPostGroups(posts);

  renderProfile(data.profile || {}, data.fetched_at);
  renderHero(groups.hero);
  renderGalleryGrid(groups.gallery);
  runScrollEffects();
}

async function loadFeed() {
  const bundledFeed = getBundledFeed();

  if (window.location.protocol === "file:" && bundledFeed) {
    renderExperience(bundledFeed);
    return;
  }

  try {
    const response = await fetch("data/instagram-feed.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Feed request failed with status ${response.status}`);
    }

    const data = await response.json();
    renderExperience(data);
  } catch (error) {
    console.error(error);

    if (bundledFeed) {
      renderExperience(bundledFeed);
      feedStatus.textContent = "Loaded from backup feed.";
      return;
    }

    feedStatus.textContent =
      "Could not load the gallery. Visit the Instagram profile to see the latest work.";
  }
}

window.addEventListener("scroll", runScrollEffects, { passive: true });
window.addEventListener("resize", runScrollEffects);

window.addEventListener("keydown", (e) => {
  const overlay = document.querySelector("#lightbox-overlay");
  if (!overlay || !overlay.classList.contains("is-open")) return;

  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowRight") navigateLightbox(1);
  if (e.key === "ArrowLeft") navigateLightbox(-1);
});

initCameraLoader();
initCameraCue();
loadFeed();
