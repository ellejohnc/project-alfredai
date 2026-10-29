/** Page-aware opening line and suggested questions for the website chatbot. */
export interface PageSuggestions { greeting: string; suggestions: string[] }

const DEFAULT: PageSuggestions = {
  greeting: "Hi, I'm Alfred. Tell me what slows your team down and I'll point you to the right alfred ai workflow.",
  suggestions: ["Which workflow fits my business?", "How fast can we get started?", "How does pricing work?"],
};

const RULES: Array<[RegExp, PageSuggestions]> = [
  [/^\/solutions\/ai-takeoff|takeoff/i, {
    greeting: "Hi, I'm Alfred. Ask me anything about AI Take-Off — trades, run times or how a demo works.",
    suggestions: ["Which trades do you cover?", "How long does a 500-sheet set take?", "How accurate are the quantities?"],
  }],
  [/^\/solutions\/ai-for-construction\/operations/, {
    greeting: "Hi, I'm Alfred. I can help you find the AI Employee that fits your team.",
    suggestions: ["Which role fits my accounts team?", "Which roles are available now?", "Do AI Employees replace staff?"],
  }],
  [/^\/solutions\/email-presend-intelligence/, {
    greeting: "Hi, I'm Alfred. Ask me how Email Pre-send Intelligence checks your emails before they go out.",
    suggestions: ["What does it check before I send?", "Who stays in control of sending?", "How do we run a pilot?"],
  }],
  [/^\/products\/(aos|vibe-coding-studio)/, {
    greeting: "Hi, I'm Alfred. Ask me how Vibe-coding Studio changes your software from plain-English prompts.",
    suggestions: ["What can I build with a prompt?", "Who approves the changes?", "How does pricing work?"],
  }],
  [/^\/products/, {
    greeting: "Hi, I'm Alfred. I can help you pick the right alfred ai product for your business.",
    suggestions: ["Which product fits my business?", "What is alfred Assist?", "Does it work with my software?"],
  }],
  [/pricing|roi/i, {
    greeting: "Hi, I'm Alfred. Happy to explain how alfred ai is packaged and priced.",
    suggestions: ["How does pricing work?", "What contract options are there?", "How soon will I see a return?"],
  }],
];

export function getPageSuggestions(path: string): PageSuggestions {
  return RULES.find(([re]) => re.test(path))?.[1] ?? DEFAULT;
}
