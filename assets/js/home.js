// Home content below the intro: collections, facts, recognition, about. Calm and quiet.
(function () {
  "use strict";
  const S = window.Site;

  // Cover photo for each collection card. The first card is the large one.
  const COVERS = { landscapes: "landscapes/landscape12", cars: "cars/car16", animals: "animals/animal11", shoots: "shoots/shoot-1", misc: "misc/misc18" };
  const ORDER = ["landscapes", "cars", "animals", "shoots", "misc"];

  // Sections fade up once as they enter the screen.
  const io = "IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches
    ? new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -12% 0px" })
    : null;
  document.querySelectorAll(".reveal").forEach((el) => (io ? io.observe(el) : el.classList.add("is-in")));

  function collections(d) {
    const grid = document.querySelector("[data-collections]");
    grid.replaceChildren(...ORDER.map((key, i) => {
      const list = d.byCat[key] || [];
      const a = document.createElement("a");
      a.className = "bento__card";
      a.href = "gallery.html?subject=" + key;
      const cover = d.find(COVERS[key]) || list[0];
      if (cover) a.appendChild(S.picture(cover, { alt: "", sizes: i === 0 ? "(max-width: 800px) 100vw, 50vw" : "(max-width: 800px) 50vw, 25vw" }));
      const label = document.createElement("span");
      label.className = "bento__label";
      label.innerHTML = '<span class="bento__name"></span><span class="bento__count"></span>';
      label.firstChild.textContent = S.LABEL[key];
      label.lastChild.textContent = list.length + " photos";
      a.appendChild(label);
      return a;
    }));
  }

  function figures(d, awards) {
    const expert = awards ? awards.awards.filter((x) => /Expert Choice/.test(x.result)).length : 4;
    const set = (k, v) => { const el = document.querySelector('[data-figure="' + k + '"]'); if (el) el.textContent = v; };
    set("photos", d.all.length);
    if (awards) { set("awards", awards.awards.length); set("expert", expert); }
  }

  function honors(d, a) {
    const list = document.querySelector("[data-honors]");
    list.replaceChildren(...a.awards.filter((x) => x.tier === "honor").slice(0, 4).map((x) => {
      const li = document.createElement("li");
      const p = (x.photo && d.find(x.photo)) || d.find("awards/" + x.proof);
      li.appendChild(p ? S.picture(p, { alt: "", sizes: "72px" }) : document.createElement("span"));
      const t = document.createElement("div");
      t.innerHTML = '<p class="honors__contest"></p><p class="honors__result"></p>';
      t.firstChild.textContent = x.contest;
      t.lastChild.textContent = x.result + ", " + a.organizers[x.organizer].name + (x.date ? ", " + S.month(x.date) : "");
      li.appendChild(t);
      return li;
    }));
  }

  Promise.all([S.data(), fetch("data/awards.json").then((r) => r.json()).catch(() => null)]).then(([d, a]) => {
    collections(d);
    figures(d, a);
    if (a) honors(d, a);
    const portrait = document.querySelector("[data-portrait]");
    if (d.portrait) portrait.replaceChildren(...S.picture(d.portrait, { alt: "Atharv Kale", sizes: "(max-width: 800px) 100vw, 40vw", position: "50% 30%" }).childNodes);
  }).catch(() => {});
})();
