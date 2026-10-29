import { LucideIcon, FileCheck2, ClipboardCheck, PackageCheck, PenLine, Megaphone, Play, FileText, Banknote } from "lucide-react";
import linkedinPost from "@/assets/use-cases/marketing/linkedin-post.png.asset.json";
import scalePost from "@/assets/use-cases/marketing/scale-post.jpg.asset.json";

import carouselPost from "@/assets/use-cases/marketing/carousel-post.pdf.asset.json";
import carouselThumb from "@/assets/use-cases/marketing/carousel-thumb.jpg.asset.json";
import leadMagnetPdf from "@/assets/use-cases/marketing/lead-magnet.pdf.asset.json";
import leadMagnetThumb from "@/assets/use-cases/marketing/lead-magnet-thumb.jpg.asset.json";




export type JourneyActor = "human" | "agent";

export type JourneyStage = {
  n: number;
  title: string;
  actor: JourneyActor;
  text: string;
};

export type MetricComparison = {
  label: string;
  before: string;
  after: string;
  /** Optional Lucide icon for visual identity. */
  icon?: LucideIcon;
  /** Numeric magnitude of the "before" state (for bar scaling). */
  beforeValue?: number;
  /** Numeric magnitude of the "after" state (for bar scaling). */
  afterValue?: number;
  /** When true, lower is better (e.g. cost). */
  betterIsLower?: boolean;
  /** Short headline delta, e.g. "5×" or "-75%". */
  delta?: string;
};

export type GalleryItem = {
  type: string;
  title: string;
  src: string;
  /** Optional preview image shown in the grid (e.g. for PDFs). */
  poster?: string;
  /** Optional multiple images the viewer can swipe through in the lightbox. */
  images?: string[];
};

export type UseCase = {
  slug: string;
  title: string;
  /** Short label used on cards and chips. */
  shortTitle: string;
  /** Which suite layer(s) power this journey. */
  layers: string[];
  icon: LucideIcon;
  persona: string;
  problem: string;
  goal: string;
  solution: string;
  /** One-line teaser for the index grid. */
  summary: string;
  /** High-level stage names shown as a chip rail. */
  stageNames: string[];
  stages: JourneyStage[];
  /** Optional before/after metrics for the detail page. */
  metrics?: MetricComparison[];
  /** Optional sample outputs gallery for the detail page. */
  gallery?: GalleryItem[];
  /** Optional hero videos showcasing sample outputs. */
  heroVideo?: {
    videos: {
      src: string;
      label: string;
    }[];
    label: string;
  };
};

