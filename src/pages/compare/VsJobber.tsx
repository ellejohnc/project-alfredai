import { Building2, Cloud, Cog, Wrench, HardHat, FileText } from "lucide-react";
import ComparisonTemplate from "./ComparisonTemplate";

const VsJobber = () => {
  const data = {
    competitorName: "Jobber",
    tagline: "Field service vs. construction AI",
    description: "Jobber excels at scheduling and invoicing for residential trades—HVAC, plumbing, electrical. alfred ai extends AI automation to commercial construction and larger operations, with AI-powered proposal generation and document processing.",
    features: [
      { feature: "Scheduling & Dispatch", alfred: true, competitor: true },
      { feature: "Invoicing & Payments", alfred: true, competitor: true },
      { feature: "Client Communication", alfred: true, competitor: true },
      { feature: "Mobile App for Field", alfred: true, competitor: true },
      { feature: "AI Proposal Generation", alfred: true, competitor: false, highlight: true },
      { feature: "Commercial Construction Workflows", alfred: true, competitor: "Residential focus", highlight: true },
      { feature: "Private Cloud Deploy", alfred: true, competitor: false, highlight: true },
      { feature: "AI System Ongoing Maintenance", alfred: true, competitor: false, highlight: true },
      { feature: "Voice AI Site Reporting", alfred: true, competitor: false },
      { feature: "Autonomous Document Processing", alfred: true, competitor: false },
      { feature: "Mid-Market Scaling ($10M-$300M)", alfred: true, competitor: "Small business focus" },
      { feature: "Cross-System Integration Layer", alfred: true, competitor: "Limited integrations" },
    ],
    keyDifferentiators: [
      {
        icon: <FileText className="w-6 h-6" />,
        title: "AI Proposal Generation",
        description: "Autonomous agents draft proposals, estimates, and change orders based on project requirements and historical data.",
      },
      {
        icon: <HardHat className="w-6 h-6" />,
        title: "Commercial Construction Ready",
        description: "Built for commercial contractors scaling beyond residential. Handle complex projects, subcontractor coordination, and compliance.",
      },
      {
        icon: <Cloud className="w-6 h-6" />,
        title: "Private Cloud Deploy",
        description: "Keep sensitive client and project data on your infrastructure for enterprise clients and government contracts.",
      },
      {
        icon: <Wrench className="w-6 h-6" />,
        title: "AI System Maintenance",
        description: "Ongoing optimization included. Your workflows improve automatically as your business evolves.",
      },
    ],
    alfredBestFor: [
      "Trades contractors scaling to commercial work",
      "Companies outgrowing residential-focused tools",
      "Firms wanting AI-powered proposal and document automation",
      "Organizations requiring private cloud deployment",
      "Mid-market contractors ($10M-$300M revenue)",
    ],
    competitorBestFor: [
      "Small residential service businesses",
      "HVAC, plumbing, and electrical contractors doing home services",
      "Teams wanting simple scheduling and invoicing",
      "Companies prioritizing consumer-friendly client experience",
    ],
  };

  return <ComparisonTemplate data={data} />;
};

export default VsJobber;
