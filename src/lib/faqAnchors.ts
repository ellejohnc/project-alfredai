// Shared helpers for FAQ deep-link anchors.
// Used by /faq and the homepage KeywordFAQSection so any hash URL
// (e.g. /faq#how-much-does-construction-estimating-software-cost)
// scrolls to and auto-expands the matching question.

import { useEffect, useState } from "react";

export const slugifyQuestion = (q: string): string =>
  q
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

/**
 * Controls a shadcn <Accordion type="single"> from the URL hash.
 * - Opens the item whose `value` matches the hash on mount and on hashchange.
 * - Smoothly scrolls the matching element into view (accounting for fixed header).
 * - Returns [openValue, setOpenValue] so the caller can also handle manual clicks.
 *
 * Fallback: if the hash doesn't match any known value, nothing opens and the
 * page renders normally — no error, no broken scroll.
 */
export function useHashAccordion(validValues: string[]): [
  string | undefined,
  (v: string | undefined) => void,
] {
  const [openValue, setOpenValue] = useState<string | undefined>(undefined);

  useEffect(() => {
    const resolve = () => {
      if (typeof window === "undefined") return;
      const raw = window.location.hash.replace(/^#/, "");
      if (!raw) return;
      const target = decodeURIComponent(raw).toLowerCase();
      if (!validValues.includes(target)) return;

      setOpenValue(target);

      // Wait a tick so the accordion content renders before scrolling
      window.requestAnimationFrame(() => {
        const el = document.getElementById(target);
        if (!el) return;
        const headerOffset = 96; // sticky header height
        const rect = el.getBoundingClientRect();
        const top = rect.top + window.scrollY - headerOffset;
        window.scrollTo({ top, behavior: "smooth" });
        // Move focus for accessibility / keyboard users
        const trigger = el.querySelector<HTMLElement>('[data-state][role="button"], button');
        trigger?.focus({ preventScroll: true });
      });
    };

    resolve();
    window.addEventListener("hashchange", resolve);
    return () => window.removeEventListener("hashchange", resolve);
    // validValues is stable per render; intentional dep
  }, [validValues.join("|")]);

  return [openValue, setOpenValue];
}
