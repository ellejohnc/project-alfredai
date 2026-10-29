import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export interface VibeExample {
  /** What kind of thing is being built — "A new menu item", "A dashboard", "A workflow", "A mini-app". */
  category: string;
  prompt: string;
  result: string[];
  /** Short label shown as the new tab that appears on the mock screen. */
  tab: string;
}

type Phase = "typing" | "building" | "showing" | "hold";

/**
 * Hero animation for the AOS page: a prompt types itself into the Vibe-coding
 * Studio, AOS "builds", the changed items tick in, and a new view appears on
 * the mock screen. Cycles through the supplied examples.
 */
export function VibeCodingHeroAnimation({ examples }: { examples: VibeExample[] }) {
  const [exIdx, setExIdx] = useState(0);
  const [chars, setChars] = useState(0);
  const [results, setResults] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const ex = examples[exIdx];

  useEffect(() => {
    if (reduced) return;
    let t: number | undefined;
    if (phase === "typing") {
      if (chars < ex.prompt.length) {
        t = window.setTimeout(() => setChars((c) => c + 1), 22);
      } else {
        t = window.setTimeout(() => setPhase("building"), 450);
      }
    } else if (phase === "building") {
      t = window.setTimeout(() => {
        setResults(0);
        setPhase("showing");
      }, 1100);
    } else if (phase === "showing") {
      if (results < ex.result.length) {
        t = window.setTimeout(() => setResults((r) => r + 1), 550);
      } else {
        t = window.setTimeout(() => setPhase("hold"), 350);
      }
    } else {
      t = window.setTimeout(() => {
        setExIdx((i) => (i + 1) % examples.length);
        setChars(0);
        setResults(0);
        setPhase("typing");
      }, 2400);
    }
    return () => {
      if (t) window.clearTimeout(t);
    };
  }, [phase, chars, results, ex, examples.length, reduced]);

  // Reduced motion: render the current example fully built, no timers.
  const shownPrompt = reduced ? ex.prompt : ex.prompt.slice(0, chars);
  const shownResults = reduced ? ex.result : ex.result.slice(0, results);
  const built = reduced || phase === "showing" || phase === "hold";

  return (
    <div className="rounded-2xl border border-border bg-card shadow-elevation-2 overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-border bg-background/60">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="w-2.5 h-2.5 rounded-full border border-border" />
          <span className="w-2.5 h-2.5 rounded-full border border-border" />
          <span className="w-2.5 h-2.5 rounded-full border border-border" />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
          Vibe-coding Studio
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-partner-pink animate-pulse" aria-hidden />
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Live
          </span>
        </span>
      </div>

      <div className="p-4 md:p-6">
        {/* You say */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            You say
          </p>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/70 rounded-full border border-border px-2 py-0.5">
            {ex.category}
          </span>
        </div>
        <div className="rounded-xl border border-border bg-background px-3.5 py-3 text-sm font-medium text-foreground leading-relaxed min-h-[76px]">
          {shownPrompt}
          {!reduced && phase === "typing" && (
            <span className="inline-block w-[2px] h-[1em] align-middle bg-partner-pink ml-0.5 animate-pulse" aria-hidden />
          )}
          {phase === "typing" && chars === 0 && !reduced && (
            <span className="text-muted-foreground font-normal">…</span>
          )}
        </div>

        {/* Building */}
        <div className="flex items-center gap-2 mt-4 min-h-[20px]">
          {phase === "building" && !reduced && (
            <>
              <span className="text-xs text-muted-foreground">AOS is building…</span>
              <span className="flex gap-1" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1 h-1 rounded-full bg-muted-foreground animate-pulse"
                    style={{ animationDelay: `${i * 180}ms` }}
                  />
                ))}
              </span>
            </>
          )}
          {built && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              AOS changes
            </span>
          )}
        </div>

        {/* Results */}
        <ul className="mt-2 space-y-1.5 min-h-[96px]" aria-live="polite">
          {shownResults.map((r) => (
            <motion.li
              key={r}
              initial={reduced ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-start gap-2 text-sm text-foreground leading-relaxed"
            >
              <CheckCircle2 className="w-4 h-4 text-foreground flex-shrink-0 mt-0.5" aria-hidden />
              {r}
            </motion.li>
          ))}
        </ul>

        {/* Mock screen: the new view appears once built */}
        <div className="mt-4 rounded-xl border border-border bg-background overflow-hidden">
          <div className="flex items-center gap-1 px-3 pt-2.5 border-b border-border overflow-x-auto">
            {["Dashboard", "Projects"].map((t) => (
              <span
                key={t}
                className="text-[11px] text-muted-foreground px-2.5 py-1.5 rounded-t-md whitespace-nowrap"
              >
                {t}
              </span>
            ))}
            {built && (
              <motion.span
                key={ex.tab}
                initial={reduced ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="text-[11px] font-semibold bg-foreground text-background px-2.5 py-1.5 rounded-t-md whitespace-nowrap"
              >
                {ex.tab}
              </motion.span>
            )}
          </div>
          <div className="p-3 space-y-2">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-2 rounded-full bg-border/60"
                style={{ width: `${86 - i * 18}%` }}
                aria-hidden
              />
            ))}
            {built && (
              <motion.div
                key={`${ex.tab}-row`}
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="h-2 rounded-full bg-foreground/25 !w-[70%]"
                aria-hidden
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
