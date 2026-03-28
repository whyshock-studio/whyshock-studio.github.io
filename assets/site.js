const galleryGrid = document.querySelector("#gallery-grid");
const latestStrip = document.querySelector("#latest-strip");
const feedStatus = document.querySelector("#feed-status");
const filmCardTemplate = document.querySelector("#film-card-template");

const portfolioSteps = document.querySelector("#portfolio-steps");
const portfolioMainImage = document.querySelector("#portfolio-main-image");
const portfolioMainKicker = document.querySelector("#portfolio-main-kicker");
const portfolioMainTitle = document.querySelector("#portfolio-main-title");
const textureImage1 = document.querySelector("#texture-image-1");
const textureImage2 = document.querySelector("#texture-image-2");
const textureImage3 = document.querySelector("#texture-image-3");

const heroBackdropImage = document.querySelector("#hero-backdrop-image");
const siteHeader = document.querySelector(".site-header");
const cameraLoader = document.querySelector("#camera-loader");
const flashWash = document.querySelector("#flash-wash");
const scrollCamera = document.querySelector("#scroll-camera");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const numberFormatter = new Intl.NumberFormat("en", { notation: "compact" });

let portfolioStepElements = [];
let currentPortfolioIndex = 0;
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

function truncate(text, length = 150) {
  if (!text) return "Open the post on Instagram to see more.";
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > length ? `${clean.slice(0, length - 3)}...` : clean;
}

function buildTitle(post) {
  if (post.location) return post.location;
  if (post.caption) return post.caption.split("\n")[0].slice(0, 72);
  return "Instagram post";
}

function imageFor(post) {
  return post.local_image || post.local_thumbnail || post.image_url || post.thumbnail_url;
}

function selectPostGroups(posts) {
  const remainingPosts = Array.isArray(posts) ? [...posts] : [];
  const take = (count) => remainingPosts.splice(0, Math.min(count, remainingPosts.length));

  return {
    hero: take(1)[0] || null,
    portfolio: take(3),
    gallery: take(3),
    latest: take(remainingPosts.length),
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

function updatePortfolioVisual(posts, index) {
  if (!posts.length) return;

  currentPortfolioIndex = index;
  const active = posts[index];
  const next = posts[(index + 1) % posts.length];
  const nextTwo = posts[(index + 2) % posts.length];

  portfolioMainImage.src = imageFor(active);
  portfolioMainImage.alt = active.alt || buildTitle(active);
  portfolioMainKicker.textContent = `${formatDate(active.taken_at)} | PUBLIC ARCHIVE | ${active.type || "PHOTO"}`;
  portfolioMainTitle.textContent = buildTitle(active);

  textureImage1.src = imageFor(active);
  textureImage2.src = imageFor(next);
  textureImage3.src = imageFor(nextTwo);

  portfolioStepElements.forEach((step, stepIndex) => {
    step.classList.toggle("is-active", stepIndex === index);
  });
}

function renderPortfolioCards(posts) {
  if (!portfolioSteps || !posts.length) return;

  portfolioSteps.innerHTML = "";

  posts.forEach((post, index) => {
    const card = document.createElement("article");
    const thumb = document.createElement("img");
    const rect = document.createElement("div");
    const title = document.createElement("h3");
    const copy = document.createElement("p");

    card.className = "portfolio-step";
    card.dataset.index = String(index);

    thumb.className = "portfolio-step-thumb";
    thumb.src = imageFor(post);
    thumb.alt = post.alt || buildTitle(post);
    thumb.loading = "lazy";

    rect.className = "portfolio-step-index";
    rect.textContent = `Shot 0${index + 1}`;

    title.textContent = buildTitle(post);
    copy.textContent = truncate(post.caption, 170);

    card.append(thumb, rect, title, copy);
    portfolioSteps.append(card);
  });

  portfolioStepElements = Array.from(portfolioSteps.querySelectorAll(".portfolio-step"));

  portfolioStepElements.forEach((step, index) => {
    step.addEventListener("mouseenter", () => updatePortfolioVisual(posts, index));
    step.addEventListener("click", () => updatePortfolioVisual(posts, index));
  });

  updatePortfolioVisual(posts, 0);

  const portfolioObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.dataset.index || 0);
          updatePortfolioVisual(posts, index);
        }
      });
    },
    { threshold: 0.6 }
  );

  portfolioStepElements.forEach((step) => portfolioObserver.observe(step));
}

