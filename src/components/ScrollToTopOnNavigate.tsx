import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const STORE = "scroll-positions";
const read = (): Record<string, number> => {
  try { return JSON.parse(sessionStorage.getItem(STORE) || "{}"); } catch { return {}; }
};
const positions = {
  get: (k: string) => read()[k],
  set: (k: string, y: number) => {
    try { sessionStorage.setItem(STORE, JSON.stringify({ ...read(), [k]: y })); } catch { /* storage off */ }
  },
};

/**
 * New pages open at the top; going Back/Forward returns to the exact vertical
 * position the visitor left that page at.
 */
export default function ScrollToTopOnNavigate() {
  const location = useLocation();
  const navType = useNavigationType();
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
  }, []);

  // Save the position of the page being left.
  useEffect(() => {
    const key = location.key;
    const save = () => positions.set(key, window.scrollY);
    window.addEventListener("scroll", save, { passive: true });
    // No save on cleanup: by then the next page has already reset the scroll.
    return () => window.removeEventListener("scroll", save);
  }, [location.key]);

  useLayoutEffect(() => {
    const saved = navType === "POP" ? positions.get(location.key) : undefined;
    const pathChanged = prevPath.current !== location.pathname;
    prevPath.current = location.pathname;
    if (saved === undefined) {
      if (pathChanged && !location.hash) window.scrollTo(0, 0);
      return;
    }
    // Lazy pages render after a moment — retry until the page is tall enough.
    let tries = 0;
    let id = 0;
    const restore = () => {
      window.scrollTo(0, saved);
      if (Math.abs(window.scrollY - saved) > 2 && tries++ < 30) id = window.setTimeout(restore, 50);
    };
    restore();
    return () => window.clearTimeout(id);
  }, [location.key, navType]);

  return null;
}
