import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Briefcase, MapPin, Clock, ArrowRight, Zap, TrendingUp, Users, Sparkles, Loader2, Send, CalendarDays } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useJobOpenings, JobOpening } from "@/hooks/useJobOpenings";
import { JobApplicationForm } from "@/components/careers/JobApplicationForm";
import { GeneralApplicationForm } from "@/components/careers/GeneralApplicationForm";
import HeroBackgroundSlideshow from "@/components/sections/HeroBackgroundSlideshow";
import { RoleHiringVideo, roleHasHiringVideo } from "@/components/careers/RoleHiringVideo";
import { RoleNewBadge, roleIsNew } from "@/components/careers/RoleNewBadge";
const benefits = [
  { icon: <Zap className="w-5 h-5" />, title: "Fast-growing", description: "Grow your impact quickly as the company scales" },
  { icon: <Sparkles className="w-5 h-5" />, title: "Ground-Breaking Tech", description: "Build agentic AI products the market doesn't have yet" },
  { icon: <TrendingUp className="w-5 h-5" />, title: "World-class tech capability", description: "Work with AI, automation and cloud at production scale" },
  { icon: <Users className="w-5 h-5" />, title: "Investor backed", description: "Supported by investors backing our long-term growth" },
  { icon: <Clock className="w-5 h-5" />, title: "Hybrid working", description: "A flexible mix of office and work from home" },
];

const CareersPage = () => {
  const { jobs, isLoading } = useJobOpenings();
  const heroRef = useRef(null);
  const benefitsRef = useRef(null);
  const openingsRef = useRef(null);
  const [selectedJob, setSelectedJob] = useState<JobOpening | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isGeneralApplyOpen, setIsGeneralApplyOpen] = useState(false);
  
  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });
  const benefitsInView = useInView(benefitsRef, { once: true, margin: "-100px" });
  const openingsInView = useInView(openingsRef, { once: true, margin: "-100px" });

  const handleApplyClick = (job: JobOpening, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // If job has external application URL, use that
    if (job.application_url) {
      window.open(job.application_url, '_blank', 'noopener,noreferrer');
    } else {
      // Otherwise open the internal application form
      setSelectedJob(job);
      setIsApplyModalOpen(true);
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Careers" 
        description="Join alfred ai and build the future of AI-powered work. View open positions and learn about our culture and benefits."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Company", url: "/company/about" },
          { name: "Careers", url: "/company/careers" }
        ]}
      />
      <Header />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section ref={heroRef} className="relative overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-background" />

          {/* Location photo slideshow behind the hero (white scrim keeps the dark headline readable) */}
          <HeroBackgroundSlideshow theme="light" />

          
          <div className="container-wide pt-14 pb-20 md:py-28 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              <motion.span 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={heroInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-background/80 backdrop-blur border border-border text-foreground rounded-full text-sm font-medium mb-5 md:mb-6"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-partner-pink" />
                Careers
              </motion.span>
              <h1 className="text-[2.25rem] sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 md:mb-6 leading-[1.1] tracking-tight text-balance">
                Build the{" "}
                <span className="text-muted-foreground">
                  Future of Work
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto text-balance">
                Join a team of exceptional people on a mission to help businesses scale with AI.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section ref={benefitsRef} className="py-20 bg-background-alt">
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={benefitsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <span className="section-label">Perks & Benefits</span>
              <h2 className="section-heading">Why Join alfred ai</h2>
            </motion.div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
              {benefits.map((benefit, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={benefitsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="relative bg-card rounded-2xl p-6 border border-border shadow-elevation-1 group"
                >
                  <div className="relative z-10">
                    <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center mb-4 text-foreground group-hover:scale-110 transition-transform">
                      {benefit.icon}
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section ref={openingsRef} className="py-20 md:py-28 bg-background">
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={openingsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <span className="section-label">Join the Team</span>
              <h2 className="section-heading">Open Positions</h2>
            </motion.div>
            
            <div className="max-w-4xl mx-auto space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">No open positions at the moment. Check back soon!</p>
                </div>
              ) : (
                jobs.map((job, index) => (
                  <motion.div 
                    key={job.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={openingsInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ x: 5, transition: { duration: 0.2 } }}
                    className="bg-card border border-border rounded-2xl p-6 hover:border-foreground/30 hover:shadow-elevation-2 transition-all cursor-pointer group"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground transition-colors flex flex-wrap items-center gap-2">
                          {job.title}
                          {roleIsNew(job.slug) && <RoleNewBadge />}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-3">{job.description}</p>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full">
                            <Briefcase className="w-3.5 h-3.5" />
                            {job.department}
                          </span>
                          <span className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full">
                            <MapPin className="w-3.5 h-3.5" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full">
                            <Clock className="w-3.5 h-3.5" />
                            {job.employment_type}
                          </span>
                          <span className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full">
                            <CalendarDays className="w-3.5 h-3.5" />
                            Start: Late Jan 2027
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => handleApplyClick(job, e)}
                        className="flex items-center gap-2 text-foreground font-medium text-sm min-h-[44px] min-w-[44px] justify-center md:justify-end hover:text-muted-foreground transition-colors"
                      >
                        <span className="hidden md:inline">Apply</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                    {(job.responsibilities || job.requirements) && (
                      <details className="mt-4 group/details" onClick={(e) => e.stopPropagation()}>
                        <summary className="cursor-pointer text-sm font-medium text-foreground min-h-[44px] flex items-center">
                          View full role
                        </summary>
                        <div className="grid gap-6 pt-2 md:grid-cols-3 text-sm text-muted-foreground">
                          <div className="md:col-span-2 grid gap-6 md:grid-cols-2">
                            {[["What you'll do", job.responsibilities], ["What you'll bring", job.requirements]].map(([label, text]) =>
                              text ? (
                                <div key={label}>
                                  <h4 className="font-semibold text-foreground mb-2">{label}</h4>
                                  <ul className="list-disc pl-5 space-y-1.5">
                                    {text.split("\n").filter(Boolean).map((line) => <li key={line}>{line}</li>)}
                                  </ul>
                                </div>
                              ) : null
                            )}
                          </div>
                          {roleHasHiringVideo(job.slug) && <RoleHiringVideo />}
                        </div>
                        <button
                          onClick={(e) => handleApplyClick(job, e)}
                          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-5 min-h-[44px] text-sm font-medium"
                        >
                          Apply for this role <ArrowRight className="w-4 h-4" />
                        </button>
                      </details>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-background">
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-3xl p-10 md:p-14 text-center max-w-4xl mx-auto"
            >
              <div className="absolute inset-0 bg-muted border border-border rounded-3xl" />
              
              <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Don't See a Fit?</h2>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                  We're always looking for exceptional talent. Send us your resume and tell us why you'd be a great addition.
                </p>
                <button
                  onClick={() => setIsGeneralApplyOpen(true)}
                  className="inline-flex items-center justify-center gap-2 bg-cta hover:bg-cta-hover text-cta-foreground px-8 py-3.5 rounded-full font-medium transition-all hover:shadow-elevation-2 group min-h-[44px]"
                >
                  <Send className="w-4 h-4" />
                  Get in Touch 
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Application Form Modal */}
      {selectedJob && (
        <JobApplicationForm
          job={selectedJob}
          open={isApplyModalOpen}
          onOpenChange={(open) => {
            setIsApplyModalOpen(open);
            if (!open) setSelectedJob(null);
          }}
        />
      )}

      {/* General Application Form Modal */}
      <GeneralApplicationForm
        open={isGeneralApplyOpen}
        onOpenChange={setIsGeneralApplyOpen}
      />
    </div>
  );
};

export default CareersPage;
