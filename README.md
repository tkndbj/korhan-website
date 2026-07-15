# Taner Yolcu Aluminium Works — Scroll-Driven Site

A premium, Awwwards-grade marketing site. As you scroll, a video is played back
**frame-by-frame**, scrubbed to scroll position (an image-sequence-on-canvas
technique — not an autoplaying `<video>`). Company copy fades and slides in at
synchronized scroll points, pinned over the animation.

**Stack:** Vite + vanilla JS · GSAP + ScrollTrigger (pin / scrub) · Lenis
(smooth inertial scroll) · `<canvas>` frame renderer.

---

## Quick start

```bash
npm install
npm run dev      # open http://localhost:5173
```

Production build:

```bash
npm run build    # outputs to dist/
npm run preview  # preview the production build locally
```

> **Node version:** use Node **20.19+** or **22.12+** (Vite 7 requirement).
> It builds and runs on 20.18 with a warning, but upgrading removes it.

---

## How it works

1. **Frames** live in `public/frames/desktop` (1920px) and
   `public/frames/mobile` (1280px) as WebP sequences (`frame_0001.webp` …).
2. On load, **every frame is preloaded** behind a branded loading screen with a
   live percentage counter. Scroll is only wired up once loading completes.
3. The active set is chosen by viewport width (mobile set at ≤ 760px) so phones
   download the lighter images.
4. A `<canvas>` fixed to the viewport draws the current frame with
   **`object-fit: cover`** math and **device-pixel-ratio** scaling, so it stays
   sharp on retina and fills any aspect ratio without distortion.
5. **GSAP ScrollTrigger** maps whole-page scroll progress → frame index
   (`scrub`), while per-section triggers reveal the text (fade + staggered
   y-translate).
6. **Lenis** adds weighted inertial smoothing, driven by GSAP's ticker.
7. **`prefers-reduced-motion`** is respected: Lenis and the y-translate/scrub
   easing are disabled; text appears without motion.

---

## Replacing the video & re-extracting frames

The frame extractor auto-detects the video, probes its **real** duration and
frame rate with `ffprobe`, and picks an fps that lands the frame count in the
240–300 target window (it raises fps for short clips, samples down for long
ones). Requires **ffmpeg + ffprobe** on your PATH.

1. Drop your new video in the **project root** (any common extension:
   `.mp4 .mov .webm .mkv .avi .m4v`). Remove the old one, or pass a path
   explicitly.
2. Re-extract both sets:

   ```bash
   npm run extract-frames
   # or target a specific file:
   npm run extract-frames -- "my new video.mov"
   ```

3. The script prints the final frame count. If it differs from the current
   `280`, update **one line** in `src/config.js`:

   ```js
   frameCount: 280,   // <- set to the number the script reports
   ```

That's it — everything else (loader, canvas, scrub range) adapts automatically.

### Tuning extraction

Edit the constants at the top of `scripts/extract-frames.mjs`:

| Constant                    | Meaning                                  | Default |
| --------------------------- | ---------------------------------------- | ------- |
| `TARGET_MIN` / `TARGET_MAX` | Desired frame-count window               | 240–300 |
| `DESKTOP_WIDTH`             | Desktop set max width (px)               | 1920    |
| `MOBILE_WIDTH`              | Mobile set max width (px)                | 1280    |
| WebP `-quality`             | Compression quality (in the `extract()`) | 82      |

The mobile breakpoint (which set the site serves) is `mobileBreakpoint` in
`src/config.js`.

---

## Editing the text

All copy is plain HTML in **`index.html`** — no build step or CMS. Sections:

| Section       | Where in `index.html`          |
| ------------- | ------------------------------ |
| Hero          | `data-panel="hero"`            |
| What we do    | `data-panel="services"`        |
| Why us        | `data-panel="why"`             |
| Closing / CTA | `data-panel="contact"`         |

**Fill in the contact placeholders** in the `data-panel="contact"` block:

- Email — `hello@taneryolcu.com` (in the `mailto:` link and its label)
- Phone — `+90 000 000 00 00` (in the `tel:` link and its label)
- Workshop address — “Your address here”

Any element you add with the `data-reveal` attribute automatically joins the
staggered reveal animation for its section.

### Restyling

Colours, fonts and motion easing are CSS variables at the top of
`src/style.css` (`:root`). Palette is charcoal / aluminium silver / warm bronze
accent; fonts are **Syne** (display) + **Space Grotesk** (sans), loaded from
Google Fonts in `index.html`.

---

## Project structure

```
├─ index.html                  # markup + all copy + font links
├─ src/
│  ├─ main.js                  # engine: preload, canvas, scroll orchestration
│  ├─ config.js                # frame count / paths / breakpoint
│  └─ style.css                # design system + layout
├─ scripts/
│  └─ extract-frames.mjs       # ffprobe/ffmpeg re-extraction helper
├─ public/frames/
│  ├─ desktop/                 # 1920px WebP sequence
│  └─ mobile/                  # 1280px WebP sequence
└─ <your-video>.mp4            # source video (kept in root)
```

---

## Assumptions made

- **Source video:** `WhatsApp Video 2026-07-09 at 07.46.00.mp4` — probed as
  1920×1080, 30 fps, 28.0 s. Extracted at **10 fps → 280 frames** per set,
  which sits in the 240–300 target for smooth scrubbing.
- **Frame set is chosen once at load** by viewport width. Rotating a phone or
  resizing across the 760px breakpoint doesn't swap sets mid-session (it would
  require re-preloading); a normal page reload picks the right set. This keeps
  memory and bandwidth predictable.
- **DPR is capped at 2** for canvas backing-store size — visually sharp on
  retina without over-allocating on very high-DPR displays.
- Frames are committed under `public/` so the site is self-contained; the source
  video is git-ignored by default (see `.gitignore`) — remove that rule if you
  want it tracked.
- Contact details are placeholders — replace them before going live.
- Google Fonts load from Google's CDN. For a fully offline/self-hosted build,
  download the woff2 files and swap the `<link>` for local `@font-face` rules.
```
