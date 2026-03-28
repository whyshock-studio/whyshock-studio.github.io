# WhyShock Studio

Freelance photography portfolio built as a static site on GitHub Pages.

**Live site:** [studio.whyshock.com](https://studio.whyshock.com/)

## Sections

- **Gallery** – Uniform grid of recent Instagram posts with a lightbox viewer (card-flip animation, keyboard navigation)
- **Services** – Freelance photography offerings (portraits, events, product, pre-wedding, travel, reels)
- **Contact** – Booking and collaboration links

## Tech

- Static HTML / CSS / vanilla JS, no frameworks
- Dark theme with responsive layout (desktop, tablet, mobile)
- Liquid-glass navbar with `backdrop-filter` blur
- Lightbox with `rotateY` card-flip transition and keyboard support (Escape / Arrow keys)
- Instagram feed auto-synced via GitHub Actions (`scripts/fetch-instagram-feed.mjs`)
- Images cached locally in `data/media/` for fast loading
- SEO: Open Graph, Twitter Cards, JSON-LD, sitemap, robots.txt, web manifest

## Project Structure

```
index.html                Main single-page site
assets/
  styles.css              All styles + responsive breakpoints
  site.js                 Feed rendering, lightbox, scroll effects, loader
  og-image.png            Social sharing banner (1200×630)
data/
  instagram-feed.json     Synced feed data
  instagram-feed.js       Feed data as a JS bundle for the browser
  media/                  Downloaded post images
scripts/
  fetch-instagram-feed.mjs   Node.js script to fetch and cache Instagram data
.github/workflows/
  update-instagram-feed.yml  Scheduled GitHub Action for feed sync
sitemap.xml               Search-engine sitemap
robots.txt                Crawler directives
site.webmanifest          PWA manifest
```

## Instagram Feed Sync

A GitHub Actions workflow runs on a schedule and can also be triggered manually. It:

1. Fetches public profile data and recent posts from Instagram
2. Downloads post images to `data/media/`
3. Writes `instagram-feed.json` and `instagram-feed.js`
4. Commits and pushes if anything changed

## Contact

- **Email:** [i@whyshock.com](mailto:i@whyshock.com)
- **Instagram:** [@whyshock.studio](https://www.instagram.com/whyshock.studio/)
