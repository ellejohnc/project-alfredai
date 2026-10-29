import * as React from "react";
import { memo } from "react";

/**
 * AlfredIntelligenceLoader — "From Information to Intelligence", drawn as a
 * sun-and-planets system: the alfred ai logo is the sun, inputs orbit on the
 * inner ring, outputs on the outer ring. Labels counter-rotate so they always
 * read upright. Flat, monochrome, no glow. Reduced motion → static.
 */

interface Planet {
  label: string;
  angle: number;
}

const INPUTS: Planet[] = [
  { label: "Drawings", angle: 200 },
  { label: "Specs", angle: 20 },
];
const OUTPUTS: Planet[] = [
  { label: "Quantities", angle: 270 },
  { label: "Costs", angle: 30 },
  { label: "Reports", angle: 150 },
];

const Orbit = ({
  planets,
  radius,
  kind,
}: {
  planets: Planet[];
  radius: string;
  kind: "in" | "out";
}) => (
  <div
    className={`absolute inset-0 ${kind === "in" ? "ail-orbit-in" : "ail-orbit-out"}`}
  >
    {planets.map((p) => (
      <div
        key={p.label}
        className="absolute left-1/2 top-1/2"
        style={{ transform: `rotate(${p.angle}deg) translateX(${radius}) rotate(${-p.angle}deg)` }}
      >
        <div className={kind === "in" ? "ail-counter-in" : "ail-counter-out"}>
          <span
            className={`-translate-x-1/2 -translate-y-1/2 inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-sm font-medium bg-background ${
              kind === "in"
                ? "border-border text-muted-foreground"
                : "border-foreground text-foreground"
            }`}
          >
            {p.label}
          </span>
        </div>
      </div>
    ))}
  </div>
);

const AlfredIntelligenceLoader = memo(({ className = "", done = false }: { className?: string; done?: boolean }) => (
  <div className={`flex flex-col items-center gap-5 max-w-full overflow-hidden px-4 ${className}`} style={{ "--s": "min(70vw, 300px, 55dvh)" } as React.CSSProperties} aria-hidden="true">
    <div className="relative w-[var(--s)] h-[var(--s)]">
      {/* orbit tracks */}
      <div className="absolute inset-[20%] rounded-full border border-dashed border-border" />
      <div className="absolute inset-[8%] rounded-full border border-border" />

      <Orbit planets={INPUTS} radius="calc(var(--s) * 0.3)" kind="in" />
      <Orbit planets={OUTPUTS} radius="calc(var(--s) * 0.42)" kind="out" />

      {/* radial progress around the sun: fills to ~90% while loading, completes when done */}
      <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[32%] aspect-square -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
        <circle
          cx="50" cy="50" r="46" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round"
          pathLength={100} strokeDasharray="100"
          className={done ? "ail-progress-done" : "ail-progress"}
        />
      </svg>

      {/* the sun: existing logo, never redrawn */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-[24%] aspect-square rounded-full border border-foreground bg-background ail-sun">
        <SunLogo src="/alfred-ai-loader.png" className="dark:hidden" />
        <SunLogo src="/alfred-ai-loader-white.png" className="hidden dark:block" />
      </div>
    </div>

    <p className="text-lg font-semibold text-foreground text-center leading-tight">
      Your data in. <span className="text-muted-foreground">Decisions out.</span>
    </p>
  </div>
));

AlfredIntelligenceLoader.displayName = "AlfredIntelligenceLoader";

export default AlfredIntelligenceLoader;

/** Shows the logo only once it has fully loaded and decoded, so it never appears half-drawn. */
function SunLogo({ src, className }: { src: string; className: string }) {
  const [ready, setReady] = React.useState(false);
  const ref = React.useRef<HTMLImageElement>(null);
  React.useEffect(() => {
    const img = ref.current;
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) {
      img.decode().catch(() => undefined).finally(() => setReady(true));
    }
  }, []);
  return (
    <img
      ref={ref}
      src={src}
      alt=""
      loading="eager"
      decoding="sync"
      fetchPriority="high"
      onLoad={(e) => { e.currentTarget.decode().catch(() => undefined).finally(() => setReady(true)); }}
      className={`w-[72%] h-auto transition-opacity duration-200 ${ready ? "opacity-100" : "opacity-0"} ${className}`}
    />
  );
}
