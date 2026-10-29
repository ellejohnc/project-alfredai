import { Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useLocation, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle, Mail } from "lucide-react";

import SEO from "@/components/SEO";
import Header from "@/components/layout/Header";
import { DemoFooter } from "@/components/demos/DemoFooter";
import { demos, demoComponents } from "@/pages/resources/demosData";
import { useChatContext } from "@/contexts/ChatContext";
import { Button } from "@/components/ui/button";
import ErrorBoundary from "@/components/ErrorBoundary";
import { DemoSkeleton } from "@/components/demos/DemoSkeleton";
import { DemoLeadCaptureModal } from "@/components/demos/DemoLeadCaptureModal";
import { shouldBypassLeadCapture, logSilentDemoAccess } from "@/components/demos/demoLeadAccess";
import { normalizeUrl } from "@/lib/siteConfig";
import { DemoSpeedProvider } from "@/contexts/DemoSpeedProvider";

// Fallback UI for errors
function DemoErrorFallback() {
  const currentUrl = normalizeUrl(window.location.href);
  const mailtoLink = `mailto:support@alfredai.bot?subject=Demo Error Report&body=Error occurred on: ${encodeURIComponent(currentUrl)}%0A%0APlease describe what you were doing when the error occurred:`;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <AlertCircle className="w-12 h-12 text-destructive mb-4" />
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

function GenericDemoPageContent() {
  const { demoId } = useParams<{ demoId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { openBooking } = useChatContext();

  const demo = demos.find(d => d.id === demoId);
  const DemoComponent = demoId ? demoComponents[demoId] : null;

  // Only show lead capture for external/shared link visitors
  const isInternalNavigation = !!(location.state as any)?.fromInternal || searchParams.get('ref') === 'internal';
  const [showLeadCapture, setShowLeadCapture] = useState(() =>
    !isInternalNavigation && !shouldBypassLeadCapture()
  );

  // Log silent access for returning visitors
  useEffect(() => {
    if (!showLeadCapture && shouldBypassLeadCapture() && demoId && demo) {
      logSilentDemoAccess(demoId, demo.title);
    }
  }, [showLeadCapture, demoId, demo]);

  // If demo not found, redirect to demos page
  if (!demo || !DemoComponent) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-24 flex items-center justify-center">
          <div className="text-center p-8">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Demo Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The demo you're looking for doesn't exist or has been moved.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" asChild>
                <Link to="/resources/demos">Browse All Demos</Link>
              </Button>
              <Button variant="secondary" asChild>
                <a href={`mailto:support@alfredai.bot?subject=Missing Demo&body=Demo ID: ${demoId || 'unknown'}%0APage: ${encodeURIComponent(window.location.href)}`}>
                  <Mail className="w-4 h-4 mr-2" />
                  Report Issue
                </a>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        fullTitle={`${demo.title} Demo | alfred ai`}
        description={demo.description}
        path={`/demos/${demo.id}`}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Resources", url: "/resources" },
          { name: "Demos", url: "/resources/demos" },
          { name: demo.title, url: `/demos/${demo.id}` }
        ]}
      />

      <Header />

      <main className="flex-1 pt-20 pb-4 flex flex-col min-h-0">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col flex-1 min-h-0">
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

          {/* Demo Content */}
          <ErrorBoundary fallback={<DemoErrorFallback />}>
            <Suspense fallback={<DemoSkeleton variant="compact" />}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col flex-1 min-h-0 gap-3"
              >
                <DemoComponent />

                {/* Demo CTA Footer */}
                <div className="shrink-0">
                  <DemoFooter
                    currentDemoId={demo.id}
                    demos={demos}
                    onBookDemo={() => openBooking("page_cta")}
                    onSelectDemo={(id) => navigate(`/demos/${id}`, { state: { fromInternal: true } })}
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
        onSuccess={() => setShowLeadCapture(false)}
        demoId={demo.id}
        demoTitle={demo.title}
      />
    </div>
  );
}

export default function GenericDemoPage() {
  return (
    <DemoSpeedProvider>
      <GenericDemoPageContent />
    </DemoSpeedProvider>
  );
}
