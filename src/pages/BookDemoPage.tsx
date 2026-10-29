import { motion } from "framer-motion";
import { Check } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import LeadCaptureChoice from "@/components/LeadCaptureChoice";

const benefits = [
  "Personalized walkthrough of alfred ai",
  "See demos relevant to your industry",
  "Discuss your specific use cases",
  "Get ROI estimates for your team",
];

const BookDemoPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO 
        title="Book a Demo" 
        description="Schedule a personalized demo of alfred ai and discover how AI automation can transform your operations."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Book Demo", url: "/book-demo" }
        ]}
      />
      <Header />
      <main className="pt-24 pb-16 relative overflow-hidden">
        {/* Premium gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />
        <section className="container-wide py-16 relative">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto items-start">
            {/* Left column - Value proposition (sticky wrapper separate from motion) */}
            <div className="lg:sticky lg:top-32">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
                Book an Impact Conversation
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                See alfred ai in Action
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Schedule a personalized demo and discover how alfred ai can
                transform your operations.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center gap-3 text-muted-foreground"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    {benefit}
                  </motion.li>
                ))}
              </ul>

              {/* Trust signals */}
              <div className="mt-10 pt-8 border-t border-border">
                <p className="text-sm text-muted-foreground mb-4">
                  Trusted by growing mid-market firms
                </p>
                <div className="flex items-center gap-6 text-muted-foreground/50">
                  <span className="text-sm font-medium">$10M–$300M revenue</span>
                  <span className="text-muted-foreground/30">•</span>
                  <span className="text-sm font-medium">20–500 staff</span>
                </div>
              </div>
            </motion.div>
            </div>

            {/* Right column - Lead capture choice */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card border border-border rounded-2xl p-8"
            >
              <LeadCaptureChoice type="demo" />
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default BookDemoPage;