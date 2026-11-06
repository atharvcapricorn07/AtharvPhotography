# Design notes

The design language is **White Wall**. Its full specification, with tokens and components, is the
skill in `.claude/skills/white-wall-design/`. Say "White Wall design" or `/white-wall-design` to load
it before changing the look of the site. Tokens live at the top of `assets/css/site.css`.

## In one paragraph

A gallery with the lights off, then on. Scroll flies through six favourite photos on black, landing
full screen. As the home content rises, the room lights up to an off-white wall, and from then on
the interface is only a label beside the print: one bold grotesque, square edges, no shadows, and
red only to mark what is chosen.

## Decisions worth remembering

| Decision | Why |
| --- | --- |
| Intro on black, everything else on the wall | The owner's call: photos glow in the dark, then read as prints |
| Bars slide away on scroll down | Phones from Instagram get the whole screen for photos |
| Plain text tab bar instead of a floating pill | The pill sat on top of the work |
| Viewer on the wall, with no colour glow | A glow taken from the photo competed with it |
| The viewer photo grows from its tile | Keeps your place, and it's the one transition that explains itself |
| Back gesture closes the viewer | On phones, back otherwise left the gallery |
| Numbers go in sentences | A row of stat tiles read as a SaaS template |
| No scroll reveals on sections | One authored moment lands harder than many small ones |
| `landscape8` crops from the right on phones | Keeps the watermark whole; see `.fly__card--tall` |
| `car16` replaced `car9` in the intro | `car9` is only 648px wide |

## Quality floor

Every control is at least 44px, inputs use 16px text so iOS doesn't zoom, safe areas are respected,
motion has a reduced-motion state, the content is readable without JavaScript, and the viewer works
with a keyboard (arrows, Escape, `i` for details).
