import { supabase } from '@/integrations/supabase/client';
import { getShareableUrl } from '@/lib/siteConfig';

const BASE_URL = 'https://new.alfredai.bot';

/**
 * Generates a random 8-character alphanumeric code for demo share links.
 */
function generateShareCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Creates a unique trackable short link for sharing a demo.
 * Each share generates a new unique link so we can track individual shares.
 * Falls back to a static URL if short link creation fails.
 */
export async function createDemoShareLink(demoId: string): Promise<string> {
  const destinationUrl = getShareableUrl(`/resources/demos/${demoId}`);

  let attempts = 0;
  while (attempts < 5) {
    const code = `d-${generateShareCode()}`; // prefix with 'd-' to identify demo shares
    const { error } = await supabase
      .from('short_links' as any)
      .insert({
        code,
        destination_url: destinationUrl,
        content_type: 'demo_share',
        source_id: demoId,
        created_by: null,
      } as any);

    if (!error) {
      return `${BASE_URL}/go/${code}`;
    }

    if (error.code === '23505') {
      // Unique constraint violation — retry with new code
      attempts++;
      continue;
    }

    console.error('[demoShareLinks] Insert error:', error);
    break;
  }

  // Fallback to static URL
  console.warn('[demoShareLinks] Falling back to static URL for demo:', demoId);
  return destinationUrl;
}
