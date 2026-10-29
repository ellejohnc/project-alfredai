import { useRef, useEffect, useState } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import LazyImage from "@/components/ui/lazy-image";
import "@/styles/motion-fallbacks.css";

// Import logo images
import oracleLogo from "@/assets/logos/oracle.png";
import xeroLogo from "@/assets/logos/xero.png";
import gohighlevelLogo from "@/assets/logos/gohighlevel.png";
import pleasesignLogo from "@/assets/logos/pleasesign.png";
import vapiLogo from "@/assets/logos/vapi.png";
import accountableLinkLogo from "@/assets/logos/accountable-link.svg";

// Press / featured publication logos
import forbesLogo from "@/assets/press/forbes.svg";
import beehiivLogo from "@/assets/press/beehiiv.svg";
import leadWithAiLogo from "@/assets/press/leadwithai.svg";
import aiAgentsHubIcon from "@/assets/press/aiagentshub.png";

// SVG logos for partners without image files
const AWSLogo = () => (
  <svg viewBox="0 0 100 60" className="h-5 w-auto fill-current">
    <path d="M28.5 24.5c0 1.2.1 2.2.4 2.9.2.5.4 1 .8 1.6.1.2.2.3.2.5 0 .2-.1.4-.4.6l-1.3.9c-.2.1-.4.2-.5.2-.2 0-.4-.1-.6-.3-.3-.3-.5-.6-.7-1-.2-.4-.4-.8-.6-1.3-1.6 1.9-3.6 2.8-6 2.8-1.7 0-3.1-.5-4.1-1.5-1-.9-1.5-2.2-1.5-3.8 0-1.7.6-3 1.8-4.1 1.2-1 2.8-1.5 4.8-1.5.7 0 1.4 0 2.1.1.7.1 1.5.2 2.3.4v-1.4c0-1.5-.3-2.6-1-3.2-.6-.6-1.7-.9-3.2-.9-.7 0-1.4.1-2.1.3-.7.2-1.5.4-2.2.8-.3.2-.6.3-.7.3-.2 0-.3-.1-.3-.4v-1c0-.3 0-.5.1-.6.1-.1.3-.3.5-.4.7-.4 1.6-.7 2.6-.9 1-.3 2-.4 3.1-.4 2.4 0 4.1.5 5.2 1.6 1.1 1.1 1.6 2.7 1.6 4.9v6.4zm-8.2 3.1c.7 0 1.4-.1 2.1-.4.8-.3 1.4-.7 2-1.4.4-.4.6-.9.7-1.4.1-.5.2-1.2.2-2v-1c-.6-.1-1.2-.2-1.9-.3-.7-.1-1.4-.1-2-.1-1.3 0-2.3.3-2.9.8-.6.5-.9 1.3-.9 2.3 0 .9.2 1.6.7 2.1.5.5 1.2.7 2 .7v.7zm16.3 2.2c-.3 0-.5 0-.6-.1-.1-.1-.3-.3-.4-.6l-4.5-14.8c-.1-.2-.1-.4-.1-.5 0-.3.1-.4.4-.4h2c.3 0 .5 0 .6.1.1.1.2.3.3.6l3.2 12.6 3-12.6c.1-.3.2-.5.3-.6.1-.1.4-.1.7-.1h1.6c.3 0 .5 0 .7.1.1.1.2.3.3.6l3 12.8 3.3-12.8c.1-.3.2-.5.3-.6.2-.1.4-.1.6-.1h1.9c.3 0 .4.1.4.4 0 .1 0 .2 0 .3 0 .1-.1.3-.1.4l-4.6 14.8c-.1.3-.2.5-.4.6-.1.1-.4.1-.6.1h-1.8c-.3 0-.5 0-.6-.1-.1-.1-.2-.3-.3-.6l-2.9-12.3-2.9 12.3c-.1.3-.2.5-.3.6-.2.1-.4.1-.7.1h-1.8zm26.1.6c-1 0-2.1-.1-3-.4-.9-.3-1.7-.6-2.2-1-.3-.2-.5-.5-.6-.7 0-.1-.1-.3-.1-.4v-1.1c0-.3.1-.5.4-.5.1 0 .2 0 .3 0 .1.1.3.1.5.2.7.3 1.4.6 2.2.7.8.2 1.6.3 2.4.3 1.3 0 2.3-.2 3-.7.7-.5 1-1.1 1-2 0-.6-.2-1.1-.5-1.4-.4-.4-.9-.7-1.8-1l-2.5-.8c-1.3-.4-2.3-1-3-1.8-.6-.8-1-1.7-1-2.8 0-.8.2-1.5.5-2.1.4-.6.8-1.2 1.4-1.6.6-.4 1.2-.8 2-.9.8-.2 1.6-.3 2.4-.3.4 0 .9 0 1.3.1.5 0 .9.1 1.3.2.4.1.8.2 1.2.3.4.1.7.3.9.4.3.2.5.3.6.5.1.2.2.4.2.7v1c0 .3-.1.5-.4.5-.1 0-.4-.1-.6-.2-1-.4-2.1-.6-3.3-.6-1.1 0-2 .2-2.6.6-.6.4-.9.9-.9 1.7 0 .6.2 1 .6 1.4.4.4 1 .7 1.9 1l2.5.8c1.3.4 2.2 1 2.8 1.7.6.7.9 1.6.9 2.6 0 .8-.2 1.6-.5 2.2-.3.7-.8 1.2-1.4 1.7-.6.5-1.3.8-2.1 1-.9.3-1.7.4-2.7.4z"/>
    <path d="M76.8 38.2c-8.5 6.3-20.8 9.6-31.4 9.6-14.9 0-28.3-5.5-38.4-14.6-.8-.7-.1-1.7.9-1.1 10.9 6.4 24.5 10.2 38.4 10.2 9.4 0 19.8-2 29.3-6 1.4-.6 2.6 1 1.2 1.9z" className="fill-[#FF9900]"/>
    <path d="M80.1 34.4c-1.1-1.4-7.3-.7-10.1-.3-.8.1-1-.6-.2-1.1 4.9-3.5 13-2.5 14-.1.9 2.3-.3 7.5-4.9 10.6-.7.5-1.4.2-1.1-.4 1.1-2.7 3.4-8.3 2.3-9.7z" className="fill-[#FF9900]"/>
  </svg>
);

