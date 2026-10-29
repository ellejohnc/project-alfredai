import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { SafeAnimatePresence } from "@/components/ui/safe-animate-presence";
import { Download, Calendar, Share2, Loader2, ChevronDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getVisitorSession, updateVisitorSession, getStoredCredentials } from "@/lib/visitorSession";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { loadJsPDF } from "@/lib/dynamicImports";
import { WorkflowSimulator } from "@/components/results/WorkflowSimulator";
import { DemoShowcase } from "@/components/results/DemoShowcase";
import { ProgressIndicator } from "@/components/results/ProgressIndicator";
import { ConfettiCelebration } from "@/components/results/ConfettiCelebration";
import { EmbeddedTCOCalculator } from "@/components/results/EmbeddedTCOCalculator";
import { SoundToggle } from "@/components/results/SoundToggle";
import { useSoundPreference } from "@/hooks/useSoundPreference";
import { GHLBookingWidget } from "@/components/GHLBookingWidget";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PhoneCapture } from "@/components/results/PhoneCapture";
import { logGHLSubmission } from "@/hooks/useGHLLogging";

type SessionData = {
  id: string;
  name: string;
  email: string;
  company: string;
  industry: string;
  team_size: string;
  pain_points: string[];
  goals: string[];
  workflows_to_automate?: string[];
  primary_challenge?: string;
  pain_level?: string;
  timeline?: string;
  personalization: {
    headline?: string;
    subheadline?: string;
    keyBenefits?: string[];
    roiStatement?: string;
    cta?: string;
  };
  recommended_demos: string[];
  roi_inputs: {
    teamSize?: number;
    adminReductionPercent?: number;
    potentialSavings?: number;
    revenueIncreasePercent?: number;
    hoursBackPerWeek?: number;
    selectedWorkflows?: string[];
  };
};

type PageStep = "welcome" | "roi" | "simulator" | "explore" | "booking";

