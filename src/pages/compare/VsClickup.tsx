import { Building2, Cloud, Cog, Wrench } from "lucide-react";
import ComparisonTemplate from "./ComparisonTemplate";

const VsClickup = () => {
  const data = {
    competitorName: "ClickUp",
    tagline: "Feature variety vs. focused industry intelligence",
    description: "ClickUp offers comprehensive feature variety in a single platform. alfred ai focuses on industry-specific AI execution with private deployment—different approaches for different needs.",
    features: [
      { feature: "Project Management", alfred: true, competitor: true },
      { feature: "Docs & Wikis", alfred: true, competitor: true },
      { feature: "Time Tracking", alfred: true, competitor: true },
      { feature: "Custom Views", alfred: true, competitor: true },
      { feature: "Mid-Market Optimization ($10M-$300M)", alfred: true, competitor: false, highlight: true },
      { feature: "Private Cloud / On-Premise Deploy", alfred: true, competitor: false, highlight: true },
      { feature: "Industry-Specific Workflows", alfred: true, competitor: "Generic only", highlight: true },
      { feature: "AI System Ongoing Maintenance", alfred: true, competitor: false, highlight: true },
      { feature: "AI Task Completion", alfred: true, competitor: "Basic AI writing" },
      { feature: "Autonomous Workflow Agents", alfred: true, competitor: false },
      { feature: "Contract Analysis", alfred: true, competitor: false },
      { feature: "Voice AI Agents", alfred: true, competitor: false },
    ],
    keyDifferentiators: [
      {
        icon: <Building2 className="w-6 h-6" />,
        title: "Mid-Market Optimization",
        description: "Laser-focused on $10M-$300M firms with matched pricing and complexity for growing operations.",
      },
      {
        icon: <Cloud className="w-6 h-6" />,
        title: "Private Cloud Deploy",
        description: "Deploy on your private cloud or infrastructure for data sovereignty and compliance.",
      },
      {
        icon: <Cog className="w-6 h-6" />,
        title: "Industry Customization",
        description: "Construction, legal, accounting workflows built-in—your industry's best practices, automated.",
      },
      {
        icon: <Wrench className="w-6 h-6" />,
        title: "Ongoing AI Maintenance",
        description: "AI models and workflows maintained and improved continuously. No DIY prompt engineering.",
      },
    ],
    alfredBestFor: [
      "Mid-market firms seeking focused, industry-specific tools",
      "Companies requiring on-premise or private cloud deployment",
      "Professional services needing industry-specific automation",
      "Organizations wanting AI maintenance included",
      "Leaders seeking focused execution over feature exploration",
    ],
    competitorBestFor: [
      "Teams wanting maximum feature variety in one platform",
      "Users who enjoy exploring and configuring many options",
      "Organizations needing all-in-one productivity suite",
      "Companies with dedicated admins to maintain complex setups",
    ],
  };

  return <ComparisonTemplate data={data} />;
};

export default VsClickup;
