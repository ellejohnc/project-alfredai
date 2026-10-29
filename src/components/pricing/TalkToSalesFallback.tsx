import { motion } from "framer-motion";
import { Calendar, ArrowRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TalkToSalesFallbackProps {
  className?: string;
}

export function TalkToSalesFallback({ className }: TalkToSalesFallbackProps) {
  return (
    <section className={cn("py-16 md:py-24 bg-muted/30", className)}>
      <div className="container max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Not Sure Where to Start?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Every business is different. Our team can help you identify the right 
            workflows to automate and build a custom plan that fits your budget.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="p-6 md:p-8 rounded-xl border border-primary/50 bg-background shadow-lg text-center"
        >
          <Calendar className="w-10 h-10 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Book a Strategy Call</h3>
          <p className="text-muted-foreground mb-6">
            30 minutes with our solutions team to discuss your needs
          </p>
          <Button size="lg" className="min-h-[48px] px-8" asChild>
            <a href="https://new.alfredai.bot/book">
              Schedule Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">No pressure, no obligation.</span>{" "}
            Just a straightforward conversation about how AI can help your business.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
