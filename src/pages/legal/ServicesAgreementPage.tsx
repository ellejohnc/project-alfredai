import { motion } from "framer-motion";
import SEO from "@/components/SEO";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { SUPPORT_EMAIL } from "@/lib/siteConfig";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

interface Clause {
  heading: string;
  body: string[];
}

interface Part {
  title: string;
  intro?: string;
  clauses: Clause[];
}

const PARTS: Part[] = [
  {
    title: "1. Agreement Structure",
    intro:
      "This Standard AI Software Implementation & Services Agreement (the \"Agreement\") applies to all software, agents, implementation work and ongoing services supplied by Alfred AI Agent Services Pty Ltd (\"alfred ai\", \"we\", \"us\") to you (the \"Client\"). It is deliberately product-neutral: the specific product, service inclusions, deliverables, fees and timelines for your engagement are set out in the commercial documents described in clause 2.",
    clauses: [
      {
        heading: "1.1 Order of precedence",
        body: [
          "Where there is any inconsistency, the following order applies (highest first): (a) a signed variation or statement of work; (b) the accepted Fee Proposal or quote; (c) the Implementation Plan; (d) this Agreement; (e) any other alfred ai documentation.",
        ],
      },
      {
        heading: "1.2 Formation",
        body: [
          "This Agreement is formed when the Client accepts a Fee Proposal, signs a quote or proposal, pays a deposit or proof-of-concept reservation fee, or otherwise instructs alfred ai to commence work.",
        ],
      },
      {
        heading: "1.3 Entire agreement",
        body: [
          "Together with the documents in clause 2, this Agreement is the entire agreement between the parties and supersedes prior discussions, marketing material and estimates.",
        ],
      },
    ],
  },
  {
    title: "2. General Terms — Product, Service Inclusions & Implementation",
    intro:
      "This Agreement does not describe any specific product. The following documents define what is being delivered, and are incorporated into this Agreement by reference as they exist at the time of acceptance.",
    clauses: [
      {
        heading: "2.1 Product and scope",
        body: [
          "The product, module, agent or platform supplied to the Client is the product named in the accepted Fee Proposal. alfred ai may rename, re-version or re-package products over time; the functional scope committed in the Fee Proposal continues to apply.",
          "Anything not expressly listed as an inclusion is out of scope and quoted separately.",
        ],
      },
      {
        heading: "2.2 Service inclusions",
        body: [
          "Service inclusions are as per the accepted Fee Proposal current at the date of acceptance. Inclusions typically cover workflow build, system integration, configuration, testing, handover training and an agreed level of ongoing support and maintenance.",
          "Where the Fee Proposal specifies usage limits (workflows, documents, seats, runs or tokens), those limits apply. Usage beyond the stated limits is billable at then-current rates.",
        ],
      },
      {
        heading: "2.3 Implementation plan",
        body: [
          "Delivery follows the Implementation Plan provided to the Client, as of the date it is issued. Implementation Plans are working documents: sequencing, sprint order and milestone dates may be adjusted by agreement without a formal variation, provided the committed scope and fees are unchanged.",
          "Timelines assume the Client meets its responsibilities under clause 4. Delays caused by access, data or approval bottlenecks shift dependent milestones accordingly.",
        ],
      },
      {
        heading: "2.4 Proof of concept",
        body: [
          "Where a proof of concept or slot reservation fee is quoted, it secures delivery capacity and is applied against the setup fee if the Client proceeds. Refundability is as stated in the Fee Proposal.",
        ],
      },
      {
        heading: "2.5 Changes",
        body: [
          "Material changes to scope, integrations, data sources or output formats require a written variation. alfred ai will confirm any fee or timeline impact before proceeding.",
        ],
      },
    ],
  },
  {
    title: "3. Delivery and Acceptance",
    clauses: [
      {
        heading: "3.1 Kickoff",
        body: [
          "Work commences on acceptance of the Fee Proposal and receipt of the initial payment.",
        ],
      },
      {
        heading: "3.2 Acceptance",
        body: [
          "Deliverables are deemed accepted when the Client confirms acceptance, or five (5) business days after delivery if no written defect notice is received, or on first production use — whichever is earliest.",
        ],
      },
      {
        heading: "3.3 Defects",
        body: [
          "A defect is a failure of a deliverable to perform materially as described in the Fee Proposal or Implementation Plan. alfred ai will remedy notified defects at no charge. Change requests are not defects.",
        ],
      },
    ],
  },
  {
    title: "4. Client Responsibilities",
    clauses: [
      {
        heading: "4.1 Access and inputs",
        body: [
          "The Client will provide timely access to systems, credentials, sample data, templates, subject-matter experts and approvals reasonably required to deliver the services.",
        ],
      },
      {
        heading: "4.2 Third-party accounts",
        body: [
          "The Client is responsible for its own licences and subscriptions to third-party platforms the solution connects to, and for any usage fees those platforms charge.",
        ],
      },
      {
        heading: "4.3 Human oversight",
        body: [
          "AI outputs are decision support, not professional advice. The Client remains responsible for reviewing outputs before they are relied upon, published, priced from or submitted externally.",
        ],
      },
    ],
  },
  {
    title: "5. Fees, Payment and Term",
    clauses: [
      {
        heading: "5.1 Fees",
        body: [
          "Fees are as per the accepted Fee Proposal and are quoted in Australian dollars (AUD), exclusive of GST unless stated otherwise. GST of 10% is added where applicable.",
        ],
      },
      {
        heading: "5.2 Payment",
        body: [
          "Setup fees are payable per the payment schedule in the Fee Proposal. Recurring subscription or maintenance fees are billed in advance on the agreed cycle. Invoices are payable within seven (7) days unless stated otherwise.",
        ],
      },
      {
        heading: "5.3 Overdue amounts",
        body: [
          "alfred ai may suspend services on accounts more than fourteen (14) days overdue, after written notice. Suspension does not relieve the Client of accrued fees.",
        ],
      },
      {
        heading: "5.4 Term and renewal",
        body: [
          "The initial term and any minimum commitment are as stated in the Fee Proposal. Unless terminated, subscriptions renew automatically for successive periods of the same length.",
        ],
      },
      {
        heading: "5.5 Price reviews",
        body: [
          "Recurring fees may be reviewed annually with thirty (30) days' written notice. The Client may terminate at the end of the then-current term if it does not accept a reviewed price.",
        ],
      },
    ],
  },
  {
    title: "6. Intellectual Property",
    clauses: [
      {
        heading: "6.1 alfred ai IP",
        body: [
          "alfred ai retains all rights in its platforms, agents, models, prompts, frameworks, tooling and pre-existing materials, including improvements made during the engagement.",
        ],
      },
      {
        heading: "6.2 Client data",
        body: [
          "The Client retains all rights in its data, documents and content. alfred ai uses Client data only to deliver and support the services.",
        ],
      },
      {
        heading: "6.3 Licence",
        body: [
          "alfred ai grants the Client a non-exclusive, non-transferable licence to use the delivered solution for its internal business purposes for the term, conditional on fees being paid.",
        ],
      },
      {
        heading: "6.4 Model training",
        body: [
          "alfred ai does not use Client data to train publicly available foundation models. Client-specific configuration and tuning remains scoped to the Client's environment.",
        ],
      },
    ],
  },
  {
    title: "7. Confidentiality, Privacy and Security",
    clauses: [
      {
        heading: "7.1 Confidentiality",
        body: [
          "Each party will keep the other's confidential information confidential and use it only for the purposes of this Agreement. Obligations survive termination.",
        ],
      },
      {
        heading: "7.2 Privacy",
        body: [
          "alfred ai handles personal information in accordance with the Australian Privacy Principles and its Privacy Policy.",
        ],
      },
      {
        heading: "7.3 Security",
        body: [
          "alfred ai applies role-based access control, encryption in transit and at rest with its infrastructure providers, and least-privilege credential handling. Specific data residency or security commitments apply only where stated in writing.",
        ],
      },
      {
        heading: "7.4 Sub-processors",
        body: [
          "alfred ai uses reputable cloud, model and integration providers to deliver the services. A current list is available on request.",
        ],
      },
    ],
  },
  {
    title: "8. Warranties and Liability",
    clauses: [
      {
        heading: "8.1 Warranty",
        body: [
          "alfred ai warrants that services will be performed with due care and skill by suitably qualified personnel.",
        ],
      },
      {
        heading: "8.2 AI limitations",
        body: [
          "AI systems are probabilistic. alfred ai does not warrant that outputs will be error-free, complete or uninterrupted, or that any specific commercial result will be achieved.",
        ],
      },
      {
        heading: "8.3 Liability cap",
        body: [
          "To the extent permitted by law, each party's aggregate liability is limited to the fees paid by the Client in the twelve (12) months preceding the claim. Neither party is liable for indirect or consequential loss, loss of profit or loss of data.",
        ],
      },
      {
        heading: "8.4 Australian Consumer Law",
        body: [
          "Nothing in this Agreement excludes rights that cannot be excluded under the Australian Consumer Law.",
        ],
      },
    ],
  },
  {
    title: "9. Suspension, Termination and Exit",
    clauses: [
      {
        heading: "9.1 Termination for convenience",
        body: [
          "Either party may terminate a subscription at the end of the then-current term by giving thirty (30) days' written notice. Minimum commitments in the Fee Proposal continue to apply.",
        ],
      },
      {
        heading: "9.2 Termination for cause",
        body: [
          "Either party may terminate immediately if the other commits a material breach not remedied within fourteen (14) days of notice, or becomes insolvent.",
        ],
      },
      {
        heading: "9.3 Effect of termination",
        body: [
          "Access to hosted agents and workflows ceases on termination. Setup fees and fees for work performed are non-refundable. Prepaid unused subscription fees are refunded only where alfred ai terminates without cause.",
        ],
      },
      {
        heading: "9.4 Data export",
        body: [
          "On request within thirty (30) days of termination, alfred ai will provide the Client's data in a commonly used machine-readable format. After that period data may be deleted.",
        ],
      },
    ],
  },
  {
    title: "10. General",
    clauses: [
      {
        heading: "10.1 Subcontracting",
        body: ["alfred ai may use subcontractors and remains responsible for their performance."],
      },
      {
        heading: "10.2 Non-solicitation",
        body: [
          "During the term and for twelve (12) months afterwards, neither party will solicit the other's personnel directly involved in the engagement without written consent.",
        ],
      },
      {
        heading: "10.3 Publicity",
        body: [
          "alfred ai may refer to the Client as a customer in general terms. Named case studies, logos and project details require the Client's prior written approval.",
        ],
      },
      {
        heading: "10.4 Force majeure",
        body: [
          "Neither party is liable for delays caused by events beyond its reasonable control, including outages of third-party platforms or model providers.",
        ],
      },
      {
        heading: "10.5 Governing law",
        body: [
          "This Agreement is governed by the laws of New South Wales, Australia, and the parties submit to the non-exclusive jurisdiction of its courts.",
        ],
      },
      {
        heading: "10.6 Updates",
        body: [
          "alfred ai may update this Agreement from time to time. The version in force at the date the Client accepts a Fee Proposal governs that engagement.",
        ],
      },
    ],
  },
];

