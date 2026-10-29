import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Users, Target, Heart, Award, ArrowRight, Globe, Sparkles } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { CONTACT_INFO } from "@/lib/contactInfo";

const values = [
  {
    icon: <Target className="w-6 h-6" />,
    title: "Outcome-Obsessed",
    description: "We measure success by the impact we create for our customers, not features shipped.",
    gradient: "from-primary/20 to-primary/5",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Human-Centered AI",
    description: "AI should amplify human potential, not replace human judgment.",
    gradient: "from-secondary/20 to-secondary/5",
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: "Radical Transparency",
    description: "We believe in showing our work—both successes and learnings.",
    gradient: "from-violet-500/20 to-violet-500/5",
  },
  {
    icon: <Award className="w-6 h-6" />,
    title: "Execution Excellence",
    description: "We practice what we preach—shipping fast with accountability.",
    gradient: "from-amber-500/20 to-amber-500/5",
  },
];

const team = [
  { name: "Leadership Team", count: "5", description: "Industry veterans from operations, AI, and enterprise software" },
  { name: "Engineering", count: "15+", description: "AI/ML specialists building the future of work" },
  { name: "Customer Success", count: "10+", description: "Dedicated to making every customer wildly successful" },
];

const AboutPage = () => {
  const heroRef = useRef(null);
  const missionRef = useRef(null);
  const valuesRef = useRef(null);
  const teamRef = useRef(null);
  const globalRef = useRef(null);
  
  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });
  const missionInView = useInView(missionRef, { once: true, margin: "-100px" });
  const valuesInView = useInView(valuesRef, { once: true, margin: "-100px" });
  const teamInView = useInView(teamRef, { once: true, margin: "-100px" });
  const globalInView = useInView(globalRef, { once: true, margin: "-100px" });

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="About Us" 
        description="Learn about alfred ai's mission to help mid-market firms scale operations with AI. Meet our team and discover our values."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Company", url: "/company/about" },
          { name: "About", url: "/company/about" }
        ]}
      />
      <Header />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section ref={heroRef} className="relative overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
          
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-full text-sm font-medium mb-6"
              >
                <Sparkles className="w-4 h-4" />
                About Us
              </motion.span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Building the AI Operating Layer for{" "}
                <span className="text-gradient bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                  Business
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                We're on a mission to help mid-market firms scale their operations without scaling their headcount.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Mission Section */}
        <section ref={missionRef} className="relative py-20 bg-background-alt">
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={missionInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto"
            >
              <div className="glassmorphism-card rounded-3xl p-8 md:p-12 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Our Mission</h2>
                <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                  <p>
                    Mid-market firms ($10M-$300M revenue) are caught between enterprise complexity and startup chaos. 
                    They have the processes and expertise of larger organizations but lack the resources to execute at scale.
                  </p>
                  <p>
                    We believe AI should bridge this gap—not by adding another tool to manage, but by creating an 
                    intelligent operating layer that executes work autonomously while keeping humans in control.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Values Section */}
        <section ref={valuesRef} className="py-20 md:py-28 bg-background">
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={valuesInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <span className="section-label">What We Stand For</span>
              <h2 className="section-heading">Our Values</h2>
            </motion.div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={valuesInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className={`relative bg-gradient-to-br ${value.gradient} rounded-2xl p-6 border border-border/50 backdrop-blur-sm group`}
                >
                  <div className="absolute inset-0 rounded-2xl bg-card/80 backdrop-blur-sm" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                      {value.icon}
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section ref={teamRef} className="py-20 bg-background-alt">
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={teamInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <span className="section-label">The People</span>
              <h2 className="section-heading">Our Team</h2>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {team.map((group, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={teamInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center p-6"
                >
                  <div className="text-5xl font-bold text-gradient bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-3">
                    {group.count}
                  </div>
                  <h3 className="font-semibold text-foreground text-lg mb-2">{group.name}</h3>
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Global Presence Section */}
        <section ref={globalRef} className="py-20 md:py-28 bg-background">
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={globalInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Globe className="w-7 h-7 text-primary" />
              </div>
              <span className="section-label">Worldwide Reach</span>
              <h2 className="section-heading">Global Presence</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Delivering AI-powered operations across key markets worldwide
              </p>
            </motion.div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 max-w-5xl mx-auto">
              {CONTACT_INFO.serviceRegions.map((region, index) => (
                <motion.div
                  key={region.code}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={globalInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -3 }}
                  className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-default"
                >
                  <span className="text-2xl font-bold text-gradient bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent block mb-1">
                    {region.code}
                  </span>
                  <span className="text-sm text-muted-foreground">{region.name}</span>
                </motion.div>
              ))}
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
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10" />
              <div className="absolute inset-0 backdrop-blur-sm" />
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/20 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Join Our Journey</h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                  We're building something special and looking for exceptional people to join us.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/careers"
                    className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 group"
                  >
                    View Open Positions 
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center gap-2 bg-card border border-border text-foreground px-6 py-3 rounded-full font-medium hover:bg-accent hover:border-primary/30 transition-all"
                  >
                    Get in Touch
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
