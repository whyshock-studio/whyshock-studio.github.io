# WhyShock Studio

Freelance photography portfolio and cinematic storytelling — built as a static site hosted on GitHub Pages.

**Live site:** [whyshock-studio.github.io](https://whyshock-studio.github.io/)

## Sections

- **Portfolio** — Curated featured work with scroll-driven visuals
- **Gallery** — Grid of recent shots from the public Instagram feed
- **Services** — Freelance photography offerings (portraits, events, product, pre-wedding, travel, reels)
- **Latest Frames** — Film-strip layout of the newest synced images
- **Contact** — Booking and collaboration links

## Tech

- Static HTML / CSS / vanilla JS — no frameworks
- Dark theme with responsive layout (desktop, tablet, mobile)
- Instagram feed auto-synced via GitHub Actions (`scripts/fetch-instagram-feed.mjs`)
- Images stored locally in `data/media/` for fast loading

## Project Structure

```
index.html              Main page
assets/
  styles.css            All styles + responsive breakpoints
  site.js               Interactivity, feed rendering, scroll effects, loader
data/
  instagram-feed.json   Synced feed data
  instagram-feed.js     Feed data as a JS bundle for the browser
  media/                Downloaded post images
scripts/
  fetch-instagram-feed.mjs   Node.js script to fetch and cache Instagram data
.github/workflows/
  update-instagram-feed.yml  Scheduled GitHub Action for feed sync
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
