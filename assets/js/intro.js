// The intro. One scroll-scrubbed value (t) moves the camera straight through six favourite photos
// in the dark, so the motion stays locked to the finger and nothing reads layout during the flight.
// As the home content rises, the room lights up from black to the white wall.
(function () {
  "use strict";
  const S = window.Site;
  const root = document.querySelector("[data-fly]");
  const html = document.documentElement;
  if (!root || !html.classList.contains("fly-mode")) return;

  function fallback() {
    html.classList.remove("fly-mode");
  }
  if (!window.gsap || !window.ScrollTrigger) return fallback();
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  // Atharv's favourites. Tall screens land on a vertical photo, wide screens on the skyline.
  const FLIGHT = ["animals/animal13", "cars/car16", "landscapes/landscape14", "misc/misc22", "animals/animal17"];
  const FINAL_TALL = "landscapes/landscape8";
  const FINAL_WIDE = "landscapes/landscape11";

  const stage = root.querySelector(".fly__stage");
  const world = root.querySelector("[data-world]");
  const caption = root.querySelector("[data-caption]");
  const capTitle = caption.querySelector(".fly__title");
  const capSub = caption.querySelector(".fly__sub");
  const cue = root.querySelector("[data-cue]");
  const skip = root.querySelector("[data-skip]");
  const end = root.querySelector("[data-end]");
  const still = root.querySelector(".fly__still");
  const ground = document.querySelector("[data-ground]");
  const statement = document.querySelector("[data-statement]");
  const home = document.getElementById("home");
  const themeMeta = document.querySelector("meta[name=theme-color]");

  const state = { t: 0, push: 0 };
  const clamp = gsap.utils.clamp(0, 1);
  let cards = [], P = 1000, gap = 1150, active = -2, flight = null, phone = false;

  function build(d) {
    const W = stage.clientWidth, H = stage.clientHeight;
    phone = W < 700;
    P = Math.max(W, H);
    gap = P * 1.15;
    stage.style.perspective = P + "px";
    world.replaceChildren();
    const tall = W / H < 0.9;
    const refs = FLIGHT.concat(tall ? FINAL_TALL : FINAL_WIDE);
    const photos = refs.map(d.find).filter(Boolean);
    const slides = photos.map((p) => S.slide(p));
    cards = photos.map((p, i) => {
      const final = i === photos.length - 1;
      let w = W, h = H;
      if (!final) {
        h = H * (phone ? 0.52 : 0.68);
        w = h * p.r;
        const maxW = W * (phone ? 0.76 : 0.6);
        if (w > maxW) { w = maxW; h = w / p.r; }
      }
      const el = document.createElement("button");
      el.type = "button";
      el.className = "fly__card" + (final && tall ? " fly__card--tall" : "");
      el.tabIndex = -1;
      el.setAttribute("aria-label", "View " + p.alt);
      el.style.cssText = "width:" + w + "px;height:" + h + "px;margin:" + -h / 2 + "px 0 0 " + -w / 2 + "px";
      const img = new Image();
      img.alt = "";
      img.decoding = "async";
      img.sizes = final ? Math.ceil(Math.max(W, H * p.r)) + "px" : Math.ceil(w) + "px";
      img.srcset = S.srcset(p);
      img.src = p.base + "-" + p.sizes[Math.min(1, p.sizes.length - 1)] + ".webp";
      el.appendChild(img);
      el.addEventListener("click", () => S.viewer.open(slides, i, el));
      world.appendChild(el);
      return { el, img, photo: p, final, z: -i * gap };
    });
  }

  function render() {
    const n = cards.length - 1, t = state.t;
    const camZ = (t + state.push) * gap;
    world.style.transform = "translate3d(0,0," + camZ.toFixed(1) + "px)";
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i], ez = c.z + camZ;
      // In front of the camera a card fades out as it passes; far away it sits in the dark.
      const o = ez > 0
        ? (c.final ? 1 : 1 - clamp((ez - P * 0.22) / (P * 0.34)))
        : clamp(1 + ez / (gap * 2.05));
      c.el.style.opacity = o.toFixed(3);
      c.el.style.visibility = o < 0.01 ? "hidden" : "visible";
      c.el.style.transform = "translateZ(" + c.z.toFixed(1) + "px)";
    }
    const near = Math.round(t);
    const show = Math.abs(t - near) < 0.2 && near < n ? near : -1;
    if (show !== active) {
      active = show;
      caption.classList.toggle("is-on", show >= 0);
      cards.forEach((c, i) => { c.el.tabIndex = i === near ? 0 : -1; });
      if (show >= 0) {
        capTitle.textContent = cards[show].photo.alt;
        capSub.textContent = S.subline(cards[show].photo);
      }
    }
    cue.classList.toggle("is-off", t > 0.04);
    skip.classList.toggle("is-off", t > n - 0.15);
  }

  function timeline() {
    if (flight) { flight.scrollTrigger.kill(); flight.kill(); }
    const n = cards.length - 1;
    flight = gsap.timeline({
      defaults: { ease: "none" },
      onUpdate: render,
      scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: phone ? 0.5 : 0.8 },
    });
    for (let i = 0; i < n; i++) {
      flight.to(state, { t: i + 1, duration: 1, ease: i === n - 1 ? "power3.inOut" : "power2.inOut" }, i === 0 ? 0.12 : "+=0.28");
    }
    flight.fromTo(end, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" }, "+=0.1");
    flight.to({}, { duration: 0.5 });
  }

  // The lights come on: black to wall while the home content rises to 35% of the screen. The
  // statement fades in only as the wall turns bright, so its dark text never sits on black.
  function lighting() {
    gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: home, start: "top bottom", end: "top 35%", scrub: true },
    })
      .to(end, { autoAlpha: 0, duration: 0.3 }, 0)
      .fromTo(ground, { opacity: 0 }, { opacity: 1, duration: 1, ease: "power1.inOut" }, 0)
      .fromTo(statement, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45 }, 0.55);

    ScrollTrigger.create({
      trigger: home, start: "top 35%", end: "max",
      onToggle: (self) => {
        html.classList.toggle("wall-done", self.isActive);
        if (themeMeta) themeMeta.content = self.isActive ? "#f7f6f2" : "#000000";
      },
    });
    ScrollTrigger.create({
      trigger: home, start: () => "top " + (S.barHeight() + 4) + "px", end: "max",
      toggleClass: { targets: html, className: "at-wall" },
    });
  }

  S.data().then((d) => {
    build(d);
    gsap.set(end, { autoAlpha: 0 });
    timeline();
    lighting();

    // Coming back in the same visit lands on the home content.
    let seen = false;
    try { seen = sessionStorage.getItem("flown") === "1"; sessionStorage.setItem("flown", "1"); } catch (e) {}
    if (seen && scrollY < 10 && !location.hash) scrollTo(0, home.offsetTop);

    const first = cards[0].img;
    const ready = first.decode ? first.decode().catch(() => {}) : Promise.resolve();
    Promise.race([ready, new Promise((r) => setTimeout(r, 1200))]).then(() => {
      still.hidden = true;
      if (scrollY < 40) {
        // One settling push as the first photo arrives.
        state.push = -0.3;
        gsap.to(state, { push: 0, duration: 1.8, ease: "expo.out", onUpdate: render });
      }
      render();
      ScrollTrigger.refresh();
    });

    let lastW = innerWidth, rt;
    addEventListener("resize", () => {
      if (innerWidth === lastW) return; // phones change height as the URL bar slides
      lastW = innerWidth;
      clearTimeout(rt);
      rt = setTimeout(() => { active = -2; build(d); timeline(); ScrollTrigger.refresh(); render(); }, 150);
    });
  }).catch(fallback);
})();
