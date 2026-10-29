import { Building2, Cloud, Cog, Wrench } from "lucide-react";
import ComparisonTemplate from "./ComparisonTemplate";

const VsGoHighLevel = () => {
  const data = {
    competitorName: "GoHighLevel",
    tagline: "Marketing agency platform vs. mid-market business automation",
    description: "GoHighLevel is an all-in-one platform built for marketing agencies. alfred ai serves mid-market professional services with industry-specific AI—different solutions for different business models.",
    features: [
      { feature: "CRM & Pipeline", alfred: true, competitor: true },
      { feature: "Marketing Automation", alfred: true, competitor: true },
      { feature: "Website/Funnel Builder", alfred: false, competitor: true },
      { feature: "White-Label Reselling", alfred: true, competitor: true },
      { feature: "Industry-Specific AI", alfred: true, competitor: false, highlight: true },
      { feature: "Document Processing", alfred: true, competitor: false, highlight: true },
      { feature: "Private Cloud Deployment", alfred: true, competitor: false, highlight: true },
      { feature: "AI Decision Making", alfred: true, competitor: "Basic AI assistants" },
      { feature: "Operations Automation", alfred: true, competitor: "Limited" },
      { feature: "Appointment Scheduling", alfred: true, competitor: true },
      { feature: "SMS/Email Campaigns", alfred: true, competitor: true },
      { feature: "Ongoing AI Maintenance", alfred: true, competitor: false, highlight: true },
    ],
    keyDifferentiators: [
      {
        icon: <Building2 className="w-6 h-6" />,
        title: "Mid-Market Focus",
        description: "Built for $10M-$300M professional services firms—not agencies reselling to small businesses.",
      },
      {
        icon: <Cloud className="w-6 h-6" />,
        title: "Private Infrastructure",
        description: "Deploy on your cloud for data sovereignty—essential for legal, financial, and regulated industries.",
      },
      {
        icon: <Cog className="w-6 h-6" />,
        title: "True AI Automation",
        description: "AI that reasons through complex business logic—beyond simple chatbots and basic automation.",
      },
      {
        icon: <Wrench className="w-6 h-6" />,
        title: "Industry Expertise",
        description: "Pre-built workflows for construction, legal, consulting—not generic marketing funnels.",
      },
    ],
    alfredBestFor: [
      "Mid-market professional services firms ($10M-$300M revenue)",
      "Companies needing AI that understands industry context",
      "Organizations requiring private cloud data control",
      "Businesses focused on operations, not just marketing",
      "Firms wanting maintained AI systems, not DIY automation",
    ],
    competitorBestFor: [
      "Marketing agencies managing multiple client accounts",
      "Businesses wanting white-label marketing tools to resell",
      "Companies focused primarily on lead generation and funnels",
      "Small businesses needing all-in-one marketing suite",
    ],
  };

  return <ComparisonTemplate data={data} />;
};

export default VsGoHighLevel;
