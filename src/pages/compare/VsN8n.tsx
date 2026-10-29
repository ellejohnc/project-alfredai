import { Building2, Cloud, Cog, Wrench } from "lucide-react";
import ComparisonTemplate from "./ComparisonTemplate";

const VsN8n = () => {
  const data = {
    competitorName: "n8n",
    tagline: "Self-hosted workflows vs. managed industry automation",
    description: "n8n gives technical teams powerful self-hosted workflow automation. alfred ai delivers ready-to-use industry solutions with ongoing AI maintenance—different approaches for different team capabilities.",
    features: [
      { feature: "Visual Workflow Builder", alfred: true, competitor: true },
      { feature: "Self-Hosting Option", alfred: true, competitor: true },
      { feature: "Open Source Core", alfred: false, competitor: true },
      { feature: "Pre-Built Industry Workflows", alfred: true, competitor: false, highlight: true },
      { feature: "AI Decision Making", alfred: true, competitor: "Via integrations" },
      { feature: "Document Understanding", alfred: true, competitor: "Limited" },
      { feature: "Industry-Specific Logic", alfred: true, competitor: false, highlight: true },
      { feature: "Ongoing AI Maintenance", alfred: true, competitor: false, highlight: true },
      { feature: "No-Code Setup", alfred: true, competitor: false },
      { feature: "Private Cloud Deployment", alfred: true, competitor: true },
      { feature: "Technical Expertise Required", alfred: "Minimal", competitor: "High" },
      { feature: "Custom Node Development", alfred: false, competitor: true },
    ],
    keyDifferentiators: [
      {
        icon: <Building2 className="w-6 h-6" />,
        title: "Ready-to-Use Solutions",
        description: "Industry-specific workflows that work immediately—no development time or technical expertise required.",
      },
      {
        icon: <Cloud className="w-6 h-6" />,
        title: "Managed AI Systems",
        description: "We handle the complexity of AI maintenance, updates, and optimization—your team focuses on business.",
      },
      {
        icon: <Cog className="w-6 h-6" />,
        title: "Industry Intelligence",
        description: "Built-in understanding of construction, legal, consulting, and professional services workflows.",
      },
      {
        icon: <Wrench className="w-6 h-6" />,
        title: "No DIY Required",
        description: "Skip the learning curve and development time—get automation working from day one.",
      },
    ],
    alfredBestFor: [
      "Teams without dedicated technical resources for workflow building",
      "Companies wanting industry-proven automation patterns",
      "Organizations needing AI that understands business context",
      "Firms preferring managed solutions over DIY infrastructure",
      "Mid-market businesses seeking predictable implementation",
    ],
    competitorBestFor: [
      "Technical teams who enjoy building custom workflows",
      "Organizations with developer resources for maintenance",
      "Companies needing complete control over source code",
      "Teams requiring highly customized automation logic",
    ],
  };

  return <ComparisonTemplate data={data} />;
};

export default VsN8n;
