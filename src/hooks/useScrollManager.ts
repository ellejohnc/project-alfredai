/**
 * Shared scroll manager — single rAF-backed scroll listener.
 * Components subscribe via useScrollManager() instead of attaching
 * their own window scroll listeners.
 */

type ScrollCallback = (scrollY: number, maxScroll: number) => void;

const subscribers = new Set<ScrollCallback>();
let ticking = false;
let listening = false;

function onScroll() {
  if (!ticking) {
    requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      subscribers.forEach(cb => cb(scrollY, maxScroll));
      ticking = false;
    });
    ticking = true;
  }
}

function ensureListening() {
  if (!listening && typeof window !== 'undefined') {
    window.addEventListener('scroll', onScroll, { passive: true });
    listening = true;
  }
}

function maybeStopListening() {
  if (listening && subscribers.size === 0) {
    window.removeEventListener('scroll', onScroll);
    listening = false;
  }
}

export function subscribeScroll(cb: ScrollCallback): () => void {
  ensureListening();
  subscribers.add(cb);
  // Fire immediately so subscriber gets current value
  const scrollY = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  cb(scrollY, maxScroll);
  return () => {
    subscribers.delete(cb);
    maybeStopListening();
  };
}
