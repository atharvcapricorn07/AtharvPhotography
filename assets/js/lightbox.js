// Shared photo viewer. Site.lightbox.open(items, index, trigger), where items are { src, alt }.
(function () {
  const Site = (window.Site = window.Site || {});

  const ICONS = {
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  };

  let dialog, img, counter, prevBtn, nextBtn, closeBtn;
  let items = [];
  let index = 0;
  let trigger = null;

  function build() {
    dialog = document.createElement("dialog");
    dialog.className = "lightbox";
    dialog.setAttribute("aria-label", "Photo viewer");
    dialog.innerHTML =
      '<button class="lightbox__btn lightbox__close" type="button" aria-label="Close">' + ICONS.close + "</button>" +
      '<p class="lightbox__counter" aria-live="polite"></p>' +
      '<div class="lightbox__stage"><img class="lightbox__img" alt="" decoding="async"></div>' +
      '<button class="lightbox__btn lightbox__prev" type="button" aria-label="Previous photo">' + ICONS.prev + "</button>" +
      '<button class="lightbox__btn lightbox__next" type="button" aria-label="Next photo">' + ICONS.next + "</button>";
    document.body.appendChild(dialog);

    img = dialog.querySelector(".lightbox__img");
    counter = dialog.querySelector(".lightbox__counter");
    prevBtn = dialog.querySelector(".lightbox__prev");
    nextBtn = dialog.querySelector(".lightbox__next");
    closeBtn = dialog.querySelector(".lightbox__close");

    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", () => step(-1));
    nextBtn.addEventListener("click", () => step(1));

    img.addEventListener("load", () => {
      img.classList.remove("is-loading");
      if (items.length > 1) new Image().src = items[(index + 1) % items.length].src;
    });

    // Escape fires "cancel"; route it through close() so cleanup always runs.
    dialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      close();
    });

    dialog.addEventListener("click", (e) => {
      if (e.target === dialog || e.target.classList.contains("lightbox__stage")) close();
      else if (e.target === img && !insideRenderedImage(e)) close();
    });

    dialog.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
      else if (e.key === "Tab") trapFocus(e);
    });

    let startX = 0, startY = 0, tracking = false;
    dialog.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return (tracking = false);
      tracking = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });
    dialog.addEventListener("touchend", (e) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  // object-fit: contain leaves letterbox space inside the <img>; clicks there count as backdrop clicks.
  function insideRenderedImage(e) {
    if (!img.naturalWidth) return true;
    const box = img.getBoundingClientRect();
    const scale = Math.min(box.width / img.naturalWidth, box.height / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const left = box.left + (box.width - w) / 2;
    const top = box.top + (box.height - h) / 2;
    return e.clientX >= left && e.clientX <= left + w && e.clientY >= top && e.clientY <= top + h;
  }

  function trapFocus(e) {
    const focusable = Array.from(dialog.querySelectorAll("button")).filter((b) => !b.hidden);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function show(i) {
    index = (i + items.length) % items.length;
    const photo = items[index];
    if (img.getAttribute("src") !== photo.src) {
      img.classList.add("is-loading");
      img.src = photo.src;
    }
    img.alt = photo.alt;
    counter.textContent = index + 1 + " of " + items.length;
  }

  function step(delta) {
    if (items.length > 1) show(index + delta);
  }

  function open(list, i, from) {
    if (!dialog) build();
    items = list;
    trigger = from || document.activeElement;
    const multiple = items.length > 1;
    prevBtn.hidden = !multiple;
    nextBtn.hidden = !multiple;
    show(i);
    document.documentElement.classList.add("is-locked");
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    closeBtn.focus();
  }

  function close() {
    if (!dialog || !dialog.open) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
    document.documentElement.classList.remove("is-locked");
    if (trigger && document.contains(trigger)) trigger.focus();
  }

  Site.lightbox = { open, close };
})();
