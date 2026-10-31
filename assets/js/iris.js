// The opening moment: a camera aperture opens to reveal the first photo.
// It doubles as the loader: the iris stays nearly closed until the photo has loaded, then opens
// while the f-number counts down from f/22 to f/1.8. Plays once per visit; skipped entirely for
// people who prefer reduced motion.
(function () {
  "use strict";
  const iris = document.querySelector("[data-iris]");
  if (!iris) return;

  let seen = false;
  try { seen = sessionStorage.getItem("iris") === "1"; } catch (e) {}
  if (seen || matchMedia("(prefers-reduced-motion: reduce)").matches) { iris.remove(); return; }
  try { sessionStorage.setItem("iris", "1"); } catch (e) {}

  document.documentElement.classList.add("iris-on");
  const canvas = iris.querySelector("canvas");
  const label = iris.querySelector(".iris__f");
  const ctx = canvas.getContext("2d");
  const BLADES = 9;
  const STOPS = [22, 16, 11, 8, 5.6, 4, 2.8, 2, 1.8];
  let w, h, dpr, cx, cy, maxR;

  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w / 2; cy = h / 2;
    // The polygon's flat sides must clear the screen corners when fully open.
    maxR = Math.hypot(cx, cy) / Math.cos(Math.PI / BLADES) * 1.02;
  }

  function draw(r, rot) {
    ctx.clearRect(0, 0, w, h);
    const v = [];
    for (let i = 0; i < BLADES; i++) {
      const a = rot + (i / BLADES) * Math.PI * 2;
      v.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    const far = Math.hypot(w, h) * 2;
    // Each blade: one side of the opening, extended outward like a real iris diaphragm.
    for (let i = 0; i < BLADES; i++) {
      const a = v[i], b = v[(i + 1) % BLADES], p = v[(i - 1 + BLADES) % BLADES];
      const d1 = [b[0] - a[0], b[1] - a[1]], l1 = Math.hypot(d1[0], d1[1]) || 1;
      const d0 = [a[0] - p[0], a[1] - p[1]], l0 = Math.hypot(d0[0], d0[1]) || 1;
      const fb = [b[0] + (d1[0] / l1) * far, b[1] + (d1[1] / l1) * far];
      const fa = [a[0] + (d0[0] / l0) * far, a[1] + (d0[1] / l0) * far];
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(fb[0], fb[1]); ctx.lineTo(fa[0], fa[1]); ctx.closePath();
      // Brushed-metal shading: each blade catches the light a little differently.
      const g = ctx.createLinearGradient(a[0], a[1], fa[0], fa[1]);
      const tone = 14 + ((i * 7) % 5) * 3;
      g.addColorStop(0, "rgb(" + (tone + 16) + "," + (tone + 16) + "," + (tone + 18) + ")");
      g.addColorStop(0.18, "rgb(" + tone + "," + tone + "," + (tone + 1) + ")");
      g.addColorStop(1, "rgb(4,4,4)");
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.09)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(fa[0], fa[1]); ctx.stroke();
    }
    // A thin bright rim around the opening, like light catching the blade edges.
    ctx.beginPath();
    v.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath();
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  const ease = (t) => 1 - Math.pow(1 - t, 4);
  const start = { r: 0.035, rot: 0 };
  let opening = false;

  size();
  draw(start.r * maxR, start.rot);
  addEventListener("resize", () => { size(); if (!opening) draw(start.r * maxR, start.rot); });

  // A gentle "breathing" while the first photo loads.
  let breathing = true, t0 = performance.now();
  (function breathe(now) {
    if (!breathing) return;
    const k = 0.035 + Math.sin((now - t0) / 380) * 0.006;
    draw(k * maxR, (now - t0) / 4000);
    requestAnimationFrame(breathe);
  })(t0);

  function open() {
    if (opening) return;
    opening = true;
    breathing = false;
    const dur = 1500, begin = performance.now(), rot0 = (begin - t0) / 4000;
    document.documentElement.classList.add("iris-opening");
    function frame(now) {
      const t = Math.min(1, (now - begin) / dur), e = ease(t);
      draw((start.r + (1 - start.r) * e) * maxR, rot0 + e * 0.7);
      label.textContent = "ƒ/" + STOPS[Math.min(STOPS.length - 1, Math.floor(e * STOPS.length))];
      if (t < 1) requestAnimationFrame(frame);
      else {
        iris.classList.add("is-done");
        document.documentElement.classList.remove("iris-on", "iris-opening");
        setTimeout(() => iris.remove(), 500);
      }
    }
    requestAnimationFrame(frame);
  }

  // Open once the first reel photo has loaded (or after 3.5s, whichever comes first).
  const fallback = setTimeout(open, 3500);
  function waitForPhoto() {
    const img = document.querySelector(".reel__slide img");
    if (!img) return setTimeout(waitForPhoto, 50);
    const go = () => { clearTimeout(fallback); setTimeout(open, 250); };
    if (img.complete && img.naturalWidth) go(); else { img.addEventListener("load", go, { once: true }); img.addEventListener("error", go, { once: true }); }
  }
  waitForPhoto();
  // Tapping skips straight to the photo.
  iris.addEventListener("click", open);
})();
