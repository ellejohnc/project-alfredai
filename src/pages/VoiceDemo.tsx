import { lazy, Suspense, useState, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { DemoSpeedProvider } from "@/contexts/DemoSpeedProvider";

import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { DemoSkeleton } from "@/components/demos/DemoSkeleton";
import SEO from "@/components/SEO";
import { DemoLeadCaptureModal } from "@/components/demos/DemoLeadCaptureModal";
import { shouldBypassLeadCapture, logSilentDemoAccess } from "@/components/demos/demoLeadAccess";

// Lazy load the demo component for optimal performance
const VoiceAgentDemo = lazy(() => import("@/components/demos/VoiceAgentDemo"));

const DEMO_ID = "voice-demo";
const DEMO_TITLE = "Voice AI Demo";

const VoiceDemoContent = () => {
  const location = useLocation();
  // Only show lead capture for external/shared link visitors
  const isInternalNavigation = !!(location.state as any)?.fromInternal || new URLSearchParams(location.search).get('ref') === 'internal';
  const [showLeadCapture, setShowLeadCapture] = useState(() => 
    !isInternalNavigation && !shouldBypassLeadCapture()
  );
  const [demoReady, setDemoReady] = useState(() => isInternalNavigation || shouldBypassLeadCapture());
  

  // Log silent access for returning visitors
  useEffect(() => {
    if (demoReady && !showLeadCapture) {
      logSilentDemoAccess(DEMO_ID, DEMO_TITLE);
    }
  }, [demoReady, showLeadCapture]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Live Voice AI Demo for Construction Teams"
        description="Try alfred ai's voice agent live: ask about jobs, site notes and admin tasks and hear how an agentic AI assistant handles construction workflows."
        path="/voice-demo"
        breadcrumbs={[{ name: "Home", url: "/" }, { name: "Voice Demo", url: "/voice-demo" }]}
      />
      <Header />
      
      <main className="pt-24 pb-16 relative overflow-hidden">
        {/* Premium gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Voice AI Demo
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience real-time voice conversations with our AI agent.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            {demoReady ? (
              <Suspense fallback={<DemoSkeleton variant="default" />}>
                <VoiceAgentDemo />
              </Suspense>
            ) : (
              <DemoSkeleton variant="default" />
            )}
          </motion.div>
        </div>
      </main>

      <Footer />

      {/* Lead Capture Modal - shows first for new visitors */}
      <DemoLeadCaptureModal
        isOpen={showLeadCapture}
        onClose={() => setShowLeadCapture(false)}
        onSuccess={() => {
          setShowLeadCapture(false);
          setDemoReady(true);
        }}
        demoId={DEMO_ID}
        demoTitle={DEMO_TITLE}
      />
    </div>
  );
};

export default function VoiceDemo() {
  return (
    <DemoSpeedProvider>
      <VoiceDemoContent />
    </DemoSpeedProvider>
  );
}
