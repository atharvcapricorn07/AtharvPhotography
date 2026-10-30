// Home: a random hero from a curated set, selected work, the subject index and award highlights.
(function () {
  "use strict";
  const { data, picture, justified, lightbox, toSlide, settings, month, LABEL, CATEGORIES } = window.Site;

  // Curated by hand. Hero picks need to read well as a wide crop.
  const HERO = ["cars/car10", "landscapes/landscape12", "cars/car13", "misc/misc11", "landscapes/landscape7", "landscapes/landscape6", "misc/misc4", "animals/animal1"];
  const SELECTED = [
    "animals/animal11", "cars/car16", "landscapes/landscape8", "shoots/shoot-1",
    "misc/misc26", "animals/animal17", "cars/car17", "landscapes/landscape14",
    "misc/misc18", "animals/animal4",
  ];
  const SUBJECT_COVER = { cars: "cars/car16", landscapes: "landscapes/landscape12", animals: "animals/animal12", shoots: "shoots/shoot-3", misc: "misc/misc17" };

  const frame = document.querySelector("[data-hero]");
  const caption = document.querySelector("[data-hero-caption]");
  const selected = document.querySelector("[data-selected]");
  const subjects = document.querySelector("[data-subjects]");
  const honors = document.querySelector("[data-honors]");
  const teaser = document.querySelector("[data-portrait]");

  data().then((d) => {
    // Hero
    const pool = HERO.map(d.find).filter(Boolean);
    const hero = pool[(Math.random() * pool.length) | 0];
    if (hero) {
      const pic = picture(hero, { eager: true, sizes: "(max-width: 1440px) 100vw, 1440px" });
      frame.replaceChildren(...pic.childNodes);
      frame.style.setProperty("--ph", hero.color);
      const img = frame.querySelector("img");
      img.style.objectPosition = "50% 55%";
      img.addEventListener("click", () => lightbox.open([toSlide(hero)], 0, img));
      const reveal = () => frame.classList.add("is-ready");
      if (img.complete) reveal(); else img.addEventListener("load", reveal, { once: true });
      caption.innerHTML = "";
      const left = document.createElement("span");
      const strong = document.createElement("strong");
      strong.textContent = hero.title || LABEL[hero.category];
      left.append(strong, ", " + [LABEL[hero.category], month(hero.date)].filter(Boolean).join(", "));
      const right = document.createElement("span");
      right.textContent = [hero.camera, settings(hero)].filter(Boolean).join(", ");
      caption.append(left, right);
    }

    // Selected work
    justified(selected, SELECTED.map(d.find).filter(Boolean));

    // Subject index with live counts
    subjects.replaceChildren(...CATEGORIES.map((c) => {
      const list = d.byCat[c.key] || [];
      const a = document.createElement("a");
      a.className = "subject";
      a.href = "gallery.html?subject=" + c.key;
      const cover = d.find(SUBJECT_COVER[c.key]) || list[0];
      const thumb = cover ? picture(cover, { className: "subject__thumb", alt: "", sizes: "128px" }) : document.createElement("span");
      const name = document.createElement("span");
      name.className = "subject__name";
      name.textContent = c.label;
      const count = document.createElement("span");
      count.className = "subject__count";
      count.textContent = list.length + " photos";
      a.append(thumb, name, count);
      return a;
    }));

    if (teaser && d.portrait) teaser.replaceChildren(picture(d.portrait, { className: "about-teaser__photo", alt: "Atharv Kale", sizes: "220px" }));
  }).catch(() => {
    frame.closest("figure").hidden = true;
    selected.innerHTML = '<p class="muted">Photos could not load. Refresh the page to try again.</p>';
  });

  // Award highlights: the top-tier results only.
  fetch("data/awards.json").then((r) => r.json()).then((a) => {
    const top = a.awards.filter((x) => x.tier === "honor").slice(0, 5);
    const total = a.awards.length;
    const expert = a.awards.filter((x) => /Expert Choice/.test(x.result)).length;
    const count = document.querySelector("[data-award-summary]");
    if (count) count.textContent = total + " contest results across Top Photo Awards, ViewBug and Photocrowd, including " + expert + " Expert Choice awards.";
    honors.replaceChildren(...top.map((x) => {
      const li = document.createElement("li");
      li.className = "honor";
      li.innerHTML = '<span class="honor__contest"></span><span class="honor__date"></span><span class="honor__result"></span>';
      li.children[0].textContent = x.contest;
      li.children[1].textContent = month(x.date);
      li.children[2].textContent = x.result + ", " + a.organizers[x.organizer].name;
      return li;
    }));
  }).catch(() => {});
})();
