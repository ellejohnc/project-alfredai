/** The homepage FAQ copy, kept apart from the section that renders it. */

import { Users, ShieldCheck } from "lucide-react";

export type FAQGroupId = "platform" | "working-together";

export interface FAQ {
  question: string;
  answer: string;
}

export interface FAQGroup {
  id: FAQGroupId;
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof Users;
  faqs: FAQ[];
}

export const homepageFAQGroups: FAQGroup[] = [
  {
    id: "platform",
    label: "About alfred ai",
    shortLabel: "About alfred ai",
    description: "Who we serve, what changes and what it costs.",
    icon: Users,
    faqs: [
      {
        question: "Who does alfred ai serve?",
        answer:
          "alfred ai is built for mid-tier Australian firms — typically $5M–$300M turnover — where projects, paperwork and people move fast. Construction and contracting is where we started and where we go deepest, and the same approach serves professional and operational firms that run on documents, approvals and repeatable workflows.",
      },
      {
        question: "How does alfred ai help my business?",
        answer:
          "alfred ai is an execution layer that sits on top of your business. It reads your drawings, contracts, emails and systems, then runs the workflows around them — take-offs, tenders, invoicing triage, technical reports, compliance chasing and day-to-day communications — so your team spends its hours on the work that wins and delivers projects. You keep every decision; alfred ai does the running around.",
      },
      {
        question: "What kind of result can I expect?",
        answer:
          "Most firms measure it first in time: dramatically fewer hours lost to pre-build and administrative workflows, and tenders turned around in a fraction of the time. The second measure is commercial: fewer costly errors escaping out the door, because communications and documents are checked against what your organisation already knows. We agree the measures with you up front and report against them — no vague promises.",
      },
      {
        question: "What's alfred ai's pricing like?",
        answer:
          "It depends — and that's deliberate. We package alfred ai around your estimated usage, agreed up front, rather than a per-seat licence or metered tokens. You can go month to month with 30 days' notice, or lock in a 12–24 month term if that suits you better. Talk to our team and we'll price it against your actual workload.",
      },
    ],
  },
  {
    id: "working-together",
    label: "Working with alfred ai",
    shortLabel: "Working with us",
    description: "Accuracy, your existing software, timing, security and IP.",
    icon: ShieldCheck,
    faqs: [
      {
        question: "How accurate are the AI-generated results?",
        answer:
          "alfred ai is built to be checked, not blindly trusted. Every output cites where its information came from, and anything ambiguous, missing or contradicting is flagged for a person to review — nothing leaves your business without human sign-off. We also measure our own precision and improve it continuously from the corrections your team approves.",
      },
      {
        question: "Does alfred ai replace my current software stack?",
        answer:
          "No — alfred ai works alongside the tools you already run, from accounting and project systems to email and shared drives. Many clients keep their existing systems of record and let alfred ai do the execution around them. Where you're running fragmented tools that overlap, you can consolidate onto alfred ai — but that's your call, not a requirement.",
      },
      {
        question: "How long does it take for me to implement?",
        answer:
          "Weeks, not months. alfred ai is a done-for-you service: we map your workflows, train the AI on your own documents, processes and decisions, connect it to your existing systems, and bring your team up to speed. You're not building anything yourself — you're reviewing what we've trained and telling us where to adjust.",
      },
      {
        question: "How does security, privacy and IP ownership work?",
        answer:
          "Your data stays yours. Everything is encrypted in transit and at rest, with role-based access control, Australian data residency options and audit trails on every AI action. Your documents and data are never used to train models for other customers, and the trained models and outputs we deliver to you belong to your business.",
      },
    ],
  },
];

// Flat list used by <SEO faqs={...}> on the homepage for a SINGLE FAQPage
// JSON-LD block. Keep this export — Index.tsx imports it directly.
export const homepageKeywordFAQs: FAQ[] = homepageFAQGroups.flatMap((g) => g.faqs);