const DropboxLogo = () => (
  <svg viewBox="0 0 43 40" className="h-5 w-auto">
    <path d="M12.6 0L0 8.2l8.6 6.9 12.5-8.2L12.6 0zM0 22l12.6 8.2 8.5-6.9-12.5-8.1L0 22zm21.1 1.3l8.5 6.9L42.2 22l-8.6-6.8-12.5 8.1zM42.2 8.2L29.6 0l-8.5 6.9 12.5 8.2 8.6-6.9zM21.1 24.5L12.6 31l-4-.9v3l12.5 7.5 12.5-7.5v-3l-4 .9-8.5-6.5z" className="fill-[#0061FF]"/>
  </svg>
);

const ElevenLabsLogo = () => (
  <svg viewBox="0 0 60 40" className="h-5 w-auto fill-current">
    <rect x="15" y="5" width="10" height="30" rx="2"/>
    <rect x="35" y="5" width="10" height="30" rx="2"/>
  </svg>
);

type Partner = {
  name: string;
  displayName: string;
  logo: React.ReactNode | string;
  isImage?: boolean;
  small?: boolean;
};

const partners: Partner[] = [
  { name: "AWS", displayName: "AWS", logo: <AWSLogo /> },
  { name: "Oracle", displayName: "Oracle", logo: oracleLogo, isImage: true, small: true },
  { name: "Dropbox", displayName: "Dropbox", logo: <DropboxLogo /> },
  { name: "Xero", displayName: "Xero", logo: xeroLogo, isImage: true },
  { name: "ElevenLabs", displayName: "ElevenLabs", logo: <ElevenLabsLogo /> },
  { name: "Accountable.link", displayName: "Accountable.link", logo: accountableLinkLogo, isImage: true },
  { name: "GoHighLevel", displayName: "GoHighLevel", logo: gohighlevelLogo, isImage: true },
  { name: "VAPI", displayName: "VAPI", logo: vapiLogo, isImage: true },
  { name: "PleaseSign", displayName: "PleaseSign", logo: pleasesignLogo, isImage: true },
];

