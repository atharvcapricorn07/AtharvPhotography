# Atharv Kale Photography: Design System

Static site (HTML, CSS, vanilla JS) on GitHub Pages. The photographs are the product; the interface
recedes. Every value below is a token in `assets/css/site.css`.

## 1. Audit of the previous site (HIG, applied as web principles)

| # | Finding | Severity | Guideline |
| - | --- | --- | --- |
| 1 | Home page shows no photographs at all. A portfolio's first screen is a canvas animation | High | `branding.md › Best practices`: "Ensure branding always defers to content." |
| 2 | Nav labels at 20% cream (`rgba(233,225,206,.2)` on `#13110e`, about 1.9:1) and 9 to 11 px Jost weight 100 to 200 | Critical | `accessibility.md › Vision`: "Strive to meet color contrast minimum standards." `typography.md`: "In general, avoid light font weights." |
| 3 | `html, body { overflow: hidden }` with an inner scroller: no keyboard page scroll, broken mobile URL-bar behavior | High | `layout.md`: layout follows available space |
| 4 | Lightbox: no Escape key, no focus handling, no prev/next, close is a `<span>` (not focusable), images have no alt | Critical | `accessibility.md`: "Let people use the keyboard alone to navigate and interact with your app." |
| 5 | Infinite film grain (0.3 s loop), pulsing dot, and canvas animation, with no reduced-motion handling | Critical | `motion.md`: "Make motion optional." |
| 6 | No landmarks, no h1, the same nav copy-pasted 5 times, plus a giant secondary nav that competes with content | High | `layout.md`: "Order content by relative importance." |
| 7 | Form uses placeholders as labels and has no validation messages | Medium | `entering-data.md`: "Validate fields when it makes sense." |
| 8 | Gallery crops everything to 3:2 and desaturates on hover | Medium | My judgment: it alters the photographer's work |
| 9 | Decorative structure that says nothing true: 01 to 05 numbering on nav, fake coordinates, amber rules | Medium | Skill craft lens: structure should encode information |

## 2. Color tokens

Dark is the primary theme. Light follows `prefers-color-scheme`. Grays are Apple's system gray scale.
The single accent is a warm amber, carried over from the old brand and from golden-hour light. It is
used only for links, focus rings, the active filter, and the status dot.

| Token | Dark | Light | Role, contrast |
| --- | --- | --- | --- |
| `--bg` | `#0A0A0B` | `#FFFFFF` | canvas |
| `--surface` | `#1C1C1E` (gray6) | `#F5F5F7` | inputs, segmented track, placeholders |
| `--surface-2` | `#2C2C2E` (gray5) | `#E8E8ED` | selected segment, hover |
| `--text` | `#F5F5F7` | `#1D1D1F` | 18.2:1 / 16.8:1 |
| `--text-2` | `#98989D` | `#6E6E73` | 6.9:1 / 5.1:1 (4.7:1 on surface) |
| `--separator` | `rgba(84,84,88,.6)` | `rgba(60,60,67,.18)` | hairlines (decorative) |
| `--field-border` | `#8E8E93` | `#86868B` | 5.2:1 / 3.6:1 (non-text, 3:1 required) |
| `--accent` | `#FF9F0A` (systemOrange dark) | `#C93400` (orange, accessible) | 9.6:1 / 5.3:1 |
| `--on-accent` | `#0A0A0B` | `#FFFFFF` | 9.6:1 / 5.3:1 |
| `--danger` | `#FF6961` | `#D70015` | 7.0:1 / 5.4:1 |
| `--success` | `#30D158` | `#1E7A35` | 9.8:1 / 5.4:1 |

The hero is always a dark "photo surface" (`#000`), with white text over a functional bottom scrim (not decoration).

## 3. Type

