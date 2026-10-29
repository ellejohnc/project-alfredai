import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, ArrowDown } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import { PricingHeroSection } from "@/components/pricing/PricingHeroSection";
import { PricingChatbot } from "@/components/pricing/PricingChatbot";
import { PricingComponentsGrid } from "@/components/pricing/PricingComponentsGrid";
import { FTEComparisonTable } from "@/components/pricing/FTEComparisonTable";
import { DeploymentTimeline } from "@/components/pricing/DeploymentTimeline";
import { RevenueGuidance } from "@/components/pricing/RevenueGuidance";
import { TalkToSalesFallback } from "@/components/pricing/TalkToSalesFallback";
import { ChatbotBeforeAfter } from "@/components/pricing/ChatbotBeforeAfter";

interface CalculatorData {
  industry: string;
  teamSize: number;
  averageSalary: number;
  hoursOnAdmin: number;
  workflowCount: number;
}

export default function PricingPage() {
  const [isChatbotComplete, setIsChatbotComplete] = useState(false);
  const [calculatorData, setCalculatorData] = useState<CalculatorData | null>(null);
  const [showResults, setShowResults] = useState(false);
  const pricingDetailsRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Scroll to results section when calculator data is ready
  useEffect(() => {
    if (showResults && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ 
          behavior: "smooth", 
          block: "start" 
        });
      }, 300);
    }
  }, [showResults]);


  const handleShowResults = (data: CalculatorData) => {
    setCalculatorData(data);
    setShowResults(true);
  };

  return (
    <>
      <SEO
        title="AI Investment Calculator | Pricing & ROI"
        description="Calculate your AI automation ROI in 2 minutes. Compare traditional hiring against an AI workforce with personalised savings estimates."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Pricing", url: "/pricing" }
        ]}
        softwareTool={{
          name: "AI Investment Calculator",
          description: "Free interactive tool to calculate ROI and cost savings from AI automation. Compare traditional FTE hiring costs vs intelligent AI workforce deployment.",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web Browser",
          offers: {
            price: "0",
            priceCurrency: "AUD"
          }
        }}
      />
      <Header />
      <main className="min-h-screen pt-16">
        <PricingHeroSection />
        <PricingChatbot 
          onComplete={() => setIsChatbotComplete(true)} 
          onShowResults={handleShowResults}
        />
        
        {/* Results Section - Below Chatbot */}
        {showResults && calculatorData && (
          <section ref={resultsRef} className="py-12 md:py-16 bg-muted/30">
            <div className="container max-w-4xl mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                  <ArrowDown className="w-4 h-4 animate-bounce" />
                  Your Personalized Results
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">
                  Here's What AI Can Do For Your Business
                </h2>
              </motion.div>
              
              <ChatbotBeforeAfter
                teamSize={calculatorData.teamSize}
                averageAnnualSalary={calculatorData.averageSalary}
                hoursPerWeekOnAdmin={calculatorData.hoursOnAdmin}
                workflowCount={calculatorData.workflowCount}
                industry={calculatorData.industry}
              />
            </div>
          </section>
        )}
        
        <div ref={pricingDetailsRef} className="relative">
          {/* Blurred teaser when not complete */}
          {!isChatbotComplete && (
            <>
              <div className="pointer-events-none select-none" aria-hidden="true">
                <div className="blur-sm opacity-60">
                  <PricingComponentsGrid />
                </div>
              </div>
              
              {/* Lock overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-background/60 via-background/40 to-background/80 z-10">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-4 text-center px-6"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Lock className="w-7 h-7 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Complete the Calculator to Unlock</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Finish the assessment and contact form in the chatbot above to reveal your personalized pricing breakdown, ROI projections, and FTE comparison.
                    </p>
                  </div>
                </motion.div>
              </div>
            </>
          )}
          
          {/* Revealed content when complete */}
          {isChatbotComplete && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <PricingComponentsGrid />
              <FTEComparisonTable />
              <DeploymentTimeline />
              <RevenueGuidance />
            </motion.div>
          )}
        </div>
        
        <TalkToSalesFallback />
      </main>
      <Footer />
    </>
  );
}
