import { Building2, Cloud, Cog, Wrench } from "lucide-react";
import ComparisonTemplate from "./ComparisonTemplate";

const VsPipedrive = () => {
  const data = {
    competitorName: "Pipedrive",
    tagline: "Sales CRM vs. full business automation",
    description: "Pipedrive excels at visual sales pipeline management for sales teams. alfred ai automates entire business operations across departments—different scopes for different organizational needs.",
    features: [
      { feature: "Sales Pipeline Management", alfred: true, competitor: true },
      { feature: "Lead Tracking", alfred: true, competitor: true },
      { feature: "Email Integration", alfred: true, competitor: true },
      { feature: "Cross-Department Automation", alfred: true, competitor: false, highlight: true },
      { feature: "Document Processing AI", alfred: true, competitor: false, highlight: true },
      { feature: "Industry-Specific Workflows", alfred: true, competitor: false, highlight: true },
      { feature: "Operations Automation", alfred: true, competitor: "Limited" },
      { feature: "Private Cloud Deployment", alfred: true, competitor: false, highlight: true },
      { feature: "Visual Sales Pipeline", alfred: true, competitor: true },
      { feature: "AI Contract Review", alfred: true, competitor: false },
      { feature: "Proposal Generation", alfred: true, competitor: "Templates only" },
      { feature: "Finance/Invoicing Integration", alfred: true, competitor: "Via integrations" },
    ],
    keyDifferentiators: [
      {
        icon: <Building2 className="w-6 h-6" />,
        title: "Beyond Sales",
        description: "While Pipedrive focuses on sales, alfred ai automates operations, finance, HR, and client delivery too.",
      },
      {
        icon: <Cloud className="w-6 h-6" />,
        title: "Private Deployment",
        description: "Keep sensitive client and deal data on your own infrastructure—critical for regulated industries.",
      },
      {
        icon: <Cog className="w-6 h-6" />,
        title: "AI Document Intelligence",
        description: "Automatically process contracts, proposals, and documents—not just track them in a pipeline.",
      },
      {
        icon: <Wrench className="w-6 h-6" />,
        title: "Industry Context",
        description: "Understands construction bids, legal matters, consulting engagements—not just generic deals.",
      },
    ],
    alfredBestFor: [
      "Companies needing automation beyond just sales tracking",
      "Professional services firms with complex deal workflows",
      "Organizations requiring document processing AI",
      "Businesses needing private cloud data control",
      "Mid-market firms wanting end-to-end process automation",
    ],
    competitorBestFor: [
      "Sales-focused teams needing visual pipeline management",
      "Small businesses wanting simple, affordable CRM",
      "Teams prioritizing ease of use over feature depth",
      "Organizations with straightforward sales processes",
    ],
  };

  return <ComparisonTemplate data={data} />;
};

export default VsPipedrive;
