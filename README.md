# Atharv Kale Photography

Portfolio site for [atharvphotography.studio](https://atharvphotography.studio). Plain HTML, CSS and
JavaScript on GitHub Pages: no framework and no build step for the pages themselves.

## Adding or changing photos

1. Drop the original into the right folder in `photos/` (`cars`, `landscapes`, `animals`, `shoots`,
   `misc` or `awards`). Any name works; numbers sort naturally.
2. Optionally give it a title in `data/titles.json` (key is `category/id`, where the id is the file
   name in lowercase without the extension, e.g. `cars/car19`). Titles become captions and alt text.
3. Run the image build:

   ```sh
   node generate-photos.js     # or: npm run photos
   ```

   This writes resized WebP copies to `media/` (480, 960 and 1920 px wide) and regenerates
   `data/photos.json` with each photo's size, placeholder color, title and camera settings from EXIF.
   Unchanged photos are skipped.
4. Commit `photos/`, `media/` and `data/`.

The site never loads the originals, so they can stay full size.

## Awards

Edit `data/awards.json`. Each entry names its organizer, contest, result and, when known, the date,
entry count and rank. `photo` points to the winning photo in the gallery (`category/id`) and `proof`
to the certificate or screenshot in `photos/awards` (by id). Rows are grouped by organizer in the
order they appear in the file.

## Curating the home page

The photos in the intro are the `FLIGHT` list and `FINAL_TALL`/`FINAL_WIDE` at the top of
`assets/js/intro.js`. The three photos hung on the home page are plain markup in `index.html`.

## Running locally

```sh
python3 -m http.server 8000    # then open http://localhost:8000
```

A local server is needed because pages fetch `data/*.json`. After changing a CSS or JS file, bump the
`?v=` number on its link so browsers don't show the old one.

## Layout

```
index.html gallery.html awards.html about.html contact.html 404.html
assets/css/site.css     every style, with tokens at the top
assets/js/site.js       shared: bars, photo data, image helpers, photo viewer
assets/js/*.js          one script per page
assets/vendor/          GSAP and ScrollTrigger, self-hosted
assets/fonts/           Radio Canada Big (SIL Open Font License)
data/                   photos.json (generated), titles.json, awards.json
media/                  generated web images (do not edit by hand)
photos/                 originals
scripts/build-photos.mjs
.claude/skills/white-wall-design/   the design language: read before changing the look
```

The contact form posts to Formspree (`mjkoqoka`).
