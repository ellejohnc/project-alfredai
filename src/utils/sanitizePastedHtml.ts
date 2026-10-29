/**
 * Sanitizes messy HTML pasted from Microsoft Word / Google Docs into clean,
 * schema-friendly HTML that TipTap/ProseMirror will accept.
 *
 * Word & Google Docs put very noisy markup on the clipboard: mso-* styles,
 * <o:p> tags, conditional comments, xml/style blocks, span soup, and class
 * junk. If any of this reaches ProseMirror's schema untouched the paste can be
 * dropped entirely. We strip the junk while PRESERVING structure: paragraphs,
 * line breaks, headings (h1-h3), bold/italic/underline, links, bullet &
 * numbered lists, and blockquotes.
 *
 * Safety: no <script>/<style> tags, no on* handlers, no javascript: URLs.
 */

// Tags we allow through to the editor. Everything else is unwrapped (children
// kept) or dropped depending on the tag.
const ALLOWED_TAGS = new Set([
  'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'sub', 'sup',
  'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
  'img', 'span', 'div',
  'table', 'thead', 'tbody', 'tr', 'td', 'th',
]);

// Tags whose entire subtree should be removed (never useful in prose).
const DROP_TAGS = new Set([
  'script', 'style', 'meta', 'link', 'title', 'head', 'xml',
  'o:p', 'w:sdt', 'v:shapetype', 'v:shape', 'v:imagedata',
  // Embeds the editor schema can't hold. Dropping them keeps the rest of the
  // paste intact instead of aborting the whole operation (e.g. Tely CTA
  // <iframe> and JSON-LD <script>).
  'iframe', 'object', 'embed', 'noscript', 'form', 'input', 'button',
]);

// Per-tag allowed attributes. Anything not listed is removed.
const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'title'],
  td: ['colspan', 'rowspan'],
  th: ['colspan', 'rowspan'],
};

function isSafeUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('vbscript:')) return false;
  if (trimmed.startsWith('data:') && !trimmed.startsWith('data:image/')) return false;
  return true;
}

function cleanElement(el: Element, doc: Document): void {
  // Process children first (snapshot because we mutate the tree).
  const children = Array.from(el.children);
  for (const child of children) cleanElement(child, doc);

  const tag = el.tagName.toLowerCase();

  // Remove disallowed / junk subtrees entirely.
  if (DROP_TAGS.has(tag) || tag.includes(':')) {
    el.remove();
    return;
  }

  // Unwrap tags that aren't allowed but may contain useful content.
  if (!ALLOWED_TAGS.has(tag)) {
    unwrap(el);
    return;
  }

  // Strip all attributes except the whitelisted ones for this tag.
  const allowed = ALLOWED_ATTRS[tag] || [];
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase();
    if (name.startsWith('on')) {
      el.removeAttribute(attr.name);
      continue;
    }
    if (!allowed.includes(name)) {
      el.removeAttribute(attr.name);
    }
  }

  // Validate URLs on links/images.
  if (tag === 'a') {
    const href = el.getAttribute('href');
    if (!href || !isSafeUrl(href)) {
      unwrap(el);
      return;
    }
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener noreferrer');
  }
  if (tag === 'img') {
    const src = el.getAttribute('src');
    if (!src || !isSafeUrl(src)) {
      el.remove();
      return;
    }
  }

  // Unwrap generic containers (span/div) once their attributes are gone — the
  // editor schema doesn't need them and they cause "span soup".
  if (tag === 'span' || tag === 'div') {
    unwrap(el);
    return;
  }

  // Drop empty inline/structural elements left behind by Word (e.g. <p></p>
  // full of &nbsp; or empty <li>). Keep <br>, images and table cells.
  if (tag !== 'br' && tag !== 'img' && tag !== 'td' && tag !== 'th') {
    const text = (el.textContent || '').replace(/\u00a0/g, ' ').trim();
    if (!text && el.children.length === 0) {
      el.remove();
    }
  }
}

/** Replace an element with its children in place. */
function unwrap(el: Element): void {
  const parent = el.parentNode;
  if (!parent) {
    el.remove();
    return;
  }
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
}

export function sanitizePastedHtml(html: string): string {
  if (!html) return html;

  // Strip conditional comments (<!--[if ...]>) and normal comments up front —
  // these hide Word's worst markup and confuse the parser.
  const pre = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!\[if[\s\S]*?\]>/gi, '')
    .replace(/<!\[endif\]>/gi, '')
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<o:p>[\s\S]*?<\/o:p>/gi, '')
    .replace(/<o:p\s*\/?>/gi, '')
    // Remove whole <script>/<style>/<iframe> blocks up front so their raw
    // text content (e.g. JSON-LD) never leaks into the parsed output.
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<iframe[^>]*\/?>/gi, '');

  let root: HTMLElement;
  try {
    const parsed = new DOMParser().parseFromString(pre, 'text/html');
    root = parsed.body;
  } catch {
    // Fallback: strip all tags to plain text if parsing fails.
    return pre.replace(/<[^>]+>/g, '');
  }

  for (const child of Array.from(root.children)) cleanElement(child, root.ownerDocument);

  let out = root.innerHTML;

  // Collapse leftover non-breaking spaces and empty paragraphs.
  out = out
    .replace(/(&nbsp;|\u00a0)/g, ' ')
    .replace(/<p>\s*<\/p>/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return out;
}
