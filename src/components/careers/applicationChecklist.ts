/** Mandatory confirmations an applicant must tick, one by one, before submitting. */
export const SENIOR_DEV_SLUG = "senior-full-stack-ai-engineer";
export const TECHNICAL_SALES_SLUG = "technical-sales-executive";

const SENIOR_DEV_CHECKLIST = [
  "I have read the full role description, responsibilities and requirements.",
  "I have 6+ years of professional software engineering experience.",
  "I build full stack with TypeScript, React, Node and SQL databases.",
  "I have built and shipped products using LLMs or AI agents.",
  "I have hands-on experience in construction tech — software built for or used by builders, trades, estimators or project teams.",
  "I am comfortable working directly with clients, presenting and running meetings.",
  "I am based in Sydney or on the Australian east coast, or will relocate.",
  "I have full working rights in Australia.",
  "I understand the path to AU CTO reports to the CEO and the Global CTO only.",
  "I have attached my up-to-date CV.",
  "The information I have provided is true and accurate.",
];

const TECHNICAL_SALES_CHECKLIST = [
  "I have read the full role description, responsibilities and requirements.",
  "I have 5+ years of B2B sales experience and have consistently met or beaten quota.",
  "I have sold construction tech, or sold to builders, contractors, estimators or project teams.",
  "I can explain technical products — AI, APIs, integrations — credibly to technical buyers.",
  "I have owned the full sales cycle: discovery, demos, proposals, negotiation and close.",
  "I am comfortable presenting to senior stakeholders and running live product demos.",
  "I am based in Sydney or on the Australian east coast, or will relocate.",
  "I have full working rights in Australia.",
  "I understand the path to VP of Sales reports to the CEO and the Global CTO only.",
  "I have attached my up-to-date CV.",
  "The information I have provided is true and accurate.",
];

export function getApplicationChecklist(slug: string | null | undefined): string[] {
  switch (slug) {
    case SENIOR_DEV_SLUG:
      return SENIOR_DEV_CHECKLIST;
    case TECHNICAL_SALES_SLUG:
      return TECHNICAL_SALES_CHECKLIST;
    default:
      return [];
  }
}

/** Items can only be ticked in order; returns how many are ticked consecutively. */
export function checklistComplete(ticked: boolean[], total: number): boolean {
  return total === 0 || (ticked.length >= total && ticked.slice(0, total).every(Boolean));
}
