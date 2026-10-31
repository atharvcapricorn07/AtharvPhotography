// About: portrait plus a kit list read from the photos' own EXIF, so it stays accurate.
(function () {
  "use strict";
  const S = window.Site;
  const LENS = S.LENS;
  S.data().then((d) => {
    const portrait = document.querySelector("[data-portrait]");
    if (d.portrait) portrait.replaceChildren(...S.picture(d.portrait, { alt: "Atharv Kale", eager: true, sizes: "(max-width: 800px) 100vw, 40vw", position: "50% 30%" }).childNodes);
    const counts = {};
    d.all.forEach((p) => { if (p.lens && !/iPhone/.test(p.lens)) counts[p.lens] = (counts[p.lens] || 0) + 1; });
    const lenses = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (lenses.length) document.querySelector("[data-kit]").replaceChildren(...lenses.map(([lens, n]) => {
      const li = document.createElement("li");
      li.append(LENS[lens] || lens);
      const s = document.createElement("span");
      s.className = "muted";
      s.textContent = ", " + n + " photos";
      li.appendChild(s);
      return li;
    }));
  }).catch(() => {});
})();
