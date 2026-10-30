// Contact: inline validation and an in-page send via Formspree. Without JS the form posts normally.
(function () {
  const form = document.getElementById("contact-form");
  if (!form || !window.fetch) return;

  const success = document.querySelector('[data-status="success"]');
  const failure = document.querySelector('[data-status="error"]');
  const submit = form.querySelector('[type="submit"]');
  const submitLabel = submit.textContent;

  const RULES = {
    name: (v) => (v.trim() ? "" : "Enter your name."),
    _replyto: (v, el) =>
      !v.trim() ? "Enter your email address." : el.validity.typeMismatch ? "Enter a valid email address, like name@example.com." : "",
    message: (v) => (v.trim() ? "" : "Enter a message."),
  };

  const fields = Array.from(form.elements).filter((el) => RULES[el.name]);

  form.noValidate = true;

  function check(el) {
    const message = RULES[el.name](el.value, el);
    const error = document.getElementById(el.getAttribute("aria-describedby"));
    el.setAttribute("aria-invalid", String(Boolean(message)));
    error.querySelector("span").textContent = message;
    error.hidden = !message;
    return !message;
  }

  fields.forEach((el) => {
    el.addEventListener("blur", () => {
      if (el.value || el.dataset.touched) check(el);
      el.dataset.touched = "1";
    });
    el.addEventListener("input", () => {
      if (el.getAttribute("aria-invalid") === "true") check(el);
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const invalid = fields.filter((el) => !check(el));
    if (invalid.length) {
      invalid[0].focus();
      return;
    }

    success.hidden = true;
    failure.hidden = true;
    submit.disabled = true;
    submit.textContent = "Sending…";

    fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Formspree returned " + res.status);
        form.reset();
        fields.forEach((el) => {
          el.removeAttribute("aria-invalid");
          delete el.dataset.touched;
        });
        success.hidden = false;
        success.focus();
      })
      .catch((err) => {
        console.warn("Contact form failed:", err);
        failure.hidden = false;
        failure.focus();
      })
      .finally(() => {
        submit.disabled = false;
        submit.textContent = submitLabel;
      });
  });
})();
