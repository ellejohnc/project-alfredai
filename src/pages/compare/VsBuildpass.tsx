import { Building2, Cog, Wrench, ShieldCheck } from "lucide-react";
import ComparisonTemplate from "./ComparisonTemplate";

const VsBuildpass = () => {
  const data = {
    competitorName: "Buildpass",
    tagline: "Construction management software vs. an agentic AI operating layer",
    description: "BuildPass provides a configurable platform for running construction workflows. alfred ai connects the systems you already use, then maps, builds, trains and operates AI workflows across them.",
    competitorFirst: true,
    features: [
      { feature: "Core proposition", competitor: "Construction management software", alfred: "Agentic AI operating layer" },
      { feature: "Starting point", competitor: "Use BuildPass to run the business", alfred: "Keep your existing systems and connect them" },
      { feature: "Product philosophy", competitor: "Standard platform + configurable workflows", alfred: "Custom AI + configurable applications/workflows" },
      { feature: "System of record", competitor: "Increasingly BuildPass itself", alfred: "Existing ERP/PM/CRM/DMS can remain system of record" },
      { feature: "AI role", competitor: "AI assists inside BuildPass workflows", alfred: "AI works across multiple systems and workflows" },
      { feature: "Implementation", competitor: "Adopt the product", alfred: "alfred ai team maps, builds, trains and operates the solution" },
      { feature: "Customisation", competitor: "Configurable product", alfred: "Potentially organisation-specific workflows, agents and UI" },
      { feature: "Learning", competitor: "AI works on BuildPass project data", alfred: "alfred ai can learn company processes, historical knowledge and decision patterns" },
      { feature: "Integration", competitor: "Connect external systems into BuildPass", alfred: "Orchestrate work across external systems" },
      { feature: "Customer proposition", competitor: "“Run your construction company in BuildPass”", alfred: "“Turn your existing company into an AI-enabled operating system”" },
    ],
    keyDifferentiators: [
      {
        icon: <Building2 className="w-6 h-6" />,
        title: "AI Layer, Not Another App",
        description: "alfred ai plugs into your existing tools—accounting, CRM, project management—instead of asking your team to live in one more system.",
      },
      {
        icon: <Cog className="w-6 h-6" />,
        title: "Agents, Not Just Dashboards",
        description: "alfred ai executes tasks end-to-end—completing tenders, chasing RFIs, generating reports—rather than surfacing data for someone else to action.",
      },
      {
        icon: <ShieldCheck className="w-6 h-6" />,
        title: "Compliance Across the Business",
        description: "Compliance coverage beyond the site—procurement records, document trails, contract workflows and audit-ready reporting company-wide.",
      },
      {
        icon: <Wrench className="w-6 h-6" />,
        title: "Continuous Optimization",
        description: "AI maintenance included. Your workflows improve automatically as your business patterns evolve—no re-training burden on your team.",
      },
    ],
    alfredBestFor: [
      "Builders wanting AI across estimating, operations and admin—not just site work",
      "Companies running multiple systems that need them connected",
      "Teams that want autonomous execution, not another app to check",
      "Organizations requiring private cloud deployment",
      "Businesses seeking ongoing AI optimization without IT overhead",
    ],
    competitorBestFor: [
      "Builders focused primarily on on-site reporting and safety compliance",
      "Teams wanting a lightweight, purpose-built site management tool",
      "Companies happy to standardise on a single new platform",
      "Site supervisors who need mobile-first field tools",
    ],
    competitorLimitations: [
      "Focused on site management—estimating and back-office workflows need other tools",
      "No private cloud option for data sovereignty requirements",
      "No ongoing AI maintenance—capability is what ships today",
    ],
    seoTitle: "alfred ai vs BuildPass — Agentic AI Operating Layer Comparison",
    seoDescription: "Compare BuildPass construction management software with alfred ai's agentic operating layer across systems, implementation, AI, learning and integration.",
    canonicalPath: "/compare/vs-buildpass",
  };

  return <ComparisonTemplate data={data} />;
};

export default VsBuildpass;
