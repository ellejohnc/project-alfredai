import { useState } from "react";
import { motion } from "framer-motion";
import { 
  CheckSquare, AlertTriangle, Eye, Users, 
  Clock, Target, TrendingUp, Zap, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BookingChatModal from "@/components/BookingChatModal";
import PremiumCTASection from "@/components/sections/PremiumCTASection";
import SEO from "@/components/SEO";

const challenges = [
  { problem: "Tasks fall through cracks", icon: AlertTriangle, solution: "AI tracks every task with automated follow-ups" },
  { problem: "No visibility into progress", icon: Eye, solution: "Real-time dashboards show status at a glance" },
  { problem: "Accountability unclear", icon: Users, solution: "Clear ownership and automatic escalation" },
  { problem: "Slow decision-making", icon: Clock, solution: "AI surfaces exceptions for quick resolution" },
];

const metrics = [
  { label: "Task Completion Rate", before: "72%", after: "96%", improvement: "+33%" },
  { label: "Average Response Time", before: "48 hrs", after: "4 hrs", improvement: "-92%" },
  { label: "Project On-Time Delivery", before: "65%", after: "91%", improvement: "+40%" },
  { label: "Exception Resolution", before: "5 days", after: "8 hrs", improvement: "-93%" },
];

const features = [
  {
    icon: CheckSquare,
    title: "Automated Task Tracking",
    description: "Every commitment is tracked. AI sends reminders, escalates delays, and ensures nothing falls through the cracks.",
  },
  {
    icon: Eye,
    title: "Real-Time Visibility",
    description: "Dashboards show project status, team workload, and potential blockers at a glance. No more status meetings.",
  },
  {
    icon: Users,
    title: "Clear Accountability",
    description: "Every task has an owner. AI documents decisions, tracks handoffs, and maintains audit trails.",
  },
  {
    icon: Zap,
    title: "Exception Management",
    description: "AI handles routine decisions automatically. Exceptions are surfaced immediately for human judgment.",
  },
  {
    icon: Shield,
    title: "Risk Identification",
    description: "Pattern recognition identifies potential issues before they become problems. Proactive, not reactive.",
  },
  {
    icon: Target,
    title: "Goal Alignment",
    description: "Connect daily tasks to strategic objectives. Everyone understands how their work drives outcomes.",
  },
];

const caseStudies = [
  {
    company: "BuildRight Construction",
    challenge: "Project delays due to coordination failures between site teams, subcontractors, and office",
    solution: "Deployed alfred ai Business Operating System with automated task tracking and escalation",
    results: ["Project on-time delivery improved from 62% to 94%", "Coordination delays reduced by 78%", "Weekly status meetings eliminated"],
    quote: "We stopped having 'where did that fall through' conversations. The AI catches everything before it becomes a problem.",
    author: "Marcus Thompson, Operations Director",
  },
  {
    company: "Pinnacle Insurance",
    challenge: "Claims processing delays and inconsistent handling leading to customer complaints",
    solution: "Implemented AI-powered workflow automation with exception handling and SLA tracking",
    results: ["Claims processing time reduced by 65%", "Customer complaints down 45%", "First-call resolution improved to 82%"],
    quote: "Our team now handles complex cases while AI manages the routine. Accountability is crystal clear.",
    author: "Emma Rodriguez, Head of Operations",
  },
];

const ExecutionPage = () => {
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Improve Execution & Accountability" 
        description="Stop things from falling through the cracks. See how organisations achieve 96% task completion rates with AI-powered execution management."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Impact Studies", url: "/impact-studies" },
          { name: "Execution", url: "/impact/execution" }
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
                Improve Execution & Accountability
              </h1>
              <p className="text-xl text-muted-foreground">
                Stop things from falling through the cracks. See how organisations achieve 96% task completion rates with AI-powered execution management.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Key Stats */}
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
                  <div className="text-3xl font-bold text-primary-foreground mb-1">{metric.after}</div>
                  <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
                    {metric.improvement}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Problem/Solution */}
        <section className="py-16 bg-background-alt">
          <div className="container-wide">
            <h2 className="text-2xl font-semibold text-foreground mb-8 text-center">
              Common Execution Challenges – Solved
            </h2>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {challenges.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.problem}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card rounded-xl border border-border p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-destructive" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground mb-1">{item.problem}</h3>
                        <p className="text-sm text-muted-foreground">→ {item.solution}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 bg-background">
          <div className="container-wide">
            <h2 className="text-2xl font-semibold text-foreground mb-2 text-center">
              Execution Management Capabilities
            </h2>
            <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
              A complete system for ensuring work gets done right, on time, every time
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card rounded-xl border border-border p-6 hover:shadow-lg hover:border-primary/20 transition-all"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Case Studies */}
        <section className="py-16 bg-background-alt">
          <div className="container-wide">
            <h2 className="text-2xl font-semibold text-foreground mb-8 text-center">
              Execution Transformation Stories
            </h2>

            <div className="space-y-8 max-w-4xl mx-auto">
              {caseStudies.map((study, index) => (
                <motion.div
                  key={study.company}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-2xl border border-border overflow-hidden"
                >
                  <div className="p-8">
                    <h3 className="text-xl font-semibold text-foreground mb-4">{study.company}</h3>
                    
                    <div className="grid md:grid-cols-3 gap-6 mb-6">
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">Challenge</h4>
                        <p className="text-sm text-muted-foreground">{study.challenge}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">Solution</h4>
                        <p className="text-sm text-muted-foreground">{study.solution}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">Results</h4>
                        <ul className="space-y-1">
                          {study.results.map((result, i) => (
                            <li key={i} className="text-sm text-primary flex items-start gap-1">
                              <CheckSquare className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              {result}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <blockquote className="border-l-2 border-primary pl-4">
                      <p className="text-foreground italic mb-2">"{study.quote}"</p>
                      <cite className="text-sm text-muted-foreground not-italic">— {study.author}</cite>
                    </blockquote>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <PremiumCTASection
          title="Ready to transform your execution?"
          description="Book a conversation to see how alfred ai can bring accountability and visibility to your operations."
          buttonText="Improve Our Execution"
          onButtonClick={() => setIsCalendlyOpen(true)}
          variant="light"
        />
      </main>

      <Footer />
      <BookingChatModal isOpen={isCalendlyOpen} onClose={() => setIsCalendlyOpen(false)} />
    </div>
  );
};

export default ExecutionPage;
