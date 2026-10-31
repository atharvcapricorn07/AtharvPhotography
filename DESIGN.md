# Design notes

## Brief

Photos first, the photographer second. Built for phones, since most visitors arrive from Instagram on
a phone. Clean and minimal, but not generic.

## What the research said, and what we did with it

| Finding | Source | Decision |
| --- | --- | --- |
| Strong portfolios open on the work, not a title | Portfolio surveys (Framer, Format) | Home opens on a full-screen photo. The name is a small wordmark. |
| Few links belong in a sticky bar at the bottom, in thumb reach | Smashing Magazine, "The Thumb Zone" | Floating tab bar on phones: Work, Awards, About, Contact. |
| Auto-rotating carousels annoy people and cause errors | Nielsen Norman Group | The reel never moves on its own; you swipe it. |
| On phones, people expect to swipe through galleries | Baymard Institute | Viewer and reel use native scroll snapping, so photos follow your finger. |
| Close buttons in top corners are hard to reach | Smashing Magazine | Viewer controls sit at the bottom on phones; swipe down also closes. |
| Letting viewers choose density works well for photo archives | Justin Bettman's portfolio | Work page toggles between a grid and a one-at-a-time feed. |

## Look

- **Black ground.** Photos glow; OLED phones go fully dark around them.
- **The photo picks the color.** Each photo's most vivid hue is computed at build time (`tint` in
  `data/photos.json`). It colors the reel's progress marks, the viewer's ambient glow and the
  booking card, so the site changes with the work instead of having a brand color.
- **Type:** Newsreader (a reading serif with optical sizes) for titles and the intro; Geist for
  everything you tap. Both self-hosted under the SIL Open Font License.
- **Shape:** rounded photos where they act as buttons (collections, thumbnails), square edges where
  a photo is the work itself (reel, selected work, viewer).

## Structure

- **Home:** reel (tall photos on phones, wide on desktop) → one-sentence intro → collections shelf
  (swipe on phones, row of five on desktop) → selected work laid out like spreads in a photo book →
  recognition → about → booking.
- **Work:** chips for subjects, grid or feed, newest first. The grid fills shortest column first so
  it reads left to right, matching the viewer's order.
- **Viewer:** swipe between photos, swipe down to close, details panel with camera, lens, settings
  and date.

## Quality floor

Every control is at least 44px, forms use 16px text so iOS doesn't zoom, safe areas are respected on
notched phones, motion respects reduced-motion settings, and the viewer works with a keyboard
(arrows, Escape, `i` for details).
