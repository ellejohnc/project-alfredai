import { Zap, Building2, Cloud, Cog, Wrench, Users } from "lucide-react";
import ComparisonTemplate from "./ComparisonTemplate";

const VsMonday = () => {
  const data = {
    competitorName: "Monday.com",
    tagline: "Different problems, different solutions",
    description: "Monday.com excels at visual work management and team coordination. alfred ai focuses on autonomous AI execution, industry-specific workflows, and deployment flexibility—we solve fundamentally different challenges.",
    features: [
      { feature: "Task & Project Management", alfred: true, competitor: true },
      { feature: "Visual Dashboards", alfred: true, competitor: true },
      { feature: "Team Collaboration", alfred: true, competitor: true },
      { feature: "Custom Integrations", alfred: true, competitor: true },
      { feature: "Mid-Market Optimization ($10M-$300M)", alfred: true, competitor: false, highlight: true },
      { feature: "Private Cloud / On-Premise Deploy", alfred: true, competitor: false, highlight: true },
      { feature: "Industry-Specific Workflows", alfred: true, competitor: "Generic templates", highlight: true },
      { feature: "AI System Ongoing Maintenance", alfred: true, competitor: false, highlight: true },
      { feature: "AI-Powered Task Execution", alfred: true, competitor: "Basic AI assist" },
      { feature: "Autonomous Workflow Agents", alfred: true, competitor: false },
      { feature: "Document Generation & Review", alfred: true, competitor: false },
      { feature: "Voice AI Assistants", alfred: true, competitor: false },
    ],
    keyDifferentiators: [
      {
        icon: <Building2 className="w-6 h-6" />,
        title: "Mid-Market Focus",
        description: "Purpose-built for $10M-$300M firms. Right-sized for growing operations without enterprise complexity.",
      },
      {
        icon: <Cloud className="w-6 h-6" />,
        title: "Private Cloud Deploy",
        description: "Deploy on your infrastructure or private cloud for data sovereignty and compliance requirements.",
      },
      {
        icon: <Cog className="w-6 h-6" />,
        title: "Industry-Specific Customization",
        description: "Pre-built workflows for construction, legal, consulting, and professional services.",
      },
      {
        icon: <Wrench className="w-6 h-6" />,
        title: "AI System Maintenance",
        description: "Ongoing AI optimization included. Your workflows improve automatically as your business evolves.",
      },
    ],
    alfredBestFor: [
      "Mid-market professional services firms ($10M-$300M revenue)",
      "Companies requiring private cloud or on-premise deployment",
      "Construction, legal, and consulting firms needing industry-specific workflows",
      "Organizations that want AI maintenance and optimization included",
      "Teams needing autonomous execution, not just task tracking",
    ],
    competitorBestFor: [
      "Teams focused on visual project tracking and coordination",
      "Organizations that prefer colorful, intuitive work visualization",
      "Companies comfortable with generic workflow templates",
      "Teams that primarily need task assignment and status tracking",
    ],
  };

  return <ComparisonTemplate data={data} />;
};

export default VsMonday;
