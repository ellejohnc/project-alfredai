import { Building2, Cloud, Cog, Wrench, Layers, Mic } from "lucide-react";
import ComparisonTemplate from "./ComparisonTemplate";

const VsConstructionBuilders = () => {
  const data = {
    competitorName: "BuildTools & ProjectSimpel",
    tagline: "Builder tools vs. AI operating layer",
    description: "BuildTools and ProjectSimpel are purpose-built for custom home builders and small contractors—great for job costing and basic scheduling. alfred ai adds an AI intelligence layer that works with your existing systems rather than replacing them.",
    features: [
      { feature: "Job Costing", alfred: true, competitor: true },
      { feature: "Project Scheduling", alfred: true, competitor: true },
      { feature: "Client Portal", alfred: true, competitor: true },
      { feature: "Change Order Tracking", alfred: true, competitor: true },
      { feature: "AI Document Processing", alfred: true, competitor: false, highlight: true },
      { feature: "Voice AI Site Reporting", alfred: true, competitor: false, highlight: true },
      { feature: "Cross-System Integration Layer", alfred: true, competitor: "Limited integrations", highlight: true },
      { feature: "Private Cloud Deploy", alfred: true, competitor: false, highlight: true },
      { feature: "AI System Ongoing Maintenance", alfred: true, competitor: false },
      { feature: "Autonomous Workflow Agents", alfred: true, competitor: false },
      { feature: "Industry-Specific AI Training", alfred: true, competitor: false },
      { feature: "Works With Existing Tools", alfred: true, competitor: "Replacement approach" },
    ],
    keyDifferentiators: [
      {
        icon: <Layers className="w-6 h-6" />,
        title: "AI Layer, Not Replacement",
        description: "alfred ai integrates with your existing tools—accounting, CRM, project management—adding AI intelligence without forcing migration.",
      },
      {
        icon: <Mic className="w-6 h-6" />,
        title: "Voice Site Reporting",
        description: "Field crews report via voice. AI transcribes, categorizes, and routes updates to the right systems automatically.",
      },
      {
        icon: <Cloud className="w-6 h-6" />,
        title: "Private Cloud Deploy",
        description: "Keep sensitive client and project data on your infrastructure for compliance and data sovereignty.",
      },
      {
        icon: <Wrench className="w-6 h-6" />,
        title: "Continuous Optimization",
        description: "AI maintenance included. Your workflows improve automatically as your business patterns evolve.",
      },
    ],
    alfredBestFor: [
      "Builders ready to add AI automation to existing workflows",
      "Companies using multiple tools that need integration",
      "Firms wanting voice-powered field reporting",
      "Organizations requiring private cloud deployment",
      "Teams seeking ongoing AI optimization without IT overhead",
    ],
    competitorBestFor: [
      "Custom home builders seeking an all-in-one solution",
      "Small contractors new to construction software",
      "Teams comfortable replacing existing tools entirely",
      "Companies prioritizing simplicity over AI capabilities",
    ],
  };

  return <ComparisonTemplate data={data} />;
};

export default VsConstructionBuilders;
