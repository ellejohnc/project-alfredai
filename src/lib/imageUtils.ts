/**
 * Converts a Google Drive sharing/view URL to a directly embeddable image URL.
 *
 * Supported formats:
 *  - https://drive.google.com/file/d/FILE_ID/view?...
 *  - https://drive.google.com/open?id=FILE_ID
 *  - https://drive.google.com/uc?id=FILE_ID&export=view
 *
 * All are converted to: https://lh3.googleusercontent.com/d/FILE_ID
 * which works without authentication and without CORS issues for public files.
 */
export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return '';

  // Already a direct lh3 URL — leave it alone
  if (url.includes('lh3.googleusercontent.com')) return url;

  // Match /file/d/FILE_ID/
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) {
    return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`;
  }

  // Match ?id=FILE_ID or &id=FILE_ID
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) {
    return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
  }

  // Not a Google Drive URL — return as-is
  return url;
}
