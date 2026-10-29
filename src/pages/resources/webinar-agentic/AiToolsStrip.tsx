import { Sparkles } from "lucide-react";

type Tool = {
  name: string;
  /** Tailwind text colour class for the wordmark */
  color: string;
  /** Optional simple glyph rendered before the name */
  glyph?: React.ReactNode;
};

// Brand-styled logotypes. We render crisp text wordmarks (no external image
// dependencies) so the strip can never break or show a broken image.
const tools: Tool[] = [
  {
    name: "ChatGPT",
    color: "text-[#10A37F]",
    glyph: (
      <span className="grid h-6 w-6 place-items-center rounded-full bg-[#10A37F]/10 text-[#10A37F]">
        <Sparkles className="h-3.5 w-3.5" />
      </span>
    ),
  },
  {
    name: "Claude",
    color: "text-[#D97757]",
    glyph: <span className="h-3 w-3 rotate-45 rounded-[3px] bg-[#D97757]" aria-hidden />,
  },
  {
    name: "Gemini",
    color: "text-[#1d4ed8]",
    glyph: <span className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-[#4285F4] to-[#9b72cb]" aria-hidden />,
  },
  {
    name: "Microsoft Copilot",
    color: "text-[#0078D4]",
    glyph: <span className="h-3.5 w-3.5 rounded-full border-2 border-[#0078D4]" aria-hidden />,
  },
  {
    name: "Oracle",
    color: "text-[#C74634]",
    glyph: <span className="h-2.5 w-3.5 rounded-full border-2 border-[#C74634]" aria-hidden />,
  },
  {
    name: "OpenClaw",
    color: "text-[#EC4899]",
    glyph: <span className="h-3 w-3 rotate-12 rounded-[4px] bg-[#EC4899]" aria-hidden />,
  },
  {
    name: "Hermes Agent",
    color: "text-neutral-900",
    glyph: <span className="h-3.5 w-3.5 rounded-full bg-neutral-900" aria-hidden />,
  },
];

const Chip = ({ tool }: { tool: Tool }) => (
  <div className="flex flex-shrink-0 items-center gap-2.5 rounded-2xl border border-neutral-200 bg-white px-5 py-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md">
    {tool.glyph}
    <span className={`whitespace-nowrap text-sm font-bold tracking-tight sm:text-base ${tool.color}`}>
      {tool.name}
    </span>
  </div>
);

export default function AiToolsStrip() {
  return (
    <section className="overflow-hidden py-14 md:py-20">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-500">
          Built around the AI you already use
        </p>
        <h2 className="mx-auto mt-3 max-w-2xl text-2xl font-bold text-neutral-900 sm:text-3xl">
          Orchestrating the world&apos;s leading AI agents
        </h2>
      </div>

      {/* Marquee */}
      <div className="relative mt-10">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-white to-transparent sm:w-32" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-white to-transparent sm:w-32" />
        <div className="flex w-max gap-4 animate-scroll-x hover:[animation-play-state:paused]">
          {[...tools, ...tools].map((tool, i) => (
            <Chip key={`${tool.name}-${i}`} tool={tool} />
          ))}
        </div>
      </div>

      {/* Static grid fallback for accessibility / no-animation */}
      <div className="sr-only">
        {tools.map((t) => (
          <span key={t.name}>{t.name} </span>
        ))}
      </div>
    </section>
  );
}
