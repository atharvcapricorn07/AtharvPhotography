# White Wall: tokens

Values match `design-model.yaml` and the `:root` block of `assets/css/site.css`.

## Font

**Radio Canada Big**, variable 400 to 700. A sturdy, slightly humanist grotesque: confident when tight and heavy, plain when small. Fallback stack: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`. No mono and no second family.

## Type scale

| Token | Size | Line height | Tracking | Weight | Use |
|---|---|---|---|---|---|
| `--text-display` | clamp(2.75rem, 6vw + 1rem, 6.5rem) | 1 | -0.035em | 700 | Home statement, closing line |
| `--text-page` | clamp(2.5rem, 4vw + 1.25rem, 5rem) | 1 | -0.035em | 700 | Page titles |
| `--text-statement` | clamp(1.75rem, 2.5vw + 1rem, 3.5rem) | 1.1 | -0.02em | 400 | One sentence set large |
| `--text-title` | 1.25rem | 1.2 | -0.015em | 700 | Photo title in the intro, group names |
| `--text-body` | 1.0625rem | 1.5 | 0 | 400 | Prose, measure 62ch |
| `--text-sm` | 0.9375rem | 1.4 | 0 | 500 or 400 | Labels, nav, captions |
| `--text-caption` | 0.875rem | 1.4 | 0 | 400 | Footer, counts |

## Colour

| Token | Hex | Role |
|---|---|---|
| `--wall` | #F7F6F2 | Page ground |
| `--wall-2` | #EEEDE8 | Wells, image placeholders, footer |
| `--wall-3` | #E3E2DB | Pressed wells, disabled buttons |
| `--line` | #DDDCD5 | Hairlines between rows |
| `--ink` | #12161F | Text, primary button |
| `--ink-2` | #2F3440 | Secondary text |
| `--ink-3` | #5C616D | Meta, input lines, 5.7:1 on the wall |
| `--ink-4` | #8B8F98 | Disabled only |
| `--mark` | #C92A1D | Chosen or hovered, never a field |
| `--mark-ink` | #F7F6F2 | Text on a marked button |
| `--error` | #B42318 | Form errors |
| `--success` | #17663A | Form success |

There is no dark theme.

**Ambient wall:** on Home and Work, the page and its bars ease over 1.4s toward `--wall` mixed with the `tint` of the photo nearest the centre of the screen, at 7% or less. Each tone is checked before use, keeping `--ink-3` at 4.6:1 or better. Off under reduced motion.

## Spacing

| Token | Px | Use |
|---|---|---|
| `--space-2xs` | 4 | Label to its input |
| `--space-xs` | 8 | Tight groups |
| `--space-sm` | 12 | Caption below a photo |
| `--space-md` | 16 | Row padding |
| `--space-lg` | 24 | Between form fields |
| `--space-xl` | 40 | Page head padding |
| `--space-2xl` | 64 | Between groups |
| `--space-3xl` | 96 | Sections on phones |
| `--space-4xl` | 144 | Sections on desktop |

Gutter: 16px, 40px from 800px wide, 64px from 1200px. Tile gap: 8px, then 16px.

## Radius and elevation

Radius is 0 on everything. Elevation is flat: no shadows. A surface sits above another by a step of tone.

## Motion

| Token | Value | Use |
|---|---|---|
| `--ease-out` | cubic-bezier(0.16, 1, 0.3, 1) | All UI transitions |
| `--dur-micro` | 120ms | Press |
| `--dur-short` | 220ms | Colour, hover, captions |
| `--dur-long` | 420ms | Bars sliding, images fading in |

Authored moments:

- **Hero reveal:** clip from inset(12% 9%) to none in 2s `power3.inOut`, scale 1.1 to 1 in 2.6s `power3.out`.
- **Shared element:** GSAP Flip. Open in 0.52s `expo.out`, close in 0.38s `power3.inOut`. A cropped thumbnail's clip animates with it.
- **Swipe:** follows the finger, then a spring with stiffness 220 and damping ratio 0.82, starting at the release velocity. Past the first or last photo the drag moves at 30%.
- **Pages:** cross-document view transitions, 260ms crossfade. A collection photo morphs to the Work header in 560ms.

## Icons

Inline SVG, 24px box, 1.6px stroke, `currentColor`, no rounded caps. Close, details, previous, next, external arrow, Instagram. Nothing else needs an icon.
