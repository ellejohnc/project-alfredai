import { useState } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, DollarSign, Users, Clock, 
  Target, Briefcase, ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BookingChatModal from "@/components/BookingChatModal";
import PremiumCTASection from "@/components/sections/PremiumCTASection";
import SEO from "@/components/SEO";

const metrics = [
  { label: "Billable Hours", before: "65%", after: "82%", change: "+26%" },
  { label: "Client Capacity", before: "12 clients", after: "18 clients", change: "+50%" },
  { label: "Revenue Per Head", before: "$95K", after: "$142K", change: "+49%" },
  { label: "Proposal Win Rate", before: "28%", after: "41%", change: "+46%" },
];

const strategies = [
  {
    icon: Clock,
    title: "Reclaim Non-Billable Time",
    description: "Administrative tasks consume 35% of professional time. AI automation reclaims this for billable work.",
    impact: "+17% billable ratio",
  },
  {
    icon: Target,
    title: "Faster Project Delivery",
    description: "Reduce project turnaround from weeks to days. Handle more clients without quality compromise.",
    impact: "2x project velocity",
  },
  {
    icon: Briefcase,
    title: "Expand Service Capacity",
    description: "AI handles research, documentation, and client communication. Your team focuses on high-value advisory.",
    impact: "+50% client capacity",
  },
  {
    icon: DollarSign,
    title: "Premium Pricing Power",
    description: "Faster delivery and better outcomes justify premium pricing. Clients pay for results, not hours.",
    impact: "+15% effective rate",
  },
];

const caseStudies = [
  {
    company: "Apex Consulting",
    industry: "Management Consulting",
    beforeRevenue: "$95K/head",
    afterRevenue: "$142K/head",
    improvement: "+49%",
    quote: "Our senior consultants went from 65% billable to 82% billable. That's $450K in additional annual revenue from the same team.",
    author: "David Park, Managing Partner",
  },
  {
    company: "Sterling Legal",
    industry: "Legal Services",
    beforeRevenue: "$180K/head",
    afterRevenue: "$258K/head",
    improvement: "+43%",
    quote: "Document review and research that took days now takes hours. Our associates can handle 40% more matters.",
    author: "Jennifer Wu, Senior Partner",
  },
  {
    company: "Nexus Accounting",
    industry: "Accounting",
    beforeRevenue: "$120K/head",
    afterRevenue: "$168K/head",
    improvement: "+40%",
    quote: "Tax season used to mean 80-hour weeks. Now we handle the same volume in normal hours with better accuracy.",
    author: "Michael Chen, Director",
  },
];

