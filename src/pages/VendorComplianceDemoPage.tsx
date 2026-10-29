import { Suspense, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle, Mail } from "lucide-react";
import { useState } from "react";

import SEO from "@/components/SEO";
import Header from "@/components/layout/Header";

import { DemoFooter } from "@/components/demos/DemoFooter";
import { demos } from "@/pages/resources/demosData";
import { useChatContext } from "@/contexts/ChatContext";
import { Button } from "@/components/ui/button";
import ErrorBoundary from "@/components/ErrorBoundary";
import { DemoSkeleton } from "@/components/demos/DemoSkeleton";
import { DemoLeadCaptureModal } from "@/components/demos/DemoLeadCaptureModal";
import { shouldBypassLeadCapture, logSilentDemoAccess } from "@/components/demos/demoLeadAccess";
import { normalizeUrl } from "@/lib/siteConfig";

import VendorComplianceDemo from "@/components/demos/vendor-compliance/VendorComplianceDemo";
import { LandscapeRequiredOverlay } from "@/components/demos/vendor-compliance/LandscapeRequiredOverlay";
import { DemoSpeedProvider } from "@/contexts/DemoSpeedProvider";


// Fallback UI for errors
function DemoErrorFallback() {
  const currentUrl = normalizeUrl(window.location.href);
  const mailtoLink = `mailto:support@alfredai.bot?subject=Demo Error Report&body=Error occurred on: ${encodeURIComponent(currentUrl)}%0A%0APlease describe what you were doing when the error occurred:`;
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
      <h3 className="text-lg font-semibold mb-2">Demo Unavailable</h3>
      <p className="text-muted-foreground mb-4 max-w-md">
        Something went wrong loading this demo. Please try refreshing or report the issue.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
        <Button variant="secondary" asChild>
          <a href={mailtoLink}>
            <Mail className="w-4 h-4 mr-2" />
            Report Issue
          </a>
        </Button>
      </div>
    </div>
  );
}

function VendorComplianceDemoPageContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { openBooking } = useChatContext();
  
  // Only show lead capture for external/shared link visitors (no internal nav state)
  const isInternalNavigation = !!(location.state as any)?.fromInternal || searchParams.get('ref') === 'internal';
  const [showLeadCapture, setShowLeadCapture] = useState(() => 
    !isInternalNavigation && !shouldBypassLeadCapture()
  );

  // Log silent access for returning visitors
  useEffect(() => {
    if (!showLeadCapture && shouldBypassLeadCapture()) {
      logSilentDemoAccess("vendor-compliance", "Vendor Compliance AI Demo");
    }
  }, [showLeadCapture]);

  const handleLeadCaptureSuccess = () => {
    setShowLeadCapture(false);
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      
      {/* Landscape requirement overlay - blocks everything when portrait on mobile */}
      <LandscapeRequiredOverlay />
      <SEO 
        fullTitle="AI Vendor Compliance Agent Demo | alfred ai"
        description="Automate subcontractor document tracking at scale. AI-powered email intake, document verification, multi-channel reminders, and real-time compliance dashboards with traffic light status."
        path="/demos/vendor-compliance"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Resources", url: "/resources" },
          { name: "Demos", url: "/resources/demos" },
          { name: "AI Vendor Compliance Agent", url: "/demos/vendor-compliance" }
        ]}
      />
      
      <Header />
      
      <main className="flex-1 pt-20 pb-2 flex flex-col min-h-0 overflow-hidden">
        <div className="container-wide flex flex-col flex-1 min-h-0">
          {/* Back Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-3 shrink-0"
          >
            <Link
              to="/resources/demos"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Demos
            </Link>
          </motion.div>
          
          {/* Demo Content - flex-1 to fill remaining space */}
          <ErrorBoundary fallback={<DemoErrorFallback />}>
            <Suspense fallback={<DemoSkeleton variant="compact" />}>
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, layout: { duration: 0.2 } }}
                className="flex flex-col flex-1 min-h-0 gap-2"
              >
                <VendorComplianceDemo />
                
                {/* Demo CTA Footer */}
                <div className="shrink-0">
                  <DemoFooter
                    currentDemoId="vendor-compliance"
                    demos={demos}
                    onBookDemo={() => openBooking("page_cta")}
                    onSelectDemo={(demoId) => navigate(`/resources/demos?demo=${demoId}`)}
                  />
                </div>
              </motion.div>
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
      
      {/* Lead Capture Modal */}
      <DemoLeadCaptureModal
        isOpen={showLeadCapture}
        onClose={() => setShowLeadCapture(false)}
        onSuccess={handleLeadCaptureSuccess}
        demoId="vendor-compliance"
        demoTitle="AI Vendor Compliance Agent"
      />
    </div>
  );
}

export default function VendorComplianceDemoPage() {
  return (
    <DemoSpeedProvider>
      <VendorComplianceDemoPageContent />
    </DemoSpeedProvider>
  );
}
