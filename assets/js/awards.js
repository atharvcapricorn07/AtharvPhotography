// Awards: data/awards.json grouped by organizer. Each entry opens the winning photo and its certificate.
(function () {
  "use strict";
  const S = window.Site;
  const root = document.querySelector("[data-awards]");
  const stats = document.querySelector("[data-stats]");
  const errorState = document.querySelector("[data-error]");
  const ORDER = ["tpa", "viewbug", "photocrowd"];
  const ordinal = (n) => { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };

  function slidesFor(a, org, photo, proof) {
    const sub = a.result + ", " + org.name + (a.date ? ", " + S.month(a.date) : "");
    const out = [];
    if (photo) out.push(S.slide(photo, { title: a.contest, sub }));
    if (proof) out.push({ photo: proof, title: a.contest, sub: a.organizer === "tpa" ? "Certificate" : "Contest result", info: [] });
    return out;
  }

  function row(a, org, d) {
    const photo = a.photo ? d.find(a.photo) : null;
    const proof = d.find("awards/" + a.proof);
    const slides = slidesFor(a, org, photo, proof);
    const li = document.createElement("li");
    li.className = "award";
    const cover = photo || proof;
    if (cover) {
      const t = S.tappable(cover, slides, 0, { sizes: "140px" });
      t.setAttribute("aria-label", "View " + (photo ? photo.alt : "result for " + a.contest));
      li.appendChild(t);
    } else li.appendChild(document.createElement("span"));

    const body = document.createElement("div");
    body.innerHTML = '<h3 class="award__contest"></h3><p class="award__result"></p><p class="award__meta"></p><div class="award__links"></div>';
    body.children[0].textContent = a.contest;
    body.children[1].textContent = a.result;
    if (a.tier === "honor") body.children[1].classList.add("award__result--top");
    const meta = [a.date && S.day(a.date), a.entries && a.entries.toLocaleString("en-US") + " entries", a.rank && "Ranked " + ordinal(a.rank)].filter(Boolean).join(", ");
    if (meta) body.children[2].textContent = meta; else body.children[2].remove();
    const links = body.querySelector(".award__links");
    const add = (text, i) => { const b = document.createElement("button"); b.type = "button"; b.textContent = text; b.addEventListener("click", () => S.viewer.open(slides, i, b)); links.appendChild(b); };
    if (photo) add("Photo", 0);
    if (proof) add(a.organizer === "tpa" ? "Certificate" : "Result", slides.length - 1);
    li.appendChild(body);
    return li;
  }

  function render(json, d) {
    const list = json.awards;
    const ranks = list.filter((a) => a.rank).map((a) => a.rank);
    const dated = list.filter((a) => a.date).map((a) => a.date).sort();
    stats.replaceChildren(...[
      [list.length, "contest results"],
      [list.filter((a) => /Expert Choice/.test(a.result)).length, "Expert Choice awards"],
      [ranks.length && ordinal(Math.min(...ranks)), "best crowd ranking"],
      [dated.length && dated[0].slice(0, 4), "first recognition"],
    ].filter((x) => x[0]).map(([v, l]) => {
      const div = document.createElement("div");
      div.className = "stat";
      div.innerHTML = "<strong></strong><span></span>";
      div.firstChild.textContent = v; div.lastChild.textContent = l;
      return div;
    }));

    root.replaceChildren(...ORDER.map((key) => {
      const org = json.organizers[key];
      const items = list.filter((a) => a.organizer === key);
      const sec = document.createElement("section");
      sec.className = "org";
      sec.setAttribute("aria-labelledby", "org-" + key);
      sec.innerHTML = '<div class="org__head"><h2 class="heading" id="org-' + key + '"></h2><p></p></div><ol class="org__list"></ol>';
      sec.querySelector("h2").textContent = org.name;
      sec.querySelector("p").textContent = org.note + " " + (items.length === 1 ? "1 result." : items.length + " results.");
      sec.querySelector("ol").append(...items.map((a) => row(a, org, d)));
      return sec;
    }));
    root.setAttribute("aria-busy", "false");
  }

  function init() {
    errorState.hidden = true;
    Promise.all([fetch("data/awards.json").then((r) => { if (!r.ok) throw 0; return r.json(); }), S.data()])
      .then(([j, d]) => render(j, d))
      .catch(() => { root.setAttribute("aria-busy", "false"); errorState.hidden = false; });
  }
  errorState.querySelector("button").addEventListener("click", init);
  init();
})();
