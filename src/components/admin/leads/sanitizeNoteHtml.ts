/** Strips a pasted note down to markup we are willing to render. */

/**
 * Sanitize a note/rich-text value for safe rendering.
 *
 * Reuses the shared `sanitizePastedHtml` sanitizer (strips inline styles,
 * framework class attributes, scripts, event handlers and unsafe URLs; unwraps
 * span/div; collapses empty <p>). We then force every link to open safely with
 * rel="noopener noreferrer nofollow".
 */
import { sanitizePastedHtml } from '@/utils/sanitizePastedHtml';

export function sanitizeNoteHtml(value: string): string {
  let html = sanitizePastedHtml(value);
  // sanitizePastedHtml already sets rel="noopener noreferrer" on links — extend
  // it with nofollow (never duplicate if it's somehow already present).
  html = html.replace(/rel="noopener noreferrer"/g, 'rel="noopener noreferrer nofollow"');
  return html;
}

/**
 * Renders a note / notes-history / GHL-note value.
 *  - HTML content → sanitized, formatted (safe links, no raw tags/styles).
 *  - Plain text   → shown as-is with line breaks preserved.
 * Never renders unsanitized HTML (XSS-safe).
 */
