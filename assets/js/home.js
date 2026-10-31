// Home: the reel, collections, a paced selection of work, recognition.
(function () {
  "use strict";
  const S = window.Site;

  // Curated by hand. Phones get tall photos, wide screens get wide ones, so nothing is cropped badly.
  const REEL_TALL = ["animals/animal11", "shoots/shoot-1", "cars/car16", "landscapes/landscape8", "misc/misc26", "cars/car17"];
  const REEL_WIDE = ["cars/car10", "landscapes/landscape12", "misc/misc11", "cars/car13", "landscapes/landscape7", "landscapes/landscape6"];
  const COVERS = { cars: "cars/car4", landscapes: "landscapes/landscape12", animals: "animals/animal12", shoots: "shoots/shoot-3", misc: "misc/misc17" };
  // Selected work, laid out like spreads in a photo book.
  const BOOK = [
    { kind: "full", refs: ["landscapes/landscape13"] },
    { kind: "pair", refs: ["animals/animal17", "cars/car12"] },
    { kind: "inset", refs: ["shoots/shoot-2"] },
    { kind: "inset right", refs: ["animals/animal14"] },
    { kind: "full", refs: ["animals/animal3"] },
    { kind: "pair", refs: ["misc/misc14", "misc/misc18"] },
    { kind: "narrow", refs: ["animals/animal12"] },
    { kind: "full", refs: ["misc/misc8"] },
    { kind: "pair", refs: ["cars/car14", "shoots/shoot-4"] },
    { kind: "inset right", refs: ["landscapes/landscape14"] },
  ];

  const reel = document.querySelector("[data-reel]");
  const track = reel.querySelector(".reel__track");
  const dots = reel.querySelector(".reel__dots");
  const caption = { title: reel.querySelector(".reel__title"), sub: reel.querySelector(".reel__sub") };
  const prev = reel.querySelector("[data-prev]");
  const next = reel.querySelector("[data-next]");

  let reelPhotos = [], current = -1;

  function buildReel(d) {
    const tall = matchMedia("(max-aspect-ratio: 1/1)").matches;
    reelPhotos = (tall ? REEL_TALL : REEL_WIDE).map(d.find).filter(Boolean);
    const slides = reelPhotos.map((p) => S.slide(p));
    track.replaceChildren(...reelPhotos.map((p, i) => {
      const li = document.createElement("li");
      li.className = "reel__slide";
      li.setAttribute("aria-roledescription", "slide");
      li.setAttribute("aria-label", i + 1 + " of " + reelPhotos.length);
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "View " + p.alt);
      b.appendChild(S.picture(p, { alt: "", eager: i === 0, sizes: "100vw" }));
      b.addEventListener("click", () => S.viewer.open(slides, i, b, null));
      li.appendChild(b);
      return li;
    }));
    dots.replaceChildren(...reelPhotos.map((p, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Show photo " + (i + 1));
      b.addEventListener("click", () => goTo(i));
      return b;
    }));
    current = -1;
    track.scrollLeft = 0;
    setCurrent(0);
  }

  function setCurrent(i) {
    if (i === current || !reelPhotos[i]) return;
    current = i;
    const p = reelPhotos[i];
    caption.title.textContent = p.title || S.LABEL[p.category];
    caption.sub.textContent = S.subline(p);
    [...dots.children].forEach((b, j) => b.setAttribute("aria-current", String(j === i)));
    prev.disabled = i === 0;
    next.disabled = i === reelPhotos.length - 1;
    if (scrollY < innerHeight * 0.6) S.tint(p);
  }

  function goTo(i) {
    track.scrollTo({ left: i * track.clientWidth, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  let raf = 0;
  track.addEventListener("scroll", () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => setCurrent(Math.round(track.scrollLeft / track.clientWidth)));
  }, { passive: true });
  prev.addEventListener("click", () => goTo(current - 1));
  next.addEventListener("click", () => goTo(current + 1));
  reel.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(Math.min(current + 1, reelPhotos.length - 1)); }
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo(Math.max(current - 1, 0)); }
  });

  function buildCollections(d) {
    const shelf = document.querySelector("[data-collections]");
    shelf.replaceChildren(...S.CATEGORIES.map((c) => {
      const list = d.byCat[c.key] || [];
      const a = document.createElement("a");
      a.className = "collection";
      a.href = "gallery.html?subject=" + c.key;
      const cover = d.find(COVERS[c.key]) || list[0];
      if (cover) a.appendChild(S.picture(cover, { alt: "", sizes: "(max-width: 600px) 68vw, (max-width: 1000px) 40vw, 260px" }));
      const label = document.createElement("span");
      label.className = "collection__label";
      label.innerHTML = '<span class="collection__name"></span><span class="collection__count"></span>';
      label.firstChild.textContent = c.label;
      label.lastChild.textContent = list.length + " photos";
      a.appendChild(label);
      return a;
    }));
  }

  function caption2(p) {
    const fc = document.createElement("figcaption");
    fc.innerHTML = '<span class="plate__title"></span><span class="meta"></span>';
    fc.firstChild.textContent = p.title || S.LABEL[p.category];
    fc.lastChild.textContent = S.subline(p);
    return fc;
  }

  function buildBook(d) {
    const book = document.querySelector("[data-book]");
    const all = BOOK.flatMap((b) => b.refs).map(d.find).filter(Boolean);
    const slides = all.map((p) => S.slide(p));
    let n = 0;
    book.replaceChildren(...BOOK.map((block) => {
      const photos = block.refs.map(d.find).filter(Boolean);
      const fig = document.createElement("figure");
      fig.className = "plate " + block.kind.split(" ").map((k) => "plate--" + k).join(" ");
      fig.style.setProperty("--r", photos[0].r.toFixed(4));
      if (block.kind === "pair") {
        fig.style.setProperty("--sum", photos.reduce((t, p) => t + p.r, 0).toFixed(4));
        const pair = document.createElement("div");
        pair.className = "pair";
        photos.forEach((p) => {
          const t = S.tappable(p, slides, n++, { sizes: "(max-width: 800px) 50vw, 40vw" });
          t.style.setProperty("--r", p.r.toFixed(4));
          pair.appendChild(t);
        });
        fig.appendChild(pair);
        const fc = document.createElement("figcaption");
        fc.innerHTML = '<span class="plate__title"></span>';
        fc.firstChild.textContent = photos.map((p) => p.title).join(" and ");
        fig.appendChild(fc);
      } else {
        const p = photos[0];
        fig.appendChild(S.tappable(p, slides, n++, { sizes: block.kind === "full" ? "100vw" : "(max-width: 800px) 82vw, 60vw" }));
        fig.appendChild(caption2(p));
      }
      return fig;
    }));
  }

  function buildHonors(d) {
    fetch("data/awards.json").then((r) => r.json()).then((a) => {
      const list = document.querySelector("[data-honors]");
      const expert = a.awards.filter((x) => /Expert Choice/.test(x.result)).length;
      document.querySelector("[data-honors-summary]").textContent =
        a.awards.length + " results in international photo contests, including " + expert + " Expert Choice awards from Top Photo Awards.";
      list.replaceChildren(...a.awards.filter((x) => x.tier === "honor").slice(0, 4).map((x) => {
        const li = document.createElement("li");
        li.className = "honor";
        const p = (x.photo && d.find(x.photo)) || d.find("awards/" + x.proof);
        li.appendChild(p ? S.picture(p, { alt: "", sizes: "80px" }) : document.createElement("span"));
        const t = document.createElement("div");
        t.innerHTML = '<p class="honor__contest"></p><p class="honor__result"></p>';
        t.firstChild.textContent = x.contest;
        t.lastChild.textContent = x.result + ", " + a.organizers[x.organizer].name + (x.date ? ", " + S.month(x.date) : "");
        li.appendChild(t);
        return li;
      }));
    }).catch(() => {});
  }

  S.data().then((d) => {
    buildReel(d);
    buildCollections(d);
    buildBook(d);
    buildHonors(d);
    const teaser = document.querySelector("[data-portrait]");
    if (d.portrait) teaser.replaceChildren(S.picture(d.portrait, { alt: "Atharv Kale", sizes: "180px", position: "50% 30%" }));
    // Rotating a phone swaps between the tall and wide reel.
    matchMedia("(max-aspect-ratio: 1/1)").addEventListener("change", () => buildReel(d));
  }).catch(() => {
    reel.querySelector(".reel__caption").innerHTML = '<p class="reel__title">Photos couldn’t load.</p><p class="reel__sub">Refresh the page to try again.</p>';
  });

  // Return the browser bar to black once the reel scrolls away.
  addEventListener("scroll", () => { if (scrollY > innerHeight * 0.6) S.resetTint(); else if (reelPhotos[current]) S.tint(reelPhotos[current]); }, { passive: true });
})();
