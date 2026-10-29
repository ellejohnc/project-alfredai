import { Building2, Cloud, Cog, Wrench } from "lucide-react";
import ComparisonTemplate from "./ComparisonTemplate";

const VsMake = () => {
  const data = {
    competitorName: "Make (Integromat)",
    tagline: "Visual building vs. ready-to-use industry intelligence",
    description: "Make offers powerful visual workflow building for technical users. alfred ai provides industry-specific automation ready to deploy—different skill requirements for different team compositions.",
    features: [
      { feature: "Visual Workflow Builder", alfred: true, competitor: true },
      { feature: "Complex Logic Support", alfred: true, competitor: true },
      { feature: "Data Transformation", alfred: true, competitor: true },
      { feature: "Error Handling", alfred: true, competitor: true },
      { feature: "Mid-Market Focus", alfred: true, competitor: "Developer-focused", highlight: true },
      { feature: "Private Cloud / On-Premise", alfred: true, competitor: false, highlight: true },
      { feature: "Industry-Specific Workflows", alfred: true, competitor: false, highlight: true },
      { feature: "AI System Maintenance", alfred: true, competitor: false, highlight: true },
      { feature: "AI-Powered Decisions", alfred: true, competitor: "Basic AI modules" },
      { feature: "Natural Language Setup", alfred: true, competitor: false },
      { feature: "Document Intelligence", alfred: true, competitor: false },
      { feature: "Autonomous Agents", alfred: true, competitor: false },
    ],
    keyDifferentiators: [
      {
        icon: <Building2 className="w-6 h-6" />,
        title: "Business User Ready",
        description: "Designed for mid-market operations teams—powerful automation accessible without technical expertise.",
      },
      {
        icon: <Cloud className="w-6 h-6" />,
        title: "Deploy Your Way",
        description: "Private cloud and on-premise options for data-sensitive industries and compliance requirements.",
      },
      {
        icon: <Cog className="w-6 h-6" />,
        title: "Vertical Automation",
        description: "Industry-specific workflows for construction, legal, consulting—ready to use, not build node by node.",
      },
      {
        icon: <Wrench className="w-6 h-6" />,
        title: "Managed & Maintained",
        description: "We maintain your AI workflows. No debugging scenarios or keeping up with API changes.",
      },
    ],
    alfredBestFor: [
      "Mid-market firms without dedicated automation specialists",
      "Companies needing private infrastructure deployment",
      "Professional services wanting pre-built industry workflows",
      "Teams preferring natural language over visual building",
      "Organizations wanting maintained automation systems",
    ],
    competitorBestFor: [
      "Technical users who enjoy visual workflow building",
      "Teams with dedicated integration specialists",
      "Organizations with highly custom data transformation needs",
      "Companies that prefer hands-on automation development",
    ],
  };

  return <ComparisonTemplate data={data} />;
};

export default VsMake;
