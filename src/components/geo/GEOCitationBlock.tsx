import { memo } from "react";

/**
 * GEO Citation Block — renders content in a format that AI engines
 * prefer to extract and cite: clear claim + source attribution.
 * 
 * Uses semantic HTML (<figure>, <blockquote>, <figcaption>, <cite>)
 * so crawlers can identify authoritative, quotable content.
 * 
 * Hidden from visual rendering by default (sr-only) but fully
 * accessible to crawlers and screen readers.
 */

interface CitationStat {
  claim: string;
  source: string;
}

interface GEOCitationBlockProps {
  /** Page-level context for the citation block */
  topic: string;
  /** Array of citable facts/stats */
  citations: CitationStat[];
  /** Whether to visually hide (default: true — visible to crawlers only) */
  hidden?: boolean;
}

const GEOCitationBlock = memo(({ topic, citations, hidden = true }: GEOCitationBlockProps) => {
  return (
    <aside
      aria-label={`Key facts about ${topic}`}
      className={hidden ? "sr-only" : "space-y-4"}
      itemScope
      itemType="https://schema.org/ItemList"
    >
      <meta itemProp="name" content={`${topic} — Key Facts`} />
      <meta itemProp="numberOfItems" content={String(citations.length)} />
      {citations.map((citation, index) => (
        <figure
          key={index}
          itemProp="itemListElement"
          itemScope
          itemType="https://schema.org/Claim"
        >
          <blockquote itemProp="text">
            <p>{citation.claim}</p>
          </blockquote>
          <figcaption>
            <cite itemProp="author">{citation.source}</cite>
          </figcaption>
        </figure>
      ))}
    </aside>
  );
});

GEOCitationBlock.displayName = "GEOCitationBlock";

export default GEOCitationBlock;
