import { motion } from "framer-motion";

import heygen from "@/assets/tech-stack/heygen.png.asset.json";
import hyperframe from "@/assets/tech-stack/hyperframe.png.asset.json";
import claude from "@/assets/tech-stack/claude.png.asset.json";
import fal from "@/assets/tech-stack/fal.png.asset.json";
import higgsfield from "@/assets/tech-stack/higgsfield.png.asset.json";
import n8n from "@/assets/tech-stack/n8n.png.asset.json";
import veo from "@/assets/tech-stack/veo.png.asset.json";
import airtable from "@/assets/tech-stack/airtable.png.asset.json";
import capcut from "@/assets/tech-stack/capcut.png.asset.json";

type Logo = { name: string; url: string };

// Split across two rows. Each logo is rendered natively (no card/tile behind it)
// at a uniform height so the wordmarks and icons line up visually.
const rowOne: Logo[] = [
  { name: "HeyGen", url: heygen.url },
  { name: "Hyperframe", url: hyperframe.url },
  { name: "Claude Design", url: claude.url },
  { name: "Fal", url: fal.url },
  { name: "Higgsfield", url: higgsfield.url },
];

const rowTwo: Logo[] = [
  { name: "n8n", url: n8n.url },
  { name: "Veo 3", url: veo.url },
  { name: "Airtable", url: airtable.url },
  { name: "CapCut", url: capcut.url },
];

const LogoImg = ({ logo }: { logo: Logo }) => (
  <img
    src={logo.url}
    alt={`${logo.name} logo`}
    loading="lazy"
    draggable={false}
    className="h-7 md:h-9 w-auto object-contain shrink-0 select-none opacity-80 transition-opacity duration-300 hover:opacity-100"
  />
);

const MarqueeRow = ({
  logos,
  direction,
  duration,
}: {
  logos: Logo[];
  direction: "left" | "right";
  duration: number;
}) => {
  const loop = [...logos, ...logos];
  return (
    <div className="flex overflow-hidden">
      <motion.div
        className="flex items-center gap-10 md:gap-16 pr-10 md:pr-16"
        animate={{ x: direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"] }}
        transition={{ x: { duration, repeat: Infinity, ease: "linear" } }}
      >
        {loop.map((logo, i) => (
          <LogoImg key={`${logo.name}-${i}`} logo={logo} />
        ))}
      </motion.div>
    </div>
  );
};

const TechStackMarquee = () => {
  return (
    <div className="mb-10 md:mb-14">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-6 md:mb-8">
        Powered by our production tech stack
      </p>

      <div className="relative">
        {/* Edge fades */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-16 md:w-28 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-16 md:w-28 bg-gradient-to-l from-background to-transparent" />

        <div className="space-y-6 md:space-y-8">
          <MarqueeRow logos={rowOne} direction="left" duration={32} />
          <MarqueeRow logos={rowTwo} direction="right" duration={28} />
        </div>
      </div>
    </div>
  );
};

export default TechStackMarquee;
