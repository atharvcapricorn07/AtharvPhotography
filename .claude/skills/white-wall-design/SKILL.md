---
name: white-wall-design
description: "This skill should be used when the user explicitly says 'White Wall style', 'White Wall design', '/white-wall-design', or directly asks to use/apply the White Wall design system, or when changing the look of atharvphotography.studio. NEVER trigger automatically for generic UI or design tasks."
version: 1.0.0
allowed-tools: [Read, Write, Edit, Glob, Grep]
---

# White Wall

The design language of atharvphotography.studio. When this skill is active, every UI decision follows it. The running site is the reference: tokens live at the top of `assets/css/site.css`, and `component-library.html` beside this file renders the real components from that stylesheet.

**Fonts:** Radio Canada Big, variable 400 to 700, self-hosted at `assets/fonts/radio-canada-big.woff2`. Never load fonts or scripts from a CDN.

---

## 1. Design philosophy

A painted gallery wall, with the interface only a label beside the print. Photographs grow out of their place and return to it, and the wall warms very slightly toward whatever you are looking at. The lineage is Swiss museum graphics and Apple's product pages: one confident grotesque, flat tone, no ornament. The tension that gives it character is a loud photograph against a silent page, with a heavy headline used once per screen so the quiet reads as a choice.

Principles:

1. **The photograph is the only colour.** If a colour on screen did not come from a photo, it is red marking a choice, or an error. The ambient wall takes its tint from the photo at centre, at 7% or less.
2. **The name stays small.** "Atharv Kale" is never larger than body text outside the About page's own sentence.
3. **Every edge is square.** Radius is 0 everywhere, so a photo's edge and a button's edge belong to one system.
4. **Depth is tone, never shadow.** Wall, then a step darker. No shadow, no glass, no border around a box.
5. **A row shares one height.** Photos side by side are never cropped and never uneven: each one's width follows its aspect ratio (`flex: <ratio> 1 0`), so the row fills the width and tops and bottoms line up. Photos stacked on phones share one width inside the page gutters, with no decorative offsets.
6. **Motion answers something.** A photo moves because you tapped it, a page changes because you navigated. The hero reveal on load is the only motion nobody asked for.
7. **Never take the scroll.** No pinned sections, no scrubbed intros, no scroll-jacking. The page scrolls the moment it loads.

---

## 2. Craft rules

### Hierarchy

| Layer | Treatment | Example |
|---|---|---|
| Work | Full colour, largest thing on screen | Any photograph |
| Voice | `--text-display` or `--text-page`, 700, once per screen | "Photographs of light..." |
| Statement | `--text-statement`, 400 | The awards line |
| Label | `--text-sm`, 500, ink | Photo title, nav |
| Meta | `--text-sm` or caption, 400, `--ink-3` | "Cars, April 2026" |

Squint test: the photo first, the headline second, everything else gone.

### Type discipline

One family. Sentence case always. No tracked capitals, no eyebrow above a heading, no italic. Tracking only tightens as size grows. `text-wrap: balance` on headings, `pretty` on paragraphs, `tabular-nums` only on counts that change. Inputs stay at 16px so iOS does not zoom.

### Spacing

Tight groups, wide separation. 4 to 16px inside a group, 24 to 40px between groups, 96 to 144px between sections. On phones, text and stacked photos keep the same 16px gutter; only a page's single lead photo may run full bleed.

### Colour

Red `--mark` marks only what is chosen or hovered: a current nav word's underline, a selected filter, a hovered button. It is never a field, and never a heading.

### Motion

GSAP drives the moments: Flip for the shared-element viewer, a damped spring on the ticker for swipes, a clip for the hero reveal. Pages change with cross-document view transitions, which fall back to a normal page load. UI transitions use `--ease-out` at 120, 220 or 420ms and name their exact properties. No scroll reveals on sections, no parallax, no bounce. Every motion has a `prefers-reduced-motion` state that keeps the content.

---

## 3. Anti-patterns

- No border-radius above 0.
- No box-shadow on any element.
- No colour taken from a photo and used in the interface, apart from the ambient wall. No glows behind the viewer, and no ambient tone that takes `--ink-3` below 4.5:1.
- No floating pill navigation over photographs.
- No stat tiles or hero-metric rows; real numbers go in a sentence.
- No section fade-up on scroll.
- No card around a photograph, and no card inside a card.
- No masonry and no cropped tiles: photos in a row have equal heights and their full frames.
- No capitals with tracking, no eyebrows, no middle-dot strings, no arrow glued to link text.
- No scroll-driven intro or pinned section.
- No tap target under 44px.
- No `:hover` rule outside `@media (hover: hover)`: on touch screens it sticks after a tap.
- No `tabular-nums` on figures that never change; in this face it reads like a different typeface.
- No CSS `clipPath` tween in GSAP; use `Site.clip`, which keeps all four sides.
- No hard-coded colour or size past the token block in `assets/css/site.css`.
- No invented figures, quotes or awards; numbers come from `data/`.

---

## 4. Workflow

1. Read the tokens at the top of `assets/css/site.css`.
2. Reuse a component from `references/components.md` before writing a new one.
3. Check the squint test and the anti-patterns.
4. Test at 390x844 and 1440x900, with reduced motion on.
5. Bump the `?v=` numbers on any CSS or JS link you changed.

---

## 5. Reference files

| File | Contains |
|---|---|
| `design-model.yaml` | Source of truth for every value |
| `references/tokens.md` | Fonts, type scale, colour, spacing, radius, elevation, motion, icons |
| `references/components.md` | Buttons, links, filters, inputs, lists, navigation, viewer, states |
| `references/platform-mapping.md` | The CSS custom properties and how pages load them |
| `component-library.html` | Live components, rendered from the site's real stylesheet |
