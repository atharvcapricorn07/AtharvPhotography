# Design notes

The design language is **White Wall**. Its full specification, with tokens and components, is the
skill in `.claude/skills/white-wall-design/`. Say "White Wall design" or `/white-wall-design` to load
it before changing the look of the site. Tokens live at the top of `assets/css/site.css`.

## In one paragraph

A painted gallery wall, with the interface only a label beside the print: one bold grotesque, square
edges, no shadows, and red only to mark what is chosen. The home page opens on one large photograph.
Motion answers what you do: photos grow out of their place and return to it, pages crossfade, and a
collection photo becomes the header of its Work page. The wall warms very slightly toward the photo
at the centre of the screen.

## Decisions worth remembering

| Decision | Why |
| --- | --- |
| No scroll-driven intro | Replaced at the owner's request by small moments that respond to the visitor |
| Hero on `landscape8` for phones, `landscape11` for wide screens | The owner's picks; `landscape8` crops from the right so the watermark stays whole |
| Shared-element viewer with GSAP Flip | Keeps your place, and it's the transition that explains itself |
| Swipes on a damped spring, not scroll snapping | Carries the finger's momentum and settles with about 2px of overshoot |
| Ambient wall at 3.5% or less, checked for contrast and warmth | Felt rather than seen; `--ink-3` stays at 4.6:1 or better and the wall never reads as cream |
| Work pins six favourites first | The owner's order; everything else follows newest-first. The list is `PINNED` in `gallery.js` |
| Awards leads with top-tier results | Crowd rankings sit behind "Show all results" |
| The `misc` folder shows as Moments | Labels and new links say Moments; `?subject=misc` still works, and photo files keep their names |
| View transitions, with a normal page load as the fallback | Crossfades where supported, and nothing breaks elsewhere |
| Photos in a row share one height, uncropped | Each width follows the photo's aspect ratio; uneven tops and bottoms read as a mistake, and photographers notice crops |
| Collections on Home | They give the morph into the Work header somewhere to start |
| Bars slide away on scroll down | Phones from Instagram get the whole screen for photos; they return at the end of a page and when focus lands in them |
| Hero leaves one whole headline line above the fold | A deliberate cue to scroll, rather than a line cut through its letters |
| Work ends with an invitation | After 79 photos, the most-used page had no ending; it preselects the matching shoot type |
| Plain text tab bar instead of a floating pill | The pill sat on top of the work |
| Back gesture closes the viewer | On phones, back otherwise left the gallery |
| Numbers go in sentences | A row of stat tiles read as a SaaS template |
| No scroll reveals on sections | They read as a template, and the site has enough motion that answers something |

## Quality floor

Every control is at least 44px, inputs use 16px text so iOS doesn't zoom, safe areas are respected,
motion has a reduced-motion state, the content is readable without JavaScript, pinch-zoom works in the
viewer, and the viewer works with a keyboard (arrows, Escape, `i` for details).
