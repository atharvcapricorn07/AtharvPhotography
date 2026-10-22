// Gallery: shuffled archive (awards excluded), subject filters, batches of 12, masonry, lightbox.
(function () {
  const { photos, lightbox, reveal } = window.Site;

  const BATCH = 12;
  const CATEGORIES = ["all", "cars", "landscapes", "animals", "shoots", "misc"];
  const ALIASES = { fauna: "animals", portraits: "shoots" };
  const DEFAULT_RATIO = 3 / 2;

  const grid = document.querySelector("[data-masonry]");
  const footer = document.querySelector("[data-gallery-footer]");
  const loadMore = document.querySelector("[data-load-more]");
  const progress = document.querySelector("[data-progress]");
  const emptyState = document.querySelector('[data-state="empty"]');
  const errorState = document.querySelector('[data-state="error"]');
  const buttons = Array.from(document.querySelectorAll(".segmented__btn"));

  let all = [];
  let current = [];
  let category = "all";
  let shown = 0;
  let rendered = []; // { el, ratio }
  let columns = [];
  let heights = [];

  function columnCount() {
    const w = grid.clientWidth;
    return w < 560 ? 1 : w < 1024 ? 2 : w < 1600 ? 3 : 4;
  }

  function buildColumns(n) {
    grid.innerHTML = "";
    columns = [];
    heights = [];
    for (let i = 0; i < n; i++) {
      const col = document.createElement("div");
      col.className = "masonry__col";
      grid.appendChild(col);
      columns.push(col);
      heights.push(0);
    }
  }

  // Heights are tracked in units of column width, so placement needs no layout reads.
  function place(entry) {
    let target = 0;
    for (let i = 1; i < heights.length; i++) if (heights[i] < heights[target] - 0.01) target = i;
    columns[target].appendChild(entry.el);
    heights[target] += 1 / entry.ratio + 0.05;
    entry.col = target;
    entry.placed = entry.ratio;
  }

  function relayout() {
    buildColumns(columnCount());
    rendered.forEach(place);
  }

  function showSkeleton() {
    buildColumns(columnCount());
    [1.5, 0.8, 1.33, 1, 1.5, 0.75].forEach((ratio, i) => {
      const s = document.createElement("div");
      s.className = "skeleton";
      s.style.aspectRatio = String(ratio);
      columns[i % columns.length].appendChild(s);
    });
  }

  function makeItem(photo, index) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "photo lift";
    btn.style.aspectRatio = String(DEFAULT_RATIO);
    btn.setAttribute("aria-label", "Open " + photo.alt);
    btn.setAttribute("data-reveal", "");
    const entry = { el: btn, ratio: DEFAULT_RATIO };
    btn.appendChild(
      photos.image(photo, {
        frame: btn,
        onRatio: (r) => {
          entry.ratio = r;
          if (columns[entry.col] && columns[entry.col].contains(btn)) {
            heights[entry.col] += 1 / r - 1 / entry.placed;
            entry.placed = r;
          }
        },
        onError: () => {
          btn.remove();
          rendered = rendered.filter((e) => e !== entry);
        },
      })
    );
    btn.addEventListener("click", () => lightbox.open(current, index, btn));
    return entry;
  }

  function showMore(focusFirst) {
    const batch = current.slice(shown, shown + BATCH);
    const entries = batch.map((photo, i) => makeItem(photo, shown + i));
    entries.forEach((entry) => {
      rendered.push(entry);
      place(entry);
    });
    shown += batch.length;
    reveal(grid);

    footer.hidden = current.length === 0;
    loadMore.hidden = shown >= current.length;
    progress.textContent = "Showing " + shown + " of " + current.length + " photos";
    if (focusFirst && entries[0]) entries[0].el.focus({ preventScroll: false });
  }

  function setCategory(next, opts) {
    category = next;
    current = next === "all" ? all : all.filter((p) => p.category === next);
    shown = 0;
    rendered = [];
    buildColumns(columnCount());

    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.category === next)));
    emptyState.hidden = current.length > 0;

    if (!(opts && opts.initial)) {
      const url = new URL(window.location.href);
      if (next === "all") url.searchParams.delete("category");
      else url.searchParams.set("category", next);
      history.replaceState(null, "", url);

      const top = grid.getBoundingClientRect().top + window.scrollY - 140;
      if (window.scrollY > top) window.scrollTo({ top, behavior: "auto" });
    }

    showMore(false);
  }

  function categoryFromURL() {
    const raw = (new URLSearchParams(window.location.search).get("category") || "").toLowerCase();
    const key = ALIASES[raw] || raw;
    return CATEGORIES.indexOf(key) !== -1 ? key : "all";
  }

  function init() {
    errorState.hidden = true;
    grid.setAttribute("aria-busy", "true");
    showSkeleton();
    photos
      .load()
      .then((data) => {
        all = photos.shuffle(photos.flatten(data, ["awards"]));
        grid.setAttribute("aria-busy", "false");
        setCategory(categoryFromURL(), { initial: true });
      })
      .catch((err) => {
        console.warn("Could not load photos.json:", err);
        grid.innerHTML = "";
        grid.setAttribute("aria-busy", "false");
        errorState.hidden = false;
      });
  }

  buttons.forEach((b) =>
    b.addEventListener("click", () => {
      if (b.dataset.category !== category || !all.length) setCategory(b.dataset.category);
    })
  );
  loadMore.addEventListener("click", () => showMore(true));
  document.querySelector("[data-show-all]").addEventListener("click", () => setCategory("all"));
  errorState.querySelector("[data-retry]").addEventListener("click", init);

  let lastCount = 0;
  window.addEventListener("resize", () => {
    const n = columnCount();
    if (n !== lastCount && rendered.length) relayout();
    lastCount = n;
  });

  init();
  lastCount = columnCount();
})();
