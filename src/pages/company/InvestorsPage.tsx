import { useState, useEffect, useRef } from "react";
import { useInvestorTracker } from "@/hooks/useInvestorTracker";
import { motion, useInView, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { Calendar as CalendarIcon } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import InvestorQualificationGate from "@/components/InvestorQualificationGate";
import { LayeredArchitectureDiagram } from "@/components/architecture/LayeredArchitectureDiagram";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

import { InvestorBookingModal } from "@/components/investors/InvestorBookingModal";
import { InvestorProfileCard } from "@/components/investors/InvestorProfileCard";
import RevenueProjectionChart from "@/components/investors/RevenueProjectionChart";
import GeographicExpansionMap from "@/components/investors/GeographicExpansionMap";
import {
  SignedRevenueCards,
  MarketSizingSection,
  MacroTailwindSection,
  ErpParadigmSection,
  VibeCodingSection,
  CompetitorLandscapeSection,
  RevenueModelSection,
  FinancialModelTable,
  StrategicImperativeSection,
} from "@/components/investors/InvestorDeckSections";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { productShowcase } from "@/data/products";
import {
  TrendingUp,
  Users,
  Building2,
  Zap,
  Target,
  Globe,
  CheckCircle2,
  Layers,
  Brain,
  Workflow,
  BarChart3,
  Clock,
  Shield,
  Briefcase,
  ArrowRight,
  Lock,
  MapPin,
  Calendar,
  DollarSign,
  Cloud,
  Cog,
  Wrench,
  Crosshair,
  Linkedin,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FileText,
  Link2,
  BookOpen,
  Headphones,
  Smartphone,
  Server,
  Rocket
} from "lucide-react";

// Enhanced animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0 }
};

const fadeInRight = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0 }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 }
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
};

