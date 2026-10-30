// Fade-and-rise reveal for [data-reveal] elements as they enter the viewport.
(function () {
  const Site = (window.Site = window.Site || {});
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const MAX_STAGGER = 6;

  const observer =
    "IntersectionObserver" in window
      ? new IntersectionObserver(onIntersect, { rootMargin: "0px 0px -8% 0px", threshold: 0.01 })
      : null;

  function onIntersect(entries) {
    let step = 0;
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (!reduced.matches) el.style.setProperty("--i", Math.min(step++, MAX_STAGGER));
      el.classList.add("is-visible");
      observer.unobserve(el);
    });
  }

  function reveal(root) {
    const els = (root || document).querySelectorAll("[data-reveal]:not(.is-visible)");
    els.forEach((el) => {
      if (observer && !reduced.matches) observer.observe(el);
      else el.classList.add("is-visible");
    });
  }

  Site.reveal = reveal;
  Site.reducedMotion = reduced;

  // Static images in the markup fade in once loaded (or immediately if already cached or broken).
  function fadeStatic() {
    document.querySelectorAll("img.fade:not(.is-loaded)").forEach((img) => {
      const done = () => img.classList.add("is-loaded");
      if (img.complete) done();
      else {
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    fadeStatic();
    reveal();
  });
})();
