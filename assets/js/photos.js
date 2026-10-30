// Shared access to photos.json: { category: [filename, ...] }, served as photos/<category>/<filename>.
(function () {
  const Site = (window.Site = window.Site || {});

  const LABELS = {
    cars: "Car",
    landscapes: "Landscape",
    animals: "Fauna",
    misc: "Miscellaneous",
    awards: "Award-winning",
    shoots: "Portrait",
  };

  let request = null;

  function load() {
    if (!request) {
      request = fetch("photos.json", { cache: "no-cache" })
        .then((res) => {
          if (!res.ok) throw new Error("photos.json returned " + res.status);
          return res.json();
        })
        .catch((err) => {
          request = null; // allow a retry
          throw err;
        });
    }
    return request;
  }

  function src(category, file) {
    return "photos/" + category + "/" + encodeURIComponent(file);
  }

  function alt(category, file, index) {
    const match = /(\d+)/.exec(file);
    const n = match ? match[1] : index + 1;
    return (LABELS[category] || "Photograph") + " photograph " + n;
  }

  function item(category, file, index) {
    return { category, file, src: src(category, file), alt: alt(category, file, index) };
  }

  function list(data, category) {
    return (data[category] || []).map((file, i) => item(category, file, i));
  }

  // Every photo except the excluded categories (awards by default).
  function flatten(data, exclude) {
    exclude = exclude || ["awards"];
    return Object.keys(data)
      .filter((cat) => exclude.indexOf(cat) === -1)
      .reduce((all, cat) => all.concat(list(data, cat)), []);
  }

  function shuffle(array) {
    const a = array.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  // Builds an <img> that fades in on load. `frame` (optional) takes the photo's natural aspect ratio.
  function image(photo, opts) {
    opts = opts || {};
    const img = document.createElement("img");
    img.className = "fade";
    img.alt = photo.alt;
    img.decoding = "async";
    if (opts.eager) img.fetchPriority = "high";
    else img.loading = "lazy";

    img.addEventListener("load", function () {
      if (opts.frame && img.naturalWidth) {
        const ratio = img.naturalWidth / img.naturalHeight;
        opts.frame.style.aspectRatio = img.naturalWidth + " / " + img.naturalHeight;
        if (opts.onRatio) opts.onRatio(ratio);
      }
      img.classList.add("is-loaded");
    });
    img.addEventListener("error", function () {
      if (opts.onError) opts.onError(img);
    });
    img.src = photo.src;
    return img;
  }

  Site.photos = { load, src, alt, list, flatten, shuffle, image, LABELS };
})();
