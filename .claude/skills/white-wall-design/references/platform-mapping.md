# White Wall: platform mapping

The site is plain HTML, CSS and JavaScript on GitHub Pages, with no build step for pages. This is the only platform, so no other mapping is kept.

## Loading

```html
<link rel="preload" href="assets/fonts/radio-canada-big.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/site.css?v=N">
<script src="assets/vendor/gsap.min.js?v=3.13.0" defer></script>
<script src="assets/js/site.js?v=N" defer></script>
```

The home page also loads `assets/vendor/ScrollTrigger.min.js`, `intro.js` and `home.js`, and sets `fly-mode` on `<html>` from an inline script when motion is allowed, so the page height is right before first paint.

Bump `?v=N` on every link whose file changed.

## CSS custom properties

```css
:root {
  --wall: #f7f6f2; --wall-2: #eeede8; --wall-3: #e3e2db; --night: #000; --line: #dddcd5;
  --ink: #12161f; --ink-2: #2f3440; --ink-3: #5c616d; --ink-4: #8b8f98;
  --on-night: #f7f6f2; --on-night-2: #c4c3bd; --shade: rgb(0 0 0 / 0.55);
  --mark: #c92a1d; --mark-ink: var(--wall); --error: #b42318; --success: #17663a;

  --font: "Radio Canada Big", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --text-caption: 0.875rem; --text-sm: 0.9375rem; --text-body: 1.0625rem; --text-title: 1.25rem;
  --text-statement: clamp(1.75rem, 2.5vw + 1rem, 3.5rem);
  --text-page: clamp(2.5rem, 4vw + 1.25rem, 5rem);
  --text-display: clamp(2.75rem, 6vw + 1rem, 6.5rem);

  --space-2xs: 4px; --space-xs: 8px; --space-sm: 12px; --space-md: 16px; --space-lg: 24px;
  --space-xl: 40px; --space-2xl: 64px; --space-3xl: 96px; --space-4xl: 144px;
  --radius: 0;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1); --dur-micro: 120ms; --dur-short: 220ms; --dur-long: 420ms;
}
```

The stylesheet is the master copy. If this block and `assets/css/site.css` ever differ, the stylesheet wins and this file gets updated.