System stack: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, Inter, sans-serif`.
No web fonts. Weights 400, 500, 600, 700 only.

| Role | Size | Weight / tracking / leading |
| --- | --- | --- |
| Large title | `clamp(2.75rem, 1.6rem + 4.8vw, 5.5rem)` | 700 / -0.035em / 1.02 |
| Title | `clamp(2rem, 1.4rem + 2.4vw, 3.25rem)` | 700 / -0.025em / 1.08 |
| Headline | `clamp(1.1875rem, 1.05rem + 0.5vw, 1.5rem)` | 600 / -0.012em / 1.25 |
| Body | `clamp(1.0625rem, 1rem + 0.2vw, 1.1875rem)` (17 to 19 px) | 400 / -0.003em / 1.6 |
| Callout | `1rem` | 400 / 0 / 1.5 |
| Caption | `0.8125rem` (13 px) | 500 / 0.01em / 1.4, `--text-2` |

Body measure: `max-width: 65ch`.

## 4. Space, layout, shape

- Spacing: 8 px scale, `--s-1` 4, `--s-2` 8, `--s-3` 16, `--s-4` 24, `--s-5` 32, `--s-6` 48, `--s-7` 64, `--s-8` 96, `--s-9` 128.
- Gutter: `clamp(16px, 4vw, 48px)`. Content max: 1280 px (`--max`) on every page, so the header, gallery and footer edges align.
- Radii: photos 10 px (`--r-photo`), controls 12 px, pills 999 px. No shadows except a 1-step lift on hover.
- Nav height 52 px (`--nav-h`). Touch targets at least 44 by 44 px.

### Wireframes

```
HOME (regular)                                  HOME (compact, 390)
┌───────────────────────────────────────────┐   ┌───────────────────┐
│ Atharv Kale      Gallery About Awards ◎ ☐ │   │ Atharv Kale   ☰   │
│                                           │   │                   │
│        [ full-bleed photo, crossfade ]    │   │  [ photo ]        │
│                                           │   │                   │
│ ● Available for commissions               │   │ ● Available       │
│ Atharv Kale                               │   │ Atharv Kale       │
│ Photographer. The extraordinary...        │   │ Photographer...   │
│ [ View the Gallery ]                 ❚❚   │   │ [View Gallery] ❚❚ │
├───────────────────────────────────────────┤   ├───────────────────┤
│ Selected Work                     ‹  ›    │   │ Selected Work     │
│ [img][img ][img][img] → (scroll-snap)     │   │ [img][im→         │
│ Browse by Subject                         │   │ [Cars][Lands]     │
│ [Cars] [Landscapes] [Fauna] [Portraits]   │   │ [Fauna][Portr]    │
│ About: blurb (65ch) · More About Me →     │   │ About blurb       │
│ footer: © 2026 · Instagram · Back to Top  │   │ footer            │
└───────────────────────────────────────────┘   └───────────────────┘

GALLERY: h1 + count │ sticky segmented pill bar (scrolls horizontally on compact)
         masonry columns 1 / 2 / 3 at <560 / <1024 / ≥1024
         [ Load More ] + "Showing 12 of 77"
AWARDS:  h1 + subtitle │ uniform 4:3 grid 1 / 2 / 3 columns │ [ Show All 19 Awards ]
ABOUT:   regular: portrait (4:5, 5 of 12 cols) │ copy (65ch)   compact: stacked
CONTACT: centered 560 px column: h1, form (labels above fields), Instagram link below
```

## 5. Signature element

**The hero crossfade.** A full-bleed photograph that slowly crossfades through five random non-award
photos (7 s each, 1.2 s fade) with a slow 1.00 to 1.06 scale. It belongs here because the portfolio's
point of view *is* the photographs, and every visit opens on a different one. Everything else stays
quiet: no other autoplay, no parallax, no animated backgrounds. A pause button meets WCAG 2.2.2
(moving content over 5 s needs a pause control). With reduced motion: one static random photo.

## 6. Motion

- One curve: `--ease: cubic-bezier(0.22, 1, 0.36, 1)`. Durations `--d-1` 200 ms, `--d-2` 400 ms, `--d-3` 700 ms.
- Reveal on scroll via IntersectionObserver: opacity 0 to 1 plus a 14 px rise, 700 ms, stagger 60 ms per item, capped at 6 steps.
- Images fade in on `load` (400 ms) over a `--surface` placeholder of the right aspect ratio.
- Hover on photos: `translateY(-2px)`, nothing else.
- `prefers-reduced-motion: reduce`: no crossfade, no scale, no stagger, no rise, instant state changes.

## 7. Structure

```
assets/css/site.css   tokens → base → components (nav, buttons, segmented, photo, lightbox, form, footer) → pages
assets/js/nav.js      menu button, scroll hairline, footer year
assets/js/reveal.js   IntersectionObserver reveals, image fade-in helper
assets/js/photos.js   one shared fetch of photos.json, shuffle, URL and alt helpers
assets/js/lightbox.js shared <dialog> lightbox
assets/js/home.js · gallery.js · awards.js · contact.js   page scripts
```

Classic deferred scripts (not ES modules), so nav and layout still work over `file://`.
