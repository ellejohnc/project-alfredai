import { useEffect, useSyncExternalStore } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { pageLoadingStore } from "@/lib/pageLoading";

/** Paths that never show the back row. */
const EXCLUDED = [/^\/$/, /^\/book$/, /^\/admin/, /^\/home-legacy$/, /^\/index$/];

/** Parent path used when there is no in-app history to go back to. */
export function parentPath(pathname: string): string {
  const parts = pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  parts.pop();
  return parts.length ? `/${parts.join("/")}` : "/";
}

export function showsBackButton(pathname: string): boolean {
  return !EXCLUDED.some((r) => r.test(pathname));
}

/**
 * Back button on every public subpage. Anchored to the PAGE, not to the screen:
 * it sits in the document just below the menu bar and scrolls away with the
 * content instead of floating over the page while you read.
 *
 * Alignment follows the site's padding and spacing law — the same gutter as
 * every other block (.container-wide: 16 / 24 / 32px) and an 8px rhythm below
 * the menu bar. The page itself reserves the room (html[data-back-row] in
 * index.css), so the row never lands on top of a page's eyebrow label.
 */
export default function SubpageBackButton() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const show = showsBackButton(pathname);
  // While the page-level loader (Suspense fallback) is on screen, the back
  // row hides with it — a bare loading screen carries no navigation chrome.
  const pageLoading = useSyncExternalStore(
    pageLoadingStore.subscribe,
    pageLoadingStore.get
  );
  const visible = show && !pageLoading;

  // Runs before any early return — a hook after a guard is a runtime crash.
  useEffect(() => {
    if (!visible) return;
    document.documentElement.dataset.backRow = "on";
    return () => {
      delete document.documentElement.dataset.backRow;
    };
  }, [visible]);

  if (!visible) return null;

  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate(parentPath(pathname));
  };

  return (
    // Absolute (not fixed): the row belongs to the page and scrolls with it.
    // Nothing above it is positioned, so it resolves against the document.
    <div className="pointer-events-none absolute inset-x-0 top-[calc(var(--header-height,76px)+1rem)] z-40">
      <div className="container-wide">
        <button
          type="button"
          onClick={goBack}
          aria-label="Go back to the previous page"
          className="pointer-events-auto inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-border bg-background/90 px-3.5 text-sm font-medium text-foreground shadow-sm backdrop-blur touch-manipulation transition-colors hover:bg-muted active:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          <span>Back</span>
        </button>
      </div>
    </div>
  );
}
