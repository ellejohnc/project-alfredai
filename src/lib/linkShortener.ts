import { supabase } from '@/integrations/supabase/client';

const BASE_URL = 'https://new.alfredai.bot';
const MIN_URL_LENGTH = 30;

/**
 * Generates a random 7-character alphanumeric code.
 */
function generateCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 7; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Extracts all unique external href values AND plain-text URLs from HTML
 * that are candidates for shortening.
 * Skips: anchors (#...), mailto:, already shortened (/go/), and short URLs.
 */
export function extractLinksFromHtml(html: string): { href: string; isPlainText: boolean }[] {
  const seen = new Set<string>();
  const links: { href: string; isPlainText: boolean }[] = [];

  // 1. Extract <a href="..."> links
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const anchors = doc.querySelectorAll('a[href]');

  anchors.forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (
      !href ||
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.includes('/go/') ||
      href.length <= MIN_URL_LENGTH ||
      seen.has(href)
    ) {
      return;
    }
    seen.add(href);
    links.push({ href, isPlainText: false });
  });

  // 2. Extract plain-text URLs (not inside href attributes)
  // Match http(s):// URLs that are NOT inside an href="..." attribute
  const plainUrlRegex = /(?<![='"(])(https?:\/\/[^\s<>"')\]]+)/g;
  let match: RegExpExecArray | null;
  while ((match = plainUrlRegex.exec(html)) !== null) {
    const url = match[1];
    if (
      url.includes('/go/') ||
      url.length <= MIN_URL_LENGTH ||
      seen.has(url)
    ) {
      continue;
    }
    seen.add(url);
    links.push({ href: url, isPlainText: true });
  }

  return links;
}

/**
 * For each long link in the HTML:
 * 1. Checks if a short link already exists for that URL + blog post combo (idempotent)
 * 2. If not, generates a unique code and inserts it
 * 3. Replaces all href occurrences in the HTML with the short URL
 *
 * Returns the updated HTML and count of links shortened.
 */
export type ShortLinkContentType = 'blog_post' | 'guide' | 'webinar';

export async function shortenLinksInContent(
  html: string,
  contentId: string,
  userId: string | undefined,
  contentType: ShortLinkContentType = 'blog_post'
): Promise<{ updatedHtml: string; count: number }> {
  const links = extractLinksFromHtml(html);

  if (links.length === 0) {
    return { updatedHtml: html, count: 0 };
  }

  let updatedHtml = html;
  let count = 0;

  for (const link of links) {
    const url = link.href;
    try {
      // Determine the lookup field: blog_post_id for blogs, content_id for others
      const idField = contentType === 'blog_post' ? 'blog_post_id' : 'content_id';

      // Check if short link already exists for this URL + content combo
      const { data: existing } = await supabase
        .from('short_links' as any)
        .select('code')
        .eq('destination_url', url)
        .eq(idField, contentId)
        .maybeSingle();

      let code: string;

      if (existing && (existing as any).code) {
        code = (existing as any).code;
      } else {
        // Generate unique code (retry on collision)
        let attempts = 0;
        let inserted = false;
        while (!inserted && attempts < 5) {
          code = generateCode();
          const insertPayload: Record<string, unknown> = {
            code,
            destination_url: url,
            created_by: userId ?? null,
            content_type: contentType,
          };
          if (contentType === 'blog_post') {
            insertPayload.blog_post_id = contentId;
          } else {
            insertPayload.content_id = contentId;
          }
          const { error } = await supabase
            .from('short_links' as any)
            .insert(insertPayload as any);

          if (!error) {
            inserted = true;
          } else if (error.code === '23505') {
            attempts++;
          } else {
            console.error('[linkShortener] Insert error:', error);
            break;
          }
        }
        if (!inserted) continue;
      }

      const shortUrl = `${BASE_URL}/go/${code!}`;
      const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      if (link.isPlainText) {
        // Replace plain-text URLs not inside href="..." attributes
        updatedHtml = updatedHtml.replace(
          new RegExp(`(?<![='"(])${escaped}`, 'g'),
          shortUrl
        );
      } else {
        // Replace href="originalUrl"
        updatedHtml = updatedHtml.replace(
          new RegExp(`href="${escaped}"`, 'g'),
          `href="${shortUrl}"`
        );
      }
      count++;
    } catch (err) {
      console.error('[linkShortener] Failed to shorten URL, skipping:', url, err);
    }
  }

  return { updatedHtml, count };
}