/**
 * Revision control.
 * Add a new entry to the TOP of this list whenever the terms change.
 * `version` is the document version quoted in Fee Proposals.
 */
interface Revision {
  version: string;
  validFrom: string; // human readable, en-AU
  status: "current" | "superseded";
  summary: string;
}

const REVISIONS: Revision[] = [
  {
    version: "v1.1",
    validFrom: "1 July 2026",
    status: "current",
    summary:
      "Revised standard agreement with clarified order of precedence, refined delivery and acceptance terms, and updated client responsibility and liability provisions. Continues to incorporate the Fee Proposal and Implementation Plan by reference.",
  },
  {
    version: "v1.0",
    validFrom: "1 April 2026",
    status: "superseded",

    summary:
      "First issue of the product-neutral standard agreement. Introduces order of precedence, incorporation of the Fee Proposal (product and service inclusions) and Implementation Plan, delivery and acceptance, fees and term, IP, confidentiality and security, liability, and exit terms.",
  },
];

const CURRENT_REVISION = REVISIONS.find((r) => r.status === "current") ?? REVISIONS[0];

const ServicesAgreementPage = () => {
  const validFrom = CURRENT_REVISION.validFrom;
  const version = CURRENT_REVISION.version;
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="AI Implementation & Services Agreement"
        description="alfred ai's standard AI software implementation and services agreement — product-neutral terms that work alongside your fee proposal and implementation plan."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Services Agreement", url: "/legal/services-agreement" },
        ]}
      />
      <Header />
      <main className="pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <section className="container-wide py-10 md:py-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              Legal
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Standard AI Software Implementation &amp; Services Agreement
            </h1>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-foreground">
                Version {version}
              </span>
              <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-foreground">
                Valid from {validFrom}
              </span>
            </div>

            <p className="text-muted-foreground mb-10 leading-relaxed">
              These are alfred ai's standard terms for AI software implementation and ongoing
              services. They are product-neutral — your product, service inclusions and delivery
              schedule come from your Fee Proposal and Implementation Plan, which are read together
              with this document.
            </p>

            {/* Incorporated documents callout */}
            <div className="rounded-2xl border border-border bg-card p-5 md:p-6 mb-12">
              <h2 className="text-lg font-semibold text-foreground mb-3">
                What defines your engagement
              </h2>
              <ul className="space-y-2 text-muted-foreground text-sm md:text-base">
                <li>
                  <strong className="text-foreground">Product:</strong> as named in your accepted Fee
                  Proposal.
                </li>
                <li>
                  <strong className="text-foreground">Service inclusions:</strong> as per your Fee
                  Proposal, current at the date of acceptance.
                </li>
                <li>
                  <strong className="text-foreground">Delivery:</strong> as per your Implementation
                  Plan, as of the date it is issued.
                </li>
                <li>
                  <strong className="text-foreground">Fees and term:</strong> as per your Fee
                  Proposal, in AUD plus 10% GST.
                </li>
              </ul>
            </div>

            {/* Contents */}
            <nav aria-label="Contents" className="mb-12">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Contents
              </h2>
              <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
                {PARTS.map((part, i) => (
                  <li key={part.title}>
                    <a
                      href={`#clause-${i + 1}`}
                      className="block py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {part.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="space-y-12">
              {PARTS.map((part, i) => (
                <section key={part.title} id={`clause-${i + 1}`} className="scroll-mt-28">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">{part.title}</h2>
                  {part.intro && (
                    <p className="text-muted-foreground leading-relaxed mb-6">{part.intro}</p>
                  )}
                  <div className="space-y-6">
                    {part.clauses.map((clause) => (
                      <div key={clause.heading}>
                        <h3 className="text-lg font-medium text-foreground mb-2">
                          {clause.heading}
                        </h3>
                        {clause.body.map((paragraph, pi) => (
                          <p
                            key={pi}
                            className="text-muted-foreground leading-relaxed mb-3 last:mb-0"
                          >
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* Revision control & history */}
            <section id="revision-history" className="mt-16 scroll-mt-28">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-1">
                    Revision control &amp; history
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Version in force: {version} · {validFrom}
                  </p>
                </div>
                <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center min-h-[48px] px-5 rounded-xl border border-border text-foreground font-medium hover:bg-muted/60 transition-colors"
                    >
                      View revision history
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Revision control &amp; history</DialogTitle>
                      <DialogDescription>
                        Each issue of this Agreement carries a version number and a "valid from" date.
                        The version in force on the date you accept a Fee Proposal governs that
                        engagement, even if these terms are later revised.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                      <table className="w-full min-w-[560px] text-left border border-border rounded-2xl overflow-hidden">
                        <thead className="bg-muted/60">
                          <tr>
                            <th className="px-4 py-3 text-sm font-medium text-foreground">Version</th>
                            <th className="px-4 py-3 text-sm font-medium text-foreground">Valid from</th>
                            <th className="px-4 py-3 text-sm font-medium text-foreground">Status</th>
                            <th className="px-4 py-3 text-sm font-medium text-foreground">
                              Summary of changes
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {REVISIONS.map((rev) => (
                            <tr key={rev.version} className="border-t border-border align-top">
                              <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">
                                {rev.version}
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                                {rev.validFrom}
                              </td>
                              <td className="px-4 py-3 text-sm whitespace-nowrap">
                                <span
                                  className={
                                    rev.status === "current"
                                      ? "inline-flex items-center rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground"
                                      : "inline-flex items-center rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground"
                                  }
                                >
                                  {rev.status === "current" ? "Current" : "Superseded"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground leading-relaxed">
                                {rev.summary}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Need a superseded version for audit or procurement? Email {SUPPORT_EMAIL} with
                      the version number and we will send the archived PDF.
                    </p>
                  </DialogContent>
                </Dialog>
              </div>
            </section>

            {/* Contact / fallback */}

            <div className="mt-16 rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-2">Questions on these terms</h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                If a clause conflicts with your Fee Proposal, or you need an amended version for
                procurement, contact us and we will confirm the position in writing.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=Services%20Agreement%20enquiry`}
                  className="inline-flex items-center justify-center min-h-[48px] px-6 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
                >
                  Email {SUPPORT_EMAIL}
                </a>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Alfred AI Agent Services Pty Ltd. This page is general information, not legal advice.
              </p>
            </div>
          </motion.div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ServicesAgreementPage;
