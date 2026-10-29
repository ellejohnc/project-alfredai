/**
 * One visitor id, shared by demo engagement events and demo lead capture.
 *
 * The Demo pages were designed around engagement — watch time, steps
 * completed, what they viewed — but none of it could be reported, because
 * `demo_engagement` rows and `leads` rows had no field in common. Events knew
 * a visitor; leads did not. That is the missing join, and it is why the
 * Started / Engaged / Completed tiles could not be computed at all.
 *
 * Deliberately the same localStorage key the demo view tracker already used,
 * so visitors who have been here before keep their existing id and their
 * history joins up rather than starting over.
 */
const KEY = 'alfred_visitor_id';

export function getVisitorId(): string {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    // Private mode / storage disabled: return a per-page id so events still
    // carry something, rather than throwing inside a tracking call.
    return `v_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}

export function getDeviceType(): string {
  const width = typeof window === 'undefined' ? 1280 : window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}
