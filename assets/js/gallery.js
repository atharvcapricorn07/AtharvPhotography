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
  // How wide each row aims to be, in summed aspect ratios, and the most photos it may hold.
  const layoutFor = () => (innerWidth >= 1200 ? { key: 3, target: 3.4, most: 5 } : innerWidth >= 760 ? { key: 2, target: 2.4, most: 3 } : { key: 1, target: 1.35, most: 2 });

  function syncUrl(photo) {
    const url = new URL(location.href);
    if (subject === "all") url.searchParams.delete("subject"); else url.searchParams.set("subject", subject);
    url.searchParams.delete("category");
    url.hash = photo ? photo.ref : "";
    history.replaceState(null, "", url.pathname + url.search + url.hash);
  }
  const onChange = (s) => syncUrl(s ? s.photo : null);
  const tileAt = (i) => root.querySelector('.tap[data-index="' + i + '"]');

  function tile(p, i, sizes) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tap";
    b.dataset.index = i;
    b.dataset.tint = p.tint || "";
    b.setAttribute("aria-label", "View " + p.alt);
    b.appendChild(S.picture(p, { alt: "", sizes }));
    b.addEventListener("click", () => S.viewer.open(slides, i, b, onChange, tileAt));
    return b;
  }

  // Justified rows, in date order. A row's height comes from the ratios it holds, so every photo in
  // it has the same height and none is cropped. On phones a lone last photo fills the width like any
  // other single-photo row; on larger screens a short last row keeps a normal height.
  function renderGrid() {
    const { key, target, most } = layoutFor();
    const rows = [];
    let row = [], sum = 0;
    list.forEach((p, i) => {
      row.push([p, i]);
      sum += p.r;
      if (sum >= target || row.length === most) { rows.push({ row, sum }); row = []; sum = 0; }
    });
    if (row.length) rows.push({ row, sum, last: true });

    const wrap = document.createElement("div");
    wrap.className = "rows";
    rows.forEach(({ row: items, sum: total, last }) => {
      const el = document.createElement("div");
      el.className = "row";
      const width = last && key > 1 ? Math.max(total, target) : total;
      items.forEach(([p, i]) => {
        const t = tile(p, i, Math.ceil((p.r / width) * 100) + "vw");
        t.style.setProperty("--r", p.r / width); // shares that sum to 1, so flex always fills the row
        el.appendChild(t);
      });
      if (width > total) {
        const rest = document.createElement("span");
        rest.className = "row__rest";
        rest.style.setProperty("--r", (width - total) / width);
        el.appendChild(rest);
      }
      wrap.appendChild(el);
    });
    root.replaceChildren(wrap);
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
  }

  function render() {
    viewBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === view)));
    if (view === "feed") renderFeed(); else renderGrid();
    root.setAttribute("aria-busy", "false");
    S.ambient.watch(root.querySelectorAll(".tap"));
  }

  function show(key, keepScroll) {
    subject = d.byCat[key] && key !== "awards" ? key : "all";
    // The header photo for a subject; set before first paint for arrivals, in gallery.html.
    if (subject === "all") delete document.documentElement.dataset.subject; else document.documentElement.dataset.subject = subject;
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

  let lastLayout = layoutFor().key;
  addEventListener("resize", () => {
    if (!d || view !== "grid") return;
    const n = layoutFor().key;
    if (n !== lastLayout) { lastLayout = n; render(); }
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
        if (i >= 0) { syncUrl(null); S.viewer.open(slides, i, tileAt(i), onChange, tileAt); }
      }
    }).catch(() => { root.setAttribute("aria-busy", "false"); errorState.hidden = false; });
  }
  errorState.querySelector("button").addEventListener("click", init);
  init();
})();
