// Gallery: shuffled archive (awards excluded), subject filters, batches of 12, masonry, lightbox.
(function () {
  const { photos, lightbox, reveal } = window.Site;

  const BATCH = 12;
  const CATEGORIES = ["all", "cars", "landscapes", "animals", "shoots", "misc"];
  const ALIASES = { fauna: "animals", portraits: "shoots" };
  const DEFAULT_RATIO = 3 / 2;
  const GAP = 16;

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
  let entries = []; // { el, ratio, col }
  let columns = 0;
  let frame = 0;

  function columnCount() {
    const w = grid.clientWidth;
    return w < 560 ? 1 : w < 1024 ? 2 : w < 1600 ? 3 : 4;
  }

  // Items stay in DOM order (the shuffled order, which is also tab and lightbox order) and are
  // absolutely positioned. Each item keeps the column it was first given, so loading photos
  // only pushes items down their own column instead of reshuffling the layout.
  function assign(list) {
    const units = new Array(columns).fill(0);
    entries.forEach((e) => {
      if (e.col !== undefined && list.indexOf(e) === -1) units[e.col] += 1 / e.ratio + 0.05;
    });
    list.forEach((e) => {
      let target = 0;
      for (let i = 1; i < columns; i++) if (units[i] < units[target] - 0.01) target = i;
      e.col = target;
      units[target] += 1 / e.ratio + 0.05;
    });
  }

  function layout() {
    frame = 0;
    const width = grid.clientWidth;
    const colWidth = (width - GAP * (columns - 1)) / columns;
    const tops = new Array(columns).fill(0);
    entries.forEach((e) => {
      e.el.style.width = colWidth + "px";
      e.el.style.left = e.col * (colWidth + GAP) + "px";
      e.el.style.top = tops[e.col] + "px";
      tops[e.col] += colWidth / e.ratio + GAP;
    });
    grid.style.height = entries.length ? Math.max.apply(null, tops) - GAP + "px" : "";
  }

  function scheduleLayout() {
    if (!frame) frame = requestAnimationFrame(layout);
  }

  function showSkeleton() {
    grid.classList.add("is-loading");
    grid.style.height = "";
    grid.innerHTML = "";
    for (let i = 0; i < 6; i++) {
      const s = document.createElement("div");
      s.className = "skeleton";
      grid.appendChild(s);
    }
  }

  function makeEntry(photo, index) {
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
          scheduleLayout();
        },
        onError: () => {
          btn.remove();
          entries = entries.filter((e) => e !== entry);
          scheduleLayout();
        },
      })
    );
    btn.addEventListener("click", () => lightbox.open(current, index, btn));
    return entry;
  }

  function showMore(focusFirst) {
    const batch = current.slice(shown, shown + BATCH).map((photo, i) => makeEntry(photo, shown + i));
    batch.forEach((e) => {
      entries.push(e);
      grid.appendChild(e.el);
    });
    assign(batch);
    layout();
    shown += batch.length;
    reveal(grid);

    footer.hidden = current.length === 0;
    loadMore.hidden = shown >= current.length;
    progress.textContent = "Showing " + shown + " of " + current.length + " photos";
    if (focusFirst && batch[0]) batch[0].el.focus();
  }

  function setCategory(next, opts) {
    category = next;
    current = next === "all" ? all : all.filter((p) => p.category === next);
    shown = 0;
    entries = [];
    grid.classList.remove("is-loading");
    grid.innerHTML = "";
    columns = columnCount();

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
        grid.classList.remove("is-loading");
        grid.innerHTML = "";
        grid.setAttribute("aria-busy", "false");
        errorState.hidden = false;
      });
  }

  buttons.forEach((b) =>
    b.addEventListener("click", () => {
      if (b.dataset.category !== category) setCategory(b.dataset.category);
    })
  );
  loadMore.addEventListener("click", () => showMore(true));
  document.querySelector("[data-show-all]").addEventListener("click", () => setCategory("all"));
  errorState.querySelector("[data-retry]").addEventListener("click", init);

  new ResizeObserver(() => {
    if (!entries.length) return;
    const n = columnCount();
    if (n !== columns) {
      columns = n;
      entries.forEach((e) => (e.col = undefined));
      assign(entries);
    }
    scheduleLayout();
  }).observe(grid);

  init();
})();