const RevenuePerHeadPage = () => {
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Increase Revenue Per Head" 
        description="Transform your team's productivity. See how professional services firms are achieving 40-50% increases in revenue per employee with alfred ai."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Impact Studies", url: "/impact-studies" },
          { name: "Revenue Per Head", url: "/impact/revenue-per-head" }
        ]}
      />
      <Header />
      
      <main>
        {/* Hero */}
        <section className="pt-32 pb-12 md:pt-40 md:pb-16 bg-background relative overflow-hidden">
          {/* Premium gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent pointer-events-none" />
          <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="container-wide relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <Badge className="bg-primary mb-4">Outcome</Badge>
              <h1 className="text-4xl md:text-5xl font-semibold text-foreground mb-4 leading-tight">
                Increase Revenue Per Head
              </h1>
              <p className="text-xl text-muted-foreground">
                Transform your team's productivity. See how professional services firms are achieving 40-50% increases in revenue per employee.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Key Metrics */}
        <section className="py-12 bg-primary">
          <div className="container-wide">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {metrics.map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-sm text-primary-foreground/70 mb-2">{metric.label}</div>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-lg text-primary-foreground/60 line-through">{metric.before}</span>
                    <ArrowUpRight className="w-4 h-4 text-primary-foreground" />
                    <span className="text-2xl font-bold text-primary-foreground">{metric.after}</span>
                  </div>
                  <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
                    {metric.change}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Revenue Strategies */}
        <section className="py-16 bg-background-alt">
          <div className="container-wide">
            <h2 className="text-2xl font-semibold text-foreground mb-2 text-center">
              Four Levers for Revenue Growth
            </h2>
            <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
              alfred ai doesn't just save time – it creates capacity for revenue-generating activities
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {strategies.map((strategy, index) => {
                const Icon = strategy.icon;
                return (
                  <motion.div
                    key={strategy.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:border-primary/20 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">{strategy.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{strategy.description}</p>
                        <Badge className="bg-primary/10 text-primary">{strategy.impact}</Badge>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Before/After Visualization */}
        <section className="py-16 bg-background">
          <div className="container-wide">
            <h2 className="text-2xl font-semibold text-foreground mb-8 text-center">
              The Revenue Per Head Transformation
            </h2>

            <div className="max-w-3xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Before */}
                <div className="bg-muted/50 rounded-2xl p-6">
                  <h3 className="font-semibold text-foreground mb-4 text-center">Before alfred ai</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Billable Time</span>
                      <span className="font-medium text-foreground">65%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div className="bg-muted-foreground/50 h-3 rounded-full" style={{ width: "65%" }} />
                    </div>
                    <div className="flex justify-between text-sm pt-2">
                      <span className="text-muted-foreground">Admin Time</span>
                      <span className="font-medium text-foreground">35%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div className="bg-destructive/50 h-3 rounded-full" style={{ width: "35%" }} />
                    </div>
                    <div className="pt-4 text-center">
                      <div className="text-3xl font-bold text-foreground">$95K</div>
                      <div className="text-sm text-muted-foreground">Revenue per head</div>
                    </div>
                  </div>
                </div>

                {/* After */}
                <div className="bg-primary/10 rounded-2xl p-6 border-2 border-primary/20">
                  <h3 className="font-semibold text-foreground mb-4 text-center">After alfred ai</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Billable Time</span>
                      <span className="font-medium text-primary">82%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div className="bg-primary h-3 rounded-full" style={{ width: "82%" }} />
                    </div>
                    <div className="flex justify-between text-sm pt-2">
                      <span className="text-muted-foreground">Admin Time</span>
                      <span className="font-medium text-foreground">18%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div className="bg-muted-foreground/30 h-3 rounded-full" style={{ width: "18%" }} />
                    </div>
                    <div className="pt-4 text-center">
                      <div className="text-3xl font-bold text-primary">$142K</div>
                      <div className="text-sm text-muted-foreground">Revenue per head (+49%)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Case Studies */}
        <section className="py-16 bg-background-alt">
          <div className="container-wide">
            <h2 className="text-2xl font-semibold text-foreground mb-8 text-center">
              Professional Services Success Stories
            </h2>

            <div className="grid lg:grid-cols-3 gap-6">
              {caseStudies.map((study, index) => (
                <motion.div
                  key={study.company}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-2xl border border-border p-6"
                >
                  <Badge variant="secondary" className="mb-4">{study.industry}</Badge>
                  <h3 className="font-semibold text-foreground mb-4">{study.company}</h3>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg text-muted-foreground line-through">{study.beforeRevenue}</span>
                    <ArrowUpRight className="w-4 h-4 text-primary" />
                    <span className="text-2xl font-bold text-primary">{study.afterRevenue}</span>
                    <Badge className="bg-primary ml-auto">{study.improvement}</Badge>
                  </div>

                  <blockquote className="text-sm text-muted-foreground italic mb-4">
                    "{study.quote}"
                  </blockquote>
                  <cite className="text-xs text-foreground not-italic">— {study.author}</cite>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <PremiumCTASection
          title="Ready to increase your revenue per head?"
          description="Book a conversation to see how much additional revenue your team could generate with alfred ai."
          buttonText="Calculate My Revenue Potential"
          onButtonClick={() => setIsCalendlyOpen(true)}
          variant="light"
        />
      </main>

      <Footer />
      <BookingChatModal isOpen={isCalendlyOpen} onClose={() => setIsCalendlyOpen(false)} />
    </div>
  );
};

export default RevenuePerHeadPage;
