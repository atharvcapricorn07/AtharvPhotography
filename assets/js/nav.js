// Header hairline on scroll, compact menu, and footer year.
(function () {
  const header = document.querySelector(".site-header");
  const button = document.querySelector(".menu-button");
  const nav = document.getElementById("site-nav");
  const compact = window.matchMedia("(max-width: 719px)");
  const background = [document.querySelector("main"), document.querySelector(".site-footer")].filter(Boolean);

  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  if (!button || !nav) return;

  function setOpen(open, restoreFocus) {
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("is-open", open);
    document.documentElement.classList.toggle("menu-open", open);
    background.forEach((el) => (el.inert = open));
    if (open) {
      const first = nav.querySelector("a");
      if (first) first.focus();
    } else if (restoreFocus) {
      button.focus();
    }
  }

  const isOpen = () => button.getAttribute("aria-expanded") === "true";

  button.addEventListener("click", () => setOpen(!isOpen(), true));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) setOpen(false, true);
  });

  nav.addEventListener("click", (e) => {
    if (e.target.closest("a") && isOpen()) setOpen(false, false);
  });

  compact.addEventListener("change", (e) => {
    if (!e.matches && isOpen()) setOpen(false, false);
  });
})();
