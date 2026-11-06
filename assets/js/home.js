// Home content below the intro: the hung photographs open in the viewer, and the record line stays
// in step with data/awards.json. Without JS the photographs link to the gallery and the line stands.
(function () {
  "use strict";
  const S = window.Site;
  const wall = document.querySelector("[data-wall]");
  const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

  S.data().then((d) => {
    const links = Array.from(wall.querySelectorAll("[data-photo]"));
    const slides = links.map((a) => S.slide(d.find(a.dataset.photo)));
    links.forEach((a, i) => a.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      S.viewer.open(slides, i, a);
    }));
  }).catch(() => {});

  fetch("data/awards.json").then((r) => r.json()).then((j) => {
    const expert = j.awards.filter((a) => /Expert Choice/.test(a.result)).length;
    document.querySelector("[data-record]").textContent = j.awards.length + " contest results, including " + (WORDS[expert] || expert) + " Expert Choice awards.";
  }).catch(() => {});
})();
