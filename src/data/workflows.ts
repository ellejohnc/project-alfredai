import { Ruler, FileCheck2, FileText, ClipboardCheck, Bot, MailCheck, type LucideIcon } from "lucide-react";

export type Workflow = { title: string; icon: LucideIcon; ["href"]: string; cta: string; summary: string; flagship?: boolean };

/** The six workflows — single source for the workflows page and "More workflows" lists. */
export const WORKFLOWS: Workflow[] = [
  { title: "AI Take-Off", flagship: true, icon: Ruler, href: "/solutions/ai-takeoff", cta: "See AI Take-Off",
    summary: "Turn PDF drawings into quantities and a draft estimate, with your estimators reviewing every flagged item before it goes out." },
  { title: "Tender Management", icon: FileCheck2, href: "/products/use-cases/automated-tender-bid-completion", cta: "See the tender workflow",
    summary: "Complete tender and bid forms from your own documents, score RFP compliance and get a clear go/no-go recommendation." },
  { title: "Billing and Invoicing Triage", icon: FileText, href: "/demos/purchase-bill-intake", cta: "See billing triage",
    summary: "Sort, code and match incoming bills and purchase orders, then push them into your accounts or ERP system for approval." },
  { title: "Inspection & Technical Reports", icon: ClipboardCheck, href: "/demos/technical-report-agent", cta: "See technical reports",
    summary: "Turn site findings, photos and notes into consistent inspection and technical reports your team checks and signs off." },
  { title: "Email Pre-send Intelligence", icon: MailCheck, href: "/solutions/email-presend-intelligence", cta: "See pre-send intelligence",
    summary: "Emailing and Conversations re-imagined. Your outgoing project emails are checked against what your organisation already knows — variations, instructions, payment commitments, programme changes and contractual notices get a deeper look before they're sent." },
  { title: "AI Employees", icon: Bot, href: "/solutions/ai-for-construction/operations", cta: "See AI Employees",
    summary: "Done-for-you digital team members that handle repeat admin across your existing systems, with people in the loop where it matters." },
];
