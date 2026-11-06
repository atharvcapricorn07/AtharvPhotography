# White Wall: components

Every class named here exists in `assets/css/site.css`. See them live in `component-library.html`.

## Buttons

| Variant | Class | Spec |
|---|---|---|
| Primary | `.btn` | 52px tall, ink ground, wall text, weight 500, radius 0 |
| Hover | | `--mark` ground, `--mark-ink` text |
| Active | | scale 0.98 |
| Disabled | `[disabled]` | `--wall-3` ground, `--ink-3` text, not-allowed cursor |
| Busy | `[aria-busy=true]` | Progress cursor, label changes to the action in progress |

One filled button per screen. A second action is a text link.

## Text link

`.tlink`: 44px minimum, weight 500, 1px underline that turns `--mark` on hover. Used beside a button and for small actions in rows.

## Photographs

- `.plate`: a hung photo with its caption, title in weight 500 and the meta line `.plate__sub`. Width and offset vary by page (`.wall__a`, `.wall__b`, `.wall__c`).
- `.hero`: one large photo at the top of Home, opening the viewer on tap.
- `.col`: a collection tile linking to its Work subject. Its photo morphs into `.work-cover`, the header image Work shows for a subject.
- `.tap` holding `.ph`: a tile that opens the viewer. Hover dims to 88% opacity, the photo never scales. Placeholder is `--wall-2`.

## Filters

`.chip` in `.chips`: text, 44px tall, `--ink-3`. Selected is ink with a 2px `--mark` underline on the word; the count stays muted and tabular. The row scrolls sideways on phones and sits in the sticky `.toolbar`. The view toggle is two 44px icon buttons, the pressed one in ink.

## Inputs

`.field`: label above in 500, control with no box, one 1px `--ink-3` line beneath, 16px text, 48px minimum. Hover and focus darken the line; keyboard focus adds a 2px ring. Errors turn the line `--error` with a message below that names the fix. Status messages are `.form-status` on a `--wall-2` well.

## Lists

`.award` and `.fact`: rows parted by 1px `--line` hairlines. No boxes.

## Navigation

- `.topbar`: wordmark at small size, links on desktop, Instagram icon on phones. Wall ground.
- `.tabbar`: four equal text links at the bottom of phones, with the safe area included.
- The current page gets a 2px `--mark` underline. Both bars slide away on scroll down and return on scroll up.

## Viewer

Native `<dialog>` on the wall. Photos are centred and sized from their ratio, so nothing shifts when they load. Count at top, title and meta at bottom, details and close by the thumb on phones; close at top right and arrows at the sides on desktop.

The photo grows from its exact place on the page and returns to the tile of whichever photo is showing. Pass `tileAt(i)` to `Site.viewer.open` so it can find that tile.

Input: swipe or drag sideways, horizontal trackpad scroll, swipe down, arrows, Escape, `i` for details, and the back gesture closes it. Pinch-zoom stays available. Focus returns to the tile.

## States

- Loading: `--wall-2` placeholders at the photo's exact ratio, images fade in.
- Error: `.state`, a heading naming what failed, the fix, and a Try again button.
- Focus: 2px ink ring, offset 2px, appearing instantly.
