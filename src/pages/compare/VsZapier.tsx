import { Building2, Cloud, Cog, Wrench } from "lucide-react";
import ComparisonTemplate from "./ComparisonTemplate";

const VsZapier = () => {
  const data = {
    competitorName: "Zapier",
    tagline: "Simple triggers vs. intelligent industry automation",
    description: "Zapier excels at connecting apps with straightforward triggers. alfred ai brings AI reasoning and industry-specific logic—different approaches to automation for different complexity levels.",
    features: [
      { feature: "App Integrations", alfred: true, competitor: "7000+ apps" },
      { feature: "Trigger-Based Automation", alfred: true, competitor: true },
      { feature: "Multi-Step Workflows", alfred: true, competitor: true },
      { feature: "Error Handling", alfred: true, competitor: true },
      { feature: "Mid-Market Pricing Model", alfred: true, competitor: "Per-task pricing adds up", highlight: true },
      { feature: "Private Cloud Deployment", alfred: true, competitor: false, highlight: true },
      { feature: "Industry-Specific Logic", alfred: true, competitor: false, highlight: true },
      { feature: "AI System Ongoing Maintenance", alfred: true, competitor: false, highlight: true },
      { feature: "AI Decision Making", alfred: true, competitor: "Basic AI actions" },
      { feature: "Context-Aware Actions", alfred: true, competitor: false },
      { feature: "Document Understanding", alfred: true, competitor: "Limited" },
      { feature: "Autonomous Agents", alfred: true, competitor: false },
    ],
    keyDifferentiators: [
      {
        icon: <Building2 className="w-6 h-6" />,
        title: "Mid-Market Economics",
        description: "Predictable pricing designed for growing mid-market operations without per-task scaling concerns.",
      },
      {
        icon: <Cloud className="w-6 h-6" />,
        title: "Private Deployment",
        description: "Deploy on your infrastructure—critical for regulated industries and data control requirements.",
      },
      {
        icon: <Cog className="w-6 h-6" />,
        title: "Industry Intelligence",
        description: "Construction change orders, legal contract review, consulting proposals—industry logic built in.",
      },
      {
        icon: <Wrench className="w-6 h-6" />,
        title: "Maintained Automation",
        description: "Ongoing AI and workflow maintenance included—no DIY troubleshooting when things change.",
      },
    ],
    alfredBestFor: [
      "Mid-market firms seeking predictable automation costs",
      "Regulated industries needing private cloud deployment",
      "Professional services requiring industry-specific logic",
      "Companies wanting AI that handles exceptions, not just triggers",
      "Teams preferring maintained systems over DIY automation",
    ],
    competitorBestFor: [
      "Simple app-to-app connections with predictable triggers",
      "Teams that enjoy building automations from scratch",
      "Organizations needing 7000+ app integrations",
      "Companies with basic, linear automation needs",
    ],
  };

  return <ComparisonTemplate data={data} />;
};

export default VsZapier;
