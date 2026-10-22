// Home: hero crossfade, featured shelf, and subject tiles, all drawn at random from photos.json.
(function () {
  const { photos, lightbox, reveal, reducedMotion } = window.Site;

  const HERO_COUNT = 5;
  const HERO_INTERVAL = 7000;
  const FEATURED_COUNT = 6;

  function initHero(set) {
    const media = document.querySelector("[data-hero-media]");
    const pause = document.querySelector(".hero__pause");
    if (!media || !set.length) return;

    const layers = set.map((photo, i) => {
      const img = document.createElement("img");
      img.alt = photo.alt;
      img.decoding = "async";
      if (i === 0) {
        img.fetchPriority = "high";
        img.addEventListener("load", () => img.classList.add("is-active"), { once: true });
        img.src = photo.src;
      } else {
        img.setAttribute("aria-hidden", "true");
      }
      media.appendChild(img);
      return img;
    });

    if (layers.length < 2 || reducedMotion.matches) return;

    let current = 0;
    let timer = null;
    let paused = false;

    // Load the next layer ahead of time so the crossfade never shows a half-loaded photo.
    function prepare(i) {
      const img = layers[i];
      if (!img.getAttribute("src")) img.src = set[i].src;
      return img.complete && img.naturalWidth
        ? Promise.resolve()
        : new Promise((resolve, reject) => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", reject, { once: true });
          });
    }

    function advance() {
      const next = (current + 1) % layers.length;
      prepare(next).then(() => {
        if (paused) return;
        layers[current].classList.remove("is-active");
        layers[current].setAttribute("aria-hidden", "true");
        layers[next].classList.add("is-active");
        layers[next].removeAttribute("aria-hidden");
        current = next;
        prepare((next + 1) % layers.length).catch(() => {});
        schedule();
      }, schedule);
    }

    function schedule() {
      clearTimeout(timer);
      if (!paused && !document.hidden) timer = setTimeout(advance, HERO_INTERVAL);
    }

    pause.hidden = false;
    pause.addEventListener("click", () => {
      paused = !paused;
      pause.setAttribute("aria-pressed", String(paused));
      layers.forEach((img) => (img.style.animationPlayState = paused ? "paused" : ""));
      schedule();
    });
    document.addEventListener("visibilitychange", schedule);
    prepare(1).catch(() => {});
    schedule();
  }

  function initShelf(set) {
    const shelf = document.querySelector("[data-shelf]");
    const prev = document.querySelector("[data-shelf-prev]");
    const next = document.querySelector("[data-shelf-next]");
    if (!shelf) return;

    shelf.innerHTML = "";
    set.forEach((photo, i) => {
      const li = document.createElement("li");
      li.className = "shelf__item";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "photo lift";
      btn.setAttribute("aria-label", "Open " + photo.alt);
      btn.appendChild(photos.image(photo, { frame: li, onError: () => li.remove() }));
      btn.addEventListener("click", () => lightbox.open(set, i, btn));
      li.appendChild(btn);
      shelf.appendChild(li);
    });

    function update() {
      const max = shelf.scrollWidth - shelf.clientWidth - 2;
      prev.disabled = shelf.scrollLeft <= 2;
      next.disabled = shelf.scrollLeft >= max;
    }
    const by = (dir) => shelf.scrollBy({ left: dir * shelf.clientWidth * 0.8, behavior: reducedMotion.matches ? "auto" : "smooth" });
    prev.addEventListener("click", () => by(-1));
    next.addEventListener("click", () => by(1));
    shelf.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    shelf.addEventListener("load", update, true);
    update();
  }

  function initTiles(data) {
    document.querySelectorAll("[data-tile]").forEach((tile) => {
      const key = tile.dataset.tile;
      const list = photos.list(data, key);
      const count = tile.querySelector("[data-count]");
      if (count) count.textContent = list.length + (list.length === 1 ? " photo" : " photos");
      if (!list.length) return;
      const photo = list[Math.floor(Math.random() * list.length)];
      tile.querySelector("[data-frame]").appendChild(photos.image(photo));
    });
  }

  photos
    .load()
    .then((data) => {
      const pool = photos.shuffle(photos.flatten(data));
      initHero(pool.slice(0, HERO_COUNT));
      initShelf(pool.slice(HERO_COUNT, HERO_COUNT + FEATURED_COUNT));
      initTiles(data);
      reveal();
    })
    .catch((err) => {
      console.warn("Could not load photos.json:", err);
      document.querySelectorAll("[data-shelf] .skeleton").forEach((el) => el.classList.remove("skeleton"));
    });
})();