function renderGalleryGrid(posts) {
  if (!galleryGrid) return;

  galleryGrid.innerHTML = "";

  posts.forEach((post, index) => {
    const link = document.createElement("a");
    const image = document.createElement("img");
    const copy = document.createElement("div");
    const meta = document.createElement("p");
    const title = document.createElement("h3");
    const caption = document.createElement("p");

    link.className = "bento-tile";
    link.href = post.permalink;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.style.setProperty("--delay", `${index * 90}ms`);

    image.className = "bento-image";
    image.src = imageFor(post);
    image.alt = post.alt || buildTitle(post);
    image.loading = "lazy";

    copy.className = "bento-copy";
    meta.className = "bento-meta";
    meta.textContent = `${formatDate(post.taken_at)} | GALLERY`;
    title.className = "bento-title";
    title.textContent = buildTitle(post);
    caption.className = "bento-caption";
    caption.textContent = truncate(post.caption, 120);

    copy.append(meta, title, caption);
    link.append(image, copy);
    galleryGrid.append(link);
  });

  const galleryObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    { threshold: 0.2 }
  );

  galleryObserver.observe(galleryGrid);
}

function renderLatestStrip(posts) {
  if (!latestStrip || !filmCardTemplate) return;

  latestStrip.innerHTML = "";

  posts.forEach((post) => {
    const fragment = filmCardTemplate.content.cloneNode(true);
    const link = fragment.querySelector(".film-link");
    const image = fragment.querySelector(".film-image");
    const meta = fragment.querySelector(".film-meta");
    const title = fragment.querySelector(".film-title");

    link.href = post.permalink;
    image.src = imageFor(post);
    image.alt = post.alt || buildTitle(post);
    meta.textContent = `PUBLIC FEED | ${formatDate(post.taken_at)}`;
    title.textContent = buildTitle(post);

    latestStrip.append(fragment);
  });

  feedStatus.textContent = `Showing ${posts.length} recent posts from the synced public feed.`;
}

function updateHeroZoom() {
  const hero = document.querySelector(".hero-shell");
  if (!hero) return;

  const rect = hero.getBoundingClientRect();
  const progress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight * 1.5)));
  const scale = 1 + progress * 0.12;
  document.documentElement.style.setProperty("--hero-scale", scale.toFixed(3));
}

function updatePortfolioParallax() {
  const portfolioVisual = document.querySelector(".portfolio-visual");
  if (portfolioVisual) {
    const rect = portfolioVisual.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight * 1.2)));
    const depth = 1 + progress * 0.08;
    document.documentElement.style.setProperty("--portfolio-depth", depth.toFixed(3));
  }

  portfolioStepElements.forEach((step, index) => {
    const rect = step.getBoundingClientRect();
    const distanceFromCenter = rect.top - window.innerHeight * 0.5;
    const offset = Math.max(-24, Math.min(24, -distanceFromCenter * 0.03));
    step.style.transform = step.classList.contains("is-active")
      ? `translateX(10px) translateY(${offset}px)`
      : `translateY(${offset}px)`;
    step.style.transition = "transform 220ms ease, border-color 220ms ease, background 220ms ease";
  });
}

function updateGalleryDepth() {
  const tiles = document.querySelectorAll(".bento-tile");

  tiles.forEach((tile) => {
    const rect = tile.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
    const lift = (0.5 - progress) * 28;
    const scale = 0.985 + progress * 0.04;
    const imageScale = 1.02 + progress * 0.06;

    tile.style.setProperty("--tile-lift", `${lift.toFixed(2)}px`);
    tile.style.setProperty("--tile-scale", scale.toFixed(3));
    tile.style.setProperty("--tile-image-scale", imageScale.toFixed(3));
  });
}

function runScrollEffects() {
  if (siteHeader) {
    siteHeader.classList.toggle("is-scrolled", window.scrollY > 28);
  }
  updateHeroZoom();
  updatePortfolioParallax();
  updateGalleryDepth();
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
  renderPortfolioCards(groups.portfolio);
  renderGalleryGrid(groups.gallery);
  renderLatestStrip(groups.latest);
  runScrollEffects();
}

async function loadFeed() {
  const bundledFeed = getBundledFeed();

  if (window.location.protocol === "file:" && bundledFeed) {
    renderExperience(bundledFeed);
    feedStatus.textContent = "Showing the bundled local feed preview.";
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
      feedStatus.textContent = "Showing the bundled backup feed.";
      return;
    }

    feedStatus.textContent =
      "The gallery feed could not be loaded right now. You can still browse the Instagram profile directly.";
  }
}

window.addEventListener("scroll", runScrollEffects, { passive: true });
window.addEventListener("resize", runScrollEffects);

initCameraLoader();
initCameraCue();
loadFeed();
