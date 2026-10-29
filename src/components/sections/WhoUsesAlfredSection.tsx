import { useRef, Component, ReactNode } from "react";
import { motion, useInView } from "framer-motion";

type Wordmark = {
  name: string;
  className?: string;
};

type Industry = {
  number: string;
  name: string;
  companies: Wordmark[];
  placeholder?: string;
};

const industries: Industry[] = [
  {
    number: "01",
    name: "Construction",
    companies: [
      { name: "Abode Restoration", className: "font-medium tracking-tight uppercase" },
      { name: "Arc Energy Group", className: "font-semibold tracking-wide uppercase" },
      { name: "Cono Services", className: "font-semibold tracking-tight uppercase" },
      { name: "Pacific Energy Group", className: "font-medium tracking-wide uppercase" },
      { name: "Rogers Construction Group", className: "font-bold tracking-tight uppercase" },
      { name: "Truland", className: "font-light tracking-[0.35em] uppercase italic" },
      { name: "Worthington Homes", className: "font-medium tracking-normal" },
      { name: "WZW Construction", className: "font-semibold tracking-wide uppercase" },
    ],
  },
  {
    number: "02",
    name: "Contracting",
    companies: [
      { name: "Aitken Joinery", className: "font-semibold tracking-tight" },
      { name: "Aspect Windows", className: "font-medium tracking-[0.2em] uppercase" },
      { name: "B&N Glass", className: "font-bold tracking-tight uppercase" },
      { name: "CSF Industries", className: "font-semibold tracking-wide uppercase" },
      { name: "EE Windows", className: "font-light italic tracking-wide" },
      { name: "First Facades", className: "font-extrabold tracking-tighter uppercase" },
      { name: "KRGS Doors", className: "font-semibold uppercase" },
      { name: "LuxView Windows", className: "font-light tracking-[0.3em] uppercase" },
      { name: "Make Windows", className: "font-bold tracking-tight uppercase" },
      { name: "Window Factory", className: "font-medium tracking-tight uppercase" },
    ],
  },
  {
    number: "03",
    name: "Consultants",
    companies: [
      { name: "Access Link Consulting", className: "font-medium uppercase tracking-[0.18em]" },
      { name: "Altura", className: "font-semibold tracking-[0.3em] uppercase" },
      { name: "Aslan", className: "font-extrabold italic tracking-tight" },
      { name: "JCA Lift Consultants", className: "font-bold tracking-tight" },
      { name: "Palantir Consulting", className: "font-light tracking-[0.3em] uppercase" },
    ],
  },
  {
    number: "04",
    name: "Accounting Firms",
    companies: [
      { name: "Pop Business", className: "font-extrabold italic uppercase tracking-tight" },
    ],
  },
  {
    number: "05",
    name: "Recruitment",
    companies: [
      { name: "YouSolved", className: "font-bold tracking-widest uppercase" },
    ],
  },
  {
    number: "06",
    name: "Marketing Agency",
    companies: [
      { name: "Enough Tom Foolery", className: "font-light tracking-wide italic" },
      { name: "Eweb Marketing", className: "font-semibold tracking-tight" },
      { name: "NetSynergy Media", className: "font-bold tracking-tight uppercase" },
    ],
  },
  {
    number: "07",
    name: "Charity",
    companies: [
      { name: "St Merkorious Charity", className: "font-semibold tracking-tight" },
    ],
  },
];

const trustIndicators = [
  { value: "7", label: "Industries" },
  { value: "98%", label: "Client Retention" },
  { value: "<0.5%", label: "Average Budget" },
  { value: "5:1 – 20:1", label: "ROI Guaranteed" },
];

// Fallback boundary — keeps the user on the page and offers a contact route
class SectionErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error("[WhoUsesAlfredSection] render error:", error);
  }
  render() {
    if (this.state.hasError) {
      const pageUrl = typeof window !== "undefined" ? window.location.href : "";
      const subject = encodeURIComponent("Issue on Who's Using alfred ai section");
      const body = encodeURIComponent(
        `Hi alfred ai team,\n\nI hit an error on this page: ${pageUrl}\n\n(Attach a screenshot if helpful.)\n\nThanks.`,
      );
      return (
        <section className="bg-[#0A0A0A] text-[#FAFAFA] py-20 px-6 text-center">
          <p className="font-['Manrope'] text-sm text-[#FAFAFA]/70 mb-4">
            We're refreshing this section. In the meantime, see who we work with on our{" "}
            <a href="/solutions" className="text-[#EC4899] underline underline-offset-4">
              Solutions page
            </a>
            .
          </p>
          <a
            href={`mailto:hello@alfredai.bot?subject=${subject}&body=${body}`}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#EC4899] px-6 text-sm font-semibold text-[#0A0A0A]"
          >
            Email us about this
          </a>
        </section>
      );
    }
    return this.props.children;
  }
}

