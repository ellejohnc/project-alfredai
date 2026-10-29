import { Building2, Cloud, Cog, Wrench } from "lucide-react";
import ComparisonTemplate from "./ComparisonTemplate";

const VsNotion = () => {
  const data = {
    competitorName: "Notion",
    tagline: "Documentation meets autonomous execution",
    description: "Notion excels at flexible knowledge management and documentation. alfred ai focuses on operational execution—we're designed for different stages of the workflow lifecycle.",
    features: [
      { feature: "Knowledge Base & Wiki", alfred: true, competitor: true },
      { feature: "Document Collaboration", alfred: true, competitor: true },
      { feature: "Database Functionality", alfred: true, competitor: true },
      { feature: "Flexible Workspaces", alfred: true, competitor: true },
      { feature: "Mid-Market Operations Focus", alfred: true, competitor: "All company sizes", highlight: true },
      { feature: "Private Cloud / On-Premise", alfred: true, competitor: false, highlight: true },
      { feature: "Industry-Specific Automation", alfred: true, competitor: false, highlight: true },
      { feature: "AI System Maintenance", alfred: true, competitor: false, highlight: true },
      { feature: "AI-Powered Execution", alfred: true, competitor: "AI writing assist" },
      { feature: "Autonomous Agents", alfred: true, competitor: false },
      { feature: "Workflow Automation", alfred: true, competitor: "Basic formulas" },
      { feature: "Contract Intelligence", alfred: true, competitor: false },
    ],
    keyDifferentiators: [
      {
        icon: <Building2 className="w-6 h-6" />,
        title: "Operations, Not Docs",
        description: "Notion organizes knowledge. alfred ai executes operations—built for mid-market firms that need action, not just organization.",
      },
      {
        icon: <Cloud className="w-6 h-6" />,
        title: "Deploy Anywhere",
        description: "Private cloud and on-premise deployment options for firms with data sovereignty requirements.",
      },
      {
        icon: <Cog className="w-6 h-6" />,
        title: "Vertical Workflows",
        description: "Industry-specific automation for construction, legal, professional services—ready to use, not build.",
      },
      {
        icon: <Wrench className="w-6 h-6" />,
        title: "Managed AI System",
        description: "Your AI workflows stay optimized. We maintain the intelligence layer so you focus on outcomes.",
      },
    ],
    alfredBestFor: [
      "Teams with documented processes ready for automation",
      "Mid-market operations needing execution, not more documentation",
      "Companies requiring private infrastructure deployment",
      "Professional services wanting industry-specific workflows",
      "Organizations seeking maintained AI vs. DIY setup",
    ],
    competitorBestFor: [
      "Teams building flexible documentation and wikis",
      "Organizations focused on knowledge capture and sharing",
      "Users who prefer unstructured, customizable workspaces",
      "Companies in the process documentation phase",
    ],
  };

  return <ComparisonTemplate data={data} />;
};

export default VsNotion;
