// Contact: inline validation and an in-page send through Formspree. Without JS the form posts normally.
(function () {
  "use strict";
  const form = document.getElementById("contact-form");
  if (!form || !window.fetch) return;

  const success = document.querySelector('[data-status="success"]');
  const failure = document.querySelector('[data-status="error"]');
  const submit = form.querySelector('[type="submit"]');
  const submitLabel = submit.textContent;

  const RULES = {
    name: (v) => (v.trim() ? "" : "Enter your name."),
    _replyto: (v, el) => (!v.trim() ? "Enter your email address." : el.validity.typeMismatch ? "Enter an email address like name@example.com." : ""),
    message: (v) => (v.trim().length >= 10 ? "" : v.trim() ? "Add a little more detail so I can reply properly." : "Enter a message."),
  };
  const fields = Array.from(form.elements).filter((el) => RULES[el.name]);
  form.noValidate = true;

  // Preselect the inquiry type from a link such as contact.html?type=Car%20shoot
  const type = new URLSearchParams(location.search).get("type");
  if (type && form.elements.type) form.elements.type.value = type;

  function check(el) {
    const message = RULES[el.name](el.value, el);
    const error = document.getElementById(el.id + "-error");
    el.setAttribute("aria-invalid", String(Boolean(message)));
    error.textContent = message;
    error.hidden = !message;
    return !message;
  }

  fields.forEach((el) => {
    el.addEventListener("blur", () => { if (el.value || el.dataset.touched) check(el); el.dataset.touched = "1"; });
    el.addEventListener("input", () => { if (el.getAttribute("aria-invalid") === "true") check(el); });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const invalid = fields.filter((el) => !check(el));
    if (invalid.length) { invalid[0].focus(); return; }

    success.hidden = failure.hidden = true;
    submit.disabled = true;
    submit.textContent = "Sending…";

    fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
      .then((res) => {
        if (!res.ok) throw new Error("Formspree " + res.status);
        form.reset();
        fields.forEach((el) => { el.removeAttribute("aria-invalid"); delete el.dataset.touched; });
        success.hidden = false;
        success.focus();
      })
      .catch(() => { failure.hidden = false; failure.focus(); })
      .finally(() => { submit.disabled = false; submit.textContent = submitLabel; });
  });
})();
