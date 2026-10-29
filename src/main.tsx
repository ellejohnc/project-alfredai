import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/motion-fallbacks.css";
import "@fontsource/figtree/400.css";
import "@fontsource/figtree/500.css";
import "@fontsource/figtree/600.css";
import "@fontsource/outfit/500.css";
import "@fontsource/outfit/600.css";
import "@fontsource/outfit/700.css";

// Service worker can cause stale chunk caching in preview environments.
// That can lead to React hook internals being `null` (multiple React copies).
const isLovablePreviewHost =
  /^id-preview--/i.test(window.location.hostname) ||
  /\.lovableproject\.com$/i.test(window.location.hostname);
const shouldUseServiceWorker = import.meta.env.PROD && !isLovablePreviewHost;

const clearPreviewServiceWorker = async () => {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (error) {
    console.warn("[SW] Preview cleanup failed:", error);
  }
};

if ("serviceWorker" in navigator) {
  if (!shouldUseServiceWorker) {
    void clearPreviewServiceWorker();
  }

  window.addEventListener("load", async () => {
    try {
      if (!shouldUseServiceWorker) {
        // Proactively remove any existing SW + caches for this origin.
        await clearPreviewServiceWorker();
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("[SW] Registered:", registration.scope);

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 30 * 60 * 1000); // Every 30 minutes
    } catch (error) {
      console.warn("[SW] Registration failed:", error);
    }
  });
}

// Show scrollbar only while scrolling
let scrollTimeout: number;
const handleScroll = () => {
  document.documentElement.classList.add("is-scrolling");
  clearTimeout(scrollTimeout);
  scrollTimeout = window.setTimeout(() => {
    document.documentElement.classList.remove("is-scrolling");
  }, 1000);
};
window.addEventListener("scroll", handleScroll, { passive: true });

// After a deploy, an open page may request files that no longer exist
// (Safari: "Importing a module script failed"). Reload once to pick up the new build.
window.addEventListener("vite:preloadError", (event) => {
  try {
    const key = "chunk-reload-at";
    const last = Number(sessionStorage.getItem(key) || 0);
    if (Date.now() - last > 30_000) {
      sessionStorage.setItem(key, String(Date.now()));
      event.preventDefault();
      window.location.reload();
    }
  } catch {
    /* fall through to the error screen */
  }
});

// Back/forward can restore a frozen snapshot of an earlier visit (the browser's
// back-forward cache), showing an outdated page after an update. Reload so the
// visitor always sees the current version.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) window.location.reload();
});

createRoot(document.getElementById("root")!).render(<App />);
