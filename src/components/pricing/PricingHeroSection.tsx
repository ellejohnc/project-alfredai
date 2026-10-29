import { motion } from "framer-motion";
import { MessageSquare, Zap, TrendingUp, Shield, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PricingHeroSection() {
  const scrollToChat = () => {
    document.getElementById("pricing-chatbot")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl opacity-50" />

      <div className="container max-w-5xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Badge */}
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20 mb-6"
          >
            <MessageSquare className="w-4 h-4" />
            Transparent Pricing
          </motion.span>

          {/* Main Heading - Plain Language */}
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            So, What's the <span className="text-primary">Pricing</span>?
          </h1>

          {/* Subheading - Direct, conversational */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Let's break down the pricing structure, show you the ROI, and explain why 
            investing in AI with Alfred makes business sense for your company.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button 
              size="lg" 
              onClick={scrollToChat}
              className="min-h-[48px] px-8"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Calculate My ROI
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              asChild
              className="min-h-[48px] px-8"
            >
              <a href="https://new.alfredai.bot/book">
                <Phone className="w-4 h-4 mr-2" />
                Talk to Sales
              </a>
            </Button>
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              {
                icon: Zap,
                title: "Deploy in Days",
                description: "14-45 days vs 3-6 months for FTE",
              },
              {
                icon: TrendingUp,
                title: "Compounding Returns",
                description: "AI gets smarter every quarter",
              },
              {
                icon: Shield,
                title: "Guaranteed ROI",
                description: "Performance-backed outcomes",
              },
            ].map((prop, idx) => (
              <motion.div
                key={prop.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                className={cn(
                  "p-4 rounded-xl border border-border/50",
                  "bg-background/50 backdrop-blur-sm",
                  "hover:border-primary/30 transition-colors"
                )}
              >
                <prop.icon className="w-6 h-6 text-primary mb-2 mx-auto" />
                <h3 className="text-sm font-semibold mb-1">{prop.title}</h3>
                <p className="text-xs text-muted-foreground">{prop.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
