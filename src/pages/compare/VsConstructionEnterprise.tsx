import { Building2, Cloud, Cog, Wrench, Zap, Timer } from "lucide-react";
import ComparisonTemplate from "./ComparisonTemplate";

const VsConstructionEnterprise = () => {
  const data = {
    competitorName: "Trimble e-Builder & Aconex",
    tagline: "Capital programs vs. agile execution",
    description: "Trimble e-Builder and Oracle Aconex serve massive capital programs ($100M+ projects) with comprehensive document control. alfred ai delivers AI-powered efficiency for mid-market contractors—faster deployment, lower complexity, ongoing optimization.",
    features: [
      { feature: "Document Management", alfred: true, competitor: true },
      { feature: "Workflow Automation", alfred: true, competitor: true },
      { feature: "Compliance Tracking", alfred: true, competitor: true },
      { feature: "Audit Trails", alfred: true, competitor: true },
      { feature: "Mid-Market Focus ($10M-$300M)", alfred: true, competitor: false, highlight: true },
      { feature: "Rapid Deployment (weeks not months)", alfred: true, competitor: false, highlight: true },
      { feature: "AI-Powered Automation", alfred: true, competitor: "Manual workflows", highlight: true },
      { feature: "Private Cloud Deploy", alfred: true, competitor: "Cloud only", highlight: true },
      { feature: "AI System Ongoing Maintenance", alfred: true, competitor: false },
      { feature: "Voice AI Site Reporting", alfred: true, competitor: false },
      { feature: "Autonomous Document Processing", alfred: true, competitor: false },
      { feature: "Lower Total Cost of Ownership", alfred: true, competitor: false },
    ],
    keyDifferentiators: [
      {
        icon: <Timer className="w-6 h-6" />,
        title: "Rapid Deployment",
        description: "Go live in weeks, not months. No lengthy enterprise implementation cycles or dedicated IT resources required.",
      },
      {
        icon: <Building2 className="w-6 h-6" />,
        title: "Mid-Market Optimized",
        description: "Purpose-built for $10M-$300M contractors. Enterprise capability without enterprise complexity.",
      },
      {
        icon: <Zap className="w-6 h-6" />,
        title: "AI-Powered, Not Manual",
        description: "Autonomous agents execute tasks—document processing, RFIs, reporting—instead of just routing workflows.",
      },
      {
        icon: <Wrench className="w-6 h-6" />,
        title: "Continuous Optimization",
        description: "AI maintenance included. Your system improves automatically based on your team's usage patterns.",
      },
    ],
    alfredBestFor: [
      "Mid-market contractors growing beyond basic tools ($10M-$300M)",
      "Companies wanting enterprise capability without enterprise timelines",
      "Firms seeking AI automation rather than manual workflow routing",
      "Organizations requiring private cloud or on-premise deployment",
      "Teams that need ongoing optimization without dedicated IT staff",
    ],
    competitorBestFor: [
      "Large capital programs ($100M+ projects)",
      "Government agencies requiring specific compliance certifications",
      "Organizations with dedicated program management offices",
      "Companies already invested in Oracle or Trimble ecosystems",
    ],
  };

  return <ComparisonTemplate data={data} />;
};

export default VsConstructionEnterprise;
