// Awards: first 6 from data.awards, then an expand control reveals the rest. Opens in the lightbox.
(function () {
  const { photos, lightbox, reveal } = window.Site;

  const INITIAL_COUNT = 6;

  const grid = document.querySelector("[data-awards]");
  const footer = document.querySelector("[data-awards-footer]");
  const expand = document.querySelector("[data-expand]");
  const errorState = document.querySelector('[data-state="error"]');

  let awards = [];

  function render(from, to) {
    const items = awards.slice(from, to).map((photo, i) => {
      const li = document.createElement("li");
      li.setAttribute("data-reveal", "");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "photo lift";
      btn.setAttribute("aria-label", "Open " + photo.alt);
      btn.appendChild(photos.image(photo, { onError: () => li.remove() }));
      btn.addEventListener("click", () => lightbox.open(awards, from + i, btn));
      li.appendChild(btn);
      grid.appendChild(li);
      return btn;
    });
    reveal(grid);
    return items;
  }

  function init() {
    errorState.hidden = true;
    photos
      .load()
      .then((data) => {
        awards = photos.list(data, "awards");
        grid.innerHTML = "";
        grid.setAttribute("aria-busy", "false");
        render(0, INITIAL_COUNT);
        if (awards.length > INITIAL_COUNT) {
          expand.textContent = "Show All " + awards.length + " Awards";
          footer.hidden = false;
        }
      })
      .catch((err) => {
        console.warn("Could not load photos.json:", err);
        grid.innerHTML = "";
        grid.setAttribute("aria-busy", "false");
        errorState.hidden = false;
      });
  }

  expand.addEventListener("click", () => {
    const added = render(INITIAL_COUNT, awards.length);
    footer.hidden = true;
    if (added[0]) added[0].focus();
  });
  errorState.querySelector("[data-retry]").addEventListener("click", init);

  init();
})();
