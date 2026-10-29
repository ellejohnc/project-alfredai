import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Sparkles, Layers } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";

const comparisons = [
  {
    slug: "vs-monday",
    name: "Monday.com",
    tagline: "Different problems, different solutions",
    description: "Monday.com organizes work visually. alfred ai operates autonomously—executing tasks, adapting to your industry, and deploying on your infrastructure.",
    gradient: "from-primary/20 to-primary/5",
  },
  {
    slug: "vs-notion",
    name: "Notion",
    tagline: "Documentation meets autonomous execution",
    description: "Notion captures and organizes knowledge. alfred ai puts knowledge to work with industry-specific automation and private deployment.",
    gradient: "from-secondary/20 to-secondary/5",
  },
  {
    slug: "vs-asana",
    name: "Asana",
    tagline: "Complex tracking vs. mission-focused execution",
    description: "Asana coordinates large teams. alfred ai is purpose-built for $10M-$300M organizations—right-sized AI with private cloud options.",
    gradient: "from-violet-500/20 to-violet-500/5",
  },
  {
    slug: "vs-clickup",
    name: "ClickUp",
    tagline: "Feature variety vs. focused intelligence",
    description: "ClickUp offers every feature imaginable. alfred ai delivers industry-specific automation with ongoing AI maintenance.",
    gradient: "from-amber-500/20 to-amber-500/5",
  },
  {
    slug: "vs-zapier",
    name: "Zapier",
    tagline: "Simple triggers vs. intelligent automation",
    description: "Zapier connects apps with if-then logic. alfred ai reasons through complexity with industry context and private deployment.",
    gradient: "from-blue-500/20 to-blue-500/5",
  },
  {
    slug: "vs-make",
    name: "Make (Integromat)",
    tagline: "Visual building vs. ready-to-use intelligence",
    description: "Make requires technical expertise to build. alfred ai delivers industry automation without the learning curve.",
    gradient: "from-rose-500/20 to-rose-500/5",
  },
  {
    slug: "vs-n8n",
    name: "n8n",
    tagline: "Self-hosted workflows vs. managed AI automation",
    description: "n8n gives technical teams powerful self-hosted workflow automation. alfred ai delivers ready-to-use industry solutions with ongoing maintenance.",
    gradient: "from-emerald-500/20 to-emerald-500/5",
  },
  {

    slug: "vs-pipedrive",
    name: "Pipedrive",
    tagline: "Sales CRM vs. full business automation",
    description: "Pipedrive excels at visual sales pipeline management. alfred ai automates entire business operations across all departments.",
    gradient: "from-cyan-500/20 to-cyan-500/5",
  },
  {
    slug: "vs-gohighlevel",
    name: "GoHighLevel",
    tagline: "Agency platform vs. mid-market automation",
    description: "GoHighLevel is built for marketing agencies. alfred ai serves mid-market professional services with industry-specific AI.",
    gradient: "from-orange-500/20 to-orange-500/5",
  },
  {
    slug: "vs-procore",
    name: "Procore",
    tagline: "Enterprise construction vs. mid-market AI",
    description: "Procore dominates enterprise construction management. alfred ai brings AI-powered automation to mid-market builders without enterprise complexity.",
    gradient: "from-yellow-500/20 to-yellow-500/5",
  },
  {
    slug: "vs-procurepro",
    name: "ProcurePro",
    tagline: "Procurement control vs. end-to-end agentic execution",
    description: "ProcurePro centralises subcontractor procurement. alfred ai extends agentic AI across estimating, RFIs, compliance and the whole construction lifecycle.",
    gradient: "from-teal-500/20 to-teal-500/5",
  },
  {
    slug: "vs-construction-enterprise",
    name: "Trimble e-Builder & Aconex",
    tagline: "Capital programs vs. agile execution",
    description: "Enterprise construction suites for $100M+ programs. alfred ai delivers AI automation for growing contractors at mid-market scale.",
    gradient: "from-slate-500/20 to-slate-500/5",
  },
  {
    slug: "vs-construction-builders",
    name: "BuildTools & ProjectSimpel",
    tagline: "Builder tools vs. AI operating layer",
    description: "Purpose-built for custom home builders. alfred ai adds an AI intelligence layer that works with your existing construction systems.",
    gradient: "from-lime-500/20 to-lime-500/5",
  },
  {
    slug: "vs-buildpass",
    name: "Buildpass",
    tagline: "AI site management vs. the AI operating layer",
    description: "Buildpass brings AI to on-site management and compliance for mid-market builders. alfred ai runs your whole operation—estimating, RFIs, procurement, compliance—on the systems you already use.",
    gradient: "from-sky-500/20 to-sky-500/5",
  },
  {
    slug: "vs-jobber",
    name: "Jobber",
    tagline: "Field service vs. construction AI",
    description: "Jobber excels at residential trades scheduling. alfred ai extends AI automation to commercial construction and larger operations.",
    gradient: "from-indigo-500/20 to-indigo-500/5",
  },
  {
    slug: "vs-chatgpt",
    name: "ChatGPT",
    tagline: "General-purpose chatbot vs. autonomous automation",
    description: "ChatGPT answers prompts one at a time. alfred ai deploys autonomous, industry-specific agents that execute end-to-end workflows on your infrastructure.",
    gradient: "from-green-500/20 to-green-500/5",
  },
  {
    slug: "vs-claude",
    name: "Claude",
    tagline: "General-purpose assistant vs. autonomous automation",
    description: "Claude excels at reasoning and writing. alfred ai runs autonomous agents that complete business workflows with private deployment and industry intelligence.",
    gradient: "from-orange-500/20 to-orange-500/5",
  },
];

