// The intro: scroll flies the camera through six favourite photos in real CSS 3D. The last photo
// arrives at full screen, a line of text fades in over it, and the home page scrolls up beneath.
(function () {
  "use strict";
  const S = window.Site;
  const fly = document.querySelector("[data-fly]");
  if (!fly) return;

  // Atharv's favourites. The flight is the same everywhere; the landing photo depends on the screen:
  // tall phone screens land on a vertical photo, wide screens on the horizontal skyline.
  const FLIGHT = ["animals/animal13", "cars/car9", "landscapes/landscape14", "misc/misc22", "animals/animal17"];
  const FINAL_TALL = "landscapes/landscape8";
  const FINAL_WIDE = "landscapes/landscape11";
  let PICKS = FLIGHT.concat(FINAL_WIDE);
  const PERSPECTIVE = 1000;

  const stage = fly.querySelector(".fly__stage");
  const world = fly.querySelector("[data-world]");
  const cue = fly.querySelector("[data-cue]");
  const caption = fly.querySelector("[data-caption]");
  const skip = fly.querySelector("[data-skip]");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;

  let items = [], camEnd = 0, cam = 0, target = 0, endVal = 0, current = null, built = false;
  const mobile = () => innerWidth < 700;

  function homeTop() { return fly.offsetTop + fly.offsetHeight - stage.clientHeight; }

  function build(d) {
    PICKS = FLIGHT.concat(stage.clientWidth / stage.clientHeight < 0.9 ? FINAL_TALL : FINAL_WIDE);
    const photos = PICKS.map(d.find).filter(Boolean);
    const final = photos[photos.length - 1];
    const flight = photos.slice(0, -1);
    const m = mobile();
    const W = stage.clientWidth, H = stage.clientHeight;
    const spacing = m ? 950 : 1150;
    world.replaceChildren();
    items = [];

    // Opening words, floating just in front of the first photo.
    [
      { text: "Atharv Kale", size: m ? 52 : Math.min(124, W * 0.085), z: -120, y: -0.03, small: false },
      { text: "Photography", size: m ? 20 : 26, z: -120, y: m ? 0.06 : 0.09, small: true },
    ].forEach((w) => {
      const el = document.createElement("p");
      el.className = "fly__word" + (w.small ? " fly__word--small" : "");
      el.textContent = w.text;
      el.style.fontSize = w.size + "px";
      world.appendChild(el);
      items.push({ el, word: true, z: w.z, x: 0, y: w.y * H, rot: 0 });
    });

    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    flight.forEach((p, i) => {
      const side = i % 2 ? 1 : -1;
      const base = m ? W * 0.6 : Math.min(500, W * 0.3);
      const w = p.r >= 1 ? base * 1.3 : base, h = w / p.r;
      items.push(card(p, {
        w, h, z: -1500 - i * spacing,
        x: side * (m ? W * (0.15 + rnd() * 0.08) : W * (0.16 + rnd() * 0.08)),
        y: (rnd() - 0.5) * H * (m ? 0.3 : 0.26),
        rot: -side * (7 + rnd() * 8),
      }));
    });
    // The final photo covers the screen when its shape is close to the screen's; otherwise it spans
    // the full width so nothing important is cropped.
    const zFinal = -1500 - flight.length * spacing - 300;
    const tall = W / H < final.r * 0.55;
    const fw = W, fh = tall ? W / final.r : H;
    items.push(card(final, { w: fw, h: fh, z: zFinal, x: 0, y: tall ? -H * 0.06 : 0, rot: 0, final: true }));
    camEnd = -zFinal;
    fly.style.setProperty("--fly-len", m ? 7 : 6.5);
    built = true;
  }

  function card(p, o) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "fly__card" + (o.final ? " fly__card--final" : "");
    el.style.width = o.w + "px";
    el.style.height = o.h + "px";
    el.setAttribute("aria-label", "View " + p.alt);
    const img = document.createElement("img");
    img.alt = "";
    img.decoding = "async";
    img.sizes = o.final ? "100vw" : "(max-width: 700px) 60vw, 500px";
    img.srcset = S.srcset(p);
    img.src = p.base + "-" + p.sizes[Math.min(1, p.sizes.length - 1)] + ".webp";
    el.appendChild(img);
    el.addEventListener("click", () => S.viewer.open(PICKS.map((r) => S.slide(dataRef.find(r))), PICKS.indexOf(p.ref), el));
    world.appendChild(el);
    return Object.assign({ el, photo: p }, o);
  }

  let dataRef = null;

  function progress() {
    const range = fly.offsetHeight - stage.clientHeight;
    return Math.min(1, Math.max(0, (scrollY - fly.offsetTop) / range));
  }

  function onScroll() {
    const p = progress();
    // The camera arrives at the final photo at 80% of the scroll; the rest holds on it.
    const t = Math.min(1, p / 0.8);
    target = camEnd * (1 - Math.pow(1 - t, 1.35));
    endVal = Math.min(1, Math.max(0, (p - 0.78) / 0.14));
    cue.style.opacity = p > 0.02 ? 0 : 1;
    skip.style.opacity = p > 0.75 ? 0 : 1;
    skip.style.pointerEvents = p > 0.75 ? "none" : "";
    body.classList.toggle("past-intro", scrollY > homeTop() - stage.clientHeight * 0.1);
  }

  function render() {
    fly.style.setProperty("--end", endVal.toFixed(3));
    world.style.transform = "translateZ(" + cam.toFixed(1) + "px)";
    let nearest = null, nd = Infinity;
    // At the very start only the name is on screen; photos appear once you begin to scroll.
    const start = Math.min(1, Math.max(0, (cam - 60) / 520));
    for (const it of items) {
      const d = it.z + cam; // negative = in front of the camera
      let o;
      if (it.final) o = d < -3800 ? 0 : d < -2200 ? (d + 3800) / 1600 : 1;
      else if (d > 260) o = 0;
      else if (d > -60) o = (260 - d) / 320;
      else if (d < -3800) o = 0;
      else if (d < -2200) o = (d + 3800) / 1600;
      else o = 1;
      if (!it.word && !it.final) o *= start;
      it.el.style.opacity = o.toFixed(3);
      it.el.style.visibility = o > 0.005 ? "visible" : "hidden";
      const w = it.word ? it.el.offsetWidth : it.w, h = it.word ? it.el.offsetHeight : it.h;
      it.el.style.transform = "translate3d(" + (it.x - w / 2).toFixed(1) + "px," + (it.y - h / 2).toFixed(1) + "px," + it.z + "px) rotateY(" + it.rot.toFixed(2) + "deg)";
      if (it.photo && d < -120 && -d < nd) { nd = -d; nearest = it; }
    }
    const show = nearest && !nearest.final && start > 0.6 ? nearest : null;
    if (show !== current) {
      current = show;
      caption.style.opacity = show ? 1 : 0;
      if (show) {
        caption.querySelector(".fly__title").textContent = show.photo.title;
        caption.querySelector(".fly__sub").textContent = S.subline(show.photo);
      }
    }
  }

  function loop() {
    cam += (target - cam) * 0.085;
    if (Math.abs(target - cam) < 0.05) cam = target;
    render();
    requestAnimationFrame(loop);
  }

  skip.addEventListener("click", (e) => {
    e.preventDefault();
    scrollTo({ top: homeTop(), behavior: "smooth" });
  });

  S.data().then((d) => {
    dataRef = d;
    build(d);
    if (reduce) {
      fly.classList.add("fly--static");
      items.forEach((it) => { it.el.style.visibility = it.final ? "visible" : "hidden"; });
      fly.style.setProperty("--end", 1);
      cue.hidden = true; skip.hidden = true;
      body.classList.add("past-intro");
      return;
    }
    // Coming back to the home page in the same visit lands on the home content.
    let seen = false;
    try { seen = sessionStorage.getItem("flown") === "1"; sessionStorage.setItem("flown", "1"); } catch (e) {}
    if (seen && scrollY < 10 && !location.hash) scrollTo(0, homeTop());
    onScroll();
    cam = target;
    loop();
    addEventListener("scroll", onScroll, { passive: true });
    // Rebuild only when the width changes; phones change height as the URL bar slides.
    let rt, lastW = innerWidth;
    addEventListener("resize", () => {
      if (innerWidth === lastW) return;
      lastW = innerWidth;
      clearTimeout(rt);
      rt = setTimeout(() => { if (built) { build(d); onScroll(); cam = target; } }, 150);
    });
  }).catch(() => { body.classList.add("past-intro"); fly.hidden = true; });
})();
