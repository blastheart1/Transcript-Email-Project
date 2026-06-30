"use client";

import { useEffect } from "react";

/**
 * Global hover/focus tooltip driven by `data-tip` attributes, ported from the
 * design prototype. Mount once near the app root. Elements opt in with
 * `data-tip="text"` and optionally `data-tip-down` to flip below.
 */
export function useTooltips() {
  useEffect(() => {
    let tip = document.getElementById("relay-tip");
    if (!tip) {
      tip = document.createElement("div");
      tip.id = "relay-tip";
      document.body.appendChild(tip);
    }
    const el = tip;
    let activeEl: Element | null = null;

    const place = (target: HTMLElement) => {
      const text = target.getAttribute("data-tip");
      if (!text) {
        hide();
        return;
      }
      el.textContent = text;
      const down = target.hasAttribute("data-tip-down");
      const r = target.getBoundingClientRect();
      el.style.opacity = "0";
      el.setAttribute("data-show", "1");
      const tr = el.getBoundingClientRect();
      let left = r.left + r.width / 2;
      const half = tr.width / 2 + 8;
      left = Math.max(half, Math.min(window.innerWidth - half, left));
      el.style.left = `${left}px`;
      if (down) {
        el.style.top = `${r.bottom + 9}px`;
        el.style.transform = "translate(-50%,0)";
      } else {
        el.style.top = `${r.top - 9}px`;
        el.style.transform = "translate(-50%,-100%)";
      }
      el.style.opacity = "1";
    };

    const hide = () => {
      activeEl = null;
      el.removeAttribute("data-show");
      el.style.opacity = "0";
    };

    const onShow = (e: Event) => {
      const t = e.target as HTMLElement;
      const found = t.closest?.("[data-tip]") as HTMLElement | null;
      if (found && found !== activeEl) {
        activeEl = found;
        place(found);
      }
    };
    const onHide = (e: Event) => {
      const t = e.target as HTMLElement;
      const found = t.closest?.("[data-tip]");
      if (found && found === activeEl) hide();
    };

    document.addEventListener("mouseover", onShow);
    document.addEventListener("mouseout", onHide);
    document.addEventListener("focusin", onShow);
    document.addEventListener("focusout", onHide);
    window.addEventListener("scroll", hide, true);
    document.addEventListener("mousedown", hide);

    return () => {
      document.removeEventListener("mouseover", onShow);
      document.removeEventListener("mouseout", onHide);
      document.removeEventListener("focusin", onShow);
      document.removeEventListener("focusout", onHide);
      window.removeEventListener("scroll", hide, true);
      document.removeEventListener("mousedown", hide);
      if (el.parentNode) el.parentNode.removeChild(el);
    };
  }, []);
}
