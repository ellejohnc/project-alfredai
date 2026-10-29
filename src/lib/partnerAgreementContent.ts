// Consulting Partner Agreement content, derived from the source DOCX.
// Used both for the on-screen signable agreement and the downloadable copy.

export const AGREEMENT_VERSION = "2026-v1";
export const AGREEMENT_TITLE = "Consulting Partner Agreement";

export interface AgreementBlock {
  type: "h2" | "h3" | "p" | "li" | "note" | "table";
  text?: string;
  /** For table blocks */
  headers?: string[];
  rows?: string[][];
}

export const COMMISSION_RATE_CARD: AgreementBlock = {
  type: "table",
  headers: ["Cumulative partner sales, same financial year (local currency)", "Setup fee commission"],
  rows: [
    ["$0 to $100,000", "10%"],
    ["Above $100,000", "15%"],
    ["Above $250,000", "25%"],
    ["Above $500,000", "30%"],
  ],
};

export const AGREEMENT_BLOCKS: AgreementBlock[] = [
  {
    type: "note",
    text: "This summary is for convenience only. The numbered clauses below govern. You refer and sell — alfred ai delivers. You introduce and close clients in your territory; alfred ai builds, implements and supports every solution and remains the named provider. You earn a commission on the setup fee of each deal, rising with your sales for the year (10% → 15% → 25% → 30%), plus a flat 10% of the monthly fee for the first 12 months of each deal. alfred ai sets all pricing; any discount needs written CEO approval. No intellectual property changes hands. This is not a white-label arrangement. Commission is paid on money actually collected.",
  },

  { type: "h2", text: "1. Definitions and interpretation" },
  { type: "p", text: "In this Agreement, unless the context requires otherwise:" },
  { type: "p", text: "“Client” means an end customer introduced or sold to by the Consulting Partner under a Registered Deal." },
  { type: "p", text: "“Cumulative Sales” means the running total, within a single Financial Year, of (a) Setup Fees and (b) the first twelve (12) months of Monthly Fees, in each case actually paid to and collected by alfred ai in the Local Currency in respect of the Consulting Partner’s Registered Deals. Cumulative Sales reset to zero at the start of each Financial Year." },
  { type: "p", text: "“Financial Year” means the Australian financial year, being the period from 1 July to 30 June." },
  { type: "p", text: "“Go-Live” means the date on which alfred ai makes the contracted solution available for live use by the Client." },
  { type: "p", text: "“Intellectual Property” means all intellectual property rights of any kind, including software, code, machine-learning models, methodologies, platform architecture, data, trade marks, brand elements, know-how and confidential information." },
  { type: "p", text: "“Local Currency” means the lawful currency of the Territory, being Australian dollars (AUD) for Australia and New Zealand, United States dollars (USD) for the United States, and Canadian dollars (CAD) for Canada. All dollar amounts in this Agreement, including the thresholds in Schedule 1, are expressed in the Local Currency using the same numerical values and are not converted between currencies." },
  { type: "p", text: "“Monthly Fee” means the recurring monthly subscription or service fee paid by a Client to alfred ai under a Registered Deal." },
  { type: "p", text: "“Registered Deal” means a sales opportunity that the Consulting Partner has registered and alfred ai has confirmed under clause 4, and which results in a signed Client contract." },
  { type: "p", text: "“Setup Fee” means the one-off setup, onboarding or implementation fee charged by alfred ai to a Client under a Registered Deal." },
  { type: "p", text: "“Territory” means the territory specified on the cover page and in Schedule 2." },
  { type: "p", text: "“Upsell” means an additional product, module or expansion sold to an existing Client that increases the Monthly Fee." },
  { type: "p", text: "1.1 Headings are for convenience only. References to a person include a body corporate. “Including” and similar words are not words of limitation. A reference to dollars is to the Local Currency of the Territory." },

  { type: "h2", text: "2. Appointment, role and territory" },
  { type: "p", text: "2.1 alfred ai appoints the Consulting Partner as a non-exclusive alfred ai Consulting Partner in the Territory, and the Consulting Partner accepts that appointment, on the terms of this Agreement." },
  { type: "p", text: "2.2 The appointment is non-exclusive. alfred ai may appoint other partners, and may market, sell and deliver directly, in the Territory and elsewhere at any time." },
  { type: "p", text: "2.3 The Consulting Partner’s role is to refer and sell: to identify prospective Clients, introduce alfred ai, conduct sales conversations and product demonstrations using alfred ai’s approved materials, and progress opportunities to signed Client contracts." },
  { type: "p", text: "2.4 alfred ai’s role is to deliver: alfred ai builds, configures, implements, supports and maintains every solution, contracts with and invoices the Client directly, and provides the Consulting Partner with approved marketing assets and product information. alfred ai remains the provider of all products and services at all times." },
  { type: "p", text: "2.5 Nothing in this Agreement obliges alfred ai to accept any particular opportunity or to enter into any Client contract." },
  { type: "p", text: "2.6 Suspension and revocation. alfred ai may suspend or revoke the Consulting Partner’s appointment, partner status, brand and marketing licence and/or any confirmed deal registration, in whole or in part, on written notice, where the Consulting Partner breaches this Agreement, fails to meet alfred ai’s reasonable standards, or where alfred ai reasonably considers the Consulting Partner’s conduct poses a brand, legal or reputational risk. On revocation, the Consulting Partner must immediately stop using the alfred ai name, marks and materials. Revocation does not affect trailing commission already accrued on Registered Deals at Go-Live, which continues under clause 10.3." },
  { type: "p", text: "2.7 Enablement. alfred ai will provide the Consulting Partner with the enablement and support package set out in Schedule 3." },

  { type: "h2", text: "3. Responsibilities of the Consulting Partner" },
  { type: "p", text: "3.1 Represent alfred ai professionally and only in accordance with alfred ai’s approved brand, messaging and product information. The Consulting Partner must not create or use its own materials describing alfred ai without alfred ai’s prior written approval." },
  { type: "p", text: "3.2 Not make any performance, return-on-investment, financial or outcome guarantee on alfred ai’s behalf, except a guarantee expressly authorised by alfred ai in writing." },
  { type: "p", text: "3.3 Not hold itself out as the developer, owner or licensor of alfred ai’s products, and not obscure or misrepresent alfred ai as the provider. This Agreement is not a white-label arrangement." },
  { type: "p", text: "3.4 Register opportunities in accordance with clause 4 and keep alfred ai reasonably informed of pipeline progress." },
  { type: "p", text: "3.5 Comply with all applicable laws, including consumer protection, anti-spam, and privacy laws, in carrying out its activities." },

  { type: "h2", text: "4. Deal registration" },
  { type: "p", text: "4.1 To be eligible for commission, the Consulting Partner must register each opportunity with alfred ai through alfred ai’s nominated channel before the Client contract is signed, providing the Client name, contact and a short description of the opportunity." },
  { type: "p", text: "4.2 alfred ai will confirm each valid registration with a date-and-time stamp. A confirmed registration is valid for ninety (90) days and may be renewed by agreement." },
  { type: "p", text: "4.3 Where more than one registration or opportunity exists for the same Client, the first valid, alfred ai-confirmed registration prevails. An opportunity is not eligible if, at the time of registration, alfred ai already has an active direct opportunity or another partner’s current registration for that Client." },
  { type: "p", text: "4.4 Only deals that are registered and confirmed under this clause 4 are Registered Deals and attract commission." },

  { type: "h2", text: "5. Commission" },
  { type: "p", text: "5.1 Setup fee commission. alfred ai will pay the Consulting Partner a commission on the Setup Fee of each Registered Deal, calculated by reference to the Consulting Partner’s Cumulative Sales in the then-current Financial Year, on a marginal and prospective basis, as set out below and in Schedule 1:" },
  COMMISSION_RATE_CARD,
  { type: "p", text: "5.2 How the tier is fixed for each deal. The commission rate for a Registered Deal is determined by the band within which the Consulting Partner’s Cumulative Sales fall immediately before that Registered Deal is counted. A Registered Deal that itself causes Cumulative Sales to cross a threshold is commissioned at the rate of the band applying immediately before that deal. Only Registered Deals counted after a threshold is crossed attract the higher rate. Rates are never applied retrospectively to earlier Registered Deals." },
  { type: "p", text: "5.3 Trailing commission. In addition, alfred ai will pay the Consulting Partner a trailing commission of ten percent (10%) of the Monthly Fee actually collected for each Registered Deal, for the first twelve (12) months following that deal’s Go-Live. No trailing commission is payable after that 12-month period." },
  { type: "p", text: "5.4 Upsell. If a Client later purchases an Upsell, a fresh 12-month trailing commission of ten percent (10%) applies to the incremental Monthly Fee attributable to that Upsell only, running from the Upsell’s go-live. No further trailing commission arises otherwise." },
  { type: "p", text: "5.5 Annual reset. Cumulative Sales and the applicable tier reset at the start of each Financial Year (1 July)." },
  { type: "p", text: "5.6 Paid on collected revenue. Commission is calculated on amounts actually collected by alfred ai, not amounts invoiced. alfred ai will pay commission within thirty (30) days after the end of each calendar month, together with a statement showing the Registered Deals, amounts collected, the applicable tier and the commission calculated." },
  { type: "p", text: "5.7 Clawback. If a Client refunds, charges back, or cancels a Registered Deal within ninety (90) days of the relevant payment, any commission already paid on that amount is repayable by the Consulting Partner and may be offset by alfred ai against future commission." },

  { type: "h2", text: "6. Pricing and discounts" },
  { type: "p", text: "6.1 alfred ai sets all pricing, including Setup Fees and Monthly Fees." },
  { type: "p", text: "6.2 No discount to any Setup Fee or Monthly Fee may be offered, promised or agreed by the Consulting Partner without the prior written approval of alfred ai’s Chief Executive Officer. An unauthorised discount is not binding on alfred ai, and any commission is calculated on the approved (undiscounted) amount actually payable." },

  { type: "h2", text: "7. Brand, marketing and representations" },
  { type: "p", text: "7.1 alfred ai grants the Consulting Partner the right to describe itself as an “alfred ai Consulting Partner” for the Territory while this Agreement is in force, and to use alfred ai’s approved marketing assets and product information solely to promote alfred ai in accordance with alfred ai’s brand and messaging guidelines." },
  { type: "p", text: "7.2 All Client-facing materials and communications must make clear that alfred ai is the provider of the products and services. The Consulting Partner must cease all use of alfred ai’s name, marks and materials on termination, except as needed to conclude deals already in progress." },

  { type: "h2", text: "8. Intellectual property" },
  { type: "p", text: "8.1 Each Party retains all right, title and interest in its own Intellectual Property. Nothing in this Agreement transfers, assigns or licenses either Party’s Intellectual Property to the other, except the limited, non-exclusive, revocable licence to use alfred ai’s approved marketing assets granted in clause 7." },
  { type: "p", text: "8.2 No source code, machine-learning models, platform access or other alfred ai technology is provided to the Consulting Partner under this Agreement. The Consulting Partner’s own systems, client data and methodologies remain its property." },

  { type: "h2", text: "9. Confidentiality and privacy" },
  { type: "p", text: "9.1 Each Party must keep the other’s non-public information confidential, use it only for this Agreement, and not disclose it without consent. This obligation survives termination for three (3) years." },
  { type: "p", text: "9.2 Both Parties will handle personal information in accordance with the Privacy Act 1988 (Cth) and other applicable privacy laws, and will not use Client information except as needed to perform this Agreement." },

  { type: "h2", text: "10. Term, termination and restraints" },
  { type: "p", text: "10.1 This Agreement starts on signing and runs for twelve (12) months, then renews automatically for successive 12-month terms unless either Party gives thirty (30) days’ written notice before the end of the current term." },
  { type: "p", text: "10.2 Either Party may terminate immediately for material breach if the other fails to remedy the breach within fifteen (15) days of written notice." },
  { type: "p", text: "10.3 Effect of termination. Registered Deals that have reached Go-Live before termination continue to attract their trailing commission for the remainder of their 12-month window, provided the Client remains active and paying. No new opportunities may be registered after termination." },
  { type: "p", text: "10.4 For twelve (12) months after termination, the Consulting Partner will not solicit any Client it was introduced to through alfred ai for a competing product, nor solicit alfred ai’s staff." },
  { type: "p", text: "10.5 Non-compete. During the Term and for twelve (12) months after termination, within the Territory, the Consulting Partner must not directly or indirectly promote, refer, resell or provide sales or consulting services for any product or service that competes with alfred ai’s agentic AI project-execution platform in respect of any Client or prospective Client introduced or registered under this Agreement, and must not use alfred ai’s confidential information or approved materials to develop, market or support a competing product. This restriction does not apply to SiteVoice, which the Parties acknowledge is a complementary product the Consulting Partner may continue to promote." },
  { type: "p", text: "10.6 Non-circumvention. The Consulting Partner must not divert, steer or attempt to transfer any Registered Deal or introduced Client away from alfred ai to itself or to any third party providing a competing solution, whether during the Term or after termination." },

  { type: "h2", text: "11. Independent parties, liability and general" },
  { type: "p", text: "11.1 The Parties are independent contractors. This Agreement does not create an employment relationship, partnership, joint venture or agency, and neither Party may bind the other." },
  { type: "p", text: "11.2 Each Party is responsible for its own taxes. The Consulting Partner indemnifies alfred ai for any unauthorised representation, guarantee or discount it makes. Neither Party is liable for indirect or consequential loss. Each Party’s aggregate liability is limited to the commission paid or payable under this Agreement in the twelve (12) months before the relevant claim." },
  { type: "p", text: "11.3 Disputes will first be addressed by good-faith negotiation between senior representatives, and if unresolved within thirty (30) days, by mediation before any court proceedings. This Agreement is governed by the laws of New South Wales, Australia, and the Parties submit to the courts of that jurisdiction." },
  { type: "p", text: "11.4 This Agreement is the entire agreement between the Parties on its subject matter, may only be varied in writing signed by both Parties, may be signed in counterparts, and if any provision is unenforceable the rest continues in force. Neither Party may assign without the other’s consent, not to be unreasonably withheld." },

  { type: "h2", text: "Schedule 1 — Commission rate card" },
  COMMISSION_RATE_CARD,
  { type: "p", text: "Worked example (illustrative; setup fees only, single financial year; amounts in the Territory’s local currency): Assume each deal’s setup fee is $40,000. Deals 1–2 (cumulative $0 → $80,000): both at 10%. Deal 3 takes cumulative from $80,000 to $120,000 — it is the deal that crosses $100,000, so it stays at 10%. Deal 4 onwards (cumulative now above $100,000): 15%, until cumulative passes $250,000, then 25%, then 30% once above $500,000. Trailing 10% of each deal’s monthly fee applies for 12 months from that deal’s Go-Live, separately from the table above." },

  { type: "h2", text: "Schedule 2 — Territory" },
  { type: "p", text: "The selected Territory applies for all purposes of this Agreement, including the Local Currency and the commission thresholds in Schedule 1." },

  { type: "h2", text: "Schedule 3 — What you will get" },
  { type: "p", text: "As an alfred ai Consulting Partner, you receive: alfred ai Consulting Partner status, including the partner badge for your LinkedIn profile and email signature; a ready-to-use sales kit (client flyer, pitch deck, demo video and product one-pagers); product and pricing training; deal registration with opportunities logged and protected to you; full delivery and support by alfred ai; a dedicated partner contact; transparent commission tracking; and a structured onboarding so you can start selling from week one." },

  { type: "note", text: "Disclaimer: This document is a draft prepared by alfred ai for review and does not constitute legal, financial or tax advice. Each Party should obtain independent advice before signing." },
];

export const TERRITORY_OPTIONS = [
  "Australia and New Zealand",
  "United States",
  "Canada",
];
