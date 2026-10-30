// Home: hero crossfade, featured shelf, and subject tiles, from a fixed set of horizontal photos.
(function () {
  const { photos, lightbox, reducedMotion } = window.Site;

  // Real pixel sizes, so every frame can take the photo's own ratio before it loads.
  // `position` keeps the subject in view where the full-bleed hero crops a photo.
  const PHOTOS = {
    landscape13: { src: "photos/landscapes/landscape13.jpg", width: 5328, height: 4000, position: "50% 22%", alt: "Snow-covered Mount Rainier rising at the end of a road with double yellow center lines, lined with evergreens and street lamps" },
    misc10: { src: "photos/misc/misc10.jpg", width: 4467, height: 3092, position: "40% 30%", alt: "A full moon glowing amber in a dark sky above the silhouetted tops of evergreen trees" },
    landscape11: { src: "photos/landscapes/landscape11.jpg", width: 5328, height: 4000, position: "50% 70%", alt: "Black-and-white view of the Seattle skyline, with the Space Needle standing in front of the downtown towers" },
    animal1: { src: "photos/animals/animal1.jpg", width: 6000, height: 4000, position: "50% 45%", alt: "A honeybee feeding at the center of a deep red zinnia against dark green foliage" },
    landscape12: { src: "photos/landscapes/landscape12.jpg", width: 4784, height: 3592, position: "50% 42%", alt: "Mount Rainier towering over a tree-lined lakeshore of homes, with a person paddling on the lake in the foreground" },
    misc20: { src: "photos/misc/misc20.jpg", width: 6000, height: 4000, position: "50% 50%", alt: "Sunlit blackberry leaves in green and gold standing out against deep shadow" },
    misc1: { src: "photos/misc/misc1.jpg", width: 1876, height: 1226, position: "50% 50%", alt: "A waxing gibbous moon with its craters and dark maria in sharp detail against a black sky" },
    car10: { src: "photos/cars/car10.jpg", width: 6000, height: 4000, position: "50% 50%", alt: "A black Porsche 911 parked on gravel at sunset, with an orange sky and a lakeside terrace behind it" },
    shoot4: { src: "photos/shoots/shoot_4.jpg", width: 4000, height: 5328, position: "50% 50%", alt: "Portrait of a person in a knit beanie and navy hoodie glancing back at the camera on a grey lakeside dock" },
  };

  // Hero alternates subjects and opens on Rainier. misc1 is too small to run full-bleed.
  const HERO = ["landscape13", "misc10", "landscape11", "animal1", "landscape12", "misc20"].map((k) => PHOTOS[k]);
  const SHELF = ["misc20", "landscape12", "misc10", "animal1", "landscape11", "misc1", "landscape13"].map((k) => PHOTOS[k]);
  // No horizontal portrait exists yet, so that tile shows the whole vertical photo in a 3:2 frame.
  const TILES = { cars: PHOTOS.car10, landscapes: PHOTOS.landscape12, animals: PHOTOS.animal1, shoots: PHOTOS.shoot4 };
  const TILE_FRAME = 3 / 2;

  const HERO_INTERVAL = 7000;

  function sized(img, photo) {
    img.width = photo.width;
    img.height = photo.height;
    return img;
  }

  function initHero(set) {
    const media = document.querySelector("[data-hero-media]");
    const pause = document.querySelector(".hero__pause");
    if (!media || !set.length) return;

    const layers = set.map((photo, i) => {
      const img = sized(document.createElement("img"), photo);
      img.alt = photo.alt;
      img.decoding = "async";
      img.style.objectPosition = photo.position;
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
      li.style.aspectRatio = photo.width + " / " + photo.height;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "photo lift";
      btn.setAttribute("aria-label", "Open " + photo.alt);
      btn.appendChild(sized(photos.image(photo, { onError: () => li.remove() }), photo));
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
    update();
  }

  // Horizontal photos set their tile's ratio; a vertical one sits whole in a 3:2 frame over a blurred copy.
  function initTiles() {
    document.querySelectorAll("[data-tile]").forEach((tile) => {
      const photo = TILES[tile.dataset.tile];
      if (!photo) return;
      const frame = tile.querySelector("[data-frame]");
      const horizontal = photo.width > photo.height;
      tile.parentElement.style.setProperty("--r", horizontal ? photo.width / photo.height : TILE_FRAME);
      if (!horizontal) {
        const fill = sized(photos.image({ src: photo.src, alt: "" }), photo);
        fill.classList.add("photo__fill");
        fill.setAttribute("aria-hidden", "true");
        frame.appendChild(fill);
        frame.classList.add("photo--whole");
      }
      frame.appendChild(sized(photos.image(photo), photo));
    });
  }

  function initCounts(data) {
    document.querySelectorAll("[data-tile]").forEach((tile) => {
      const count = tile.querySelector("[data-count]");
      const n = photos.list(data, tile.dataset.tile).length;
      if (count) count.textContent = n + (n === 1 ? " photo" : " photos");
    });
  }

  initHero(HERO);
  initShelf(SHELF);
  initTiles();

  photos
    .load()
    .then(initCounts)
    .catch((err) => console.warn("Could not load photos.json:", err));
})();