const WhoUsesAlfredSectionInner = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section
      ref={ref}
      className="bg-[#0A0A0A] text-[#FAFAFA] py-20 md:py-32 px-6 md:px-12 lg:px-16 relative overflow-hidden"
      style={{ fontFamily: "'Manrope', system-ui, sans-serif" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 md:mb-16"
        >
          <span className="block text-[#EC4899] font-medium tracking-[0.25em] uppercase text-[11px] md:text-xs mb-4">
            Industries we serve
          </span>
          <h2
            className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tighter leading-[0.95] mb-10 md:mb-12 !text-[#FAFAFA]"
            style={{ fontFamily: "'Sora', system-ui, sans-serif", color: "#FAFAFA" }}
          >
            Who's building<br />with alfred ai.
          </h2>

          {/* Trust stats bar */}
          <div className="border-y border-[rgba(250,250,250,0.08)] py-4 flex flex-wrap gap-x-6 md:gap-x-10 gap-y-3 text-[10px] md:text-xs tracking-[0.2em] uppercase text-[rgba(250,250,250,0.55)]">
            {trustIndicators.map((indicator) => (
              <span key={indicator.label} className="flex items-center gap-2">
                <span className="w-1 h-1 bg-[#EC4899] rounded-full" aria-hidden="true" />
                <span className="text-[#FAFAFA] font-semibold mr-1">{indicator.value}</span>
                <span>{indicator.label}</span>
              </span>
            ))}
          </div>
        </motion.header>

        {/* Index table */}
        <div role="list" className="grid grid-cols-1">
          {industries.map((industry, idx) => (
            <motion.div
              role="listitem"
              key={industry.number}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.15 + idx * 0.06 }}
              className="group border-b border-[rgba(250,250,250,0.08)] py-7 md:py-8 grid grid-cols-[60px_1fr] md:grid-cols-[100px_minmax(180px,1fr)_2fr] gap-x-4 gap-y-3 items-baseline transition-colors hover:bg-[rgba(250,250,250,0.025)] px-2 md:px-4 min-h-[56px]"
            >
              <span className="text-[#EC4899] font-mono text-xs md:text-sm tracking-tighter tabular-nums">
                [ {industry.number} ]
              </span>
              <h3
                className="text-base md:text-xl font-bold uppercase tracking-tight !text-[#FAFAFA]"
                style={{ fontFamily: "'Sora', system-ui, sans-serif", color: "#FAFAFA" }}
              >
                {industry.name}
              </h3>
              <div className="col-span-2 md:col-span-1 flex flex-wrap gap-x-5 md:gap-x-6 gap-y-2 text-[#FAFAFA]/70 group-hover:text-[#FAFAFA]/90 transition-colors">
                {industry.companies.length === 0 && industry.placeholder ? (
                  <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-[#EC4899]/70">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EC4899]/60 animate-pulse" />
                    {industry.placeholder}
                  </span>
                ) : (
                  industry.companies.map((company) => (
                    <span
                      key={company.name}
                      className={`text-sm md:text-[15px] ${company.className ?? ""}`}
                      style={{ fontFamily: "'Sora', system-ui, sans-serif" }}
                    >
                      {company.name}
                    </span>
                  ))
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Closing line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-center mt-12 md:mt-16 text-sm md:text-base text-[#FAFAFA]/60"
        >
          Join the firms already scaling execution with{" "}
          <span className="text-[#EC4899] font-semibold">Agentic AI</span>.
        </motion.p>
      </div>
    </section>
  );
};

const WhoUsesAlfredSection = () => (
  <SectionErrorBoundary>
    <WhoUsesAlfredSectionInner />
  </SectionErrorBoundary>
);

export default WhoUsesAlfredSection;