// Native Intersection Observer hook (no framer-motion dependency)
function useNativeInView(ref: React.RefObject<Element>, options?: { once?: boolean; margin?: string }): boolean {
  const [inView, setInView] = useState(false);
  
  useEffect(() => {
    if (!ref.current) {
      setInView(true);
      return;
    }
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (options?.once) {
            observer.disconnect();
          }
        } else if (!options?.once) {
          setInView(false);
        }
      },
      { rootMargin: options?.margin || '0px' }
    );
    
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, options?.once, options?.margin]);
  
  return inView;
}

// Animated counter for stats
const AnimatedCounter = ({ end, suffix = "" }: { end: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useNativeInView(ref, { once: true });

  useEffect(() => {
    if (inView) {
      const duration = 2000;
      const steps = 60;
      const increment = end / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [inView, end]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}
      {suffix}
    </span>
  );
};

const stats = [
  { value: 95, suffix: "%", label: "Less Time on Pre-Build Workflows", prefix: "70–" },
  { value: 80, suffix: "%", label: "Faster Implementation with Vibe-coding Studio", prefix: "Up to " },
  { value: 90, suffix: " days", label: "To Get Your Investment Back" },
];

const publications = [
  { name: "Forbes Australia", url: "https://www.forbes.com.au", logo: forbesLogo, className: "h-5 md:h-6" },
  { name: "AI Agents Hub", url: "https://www.aiagentshub.net", logo: aiAgentsHubIcon, showName: true, className: "h-6 md:h-7 rounded" },
  { name: "Beehiiv", url: "https://www.beehiiv.com", logo: beehiivLogo, className: "h-4 md:h-[18px]" },
  { name: "Lead with AI", url: "https://www.leadwithai.co", logo: leadWithAiLogo, className: "h-6 md:h-7" },
];


const clientLogos = [
  "Home Plus Group", "Wall Planning", "Wattyl", "WEIR ESCO", "WSP", "Window Factory",
  "TAFE NSW", "St Helena", "Strukton Rail", "KLW", "SGS",
  "Sydney Energy Institute", "Smart Ads", "RoofXPro", "Salesian College",
  "Scouts Victoria", "Queensland Government", "HATCH", "Bleuwave",
  "O'Keefe", "Optum", "PG Integrated", "Australian Islamic College",
  "Mint Construct", "M GROUP", "KBR", "Grand Canyon University",
  "EMMAUS", "EHT", "DUNSTEEL", "Crédit Agricole", "Allina Health"
];

const SocialProofSection = () => {
  const ref = useRef<HTMLElement>(null);
  const inView = useNativeInView(ref, { once: true, margin: "-50px" });

  return (
    <TooltipProvider delayDuration={100}>
      <section ref={ref} className="py-16 md:py-20 bg-background overflow-hidden">
        <div className="container-wide">
          {/* Stats Row */}
          <div
            className={`flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 mb-12 transition-all duration-600 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          >
            {stats.map((stat, index) => (
            <div 
              key={index} 
              className="text-center hover-scale-sm"
            >
              <div className="text-4xl md:text-5xl font-semibold text-foreground mb-1">
                {'prefix' in stat && stat.prefix}<AnimatedCounter end={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="w-24 h-px bg-border mx-auto mb-10" />

        {/* Tech Partners - Infinite Scroll */}
        <div
          className={`mb-10 transition-all duration-500 ${inView ? 'opacity-100' : 'opacity-0'}`}
          style={{ transitionDelay: '0.2s' }}
        >
          <p className="text-center text-xs uppercase tracking-wider text-muted-foreground mb-4">
            Partnered with World-Class Technology Providers
          </p>
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
            
            <div
              className="flex gap-6 animate-scroll-left"
              style={{ animationDuration: '30s' }}
            >
              {[...partners, ...partners].map((partner, index) => (
                <Tooltip key={`${partner.name}-${index}`}>
                  <TooltipTrigger asChild>
                  <div
                      className="flex-shrink-0 h-10 px-5 flex items-center justify-center cursor-pointer transition-opacity duration-300 hover:opacity-70"
                    >
                      {partner.isImage ? (
                        <LazyImage 
                          src={partner.logo as string} 
                          alt={partner.displayName} 
                          className={`${partner.small ? 'h-3' : 'h-5'} w-auto object-contain`}
                          wrapperClassName={`${partner.small ? 'h-3' : 'h-5'} w-12`}
                        />
                      ) : (
                        <div className="text-muted-foreground flex items-center justify-center">
                          {partner.logo}
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{partner.displayName}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Publications */}
        <div
          className={`mb-10 transition-all duration-500 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
          style={{ transitionDelay: '0.3s' }}
        >
          <p className="text-center text-xs uppercase tracking-wider text-muted-foreground mb-4">
            As Featured In
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-5 md:gap-x-12">
            {publications.map((pub, index) => (
              <a
                key={pub.name}
                href={pub.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${pub.name} (opens in a new tab)`}
                className={`group inline-flex min-h-[44px] items-center gap-2.5 px-2 py-2 grayscale opacity-60 transition-all duration-300 hover:opacity-100 hover:grayscale-0 focus-visible:opacity-100 focus-visible:grayscale-0 focus-visible:outline-none ${inView ? 'translate-y-0' : 'translate-y-3'}`}
                style={{ transitionDelay: `${0.35 + index * 0.05}s` }}
              >
                <img
                  src={pub.logo}
                  alt={`${pub.name} logo`}
                  loading="lazy"
                  className={`w-auto object-contain ${pub.className ?? "h-6"}`}
                />
                {pub.showName && (
                  <span className="text-sm font-semibold tracking-tight text-foreground">
                    {pub.name}
                  </span>
                )}
              </a>
            ))}
          </div>

        </div>

        {/* Client Logos - Double Marquee */}
        <div
          className={`transition-all duration-600 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          style={{ transitionDelay: '0.4s' }}
        >
          <p className="text-center text-xs uppercase tracking-wider text-muted-foreground mb-6">
            Industry Professionals We Served
          </p>
          
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />

            {/* First row - scrolls left */}
            <div className="flex mb-3 overflow-hidden">
              <div
                className="flex gap-3 animate-scroll-left"
                style={{ animationDuration: '35s' }}
              >
                {[...clientLogos.slice(0, 17), ...clientLogos.slice(0, 17)].map((brand, index) => (
                  <div
                    key={`row1-${index}`}
                    className="flex-shrink-0 px-3 py-1 transition-opacity duration-300 hover:opacity-70"
                  >
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                      {brand}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Second row - scrolls right */}
            <div className="flex overflow-hidden">
              <div
                className="flex gap-3 animate-scroll-right"
                style={{ animationDuration: '40s' }}
              >
                {[...clientLogos.slice(17), ...clientLogos.slice(17)].map((brand, index) => (
                  <div
                    key={`row2-${index}`}
                    className="flex-shrink-0 px-3 py-1 transition-opacity duration-300 hover:opacity-70"
                  >
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                      {brand}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    </TooltipProvider>
  );
};

export default SocialProofSection;