// Premium section header with gradient text
function SectionHeader({ label, title, subtitle }: { label?: string; title: string; subtitle?: string }) {
  return (
    <motion.div variants={fadeInUp} className="text-center mb-8 md:mb-12 px-1">
      {label && (
        <motion.span 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-1.5 text-[10px] md:text-[11px] font-semibold text-primary uppercase tracking-wider mb-2 px-3 py-1 bg-primary/10 rounded-full"
        >
          <Sparkles className="w-3 h-3" />
          {label}
        </motion.span>
      )}
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
        {title}
      </h2>
      {subtitle && (
        <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base leading-relaxed">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

// Reusable animated section wrapper with enhanced animations
function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  
  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.section>
  );
}

interface InvestorData {
  id?: string;
  fullName: string;
  email: string;
  firmName: string;
  role: string;
  investmentFocus: string;
  checkSize: string;
  interestReason: string;
}

export default function InvestorsPage() {
  const [showCalendly, setShowCalendly] = useState(false);
  const [isQualified, setIsQualified] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [investorData, setInvestorData] = useState<InvestorData | null>(null);
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  // Live sales pipeline value (in $M) pulled from the Admin portal data.
  // Falls back to the static figure below if the request fails.
  const [livePipelineM, setLivePipelineM] = useState<number | null>(null);
  const { trackActivity } = useInvestorTracker();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("public-pipeline-stats");
        if (error) throw error;
        if (active && data?.success && typeof data.pipelineValue === "number" && data.pipelineValue > 0) {
          setLivePipelineM(data.pipelineValue / 1_000_000);
        }
      } catch (e) {
        // Silent fallback to the static figure.
        console.warn("Live pipeline stat unavailable, using fallback", e);
      }
    })();
    return () => { active = false; };
  }, []);

  // Parallax scroll setup
  const { scrollY } = useScroll();
  const parallaxY1 = useTransform(scrollY, [0, 1000], [0, -150]);
  const parallaxY2 = useTransform(scrollY, [0, 1000], [0, -100]);
  const parallaxY3 = useTransform(scrollY, [0, 1000], [0, -80]);

  // Show floating CTA after scrolling past hero, hide near bottom
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const distanceFromBottom = docHeight - (scrollTop + windowHeight);
      
      // Show after 400px scroll, hide when within 400px of bottom (near CTA/footer)
      setShowFloatingCTA(scrollTop > 400 && distanceFromBottom > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Re-verify access server-side on every load. The localStorage flag alone is
  // not trusted — the stored access code is re-validated via the edge function.
  const checkQualificationStatus = async (): Promise<boolean> => {
    const qualified = localStorage.getItem("investor_qualified");
    const qualifiedAt = localStorage.getItem("investor_qualified_at");
    const storedData = localStorage.getItem("investor_data");
    const accessCode = localStorage.getItem("investor_access_code");
    const sessionDurationDays = parseInt(localStorage.getItem("investor_session_duration") || "7", 10);

    if (qualified !== "true" || !qualifiedAt || !accessCode) {
      return false;
    }

    // Local session window must still be valid.
    const sessionDurationMs = sessionDurationDays * 24 * 60 * 60 * 1000;
    if (Date.now() - parseInt(qualifiedAt) >= sessionDurationMs) {
      return false;
    }

    // Server-side re-verification of the stored access code.
    try {
      const { data, error } = await supabase.functions.invoke("validate-investor-code", {
        body: { access_code: accessCode },
      });
      if (error || !data?.valid) {
        handleClearSession();
        return false;
      }
      // Refresh stored investor details from the verified response.
      if (data.investor) {
        localStorage.setItem("investor_data", JSON.stringify(data.investor));
        setInvestorData(data.investor);
      } else if (storedData) {
        try {
          setInvestorData(JSON.parse(storedData));
        } catch (e) {
          console.error("Error parsing investor data:", e);
        }
      }
      return true;
    } catch (e) {
      console.error("Investor access re-verification failed:", e);
      return false;
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const qualified = await checkQualificationStatus();
      if (!active) return;
      setIsQualified(qualified);
      setIsCheckingAccess(false);
    })();
    return () => {
      active = false;
    };
    // Runs once on mount by design — the `active` flag above handles unmount
    // mid-check. Re-running would re-query qualification on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle qualification completion - re-read data from localStorage
  const handleQualified = () => {
    checkQualificationStatus();
    setIsQualified(true);
    // Track the initial page view after qualification
    trackActivity('page_view', 'Investor Portal Home');
  };

  const handleClearSession = () => {
    localStorage.removeItem("investor_qualified");
    localStorage.removeItem("investor_qualified_at");
    localStorage.removeItem("investor_session_token");
    localStorage.removeItem("investor_data");
    setInvestorData(null);
    setIsQualified(false);
  };

  const handleUpdateInvestorData = (newData: InvestorData) => {
    setInvestorData(newData);
  };

  if (isCheckingAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isQualified) {
    return <InvestorQualificationGate onQualified={handleQualified} />;
  }

  // Data - Updated with accurate information
  const quickFacts = [
    { label: "Ideated", value: "Dec 2023" },
    { label: "1st Product", value: "Mar 2025" },
    { label: "Stage", value: "Late Seed" },
    { label: "Raising", value: "$2M USD" },
    { label: "HQ", value: "Sydney, AU" }
  ];

  const problems = [
    { icon: Brain, title: "AI Is Now Essential", description: "AI is becoming critical infrastructure for every business — having a trusted AI tech partner is no longer optional" },
    { icon: BarChart3, title: "Margin & Competitor Pressure", description: "Clients demand more value while costs rise, talent is scarce, and competitors move faster" },
    { icon: Layers, title: "Data Mess", description: "Valuable knowledge trapped in silos across dozens of disconnected tools and spreadsheets" },
    { icon: Users, title: "Communication Mess", description: "Critical updates lost in email chains, chat threads, and manual follow-ups across teams" },
    { icon: Zap, title: "Insight Transparency", description: "Speed to information is too slow — decisions are delayed by manual reporting and lack of real-time visibility" },
    { icon: Rocket, title: "Slow Feature Delivery", description: "Deploying new software features takes weeks or months — with alfred ai, teams ship updates 10x faster" },
  ];

  // Sourced from the shared product catalog so updates on the Products page
  // automatically flow through to this Investors showcase.


  const tractionMetrics = [
    { value: livePipelineM != null ? livePipelineM : 3.369, prefix: "$", suffix: "M", label: "Active pipeline value", decimals: 2 },
    { value: 116, label: "Proposals sent" },
    { value: 150, prefix: "$", suffix: "k+", label: "Average LTV per client (3-year)" },
    { value: 95, suffix: "%", label: "Client retention rate" }
  ];


  const targetMarket = {
    size: "Mid-Market Enterprise Teams",
    revenue: "$10M–$300M revenue",
    staff: "20–500 staff",
    verticals: ["Professional Services", "Construction & Trades", "Property & Real Estate", "Insurance & Risk", "Agencies"]
  };

  const marketFocus = [
    { region: "ANZ", status: "Current", description: "Established enterprise presence" },
    { region: "UK", status: "Late 2025", description: "Similar regulatory environment" },
    { region: "KSA Region", status: "2026", description: "Middle East expansion" },
    { region: "APAC", status: "2026", description: "Regional expansion" },
    { region: "Europe", status: "2027", description: "Continental growth" },
    { region: "North America", status: "2028+", description: "Post Series B expansion" }
  ];

  const securityCerts = [
    { name: "ISO 27001", icon: Shield, status: "Certified ISMS" },
    { name: "SOC 2 Type II", icon: Shield, status: "Audited controls" },
    { name: "GDPR", icon: Lock, status: "Compliant" },
    { name: "GCC Certified", icon: Shield, status: "Enterprise standards" },
    { name: "Managed by Vanta", icon: Cloud, status: "Continuous monitoring" }
  ];

  const companyTimeline = [
    { date: "Dec 2023", event: "Company Ideated", status: "complete" },
    { date: "Mar 2025", event: "1st Product Launch", status: "complete" },
    { date: "Apr 2025", event: "Pre-Seed Closed", status: "complete" },
    { date: "Jun 2025", event: "Seed Round Closed", status: "complete" },
    { date: "Late 2026", event: "Late Seed Raising", status: "current" },
    { date: "2027", event: "Series A", status: "future" }
  ];

  const fundingTimeline = [
    { round: "Pre-Seed", date: "April 2025", status: "closed" },
    { round: "Seed", date: "June 2025", status: "closed" },
    { round: "Late Seed", date: "Late 2026", amount: "$2M USD", valuation: "For 10% equity", status: "current" },
    { round: "Series A", date: "2027", status: "future" },
    { round: "Series B", date: "2028–2029", status: "future" },
  ];

  const seriesA1UseOfFunds = [
    { category: "Global Expansion — Singapore, NZ, HK, KSA & GCC, then US & Canada", percentage: 40 },
    { category: "Sales & Marketing — VP Sales, 3 AEs (ANZ), content-led inbound", percentage: 35 },
    { category: "Product & Engineering — Vibe Coding engine & enterprise integrations", percentage: 25 }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Investors" 
        description="Explore investment opportunities with alfred ai - the AI-powered operating layer for mid-market firms. View our growth metrics, market opportunity, and funding details."
        noindex={true}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Company", url: "/company/about" },
          { name: "Investors", url: "/company/investors" }
        ]}
      />
      <Header />
      
      {/* Floating Investor Profile Card */}
      {investorData && (
        <InvestorProfileCard 
          data={investorData} 
          onUpdate={handleUpdateInvestorData} 
        />
      )}
      
      <main className="pt-20">
        {/* Hero Section - Enhanced with premium effects and parallax */}
        <AnimatedSection className="relative py-12 md:py-20 lg:py-28 overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent pointer-events-none" />
          
          {/* Parallax decorative elements */}
          <motion.div 
            style={{ y: parallaxY1 }}
            className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50"
          />
          <motion.div 
            style={{ y: parallaxY2 }}
            className="absolute bottom-0 right-1/4 w-72 h-72 bg-accent/10 rounded-full blur-3xl opacity-40"
          />
          <motion.div 
            style={{ y: parallaxY3 }}
            className="absolute top-1/2 right-10 w-48 h-48 bg-primary/5 rounded-full blur-2xl opacity-60"
          />
          
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <motion.div 
              variants={fadeInUp} 
              className="max-w-4xl mx-auto text-center"
            >
              {investorData?.fullName && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="mb-5 flex items-center justify-center gap-2"
                >
                  <span className="text-sm text-primary font-medium bg-primary/10 px-3 py-1 rounded-full">
                    Welcome, {investorData.fullName.split(" ")[0]}
                  </span>
                  <button
                    onClick={handleClearSession}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                  >
                    Not you?
                  </button>
                </motion.div>
              )}
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/20 rounded-full text-primary text-xs font-semibold mb-6 backdrop-blur-sm"
              >
                <Shield className="w-4 h-4" />
                <span>Confidential Investor Materials</span>
                <Lock className="w-3 h-3 opacity-60" />
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight"
              >
                <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
                  Configurable AI Agents for
                </span>
                <br />
                <span className="text-primary">Construction & Contracting</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-base md:text-lg text-muted-foreground mb-2 max-w-xl mx-auto leading-relaxed"
              >
                Orchestrating company and project workflows end to end — targeting $10M–$300M turnover firms.
              </motion.p>
              
              {/* Quick Facts - Enhanced cards */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex justify-center gap-4 sm:gap-8 mt-8 pt-6 border-t border-border/30 overflow-x-auto pb-2"
              >
                {quickFacts.map((fact, index) => (
                  <motion.div 
                    key={fact.label}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="text-center flex-shrink-0 px-4 py-3 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 hover:border-primary/30 transition-all duration-300"
                  >
                    <div className="text-lg sm:text-xl font-bold text-foreground">{fact.value}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">{fact.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </AnimatedSection>

        {/* Company Timeline - Simplified horizontal scroll on mobile */}
        <AnimatedSection className="py-6 md:py-8 border-y border-border/50 bg-muted/20">
          <div className="container mx-auto px-3 sm:px-6">
            <div className="overflow-x-auto -mx-3 px-3">
              <div className="flex items-center gap-2 md:gap-0 md:justify-center min-w-max">
                {companyTimeline.map((item, index) => (
                  <div key={item.date} className="flex items-center">
                    <div className={`flex flex-col items-center px-2 md:px-4 ${
                      item.status === "current" ? "text-primary" : "text-muted-foreground"
                    }`}>
                      <div className={`w-2 h-2 rounded-full mb-1 ${
                        item.status === "current" 
                          ? "bg-primary ring-2 ring-primary/20" 
                          : "bg-muted-foreground/40"
                      }`} />
                      <div className="text-[10px] md:text-xs font-medium whitespace-nowrap">{item.date}</div>
                      <div className={`text-[9px] md:text-[10px] text-center whitespace-nowrap ${
                        item.status === "current" ? "font-semibold" : ""
                      }`}>{item.event}</div>
                    </div>
                    {index < companyTimeline.length - 1 && (
                      <div className="w-4 md:w-8 h-px bg-border flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Problem Section - Enhanced with hover effects */}
        <AnimatedSection className="py-10 md:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <SectionHeader 
              label="Challenge"
              title="The Problems We Solve"
              subtitle="Every business now needs an AI execution partner."
            />
            
            <div className="grid grid-cols-2 gap-3 md:gap-4 max-w-4xl mx-auto">
              {problems.map((problem, index) => (
                <motion.div 
                  key={problem.title}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="group bg-card border border-border rounded-xl p-4 md:p-5 hover:border-destructive/30 hover:shadow-lg hover:shadow-destructive/5 transition-all duration-300"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-destructive/20 to-destructive/10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <problem.icon className="w-5 h-5 md:w-6 md:h-6 text-destructive" />
                  </div>
                  <h3 className="text-sm md:text-base font-bold text-foreground mb-2">{problem.title}</h3>
                  <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">{problem.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Product Portfolio */}
        <AnimatedSection className="py-10 md:py-16 bg-gradient-to-b from-muted/50 to-muted/20">
          <div className="container mx-auto px-4 sm:px-6">
            <SectionHeader 
              label="Products"
              title="Product Portfolio"
              subtitle="Five layers spanning custom AI, agents, intelligence, governance, and the operating system."
            />

            {/* Core products - vertical stack */}
            <div className="flex flex-col gap-3 md:gap-4 max-w-md mx-auto mb-4 md:mb-6">
              {productShowcase.filter(p => p.tag === "Core").map((product) => (
                <motion.div 
                  key={product.title}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.03, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="group bg-card border border-border rounded-xl p-4 md:p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <product.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm md:text-base font-bold text-foreground truncate">{product.title}</h3>
                        <span className="text-[9px] font-semibold text-primary uppercase tracking-wider bg-primary/10 px-1.5 py-0.5 rounded-full flex-shrink-0">{product.tag}</span>
                      </div>
                      <p className="text-muted-foreground text-xs leading-relaxed">{product.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Other products - grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 max-w-5xl mx-auto">
              {productShowcase.filter(p => p.tag !== "Core").map((product) => (
                <motion.div 
                  key={product.title}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.03, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="group bg-card border border-border rounded-xl p-4 md:p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <product.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm md:text-base font-bold text-foreground truncate">{product.title}</h3>
                        <span className="text-[9px] font-semibold text-primary uppercase tracking-wider bg-primary/10 px-1.5 py-0.5 rounded-full flex-shrink-0">{product.tag}</span>
                      </div>
                      <p className="text-muted-foreground text-xs leading-relaxed">{product.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Competitive Edge - Enhanced with glassmorphism */}
        <AnimatedSection className="py-10 md:py-16 relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-1/4 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-accent/5 rounded-full blur-2xl" />
          
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <SectionHeader 
              label="Defensibility"
              title="Our Competitive Moats"
              subtitle="Six defensible advantages that compound over time."
            />

            {/* Core Differentiators - 5 moats grid with enhanced cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 max-w-5xl mx-auto mb-8 md:mb-10">
              {[
                { 
                  icon: Cog, 
                  title: "Vertical-First Intelligence", 
                  desc: "70%+ pre-built for specific industries with encoded workflows, compliance logic, and playbooks competitors don't have.", 
                  tag: "Domain Expertise", 
                  gradient: "from-amber-500/20 to-orange-500/10",
                  iconColor: "text-amber-500"
                },
                { 
                  icon: Layers, 
                  title: "High Switching Costs", 
                  desc: "Deeply embedded across CRM, PM, finance, documents, and comms — Alfred becomes the operating layer, not a tool.", 
                  tag: "Integration Depth", 
                  gradient: "from-blue-500/20 to-cyan-500/10",
                  iconColor: "text-blue-500"
                },
                { 
                  icon: Shield, 
                  title: "Private AI + Enterprise Security", 
                  desc: "Customer-isolated AI, private cloud deployment, audit trails, and enterprise-grade governance by default.", 
                  tag: "Technical", 
                  gradient: "from-purple-500/20 to-violet-500/10",
                  iconColor: "text-purple-500"
                },
                { 
                  icon: Target, 
                  title: "Outcome-Driven Model", 
                  desc: "ROI-guaranteed, done-for-you deployments — customers don't experiment, they commit.", 
                  tag: "Business Model", 
                  gradient: "from-green-500/20 to-emerald-500/10",
                  iconColor: "text-green-500"
                },
                { 
                  icon: Brain, 
                  title: "Compounding Data Advantage", 
                  desc: "System learns from real operational decisions and outcomes, not generic prompts.", 
                  tag: "AI Flywheel", 
                  gradient: "from-pink-500/20 to-rose-500/10",
                  iconColor: "text-pink-500"
                },
                { 
                  icon: Target, 
                  title: "First Serious Mover", 
                  desc: "First dedicated AI execution platform for Australia's mid-tier construction market — a $50B+ segment with no credible AI-native competitor.", 
                  tag: "Market Timing", 
                  gradient: "from-teal-500/20 to-cyan-500/10",
                  iconColor: "text-teal-500"
                }
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.03, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="group relative bg-card/80 backdrop-blur-sm border border-border rounded-xl p-5 md:p-6 hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <item.icon className={`w-5 h-5 md:w-6 md:h-6 ${item.iconColor}`} />
                      </div>
                      <span className={`text-[10px] md:text-xs font-semibold ${item.iconColor} uppercase tracking-wider bg-background/50 px-2 py-1 rounded-full`}>{item.tag}</span>
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-foreground mb-2">{item.title}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* How We Win - Swipeable competitive positioning for mobile */}
            <motion.div variants={fadeInUp} className="max-w-4xl mx-auto mb-8">
              <h3 className="text-base md:text-xl font-bold text-foreground mb-5 text-center">Competitive Positioning</h3>
              
              {/* Desktop: Grid view */}
              <div className="hidden md:block">
                <div className="grid grid-cols-[1fr_1fr_1.3fr] gap-3 mb-3 px-3">
                  <span className="text-sm uppercase tracking-wide text-muted-foreground font-medium">Category</span>
                  <span className="text-sm uppercase tracking-wide text-muted-foreground font-medium text-center">Others</span>
                  <span className="text-sm uppercase tracking-wide text-primary font-semibold text-center">alfred ai Enterprise</span>
                </div>
                <div className="space-y-2">
                  {[
                    { category: "Project Mgmt", vs: "Monday, ClickUp", them: "Try to do everything", us: "Mid-market focus, Private Cloud" },
                    { category: "Automation", vs: "Zapier, Make", them: "Per-action pricing", us: "Flat-rate predictable" },
                    { category: "Enterprise", vs: "ServiceNow, Oracle", them: "$500K+ implementation", us: "Mid-market price, enterprise power" },
                      { category: "CRM", vs: "Salesforce, HubSpot", them: "Underutilised due to complexity", us: "70% pre-built for Industry verticals" },
                    { category: "Construction", vs: "Procore", them: "Not AI native", us: "AI Copilot for decision making" },
                      { category: "AI Tools", vs: "ChatGPT, Manus", them: "Generic, unstructured task-oriented", us: "Industry-trained, deep access" },
                    { category: "Automation", vs: "n8n", them: "DIY and not certified for security", us: "Done-for-you, secure, ROI Guaranteed" }
                  ].map((row) => (
                    <div key={row.vs} className="grid grid-cols-[1fr_1fr_1.3fr] gap-3 items-center bg-card border border-border rounded-lg p-4">
                      <div>
                        <span className="text-base font-medium text-foreground block">{row.category}</span>
                        <span className="text-sm text-muted-foreground">{row.vs}</span>
                      </div>
                      <div className="bg-muted/50 rounded px-2 py-1.5 text-center">
                        <span className="text-sm text-muted-foreground">× {row.them}</span>
                      </div>
                      <div className="bg-primary/10 border border-primary/20 rounded px-2 py-1.5 text-center">
                        <span className="text-sm text-primary font-medium">✓ {row.us}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile: Swipeable cards */}
              <div className="md:hidden">
                <p className="text-xs text-muted-foreground text-center mb-3 flex items-center justify-center gap-1">
                  <ChevronLeft className="w-3 h-3" /> Swipe to compare <ChevronRight className="w-3 h-3" />
                </p>
                <Carousel opts={{ align: "start", loop: true }} className="w-full">
                  <CarouselContent className="-ml-2">
                    {[
                      { category: "Project Mgmt", vs: "Monday, ClickUp", them: "Try to do everything", us: "Mid-market focus, Private Cloud" },
                      { category: "Automation", vs: "Zapier, Make", them: "Per-action pricing", us: "Flat-rate predictable" },
                      { category: "Enterprise", vs: "ServiceNow, Oracle", them: "$500K+ implementation", us: "Mid-market price, enterprise power" },
                      { category: "CRM", vs: "Salesforce, HubSpot", them: "Underutilised due to complexity", us: "70% pre-built for Industry verticals" },
                      { category: "Construction", vs: "Procore", them: "Not AI native", us: "AI Copilot for decision making" },
                      { category: "AI Tools", vs: "ChatGPT, Manus", them: "Generic, unstructured task-oriented", us: "Industry-trained, deep access" },
                      { category: "Automation", vs: "n8n", them: "DIY and not certified for security", us: "Done-for-you, secure, ROI Guaranteed" }
                    ].map((row, index) => (
                      <CarouselItem key={row.vs} className="pl-2 basis-[85%]">
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="bg-card border border-border rounded-xl p-4 h-full"
                        >
                          {/* Category header */}
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <span className="text-base font-semibold text-foreground block">{row.category}</span>
                              <span className="text-sm text-muted-foreground">vs {row.vs}</span>
                            </div>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                              {index + 1}/6
                            </span>
                          </div>
                          
                          {/* Comparison */}
                          <div className="space-y-3">
                            <div className="bg-muted/50 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <span className="text-destructive text-lg">×</span>
                                <div>
                                  <span className="text-xs uppercase text-muted-foreground font-medium block mb-1">Others</span>
                                  <span className="text-sm text-muted-foreground">{row.them}</span>
                                </div>
                              </div>
                            </div>
                            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <span className="text-primary text-lg">✓</span>
                                <div>
                                  <span className="text-xs uppercase text-primary font-semibold block mb-1">alfred ai Enterprise</span>
                                  <span className="text-sm text-primary font-medium">{row.us}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>
            </motion.div>

            {/* Moat Visualization - Compact */}
            <motion.div variants={fadeInUp} className="max-w-xl mx-auto">
              <h3 className="text-sm md:text-base font-bold text-foreground mb-3 text-center">Defensibility</h3>
              <div className="space-y-2">
                {[
                  { layer: "Domain Expertise", width: "100%" },
                  { layer: "Customer Data", width: "85%" },
                  { layer: "Self-trained ML Architecture", width: "70%" },
                  { layer: "Integrations", width: "55%" }
                ].map((item, i) => (
                  <div key={item.layer}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[10px] md:text-xs text-foreground">{item.layer}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: item.width }}
                        transition={{ duration: 0.5, delay: i * 0.08 }}
                        viewport={{ once: true }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </AnimatedSection>

        {/* Enterprise Architecture */}
        <AnimatedSection className="py-8 md:py-14 bg-muted/30">
          <div className="container mx-auto px-3 sm:px-6">
            <SectionHeader 
              label="Tech"
              title="Enterprise Architecture"
              subtitle="6-layer secure architecture."
            />
            <div className="max-w-3xl mx-auto">
              <LayeredArchitectureDiagram />
            </div>
          </div>
        </AnimatedSection>

        {/* Security & Compliance - Enhanced badges */}
        <AnimatedSection className="py-8 md:py-12">
          <div className="container mx-auto px-4 sm:px-6">
            <h3 className="text-base md:text-lg font-bold text-foreground mb-5 text-center">Security & Compliance</h3>
            <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
              {securityCerts.map((cert, index) => (
                <motion.div 
                  key={cert.name}
                  variants={fadeInUp}
                  animate={{ 
                    y: [0, -6, 0],
                  }}
                  transition={{ 
                    y: {
                      duration: 3 + index * 0.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.3
                    }
                  }}
                  whileHover={{ scale: 1.08, y: -8 }}
                  className="group bg-card/80 backdrop-blur-sm border border-border rounded-full px-4 py-2 flex items-center gap-2 hover:border-primary/30 hover:shadow-md hover:shadow-primary/10 transition-all duration-300 cursor-default"
                >
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <cert.icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-foreground">{cert.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Traction & Business Model Combined - Enhanced */}
        <AnimatedSection className="py-10 md:py-16 bg-gradient-to-b from-muted/50 to-muted/20 relative overflow-hidden">
          {/* Parallax decorative elements */}
          <motion.div 
            style={{ y: parallaxY2 }}
            className="absolute top-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" 
          />
          <motion.div 
            style={{ y: parallaxY3 }}
            className="absolute bottom-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-2xl" 
          />
          <motion.div 
            style={{ y: parallaxY1 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/3 rounded-full blur-3xl opacity-50" 
          />
          
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <SectionHeader 
              label="Progress"
              title="Traction — Proven PMF, Immediate ROI"
              subtitle="18 deals closed. $1M signed LTV. 95% retention."
            />

            <SignedRevenueCards />

            {/* Enhanced traction metrics with animated numbers and staggered entrance */}
            <div className="grid grid-cols-2 gap-4 mb-8 max-w-3xl mx-auto">
              {tractionMetrics.map((metric, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ 
                    duration: 0.5, 
                    delay: i * 0.15,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                  whileHover={{ scale: 1.03, y: -4 }}
                  className="group bg-card/80 backdrop-blur-sm border border-border rounded-xl p-5 text-center hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                >
                  <div className="text-2xl md:text-3xl font-bold text-primary mb-2 group-hover:scale-105 transition-transform">
                    <AnimatedNumber 
                      value={metric.value} 
                      prefix={metric.prefix} 
                      suffix={metric.suffix} 
                      decimals={metric.decimals}
                      duration={2000} 
                    />
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground">{metric.label}</div>
                </motion.div>
              ))}
            </div>

            <RevenueProjectionChart />
            <FinancialModelTable />
          </div>
        </AnimatedSection>

        {/* Paradigm Shift — Traditional ERP vs Agentic ERP */}
        <AnimatedSection className="py-8 md:py-14">
          <div className="container mx-auto px-3 sm:px-6">
            <SectionHeader 
              label="Paradigm Shift"
              title="Traditional ERP Records the Past. Agentic ERP Shapes the Future."
            />
            <ErpParadigmSection />
          </div>
        </AnimatedSection>

        {/* Vibe Coding */}
        <AnimatedSection className="py-8 md:py-14 bg-muted/30">
          <div className="container mx-auto px-3 sm:px-6">
            <SectionHeader 
              label="Vibe Coding"
              title="Self-Service OS Customisation — No Developers Required"
            />
            <VibeCodingSection />
          </div>
        </AnimatedSection>

        {/* Business Model - Setup + retainer + usage meter */}
        <AnimatedSection className="py-8 md:py-14">
          <div className="container mx-auto px-3 sm:px-6">
            <SectionHeader 
              label="Revenue"
              title="Setup + Retainer + Usage Meter"
              subtitle="Priced as a percentage of client revenue, with software-like margins."
            />
            <RevenueModelSection />
          </div>
        </AnimatedSection>

        {/* Market Opportunity - Compact */}
        <AnimatedSection className="py-8 md:py-14 bg-muted/30">
          <div className="container mx-auto px-3 sm:px-6">
            <SectionHeader 
              label="Market"
              title="A $26B Global Software Market"
              subtitle="$3.5B serviceable across APAC & GCC, with a $300M ANZ beachhead."
            />

            <div className="mb-6">
              <MarketSizingSection />
            </div>

            <div className="mb-8">
              <h3 className="text-sm md:text-base font-bold text-foreground mb-3 text-center">
                Macro Tailwind: The Data Centre Construction Boom
              </h3>
              <MacroTailwindSection />
            </div>


            {/* Target Market - Compact */}
            <motion.div variants={fadeInUp} className="max-w-3xl mx-auto mb-6">
              <div className="bg-card border border-border rounded-lg p-3 md:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">{targetMarket.size}</span>
                </div>
                <div className="flex gap-3 mb-2 text-[10px] md:text-xs text-muted-foreground">
                  <span>{targetMarket.revenue}</span>
                  <span>•</span>
                  <span>{targetMarket.staff}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {targetMarket.verticals.map((v) => (
                    <span key={v} className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] md:text-[10px] font-medium rounded">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="max-w-4xl mx-auto">
              <GeographicExpansionMap />
            </motion.div>
          </div>
        </AnimatedSection>

        {/* Category Landscape */}
        <AnimatedSection className="py-8 md:py-14">
          <div className="container mx-auto px-3 sm:px-6">
            <SectionHeader 
              label="Market Fit & Trends"
              title="$1B+ Invested in the Construction AI Category"
              subtitle="Global capital is validating the category — and no AI-native player owns the ANZ mid-market."
            />
            <CompetitorLandscapeSection />
          </div>
        </AnimatedSection>

        {/* Strategic Imperative */}
        <AnimatedSection className="py-8 md:py-14 bg-muted/30">
          <div className="container mx-auto px-3 sm:px-6">
            <SectionHeader 
              label="Strategic Imperative"
              title="The Window Is Open — But It Won't Stay Open"
            />
            <StrategicImperativeSection />
          </div>
        </AnimatedSection>

        {/* Current GTM Strategy */}
        <AnimatedSection className="py-10 md:py-16">
          <div className="container mx-auto px-3 sm:px-6">
            <SectionHeader 
              label="Go-To-Market"
              title="Current GTM Strategy"
              subtitle="A five-era growth playbook designed to scale from founder-led sales to platform dominance."
            />

            {/* GTM Eras Timeline */}
            <div className="max-w-4xl mx-auto space-y-3 mb-8">
              {[
                {
                  era: "Era 1",
                  title: "Inbound Capture",
                  period: "Now – Q4 2026",
                  status: "active" as const,
                  icon: Target,
                  description: "Founder-led sales converting inbound demand from construction mid-tier. Instrument every touchpoint with CRM analytics from day one.",
                  tactics: ["SEO & content-led inbound", "Product-led demo experience", "Direct founder outreach", "CRM pipeline tracking"]
                },
                {
                  era: "Era 2",
                  title: "Value Selling & Moats",
                  period: "Q1 2027 – Q2 2027",
                  status: "next" as const,
                  icon: Shield,
                  description: "Shift from feature demos to quantified ROI conversations. Build competitive intelligence to defend against copycats entering the market.",
                  tactics: ["ROI-first discovery calls", "Competitive intelligence programme", "Case study & proof-point library", "Partner channel seeding"]
                },
                {
                  era: "Era 3",
                  title: "Upmarket Expansion",
                  period: "Q3 2027 – Q4 2028",
                  status: "future" as const,
                  icon: Building2,
                  description: "Test enterprise leads with small 'tip of the spear' teams before committing full product resources. Land marquee logos to unlock vertical credibility.",
                  tactics: ["Enterprise pilot programme", "Dedicated solutions engineering", "Strategic account mapping", "Industry event presence"]
                },
                {
                  era: "Era 4",
                  title: "Post-Sales Growth Engine",
                  period: "2028 – 2029",
                  status: "future" as const,
                  icon: Users,
                  description: "Separate Customer Success (adoption & retention) from Account Management (renewals & expansion) to maximise net revenue retention above 130%.",
                  tactics: ["CS / AM team split", "Expansion playbooks per segment", "Health scoring & churn prediction", "Customer advisory board"]
                },
                {
                  era: "Era 5",
                  title: "Platform & International",
                  period: "2029+",
                  status: "future" as const,
                  icon: Globe,
                  description: "Evolve from a single-product wedge into a multi-product platform. Expand internationally starting with NZ, then SE Asia and UK markets.",
                  tactics: ["Multi-product cross-sell", "Marketplace & integrations", "International GTM teams", "Channel & reseller network"]
                }
              ].map((era, index) => (
                <motion.div
                  key={era.era}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className={`bg-card border rounded-lg p-3 md:p-4 relative overflow-hidden ${
                    era.status === "active"
                      ? "border-primary shadow-md shadow-primary/10"
                      : era.status === "next"
                      ? "border-primary/40"
                      : "border-dashed border-border/60 opacity-75"
                  }`}
                >
                  {era.status === "active" && (
                    <motion.div
                      className="absolute inset-0 border-2 border-primary/20 rounded-lg pointer-events-none"
                      animate={{ opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                    />
                  )}
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      era.status === "active" ? "bg-primary/15 text-primary" 
                      : era.status === "next" ? "bg-primary/10 text-primary/80"
                      : "bg-muted text-muted-foreground"
                    }`}>
                      <era.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${
                          era.status === "active" ? "text-primary" : "text-muted-foreground"
                        }`}>{era.era}</span>
                        <span className="text-xs md:text-sm font-semibold text-foreground">{era.title}</span>
                        <span className="text-[9px] text-muted-foreground ml-auto">{era.period}</span>
                        {era.status === "active" && (
                          <span className="text-[8px] font-semibold bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">ACTIVE</span>
                        )}
                        {era.status === "next" && (
                          <span className="text-[8px] font-semibold bg-primary/10 text-primary/70 px-1.5 py-0.5 rounded-full">NEXT</span>
                        )}
                      </div>
                      <p className="text-[10px] md:text-xs text-muted-foreground mb-2 leading-relaxed">{era.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {era.tactics.map((tactic) => (
                          <span key={tactic} className="px-1.5 py-0.5 bg-muted text-muted-foreground text-[8px] md:text-[9px] rounded font-medium">
                            {tactic}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Land & Expand — Net Retention Growth Engine */}
            <div className="max-w-4xl mx-auto">
              <h3 className="text-sm font-bold text-foreground mb-1 text-center">Net Retention Growth Engine</h3>
              <p className="text-[10px] text-muted-foreground text-center mb-4">How a single $2K/mo contract compounds to $50K+/mo enterprise spend</p>
              
              {/* Funnel visualization */}
              <div className="relative">
                {/* Connecting line */}
                <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary/60 to-primary z-0" style={{ transform: 'translateY(-50%)' }} />
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative z-10">
                  {[
                    { 
                      stage: "Land", 
                      timeline: "Month 0–1", 
                      acv: "$24K–$60K", 
                      mrr: "$2K–$5K/mo",
                      products: ["1 workflow", "Single dept", "Proof of value"],
                      icon: Rocket,
                      barHeight: "h-12",
                      nrrLabel: "Entry"
                    },
                    { 
                      stage: "Adopt", 
                      timeline: "Month 2–4", 
                      acv: "$60K–$120K", 
                      mrr: "$5K–$10K/mo",
                      products: ["3–5 workflows", "Voice AI added", "2nd department"],
                      icon: Users,
                      barHeight: "h-20",
                      nrrLabel: "+100%"
                    },
                    { 
                      stage: "Expand", 
                      timeline: "Month 5–9", 
                      acv: "$120K–$300K", 
                      mrr: "$10K–$25K/mo",
                      products: ["8–12 workflows", "AI agents live", "Cross-functional"],
                      icon: TrendingUp,
                      barHeight: "h-28",
                      nrrLabel: "+250%"
                    },
                    { 
                      stage: "Scale", 
                      timeline: "Month 10+", 
                      acv: "$300K–$600K+", 
                      mrr: "$25K–$50K+/mo",
                      products: ["Full platform", "Custom AI models", "Dedicated CSM"],
                      icon: Layers,
                      barHeight: "h-36",
                      nrrLabel: "+1,150%"
                    }
                  ].map((item, i) => (
                    <motion.div
                      key={item.stage}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.45, delay: i * 0.12 }}
                      className="flex flex-col items-center"
                    >
                      {/* Growth bar */}
                      <div className="w-full flex justify-center mb-2">
                        <motion.div 
                          initial={{ height: 0 }}
                          whileInView={{ height: "auto" }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: i * 0.15 }}
                          className={`w-full max-w-[80px] ${item.barHeight} rounded-t-lg bg-gradient-to-t from-primary/20 to-primary/60 relative overflow-hidden`}
                        >
                          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-primary/30 animate-pulse" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[9px] font-bold text-primary-foreground/80 bg-primary/80 px-1.5 py-0.5 rounded text-nowrap">{item.nrrLabel}</span>
                          </div>
                        </motion.div>
                      </div>
                      
                      {/* Card */}
                      <div className="bg-card border border-border rounded-lg p-3 w-full hover:shadow-md hover:border-primary/30 transition-all duration-300 group">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="p-1.5 bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors">
                            <item.icon className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-foreground">{item.stage}</div>
                            <div className="text-[9px] text-muted-foreground">{item.timeline}</div>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-primary mb-0.5">{item.mrr}</div>
                        <div className="text-[9px] text-muted-foreground mb-2">ACV: {item.acv}</div>
                        <div className="space-y-0.5">
                          {item.products.map((p) => (
                            <div key={p} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                              <CheckCircle2 className="w-2.5 h-2.5 text-primary/60 shrink-0" />
                              <span>{p}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* NRR target badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="flex flex-wrap items-center justify-center gap-3 mt-5"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] font-semibold text-foreground">Target NRR: 140%+</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Avg. expansion: 3.2x within 12 months</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Time-to-expand: ~90 days</span>
                </div>
              </motion.div>
            </div>
          </div>
        </AnimatedSection>

        {/* Funding - Combined timeline and use of funds */}
        <AnimatedSection className="py-8 md:py-14">
          <div className="container mx-auto px-3 sm:px-6">
            <SectionHeader 
              label="Funding"
              title="Late Seed Round — Raising Now, Late 2026"
              subtitle="$2,000,000 USD for 10% equity."
            />

            {/* Horizontal funding timeline with staggered entrance */}
            <div className="overflow-x-auto -mx-3 px-3 mb-6">
              <div className="flex gap-2 min-w-max max-w-4xl mx-auto">
                {fundingTimeline.map((round, index) => (
                  <motion.div 
                    key={round.round}
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    whileInView={{ opacity: 1, x: 0, scale: 1 }}
                    viewport={{ once: true, margin: "-30px" }}
                    transition={{ duration: 0.4, delay: index * 0.12, ease: "easeOut" }}
                    whileHover={{ y: -3, scale: 1.02 }}
                    className={`bg-card border rounded-lg p-2.5 flex-1 min-w-[100px] relative transition-shadow duration-300 ${
                      round.status === "current" 
                        ? "border-primary shadow-md shadow-primary/10" 
                        : round.status === "future"
                        ? "border-dashed border-border/60 opacity-70"
                        : "border-border hover:shadow-md"
                    }`}
                  >
                    <div className="text-xs font-semibold text-foreground">{round.round}</div>
                    <div className="text-[9px] text-muted-foreground">{round.date}</div>
                    {round.amount && <div className="text-sm font-bold text-primary mt-1">{round.amount}</div>}
                    {"valuation" in round && round.valuation && (
                      <div className="text-[9px] font-medium text-muted-foreground mt-0.5">{round.valuation}</div>
                    )}
                    <span className={`text-[9px] font-medium ${
                      round.status === "current" ? "text-primary" 
                      : round.status === "future" ? "text-muted-foreground"
                      : "text-green-600"
                    }`}>
                      {round.status === "current" ? "Raising" : round.status === "future" ? "Planned" : "Closed"}
                    </span>
                    {round.status === "current" && (
                      <motion.div 
                        className="absolute inset-0 border-2 border-primary/30 rounded-lg pointer-events-none"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Use of Funds - Compact */}
            <div className="max-w-xl mx-auto">
              <h3 className="text-sm font-bold text-foreground mb-3 text-center">Late Seed Use of Funds ($2M USD)</h3>
              <div className="space-y-1.5">
                {seriesA1UseOfFunds.filter(i => i.percentage > 0).map((item, i) => (
                  <motion.div key={item.category} variants={fadeInUp} className="bg-card border border-border rounded-lg p-2.5">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] md:text-xs text-foreground">{item.category}</span>
                      <span className="text-[10px] md:text-xs text-primary font-semibold">{item.percentage}%</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.percentage}%` }}
                        transition={{ duration: 0.5, delay: i * 0.08 }}
                        viewport={{ once: true }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Leadership Team - Compact */}
        <AnimatedSection className="py-8 md:py-14 bg-muted/30">
          <div className="container mx-auto px-3 sm:px-6">
            <SectionHeader 
              label="Team"
              title="Leadership"
              subtitle="Experienced operators driving alfred ai."
            />

            {/* Core team - 2 column on mobile with staggered entrance */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 max-w-3xl mx-auto mb-6">
              {[
                { name: "William Zhang", role: "Co-Founder & CEO", initials: "WZ", linkedin: "https://www.linkedin.com/in/william-zhang-wz/" },
                { name: "Alex Tandrau", role: "Co-Founder & CTO", initials: "AT" },
                { name: "Fractional", role: "COO", initials: "F", isFractional: true },
                { name: "Fractional", role: "VP Engineering", initials: "F", isFractional: true },
                { name: "Fractional", role: "VP Sales", initials: "F", isFractional: true },
                { name: "Fractional", role: "VP Product", initials: "F", isFractional: true }
              ].map((member, index) => (
                <motion.div
                  key={member.role}
                  initial={{ opacity: 0, y: 25, rotateX: -10 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ 
                    duration: 0.45, 
                    delay: index * 0.1,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className={`bg-card border rounded-lg p-2.5 md:p-3 relative transition-shadow duration-300 hover:shadow-lg ${
                    member.isFractional ? "border-dashed border-muted-foreground/30" : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      member.isFractional ? "bg-muted" : "bg-primary/10"
                    }`}>
                      <span className={`text-xs font-bold ${member.isFractional ? "text-muted-foreground/50" : "text-primary"}`}>
                        {member.initials}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-semibold truncate ${member.isFractional ? "text-muted-foreground/60" : "text-foreground"}`}>
                          {member.name}
                        </span>
                        {member.linkedin && member.name === "William Zhang" && (
                          <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                            <Linkedin className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <p className={`text-[10px] ${member.isFractional ? "text-muted-foreground/50" : "text-primary"}`}>
                        {member.role}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Advisory Board - Inline */}
            <div className="max-w-3xl mx-auto">
              <h3 className="text-xs md:text-sm font-bold text-foreground mb-2 text-center">Advisory Board</h3>
              <div className="flex flex-wrap justify-center gap-1.5">
                {[
                  { name: "Volocean", role: "Growth", initials: "V" },
                  { name: "Aymeric Z", role: "Channel", initials: "AZ" }
                ].map((advisor, index) => (
                  <motion.div
                    key={advisor.name}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ 
                      duration: 0.35, 
                      delay: index * 0.08,
                      ease: "easeOut"
                    }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="bg-card border border-border rounded-full px-2.5 py-1 flex items-center gap-1.5 hover:border-amber-500/30 hover:shadow-sm transition-all duration-300"
                  >
                    <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-amber-600">{advisor.initials}</span>
                    </div>
                    <span className="text-[10px] font-medium text-foreground">{advisor.name}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* CTA Section - Compact */}
        <AnimatedSection className="py-10 md:py-14">
          <div className="container mx-auto px-3 sm:px-6">
            <motion.div variants={fadeInUp} className="max-w-lg mx-auto text-center">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg md:text-xl font-semibold text-foreground mb-2">
                Interested in Learning More?
              </h2>
              <p className="text-muted-foreground mb-4 text-xs md:text-sm">
                Schedule a conversation with <a href="https://www.linkedin.com/in/william-zhang-wz/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">William Zhang</a> about the Late Seed round.
              </p>
              <Button 
                size="default" 
                onClick={() => setShowCalendly(true)}
                className="px-6"
              >
                Book a Conversation
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </motion.div>
          </div>
        </AnimatedSection>
      </main>

      <Footer />

      <InvestorBookingModal 
        isOpen={showCalendly} 
        onClose={() => setShowCalendly(false)}
        initialData={investorData}
      />

      {/* Floating CTA Button */}
      <AnimatePresence>
        {showFloatingCTA && (
          <motion.button
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={() => setShowCalendly(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 transition-all duration-300 group"
          >
            <CalendarIcon className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
            <span className="font-medium text-sm">Book a Conversation</span>
            <motion.span 
              animate={{ x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-sm"
            >
              →
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
