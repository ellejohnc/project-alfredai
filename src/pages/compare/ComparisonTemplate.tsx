import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, X, ArrowRight, Zap, Users, TrendingUp, Shield, Building2, Wrench, Cloud, Cog, ChevronLeft } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

interface FeatureComparison {
  feature: string;
  alfred: boolean | string;
  competitor: boolean | string;
  highlight?: boolean; // Marks key differentiating features
}

interface ComparisonData {
  competitorName: string;
  competitorLogo?: string;
  tagline: string;
  description: string;
  features: FeatureComparison[];
  alfredBestFor: string[];
  competitorBestFor: string[];
  keyDifferentiators: {
    icon: React.ReactNode;
    title: string;
    description: string;
  }[];
  competitorLimitations?: string[]; // What the competitor lacks
  /** Optional per-page metadata overrides */
  seoTitle?: string;
  seoDescription?: string;
  /** Optional explicit canonical path, e.g. "/compare/vs-zapier" */
  canonicalPath?: string;
  /** Shows the competitor before alfred ai when the source framework uses that reading order. */
  competitorFirst?: boolean;
}

interface ComparisonTemplateProps {
  data: ComparisonData;
}

const truncate = (value: string, max = 155) =>
  value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;

const ComparisonTemplate = ({ data }: ComparisonTemplateProps) => {
  const location = useLocation();
  // Fallback keeps metadata unique even if a route forgets to pass a canonical path
  const path = data.canonicalPath ?? location.pathname ?? "/compare";
  const seoTitle = data.seoTitle ?? `alfred ai vs ${data.competitorName}`;
  const seoDescription = truncate(
    data.seoDescription ?? `${data.tagline} — ${data.description}`,
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={seoTitle}
        description={seoDescription}
        path={path}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "How We're Different", url: "/compare" },
          { name: `alfred ai vs ${data.competitorName}`, url: path },
        ]}
      />
      <Header />
      
      <main className="pt-24 pb-16 relative overflow-hidden">

        {/* Premium gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Back to Comparisons Link */}
        <div className="container-wide pt-4">
          <Link 
            to="/compare" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to How We're Different</span>
          </Link>
        </div>
        
        {/* Hero Section */}
        <section className="container-wide py-16 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              How We're Different
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              alfred ai vs {data.competitorName}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              {data.tagline}
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {data.description}
            </p>
          </motion.div>
        </section>

        {/* Feature Comparison Table */}
        <section className="container-wide py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2 className="text-3xl font-bold text-center mb-4">Where We Differ</h2>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
              Different tools solve different problems. Here's how our approaches differ.
            </p>
            <div className="max-w-4xl mx-auto bg-card rounded-2xl border border-border overflow-hidden">
              <div className="grid grid-cols-3 bg-muted/50 p-4 font-semibold text-sm">
                <div>Capability</div>
                <div className="text-center">{data.competitorFirst ? data.competitorName : "alfred ai"}</div>
                <div className="text-center">{data.competitorFirst ? "alfred ai" : data.competitorName}</div>
              </div>
              {data.features.map((item, index) => (
                <div 
                  key={index}
                  className={`grid grid-cols-3 p-4 border-t border-border items-center ${item.highlight ? 'bg-primary/5' : ''}`}
                >
                  <div className={`${item.highlight ? 'text-foreground font-medium' : 'text-foreground'}`}>
                    {item.feature}
                    {item.highlight && <span className="ml-2 text-xs text-primary font-semibold">UNIQUE</span>}
                  </div>
                  <div className="flex justify-center text-center">
                    {typeof (data.competitorFirst ? item.competitor : item.alfred) === 'boolean' ? (
                      (data.competitorFirst ? item.competitor : item.alfred) ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <X className="w-5 h-5 text-red-500" />
                      )
                    ) : (
                      <span className="text-sm text-muted-foreground">{data.competitorFirst ? item.competitor : item.alfred}</span>
                    )}
                  </div>
                  <div className="flex justify-center text-center">
                    {typeof (data.competitorFirst ? item.alfred : item.competitor) === 'boolean' ? (
                      (data.competitorFirst ? item.alfred : item.competitor) ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <X className="w-5 h-5 text-red-500" />
                      )
                    ) : (
                      <span className="text-sm text-muted-foreground">{data.competitorFirst ? item.alfred : item.competitor}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Key Differentiators */}
        <section className="container-wide py-16 bg-muted/30">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold text-center mb-4">What Makes alfred ai Unique</h2>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
              We're not trying to be a better version of {data.competitorName}—we're solving different problems entirely.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {data.keyDifferentiators.map((item, index) => (
                <div 
                  key={index}
                  className="bg-card p-6 rounded-xl border border-border"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Best For Sections */}
        <section className="container-wide py-16">
          <h2 className="text-3xl font-bold text-center mb-4">Right Tool for the Right Job</h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Both tools excel in different contexts. Here's where each shines.
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-primary/5 border border-primary/20 rounded-2xl p-8"
            >
              <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                alfred ai Excels When You Need
              </h3>
              <ul className="space-y-3">
                {data.alfredBestFor.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-muted/50 border border-border rounded-2xl p-8"
            >
              <h3 className="text-xl font-bold text-foreground mb-6">
                {data.competitorName} Excels When You Need
              </h3>
              <ul className="space-y-3">
                {data.competitorBestFor.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container-wide py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-3xl p-12 text-center"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Want to See How We're Different?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Book a personalized demo and discover if alfred ai's approach is right for your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="https://new.alfredai.bot/book">
                  Book an Impact Conversation <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/compare">Explore More Differences</Link>
              </Button>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ComparisonTemplate;
