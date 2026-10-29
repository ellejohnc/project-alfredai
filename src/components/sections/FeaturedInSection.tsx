import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import forbesLogo from "@/assets/press/forbes-australia.png.asset.json";
import beehiivLogo from "@/assets/press/beehiiv.svg";
import leadWithAiLogo from "@/assets/press/leadwithai.svg";
import aiAgentsHubIcon from "@/assets/press/aiagentshub.png";

type Publication = {
  name: string;
  url: string;
  logo: string;
  /** show the name as text alongside/instead of a wordmark logo */
  showName?: boolean;
  className?: string;
};

const publications: Publication[] = [
  {
    name: "Forbes Australia",
    url: "https://www.forbes.com.au",
    logo: forbesLogo.url,
    className: "h-5 md:h-6",
  },
  {
    name: "AI Agents Hub",
    url: "https://www.aiagentshub.net",
    logo: aiAgentsHubIcon,
    showName: true,
    className: "h-6 md:h-7 rounded",
  },
  {
    name: "Beehiiv",
    url: "https://www.beehiiv.com",
    logo: beehiivLogo,
    className: "h-4 md:h-[18px]",
  },
  {
    name: "Lead with AI",
    url: "https://www.leadwithai.co",
    logo: leadWithAiLogo,
    className: "h-6 md:h-7",
  },
];

const FeaturedInSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-12 bg-background-alt border-y border-border">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-8">
            As Featured In
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-6 md:gap-x-12">
            {publications.map((pub, index) => (
              <motion.a
                key={pub.name}
                href={pub.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${pub.name} (opens in a new tab)`}
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
                className="group inline-flex min-h-[44px] items-center gap-2.5 px-2 py-2 opacity-60 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 focus-visible:opacity-100 focus-visible:grayscale-0 focus-visible:outline-none"
              >
                <img
                  src={pub.logo}
                  alt={`${pub.name} logo`}
                  loading="lazy"
                  className={`w-auto object-contain ${pub.className ?? "h-6"}`}
                />
                {pub.showName && (
                  <span className="text-base font-semibold tracking-tight text-foreground">
                    {pub.name}
                  </span>
                )}
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedInSection;
