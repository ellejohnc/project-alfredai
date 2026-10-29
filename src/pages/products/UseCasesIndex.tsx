import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Workflow } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GHLBookingModal } from "@/components/GHLBookingWidget";
import PremiumCTASection from "@/components/sections/PremiumCTASection";
import { BOOKING_PAGE_URL } from "@/lib/bookingConfig";
import { WORKFLOWS } from "@/data/workflows";


const CTA_CLASS =
  "inline-flex items-center justify-center gap-1.5 min-h-touch px-4 rounded-full bg-cta text-cta-foreground text-sm font-medium hover:opacity-90 transition-opacity";

const UseCasesIndex = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="AI Agent Use Cases — Real Workflows | alfred ai"
        description="See how alfred ai agents run real workflows end-to-end — AI Take-Off, tender management, billing and invoicing triage, inspection and technical reports, email pre-send intelligence, and AI Employees — with humans in the loop."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Products", url: "/products" },
          { name: "Use Cases", url: "/products/use-cases" },
        ]}
      />
      <Header />

      <main>
        {/* Hero */}
        <section className="pt-28 pb-12 md:pt-36 md:pb-16 bg-background relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-muted/40 via-transparent to-transparent pointer-events-none" />
          <div className="container-wide relative">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-muted rounded-full text-xs font-medium text-muted-foreground mb-6 border border-border">
                <Workflow className="w-3.5 h-3.5" />
                Use Cases
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-5 leading-[1.12] tracking-tight">
                Real workflows,{" "}
                <span className="text-primary">run end-to-end.</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground measure-prose leading-relaxed">
                Each workflow shows exactly how our agents handle the work — step by step,
                with your team in the loop where it counts. This is what done-for-you AI
                looks like in practice.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Six main workflows */}
        <section className="pb-12 md:pb-16 bg-background">
          <div className="container-wide space-y-5 md:space-y-6">
            {WORKFLOWS.map((wf, i) => {
              const Icon = wf.icon;
              const external = /^https?:/.test(wf.href);
              return (
                <motion.div
                  key={wf.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.2) }}
                  className="rounded-2xl border border-border bg-card p-5 md:p-7 shadow-elevation-1"
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
                    <div className="w-11 h-11 flex-shrink-0 rounded-xl bg-muted border border-border flex items-center justify-center">
                      <Icon className="w-5 h-5 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h2 className="text-lg md:text-xl font-bold text-foreground">{wf.title}</h2>
                        {wf.flagship && (
                          <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground border-l border-border pl-2">Flagship</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-2xl">{wf.summary}</p>
                      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                        {external ? (
                          <a href={wf.href} className={CTA_CLASS}>
                            {wf.cta}
                            <ArrowRight className="w-4 h-4" />
                          </a>
                        ) : (
                          <Link to={wf.href} className={CTA_CLASS}>
                            {wf.cta}
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        <PremiumCTASection
          title="Find the highest-impact workflow in your business"
          description="In a focused 30-minute Impact Conversation, we map one real workflow to your data, your systems, and your team — then show you the exact time, cost, and risk it removes. No pitch. No generic demo. Just proof."
          buttonText="Book an Impact Conversation"
          onButtonClick={() => setIsBookingOpen(true)}
          variant="light"
        />
      </main>

      <Footer />
      <GHLBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        title="Book an Impact Conversation"
        description="See how these workflows run for your organisation."
      />
    </div>
  );
};

export default UseCasesIndex;
