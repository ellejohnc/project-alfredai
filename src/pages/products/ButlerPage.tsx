import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Bot,
  FileSpreadsheet,
  FileSearch,
  FileSignature,
  TrendingUp,
  Receipt,
  Inbox,
  FileText,
  CalendarCheck,
  Truck,
  Users,
  PhoneCall,
  ShieldCheck,
  ClipboardCheck,
  Layers,
} from "lucide-react";
import takeoffWindowsDoors from "@/assets/butler/takeoff-windows-doors.jpg";
import takeoffFlooring from "@/assets/butler/takeoff-flooring.jpg";
import takeoffJoinery from "@/assets/butler/takeoff-joinery.jpg";
import takeoffFacade from "@/assets/butler/takeoff-facade.jpg";
import takeoffRooms from "@/assets/butler/takeoff-rooms.jpg";
import takeoffExport from "@/assets/butler/takeoff-export.jpg";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { productSchemaFor } from "@/lib/productSchema";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GHLBookingModal } from "@/components/GHLBookingWidget";
import PremiumCTASection from "@/components/sections/PremiumCTASection";
import ButlerDemo from "@/components/demos/ButlerDemo";
import BotoShowcaseSection from "@/components/sections/BotoShowcaseSection";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

const whyPoints = [
  "A butler understands context.",
  "A butler prepares the work.",
  "A butler serves the team.",
  "A butler protects the standard.",
  "A butler knows when to escalate.",
];

const takeOffSupports = [
  "Drawing review",
  "Quantity extraction",
  "Window and door take-off",
  "Flooring take-off",
  "Joinery take-off",
  "Façade element identification",
  "Room and area schedules",
  "Specification cross-checking",
  "Tender take-off preparation",
  "Spreadsheet or estimating workflow export",
];

const takeOffTypes = [
  {
    image: takeoffWindowsDoors,
    title: "Window & door take-off",
    description: "Counts and schedules every window and door with sizes and types.",
  },
  {
    image: takeoffFlooring,
    title: "Flooring take-off",
    description: "Measures floor areas room by room for accurate flooring quantities.",
  },
  {
    image: takeoffJoinery,
    title: "Joinery take-off",
    description: "Identifies cabinetry and timber joinery with detailed item lists.",
  },
  {
    image: takeoffFacade,
    title: "Façade element identification",
    description: "Maps cladding, panels and façade elements from elevations.",
  },
  {
    image: takeoffRooms,
    title: "Room & area schedules",
    description: "Builds room schedules with labelled areas and dimensions.",
  },
  {
    image: takeoffExport,
    title: "Spreadsheet & workflow export",
    description: "Turns drawings into structured take-off data ready to export.",
  },
];

const butlers = [
  {
    icon: FileSpreadsheet,
    name: "PDF to Take-Off Butler",
    description: "Turns drawings and PDF documents into structured take-off data.",
    featured: true,
  },
  {
    icon: FileSearch,
    name: "Tender Butler",
    description:
      "Reviews tender documents, summarises scope, identifies risks, lists missing information, prepares clarification questions, and supports go / no-go decisions.",
  },
  {
    icon: FileSignature,
    name: "Contract Butler",
    description:
      "Reviews contracts, extracts key obligations, flags commercial risks, compares terms against preferred terms, and prepares internal review notes.",
  },
  {
    icon: TrendingUp,
    name: "Sales Butler",
    description:
      "Qualifies leads, drafts follow-up emails, updates CRM notes, prepares proposals, and recommends next steps.",
  },
  {
    icon: Receipt,
    name: "Finance Butler",
    description:
      "Supports invoice processing, accounts payable, debtor follow-up, payment reminders, supplier communication, and cashflow task tracking.",
  },
  {
    icon: Inbox,
    name: "Admin Butler",
    description:
      "Triages emails, extracts action items, files documents, drafts standard responses, creates tasks, and keeps daily operations moving.",
  },
  {
    icon: FileText,
    name: "Report Butler",
    description:
      "Drafts technical reports, site inspection reports, defect summaries, board reports, management summaries, and client updates using your preferred templates.",
  },
  {
    icon: CalendarCheck,
    name: "Meeting Butler",
    description:
      "Summarises meetings, extracts decisions, creates action items, drafts follow-up emails, and updates CRM or project records.",
  },
  {
    icon: Truck,
    name: "Delivery Butler",
    description:
      "Supports project updates, RFIs, variations, site reports, risk tracking, client communication, and delivery checklists.",
  },
  {
    icon: Users,
    name: "HR Butler",
    description:
      "Supports onboarding, policy Q&A, candidate screening, role descriptions, performance review preparation, and internal staff workflows.",
  },
  {
    icon: PhoneCall,
    name: "Voice Butler",
    description:
      "Answers calls, qualifies enquiries, books appointments, handles FAQs, summarises calls, and updates CRM records.",
  },
];

