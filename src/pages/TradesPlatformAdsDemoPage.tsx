import { lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle, Mail } from "lucide-react";

import SEO from "@/components/SEO";
import Header from "@/components/layout/Header";
import MinimalFooter from "@/components/layout/MinimalFooter";
import ErrorBoundary from "@/components/ErrorBoundary";
import { DemoSkeleton } from "@/components/demos/DemoSkeleton";
import { DemoFooter } from "@/components/demos/DemoFooter";
import { demos } from "@/pages/resources/demosData";
import { Button } from "@/components/ui/button";
import { normalizeUrl } from "@/lib/siteConfig";
import { useChatContext } from "@/contexts/ChatContext";
import { DemoSpeedProvider } from "@/contexts/DemoSpeedProvider";


const TradesPlatformDemo = lazy(() => 
  import("@/components/demos/TradesPlatformDemo")
);

// Error fallback for demo loading failures
function DemoErrorFallback() {
  const currentUrl = normalizeUrl(window.location.href);
  const mailtoLink = `mailto:support@alfredai.bot?subject=Demo Error Report&body=Error occurred on: ${encodeURIComponent(currentUrl)}%0A%0APlease describe what you were doing when the error occurred:`;
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <AlertCircle className="w-12 h-12 text-warning mb-4" />
      <h3 className="text-lg font-semibold mb-2">Demo Unavailable</h3>
      <p className="text-muted-foreground mb-4 max-w-md">
        Something went wrong loading this demo. Please try refreshing or report the issue.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="outline" onClick={() => window.location.reload()} className="min-h-[44px]">
          Refresh Page
        </Button>
        <Button variant="secondary" asChild className="min-h-[44px]">
          <a href={mailtoLink}>
            <Mail className="w-4 h-4 mr-2" />
            Report Issue
          </a>
        </Button>
      </div>
    </div>
  );
}

function TradesPlatformAdsDemoPageContent() {
  const navigate = useNavigate();
  const { openBooking } = useChatContext();

  const handleBookDemo = () => {
    openBooking("page_cta");
  };

  const handleSelectDemo = (demoId: string) => {
    navigate(`/resources/demos/${demoId}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      
      <SEO 
        fullTitle="TradeFlow OS - AI Quoting for Painters & Trades | alfred ai"
        description="Get instant AI-powered quotes with image analysis. Automated surface area estimation, online booking, secure payments. Built for painters, builders, and trades."
        path="/resources/demos/trades-platform/ads"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Resources", url: "/resources" },
          { name: "Demos", url: "/resources/demos" },
          { name: "TradeFlow OS", url: "/resources/demos/trades-platform/ads" }
        ]}
      />
      
      <Header />
      
      <main className="flex-1 pt-20 pb-6">
        <div className="container-wide">
          {/* Back Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-4"
          >
            <Link
              to="/resources/demos"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group min-h-[44px] py-2"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Demos
            </Link>
          </motion.div>
          
          {/* Demo Content - Full Width */}
          <ErrorBoundary fallback={<DemoErrorFallback />}>
            <Suspense fallback={<DemoSkeleton variant="compact" />}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <TradesPlatformDemo />
              </motion.div>
            </Suspense>
          </ErrorBoundary>

          {/* Demo CTA Footer */}
          <div className="mt-6">
            <DemoFooter
              currentDemoId="trades-platform"
              demos={demos}
              onBookDemo={handleBookDemo}
              onSelectDemo={handleSelectDemo}
            />
          </div>
        </div>
      </main>
      
      <MinimalFooter />
    </div>
  );
}

export default function TradesPlatformAdsDemoPage() {
  return (
    <DemoSpeedProvider>
      <TradesPlatformAdsDemoPageContent />
    </DemoSpeedProvider>
  );
}
