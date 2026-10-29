import { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GHLBookingModal } from "@/components/GHLBookingWidget";
import PremiumCTASection from "@/components/sections/PremiumCTASection";
import { getProductBySlug, productDetails } from "@/data/products";
import { getPlatformProduct, platformProducts, platformProductHref, type PlatformProduct } from "@/data/platformProducts";
import { AIOrchestrationDiagram } from "@/components/products/AIOrchestrationDiagram";
import { SectionHeading, CompletionMoment, AIWorkTrail } from "@/components/ux";

const ProductDetailPage = () => {
  const { productId } = useParams();
  const platform = getPlatformProduct(productId);
  const product: PlatformProduct | undefined = getProductBySlug(productId) ?? platform;
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Fallback: unknown product slug → send back to the suite overview
  if (!product) {
    return <Navigate to="/products" replace />;
  }

  const Icon = product.icon;
  const otherProducts = (platform ? platformProducts : productDetails)
    .filter((p) => p.slug !== product.slug)
    .map((p) => ({ ...p, to: platform ? platformProductHref(p as PlatformProduct) : `/products/${p.slug}` }));
  const backTo = platform ? "/products#products" : "/products#infrastructure";

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${product.name} — ${product.tagline} | alfred ai`}
        description={product.intro}
        path={`/products/${product.slug}`}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Products", url: "/products" },
          { name: product.name, url: `/products/${product.slug}` },
        ]}
        product={{
          name: product.name,
          description: product.description || product.intro,
          category: "BusinessApplication",
          features: product.features.map((f) => f.title),
        }}
      />
      <Header />

      <main>
        {/* Hero */}
        <section className="pt-28 pb-12 md:pt-36 md:pb-16 bg-background relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-muted/40 via-transparent to-transparent pointer-events-none" />
          <div className="container-wide relative">
            <Link
              to={backTo}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-6 min-h-touch"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {platform ? "Back to products" : "Back to our infrastructure"}
            </Link>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                    product.accent ? "bg-primary/10 border-primary/30" : "bg-muted border-border"
                  }`}
                >
                  {product.logo ? (
                    <img src={product.logo} alt="" className="w-8 h-8 object-contain rounded-md" />
                  ) : (
                    <Icon className={`w-6 h-6 ${product.accent ? "text-primary" : "text-foreground"}`} />
                  )}
                </div>
                <span className="text-3xl font-bold tracking-tight text-muted-foreground/30 tabular-nums">
                  {product.number}
                </span>
                {product.badge && (
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border border-border bg-muted text-muted-foreground">
                    {product.badge}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 leading-[1.12] tracking-tight font-product">
                {product.name}
              </h1>
              <p className={`text-base md:text-lg font-medium mb-5 ${product.accent ? "text-primary" : "text-foreground/70"}`}>
                {product.tagline}
              </p>
              <p className="text-base md:text-lg text-muted-foreground measure-prose leading-relaxed">
                {product.intro}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-7">
                <Button variant="cta" size="lg" onClick={() => setIsBookingOpen(true)} className="min-h-touch">
                  Request a Demo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                {product.externalCta && (
                  <Button
                    variant="cta-outline"
                    size="lg"
                    onClick={() => (window.location.href = product.externalCta!.url)}
                    className="min-h-touch"
                  >
                    {product.externalCta.label}
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Overview + outcomes */}
        <section className="py-12 md:py-16 bg-muted/30 border-y border-border">
          <div className="container-wide grid md:grid-cols-2 gap-8 md:gap-12">
            <div>
              <SectionHeading title={`What ${product.name} does`} className="mb-4" />
              <p className="text-sm md:text-base text-muted-foreground measure-prose leading-relaxed">
                {product.description}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                What you get
              </h3>
              <ul className="space-y-3">
                {product.outcomes.map((o) => (
                  <li key={o} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-primary" />
                    </span>
                    <span className="text-sm md:text-base text-foreground leading-relaxed">{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-12 md:py-16 bg-background">
          <div className="container-wide">
            <SectionHeading title="Capabilities" className="mb-8" />
            <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
              {product.features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.2) }}
                  className="rounded-2xl border border-border bg-card p-6 shadow-elevation-1 hover:border-foreground/20 hover:shadow-elevation-3 transition-all duration-300"
                >
                  <h3 className="text-base font-bold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-12 md:py-16 bg-muted/30 border-y border-border">
          <div className="container-wide">
            <SectionHeading title="How it works" className="mb-8" />
            <div className="grid sm:grid-cols-3 gap-5">
              {product.howItWorks.map((s) => (
                <div key={s.step} className="rounded-2xl border border-border bg-card p-6 shadow-elevation-1">
                  <span className="text-2xl font-bold tracking-tight text-muted-foreground/30 tabular-nums">
                    {s.step}
                  </span>
                  <h3 className="text-base font-bold text-foreground mt-2 mb-1.5">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                </div>
              ))}
            </div>

            {/* Peak-end moment — what this layer delivers, and how it gets there */}
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <CompletionMoment
                title={`What ${product.name} delivers`}
                didItems={product.outcomes}
              />
              <AIWorkTrail
                className="self-start"
                summary={`How ${product.name} gets there — ${product.howItWorks.length} steps`}
                steps={product.howItWorks.map((s) => `${s.title}: ${s.description}`)}
              />
            </div>
          </div>
        </section>

        {/* AI Orchestration diagram — Omega only */}
        {product.slug === "omega" && (
          <section className="py-12 md:py-16 bg-background">
            <div className="container-wide">
              <div className="text-center mb-6 md:mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                  How Omega connects your operation's intelligence
                </h2>
                <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Omega sits at the centre — holding what the organisation knows, making it available to the people and agents that need it, and keeping every decision traceable.
                </p>
              </div>
              <AIOrchestrationDiagram />
            </div>
          </section>
        )}



        <section className="py-12 md:py-16 bg-background">
          <div className="container-wide">
            <div className="flex items-center gap-2 mb-6">
              <Layers className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-lg md:text-xl font-bold text-foreground tracking-tight">
                {platform ? "More alfred ai products" : "Explore the rest of our infrastructure"}
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {otherProducts.map((p) => {
                const PIcon = p.icon;
                return (
                  <Link
                    key={p.slug}
                    to={p.to}
                    className="group rounded-2xl border border-border bg-card p-5 shadow-elevation-1 hover:border-foreground/20 hover:shadow-elevation-3 transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center mb-3">
                      {p.logo ? (
                        <img src={p.logo} alt="" className="w-6 h-6 object-contain rounded-md" />
                      ) : (
                        <PIcon className="w-5 h-5 text-foreground" />
                      )}
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-1.5">
                      {p.name}
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{p.tagline}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <PremiumCTASection
          title={`See ${product.name} in action`}
          description="Book a 30-minute Impact Conversation to see how this layer drives measurable outcomes for your business."
          buttonText="Book an Impact Conversation"
          onButtonClick={() => setIsBookingOpen(true)}
          variant="light"
        />
      </main>

      <Footer />
      <GHLBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        title={`Request a ${product.name} Demo`}
        description="Book a 30-minute working session to see how this layer drives measurable outcomes for your organisation."
      />
    </div>
  );
};

export default ProductDetailPage;
