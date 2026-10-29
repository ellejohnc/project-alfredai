import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Download, Mail, ExternalLink, ArrowRight, Newspaper, Sparkles } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import { CONTACT_INFO } from "@/lib/contactInfo";
import { ComingSoonPage } from "@/components/ui/ComingSoonPage";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";

const pressReleases = [
  {
    date: "December 2024",
    title: "alfred ai Launches Voice AI Agents for Mid-Market Firms",
    description: "New voice capabilities enable 24/7 automated customer interactions.",
  },
  {
    date: "November 2024",
    title: "alfred ai Raises Series A to Scale AI Operating Platform",
    description: "Funding will accelerate product development and market expansion.",
  },
  {
    date: "October 2024",
    title: "alfred ai Partners with Leading Professional Services Firms",
    description: "Strategic partnerships bring AI-powered execution to the professional services industry.",
  },
];

const mediaFeatures = [
  { outlet: "TechCrunch", title: "The Rise of AI Operating Systems for Mid-Market" },
  { outlet: "Forbes", title: "How AI is Transforming Professional Services" },
  { outlet: "VentureBeat", title: "alfred ai: Beyond Automation to Autonomous Execution" },
];

const PressPage = () => {
  const heroRef = useRef(null);
  const releasesRef = useRef(null);
  const featuresRef = useRef(null);
  
  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });
  const releasesInView = useInView(releasesRef, { once: true, margin: "-100px" });
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });
  
  const { isEnabled: showComingSoon, isLoading: flagLoading } = useFeatureFlag("press_coming_soon");

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <SEO 
        title="Press & Media" 
        description="Get the latest news, press releases, and media resources about alfred ai. Contact us for interviews and media inquiries."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Company", url: "/company/about" },
          { name: "Press", url: "/company/press" }
        ]}
      />
      <Header />
      
      {showComingSoon ? (
        <main className="pt-24 flex-1">
          <ComingSoonPage
            title="Press & Media"
            message="Coming Soon..."
            description="We're preparing our press resources, media kit, and latest news. Sign up to be notified when we launch!"
            icon={Newspaper}
            showEmailSignup
            signupSource="press"
            signupPrompt="Get notified when our press resources launch"
            notifySales
            featureName="Press & Media"
            backLink="/company/about"
            backLinkLabel="Back to About"
          />
        </main>
      ) : (
        <main className="pt-24 pb-16 flex-1">
        {/* Hero Section */}
        <section ref={heroRef} className="relative overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-background to-primary/5" />
          <div className="absolute top-0 right-1/3 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          
          <div className="container-wide py-20 md:py-28 relative z-10">
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 text-violet-500 rounded-full text-sm font-medium mb-6"
              >
                <Newspaper className="w-4 h-4" />
                Press & Media
              </motion.span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                alfred ai in the{" "}
                <span className="text-gradient bg-gradient-to-r from-violet-500 via-primary to-primary bg-clip-text text-transparent">
                  News
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Get the latest news, press releases, and media resources about alfred ai.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Press Contact */}
        <section className="py-8">
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="glassmorphism-card rounded-2xl p-8 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6"
            >
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">Media Inquiries</h2>
                <p className="text-muted-foreground">For press inquiries, interviews, or media resources:</p>
              </div>
              <a 
                href={`mailto:${CONTACT_INFO.email.press}`}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 group"
              >
                <Mail className="w-4 h-4" />
                {CONTACT_INFO.email.press}
              </a>
            </motion.div>
          </div>
        </section>

        {/* Press Releases */}
        <section ref={releasesRef} className="py-20 bg-background">
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={releasesInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <span className="section-label">Latest Updates</span>
              <h2 className="section-heading">Press Releases</h2>
            </motion.div>
            
            <div className="max-w-4xl mx-auto space-y-4">
              {pressReleases.map((release, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={releasesInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ x: 5, transition: { duration: 0.2 } }}
                  className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                      <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-3">
                        {release.date}
                      </span>
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        {release.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mt-2">{release.description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Media Features */}
        <section ref={featuresRef} className="py-20 bg-background-alt">
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <span className="section-label">Media Coverage</span>
              <h2 className="section-heading">Featured In</h2>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {mediaFeatures.map((feature, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer group"
                >
                  <span className="inline-block px-3 py-1 bg-secondary/10 text-secondary text-sm font-medium rounded-full mb-3">
                    {feature.outlet}
                  </span>
                  <h3 className="text-foreground font-medium group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-4 text-primary text-sm font-medium">
                    Read Article
                    <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Brand Assets */}
        <section className="py-20 bg-background">
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-3xl p-10 md:p-14 text-center max-w-3xl mx-auto"
            >
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-primary/5 to-secondary/10" />
              <div className="absolute inset-0 backdrop-blur-sm" />
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/20 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Brand Assets</h2>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                  Download our logo, brand guidelines, and other media assets for use in publications.
                </p>
                <button className="inline-flex items-center justify-center gap-2 bg-card border border-border text-foreground px-6 py-3 rounded-full font-medium hover:bg-accent hover:border-primary/30 transition-all group">
                  <Download className="w-4 h-4" />
                  Download Press Kit
                </button>
              </div>
            </motion.div>
          </div>
        </section>
        </main>
      )}

      <Footer />
    </div>
  );
};

export default PressPage;
