// Shared behavior for every page: navigation, photo data, image helpers and the lightbox.
// Classic deferred script (no modules), exposed as window.Site.
(function () {
  "use strict";
  const Site = (window.Site = {});

  /* ---------- Navigation ---------- */
  const header = document.querySelector(".site-header");
  const menuButton = document.querySelector(".menu-button");
  if (menuButton) {
    const setOpen = (open) => {
      document.documentElement.classList.toggle("menu-open", open);
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    menuButton.addEventListener("click", () => setOpen(menuButton.getAttribute("aria-expanded") !== "true"));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
    matchMedia("(min-width: 721px)").addEventListener("change", () => setOpen(false));
  }
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
  }
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Photo data ---------- */
  const CATEGORIES = [
    { key: "cars", label: "Cars" },
    { key: "landscapes", label: "Landscapes" },
    { key: "animals", label: "Wildlife" },
    { key: "shoots", label: "Portraits" },
    { key: "misc", label: "Miscellaneous" },
  ];
  const LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.key, c.label]));
  LABEL.awards = "Award entry";

  function enrich(p, category) {
    p.category = category;
    p.ref = category + "/" + p.id;
    p.r = p.w / p.h;
    p.base = "media/" + category + "/" + p.id;
    p.alt = p.title ? p.title : LABEL[category] + " photograph";
    return p;
  }

  let request = null;
  Site.data = function () {
    if (!request) {
      request = fetch("data/photos.json")
        .then((res) => { if (!res.ok) throw new Error("photos.json " + res.status); return res.json(); })
        .then((json) => {
          const byCat = {};
          const index = {};
          Object.keys(json.categories).forEach((cat) => {
            byCat[cat] = json.categories[cat].map((p) => enrich(p, cat));
            byCat[cat].forEach((p) => (index[p.ref] = p));
          });
          const all = CATEGORIES.flatMap((c) => byCat[c.key] || []);
          return {
            byCat, all, index,
            portrait: json.portrait ? enrich(json.portrait, "site") : null,
            find: (ref) => index[ref] || null,
          };
        })
        .catch((err) => { request = null; throw err; });
    }
    return request;
  };
  Site.CATEGORIES = CATEGORIES;
  Site.LABEL = LABEL;

  /* ---------- Formatting ---------- */
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  Site.month = (iso) => { if (!iso) return ""; const [y, m] = iso.split("-"); return MONTHS[+m - 1] + " " + y; };
  Site.day = (iso) => { if (!iso) return ""; const [y, m, d] = iso.split("-"); return MONTHS[+m - 1] + " " + +d + ", " + y; };
  Site.settings = (p) => [p.focal, p.aperture, p.shutter, p.iso && "ISO " + p.iso].filter(Boolean).join(", ");
  Site.shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------- Images ---------- */
  Site.srcset = (p) => p.sizes.map((w) => p.base + "-" + w + ".webp " + Math.min(w, p.w) + "w").join(", ");
  Site.largest = (p) => p.base + "-" + p.sizes[p.sizes.length - 1] + ".webp";

  // <span class="ph"> holding a lazy, fading <img>. `sizes` is the rendered width hint.
  Site.picture = function (p, opts) {
    opts = opts || {};
    const frame = document.createElement(opts.tag || "span");
    frame.className = "ph " + (opts.className || "");
    frame.style.setProperty("--ph", p.color || "");
    const img = document.createElement("img");
    img.alt = opts.alt != null ? opts.alt : p.alt;
    img.width = p.w; img.height = p.h;
    img.decoding = "async";
    if (opts.eager) img.fetchPriority = "high"; else img.loading = "lazy";
    img.sizes = opts.sizes || "100vw";
    img.srcset = Site.srcset(p);
    img.src = p.base + "-" + p.sizes[Math.min(1, p.sizes.length - 1)] + ".webp";
    const done = () => img.classList.add("is-loaded");
    if (img.complete && img.naturalWidth) done(); else img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
    frame.appendChild(img);
    return frame;
  };

  // Fills a .justified container with tiles that open the lightbox.
  Site.justified = function (container, photos, opts) {
    opts = opts || {};
    const frag = document.createDocumentFragment();
    photos.forEach((p, i) => {
      const tile = Site.picture(p, { tag: "button", className: "tile", alt: "", sizes: "(max-width: 560px) 60vw, 33vw" });
      tile.type = "button";
      tile.style.setProperty("--r", p.r.toFixed(4));
      tile.setAttribute("aria-label", "Open " + p.alt);
      tile.addEventListener("click", () => Site.lightbox.open(photos.map(Site.toSlide), i, tile, opts.onChange));
      frag.appendChild(tile);
    });
    container.replaceChildren(frag);
  };

  /* ---------- Lightbox ---------- */
  // A slide is { photo, title, sub, exif, link }.
  Site.toSlide = (p) => ({
    photo: p,
    title: p.title || LABEL[p.category],
    sub: [LABEL[p.category], Site.month(p.date)].filter(Boolean).join(", "),
    exif: [p.camera, Site.settings(p)].filter(Boolean).join(", "),
  });

  const ICON = {
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  };

  Site.lightbox = (function () {
    let dlg, img, count, title, sub, exif, prevBtn, nextBtn;
    let slides = [], index = 0, opener = null, onChange = null;

    function build() {
      dlg = document.createElement("dialog");
      dlg.className = "lightbox";
      dlg.setAttribute("aria-label", "Photo viewer");
      dlg.innerHTML =
        '<div class="lightbox__bar"><p class="lightbox__count" aria-live="polite"></p>' +
        '<button class="lb-btn" type="button" data-close aria-label="Close">' + ICON.close + "</button></div>" +
        '<div class="lightbox__stage">' +
        '<button class="lb-btn lb-btn--nav lb-btn--prev" type="button" aria-label="Previous photo">' + ICON.prev + "</button>" +
        '<img class="lightbox__img" alt="">' +
        '<button class="lb-btn lb-btn--nav lb-btn--next" type="button" aria-label="Next photo">' + ICON.next + "</button></div>" +
        '<div class="lightbox__caption"><div><p class="lightbox__title"></p><p class="lightbox__sub"></p></div><p class="lightbox__exif"></p></div>';
      document.body.appendChild(dlg);
      img = dlg.querySelector(".lightbox__img");
      count = dlg.querySelector(".lightbox__count");
      title = dlg.querySelector(".lightbox__title");
      sub = dlg.querySelector(".lightbox__sub");
      exif = dlg.querySelector(".lightbox__exif");
      prevBtn = dlg.querySelector(".lb-btn--prev");
      nextBtn = dlg.querySelector(".lb-btn--next");

      dlg.querySelector("[data-close]").addEventListener("click", close);
      prevBtn.addEventListener("click", () => go(-1));
      nextBtn.addEventListener("click", () => go(1));
      dlg.addEventListener("close", restore);
      dlg.addEventListener("cancel", (e) => { e.preventDefault(); close(); });
      dlg.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
        if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      });
      // Click on the empty stage closes; clicks on the photo or controls don't.
      dlg.querySelector(".lightbox__stage").addEventListener("click", (e) => { if (e.target === e.currentTarget) close(); });
      img.addEventListener("load", () => img.classList.remove("is-loading"));

      let x0 = null, y0 = 0;
      dlg.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
      dlg.addEventListener("touchend", (e) => {
        if (x0 == null) return;
        const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
        x0 = null;
      });
    }

    function render() {
      const s = slides[index];
      const p = s.photo;
      img.classList.add("is-loading");
      img.sizes = "100vw";
      img.srcset = Site.srcset(p);
      img.src = Site.largest(p);
      img.alt = p.alt;
      img.width = p.w; img.height = p.h;
      title.textContent = s.title;
      sub.textContent = s.sub || "";
      exif.textContent = s.exif || "";
      const many = slides.length > 1;
      count.textContent = many ? index + 1 + " of " + slides.length : "";
      prevBtn.hidden = nextBtn.hidden = !many;
      // Warm the neighbours so arrowing through feels instant.
      [index - 1, index + 1].forEach((i) => {
        const n = slides[(i + slides.length) % slides.length];
        if (n && many) { const pre = new Image(); pre.sizes = "100vw"; pre.srcset = Site.srcset(n.photo); }
      });
      if (onChange) onChange(s, index);
    }

    function go(step) {
      if (slides.length < 2) return;
      index = (index + step + slides.length) % slides.length;
      render();
    }

    function open(list, i, from, change) {
      if (!dlg) build();
      slides = list; index = i || 0; opener = from || document.activeElement; onChange = change || null;
      render();
      document.documentElement.style.overflow = "hidden";
      dlg.showModal();
      dlg.querySelector("[data-close]").focus();
    }

    function close() { if (dlg && dlg.open) dlg.close(); }

    function restore() {
      document.documentElement.style.overflow = "";
      if (onChange) onChange(null, -1);
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    }

    return { open, close, get isOpen() { return !!(dlg && dlg.open); } };
  })();
})();
