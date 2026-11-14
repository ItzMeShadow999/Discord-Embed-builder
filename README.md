<p align="center">
  <img src="https://github.com/ItzMeShadow999/My-assets/blob/main/Discord-Embed-builder.png?raw=true" width="220" alt="Discord Embed builder icon">
</p>

<h1 align="center">Discord Embed builder</h1>

<p align="center"><em>Build a Discord component link embed, preview it live, and copy the finished HTML in one click.</em></p>

<p align="center">
  <img src="https://img.shields.io/badge/LANGUAGE-JAVASCRIPT-1b1b1f?style=for-the-badge&labelColor=1b1b1f&color=f0db4f" alt="Language: JavaScript">
  <img src="https://img.shields.io/badge/RUNTIME-BROWSER-1b1b1f?style=for-the-badge&labelColor=1b1b1f&color=8cc4ea" alt="Runtime: Browser">
  <img src="https://img.shields.io/badge/TYPE-STATIC%20SITE-1b1b1f?style=for-the-badge&labelColor=1b1b1f&color=8cc4ea" alt="Type: Static site">
  <img src="https://img.shields.io/badge/DISCORD-COMPONENTS%20V2-1b1b1f?style=for-the-badge&labelColor=1b1b1f&color=5865F2" alt="Discord: Components V2">
</p>

---

## What it does

Discord Embed builder is a single-page tool for putting together a Discord **component link embed** (the card-style link preview Discord renders for v2 components) without hand-writing JSON or HTML.

Fill in text, images and buttons on the left, watch the preview update live on the right, then copy or download the finished `index.html` and host it anywhere.

## Features

- **Text**: title, description, optional extra text under a divider, and an optional side thumbnail
- **Images**: up to 4 images, placed where you choose
- **Buttons & emojis**: up to 5 link buttons, each with an optional custom emoji (paste the `<:name:id>` straight from Discord and it's split for you automatically)
- **Colors & fallback**: accent and theme color pickers, plus an `og:image` fallback for clients that don't render component embeds
- **Live preview**: a Discord-style preview pane, with a toggle to check how the fallback embed looks
- **Size meter**: tracks the embed against Discord's 3000-byte payload limit as you type
- **One-click output**: copy the generated HTML or download it directly as `index.html`

## Usage

Visit the hosted page at https://discord-embed-builder-web.pages.dev/, or clone the repo and spin up a local host.

1. Open `index.html` in a browser (or visit the hosted page)
2. Fill in the text, image and button fields on the left
3. Watch the live preview update on the right
4. Copy the generated HTML, or use **Download index.html**
5. Upload that file as `index.html` to any static host and share the page URL in Discord
   - While testing, append `?v=1`, `?v=2`, etc. to the URL to get past Discord's embed cache

## Tech stack

Plain HTML, CSS and JavaScript: no framework, no bundler, no `node_modules`. `style.css` and `script.js` are the only non-markup files, with a couple of self-hosted fonts in `fonts/`.

## Project structure

```
Discord-Embed-builder/
├── index.html   # markup + the Discord component JSON template
├── script.js    # form handling, live preview, HTML generation
├── style.css    # styling
└── fonts/       # self-hosted webfonts
```