const ComparePage = () => {
  const heroRef = useRef(null);
  const cardsRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });
  const cardsInView = useInView(cardsRef, { once: true, margin: "-100px" });

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Compare alfred ai" 
        description="See how alfred ai compares to popular tools like Monday.com, Notion, Zapier, and more. Understand the differences and find the right fit for your business."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Compare", url: "/compare" }
        ]}
      />
      <Header />
      
      <main className="pt-24 pb-16">
        {/* Hero Section with Gradient */}
        <section ref={heroRef} className="relative overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-violet-500/5" />
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
          
          <div className="container-wide py-16 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <motion.span 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={heroInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-full text-sm font-medium mb-6"
              >
                <Layers className="w-4 h-4" />
                How We're Different
              </motion.span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Different Problems,{" "}
                <span className="text-gradient bg-gradient-to-r from-primary via-violet-500 to-secondary bg-clip-text text-transparent">
                  Different Solutions
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                We're not competing with these tools—we solve fundamentally different problems. See how alfred ai's approach differs and find the right fit for your needs.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Comparison Cards */}
        <section ref={cardsRef} className="py-8 bg-muted/30">
          <div className="container-wide">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {comparisons.map((comparison, index) => (
                <motion.div
                  key={comparison.slug}
                  initial={{ opacity: 0, y: 30 }}
                  animate={cardsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <Link
                    to={`/compare/${comparison.slug}`}
                    className={`relative block bg-gradient-to-br ${comparison.gradient} rounded-2xl border border-border/50 p-6 h-full hover:shadow-lg hover:border-primary/30 transition-all group overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-card/80 backdrop-blur-sm" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                          vs {comparison.name}
                        </h3>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-primary font-medium mb-2">{comparison.tagline}</p>
                      <p className="text-muted-foreground text-sm">{comparison.description}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-background">
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-3xl p-10 md:p-12 text-center max-w-4xl mx-auto"
            >
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-violet-500/5 to-secondary/10" />
              <div className="absolute inset-0 backdrop-blur-sm" />
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Want to See How We're Different?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Book a personalized demo and discover if alfred ai's approach is right for your business.
                </p>
                <Button asChild variant="cta" size="lg" className="rounded-full group hover:shadow-lg hover:shadow-primary/25 transition-all">
                  <Link to="https://new.alfredai.bot/book">
                    Book an Impact Conversation
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ComparePage;
