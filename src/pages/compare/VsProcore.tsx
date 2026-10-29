import { Building2, Cloud, Cog, Wrench, HardHat, Shield } from "lucide-react";
import ComparisonTemplate from "./ComparisonTemplate";

const VsProcore = () => {
  const data = {
    competitorName: "Procore",
    tagline: "Enterprise construction vs. mid-market AI",
    description: "Procore dominates enterprise construction management with comprehensive project controls. alfred ai brings AI-powered automation to mid-market builders and contractors—without enterprise pricing or complexity.",
    features: [
      { feature: "Project Management", alfred: true, competitor: true },
      { feature: "Document Control", alfred: true, competitor: true },
      { feature: "Field Reporting", alfred: true, competitor: true },
      { feature: "RFI Management", alfred: true, competitor: true },
      { feature: "Subcontractor Coordination", alfred: true, competitor: true },
      { feature: "Mid-Market Pricing ($10M-$300M)", alfred: true, competitor: false, highlight: true },
      { feature: "Private Cloud / On-Premise Deploy", alfred: true, competitor: false, highlight: true },
      { feature: "AI-Powered Task Execution", alfred: true, competitor: "Basic automation", highlight: true },
      { feature: "AI System Ongoing Maintenance", alfred: true, competitor: false, highlight: true },
      { feature: "Voice AI Site Reporting", alfred: true, competitor: false },
      { feature: "Autonomous Document Processing", alfred: true, competitor: false },
      { feature: "Rapid Deployment (weeks not months)", alfred: true, competitor: false },
    ],
    keyDifferentiators: [
      {
        icon: <Building2 className="w-6 h-6" />,
        title: "Mid-Market Focus",
        description: "Purpose-built for $10M-$300M contractors. Right-sized AI without enterprise complexity or pricing.",
      },
      {
        icon: <Cloud className="w-6 h-6" />,
        title: "Private Cloud Deploy",
        description: "Keep sensitive project data on your infrastructure. Meet compliance requirements for government and enterprise clients.",
      },
      {
        icon: <HardHat className="w-6 h-6" />,
        title: "AI-Powered Execution",
        description: "Autonomous agents handle RFIs, document processing, and site reporting—not just tracking and notifications.",
      },
      {
        icon: <Wrench className="w-6 h-6" />,
        title: "AI System Maintenance",
        description: "Ongoing optimization included. Your construction workflows improve automatically as your business evolves.",
      },
    ],
    alfredBestFor: [
      "Mid-market contractors and builders ($10M-$300M revenue)",
      "Companies requiring private cloud or on-premise deployment",
      "Firms wanting AI automation without enterprise implementation timelines",
      "Organizations seeking ongoing AI maintenance and optimization",
      "Teams needing autonomous execution, not just project tracking",
    ],
    competitorBestFor: [
      "Enterprise construction companies with dedicated IT teams",
      "Organizations comfortable with 6-12 month implementation cycles",
      "Companies needing comprehensive preconstruction to closeout tools",
      "Firms requiring extensive third-party integrations ecosystem",
    ],
  };

  return <ComparisonTemplate data={data} />;
};

export default VsProcore;