export const useCases: UseCase[] = [
  {
    slug: "automated-tender-bid-completion",
    title: "Automated Tender & Bid Form Completion",
    shortTitle: "Tender & Bid Completion",
    layers: ["Butler", "AOS"],
    icon: FileCheck2,
    persona:
      "A bid coordinator responsible for completing and submitting tender and bid request forms to prospective clients.",
    problem:
      "Bid coordinators receive tender forms that need company details, credentials, insurance, licences, and rate cards. Teams manually search across scattered documents, copy and paste into forms, and cross-reference project-specific pricing — slow, repetitive, and error-prone.",
    goal:
      "Cut tender completion time by automatically extracting the required fields, populating standard company information from a governed knowledge base, flagging any missing or project-specific data, and regenerating the document the moment anything changes.",
    solution:
      "An end-to-end agent ingests the tender form (DOCX or PDF), extracts every required field, and matches it against your knowledge base — company profile, ISO and licence certificates, insurance, and rate cards. It fills what it can, produces a gap report for what it can't, accepts your input conversationally, validates completeness, and generates a submission-ready document. Update anything and it regenerates instantly.",
    summary:
      "Turn empty tender forms into submission-ready documents using your governed company knowledge base — with a clear gap report for anything missing.",
    stageNames: [
      "Identify",
      "Upload",
      "Extract",
      "Match",
      "Gap analysis",
      "Review",
      "Integrate",
      "Generate",
      "Refresh",
      "Submit",
    ],
    stages: [
      { n: 1, actor: "human", title: "Tender identified", text: "You receive a tender or bid form that requires company information, credentials, and pricing." },
      { n: 2, actor: "human", title: "Form uploaded", text: "You upload the empty form and ask the agent to complete it from the knowledge base." },
      { n: 3, actor: "agent", title: "Field extraction", text: "The agent parses the document, identifies every required field, and maps it to standard categories." },
      { n: 4, actor: "agent", title: "Knowledge base matching", text: "It queries your governed knowledge base and populates each field it can confidently match, flagged as verified." },
      { n: 5, actor: "agent", title: "Gap analysis", text: "It produces a gap report: fields found, fields not found, and data not held in standard documents." },
      { n: 6, actor: "human", title: "Review & input", text: "You review the draft and gap report and supply anything missing in plain language." },
      { n: 7, actor: "agent", title: "Integrate & validate", text: "The agent merges your input with knowledge-base data and validates that every required field now has a value." },
      { n: 8, actor: "agent", title: "Document generated", text: "It produces the completed tender form, ready to download." },
      { n: 9, actor: "human", title: "Update & refresh", text: "Need a change? Give the instruction and the document regenerates immediately." },
      { n: 10, actor: "human", title: "Submission ready", text: "You download the final document and submit it through the required channel." },
    ],
  },
  {
    slug: "rfp-compliance-bid-recommendation",
    title: "RFP Compliance Scoring & Go/No-Go Recommendation",
    shortTitle: "RFP Go/No-Go Scoring",
    layers: ["Watch", "Axiom"],
    icon: ClipboardCheck,
    persona:
      "A bid manager or proposal lead responsible for evaluating RFPs and making go/no-bid decisions.",
    problem:
      "RFPs arrive with dozens or hundreds of mandatory requirements across technical, architectural, security, operational, and compliance areas. Teams review each one by hand, hunt through scattered documentation, and make subjective go/no-bid calls — slow, inconsistent, and prone to costly bids on work the business can't deliver.",
    goal:
      "Accelerate evaluation by scoring mandatory requirements against your real capabilities, calculating an objective compliance percentage, pinpointing gaps and non-compliant items, and producing a clear bid recommendation for faster, more confident decisions.",
    solution:
      "An agent ingests the mandatory requirements file, analyses each requirement against your knowledge base — technical documentation, solution architecture, and ways of working — calculates an overall compliance percentage, flags gaps and non-compliant items with plain-English explanations, and issues a structured go/no-go recommendation. Supply missing evidence and it recalculates in real time.",
    summary:
      "Score every RFP requirement against your real capabilities and get an objective compliance percentage plus a clear go/no-go recommendation.",
    stageNames: [
      "Receive",
      "Upload",
      "Analyse KB",
      "Parse",
      "Match",
      "Score",
      "Gaps",
      "Recommend",
      "Review",
      "Recalculate",
      "Report",
      "Decide",
    ],
    stages: [
      { n: 1, actor: "human", title: "RFP received", text: "Your team receives an RFP listing the mandatory requirements you must meet to be eligible." },
      { n: 2, actor: "human", title: "Requirements uploaded", text: "You upload the requirements file and ask the agent to assess compliance and advise whether to bid." },
      { n: 3, actor: "agent", title: "Knowledge base analysis", text: "The agent accesses your technical documentation, architecture, and operating procedures." },
      { n: 4, actor: "agent", title: "Requirement parsing", text: "It extracts each individual requirement and categorises it — infrastructure, security, integrations, operations, and more." },
      { n: 5, actor: "agent", title: "Capability matching", text: "It cross-references each requirement to supporting evidence in your documentation." },
      { n: 6, actor: "agent", title: "Compliance scoring", text: "It scores each requirement (met, partially met, not met) and calculates an overall compliance percentage." },
      { n: 7, actor: "agent", title: "Gap identification", text: "It highlights missing documents and non-compliant items, explaining the business or technical reason for each." },
      { n: 8, actor: "agent", title: "Bid recommendation", text: "It issues a clear recommendation based on the compliance score and the severity of any gaps." },
      { n: 9, actor: "human", title: "Review & input", text: "You review the analysis and supply missing evidence, updated capabilities, or clarifications." },
      { n: 10, actor: "agent", title: "Recalculate", text: "The agent re-analyses against the new information and updates the score and recommendation." },
      { n: 11, actor: "agent", title: "Report generated", text: "It produces an updated compliance report with all supporting references, ready to circulate." },
      { n: 12, actor: "human", title: "Bid decision", text: "You make an informed go/no-go call, with the compliance analysis ready for your bid package." },
    ],
  },
  {
    slug: "purchase-order-to-sales-order",
    title: "Purchase Order to ERP Sales Order",
    shortTitle: "PO → ERP Sales Order",
    layers: ["Butler", "Omega"],
    icon: PackageCheck,
    persona:
      "A procurement or order-management specialist who processes incoming purchase orders and posts them to the ERP.",
    problem:
      "Purchase orders arrive in mixed formats — Excel, PDF, scanned images, plain text — with non-standard layouts and codes. Teams spend hours validating item codes and re-keying data into the ERP, creating delays and errors.",
    goal:
      "Cut review time by automatically validating customer details and product codes. Documents that pass are approved automatically; only those with missing or inconsistent data are flagged for a human.",
    solution:
      "An agent ingests and classifies every PO format, extracts header and line-item fields, and validates them against ERP master data. It resolves the correct customer by cross-checking IDs against address data, maps customer item codes to your ERP material codes, and checks pricing against contracts. Clean orders are approved and posted to the ERP via API with full audit trail; exceptions route to a review queue with a ready-to-send clarification email.",
    summary:
      "Ingest any PO format, validate against ERP master data, and post clean sales orders automatically — with exceptions routed to a human queue.",
    stageNames: [
      "Receive",
      "Forward",
      "Classify",
      "Extract",
      "Resolve customer",
      "Map codes",
      "Exceptions",
      "Auto-approve",
      "Human review",
      "Approve",
      "SO draft",
      "ERP post",
      "Confirm",
      "Report",
    ],
    stages: [
      { n: 1, actor: "human", title: "PO received", text: "Purchase orders arrive by email in mixed formats and layouts." },
      { n: 2, actor: "human", title: "PO forwarded", text: "You forward the original email to the agent for processing." },
      { n: 3, actor: "agent", title: "Ingest & classify", text: "The agent ingests each attachment, classifies it by type, and routes it to the right flow." },
      { n: 4, actor: "agent", title: "Field extraction", text: "It captures header fields and every line item — code, description, quantity, unit, price, and dates." },
      { n: 5, actor: "agent", title: "Customer resolution", text: "It matches the customer against ERP records using name and address, flagging any ambiguity." },
      { n: 6, actor: "agent", title: "Code mapping & validation", text: "It maps customer item codes to your ERP material codes, validates fields, and checks pricing against contracts." },
      { n: 7, actor: "agent", title: "Exception flagging", text: "If anything blocks the order, it explains why and drafts a ready-to-send clarification email." },
      { n: 8, actor: "agent", title: "Automatic approval", text: "If every validation passes, it approves the PO and prepares a structured sales-order draft." },
      { n: 9, actor: "human", title: "Human review", text: "You resolve any flagged issues directly in the agent — customer, mappings, delivery, or pricing." },
      { n: 10, actor: "human", title: "Approve", text: "You approve the order with any adjustments applied." },
      { n: 11, actor: "agent", title: "Sales-order draft", text: "The agent compiles the final payload with traceability links and a full audit trail." },
      { n: 12, actor: "agent", title: "ERP posting", text: "It creates the sales order in the ERP via API and returns the ERP-generated number." },
      { n: 13, actor: "agent", title: "Confirmation", text: "It generates an order confirmation and closes the PO-to-SO cycle with an auditable handoff." },
      { n: 14, actor: "agent", title: "Monthly report", text: "Each month it delivers a performance report — straight-through processing rate, exceptions, and volumes." },
    ],
  },
  {
    slug: "marketing-content-production",
    title: "Consistency is the name of the game.",
    shortTitle: "Marketing Content Production",
    layers: ["Butler", "AOS"],
    icon: PenLine,
    persona:
      "Founders, marketing leads, and growth teams at $2M–$10M turnover businesses who want high-volume content without expanding headcount.",
    problem:
      "One post a week. Maybe one video a month. Buyers scroll daily. Search moves daily. The brand stays silent while competitors pull the traffic.",
    goal:
      "Publish 5–10 posts, 1–2 videos, one blog, and one ebook every week. Dominate SEO and AEO. Convert engagement into booked meetings.",
    solution:
      "A 90% automated AI content coordinator. It scrapes, researches, designs, writes, verifies, schedules, posts, replies, nurtures, and books — all in your voice. You guide the strategy. It runs the production line.",
    summary:
      "From one post a week to a full content engine: 5–10 posts, weekly blogs, ebooks, and videos — researched, created, and published by AI.",
    stageNames: [
      "Ingest",
      "Benchmark",
      "Research",
      "Create",
      "Write",
      "Verify",
      "Review",
      "Schedule",
      "Publish",
      "Engage",
      "Nurture",
      "Report",
    ],
    metrics: [
      { label: "Social posts", before: "4/month", after: "20–40/month", icon: Megaphone, beforeValue: 4, afterValue: 30, delta: "7.5×" },
      { label: "Short videos", before: "1/month", after: "4–8/month", icon: Play, beforeValue: 1, afterValue: 6, delta: "6×" },
      { label: "Long-form content", before: "1 blog/month", after: "4 blogs + 4 ebooks/month", icon: FileText, beforeValue: 1, afterValue: 8, delta: "8×" },
      { label: "Monthly content cost", before: "$8k–$10k/month or more (internal or remote outsourced)", after: "From $2,500/month (incl. tokens & AI engine)", icon: Banknote, betterIsLower: true, beforeValue: 10000, afterValue: 2500, delta: "-75%" },
    ],
    heroVideo: {
      videos: [
        { src: "https://www.youtube.com/embed/484PzHozJsw?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1", label: "Content calendar sample" },
        { src: "https://www.youtube.com/embed/7E-Z6JDdRFM?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1", label: "Marketing workflow sample" },
        { src: "https://www.youtube.com/embed/spfK9UYFiMQ?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1", label: "AI content sample" },
        { src: "https://www.youtube.com/embed/l6d5or0eNZY?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1", label: "Content sample" },
        { src: "https://www.youtube.com/embed/iBxpuXsaa8M?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1", label: "Content sample" },
      ],
      label: "Short video samples",
    },
    gallery: [
      { type: "Post", title: "LinkedIn social post", src: linkedinPost.url, images: [linkedinPost.url, scalePost.url] },
      
      { type: "Carousel", title: "PDF Carousel", src: carouselPost.url, poster: carouselThumb.url },

      
      
      
      { type: "PDF", title: "Lead magnet PDF", src: leadMagnetPdf.url, poster: leadMagnetThumb.url },
    ],
    stages: [
      { n: 1, actor: "human", title: "Upload strategy", text: "Drop in your brand strategy, ICP, tone of voice, content pillars, and targets. The coordinator locks in the rules." },
      { n: 2, actor: "human", title: "Add benchmarks", text: "Add 10–20 competitor or industry accounts. The AI studies what wins — topics, formats, cadence, hooks." },
      { n: 3, actor: "agent", title: "Research at scale", text: "It scrapes trends, keywords, hashtags, and high-performing content. The calendar fills with proven angles." },
      { n: 4, actor: "agent", title: "Generate creatives", text: "Statics, carousels, short video scripts, PDFs, ebook layouts, and landing-page visuals — all on-brand." },
      { n: 5, actor: "agent", title: "Write copy", text: "Social posts, blogs, emails, ad scripts, and landing pages — written from your ICP, not generic templates." },
      { n: 6, actor: "agent", title: "Verify brand fit", text: "Every asset is checked against guidelines, banned terms, claims, and tone before it reaches you." },
      { n: 7, actor: "human", title: "Approve the line", text: "You review the calendar, edit the strategic pieces, and approve. Most assets pass with one click." },
      { n: 8, actor: "agent", title: "Queue the calendar", text: "Approved content queues across platforms at the optimal cadence: 5–10 posts, 1–2 videos, 1 blog, 1 ebook weekly." },
      { n: 9, actor: "agent", title: "Publish everywhere", text: "It posts to social, blogs, email, and landing pages at the scheduled times — no manual uploads." },
      { n: 10, actor: "agent", title: "Reply to engagement", text: "Comments and DMs are answered in your brand voice. Sensitive questions are escalated to you instantly." },
      { n: 11, actor: "agent", title: "Nurture and book", text: "It triggers nurture sequences, qualifies interest, and books sales calls straight into your calendar or CRM." },
      { n: 12, actor: "agent", title: "Score the momentum", text: "Track content volume, rankings, search visibility, engagement, and meetings booked — one clear report." },
    ],
  },
];

export const getUseCaseBySlug = (slug?: string) =>
  useCases.find((u) => u.slug === slug);
