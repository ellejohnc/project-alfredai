import { cn } from "@/lib/utils";

interface DemoMarkdownProps {
  content: string;
  className?: string;
  /** Use light text colors for dark backgrounds (e.g., dark chat bubbles) */
  lightText?: boolean;
}

/**
 * Simple markdown renderer for demo chat messages
 * Supports: **bold**, *italic*, bullet points, headings, emojis
 */
export function DemoMarkdown({ content, className, lightText = false }: DemoMarkdownProps) {
  // Text color classes based on lightText prop
  const textColor = lightText ? "text-slate-100" : "text-foreground";
  const mutedColor = lightText ? "text-slate-300" : "text-muted-foreground";
  const primaryColor = lightText ? "text-teal-400" : "text-primary";
  const codeClasses = lightText 
    ? "px-1.5 py-0.5 rounded bg-slate-700/50 text-teal-300 text-[11px] font-mono" 
    : "px-1.5 py-0.5 rounded bg-muted text-primary text-[11px] font-mono";

  const renderLine = (line: string, index: number) => {
    // Check for bullet points
    const isBullet = line.match(/^[•\-*]\s/);
    const bulletContent = isBullet ? line.replace(/^[•\-*]\s/, '') : null;
    
    // Check for numbered list
    const isNumbered = line.match(/^\d+\.\s/);
    const numberedContent = isNumbered ? line.replace(/^\d+\.\s/, '') : null;
    const number = isNumbered ? line.match(/^\d+/)?.[0] : null;
    
    // Check for checkbox style (✅, ⚠️, etc at start)
    const isCheckItem = line.match(/^(?:✅|⚠️?|❌|✓|✗|➤|→)/u);
    
    // Parse inline formatting
    const parseInline = (text: string) => {
      const parts: (string | JSX.Element)[] = [];
      let remaining = text;
      let keyIndex = 0;
      
      while (remaining) {
        // Match bold **text**
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
        // Match italic *text* (but not **)
        const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);
        // Match code `text`
        const codeMatch = remaining.match(/`(.+?)`/);
        // Match link [text](url) — internal paths and https only
        const linkMatch = remaining.match(/\[([^\]]+)\]\(((?:\/|https:\/\/)[^)\s]*)\)/);
        
        // Find the earliest match
        const matches = [
          boldMatch && { type: 'bold', match: boldMatch, index: remaining.indexOf(boldMatch[0]) },
          italicMatch && { type: 'italic', match: italicMatch, index: remaining.indexOf(italicMatch[0]) },
          codeMatch && { type: 'code', match: codeMatch, index: remaining.indexOf(codeMatch[0]) },
          linkMatch && { type: 'link', match: linkMatch, index: remaining.indexOf(linkMatch[0]) },
        ].filter(Boolean).sort((a, b) => (a?.index ?? 999) - (b?.index ?? 999));
        
        if (matches.length > 0 && matches[0]) {
          const first = matches[0];
          const beforeText = remaining.slice(0, first.index);
          if (beforeText) parts.push(beforeText);
          
          if (first.type === 'bold') {
            parts.push(
              <strong key={keyIndex++} className={cn("font-semibold", lightText ? "text-white" : "text-foreground")}>
                {first.match![1]}
              </strong>
            );
          } else if (first.type === 'italic') {
            parts.push(
              <em key={keyIndex++} className={cn("italic", mutedColor)}>
                {first.match![1]}
              </em>
            );
          } else if (first.type === 'link') {
            parts.push(
              <a key={keyIndex++} href={first.match![2]} className={cn("font-medium underline underline-offset-2", lightText ? "text-white" : "text-foreground")}>
                {first.match![1]}
              </a>
            );
          } else if (first.type === 'code') {
            parts.push(
              <code key={keyIndex++} className={codeClasses}>
                {first.match![1]}
              </code>
            );
          }
          
          remaining = remaining.slice(first.index + first.match![0].length);
        } else {
          parts.push(remaining);
          break;
        }
      }
      
      return parts;
    };
    
    // Empty line = paragraph break
    if (!line.trim()) {
      return <div key={index} className="h-2" />;
    }
    
    // Bullet point
    if (bulletContent) {
      return (
        <div key={index} className="flex items-start gap-2 py-0.5 pl-1">
          <span className={cn("mt-1.5 text-[8px]", lightText ? "text-teal-400/70" : "text-primary/70")}>●</span>
          <span className={cn("flex-1", textColor)}>{parseInline(bulletContent)}</span>
        </div>
      );
    }
    
    // Numbered list
    if (numberedContent && number) {
      return (
        <div key={index} className="flex items-start gap-2 py-0.5 pl-1">
          <span className={cn("font-medium min-w-[16px]", lightText ? "text-teal-400/70" : "text-primary/70")}>{number}.</span>
          <span className={cn("flex-1", textColor)}>{parseInline(numberedContent)}</span>
        </div>
      );
    }
    
    // Check/status item (starts with emoji)
    if (isCheckItem) {
      return (
        <div key={index} className={cn("py-0.5", textColor)}>
          {parseInline(line)}
        </div>
      );
    }
    
    // Regular paragraph
    return (
      <div key={index} className={cn("py-0.5", textColor)}>
        {parseInline(line)}
      </div>
    );
  };
  
  const lines = content.split('\n');
  
  return (
    <div className={cn("text-sm leading-relaxed", className)}>
      {lines.map((line, index) => renderLine(line, index))}
    </div>
  );
}

export default DemoMarkdown;
