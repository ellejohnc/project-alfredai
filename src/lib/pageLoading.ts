/**
 * Shared flag for "the page-level loader is on screen".
 *
 * The page loader renders as a Suspense fallback OUTSIDE the routed content,
 * while the back button renders in the app shell. The shell therefore has no
 * React signal that a fallback is showing — this tiny store provides one, so
 * the back button can hide itself while the loader is visible (a bare loader
 * must never carry navigation chrome).
 */
let value = false;
const listeners = new Set<() => void>();

export function setPageLoading(next: boolean) {
  if (next === value) return;
  value = next;
  listeners.forEach((listener) => listener());
}

export const pageLoadingStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  get: () => value,
};
