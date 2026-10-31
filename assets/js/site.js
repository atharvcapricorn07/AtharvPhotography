// Shared behavior: chrome (top bar, tab bar), photo data, image helpers, the photo viewer.
// Classic deferred script, exposed as window.Site.
(function () {
  "use strict";
  const Site = (window.Site = {});
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Chrome ---------- */
  const topbar = document.querySelector(".topbar");
  const tabbar = document.querySelector(".tabbar");
  let lastY = scrollY;
  function onScroll() {
    const y = scrollY;
    // Over the home reel the bar stays clear until the photos scroll away.
    const threshold = document.body.classList.contains("page-home") ? innerHeight - 80 : 8;
    if (topbar) topbar.classList.toggle("is-solid", y > threshold);
    // The tab bar steps aside while you scroll down through photos and returns when you scroll up.
    if (tabbar) {
      if (y > lastY + 6 && y > 240) tabbar.classList.add("is-hidden");
      else if (y < lastY - 6 || y < 240) tabbar.classList.remove("is-hidden");
    }
    lastY = y;
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  // Tints small UI details, and the phone's browser bar, with the current photo's own color.
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  Site.tint = function (photo) {
    if (!photo) return;
    document.documentElement.style.setProperty("--tint", photo.tint || "#d8d4cc");
    if (themeMeta && photo.color) themeMeta.content = photo.color;
  };
  Site.resetTint = function () { if (themeMeta) themeMeta.content = "#000000"; };

  /* ---------- Data ---------- */
  const CATEGORIES = [
    { key: "cars", label: "Cars" },
    { key: "landscapes", label: "Landscapes" },
    { key: "animals", label: "Wildlife" },
    { key: "shoots", label: "Portraits" },
    { key: "misc", label: "Misc" },
  ];
  const LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.key, c.label]));
  LABEL.awards = "Contest result";
  Site.CATEGORIES = CATEGORIES;
  Site.LABEL = LABEL;

  function enrich(p, cat) {
    p.category = cat;
    p.ref = cat + "/" + p.id;
    p.r = p.w / p.h;
    p.base = "media/" + cat + "/" + p.id;
    p.alt = p.title || LABEL[cat] + " photograph";
    return p;
  }

  let request = null;
  Site.data = function () {
    if (!request) {
      request = fetch("data/photos.json")
        .then((r) => { if (!r.ok) throw new Error("photos.json " + r.status); return r.json(); })
        .then((json) => {
          const byCat = {}, index = {};
          Object.keys(json.categories).forEach((cat) => {
            byCat[cat] = json.categories[cat].map((p) => enrich(p, cat));
            byCat[cat].forEach((p) => (index[p.ref] = p));
          });
          return {
            byCat, index,
            all: CATEGORIES.flatMap((c) => byCat[c.key] || []),
            portrait: json.portrait ? enrich(json.portrait, "site") : null,
            find: (ref) => index[ref] || null,
          };
        })
        .catch((e) => { request = null; throw e; });
    }
    return request;
  };

  /* ---------- Formatting ---------- */
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  Site.month = (iso) => { if (!iso) return ""; const [y, m] = iso.split("-"); return MONTHS[+m - 1] + " " + y; };
  Site.day = (iso) => { if (!iso) return ""; const [y, m, d] = iso.split("-"); return MONTHS[+m - 1] + " " + +d + ", " + y; };
  Site.settings = (p) => [p.focal, p.aperture, p.shutter, p.iso && "ISO " + p.iso].filter(Boolean).join(", ");
  Site.subline = (p) => [LABEL[p.category], Site.month(p.date)].filter(Boolean).join(", ");

  /* ---------- Images ---------- */
  Site.srcset = (p) => p.sizes.map((w) => p.base + "-" + w + ".webp " + Math.min(w, p.w) + "w").join(", ");
  Site.picture = function (p, o) {
    o = o || {};
    const frame = document.createElement("span");
    frame.className = "ph" + (o.className ? " " + o.className : "");
    frame.style.setProperty("--ph", p.color || "");
    frame.style.setProperty("--ar", p.w + " / " + p.h);
    const img = document.createElement("img");
    img.alt = o.alt != null ? o.alt : p.alt;
    img.width = p.w; img.height = p.h;
    img.decoding = "async";
    if (o.eager) img.fetchPriority = "high"; else img.loading = "lazy";
    img.sizes = o.sizes || "100vw";
    img.srcset = Site.srcset(p);
    img.src = p.base + "-" + p.sizes[Math.min(1, p.sizes.length - 1)] + ".webp";
    if (o.position) img.style.objectPosition = o.position;
    const done = () => img.classList.add("is-loaded");
    if (img.complete && img.naturalWidth) done(); else img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
    frame.appendChild(img);
    return frame;
  };

  // A tappable photo that opens the viewer at `index` within `list` (a list of slides).
  Site.tappable = function (p, list, index, o) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tap";
    b.setAttribute("aria-label", "View " + p.alt);
    b.appendChild(Site.picture(p, Object.assign({ alt: "" }, o)));
    b.addEventListener("click", () => Site.viewer.open(typeof list === "function" ? list() : list, index, b));
    return b;
  };

  // EXIF lens names are terse; these read better.
  Site.LENS = {
    "RF-S18-150mm F3.5-6.3 IS STM": "Canon RF-S 18–150mm f/3.5–6.3",
    "EF70-200mm f/2.8L IS USM": "Canon EF 70–200mm f/2.8L",
    "EF50mm f/1.8 STM": "Canon EF 50mm f/1.8",
    "EF-S55-250mm f/4-5.6 IS II": "Canon EF-S 55–250mm f/4–5.6",
  };

  // Slide: { photo, title, sub, info: [[label, value], ...] }
  Site.slide = function (p, extra) {
    const info = [
      ["Camera", p.camera],
      ["Lens", p.lens && (Site.LENS[p.lens] || p.lens)],
      ["Settings", Site.settings(p)],
      ["Taken", Site.day(p.date)],
    ].filter((x) => x[1]);
    return Object.assign({ photo: p, title: p.title || LABEL[p.category], sub: Site.subline(p), info }, extra || {});
  };

  /* ---------- Viewer ---------- */
  // Swipe sideways between photos (native scroll snapping, so it follows your finger),
  // swipe down to close. Controls sit at the bottom, in reach of a thumb.
  const ICON = {
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.1"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  };
  Site.ICON = ICON;

  Site.viewer = (function () {
    let dlg, track, ambient, count, title, sub, info, infoBtn, prevBtn, nextBtn;
    let slides = [], index = 0, opener = null, onChange = null, raf = 0, infoOpen = false;

    function build() {
      dlg = document.createElement("dialog");
      dlg.className = "viewer";
      dlg.setAttribute("aria-label", "Photo viewer");
      dlg.innerHTML =
        '<div class="viewer__ambient" aria-hidden="true"></div>' +
        '<div class="viewer__track"></div>' +
        '<div class="viewer__top"><p class="viewer__count" aria-live="polite"></p>' +
        '<button class="icon-btn" type="button" data-close aria-label="Close">' + ICON.close + "</button></div>" +
        '<button class="icon-btn viewer__nav viewer__nav--prev" type="button" aria-label="Previous photo">' + ICON.prev + "</button>" +
        '<button class="icon-btn viewer__nav viewer__nav--next" type="button" aria-label="Next photo">' + ICON.next + "</button>" +
        '<div class="viewer__bottom"><div class="viewer__row"><div><p class="viewer__title"></p><p class="viewer__sub"></p></div>' +
        '<div class="viewer__btns"><button class="icon-btn" type="button" data-info aria-expanded="false" aria-label="Photo details">' + ICON.info + "</button>" +
        '<button class="icon-btn" type="button" data-close aria-label="Close">' + ICON.close + "</button></div></div>" +
        '<dl class="viewer__info" hidden></dl></div>';
      document.body.appendChild(dlg);
      track = dlg.querySelector(".viewer__track");
      ambient = dlg.querySelector(".viewer__ambient");
      count = dlg.querySelector(".viewer__count");
      title = dlg.querySelector(".viewer__title");
      sub = dlg.querySelector(".viewer__sub");
      info = dlg.querySelector(".viewer__info");
      infoBtn = dlg.querySelector("[data-info]");
      prevBtn = dlg.querySelector(".viewer__nav--prev");
      nextBtn = dlg.querySelector(".viewer__nav--next");

      dlg.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
      infoBtn.addEventListener("click", () => { infoOpen = !infoOpen; renderInfo(); });
      prevBtn.addEventListener("click", () => go(index - 1));
      nextBtn.addEventListener("click", () => go(index + 1));
      dlg.addEventListener("cancel", (e) => { e.preventDefault(); close(); });
      dlg.addEventListener("close", restore);
      dlg.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); }
        if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1); }
        if (e.key === "i") { infoOpen = !infoOpen; renderInfo(); }
      });
      track.addEventListener("scroll", () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const i = Math.round(track.scrollLeft / track.clientWidth);
          if (i !== index && slides[i]) { index = i; update(); }
        });
      }, { passive: true });
      // Tap on the empty area around a photo closes on desktop.
      track.addEventListener("click", (e) => { if (e.target.classList.contains("viewer__slide") && matchMedia("(hover: hover)").matches) close(); });

      // Swipe down to close.
      let y0 = null, x0 = 0, img = null, dy = 0;
      track.addEventListener("touchstart", (e) => {
        if (e.touches.length !== 1) { y0 = null; return; }
        y0 = e.touches[0].clientY; x0 = e.touches[0].clientX; dy = 0;
        img = track.children[index] && track.children[index].querySelector("img");
      }, { passive: true });
      track.addEventListener("touchmove", (e) => {
        if (y0 == null || !img) return;
        const ny = e.touches[0].clientY - y0, nx = e.touches[0].clientX - x0;
        if (ny > 0 && ny > Math.abs(nx) * 1.4) {
          dy = ny;
          img.style.transition = "none";
          img.style.transform = "translateY(" + dy + "px) scale(" + Math.max(0.85, 1 - dy / 1200) + ")";
          dlg.style.backgroundColor = "rgba(0,0,0," + Math.max(0.3, 1 - dy / 400) + ")";
        }
      }, { passive: true });
      track.addEventListener("touchend", () => {
        if (!img) return;
        img.style.transition = "";
        if (dy > 110) close();
        img.style.transform = "";
        dlg.style.backgroundColor = "";
        y0 = null; img = null; dy = 0;
      });
    }

    function makeSlides() {
      track.replaceChildren(...slides.map((s) => {
        const fig = document.createElement("figure");
        fig.className = "viewer__slide";
        const img = document.createElement("img");
        img.alt = s.photo.alt;
        img.width = s.photo.w; img.height = s.photo.h;
        img.addEventListener("load", () => img.classList.add("is-loaded"));
        fig.appendChild(img);
        return fig;
      }));
    }

    function load(i) {
      const s = slides[i];
      if (!s) return;
      const img = track.children[i].querySelector("img");
      if (!img.srcset) { img.sizes = "100vw"; img.srcset = Site.srcset(s.photo); img.src = s.photo.base + "-" + s.photo.sizes[s.photo.sizes.length - 1] + ".webp"; }
    }

    function renderInfo() {
      const s = slides[index];
      infoBtn.setAttribute("aria-expanded", String(infoOpen));
      infoBtn.hidden = !s.info || !s.info.length;
      info.hidden = !infoOpen || infoBtn.hidden;
      info.replaceChildren(...(s.info || []).flatMap(([k, v]) => {
        const dt = document.createElement("dt"), dd = document.createElement("dd");
        dt.textContent = k; dd.textContent = v;
        return [dt, dd];
      }));
    }

    function update() {
      const s = slides[index];
      [index, index + 1, index - 1, index + 2].forEach(load);
      title.textContent = s.title;
      sub.textContent = s.sub || "";
      count.textContent = slides.length > 1 ? index + 1 + " / " + slides.length : "";
      ambient.style.backgroundImage = "url(" + s.photo.base + "-480.webp)";
      prevBtn.hidden = nextBtn.hidden = slides.length < 2;
      prevBtn.disabled = index === 0;
      nextBtn.disabled = index === slides.length - 1;
      renderInfo();
      Site.tint(s.photo);
      if (onChange) onChange(s, index);
    }

    function go(i) {
      if (i < 0 || i >= slides.length) return;
      track.scrollTo({ left: i * track.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
    }

    function open(list, i, from, change) {
      if (!dlg) build();
      slides = list; index = i || 0; opener = from || document.activeElement; onChange = change || null;
      makeSlides();
      document.documentElement.style.overflow = "hidden";
      if (tabbar) tabbar.classList.add("is-hidden");
      dlg.showModal();
      track.scrollLeft = index * track.clientWidth;
      update();
      dlg.querySelector(".viewer__btns [data-close]").focus({ preventScroll: true });
    }
    function close() { if (dlg && dlg.open) dlg.close(); }
    function restore() {
      document.documentElement.style.overflow = "";
      if (tabbar) tabbar.classList.remove("is-hidden");
      if (onChange) onChange(null, -1);
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    }
    return { open, close };
  })();
})();
