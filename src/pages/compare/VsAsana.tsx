import { Building2, Cloud, Cog, Wrench } from "lucide-react";
import ComparisonTemplate from "./ComparisonTemplate";

const VsAsana = () => {
  const data = {
    competitorName: "Asana",
    tagline: "Enterprise tracking vs. mid-market AI execution",
    description: "Asana excels at enterprise-scale project coordination with sophisticated hierarchy. alfred ai is purpose-built for mid-market firms—autonomous execution with private deployment and industry-specific intelligence.",
    features: [
      { feature: "Project Management", alfred: true, competitor: true },
      { feature: "Task Tracking", alfred: true, competitor: true },
      { feature: "Team Workspaces", alfred: true, competitor: true },
      { feature: "Timeline Views", alfred: true, competitor: true },
      { feature: "Mid-Market Pricing & Focus", alfred: true, competitor: "Enterprise pricing", highlight: true },
      { feature: "Private Cloud / On-Premise", alfred: true, competitor: false, highlight: true },
      { feature: "Industry-Specific Workflows", alfred: true, competitor: false, highlight: true },
      { feature: "AI System Ongoing Maintenance", alfred: true, competitor: false, highlight: true },
      { feature: "AI Task Execution", alfred: true, competitor: "Basic AI features" },
      { feature: "Autonomous Agents", alfred: true, competitor: false },
      { feature: "Document Automation", alfred: true, competitor: false },
      { feature: "Voice AI", alfred: true, competitor: false },
    ],
    keyDifferentiators: [
      {
        icon: <Building2 className="w-6 h-6" />,
        title: "Mid-Market First",
        description: "Right-sized for $10M-$300M firms—powerful capabilities without enterprise complexity or pricing.",
      },
      {
        icon: <Cloud className="w-6 h-6" />,
        title: "Your Infrastructure",
        description: "Private cloud and on-premise options for regulated industries and data-sensitive firms.",
      },
      {
        icon: <Cog className="w-6 h-6" />,
        title: "Vertical Intelligence",
        description: "Pre-built for construction, legal, consulting verticals with industry-specific best practices.",
      },
      {
        icon: <Wrench className="w-6 h-6" />,
        title: "Maintained AI",
        description: "Your AI operating system stays current with continuous optimization and model updates included.",
      },
    ],
    alfredBestFor: [
      "Mid-market firms ($10M-$300M) seeking right-sized solutions",
      "Regulated industries requiring private cloud deployment",
      "Professional services needing vertical-specific automation",
      "Companies wanting outcomes over activity tracking",
      "Leaders seeking AI that improves without IT overhead",
    ],
    competitorBestFor: [
      "Large enterprises with complex project hierarchies",
      "Organizations with dedicated project management offices",
      "Teams that need sophisticated portfolio management",
      "Companies with extensive cross-team coordination needs",
    ],
  };

  return <ComparisonTemplate data={data} />;
};

export default VsAsana;
