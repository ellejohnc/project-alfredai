/**
 * Smart plain-text to HTML auto-formatter.
 * Detects headings, paragraphs, lists, links, images, blockquotes, 
 * and JSON-LD/script blocks in pasted plain text and converts them
 * to semantic HTML for the TipTap editor.
 */

/** Check if a line looks like a heading: short, no ending punctuation, followed by body text */
function isLikelyHeading(line: string, nextLine: string | undefined): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 120) return false;
  // Must not end with common sentence punctuation (except ? or :)
  if (/[.,;!]$/.test(trimmed)) return false;
  // Must not start with list markers
  if (/^(\d+[.)]\s|[-*•]\s)/.test(trimmed)) return false;
  // Must not be a URL
  if (/^https?:\/\//.test(trimmed)) return false;
  // Should have a following paragraph or be clearly a title-like line
  const hasNextContent = nextLine !== undefined && nextLine.trim().length > 0;
  // Short standalone lines (< 80 chars) before content are likely headings
  if (trimmed.length < 80 && hasNextContent) return true;
  return false;
}

/** Detect markdown heading level */
function getMarkdownHeadingLevel(line: string): { level: number; text: string } | null {
  const match = line.match(/^(#{1,3})\s+(.+)$/);
  if (match) {
    return { level: match[1].length, text: match[2].trim() };
  }
  return null;
}

/** Convert markdown inline formatting to HTML */
function convertInlineFormatting(text: string): string {
  // Markdown images: ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg" />');
  
  // Markdown links: [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline cursor-pointer">$1</a>');
  
  // Bold: **text** or __text__
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  
  // Italic: *text* or _text_ (but not inside URLs)
  text = text.replace(/(?<!\w)\*([^*]+)\*(?!\w)/g, '<em>$1</em>');
  text = text.replace(/(?<!\w)_([^_]+)_(?!\w)/g, '<em>$1</em>');
  
  // Inline code: `text`
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Auto-link bare URLs (not already in an href)
  text = text.replace(
    /(?<!href="|src=")(https?:\/\/[^\s<>"]+)/g,
    '<a href="$1" class="text-primary underline cursor-pointer">$1</a>'
  );
  
  return text;
}

/** Check if text contains markdown or structured patterns */
function containsStructuredPatterns(text: string): boolean {
  const lines = text.split('\n');
  let structuredLineCount = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Markdown headings
    if (/^#{1,3}\s/.test(trimmed)) { structuredLineCount++; continue; }
    // Markdown links/images
    if (/\[.*\]\(.*\)/.test(trimmed)) { structuredLineCount++; continue; }
    // Ordered lists
    if (/^\d+[.)]\s/.test(trimmed)) { structuredLineCount++; continue; }
    // Unordered lists
    if (/^[-*•]\s/.test(trimmed)) { structuredLineCount++; continue; }
    // Blockquotes
    if (/^>\s/.test(trimmed)) { structuredLineCount++; continue; }
    // URLs on their own line
    if (/^https?:\/\//.test(trimmed)) { structuredLineCount++; continue; }
  }
  
  // If we found some structured patterns, or text has multiple paragraphs
  const nonEmptyLines = lines.filter(l => l.trim().length > 0);
  const blankLineBreaks = text.split(/\n\s*\n/).length;
  
  return structuredLineCount >= 2 || (nonEmptyLines.length > 3 && blankLineBreaks >= 2);
}

/**
 * Clean raw HTML content that was pasted as plain text.
 * Strips JSON-LD, script tags, and normalizes the HTML for TipTap.
 */
export function cleanRawHtmlContent(text: string): string {
  // Strip JSON-LD / script tags
  let cleaned = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  // Strip trailing incomplete JSON-LD
  cleaned = cleaned.replace(/\{"@context":\s*"https:\/\/schema\.org[\s\S]*$/gi, '');
  cleaned = cleaned.replace(/@context":\s*"https:\/\/schema\.org[\s\S]*$/gi, '');
  // Remove id attributes
  cleaned = cleaned.replace(/\s+id="[^"]*"/gi, '');
  // Remove class attributes (TipTap will add its own)
  cleaned = cleaned.replace(/\s+class="[^"]*"/gi, '');
  // Remove style attributes
  cleaned = cleaned.replace(/\s+style="[^"]*"/gi, '');
  // Ensure links open in new tab
  cleaned = cleaned.replace(/<a\s/gi, '<a target="_blank" rel="noopener noreferrer" ');
  // Clean up any double spaces in tags
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  return cleaned.trim();
}

export function plainTextToHtml(text: string): string {
  // Don't process if it's already HTML
  if (/<[a-z][\s\S]*>/i.test(text) && /<\/(p|div|h[1-6]|ul|ol|table|blockquote)>/i.test(text)) {
    return text;
  }
  
  // Don't process very short text (single line, no structure)
  if (!containsStructuredPatterns(text) && !text.includes('\n\n')) {
    return text;
  }
  
  // Strip JSON-LD / script tags at the end
  text = text.replace(/<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/@context":\s*"https:\/\/schema\.org[\s\S]*$/gi, '');
  // Also strip trailing incomplete JSON-LD that got cut off
  text = text.replace(/\{"@context":\s*"https:\/\/schema\.org[\s\S]*$/gi, '');
  
  const lines = text.split('\n');
  const htmlParts: string[] = [];
  let i = 0;
  let inList: 'ul' | 'ol' | null = null;
  
  const closeList = () => {
    if (inList) {
      htmlParts.push(`</${inList}>`);
      inList = null;
    }
  };
  
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip empty lines (they act as paragraph separators)
    if (!trimmed) {
      closeList();
      i++;
      continue;
    }
    
    // --- Markdown headings: # ## ### ---
    const mdHeading = getMarkdownHeadingLevel(trimmed);
    if (mdHeading) {
      closeList();
      const content = convertInlineFormatting(mdHeading.text);
      htmlParts.push(`<h${mdHeading.level}>${content}</h${mdHeading.level}>`);
      i++;
      continue;
    }
    
    // --- Horizontal rule: --- or *** or ___ ---
    if (/^[-*_]{3,}\s*$/.test(trimmed)) {
      closeList();
      htmlParts.push('<hr />');
      i++;
      continue;
    }
    
    // --- Blockquote: > text ---
    if (/^>\s/.test(trimmed)) {
      closeList();
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      const quoteContent = convertInlineFormatting(quoteLines.join(' '));
      htmlParts.push(`<blockquote><p>${quoteContent}</p></blockquote>`);
      continue;
    }
    
    // --- Ordered list: 1. or 1) ---
    if (/^\d+[.)]\s/.test(trimmed)) {
      if (inList !== 'ol') {
        closeList();
        inList = 'ol';
        htmlParts.push('<ol>');
      }
      const itemText = trimmed.replace(/^\d+[.)]\s+/, '');
      htmlParts.push(`<li>${convertInlineFormatting(itemText)}</li>`);
      i++;
      continue;
    }
    
    // --- Unordered list: - or * or • ---
    if (/^[-*•]\s/.test(trimmed)) {
      if (inList !== 'ul') {
        closeList();
        inList = 'ul';
        htmlParts.push('<ul>');
      }
      const itemText = trimmed.replace(/^[-*•]\s+/, '');
      htmlParts.push(`<li>${convertInlineFormatting(itemText)}</li>`);
      i++;
      continue;
    }
    
    closeList();
    
    // --- Standalone image (markdown) ---
    if (/^!\[.*\]\(.*\)\s*$/.test(trimmed)) {
      htmlParts.push(convertInlineFormatting(trimmed));
      i++;
      continue;
    }
    
    // --- Detect heading-like lines ---
    // A line that's short, not a sentence, and followed by body text
    const nextNonEmpty = lines.slice(i + 1).find(l => l.trim().length > 0);
    if (isLikelyHeading(trimmed, nextNonEmpty)) {
      // Determine heading level: first heading = h1 (but we already have one in SEO, so use h2)
      // Sub-headings that are indented or shorter = h3
      const content = convertInlineFormatting(trimmed);
      // Use h2 for main section headings
      htmlParts.push(`<h2>${content}</h2>`);
      i++;
      continue;
    }
    
    // --- Regular paragraph: collect consecutive non-empty lines ---
    const paragraphLines: string[] = [];
    while (i < lines.length && lines[i].trim().length > 0) {
      const currentTrimmed = lines[i].trim();
      // Stop if next line looks like a heading or list
      if (paragraphLines.length > 0) {
        if (/^#{1,3}\s/.test(currentTrimmed)) break;
        if (/^\d+[.)]\s/.test(currentTrimmed)) break;
        if (/^[-*•]\s/.test(currentTrimmed)) break;
        if (/^>\s/.test(currentTrimmed)) break;
        if (/^[-*_]{3,}\s*$/.test(currentTrimmed)) break;
        // If this line is a heading-like line, break
        const nextLine = lines[i + 1]?.trim();
        if (isLikelyHeading(currentTrimmed, nextLine) && paragraphLines.length > 0) break;
      }
      paragraphLines.push(currentTrimmed);
      i++;
    }
    
    if (paragraphLines.length > 0) {
      const content = convertInlineFormatting(paragraphLines.join(' '));
      htmlParts.push(`<p>${content}</p>`);
    }
  }
  
  closeList();
  
  return htmlParts.join('\n');
}
