// Work: subject chips, grid or feed view, newest first, deep links.
//   gallery.html?subject=cars           opens a subject
//   gallery.html?subject=cars#car10     also opens that photo
(function () {
  "use strict";
  const S = window.Site;
  const root = document.querySelector("[data-work]");
  const chips = document.querySelector("[data-chips]");
  const viewBtns = document.querySelectorAll("[data-view]");
  const countEl = document.querySelector("[data-count]");
  const errorState = document.querySelector("[data-error]");

  let d = null, subject = "all", list = [], slides = [];
  let view = "grid";
  try { view = localStorage.getItem("work-view") || "grid"; } catch (e) {}

  const byDate = (a, b) => (b.date || "").localeCompare(a.date || "");
  const columnsFor = () => (innerWidth >= 1200 ? 4 : innerWidth >= 760 ? 3 : 2);

  function syncUrl(photo) {
    const url = new URL(location.href);
    if (subject === "all") url.searchParams.delete("subject"); else url.searchParams.set("subject", subject);
    url.searchParams.delete("category");
    url.hash = photo ? photo.ref : "";
    history.replaceState(null, "", url.pathname + url.search + url.hash);
  }
  const onChange = (s) => syncUrl(s ? s.photo : null);

  function tile(p, i, sizes) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tap";
    b.dataset.index = i;
    b.setAttribute("aria-label", "View " + p.alt);
    b.appendChild(S.picture(p, { alt: "", sizes }));
    b.addEventListener("click", () => S.viewer.open(slides, i, b, onChange));
    return b;
  }

  function renderGrid() {
    const n = columnsFor();
    const wrap = document.createElement("div");
    wrap.className = "masonry";
    const cols = Array.from({ length: n }, () => { const c = document.createElement("div"); c.className = "masonry__col"; wrap.appendChild(c); return c; });
    const heights = new Array(n).fill(0);
    const sizes = "(max-width: 760px) 50vw, (max-width: 1200px) 33vw, 25vw";
    list.forEach((p, i) => {
      const k = heights.indexOf(Math.min(...heights)); // shortest column next, so order reads left to right
      cols[k].appendChild(tile(p, i, sizes));
      heights[k] += 1 / p.r;
    });
    root.replaceChildren(wrap);
    root.dataset.cols = n;
  }

  function renderFeed() {
    const feed = document.createElement("div");
    feed.className = "feed";
    list.forEach((p, i) => {
      const fig = document.createElement("figure");
      fig.appendChild(tile(p, i, "(max-width: 980px) 100vw, 980px"));
      const fc = document.createElement("figcaption");
      fc.innerHTML = '<span class="plate__title"></span><span class="meta"></span>';
      fc.firstChild.textContent = p.title || S.LABEL[p.category];
      fc.lastChild.textContent = [S.subline(p), S.settings(p)].filter(Boolean).join(", ");
      fig.appendChild(fc);
      feed.appendChild(fig);
    });
    root.replaceChildren(feed);
    delete root.dataset.cols;
  }

  function render() {
    viewBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === view)));
    if (view === "feed") renderFeed(); else renderGrid();
    root.setAttribute("aria-busy", "false");
  }

  function show(key, keepScroll) {
    subject = d.byCat[key] ? key : "all";
    chips.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.key === subject)));
    list = (subject === "all" ? d.all : d.byCat[subject]).slice().sort(byDate);
    slides = list.map((p) => S.slide(p));
    countEl.textContent = list.length + " photographs" + (subject === "all" ? "" : " in " + S.LABEL[subject]) + ", newest first.";
    render();
    if (!keepScroll && window.gsap && !matchMedia("(prefers-reduced-motion: reduce)").matches) gsap.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power1.out", clearProps: "opacity" });
    syncUrl(null);
    const active = chips.querySelector('[aria-pressed="true"]');
    if (active) active.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    if (!keepScroll) {
      const top = document.querySelector(".toolbar").offsetTop - S.barHeight();
      if (scrollY > top) scrollTo({ top });
    }
  }

  function buildChips() {
    const items = [{ key: "all", label: "All", n: d.all.length }].concat(S.CATEGORIES.map((c) => ({ key: c.key, label: c.label, n: (d.byCat[c.key] || []).length })));
    chips.replaceChildren(...items.map((it) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.dataset.key = it.key;
      b.innerHTML = "<b></b><span></span>";
      b.firstChild.textContent = it.label;
      b.firstChild.style.fontWeight = "inherit";
      b.lastChild.textContent = it.n;
      b.setAttribute("aria-label", it.label + ", " + it.n + " photos");
      b.addEventListener("click", () => show(it.key));
      return b;
    }));
  }

  viewBtns.forEach((b) => b.addEventListener("click", () => {
    view = b.dataset.view;
    try { localStorage.setItem("work-view", view); } catch (e) {}
    if (d) render();
  }));

  let lastCols = columnsFor();
  addEventListener("resize", () => {
    if (!d || view !== "grid") return;
    const n = columnsFor();
    if (n !== lastCols) { lastCols = n; render(); }
  });

  function init() {
    errorState.hidden = true;
    const params = new URLSearchParams(location.search);
    const hash = decodeURIComponent(location.hash.slice(1));
    S.data().then((res) => {
      d = res;
      buildChips();
      show(params.get("subject") || params.get("category") || "all", true);
      if (hash) {
        const i = list.findIndex((p) => p.ref === hash || p.id === hash);
        // The grid keeps the plain URL, so Back from a shared link lands on the work.
        if (i >= 0) { syncUrl(null); S.viewer.open(slides, i, root.querySelector('[data-index="' + i + '"]'), onChange); }
      }
    }).catch(() => { root.setAttribute("aria-busy", "false"); errorState.hidden = false; });
  }
  errorState.querySelector("button").addEventListener("click", init);
  init();
})();
