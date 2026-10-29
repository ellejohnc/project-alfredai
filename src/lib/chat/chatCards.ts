/** Cards shown under chatbot answers — built only from the site's own lists, so a card can't point at a missing page. */
import { WORKFLOWS } from "@/data/workflows";
import { platformProducts, platformProductHref } from "@/data/platformProducts";
import { TRADES, FEATURED_TRADES } from "@/components/demos/takeoff/takeoffData";

export interface ChatCard { title: string; subtitle: string; href: string; cta: string; kind: "workflow" | "product" | "trade" }

const KNOWN: ChatCard[] = [
  ...WORKFLOWS.map((w) => ({ title: w.title, subtitle: w.summary, href: w.href, cta: w.cta, kind: "workflow" as const })),
  ...platformProducts.map((p) => ({ title: p.name, subtitle: p.tagline, href: platformProductHref(p), cta: `See ${p.name}`, kind: "product" as const })),
];

export const TRADE_CARDS: ChatCard[] = FEATURED_TRADES.map((id) => ({
  title: TRADES[id].label, subtitle: TRADES[id].summary, href: `/demos/ai-takeoff?trade=${id}`, cta: "See the demo", kind: "trade",
}));

const TRADE_WORDS: Record<string, RegExp> = { gc: /general contractor/i, windows: /window/i, steel: /steel/i };

/** Hidden qualification tag the assistant appends: <!--q {"trade":"..."}--> */
const Q_TAG = /<!--\s*q\s*(\{[\s\S]*?\})\s*-->/g;

export type Qualification = Partial<Record<"trade" | "size" | "software" | "challenge" | "timeline" | "email" | "name" | "company", string>>;

export function stripQualification(content: string): { text: string; qualification: Qualification } {
  const qualification: Qualification = {};
  const text = content.replace(Q_TAG, (_, json) => {
    try { Object.assign(qualification, JSON.parse(json)); } catch { /* ignore malformed tag */ }
    return "";
  }).replace(/<!--[\s\S]*$/, "").trim();
  return { text, qualification };
}

export function extractCards(content: string, max = 4): ChatCard[] {
  const out: ChatCard[] = [];
  const add = (c: ChatCard) => { if (!out.some((o) => o.href === c.href) && out.length < max) out.push(c); };
  for (const m of content.matchAll(/\]\((\/[^)\s]*)\)/g)) {
    const path = m[1].split("#")[0];
    const card = KNOWN.find((k) => k.href === path);
    if (card) add(card);
  }
  if (/trade|take-?off/i.test(content)) {
    TRADE_CARDS.forEach((t, i) => { if (TRADE_WORDS[FEATURED_TRADES[i]].test(content)) add(t); });
  }
  return out;
}

export function bookingUrlWith(base: string, q: Qualification): string {
  const url = new URL(base);
  Object.entries(q).forEach(([k, v]) => { if (v && k !== "email") url.searchParams.set(k, String(v).slice(0, 120)); });
  return url.toString();
}
