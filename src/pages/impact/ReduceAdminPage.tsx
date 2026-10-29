import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Clock, FileText, Mail, Calendar, 
  Database, Search, CheckCircle, TrendingDown, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BookingChatModal from "@/components/BookingChatModal";
import PremiumCTASection from "@/components/sections/PremiumCTASection";
import SEO from "@/components/SEO";

const adminTasks = [
  { task: "Document Processing", before: "8 hrs/week", after: "2 hrs/week", savings: "75%", icon: FileText },
  { task: "Email Management", before: "6 hrs/week", after: "1.5 hrs/week", savings: "75%", icon: Mail },
  { task: "Scheduling & Coordination", before: "5 hrs/week", after: "1 hr/week", savings: "80%", icon: Calendar },
  { task: "Data Entry & Updates", before: "7 hrs/week", after: "1 hr/week", savings: "86%", icon: Database },
  { task: "Information Retrieval", before: "4 hrs/week", after: "0.5 hrs/week", savings: "88%", icon: Search },
  { task: "Status Reporting", before: "3 hrs/week", after: "0.5 hrs/week", savings: "83%", icon: CheckCircle },
];

const caseStudies = [
  {
    company: "BuildRight Construction",
    industry: "Construction",
    adminReduction: "65%",
    timeSaved: "22 hrs/week",
    quote: "Our project managers were spending more time on paperwork than on actual project management. Now they can focus on what matters.",
    author: "Marcus Thompson, Operations Director",
  },
  {
    company: "Meridian Property Group",
    industry: "Property",
    adminReduction: "70%",
    timeSaved: "28 hrs/week",
    quote: "Tenant communications, maintenance coordination, invoice processing – all automated. Our team now handles 2.5x the portfolio.",
    author: "Jane Smith, CEO",
  },
  {
    company: "Apex Consulting",
    industry: "Consulting",
    adminReduction: "60%",
    timeSaved: "15 hrs/week",
    quote: "Senior consultants went from 65% billable to 82% billable. The admin reduction directly translates to revenue.",
    author: "David Park, Managing Partner",
  },
];

const ReduceAdminPage = () => {
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Reduce Admin Load by 70%" 
        description="Reclaim time from administrative tasks. See how organisations are gaining 20+ hours per week through intelligent automation with alfred ai."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Impact Studies", url: "/impact-studies" },
          { name: "Reduce Admin", url: "/impact/reduce-admin" }
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
                Reduce Admin Load by 70%
              </h1>
              <p className="text-xl text-muted-foreground">
                Reclaim time from administrative tasks. See how organisations are gaining 20+ hours per week through intelligent automation.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Key Stats */}
        <section className="py-12 bg-primary">
          <div className="container-wide">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-primary-foreground mb-2">70%</div>
                <div className="text-primary-foreground/70">Avg Admin Reduction</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary-foreground mb-2">22 hrs</div>
                <div className="text-primary-foreground/70">Saved Per Week</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary-foreground mb-2">$126K</div>
                <div className="text-primary-foreground/70">Annual Savings</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary-foreground mb-2">60 days</div>
                <div className="text-primary-foreground/70">Avg Payback</div>
              </div>
            </div>
          </div>
        </section>

        {/* Task Breakdown */}
        <section className="py-16 bg-background-alt">
          <div className="container-wide">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-semibold text-foreground mb-2 text-center">
                Where Does Admin Time Go?
              </h2>
              <p className="text-muted-foreground text-center mb-8">
                A breakdown of common administrative tasks and the automation potential with alfred ai
              </p>

              <div className="space-y-4">
                {adminTasks.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.task}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-card rounded-xl border border-border p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{item.task}</div>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-muted-foreground">Before: {item.before}</span>
                            <span className="text-sm text-muted-foreground">→</span>
                            <span className="text-sm text-foreground">After: {item.after}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary flex items-center gap-1">
                            <TrendingDown className="w-4 h-4" />
                            {item.savings}
                          </div>
                          <div className="text-xs text-muted-foreground">reduction</div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-8 p-6 bg-primary/10 rounded-2xl text-center">
                <div className="text-3xl font-bold text-primary mb-2">33 hrs/week → 6.5 hrs/week</div>
                <div className="text-muted-foreground">Total admin time reduction across all tasks</div>
              </div>
            </div>
          </div>
        </section>

        {/* Case Studies */}
        <section className="py-16 bg-background">
          <div className="container-wide">
            <h2 className="text-2xl font-semibold text-foreground mb-8 text-center">
              Real Results from Real Organisations
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
                  <h3 className="font-semibold text-foreground mb-2">{study.company}</h3>
                  
                  <div className="flex gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{study.adminReduction}</div>
                      <div className="text-xs text-muted-foreground">Admin Reduction</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{study.timeSaved}</div>
                      <div className="text-xs text-muted-foreground">Time Saved</div>
                    </div>
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

        {/* How It Works */}
        <section className="py-16 bg-background-alt">
          <div className="container-wide">
            <h2 className="text-2xl font-semibold text-foreground mb-8 text-center">
              How alfred ai Reduces Admin
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { step: "1", title: "Audit", desc: "We map your current admin workflows and identify automation opportunities" },
                { step: "2", title: "Connect", desc: "alfred ai integrates with your existing systems – no migration required" },
                { step: "3", title: "Automate", desc: "AI handles routine tasks while flagging exceptions for human review" },
                { step: "4", title: "Optimize", desc: "Continuous learning improves automation over time" },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground text-xl font-bold flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <PremiumCTASection
          title="Ready to reclaim your team's time?"
          description="Book a conversation to see exactly how much admin time you could save with alfred ai."
          buttonText="Calculate My Savings"
          onButtonClick={() => setIsCalendlyOpen(true)}
          variant="light"
        />
      </main>

      <Footer />
      <BookingChatModal isOpen={isCalendlyOpen} onClose={() => setIsCalendlyOpen(false)} />
    </div>
  );
};

export default ReduceAdminPage;
