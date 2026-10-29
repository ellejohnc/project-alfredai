import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Users, TrendingUp, DollarSign, Rocket, 
  Building, Calculator, ArrowUpRight, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BookingChatModal from "@/components/BookingChatModal";
import PremiumCTASection from "@/components/sections/PremiumCTASection";
import SEO from "@/components/SEO";

const comparisonData = [
  { category: "Annual Cost", hiring: "$85,000", ai: "$12,000", savings: "$73,000" },
  { category: "Ramp-up Time", hiring: "3-6 months", ai: "2-4 weeks", savings: "4+ months" },
  { category: "Scalability", hiring: "Linear", ai: "Exponential", savings: "Unlimited" },
  { category: "Availability", hiring: "Business hours", ai: "24/7", savings: "3x coverage" },
  { category: "Consistency", hiring: "Variable", ai: "100%", savings: "Zero variance" },
];

const scalingScenarios = [
  {
    scenario: "Double Your Client Base",
    traditional: "Hire 4-5 additional staff ($340K-$425K/year)",
    withAI: "Deploy AI automation ($48K/year)",
    savings: "$292K-$377K annually",
  },
  {
    scenario: "Expand to New Markets",
    traditional: "Hire regional teams (6+ people, $510K+/year)",
    withAI: "AI handles coordination across locations ($36K/year)",
    savings: "$474K+ annually",
  },
  {
    scenario: "Add Service Lines",
    traditional: "Specialist hires (3-4 people, $255K-$340K/year)",
    withAI: "AI-augmented existing team ($24K/year)",
    savings: "$231K-$316K annually",
  },
];

const caseStudies = [
  {
    company: "Meridian Property Group",
    growth: "200 → 500 properties",
    multiplier: "2.5x",
    hiresAvoided: "4 admin positions",
    savings: "$320K/year",
    quote: "We scaled from 200 to 500 properties without hiring a single additional admin. alfred ai handles what would have required 3-4 new team members.",
    author: "Jane Smith, CEO",
  },
  {
    company: "Apex Consulting",
    growth: "12 → 18 clients per consultant",
    multiplier: "1.5x",
    hiresAvoided: "2 junior associates",
    savings: "$170K/year",
    quote: "Our senior consultants now handle 50% more clients without quality compromise. The AI handles research and admin that used to require junior staff.",
    author: "David Park, Managing Partner",
  },
  {
    company: "Coastal Properties",
    growth: "3 → 7 regional offices",
    multiplier: "2.3x",
    hiresAvoided: "8 coordination roles",
    savings: "$680K/year",
    quote: "We expanded from 3 to 7 offices without proportional hiring. AI coordinates across locations like we have a central ops team – but we don't.",
    author: "James Wilson, Managing Director",
  },
];

