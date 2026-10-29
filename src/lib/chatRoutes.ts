/**
 * Where the Alfred chat assistant is available.
 *
 * ONE list, because there were briefly two.
 *
 * App.tsx decides whether to MOUNT `<ChatAssistant>` at all, from a set of route
 * flags. Header.tsx then grew its own copy of the same list to decide whether to
 * SHOW the button that opens it. They agreed on the day they were written, which
 * is the only day two hand-copied lists ever agree — and the failure is silent
 * in the worst direction: add a route to App's list and the header button keeps
 * rendering, `openAssistant()` sets the state, nothing is mounted to read it,
 * and the button does nothing at all when clicked.
 *
 * That is the same shape as the peek and the record drifting apart with two
 * copies of "what is this lead", and the fix is the same one: a single exported
 * predicate that both surfaces call.
 *
 * Note this is deliberately NOT the same question as "is the chat open" or "is
 * this mobile" — only "does this page carry the assistant at all".
 */

/** Route prefixes and exact paths where the assistant is deliberately absent. */
const PREFIXES = ['/admin', '/demos/', '/proposal/', '/partners/portal'] as const;
const EXACT = [
  '/investors',
  '/explained/pricing/diy-quote',
  '/book',
  '/resources/webinars/agenticbusiness',
] as const;

/**
 * True when the assistant is mounted on this route, and therefore when a button
 * offering to open it will actually do something.
 */
export function isChatAvailable(pathname: string): boolean {
  if (EXACT.includes(pathname as (typeof EXACT)[number])) return false;
  return !PREFIXES.some((p) => pathname.startsWith(p));
}
