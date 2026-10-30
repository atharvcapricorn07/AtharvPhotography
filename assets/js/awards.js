// Awards: data/awards.json grouped by organizer. Each row shows the winning photo when it's in the
// gallery (or the certificate when it isn't) and can open either one in the lightbox.
(function () {
  "use strict";
  const { data, picture, lightbox, settings, day, month } = window.Site;

  const root = document.querySelector("[data-awards]");
  const summary = document.querySelector("[data-summary]");
  const errorState = document.querySelector("[data-error]");
  const ORDER = ["tpa", "viewbug", "photocrowd"];

  const ordinal = (n) => n + (["th", "st", "nd", "rd"][(n % 100 - 20) % 10] || ["th", "st", "nd", "rd"][n % 100] || "th");

  function meta(a) {
    return [
      a.date ? day(a.date) : null,
      a.entries ? a.entries.toLocaleString("en-US") + " entries" : null,
      a.rank ? "Ranked " + ordinal(a.rank) : null,
    ].filter(Boolean).join(", ");
  }

  function slideFor(a, org, photo, isProof) {
    return {
      photo,
      title: a.contest,
      sub: a.result + ", " + org.name + (a.date ? ", " + month(a.date) : ""),
      exif: isProof ? (a.organizer === "tpa" ? "Certificate" : "Contest result") : [photo.title, photo.camera, settings(photo)].filter(Boolean).join(", "),
    };
  }

  function row(a, org, d) {
    const photo = a.photo ? d.find(a.photo) : null;
    const proof = d.find("awards/" + a.proof);
    const li = document.createElement("li");
    li.className = "award";

    const slides = [];
    if (photo) slides.push(slideFor(a, org, photo, false));
    if (proof) slides.push(slideFor(a, org, proof, true));
    const cover = photo || proof;

    if (cover) {
      const thumb = picture(cover, { tag: "button", className: "award__thumb", alt: "", sizes: "150px" });
      thumb.type = "button";
      thumb.setAttribute("aria-label", "View " + (photo ? photo.alt : "result for " + a.contest));
      thumb.addEventListener("click", () => lightbox.open(slides, 0, thumb));
      li.appendChild(thumb);
    } else {
      li.appendChild(document.createElement("span"));
    }

    const body = document.createElement("div");
    body.innerHTML = '<h3 class="award__contest"></h3><p class="award__result"></p><p class="award__meta"></p>';
    body.children[0].textContent = a.contest;
    body.children[1].textContent = a.result;
    if (a.tier === "honor") body.children[1].classList.add("award__result--honor");
    body.children[2].textContent = meta(a);
    if (!body.children[2].textContent) body.children[2].remove();
    li.appendChild(body);

    const actions = document.createElement("div");
    actions.className = "award__actions";
    if (photo) actions.appendChild(button("View photo", () => lightbox.open(slides, 0, actions.firstChild)));
    if (proof) {
      const b = button(a.organizer === "tpa" ? "View certificate" : "View result", () => lightbox.open(slides, slides.length - 1, b));
      actions.appendChild(b);
    }
    li.appendChild(actions);
    return li;
  }

  function button(text, fn) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "link";
    b.textContent = text;
    b.addEventListener("click", fn);
    return b;
  }

  function render(json, d) {
    const list = json.awards;
    const expert = list.filter((a) => /Expert Choice/.test(a.result)).length;
    const ranks = list.filter((a) => a.rank).map((a) => a.rank);
    const dated = list.filter((a) => a.date).map((a) => a.date).sort();
    summary.innerHTML = "";
    [
      [list.length, "contest results"],
      [expert, "Expert Choice awards"],
      [ranks.length ? ordinal(Math.min(...ranks)) : null, "best crowd ranking"],
      [dated.length ? month(dated[0]) : null, "first recognition"],
    ].forEach(([value, label]) => {
      if (value == null) return;
      const p = document.createElement("p");
      const s = document.createElement("strong");
      s.textContent = value;
      p.append(s, document.createElement("br"), label);
      summary.appendChild(p);
    });

    root.replaceChildren(...ORDER.map((key) => {
      const org = json.organizers[key];
      const items = list.filter((a) => a.organizer === key);
      if (!items.length) return document.createComment(key);
      const section = document.createElement("section");
      section.className = "org";
      section.setAttribute("aria-labelledby", "org-" + key);
      section.innerHTML =
        '<div class="org__head"><h2 class="h2" id="org-' + key + '"></h2><p class="org__count"></p><p class="org__note"></p></div><ol></ol>';
      section.querySelector("h2").textContent = org.name;
      section.querySelector(".org__count").textContent = items.length === 1 ? "1 result" : items.length + " results";
      section.querySelector(".org__note").textContent = org.note;
      section.querySelector("ol").append(...items.map((x) => row(x, org, d)));
      return section;
    }));
    root.setAttribute("aria-busy", "false");
  }

  function init() {
    errorState.hidden = true;
    Promise.all([fetch("data/awards.json").then((r) => { if (!r.ok) throw 0; return r.json(); }), data()])
      .then(([json, d]) => render(json, d))
      .catch(() => { root.setAttribute("aria-busy", "false"); errorState.hidden = false; });
  }
  errorState.querySelector("button").addEventListener("click", init);
  init();
})();
