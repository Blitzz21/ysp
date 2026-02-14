"use client";

import { useEffect } from "react";

function markButtonPending(button: HTMLButtonElement | HTMLInputElement) {
  if (button.disabled) return;
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  button.setAttribute("data-submitting", "true");
}

export function SubmitGuard() {
  useEffect(() => {
    const onSubmit = (event: Event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.hasAttribute("data-no-submit-guard")) return;

      const buttons = form.querySelectorAll<HTMLButtonElement | HTMLInputElement>(
        "button[type='submit'], button:not([type]), input[type='submit']"
      );
      buttons.forEach(markButtonPending);
    };

    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, []);

  return null;
}
