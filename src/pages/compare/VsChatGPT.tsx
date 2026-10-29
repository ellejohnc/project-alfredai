import { Building2, Cloud, Cog, Wrench } from "lucide-react";
import ComparisonTemplate from "./ComparisonTemplate";

const VsChatGPT = () => {
  const data = {
    competitorName: "ChatGPT",
    tagline: "General-purpose chatbot vs. autonomous business automation",
    description: "ChatGPT is a powerful general-purpose AI assistant you prompt one conversation at a time. alfred ai deploys autonomous, industry-specific agents that execute end-to-end business workflows on your own infrastructure.",
    features: [
      { feature: "Conversational AI", alfred: true, competitor: true },
      { feature: "General Q&A & Drafting", alfred: true, competitor: true },
      { feature: "Pre-Built Business Workflows", alfred: true, competitor: false, highlight: true },
      { feature: "Industry-Specific Automation", alfred: true, competitor: false, highlight: true },
      { feature: "Autonomous Task Execution", alfred: true, competitor: "Manual prompting", highlight: true },
      { feature: "Private Cloud / On-Premise", alfred: true, competitor: false, highlight: true },
      { feature: "Connects to Your Systems", alfred: true, competitor: "Limited" },
      { feature: "Document Processing AI", alfred: true, competitor: "Per chat" },
      { feature: "Ongoing System Maintenance", alfred: true, competitor: false },
      { feature: "Data Residency Control", alfred: true, competitor: false },
      { feature: "Voice AI", alfred: true, competitor: true },
      { feature: "No Prompt Engineering Required", alfred: true, competitor: false },
    ],
    keyDifferentiators: [
      {
        icon: <Building2 className="w-6 h-6" />,
        title: "Agents, Not Just Chat",
        description: "alfred ai runs autonomous agents that complete multi-step workflows—ChatGPT answers one prompt at a time.",
      },
      {
        icon: <Cloud className="w-6 h-6" />,
        title: "Your Infrastructure",
        description: "Private cloud and on-premise deployment for regulated, data-sensitive firms—not a shared public service.",
      },
      {
        icon: <Cog className="w-6 h-6" />,
        title: "Industry Intelligence Built-In",
        description: "Pre-built construction, legal and consulting workflows—no prompt engineering or setup required.",
      },
      {
        icon: <Wrench className="w-6 h-6" />,
        title: "Maintained For You",
        description: "Your AI system stays current with continuous optimisation and model updates included.",
      },
    ],
    alfredBestFor: [
      "Firms wanting AI that executes work, not just answers questions",
      "Regulated industries requiring private deployment and data control",
      "Teams needing industry-specific automation out of the box",
      "Companies without time to engineer prompts and integrations",
      "Leaders seeking measurable business outcomes from AI",
    ],
    competitorBestFor: [
      "Individuals needing a flexible general-purpose assistant",
      "Ad-hoc drafting, brainstorming and research tasks",
      "Quick one-off questions across any topic",
      "Users comfortable prompting and reviewing each response",
    ],
  };

  return <ComparisonTemplate data={data} />;
};

export default VsChatGPT;
