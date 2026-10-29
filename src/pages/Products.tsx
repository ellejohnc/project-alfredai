import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GHLBookingModal } from "@/components/GHLBookingWidget";
import PremiumCTASection from "@/components/sections/PremiumCTASection";
import ForgeCard from "@/components/products/ForgeCard";
import { pillars } from "@/components/products/forgePillars";
import SuiteCapabilitiesSection from "@/components/sections/SuiteCapabilitiesSection";
import UseCasesTeaserSection from "@/components/sections/UseCasesTeaserSection";
import ProductsFAQSection from "@/components/sections/ProductsFAQSection";
import { productFaqs } from "@/components/sections/productFaqData";
import TrustAssuranceSection from "@/components/sections/TrustAssuranceSection";
import { SectionHeading } from "@/components/ux";
import { Link } from "react-router-dom";
import { platformProducts, platformProductHref } from "@/data/platformProducts";

const Products = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Our Core Technology — alfred ai Products and Infrastructure"
        description="Five layers that become your full AI suite: Axiom learns your business, Omega is the living intelligence that remembers and learns, Butler is the hands that do the work, Watch is the window that surfaces what leadership needs, and AOS is the governed operating system that holds it all together."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Products", url: "/products" },
        ]}
        faqs={productFaqs}
      />
      <Header />

      <main>
        {/* Hero */}
        <section ref={heroRef} className="pt-28 pb-12 md:pt-36 md:pb-16 bg-background relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-muted/40 via-transparent to-transparent pointer-events-none" />
          <div className="container-wide relative">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-muted rounded-full text-xs font-medium text-muted-foreground mb-6 border border-border">
                <Layers className="w-3.5 h-3.5" />
                Our Core Technology Overview
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-5 leading-[1.12] tracking-tight">
                Products you use.<br />
                <span className="text-primary">Infrastructure that powers them.</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground measure-prose leading-relaxed">
                Every alfred ai product runs on the same five layers of core technology — so each one learns your business, acts for your team, and stays accountable.
              </p>
              <div className="flex flex-wrap gap-2 mt-6">
                <a href="#products" className="min-h-touch inline-flex items-center px-4 rounded-full border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">Products</a>
                <a href="#infrastructure" className="min-h-touch inline-flex items-center px-4 rounded-full border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">Our Infrastructure</a>
              </div>
              <p className="text-xs text-muted-foreground/60 mt-5 font-medium">
                Built for construction and contracting businesses with $10M–$300M turnover
              </p>
            </motion.div>
          </div>
        </section>

        {/* Products */}
        <section id="products" className="scroll-mt-24 pb-12 md:pb-16 bg-background">
          <div className="container-wide">
            <SectionHeading
              title="Products"
              description="Ready-to-run products, delivered and trained for you."
              className="mb-8"
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {platformProducts.map((p) => {
                const Icon = p.icon;
                const featured = p.badge === "Flagship";
                return (
                  <Link
                    key={p.slug}
                    to={platformProductHref(p)}
                    className={`group rounded-2xl bg-card p-5 md:p-6 min-h-touch shadow-elevation-1 hover:shadow-elevation-3 transition-all duration-300 ${
                      featured ? "border-2 border-foreground sm:col-span-2 lg:col-span-1" : "border border-border hover:border-foreground/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center">
                        <Icon className={`w-5 h-5 ${featured ? "text-primary" : "text-foreground"}`} />
                      </div>
                      {p.badge && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-foreground mb-1 flex items-center gap-1.5">
                      {p.name}
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{p.tagline}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Our Infrastructure */}
        <section id="infrastructure" className="scroll-mt-24 pb-8 md:pb-12 pt-12 md:pt-16 bg-muted/20 border-t border-border">
          <div className="container-wide space-y-5 md:space-y-6">
            <SectionHeading
              title="Our Infrastructure"
              description="Five layers of core technology. Each stands on its own — together they become the operating system for how your business learns, acts and stays accountable."
            />
            {pillars.map((pillar, index) => (
              <ForgeCard key={pillar.id} pillar={pillar} index={index} />
            ))}
          </div>
        </section>

        {/* How it fits together */}
        <section className="py-12 md:py-16 bg-muted/30 border-y border-border">
          <div className="container-wide">
            <div className="max-w-2xl">
              <SectionHeading
                title="One suite, working as a system"
                description="Axiom learns your business. Butler puts that intelligence to work. Watch tells your leaders what's coming. Omega holds your organisation's living intelligence and makes it available wherever work happens. AOS ties every layer into the way your teams actually operate — secure and governed — so adopting one layer is the first step toward the full suite."
              />
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button
                  variant="cta"
                  size="lg"
                  onClick={() => setIsBookingOpen(true)}
                  className="min-h-touch"
                >
                  Request a Demo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        <SuiteCapabilitiesSection />

        <UseCasesTeaserSection />

        <TrustAssuranceSection />

        <ProductsFAQSection />



        <PremiumCTASection
          title="See the full suite in action"
          description="Book a 30-minute Impact Conversation to see how Axiom, Butler, Watch, Omega, and AOS work together for your business."
          buttonText="Book an Impact Conversation"
          onButtonClick={() => setIsBookingOpen(true)}
          variant="light"
        />
      </main>

      <Footer />
      <GHLBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        title="Request a Demo"
        description="Book a 30-minute working session to see how the alfred ai suite drives measurable outcomes for your organisation."
      />
    </div>
  );
};

export default Products;
