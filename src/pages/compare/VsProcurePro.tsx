import { ClipboardList, Cloud, Cog, Workflow } from "lucide-react";
import ComparisonTemplate from "./ComparisonTemplate";

const VsProcurePro = () => {
  const data = {
    competitorName: "ProcurePro",
    tagline: "Procurement control vs. end-to-end agentic execution",
    description:
      "ProcurePro centralises subcontractor procurement for main contractors—packages, tenders, and award. alfred ai brings agentic AI across the whole construction lifecycle, from drawings to estimate, RFIs, vendor compliance and beyond.",
    features: [
      { feature: "Subcontractor Procurement Workflow", alfred: true, competitor: true },
      { feature: "Package & Tender Management", alfred: true, competitor: true },
      { feature: "Bid Levelling & Comparison", alfred: true, competitor: true },
      { feature: "Vendor Compliance & Pre-qualification", alfred: true, competitor: true },
      { feature: "From Drawings to Draft Estimate (AI)", alfred: true, competitor: false, highlight: true },
      { feature: "AI Email Triage & RFI Handling", alfred: true, competitor: false, highlight: true },
      { feature: "Agentic AI Across Whole Lifecycle", alfred: true, competitor: "Procurement only", highlight: true },
      { feature: "Private Cloud / On-Premise Deploy", alfred: true, competitor: false, highlight: true },
      { feature: "AI System Ongoing Maintenance", alfred: true, competitor: false },
      { feature: "Configurable Agents Per Workflow", alfred: true, competitor: false },
      { feature: "Voice AI Site Reporting", alfred: true, competitor: false },
      { feature: "Mid-Market Pricing ($10M–$300M)", alfred: true, competitor: true },
    ],
    keyDifferentiators: [
      {
        icon: <Workflow className="w-6 h-6" />,
        title: "Whole-of-Lifecycle, Not Just Procurement",
        description:
          "ProcurePro is best-in-class for buying. alfred ai extends agentic AI across estimating, RFIs, compliance, handover and admin—one operating layer.",
      },
      {
        icon: <ClipboardList className="w-6 h-6" />,
        title: "Drawings to Draft Estimate",
        description:
          "Turn architectural drawings into a structured draft estimate in minutes—then push trade packages into your existing procurement flow.",
      },
      {
        icon: <Cog className="w-6 h-6" />,
        title: "Configurable Agents",
        description:
          "Agents are tuned to your templates, trades and approval rules—not a fixed product UI. They evolve as your workflows evolve.",
      },
      {
        icon: <Cloud className="w-6 h-6" />,
        title: "Private Cloud Deploy",
        description:
          "Keep tender pricing, sub data and project IP on your own infrastructure—important for government, infrastructure and tier-1 clients.",
      },
    ],
    alfredBestFor: [
      "Contractors wanting AI across estimating, RFIs and compliance—not just procurement",
      "Teams turning drawings and scopes into structured estimates and trade packages",
      "Firms requiring private cloud or on-premise deployment of AI",
      "Organisations seeking configurable agents tuned to their templates and workflows",
      "Mid-market builders ($10M–$300M) wanting one agentic layer over existing systems",
    ],
    competitorBestFor: [
      "Main contractors focused specifically on subcontractor procurement control",
      "Teams standardising packages, tenders and bid levelling in one product",
      "Organisations happy with a SaaS-only procurement tool",
      "Businesses that already have estimating, RFI and compliance tools they like",
    ],
  };

  return <ComparisonTemplate data={data} />;
};

export default VsProcurePro;
