# Design notes

## Idea

The site is a gallery wall. A neutral grey ground (not white, not black) lets the photographs, which
are mostly dark and saturated, read like prints. The interface is one typeface and one accent color,
and it stays out of the way everywhere except one place: the name.

**Signature:** "Atharv Kale" set in Archivo at its widest cut, sized to span the page like exhibition
signage, followed by a full-width photograph that unveils from the bottom on load. That's the only
orchestrated motion on the site.

## Tokens

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--bg` | `#ededea` | `#151616` | page |
| `--surface` | `#e2e2de` | `#212223` | image placeholders (overridden by each photo's own dominant color) |
| `--ink` | `#161616` | `#ededea` | text |
| `--ink-2` | `#57595b` | `#a3a5a6` | secondary text (6.3:1 / 7.4:1) |
| `--line` | `#c9cac5` | `#36383a` | hairlines that separate list rows |
| `--accent` | `#2a44c9` | `#93a6ff` | links on hover, focus ring, active filter, top-tier award results |

Dark mode follows the system setting. The lightbox is always black.

## Type

Archivo variable, self-hosted. The width axis does the work a second typeface would:

- Display (`.display`, `.h1`): width 125%, weight 650, tight tracking.
- Section headings (`.h2`): width 112%, weight 600.
- Body and UI: width 100%, weight 400/500, 17px base, tabular numerals.

No all-caps labels, no monospace, no eyebrow text.

## Layout

- One container (`--max` 1440px, fluid gutter) on every page, left aligned.
- Photos sit in **justified rows**: each tile's flex-grow and basis are proportional to its aspect
  ratio, so rows are flush on both sides and nothing is cropped. Known width and height (from
  `photos.json`) mean no layout shift while images load.
- Lists (subjects, awards, facts) are rows divided by hairlines. Lines separate items; they are not
  decoration.

## Content decisions

- Every photo carries its real camera settings in the lightbox, read from EXIF at build time.
- The Awards page is data, not a wall of screenshots: contest, result, date and entry count, with the
  winning photo as the thumbnail when it's in the gallery and the certificate one click away.
- The About page's lens list is computed from the photos, so it stays true.

## Accessibility

Visible focus everywhere, skip link, landmarks, `aria-current` on nav, a real `<dialog>` lightbox
(Escape, arrow keys, swipe, focus returns to the opener), labelled form fields with inline errors,
alt text from titles, and `prefers-reduced-motion` turns off the hero animation and transitions.
