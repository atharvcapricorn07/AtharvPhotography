// Gallery: subject filters with counts, newest-first justified rows, deep links.
//   gallery.html?subject=cars          opens a filter
//   gallery.html?subject=cars#car10    also opens that photo
(function () {
  "use strict";
  const { data, justified, lightbox, toSlide, CATEGORIES } = window.Site;

  const grid = document.querySelector("[data-grid]");
  const bar = document.querySelector("[data-filters]");
  const note = document.querySelector("[data-note]");
  const errorState = document.querySelector("[data-error]");

  let d = null;
  let current = "all";
  let shown = [];

  const byDate = (a, b) => (b.date || "").localeCompare(a.date || "");

  function photosFor(key) {
    return (key === "all" ? d.all : d.byCat[key] || []).slice().sort(byDate);
  }

  function syncUrl(photo) {
    const url = new URL(location.href);
    if (current === "all") url.searchParams.delete("subject"); else url.searchParams.set("subject", current);
    url.hash = photo ? photo.category + "/" + photo.id : "";
    history.replaceState(null, "", url.pathname + url.search + url.hash);
  }

  function onChange(slide) { syncUrl(slide ? slide.photo : null); }

  function show(key) {
    current = d.byCat[key] ? key : "all";
    bar.querySelectorAll(".filter").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.key === current)));
    shown = photosFor(current);
    justified(grid, shown, { onChange });
    grid.setAttribute("aria-busy", "false");
    const label = current === "all" ? "photographs" : CATEGORIES.find((c) => c.key === current).label.toLowerCase() + " photographs";
    note.textContent = shown.length + " " + label + ", newest first. Select a photo to see it larger with its camera settings.";
    syncUrl(null);
  }

  function buildFilters() {
    const items = [{ key: "all", label: "All", n: d.all.length }].concat(
      CATEGORIES.map((c) => ({ key: c.key, label: c.label, n: (d.byCat[c.key] || []).length }))
    );
    bar.replaceChildren(...items.map((it) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "filter";
      b.dataset.key = it.key;
      b.setAttribute("aria-pressed", "false");
      b.innerHTML = '<span></span><sup aria-hidden="true"></sup>';
      b.firstChild.textContent = it.label;
      b.lastChild.textContent = it.n;
      b.setAttribute("aria-label", it.label + ", " + it.n + " photos");
      b.addEventListener("click", () => {
        show(it.key);
        const top = document.querySelector(".filters").getBoundingClientRect().top + scrollY - document.querySelector(".site-header").offsetHeight;
        if (scrollY > top) scrollTo({ top, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      });
      return b;
    }));
  }

  function openFromHash(hash) {
    const ref = decodeURIComponent(hash.slice(1));
    if (!ref) return;
    const i = shown.findIndex((p) => p.ref === ref || p.id === ref);
    if (i >= 0) lightbox.open(shown.map(toSlide), i, grid.children[i], onChange);
  }

  function init() {
    errorState.hidden = true;
    const hash = location.hash;
    const params = new URLSearchParams(location.search);
    data().then((res) => {
      d = res;
      buildFilters();
      show(params.get("subject") || params.get("category") || "all");
      openFromHash(hash);
    }).catch(() => {
      grid.setAttribute("aria-busy", "false");
      errorState.hidden = false;
    });
  }

  errorState.querySelector("button").addEventListener("click", init);
  init();
})();
