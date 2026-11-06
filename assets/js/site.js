// Shared behavior: chrome (top bar, tab bar), photo data, image helpers, the photo viewer.
// Classic deferred script, exposed as window.Site.
(function () {
  "use strict";
  const Site = (window.Site = {});
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (window.gsap && window.Flip) gsap.registerPlugin(Flip);

  /* ---------- Chrome ---------- */
  // Bars step aside while you scroll down through photos and return when you scroll up.
  const root = document.documentElement;
  const topbar = document.querySelector(".topbar");
  let lastY = scrollY;
  function onScroll() {
    const y = scrollY;
    const atEnd = y + innerHeight > document.documentElement.scrollHeight - 80;
    if (y < 120 || atEnd) root.classList.remove("chrome-hidden");
    else if (y > lastY + 6) root.classList.add("chrome-hidden");
    else if (y < lastY - 6) root.classList.remove("chrome-hidden");
    lastY = y;
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  Site.barHeight = () => (topbar ? topbar.offsetHeight : 0);

  // Tweens inset() as four numbers. A browser reports equal sides in shorthand ("12% 9%"), and GSAP
  // would then match the wrong values, so a clip tweened from that opens on two sides only.
  Site.clip = function (el, from, to, vars) {
    const v = { top: from[0], right: from[1], bottom: from[2], left: from[3] };
    const paint = () => { el.style.clipPath = "inset(" + v.top.toFixed(3) + "% " + v.right.toFixed(3) + "% " + v.bottom.toFixed(3) + "% " + v.left.toFixed(3) + "%)"; };
    paint();
    return gsap.to(v, Object.assign({ top: to[0], right: to[1], bottom: to[2], left: to[3], onUpdate: paint }, vars));
  };

  /* ---------- Ambient colour ---------- */
  // The wall eases very slightly toward the tint of the photo nearest the centre of the screen.
  // Every tone is checked before use: the lightest text keeps its contrast, and the wall never turns cream.
  Site.ambient = (function () {
    const WALL = "#f7f7f5", LIGHTEST_TEXT = "#5c616d", STRENGTH = 0.035, MIN_CONTRAST = 4.6, MAX_WARMTH = 4;
    const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const lum = (h) => {
      const [r, g, b] = rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const mix = (a, b, t) => "#" + rgb(a).map((v, i) => Math.round(v + (rgb(b)[i] - v) * t).toString(16).padStart(2, "0")).join("");
    function tone(tint) {
      if (!/^#[0-9a-f]{6}$/i.test(tint || "")) return WALL;
      for (let t = STRENGTH; t > 0; t -= 0.005) {
        const c = mix(WALL, tint, t), [r, , b] = rgb(c);
        if (contrast(c, LIGHTEST_TEXT) >= MIN_CONTRAST && r - b <= MAX_WARMTH) return c; // warmer reads as cream
      }
      return WALL;
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    const band = new Set();
    let io = null, timer = 0, current = WALL;

    function apply(hex) {
      if (hex === current) return;
      current = hex;
      const surfaces = [document.body].concat(Array.from(document.querySelectorAll(".topbar, .tabbar, .toolbar")));
      gsap.to(surfaces, { backgroundColor: hex, duration: 1.4, ease: "power2.out", overwrite: "auto", onComplete: () => { if (meta) meta.content = hex; } });
    }
    function choose() {
      const mid = innerHeight / 2;
      let best = null, gap = Infinity;
      band.forEach((el) => {
        const r = el.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - mid);
        if (d < gap) { gap = d; best = el; }
      });
      apply(best ? tone(best.dataset.tint) : WALL);
    }
    function watch(els) {
      if (reduceMotion || !window.gsap || !("IntersectionObserver" in window)) return;
      if (io) io.disconnect();
      band.clear();
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) band.add(e.target); else band.delete(e.target); });
        clearTimeout(timer);
        timer = setTimeout(choose, band.size ? 120 : 500);
      }, { rootMargin: "-46% 0px -46% 0px" });
      Array.from(els).forEach((el) => io.observe(el));
    }
    return { watch, tone, contrast };
  })();
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Data ---------- */
  const CATEGORIES = [
    { key: "cars", label: "Cars" },
    { key: "landscapes", label: "Landscapes" },
    { key: "animals", label: "Wildlife" },
    { key: "shoots", label: "Portraits" },
    { key: "misc", label: "Moments", slug: "moments" },
  ];
  const LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.key, c.label]));
  LABEL.awards = "Contest result";
  Site.CATEGORIES = CATEGORIES;
  // The address a subject shows, and the subject an address means. Old ?subject=misc links still work.
  Site.subjectSlug = (key) => (CATEGORIES.find((c) => c.key === key) || {}).slug || key;
  Site.subjectFrom = (slug) => (CATEGORIES.find((c) => c.slug === slug) || {}).key || slug;
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
      ["Lens", p.lens && !/^iPhone/.test(p.lens) && (Site.LENS[p.lens] || p.lens)], // a phone's camera row already says it
      ["Settings", Site.settings(p)],
      ["Taken", Site.day(p.date)],
    ].filter((x) => x[1]);
    return Object.assign({ photo: p, title: p.title || LABEL[p.category], sub: Site.subline(p), info }, extra || {});
  };

  /* ---------- Viewer ---------- */
  // A print on the wall. The photo grows out of its exact place on the page and returns to it
  // (GSAP Flip). Swiping follows the finger, keeps its momentum on release and settles on a
  // slightly underdamped spring. Swipe down, Escape or the phone's back gesture closes it.
  const ICON = {
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.1"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  };
  Site.ICON = ICON;

  let lastInput = "pointer";
  addEventListener("pointerdown", () => { lastInput = "pointer"; }, true);
  addEventListener("keydown", () => { lastInput = "key"; }, true);

  Site.viewer = (function () {
    const STIFFNESS = 220, DAMPING_RATIO = 0.82, MAX_VELOCITY = 4000;
    let dlg, ground, track, count, announce, clipTween, title, sub, info, infoBtn, prevBtn, nextBtn, chrome;
    let slides = [], index = 0, startIndex = 0, opener = null, onChange = null, tileAt = null, infoOpen = false;
    let pushed = false, ownBacks = 0, closing = false, hiddenThumb = null, x = 0, stopSpring = null, g = null, zoomed = false;
    const animate = () => window.gsap && window.Flip && !reduceMotion;
    const width = () => dlg.clientWidth;
    const setX = (v) => { x = v; track.style.transform = "translate3d(" + v.toFixed(2) + "px,0,0)"; };
    const currentImg = () => track.children[index] && track.children[index].querySelector("img");

    /* Motion between photos */
    function settle(velocity) {
      if (stopSpring) stopSpring();
      const target = -index * width();
      if (!window.gsap || reduceMotion) return setX(target);
      let v = gsap.utils.clamp(-MAX_VELOCITY, MAX_VELOCITY, velocity || 0);
      const damping = 2 * DAMPING_RATIO * Math.sqrt(STIFFNESS);
      const tick = (time, delta) => {
        const dt = Math.min(delta, 32) / 2000; // two substeps per frame stay stable on slow phones
        for (let n = 0; n < 2; n++) {
          v += (-STIFFNESS * (x - target) - damping * v) * dt;
          x += v * dt;
        }
        if (Math.abs(x - target) < 0.3 && Math.abs(v) < 6) { setX(target); stopSpring(); return; }
        setX(x);
      };
      stopSpring = () => { gsap.ticker.remove(tick); stopSpring = null; };
      gsap.ticker.add(tick);
    }
    function go(i, velocity) {
      if (i >= 0 && i < slides.length && i !== index) { index = i; update(); }
      settle(velocity);
    }

    /* Gestures */
    function onDown(e) {
      if (closing || zoomed || (e.pointerType === "mouse" && e.button !== 0)) return;
      if (g) { cancelGesture(); return; } // a second finger is a pinch, not a swipe
      if (stopSpring) stopSpring();
      g = { id: e.pointerId, x0: e.clientX, y0: e.clientY, base: x, axis: null, target: e.target, samples: [], dy: 0 };
    }
    function onMove(e) {
      if (!g || e.pointerId !== g.id) return;
      const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
      if (!g.axis) {
        if (Math.hypot(dx, dy) < 8) return;
        g.axis = Math.abs(dx) > Math.abs(dy) ? "x" : dy > 0 ? "y" : "none";
        try { track.setPointerCapture(g.id); } catch (err) {}
        track.classList.add("is-dragging");
      }
      if (g.axis === "x") {
        const atEdge = (index === 0 && dx > 0) || (index === slides.length - 1 && dx < 0);
        setX(g.base + (atEdge ? dx * 0.3 : dx));
        g.samples.push([e.timeStamp, e.clientX]);
        if (g.samples.length > 6) g.samples.shift();
      } else if (g.axis === "y") {
        g.dy = dy;
        const img = currentImg();
        if (window.gsap) gsap.set(img, { y: Math.max(0, dy), scale: Math.max(0.85, 1 - Math.max(0, dy) / 1200) });
        ground.style.opacity = Math.max(0.3, 1 - Math.max(0, dy) / 400);
      }
    }
    function onUp(e) {
      if (!g || e.pointerId !== g.id) return;
      const gesture = g;
      g = null;
      track.classList.remove("is-dragging");
      if (gesture.axis === "x") {
        const moved = e.clientX - gesture.x0;
        const first = gesture.samples[0], last = gesture.samples[gesture.samples.length - 1];
        const ms = first && last ? last[0] - first[0] : 0;
        const velocity = ms > 0 ? ((last[1] - first[1]) / ms) * 1000 : 0;
        const flick = Math.abs(velocity) > 450, far = Math.abs(moved) > width() * 0.25;
        const dir = flick ? -Math.sign(velocity) : far ? -Math.sign(moved) : 0;
        const next = gesture.samples.length ? gsap.utils.clamp(0, slides.length - 1, index + dir) : index;
        // Past the first or last photo the drag was a rubber band, so it carries no momentum.
        const pastEdge = next === index && (index + dir < 0 || index + dir >= slides.length);
        go(next, pastEdge ? 0 : velocity);
      } else if (gesture.axis === "y") {
        if (gesture.dy > 110) close(); else springBack();
      } else if (!gesture.axis && matchMedia("(hover: hover)").matches) {
        // A click on the empty wall around a photo closes; a click on the photo does nothing.
        const r = currentImg().getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close();
      }
    }
    function springBack() {
      const img = currentImg();
      if (window.gsap) gsap.to(img, { y: 0, scale: 1, duration: 0.45, ease: "back.out(1.2)", clearProps: "transform" });
      ground.style.opacity = "";
    }
    function cancelGesture() {
      if (!g) return;
      const axis = g.axis;
      g = null;
      track.classList.remove("is-dragging");
      if (axis === "y") springBack(); else settle(0);
    }
    function onWheel(e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      wheelSum += e.deltaX;
      if (Date.now() > wheelLock && Math.abs(wheelSum) > 40) {
        wheelLock = Date.now() + 450;
        go(index + Math.sign(wheelSum));
        wheelSum = 0;
      }
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => { wheelSum = 0; }, 160);
    }
    let wheelSum = 0, wheelLock = 0, wheelTimer = 0;

    function build() {
      dlg = document.createElement("dialog");
      dlg.className = "viewer";
      dlg.setAttribute("aria-label", "Photo viewer");
      dlg.tabIndex = -1;
      dlg.innerHTML =
        '<p class="visually-hidden" aria-live="polite" data-announce></p>' +
        '<div class="viewer__ground" aria-hidden="true"></div>' +
        '<div class="viewer__track"></div>' +
        '<div class="viewer__top" data-chrome><p class="viewer__count"></p>' +
        '<button class="icon-btn" type="button" data-close aria-label="Close">' + ICON.close + "</button></div>" +
        '<button class="icon-btn viewer__nav viewer__nav--prev" type="button" data-chrome aria-label="Previous photo">' + ICON.prev + "</button>" +
        '<button class="icon-btn viewer__nav viewer__nav--next" type="button" data-chrome aria-label="Next photo">' + ICON.next + "</button>" +
        '<div class="viewer__bottom" data-chrome><div class="viewer__row"><div><p class="viewer__title"></p><p class="viewer__sub"></p></div>' +
        '<div class="viewer__btns"><button class="icon-btn" type="button" data-info aria-expanded="false" aria-label="Photo details">' + ICON.info + "</button>" +
        '<button class="icon-btn" type="button" data-close aria-label="Close">' + ICON.close + "</button></div></div>" +
        '<dl class="viewer__info" hidden></dl></div>';
      document.body.appendChild(dlg);
      ground = dlg.querySelector(".viewer__ground");
      track = dlg.querySelector(".viewer__track");
      count = dlg.querySelector(".viewer__count");
      announce = dlg.querySelector("[data-announce]");
      title = dlg.querySelector(".viewer__title");
      sub = dlg.querySelector(".viewer__sub");
      info = dlg.querySelector(".viewer__info");
      infoBtn = dlg.querySelector("[data-info]");
      prevBtn = dlg.querySelector(".viewer__nav--prev");
      nextBtn = dlg.querySelector(".viewer__nav--next");
      chrome = dlg.querySelectorAll("[data-chrome]");

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
      track.addEventListener("pointerdown", onDown);
      track.addEventListener("pointermove", onMove);
      track.addEventListener("pointerup", onUp);
      track.addEventListener("pointercancel", cancelGesture);
      // Touch starts captured to the element under the finger; handing that to the track bubbles a
      // lostpointercapture up from that element, which is not the gesture ending.
      track.addEventListener("lostpointercapture", (e) => { if (g && e.target === track && e.pointerId === g.id) cancelGesture(); });
      dlg.addEventListener("wheel", onWheel, { passive: false });
      addEventListener("blur", cancelGesture);
      addEventListener("resize", () => { if (dlg.open && !closing) { if (stopSpring) stopSpring(); setX(-index * width()); } });

      // Pinch-zoom stays available; while zoomed in, one finger pans instead of swiping.
      if (window.visualViewport) visualViewport.addEventListener("resize", () => {
        zoomed = visualViewport.scale > 1.01;
        track.style.touchAction = zoomed ? "auto" : "";
        if (zoomed) cancelGesture();
      });

      // The back gesture closes the viewer instead of leaving the page.
      addEventListener("popstate", () => {
        if (ownBacks > 0) { ownBacks--; return; } // our own history.back() after a close
        if (pushed) { pushed = false; if (dlg.open) close(); }
        try { history.scrollRestoration = "auto"; } catch (e) {}
      });
    }

    function makeSlides() {
      track.replaceChildren(...slides.map((s) => {
        const fig = document.createElement("figure");
        fig.className = "viewer__slide";
        const img = document.createElement("img");
        img.alt = s.photo.alt;
        img.width = s.photo.w; img.height = s.photo.h;
        img.draggable = false;
        img.style.setProperty("--r", s.photo.w / s.photo.h);
        img.addEventListener("load", () => { img.style.backgroundImage = "none"; });
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
      Array.from(track.children).forEach((f, i) => { f.inert = i !== index; });
      title.textContent = s.title;
      sub.textContent = s.sub || "";
      count.textContent = slides.length > 1 ? index + 1 + " / " + slides.length : "";
      announce.textContent = s.title + (slides.length > 1 ? ", photo " + (index + 1) + " of " + slides.length : "");
      prevBtn.hidden = nextBtn.hidden = slides.length < 2;
      prevBtn.disabled = index === 0;
      nextBtn.disabled = index === slides.length - 1;
      renderInfo();
      if (onChange) onChange(s, index);
    }

    /* The shared element */
    function thumbOf(el) {
      if (!el) return null;
      const img = el.tagName === "IMG" ? el : el.querySelector("img");
      return img && img.complete && img.naturalWidth && img.getBoundingClientRect().width ? img : null;
    }
    // Thumbnails may be cropped by object-fit: cover. This finds where the whole photo would sit,
    // so the viewer's image can be fitted over it, and the clip that shows only the visible crop.
    function uncropped(thumb) {
      const box = thumb.getBoundingClientRect();
      const ratio = thumb.naturalWidth / thumb.naturalHeight;
      const w = Math.max(box.width, box.height * ratio), h = w / ratio;
      const pos = getComputedStyle(thumb).objectPosition.split(" ").map((v) => parseFloat(v) / 100);
      const left = box.left + (box.width - w) * (isNaN(pos[0]) ? 0.5 : pos[0]);
      const top = box.top + (box.height - h) * (isNaN(pos[1]) ? 0.5 : pos[1]);
      const pct = (v) => Math.max(0, v) * 100;
      return {
        left, top, width: w, height: h,
        clip: [pct((box.top - top) / h), pct((left + w - box.right) / w), pct((top + h - box.bottom) / h), pct((box.left - left) / w)],
      };
    }
    function probeAt(rect) {
      const probe = document.createElement("div");
      probe.style.cssText = "position:fixed;visibility:hidden;pointer-events:none;left:" + rect.left + "px;top:" + rect.top + "px;width:" + rect.width + "px;height:" + rect.height + "px";
      dlg.appendChild(probe);
      return probe;
    }
    function showThumb() { if (hiddenThumb) { hiddenThumb.style.visibility = ""; hiddenThumb = null; } }
    function hideThumb(t) { showThumb(); if (t) { t.style.visibility = "hidden"; hiddenThumb = t; } }

    function open(list, i, from, change, tiles) {
      if (!dlg) build();
      if (closing || dlg.open) return;
      slides = list; index = i || 0; startIndex = index; infoOpen = false;
      opener = from || document.activeElement; onChange = change || null;
      const startTile = from;
      tileAt = tiles || ((n) => (n === startIndex ? startTile : null));
      const thumb = thumbOf(tileAt(index));
      const rect = thumb ? uncropped(thumb) : null; // measured before anything moves
      makeSlides();
      root.style.overflow = "hidden";
      root.classList.remove("chrome-hidden");
      dlg.showModal();
      setX(-index * width());
      const img = currentImg();
      if (thumb && thumb.currentSrc) img.style.backgroundImage = 'url("' + thumb.currentSrc + '")';
      // Pushed before update(), so the page's own entry keeps its plain URL.
      try { history.scrollRestoration = "manual"; history.pushState({ viewer: true }, ""); pushed = true; } catch (e) {}
      update();
      // Keyboard users land on the visible Close button. A tap focuses the dialog itself, so no
      // focus ring appears on a button nobody chose.
      const closeBtn = Array.from(dlg.querySelectorAll("[data-close]")).find((b) => b.offsetParent);
      (lastInput === "key" && closeBtn ? closeBtn : dlg).focus({ preventScroll: true });

      if (!animate()) return;
      gsap.killTweensOf([img, ground].concat(Array.from(chrome)));
      gsap.fromTo(ground, { opacity: 0 }, { opacity: 1, duration: 0.32, ease: "power1.out" });
      gsap.fromTo(chrome, { opacity: 0 }, { opacity: 1, duration: 0.3, delay: 0.14, ease: "power1.out", clearProps: "opacity" });
      if (rect) {
        hideThumb(thumb);
        const rest = Flip.getState(img);
        const probe = probeAt(rect);
        Flip.fit(img, probe, { scale: true });
        probe.remove();
        if (clipTween) clipTween.kill();
        clipTween = Site.clip(img, rect.clip, [0, 0, 0, 0], { duration: 0.42, ease: "power3.out", onComplete: () => { img.style.clipPath = ""; } });
        Flip.to(rest, { targets: img, scale: true, duration: 0.52, ease: "expo.out", onComplete: () => gsap.set(img, { clearProps: "transform" }) });
      } else {
        gsap.from(img, { opacity: 0, scale: 0.98, duration: 0.3, ease: "power2.out", clearProps: "opacity,transform" });
      }
    }

    // The tile for the photo now showing, brought on screen behind the viewer if it has moved off.
    function returnTile() {
      const tile = tileAt ? tileAt(index) : null;
      if (!tile) return null;
      const box = tile.getBoundingClientRect();
      if (box.bottom < 0 || box.top > innerHeight) tile.scrollIntoView({ block: "center" });
      opener = tile;
      return thumbOf(tile);
    }

    function close() {
      if (!dlg || !dlg.open || closing) return;
      cancelGestureQuietly();
      if (stopSpring) stopSpring();
      if (!animate()) { const tile = tileAt && tileAt(index); if (tile) { opener = tile; tile.scrollIntoView({ block: "nearest" }); } dlg.close(); return; }
      closing = true;
      setX(-index * width());
      const img = currentImg();
      const thumb = returnTile();
      const done = () => {
        closing = false;
        if (clipTween) clipTween.kill();
        img.style.clipPath = "";
        gsap.set([img, ground], { clearProps: "all" });
        gsap.set(chrome, { clearProps: "opacity" });
        img.style.setProperty("--r", slides[index].photo.w / slides[index].photo.h);
        dlg.close();
      };
      gsap.killTweensOf(img);
      gsap.to(chrome, { opacity: 0, duration: 0.12 });
      gsap.to(ground, { opacity: 0, duration: 0.3, ease: "power1.in" });
      if (thumb) {
        hideThumb(thumb);
        const rect = uncropped(thumb);
        const probe = probeAt(rect);
        if (clipTween) clipTween.kill();
        clipTween = Site.clip(img, [0, 0, 0, 0], rect.clip, { duration: 0.3, delay: 0.06, ease: "power2.in" });
        Flip.fit(img, probe, { scale: true, duration: 0.38, ease: "power3.inOut", onComplete: () => { probe.remove(); done(); } });
      } else {
        gsap.to(img, { opacity: 0, duration: 0.2, ease: "power1.in", onComplete: done });
      }
    }
    function cancelGestureQuietly() { g = null; if (track) track.classList.remove("is-dragging"); }

    function restore() {
      showThumb();
      root.style.overflow = "";
      if (onChange) onChange(null, -1);
      if (pushed) { pushed = false; ownBacks++; history.back(); }
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    }
    return { open, close };
  })();
})();
