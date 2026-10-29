/**
 * Normalize a text blob so it renders as readable multi-line content.
 *
 * Some upstream sources (email-reply ingestion, CSV pastes, JSON-encoded
 * message fields) store newlines as the literal two-character sequence
 * "\n" (backslash + n) instead of a real newline. Rendering that with
 * `whitespace-pre-wrap` shows the escape sequence to the user as an
 * unreadable blob.
 *
 * This helper:
 *  - unescapes literal "\r\n", "\n", "\r", "\t" sequences into real chars,
 *  - normalises CRLF/CR to LF,
 *  - trims outer whitespace,
 *  - collapses runs of 3+ blank lines down to a single blank line
 *    (so already-formatted messages don't double-space).
 *
 * Safe on plain one-line messages (returns them as-is, just trimmed) and on
 * messages that already contain real newlines (no double-spacing).
 */
export function normalizeMultilineText(input: unknown): string {
  if (input === null || input === undefined) return '';
  let s = typeof input === 'string' ? input : String(input);
  // Unescape common literal escape sequences (only when they appear as the
  // 2-char "\n" form — real newlines are left alone).
  s = s.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').replace(/\\r/g, '\n').replace(/\\t/g, '\t');
  // Normalise line endings.
  s = s.replace(/\r\n?/g, '\n');
  // Collapse 3+ consecutive newlines to just 2 (one blank line max).
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}