const ScaleWithoutHiringPage = () => {
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Scale Without Hiring" 
        description="Grow 2-3x without proportional headcount increases. See how organisations are breaking the traditional growth = hiring equation with alfred ai."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Impact Studies", url: "/impact-studies" },
          { name: "Scale Without Hiring", url: "/impact/scale-without-hiring" }
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
                Scale Without Hiring
              </h1>
              <p className="text-xl text-muted-foreground">
                Grow 2-3x without proportional headcount increases. See how organisations are breaking the traditional growth = hiring equation.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Key Stats */}
        <section className="py-12 bg-primary">
          <div className="container-wide">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-primary-foreground mb-2">2.5x</div>
                <div className="text-primary-foreground/70">Avg Scale Achieved</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary-foreground mb-2">$73K</div>
                <div className="text-primary-foreground/70">Saved Per Role</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary-foreground mb-2">608%</div>
                <div className="text-primary-foreground/70">First Year ROI</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary-foreground mb-2">4 weeks</div>
                <div className="text-primary-foreground/70">Time to Scale</div>
              </div>
            </div>
          </div>
        </section>

        {/* Hiring vs AI Comparison */}
        <section className="py-16 bg-background-alt">
          <div className="container-wide">
            <h2 className="text-2xl font-semibold text-foreground mb-2 text-center">
              Hiring vs. AI Automation
            </h2>
            <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
              A side-by-side comparison of scaling with traditional hiring versus AI automation
            </p>

            <div className="max-w-4xl mx-auto overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">Factor</th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-muted-foreground">Traditional Hiring</th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-primary">With alfred ai</th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-foreground">Advantage</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, index) => (
                    <motion.tr
                      key={row.category}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-b border-border"
                    >
                      <td className="py-4 px-4 font-medium text-foreground">{row.category}</td>
                      <td className="py-4 px-4 text-center text-muted-foreground">{row.hiring}</td>
                      <td className="py-4 px-4 text-center text-primary font-medium">{row.ai}</td>
                      <td className="py-4 px-4 text-center">
                        <Badge className="bg-primary/10 text-primary">{row.savings}</Badge>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Scaling Scenarios */}
        <section className="py-16 bg-background">
          <div className="container-wide">
            <h2 className="text-2xl font-semibold text-foreground mb-8 text-center">
              Common Scaling Scenarios
            </h2>

            <div className="grid lg:grid-cols-3 gap-6">
              {scalingScenarios.map((scenario, index) => (
                <motion.div
                  key={scenario.scenario}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-2xl border border-border p-6"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <Rocket className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-4">{scenario.scenario}</h3>
                  
                  <div className="space-y-4">
                    <div className="p-3 bg-destructive/10 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Traditional Approach</div>
                      <div className="text-sm text-foreground">{scenario.traditional}</div>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">With alfred ai</div>
                      <div className="text-sm text-primary font-medium">{scenario.withAI}</div>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <div className="text-xs text-muted-foreground mb-1">Your Savings</div>
                      <div className="text-lg font-bold text-primary">{scenario.savings}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Case Studies */}
        <section className="py-16 bg-background-alt">
          <div className="container-wide">
            <h2 className="text-2xl font-semibold text-foreground mb-8 text-center">
              Scaling Success Stories
            </h2>

            <div className="space-y-6">
              {caseStudies.map((study, index) => (
                <motion.div
                  key={study.company}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-2xl border border-border p-8"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-4">{study.company}</h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-sm text-muted-foreground">Growth</div>
                          <div className="font-semibold text-foreground">{study.growth}</div>
                        </div>
                        <div className="text-center p-3 bg-primary/10 rounded-lg">
                          <div className="text-sm text-muted-foreground">Scale</div>
                          <div className="font-bold text-primary">{study.multiplier}</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-sm text-muted-foreground">Hires Avoided</div>
                          <div className="font-semibold text-foreground">{study.hiresAvoided}</div>
                        </div>
                        <div className="text-center p-3 bg-primary/10 rounded-lg">
                          <div className="text-sm text-muted-foreground">Annual Savings</div>
                          <div className="font-bold text-primary">{study.savings}</div>
                        </div>
                      </div>

                      <blockquote className="border-l-2 border-primary pl-4">
                        <p className="text-foreground italic mb-2">"{study.quote}"</p>
                        <cite className="text-sm text-muted-foreground not-italic">— {study.author}</cite>
                      </blockquote>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* The Math */}
        <section className="py-16 bg-background">
          <div className="container-wide">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                The Simple Math
              </h2>
              
              <div className="bg-card rounded-2xl border border-border p-8">
                <div className="grid md:grid-cols-3 gap-8 items-center">
                  <div>
                    <div className="text-3xl font-bold text-muted-foreground">$85K</div>
                    <div className="text-sm text-muted-foreground">Cost per new hire</div>
                  </div>
                  <div className="text-4xl font-bold text-foreground">vs</div>
                  <div>
                    <div className="text-3xl font-bold text-primary">$12K</div>
                    <div className="text-sm text-muted-foreground">AI automation cost</div>
                  </div>
                </div>
                
                <div className="mt-8 pt-8 border-t border-border">
                  <div className="text-4xl font-bold text-primary mb-2">$73,000</div>
                  <div className="text-muted-foreground">Saved per role, per year</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <PremiumCTASection
          title="Ready to scale without the hiring challenges?"
          description="Book a conversation to see how much you could grow without proportional hiring."
          buttonText="Plan My Growth"
          onButtonClick={() => setIsCalendlyOpen(true)}
          variant="light"
        />
      </main>

      <Footer />
      <BookingChatModal isOpen={isCalendlyOpen} onClose={() => setIsCalendlyOpen(false)} />
    </div>
  );
};

export default ScaleWithoutHiringPage;
