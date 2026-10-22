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

  document.addEventListener("DOMContentLoaded", () => reveal());
})();