const ButlerPage = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingTitle, setBookingTitle] = useState("Book a consultation");

  const openBooking = (title: string) => {
    setBookingTitle(title);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Butler | AI Agents That Do the Work"
        description="Butler is the AI agent layer of alfred ai — specialist agents for estimating, tendering, contracts, sales, finance, admin, HR, reporting, meetings, delivery, and client communication."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Products", url: "/products" },
          { name: "Butler", url: "/products/butler" },
        ]}
        product={productSchemaFor("butler")}
      />
      <Header />

      <main>
        {/* Hero */}
        <section className="relative flex items-center min-h-[88vh] pt-32 pb-16 md:pt-40 md:pb-28 bg-background overflow-hidden">
          {/* Engineered grid texture */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage: "radial-gradient(ellipse at 65% 40%, black, transparent 75%)",
            }}
          />
          <div className="container-wide relative">
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/products">Products</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Butler</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
              <motion.div {...fadeUp} className="max-w-3xl">
                <div className="inline-flex items-center gap-2 mb-6 rounded-full border border-border bg-card/70 backdrop-blur-sm px-3.5 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
                    Agentic AI · Engine 02
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <Bot className="w-12 h-12 text-foreground" />
                  <h1 className="text-4xl md:text-6xl font-black text-foreground leading-[1.05] tracking-tight font-product">
                    Butler<span className="sr-only"> — the AI agent that does the work, from take-offs to admin</span>
                  </h1>
                </div>
                <p className="text-xl md:text-2xl font-semibold text-foreground mb-4 leading-snug">
                  AI agents that do the work.
                </p>
                <motion.p
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed"
                >
                  Most AI tools answer questions. Butler helps your business complete work. Deploy specialist AI agents
                  across estimating, tendering, contracts, sales, finance, admin, HR, reporting, meetings, delivery, and
                  client communication. Each Butler works with your business knowledge, documents, workflows, systems,
                  templates, and approval process — so your team can move faster with more consistency and control.
                </motion.p>

                <div className="flex flex-col sm:flex-row gap-3 mt-7">
                  <Button variant="cta" size="lg" onClick={() => openBooking("Book a consultation")} className="min-h-touch">
                    Book a consultation
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button variant="cta-outline" size="lg" onClick={() => openBooking("Find your first Butler")} className="min-h-touch">
                    Find your first Butler
                  </Button>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="flex justify-center"
              >
                <ButlerDemo />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Example Butlers */}
        <section className="py-14 md:py-20 bg-muted/30 border-y border-border">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">Example Butlers</h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Specialist AI agents, each built around a specific workflow and connected to your business context.
              </p>
            </motion.div>

            {/* Featured: PDF to Take-Off Butler */}
            <motion.div {...fadeUp} className="rounded-2xl border border-border bg-card p-6 md:p-10 mb-6">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg md:text-2xl font-bold text-foreground">PDF to Take-Off Butler</h3>
                  <p className="text-sm md:text-base text-muted-foreground">Turns drawings and PDF documents into structured take-off data.</p>
                </div>
              </div>

              {/* Take-off types with illustrations */}
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Take-off types</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
                {takeOffTypes.map((t) => (
                  <div
                    key={t.title}
                    className="rounded-xl border border-border bg-background overflow-hidden hover:border-primary/40 transition-colors"
                  >
                    <div className="aspect-[3/2] bg-muted/40 overflow-hidden">
                      <img
                        src={t.image}
                        alt={t.title}
                        loading="lazy"
                        width={768}
                        height={512}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="text-sm font-bold text-foreground mb-1">{t.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{t.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Full supports checklist */}
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Also supports</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2.5">
                {takeOffSupports.map((s) => (
                  <div key={s} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground leading-relaxed">{s}</span>
                  </div>
                ))}
              </div>
            </motion.div>


            {/* Other Butlers */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {butlers
                .filter((b) => !b.featured)
                .map((b) => (
                  <motion.div
                    key={b.name}
                    {...fadeUp}
                    className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <b.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-2">{b.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
                  </motion.div>
                ))}
            </div>
          </div>
        </section>

        {/* Not just chat. Real work. */}
        <section className="py-14 md:py-20 bg-muted/30 border-y border-border">
          <div className="container-wide grid md:grid-cols-2 gap-10 md:gap-16 items-start">
            <motion.div {...fadeUp}>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-4">
                Most AI tools answer questions. Butler completes work.
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Butler is the AI agent layer of alfred ai, giving your business specialist agents for sales, estimating,
                tendering, contracts, finance, admin, HR, reporting, meetings, delivery, and client communication.
              </p>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed mt-4">
                Each Butler is built around a specific workflow and connected to your business knowledge, documents,
                systems, templates, and approval process.
              </p>
            </motion.div>
            <motion.div {...fadeUp} className="rounded-2xl border border-border bg-card p-8 flex flex-col justify-center">
              <p className="text-2xl md:text-3xl font-black text-foreground leading-tight">
                Not just chat.
              </p>
              <p className="text-3xl md:text-4xl font-black text-primary leading-tight mt-1">
                Real work.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Why Butler works */}
        <section className="py-14 md:py-20 bg-background">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">Why Butler works</h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                The name is strong because it is iconic to the Alfred brand. A butler is not just an assistant — and that
                is exactly what your AI agents should be.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {whyPoints.map((p) => (
                <div key={p} className="flex items-start gap-3 rounded-xl border border-border bg-card p-5">
                  <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground leading-relaxed">{p}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Built around your business */}
        <section className="py-14 md:py-20 bg-background">
          <div className="container-wide grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <motion.div {...fadeUp}>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-4">
                Built around how your business actually works.
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                From PDF to take-off, tender review, contract review, reporting, finance, admin, sales, and delivery,
                Butler gives your team specialist AI agents that help complete real work. Each Butler is built around
                your business context, systems, templates, and approval process.
              </p>
            </motion.div>
            <motion.div {...fadeUp} className="grid grid-cols-2 gap-4">
              {[
                { icon: Layers, label: "Your business knowledge" },
                { icon: ClipboardCheck, label: "Your templates & standards" },
                { icon: Bot, label: "Your workflows & systems" },
                { icon: ShieldCheck, label: "Your approval process" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border bg-card p-5">
                  <item.icon className="w-5 h-5 text-primary mb-3" />
                  <span className="text-sm font-medium text-foreground leading-snug">{item.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <BotoShowcaseSection />

        <PremiumCTASection
          title="Find your first Butler."
          description="Book a consultation and we'll help you identify the highest-value Butler to deploy first across your business."
          buttonText="Book a consultation"
          onButtonClick={() => openBooking("Book a consultation")}
          variant="light"
        />
      </main>

      <Footer />
      <GHLBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        title={bookingTitle}
        description="Book a 30-minute working session to see how Butler can complete real work across your business."
      />
    </div>
  );
};

export default ButlerPage;
