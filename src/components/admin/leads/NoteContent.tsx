import { sanitizeNoteHtml } from './sanitizeNoteHtml';

import { sanitizePastedHtml } from '@/utils/sanitizePastedHtml';
import { normalizeMultilineText } from '@/lib/normalizeMultilineText';
import { cn } from '@/lib/utils';

// Detects whether a string contains HTML tags (so we know to sanitize + render
// as formatted content rather than showing raw markup).
const HTML_TAG_RE = /<\/?[a-z][^>]*>/i;

export function NoteContent({
  value,
  className,
}: {
  value?: string | null;
  className?: string;
}) {
  const text = (value ?? '').toString();
  if (!text.trim()) return null;

  if (!HTML_TAG_RE.test(text)) {
    return (
      <p className={cn('text-sm whitespace-pre-wrap break-words', className)}>
        {normalizeMultilineText(text)}
      </p>
    );
  }

  const html = sanitizeNoteHtml(text);

  // If sanitizing stripped everything, fall back to visible plain text.
  if (!html.trim()) {
    const plain = text.replace(/<[^>]+>/g, '').trim();
    if (!plain) return null;
    return (
      <p className={cn('text-sm whitespace-pre-wrap break-words', className)}>{plain}</p>
    );
  }

  return (
    <div
      className={cn(
        'text-sm break-words space-y-1',
        '[&_p]:m-0 [&_a]:text-primary [&_a]:underline [&_a:hover]:opacity-80 [&_a]:break-all',
        '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
        '[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground',
        '[&_strong]:font-semibold',
        className,
      )}
      // Sanitized above with sanitizeNoteHtml (DOMPurify-equivalent allow-list).
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
