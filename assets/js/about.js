// About: portrait plus a kit list read from the photos' own EXIF, so it stays accurate as photos change.
(function () {
  "use strict";
  const { data, picture } = window.Site;

  const portrait = document.querySelector("[data-portrait]");
  const kit = document.querySelector("[data-kit]");
  const camera = document.querySelector("[data-camera]");

  // EXIF lens names are terse; these read better.
  const LENS = {
    "RF-S18-150mm F3.5-6.3 IS STM": "Canon RF-S 18–150mm f/3.5–6.3",
    "EF70-200mm f/2.8L IS USM": "Canon EF 70–200mm f/2.8L",
    "EF50mm f/1.8 STM": "Canon EF 50mm f/1.8",
    "EF-S55-250mm f/4-5.6 IS II": "Canon EF-S 55–250mm f/4–5.6",
  };

  data().then((d) => {
    if (d.portrait) portrait.replaceChildren(...picture(d.portrait, { alt: "Portrait of Atharv Kale", eager: true, sizes: "(max-width: 860px) 420px, 40vw" }).childNodes);

    const tally = (key) => {
      const counts = {};
      d.all.forEach((p) => { if (p[key] && !/iPhone/.test(p[key])) counts[p[key]] = (counts[p[key]] || 0) + 1; });
      return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    };

    const cams = tally("camera");
    if (cams.length) camera.textContent = cams.map(([c]) => (/^Canon/.test(c) ? c : "Canon " + c)).join(", ");

    const lenses = tally("lens");
    if (lenses.length) {
      kit.replaceChildren(...lenses.map(([lens, n]) => {
        const li = document.createElement("li");
        const name = document.createTextNode(LENS[lens] || lens);
        const count = document.createElement("span");
        count.className = "muted";
        count.textContent = ", " + n + (n === 1 ? " photo" : " photos") + " in the gallery";
        li.append(name, count);
        return li;
      }));
    }
  }).catch(() => {});
})();
