// Shared helpers for the Lab experiments: load the photo list and images.
window.Lab = (function () {
  "use strict";
  const CATS = ["cars", "landscapes", "animals", "shoots", "misc"];
  const LABEL = { cars: "Cars", landscapes: "Landscapes", animals: "Wildlife", shoots: "Portraits", misc: "Misc" };
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  function pick(sizes, want) {
    for (const s of sizes) if (s >= want) return s;
    return sizes[sizes.length - 1];
  }

  async function photos() {
    const res = await fetch("../data/photos.json");
    const json = await res.json();
    const list = [];
    for (const c of CATS) for (const p of json.categories[c] || []) {
      list.push(Object.assign({}, p, {
        cat: c, ref: c + "/" + p.id, r: p.w / p.h,
        label: LABEL[c],
        sub: LABEL[c] + (p.date ? ", " + MONTHS[+p.date.slice(5, 7) - 1] + " " + p.date.slice(0, 4) : ""),
        src: (w) => "../media/" + c + "/" + p.id + "-" + pick(p.sizes, w) + ".webp",
      }));
    }
    list.find = (ref) => list.filter((p) => p.ref === ref)[0];
    return list;
  }

  function load(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  return { photos, load, pick };
})();
