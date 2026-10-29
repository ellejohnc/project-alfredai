import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Lightbulb, Cog, Shield, Users, Building, Mail, Sparkles, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";

const sections = [
  {
    href: "/explained/what-is-alfred",
    title: "What Is alfred ai",
    description: "Discover how alfred ai transforms business operations with intelligent automation",
    icon: Lightbulb,
    gradient: "from-amber-500/20 to-amber-500/5",
  },
  {
    href: "/explained/how-it-works",
    title: "How alfred ai Works",
    description: "Learn about the technology and processes behind our AI platform",
    icon: Cog,
    gradient: "from-primary/20 to-primary/5",
  },
  {
    href: "/explained/architecture",
    title: "Platform Architecture",
    description: "Explore the technical foundation of the alfred ai ecosystem",
    icon: Building,
    gradient: "from-violet-500/20 to-violet-500/5",
  },
  {
    href: "/explained/security",
    title: "Security & Compliance",
    description: "Enterprise-grade security and compliance certifications",
    icon: Shield,
    gradient: "from-secondary/20 to-secondary/5",
  },
  {
    href: "/explained/techpartners",
    title: "Tech Partners",
    description: "Our technology partners and integration ecosystem",
    icon: Users,
    gradient: "from-blue-500/20 to-blue-500/5",
  },
  {
    href: "/explained/about",
    title: "Our Story",
    description: "Meet the team building the future of business AI",
    icon: Users,
    gradient: "from-rose-500/20 to-rose-500/5",
  },
  {
    href: "/explained/contact",
    title: "Contact",
    description: "Get in touch with our team",
    icon: Mail,
    gradient: "from-emerald-500/20 to-emerald-500/5",
  },
];

const Explained = () => {
  const heroRef = useRef(null);
  const gridRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });
  const gridInView = useInView(gridRef, { once: true, margin: "-100px" });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="alfred ai Explained: Agentic AI for Construction"
        description="Plain-English explainers on how alfred ai's agentic AI works, what it does for construction and contracting teams, and how it is delivered as a done-for-you service."
        path="/explained"
        breadcrumbs={[{ name: "Home", url: "/" }, { name: "Explained", url: "/explained" }]}
      />
      <Header />
      
      <main>
        {/* Hero */}
        <section ref={heroRef} className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-violet-500/5" />
          <div className="absolute top-0 right-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
          
          <div className="container-wide relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              <motion.span 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={heroInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-full text-sm font-medium mb-6"
              >
                <BookOpen className="w-4 h-4" />
                Learn More
              </motion.span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground mb-6 leading-tight">
                alfred ai{" "}
                <span className="text-gradient bg-gradient-to-r from-primary via-violet-500 to-secondary bg-clip-text text-transparent">
                  Explained
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Everything you need to know about alfred ai – from our technology to our team.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Sections Grid */}
        <section ref={gridRef} className="py-16 bg-background-alt">
          <div className="container-wide">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sections.map((section, index) => (
                <motion.div
                  key={section.href}
                  initial={{ opacity: 0, y: 30 }}
                  animate={gridInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <Link
                    to={section.href}
                    className={`relative flex flex-col bg-gradient-to-br ${section.gradient} rounded-2xl border border-border/50 p-6 hover:shadow-lg hover:border-primary/30 transition-all group h-full overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-card/80 backdrop-blur-sm" />
                    <div className="relative z-10">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <section.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {section.title}
                      </h3>
                      <p className="text-sm text-muted-foreground flex-1">
                        {section.description}
                      </p>
                      <div className="flex items-center gap-2 mt-4 text-primary text-sm font-medium">
                        Read {section.title}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Explained;
