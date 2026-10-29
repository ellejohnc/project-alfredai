import { useCallback, useRef, useState } from 'react';

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.6;
const INTENSITY = 0.0018;

const clamp = (v: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v));

/**
 * Ctrl/Cmd + mouse wheel zoom for a scrollable panel (tables, schedules).
 * Uses delta-magnitude scaling so a single trackpad flick doesn't slam to the
 * clamp, and a native non-passive listener so preventDefault actually works
 * (React's onWheel is passive) — that stops the browser page zoom.
 *
 * Fallback: if the ref never attaches, zoom simply stays at 1 and the panel
 * behaves exactly as before.
 */
export function useCtrlWheelZoom(storageKey?: string) {
  
  const [zoom, setZoom] = useState<number>(() => {
    if (!storageKey || typeof window === 'undefined') return 1;
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? clamp(parsed) : 1;
  });

  const persist = useCallback(
    (value: number) => {
      if (!storageKey || typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(storageKey, String(value));
      } catch {
        /* storage unavailable — zoom still works for this session */
      }
    },
    [storageKey]
  );

  const applyZoom = useCallback(
    (next: number) => {
      const value = clamp(Number(next.toFixed(3)));
      setZoom(value);
      persist(value);
    },
    [persist]
  );

  const zoomIn = useCallback(() => applyZoom(zoom * 1.1), [applyZoom, zoom]);
  const zoomOut = useCallback(() => applyZoom(zoom / 1.1), [applyZoom, zoom]);
  const resetZoom = useCallback(() => applyZoom(1), [applyZoom]);

  // `persist` changes identity when storageKey changes; keep it in a ref so the
  // callback ref below can have empty deps and therefore a stable identity —
  // otherwise React would detach and re-attach the listener on every render.
  const persistRef = useRef(persist);
  persistRef.current = persist;

  const detachRef = useRef<(() => void) | null>(null);

  /**
   * Callback ref rather than an effect.
   *
   * The zoom container is rendered inside the "loaded" branch, so it does not
   * exist on first render. An effect would run once against a null ref and
   * never re-run, which is why the wheel gesture silently did nothing. A
   * callback ref fires exactly when the node attaches and again when it
   * detaches, so the listener binds no matter how late the table appears.
   */
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    detachRef.current?.();
    detachRef.current = null;
    if (!node) return;

    const onWheel = (e: WheelEvent) => {
      // Trackpad pinch also arrives as wheel + ctrlKey.
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      setZoom((prev) => {
        const value = clamp(Number((prev * Math.exp(-dy * INTENSITY)).toFixed(3)));
        persistRef.current(value);
        return value;
      });
    };

    // Non-passive so preventDefault actually suppresses browser page zoom.
    node.addEventListener('wheel', onWheel, { passive: false });
    detachRef.current = () => node.removeEventListener('wheel', onWheel);
  }, []);


  return { containerRef, zoom, zoomIn, zoomOut, resetZoom, isZoomed: zoom !== 1 };
}
