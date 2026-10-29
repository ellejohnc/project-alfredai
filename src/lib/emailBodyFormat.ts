/**
 * GHL returns email messages as a plain-text dump of the rendered HTML: the
 * subject is repeated as the first line, every hyperlink becomes
 * `label\n[https://link.msgsndr.com/email-tracking/...]`, and an unsubscribe
 * footer is appended. Rendered raw, that's an unreadable wall of tracking URLs.
 *
 * `parseEmailBody` turns it back into readable paragraphs with real links.
 */

export type EmailSegment =
  | { kind: 'text'; text: string }
  | { kind: 'link'; label: string; href: string };

export interface ParsedEmailBody {
  /** Paragraphs, each a list of text/link segments. */
  paragraphs: EmailSegment[][];
  /** True when an unsubscribe/tracking footer was trimmed off. */
  footerTrimmed: boolean;
}

const UNSUBSCRIBE_RE = /if you no longer wish to receive these emails[\s\S]*$/i;
const URL_RE = /https?:\/\/[^\s<>()\]]+/gi;

/** Shorten a URL for display: host + first path chunk. */
export function linkLabel(href: string): string {
  try {
    const u = new URL(href);
    const path = u.pathname.replace(/\/$/, '');
    const short = path.length > 24 ? `${path.slice(0, 24)}…` : path;
    return `${u.host.replace(/^www\./, '')}${short}`;
  } catch {
    return href.length > 48 ? `${href.slice(0, 48)}…` : href;
  }
}

function segmentsFromText(text: string): EmailSegment[] {
  const segs: EmailSegment[] = [];
  let last = 0;
  for (const match of text.matchAll(URL_RE)) {
    const idx = match.index ?? 0;
    if (idx > last) segs.push({ kind: 'text', text: text.slice(last, idx) });
    const href = match[0].replace(/[.,;:]+$/, '');
    segs.push({ kind: 'link', label: linkLabel(href), href });
    last = idx + match[0].length;
  }
  if (last < text.length) segs.push({ kind: 'text', text: text.slice(last) });
  return segs.filter((s) => s.kind === 'link' || s.text.length > 0);
}

export function parseEmailBody(raw: string, subject?: string | null): ParsedEmailBody {
  let body = (raw || '').replace(/\r\n/g, '\n').trim();

  const footerTrimmed = UNSUBSCRIBE_RE.test(body);
  body = body.replace(UNSUBSCRIBE_RE, '').trim();

  // Drop a leading line that just repeats the subject.
  const firstBreak = body.indexOf('\n');
  const firstLine = (firstBreak === -1 ? body : body.slice(0, firstBreak)).trim();
  if (subject && firstLine && firstLine.toLowerCase() === subject.trim().toLowerCase()) {
    body = firstBreak === -1 ? '' : body.slice(firstBreak + 1).trim();
  }

  // `label\n[href]` (or `label [href]`) → a single labelled link. Tracking URLs
  // are what sits inside the brackets, so the label is always the useful text.
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map<EmailSegment[]>((para) => {
      const segs: EmailSegment[] = [];
      const bracketed = /\[\s*(https?:\/\/[^\]]+?)\s*\]/g;
      let cursor = 0;
      for (const m of para.matchAll(bracketed)) {
        const idx = m.index ?? 0;
        let before = para.slice(cursor, idx);
        const href = m[1].trim();

        // The visible label sits immediately before the bracketed tracking URL
        // — usually the tail of the previous line ("Linkedin", "unsubscribe")
        // or a plain URL on its own line. Lift it out and use it as the anchor.
        const trimmedBefore = before.replace(/\s+$/, '');
        let lastLine = trimmedBefore.slice(trimmedBefore.lastIndexOf('\n') + 1).trim();
        let label = '';
        if (lastLine && lastLine.length <= 80) {
          let consumed = lastLine;
          // "William Zhang (Linkedin" → text "William Zhang (" + link "Linkedin".
          const paren = lastLine.lastIndexOf('(');
          if (paren > -1 && paren < lastLine.length - 1) {
            consumed = lastLine.slice(paren + 1).trim();
            lastLine = consumed;
          }
          label = /^https?:\/\//i.test(consumed) ? linkLabel(consumed) : consumed;
          before = trimmedBefore.slice(0, trimmedBefore.length - consumed.length).replace(/\s*\(\s*$/, ' ');
        }


        if (before.trim()) segs.push(...segmentsFromText(before));
        segs.push({ kind: 'link', label: label || linkLabel(href), href });
        cursor = idx + m[0].length;
      }
      const tail = para.slice(cursor).replace(/^\s*\)\s*/, '');
      if (tail.trim()) segs.push(...segmentsFromText(tail));
      return segs.length ? segs : segmentsFromText(para);

    })
    .filter((segs) => segs.length > 0);

  return { paragraphs, footerTrimmed };
}
