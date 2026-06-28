"use client";

import { useEffect } from "react";

/**
 * Registers the service worker once on the client. Kept tiny and silent —
 * registration failures (e.g. during local http dev) are non-fatal.
 */
export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          /* ignore — app still works without offline support */
        });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
