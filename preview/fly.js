// Intro study for the two directions. One scroll-scrubbed value (t) drives every card, so the
// motion stays locked to the finger and nothing reads layout during the flight.
(function () {
  "use strict";
  var root = document.querySelector("[data-fly]");
  if (!root || !window.gsap) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  var FLIGHT = ["animals/animal13", "cars/car9", "landscapes/landscape14", "misc/misc22", "animals/animal17"];
  var bank = root.dataset.fly === "bank";
  var stage = root.querySelector(".fly__stage");
  var world = root.querySelector(".fly__world");
  var caption = root.querySelector(".fly__caption");
  var capTitle = root.querySelector(".fly__title");
  var capSub = root.querySelector(".fly__sub");
  var cue = root.querySelector(".fly__cue");
  var skip = root.querySelector(".fly__skip");
  var end = root.querySelector(".fly__end");
  var still = root.querySelector(".fly__still");

  var state = { t: 0, intro: 0 };
  var cards = [], P = 1000, S = 1100, active = -2, tl = null, homeTrigger = null;
  var clamp = gsap.utils.clamp(0, 1);
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var LABEL = { cars: "Cars", landscapes: "Landscapes", animals: "Wildlife", shoots: "Portraits", misc: "Misc" };

  function find(data, ref) {
    var parts = ref.split("/");
    var p = data.categories[parts[0]].find(function (x) { return x.id === parts[1]; });
    return Object.assign({ cat: parts[0], r: p.w / p.h }, p);
  }
  function srcset(p) {
    return p.sizes.map(function (s) { return "../media/" + p.cat + "/" + p.id + "-" + s + ".webp " + s + "w"; }).join(", ");
  }
  function subline(p) {
    if (!p.date) return LABEL[p.cat];
    var d = p.date.split("-");
    return LABEL[p.cat] + ", " + MONTHS[+d[1] - 1] + " " + d[0];
  }

  function build(data) {
    var W = stage.clientWidth, H = stage.clientHeight, phone = W < 700;
    P = Math.max(W, H);
    S = P * 1.15;
    stage.style.perspective = P + "px";
    world.replaceChildren();
    var refs = FLIGHT.concat(W / H < 0.9 ? "landscapes/landscape8" : "landscapes/landscape11");
    cards = refs.map(function (ref, i) {
      var p = find(data, ref), final = i === refs.length - 1, w, h;
      if (final) { w = W; h = H; }
      else {
        h = H * (phone ? (bank ? 0.6 : 0.52) : 0.68);
        w = h * p.r;
        var maxW = W * (phone ? (bank ? 0.84 : 0.76) : 0.6);
        if (w > maxW) { w = maxW; h = w / p.r; }
      }
      var side = i % 2 ? 1 : -1;
      var el = document.createElement("div");
      el.className = "fly__card" + (final ? " fly__card--final" : "");
      el.style.width = w + "px";
      el.style.height = h + "px";
      el.style.marginLeft = -w / 2 + "px";
      el.style.marginTop = -h / 2 + "px";
      var img = new Image();
      img.alt = "";
      img.decoding = "async";
      img.sizes = final ? "100vw" : Math.ceil(w) + "px";
      img.srcset = srcset(p);
      img.src = "../media/" + p.cat + "/" + p.id + "-" + p.sizes[Math.min(1, p.sizes.length - 1)] + ".webp";
      el.appendChild(img);
      world.appendChild(el);
      return {
        el: el, img: img, photo: p, final: final, z: -i * S, side: side,
        x: !final && bank ? side * W * (phone ? 0.09 : 0.14) : 0,
        y: !final && bank ? (i % 3 - 1) * H * 0.035 : 0,
      };
    });
  }

  function render() {
    var n = cards.length - 1, t = state.t;
    var i0 = Math.min(n, Math.floor(t)), f = t - i0, a = cards[i0], b = cards[Math.min(n, i0 + 1)];
    var camZ = t * S + state.intro * S;
    var camX = -(a.x + (b.x - a.x) * f), camY = -(a.y + (b.y - a.y) * f);
    world.style.transform = "translate3d(" + camX.toFixed(1) + "px," + camY.toFixed(1) + "px," + camZ.toFixed(1) + "px)";
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i], ez = c.z + camZ, o;
      if (ez > 0) o = c.final ? 1 : 1 - clamp((ez - P * 0.22) / (P * 0.34));
      else o = c.final ? clamp(1 + ez / (S * 2.1)) : clamp(1 + ez / (S * 2.0));
      c.el.style.opacity = o.toFixed(3);
      c.el.style.visibility = o < 0.01 ? "hidden" : "visible";
      var yaw = c.final || !bank ? 0 : -c.side * 7 * Math.min(1, Math.abs(i - t));
      c.el.style.transform = "translate3d(" + c.x.toFixed(1) + "px," + c.y.toFixed(1) + "px," + c.z.toFixed(1) + "px) rotateY(" + yaw.toFixed(2) + "deg)";
    }
    var near = Math.round(t), show = Math.abs(t - near) < 0.2 && near < n ? near : -1;
    if (show !== active) {
      active = show;
      caption.classList.toggle("is-on", show >= 0);
      if (show >= 0) {
        capTitle.textContent = cards[show].photo.title;
        capSub.textContent = subline(cards[show].photo);
      }
    }
    cue.classList.toggle("is-off", t > 0.04);
    skip.classList.toggle("is-off", t > n - 0.15);
    document.documentElement.classList.toggle("past-intro", t >= n - 0.02);
  }

  function timeline() {
    if (tl) { tl.scrollTrigger.kill(); tl.kill(); }
    var n = cards.length - 1;
    tl = gsap.timeline({
      defaults: { ease: "none" },
      onUpdate: render,
      scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: stage.clientWidth < 700 ? 0.5 : 0.8 },
    });
    for (var i = 0; i < n; i++) {
      tl.to(state, { t: i + 1, duration: 1, ease: i === n - 1 ? "power3.inOut" : "power2.inOut" }, i === 0 ? 0.12 : "+=0.28");
    }
    tl.fromTo(end, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" }, "+=0.1");
    tl.to({}, { duration: 0.5 });
    if (homeTrigger) homeTrigger.kill();
    homeTrigger = ScrollTrigger.create({ trigger: "#home", start: "top 44px", toggleClass: { targets: document.documentElement, className: "at-home" } });
  }

  fetch("../data/photos.json").then(function (r) { return r.json(); }).then(function (data) {
    build(data);
    gsap.set(end, { autoAlpha: 0 });
    timeline();
    var first = cards[0].img;
    var ready = first.decode ? first.decode().catch(function () {}) : Promise.resolve();
    Promise.race([ready, new Promise(function (r) { setTimeout(r, 1200); })]).then(function () {
      if (still) still.hidden = true;
      root.classList.add("is-ready");
      if (scrollY < 40) {
        state.intro = -0.32;
        gsap.to(state, { intro: 0, duration: 1.8, ease: "expo.out", onUpdate: render });
      }
      render();
    });
    var lastW = innerWidth, rt;
    addEventListener("resize", function () {
      if (innerWidth === lastW) return;
      lastW = innerWidth;
      clearTimeout(rt);
      rt = setTimeout(function () { build(data); timeline(); ScrollTrigger.refresh(); render(); }, 150);
    });
  }).catch(function () { root.classList.add("is-failed"); });
})();