export default function PersonalizedResults() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentStep, setCurrentStep] = useState<PageStep>("welcome");
  const [demoCompleted, setDemoCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Phone capture state
  const [showPhoneCapture, setShowPhoneCapture] = useState(false);
  const [phoneDeclined, setPhoneDeclined] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [capturedPhone, setCapturedPhone] = useState<string | null>(null);
  
  // Sound preference hook
  const { soundEnabled, toggleSound, playCelebrationSound } = useSoundPreference();
  
  // Refs for scroll targets
  const roiRef = useRef<HTMLElement>(null);
  const simulatorRef = useRef<HTMLElement>(null);
  const exploreRef = useRef<HTMLElement>(null);
  const tcoRef = useRef<HTMLElement>(null);
  
  // Step mapping for progress indicator
  const stepToNumber: Record<PageStep, number> = {
    welcome: 1,
    roi: 2,
    simulator: 3,
    explore: 4,
    booking: 4,
  };
  
  const stepLabels = ["Welcome", "Your ROI", "Live Demo", "Next Steps"];

  useEffect(() => {
    if (sessionId) fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      // Get credentials from localStorage - the session token is required
      const credentials = getStoredCredentials();
      
      // If we have credentials and the URL sessionId matches, use them
      // Otherwise, we can't access the session (security protection)
      if (!credentials || credentials.sessionId !== sessionId) {
        console.error("No valid credentials for this session");
        toast.error("Could not access this session. Please start a new one.");
        setLoading(false);
        return;
      }

      const data = await getVisitorSession(sessionId, credentials.sessionToken);

      if (!data) {
        throw new Error("Session not found");
      }
      
      setSession(data as SessionData);
      
      // Update last accessed time
      await updateVisitorSession(
        { last_accessed_at: new Date().toISOString() },
        sessionId,
        credentials.sessionToken
      );
    } catch (error) {
      console.error("Failed to fetch session:", error);
      toast.error("Could not load your personalized results");
    } finally {
      setLoading(false);
    }
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = useCallback(async () => {
    if (!session || isGeneratingPDF) return;
    
    setIsGeneratingPDF(true);
    try {
      // Dynamically load jsPDF only when needed
      const jsPDF = await loadJsPDF();
      const doc = new jsPDF();
      const p = session.personalization;
      const roi = session.roi_inputs;
      
      doc.setFontSize(24);
      doc.setTextColor(236, 72, 153);
      doc.text("alfred ai", 20, 25);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.text(`Personalized Report for ${session.company}`, 20, 40);
      
      doc.setFontSize(12);
      doc.text(`Prepared for: ${session.name}`, 20, 55);
      doc.text(`Industry: ${session.industry}`, 20, 65);
      doc.text(`Team Size: ${session.team_size}`, 20, 75);
      
      if (session.workflows_to_automate?.length) {
        doc.text(`Selected Workflows: ${session.workflows_to_automate.join(", ")}`, 20, 85);
      }
      
      doc.setFontSize(14);
      doc.text("Key Benefits", 20, 105);
      doc.setFontSize(11);
      p.keyBenefits?.forEach((benefit, i) => {
        doc.text(`• ${benefit}`, 25, 115 + i * 10);
      });
      
      doc.setFontSize(14);
      doc.text("Projected ROI", 20, 155);
      doc.setFontSize(11);
      doc.text(`Admin Reduction: ${roi.adminReductionPercent}%`, 25, 165);
      doc.text(`Potential Annual Savings: $${(roi.potentialSavings || 0).toLocaleString()}`, 25, 175);
      doc.text(`Hours Saved Per Week: ${roi.hoursBackPerWeek}`, 25, 185);
      
      doc.save(`alfred ai-Report-${session.company.replace(/\s+/g, "-")}.pdf`);
      toast.success("Report downloaded!");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [session, isGeneratingPDF]);

  const advanceStep = (nextStep: PageStep) => {
    setCurrentStep(nextStep);
    // Scroll to content smoothly with offset for header
    setTimeout(() => {
      let targetRef: React.RefObject<HTMLElement | null> | null = null;
      switch (nextStep) {
        case "roi": targetRef = roiRef; break;
        case "simulator": targetRef = simulatorRef; break;
        case "explore": targetRef = exploreRef; break;
      }
      if (targetRef?.current) {
        const yOffset = -100;
        const y = targetRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }, 100);
  };

  const handleDemoComplete = () => {
    setShowConfetti(true);
    setDemoCompleted(true);
  };

  // Submit lead to GHL - phone is required or "Skipped" if user skips to booking
  const submitLead = async (phone?: string, skipped: boolean = false) => {
    if (leadSubmitted || !session) return;
    
    // Determine phone value: provided phone, captured phone, "Skipped" if explicitly skipped, or undefined
    const phoneValue = phone || capturedPhone || (skipped ? "Skipped" : undefined);
    
    try {
      await logGHLSubmission({
        lead_email: session.email,
        lead_name: session.name,
        lead_phone: phoneValue,
        lead_company: session.company,
        source_page: window.location.pathname,
        source_medium: "personalization_flow",
        source_campaign: "personalized_results",
        lead_source: "personalization_flow",
        qualification_data: {
          industry: session.industry,
          size: session.team_size,
          timeline: session.timeline,
          challenge: session.primary_challenge,
        },
      });
      setLeadSubmitted(true);
    } catch (error) {
      console.error("Failed to submit lead:", error);
    }
  };

  // Handle phone submission - submit lead and proceed to demo
  const handlePhoneSubmit = async (phone: string) => {
    setCapturedPhone(phone);
    await submitLead(phone);
    setShowPhoneCapture(false);
    advanceStep("simulator");
  };

  // Handle phone decline - show skip option
  const handlePhoneDecline = () => {
    setPhoneDeclined(true);
  };

  // Handle skip to booking - submit lead with "Skipped" phone and open calendar
  const handleSkipToBooking = async () => {
    await submitLead(undefined, true); // Pass skipped=true to set phone as "Skipped"
    setShowPhoneCapture(false);
    setShowCalendar(true);
  };

  // Handle "Watch It In Action" click - show phone capture first
  const handleWatchDemoClick = () => {
    const hasWorkflows = (session?.workflows_to_automate || []).length > 0;
    if (hasWorkflows) {
      setShowPhoneCapture(true);
    } else {
      // No workflows - submit lead with "Skipped" phone and go directly to booking
      submitLead(undefined, true);
      setShowCalendar(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <h1 className="text-2xl font-bold">Session not found</h1>
        <Link to="/signup"><Button>Start Over</Button></Link>
      </div>
    );
  }

  const p = session.personalization;
  const roi = session.roi_inputs;
  const workflows = session.workflows_to_automate || [];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent pointer-events-none" />
      <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />
      
      <Header />
      
      {/* Confetti celebration */}
      <ConfettiCelebration trigger={showConfetti} playSound={playCelebrationSound} />
      
      {/* Progress Indicator - Fixed at top */}
      {currentStep !== "welcome" && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-16 left-0 right-0 py-3 bg-background/95 backdrop-blur-sm border-b border-border z-30"
        >
          <div className="container mx-auto px-4">
            <ProgressIndicator 
              currentStep={stepToNumber[currentStep]} 
              totalSteps={4}
              labels={stepLabels}
            />
          </div>
        </motion.div>
      )}
      
      <main className="container mx-auto px-4 py-12 pt-24 max-w-4xl relative">
        {/* Add extra padding when progress indicator is visible */}
        {currentStep !== "welcome" && <div className="h-12" />}
        
        {/* STEP 1: Welcome + ROI Teaser */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <p className="text-muted-foreground text-sm mb-2">
            Personalized results for {session.company}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            {p.headline || `Welcome back, ${session.name?.split(' ')[0] || 'there'}!`}
          </h1>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            {p.subheadline || `Based on what you told us about ${session.company}, here's what alfred ai can do for you.`}
          </p>
          
          {/* Single ROI teaser */}
          <Card className="inline-block border border-border bg-muted/30 mb-8">
            <CardContent className="py-6 px-8">
              <p className="text-sm text-muted-foreground mb-1">Potential Annual Savings</p>
              <p className="text-4xl font-bold text-foreground">
                ${((roi.potentialSavings || 0) / 1000).toFixed(0)}K
              </p>
            </CardContent>
          </Card>

          {currentStep === "welcome" && (
            <div className="flex justify-center">
              <Button 
                size="lg" 
                onClick={() => advanceStep("roi")}
                className="gap-2"
              >
                See Your Full Results
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </motion.section>

        {/* STEP 2: ROI Reveal */}
        <SafeAnimatePresence>
          {currentStep !== "welcome" && (
            <motion.section
              ref={roiRef as React.RefObject<HTMLElement>}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-16"
            >
              {/* TCO Calculator */}
              <div className="mb-8">
                <EmbeddedTCOCalculator 
                  teamSize={session.team_size} 
                  onBookCall={() => setShowCalendar(true)}
                />
              </div>
              
              {/* ROI Stats - Muted design */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card className="text-center border border-border bg-muted/20">
                  <CardContent className="pt-6">
                    <p className="text-3xl font-bold text-foreground">{roi.adminReductionPercent}%</p>
                    <p className="text-sm text-muted-foreground">Admin Reduction</p>
                  </CardContent>
                </Card>
                <Card className="text-center border border-border bg-muted/20">
                  <CardContent className="pt-6">
                    <p className="text-3xl font-bold text-foreground">${((roi.potentialSavings || 0) / 1000).toFixed(0)}K</p>
                    <p className="text-sm text-muted-foreground">Annual Savings</p>
                  </CardContent>
                </Card>
                <Card className="text-center border border-border bg-muted/20">
                  <CardContent className="pt-6">
                    <p className="text-3xl font-bold text-foreground">{roi.hoursBackPerWeek}h</p>
                    <p className="text-sm text-muted-foreground">Hours Saved/Week</p>
                  </CardContent>
                </Card>
                <Card className="text-center border border-border bg-muted/20">
                  <CardContent className="pt-6">
                    <p className="text-3xl font-bold text-foreground">{roi.revenueIncreasePercent}%</p>
                    <p className="text-sm text-muted-foreground">Revenue Increase</p>
                  </CardContent>
                </Card>
              </div>

              {/* Key Benefits - Simple text list */}
              {p.keyBenefits && p.keyBenefits.length > 0 && (
                <Card className="border border-border bg-muted/10 mb-8">
                  <CardContent className="py-6">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                      Key Benefits for {session.company}
                    </h3>
                    <ul className="space-y-2">
                      {p.keyBenefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2 text-foreground">
                          <span className="text-muted-foreground">•</span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {currentStep === "roi" && workflows.length > 0 && !showPhoneCapture && (
                <div className="flex flex-col items-center gap-3">
                  <Button 
                    size="lg" 
                    onClick={handleWatchDemoClick}
                    className="gap-2"
                  >
                    Watch It In Action
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              {currentStep === "roi" && workflows.length > 0 && showPhoneCapture && (
                <PhoneCapture
                  onSubmit={handlePhoneSubmit}
                  onSkip={handleSkipToBooking}
                  onDecline={handlePhoneDecline}
                  showSkipOption={phoneDeclined}
                />
              )}
              
              {currentStep === "roi" && workflows.length === 0 && (
                <div className="flex justify-center">
                  <Button 
                    size="lg" 
                    onClick={() => setShowCalendar(true)}
                    className="gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Book an Impact Conversation
                  </Button>
                </div>
              )}
            </motion.section>
          )}
        </SafeAnimatePresence>

        {/* STEP 3: Workflow Simulator */}
        <SafeAnimatePresence>
          {currentStep === "simulator" && workflows.length > 0 && (
            <motion.section
              ref={simulatorRef as React.RefObject<HTMLElement>}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-16"
            >
              <WorkflowSimulator
                company={session.company}
                industry={session.industry}
                workflows={workflows}
                teamSize={session.team_size}
                primaryChallenge={session.primary_challenge}
                recommendedDemos={session.recommended_demos}
                onDemoComplete={handleDemoComplete}
                onBookDemo={() => setShowCalendar(true)}
              />

              {/* Post-demo CTA */}
              {demoCompleted && currentStep === "simulator" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center mt-6"
                >
                  <Button 
                    variant="outline"
                    size="lg"
                    onClick={() => advanceStep("explore")}
                    className="gap-2"
                  >
                    Explore More Demos
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </motion.section>
          )}
        </SafeAnimatePresence>

        {/* STEP 4: Explore More (Collapsed by default) */}
        <SafeAnimatePresence>
          {currentStep === "explore" && (
            <motion.section
              ref={exploreRef as React.RefObject<HTMLElement>}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-16"
            >
              <DemoShowcase
                workflows={workflows}
                recommendedDemos={session.recommended_demos || []}
                company={session.company}
                industry={session.industry}
              />
            </motion.section>
          )}
        </SafeAnimatePresence>


        {/* Calendar Modal - Using Dialog for proper scroll lock */}
        <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
            <DialogHeader className="p-4 border-b flex-shrink-0">
              <DialogTitle>Book Your Impact Conversation</DialogTitle>
            </DialogHeader>
            <div 
              className="flex-1 overflow-y-auto overscroll-contain"
              style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
            >
              <GHLBookingWidget
                leadData={{
                  name: session?.name,
                  email: session?.email,
                  company: session?.company,
                  phone: capturedPhone || undefined,
                }}
                sourceData={{
                  source: "website",
                  medium: "personalization_flow",
                  campaign: "personalized_results",
                  content: session?.industry || "results",
                }}
                qualificationData={{
                  industry: session?.industry,
                  size: session?.team_size,
                  timeline: session?.timeline,
                  challenge: session?.primary_challenge,
                }}
                height={1000}
                variant="inline"
              />
            </div>
          </DialogContent>
        </Dialog>
      </main>
      
      <Footer />
    </div>
  );
}
