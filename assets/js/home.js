// Home: the hero reveals once on load, photographs open in the viewer, collection photos morph into
// the Work header, and the wall warms toward the work. Without JS everything is a plain link.
(function () {
  "use strict";
  const S = window.Site;
  const html = document.documentElement;
  const hero = document.querySelector("[data-hero]");
  const heroImg = hero.querySelector("img");
  const tall = matchMedia("(max-aspect-ratio: 9/10)").matches;
  const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

  hero.dataset.photo = tall ? hero.dataset.tall : hero.dataset.wide;
  hero.dataset.tint = tall ? hero.dataset.tintTall : hero.dataset.tintWide;

  /* The reveal: a slow opening of the frame, with the photo settling inside it. */
  function reveal() {
    if (!html.classList.contains("hero-pending")) return;
    if (!window.gsap) return html.classList.remove("hero-pending");
    gsap.set(heroImg, { clipPath: "inset(12% 9% 12% 9%)", scale: 1.1, opacity: 0, transformOrigin: "50% 55%" });
    html.classList.remove("hero-pending");
    gsap.to(heroImg, { opacity: 1, duration: 0.7, ease: "power1.out", clearProps: "opacity" });
    gsap.to(heroImg, { clipPath: "inset(0% 0% 0% 0%)", duration: 2, ease: "power3.inOut", clearProps: "clipPath" });
    gsap.to(heroImg, { scale: 1, duration: 2.6, ease: "power3.out", clearProps: "transform,transformOrigin" });
  }
  const ready = heroImg.decode ? heroImg.decode().catch(() => {}) : Promise.resolve();
  Promise.race([ready, new Promise((r) => setTimeout(r, 1800))]).then(reveal);

  /* Photographs open in the viewer. */
  S.data().then((d) => {
    const links = [hero].concat(Array.from(document.querySelectorAll("[data-wall] [data-photo]")));
    const slides = links.map((a) => S.slide(d.find(a.dataset.photo)));
    links.forEach((a, i) => a.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      S.viewer.open(slides, i, a, null, (n) => links[n]);
    }));
    document.querySelectorAll("[data-col]").forEach((a) => {
      const list = d.byCat[a.dataset.col];
      if (list) a.querySelector("[data-col-n]").textContent = list.length;
    });
  }).catch(() => {});

  /* Collections morph into the Work header. Named on the tap, so only that photo morphs. */
  document.querySelectorAll("[data-col]").forEach((a) => {
    const name = () => {
      html.dataset.morph = a.dataset.col;
      try { sessionStorage.setItem("morph", a.dataset.col); } catch (e) {}
    };
    a.addEventListener("click", (e) => { if (!e.metaKey && !e.ctrlKey && !e.shiftKey) name(); });
    a.addEventListener("pointerdown", () => { // the header image is ready when the page swaps
      const img = a.querySelector("img"), pre = new Image();
      pre.sizes = "100vw"; pre.srcset = img.srcset;
    }, { once: true });
  });

  S.ambient.watch(document.querySelectorAll("[data-hero], [data-photo], [data-col]"));

  fetch("data/awards.json").then((r) => r.json()).then((j) => {
    const expert = j.awards.filter((a) => /Expert Choice/.test(a.result)).length;
    document.querySelector("[data-record]").textContent = j.awards.length + " contest results, including " + (WORDS[expert] || expert) + " Expert Choice awards.";
  }).catch(() => {});
})();
