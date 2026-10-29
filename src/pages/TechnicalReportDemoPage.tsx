import { useState, useCallback, useEffect, Suspense } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { ArrowLeft, ExternalLink, GitBranch, AlertTriangle } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/layout/Header";
import { MinimalFooter } from "@/components/layout/MinimalFooter";
import ErrorBoundary from "@/components/ErrorBoundary";
import { DemoFooter } from "@/components/demos/DemoFooter";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DemoLeadCaptureModal } from "@/components/demos/DemoLeadCaptureModal";
import { shouldBypassLeadCapture, logSilentDemoAccess } from "@/components/demos/demoLeadAccess";
import { DemoSpeedProvider } from "@/contexts/DemoSpeedProvider";


// Demo components
import { DemoIntroModal } from "@/components/demos/technical-report/DemoIntroModal";
import { DemoTutorialOverlay } from "@/components/demos/technical-report/DemoTutorialOverlay";
import { MobileWarningBanner } from "@/components/demos/technical-report/MobileWarningBanner";
import { MobilePanelNavigation } from "@/components/demos/technical-report/MobilePanelNavigation";
import { StepProgressBar } from "@/components/demos/technical-report/StepProgressBar";
import { ReportPreviewPanel } from "@/components/demos/technical-report/ReportPreviewPanel";
import { ProfessionalRoleSelector } from "@/components/demos/technical-report/ProfessionalRoleSelector";
import { VersionControlPanel } from "@/components/demos/technical-report/VersionControlPanel";
import { ReportPreviewModal } from "@/components/demos/technical-report/ReportPreviewModal";

// Step components
import DataSourcesStep from "@/components/demos/technical-report/DataSourcesStep";
import IngestionStep from "@/components/demos/technical-report/IngestionStep";
import PatternAnalysisStep from "@/components/demos/technical-report/PatternAnalysisStep";
import ComplianceCheckStep from "@/components/demos/technical-report/ComplianceCheckStep";
import ReportGenerationStep from "@/components/demos/technical-report/ReportGenerationStep";

// Data and hooks
import { useTechnicalReportTutorial } from "@/hooks/useTechnicalReportTutorial";
import {
  REPORT_STEPS,
  MOCK_REPORT_VERSIONS,
  PROFESSIONAL_ROLES,
  getDataForRole,
} from "@/components/demos/technical-report/demoData";
import { demos } from "@/pages/resources/demosData";

// Error Fallback Component
function DemoErrorFallback() {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto">
          <span className="text-2xl">⚠️</span>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Demo Unavailable</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Something went wrong loading this demo.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Refresh Page
          </button>
          <a
            href={`mailto:support@alfredai.bot?subject=Demo%20Error&body=Page:%20${encodeURIComponent(window.location.href)}`}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted"
          >
            Report Issue
          </a>
        </div>
      </div>
    </div>
  );
}

function TechnicalReportDemoPageContent() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const tutorial = useTechnicalReportTutorial();

  // Only show lead capture for external/shared link visitors
  const isInternalNavigation = !!(location.state as any)?.fromInternal || new URLSearchParams(location.search).get('ref') === 'internal';
  const [showLeadCapture, setShowLeadCapture] = useState(() => 
    !isInternalNavigation && !shouldBypassLeadCapture()
  );

  // Step state
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stepProgress, setStepProgress] = useState(0);
  const [demoComplete, setDemoComplete] = useState(false);

  // Role state
  const [selectedRole, setSelectedRole] = useState("engineers");
  const [showRoleChangeWarning, setShowRoleChangeWarning] = useState(false);
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  
  // Get role-specific data
  const roleData = getDataForRole(selectedRole);
  
  // Data state - initialized with role-specific sources
  const [dataSources, setDataSources] = useState(roleData.dataSources);
  const [currentVersion, setCurrentVersion] = useState("2.0");
  
  // Handle role change - warn if demo has progressed
  const handleRoleChange = useCallback((newRole: string) => {
    if (currentStep > 0 || stepProgress > 0) {
      setPendingRole(newRole);
      setShowRoleChangeWarning(true);
    } else {
      setSelectedRole(newRole);
    }
  }, [currentStep, stepProgress]);

  // Confirm role change and restart demo
  const confirmRoleChange = useCallback(() => {
    if (pendingRole) {
      setSelectedRole(pendingRole);
      setCurrentStep(0);
      setStepProgress(0);
      setIsPlaying(false);
      setDemoComplete(false);
      const newRoleData = getDataForRole(pendingRole);
      setDataSources(newRoleData.dataSources);
    }
    setShowRoleChangeWarning(false);
    setPendingRole(null);
  }, [pendingRole]);

  // Cancel role change
  const cancelRoleChange = useCallback(() => {
    setShowRoleChangeWarning(false);
    setPendingRole(null);
  }, []);
  
  // Log silent access for returning visitors
  useEffect(() => {
    if (!showLeadCapture && shouldBypassLeadCapture()) {
      logSilentDemoAccess("technical-report-agent", "Technical Report AI Demo");
    }
  }, [showLeadCapture]);
  
  // Update data sources when role changes
  useEffect(() => {
    const newRoleData = getDataForRole(selectedRole);
    setDataSources(newRoleData.dataSources);
  }, [selectedRole]);

  // Modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [showVersionPanel, setShowVersionPanel] = useState(false);

  // Mobile panel state - now 2 panels
  const [activePanel, setActivePanel] = useState<'inputs' | 'report'>('inputs');

  const isLastStep = currentStep === REPORT_STEPS.length - 1;

  // Toggle data source
  const handleToggleSource = useCallback((id: string) => {
    setDataSources(prev =>
      prev.map(source =>
        source.id === id ? { ...source, selected: !source.selected } : source
      )
    );
  }, []);

  // Register callback so tutorial navigation controls the demo
  useEffect(() => {
    tutorial.setOnAdvanceDemo((nextDemoStep: number) => {
      if (nextDemoStep >= 0 && nextDemoStep <= 4) {
        setCurrentStep(nextDemoStep);
        setStepProgress(0);
      }
    });
  }, [tutorial]);

  // Advance step
  const advanceStep = useCallback(() => {
    if (currentStep < REPORT_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      setStepProgress(0);
    } else {
      setDemoComplete(true);
      setIsPlaying(false);
      // Auto-open report modal when complete
      setShowReportModal(true);
    }
  }, [currentStep]);

  // Autoplay logic
  useEffect(() => {
    if (!isPlaying) return;

    const currentStepData = REPORT_STEPS[currentStep];
    if (!currentStepData) {
      setIsPlaying(false);
      return;
    }

    const progressInterval = setInterval(() => {
      setStepProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 100 / (currentStepData.duration / 50);
      });
    }, 50);

    const stepTimeout = setTimeout(() => {
      advanceStep();
    }, currentStepData.duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stepTimeout);
    };
  }, [isPlaying, currentStep, advanceStep]);

  // Auto-complete progress on report step (step 5)
  useEffect(() => {
    if (currentStep === 4 && stepProgress < 100) {
      // Auto-animate progress to 100% on report step
      const autoProgressInterval = setInterval(() => {
        setStepProgress(prev => {
          if (prev >= 100) {
            clearInterval(autoProgressInterval);
            return 100;
          }
          return prev + 5;
        });
      }, 100);

      return () => clearInterval(autoProgressInterval);
    }
  }, [currentStep, stepProgress]);

  // Handle step click
  const handleStepClick = useCallback((stepIndex: number) => {
    setCurrentStep(stepIndex);
    setStepProgress(0);
    setDemoComplete(false);
  }, []);

  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  // Handle step action - runs progress animation then advances
  const handleStepAction = useCallback(() => {
    setIsPlaying(false);
    
    // Run a quick progress animation to 100%
    let progress = stepProgress;
    const animationInterval = setInterval(() => {
      progress += 10;
      setStepProgress(Math.min(progress, 100));
      if (progress >= 100) {
        clearInterval(animationInterval);
        setTimeout(() => advanceStep(), 200);
      }
    }, 80);
  }, [stepProgress, advanceStep]);

  // Handle open report - ensures progress is complete then opens modal
  const handleOpenReport = useCallback(() => {
    setIsPlaying(false);
    if (stepProgress >= 80) {
      setShowReportModal(true);
    } else {
      // Run quick animation to 100% then open
      let progress = stepProgress;
      const animationInterval = setInterval(() => {
        progress += 10;
        setStepProgress(Math.min(progress, 100));
        if (progress >= 100) {
          clearInterval(animationInterval);
          setTimeout(() => setShowReportModal(true), 200);
        }
      }, 80);
    }
  }, [stepProgress]);

  // Handle reset
  const handleReset = useCallback(() => {
    setCurrentStep(0);
    setStepProgress(0);
    setIsPlaying(false);
    setDataSources(getDataForRole(selectedRole).dataSources);
    setDemoComplete(false);
  }, [selectedRole]);

  // Handle booking
  const handleBookDemo = useCallback(() => {
    window.location.href = 'https://new.alfredai.bot/book';
  }, []);

  // Handle demo selection
  const handleSelectDemo = useCallback((demoId: string) => {
    window.location.href = `/resources/demos/${demoId}`;
  }, []);

  // Render step content (left panel - merged sources + actions)
  const renderStepContent = () => {
    const step = REPORT_STEPS[currentStep];
    const selectedSourcesCount = dataSources.filter(s => s.selected).length;
    
    switch (step?.id) {
      case 'sources':
        return (
          <div id="tr-source-selector" className="space-y-4">
            <DataSourcesStep
              dataSources={dataSources}
              onToggleSource={handleToggleSource}
            />
            <Button 
              onClick={advanceStep} 
              className="w-full gap-2 min-h-[44px]"
              disabled={selectedSourcesCount === 0}
            >
              Start Extraction ({selectedSourcesCount} selected)
            </Button>
          </div>
        );
      case 'ingestion':
        return (
          <div id="tr-ingestion-panel" className="space-y-4">
            <IngestionStep
              extractedData={roleData.extractedData}
              progress={stepProgress}
            />
            <Button 
              onClick={handleStepAction} 
              className="w-full gap-2 min-h-[44px]"
            >
              Analyze Patterns
            </Button>
          </div>
        );
      case 'patterns':
        return (
          <div id="tr-pattern-panel" className="space-y-4">
            <PatternAnalysisStep
              patterns={roleData.patterns}
              progress={stepProgress}
            />
            <Button onClick={advanceStep} className="w-full gap-2 min-h-[44px]">
              Check Compliance
            </Button>
          </div>
        );
      case 'compliance':
        return (
          <div id="tr-compliance-panel" className="space-y-4">
            <ComplianceCheckStep
              complianceItems={roleData.compliance}
              progress={stepProgress}
            />
            <Button onClick={advanceStep} className="w-full gap-2 min-h-[44px]">
              Generate Report
            </Button>
          </div>
        );
      case 'report':
        return (
          <div id="tr-report-preview" className="space-y-4">
            <ReportGenerationStep
              reportSections={roleData.reportSections}
              progress={stepProgress}
            />
            <div className="flex gap-2">
              <Button 
                onClick={handleOpenReport} 
                className="flex-1 gap-2 min-h-[44px]"
              >
                <ExternalLink className="w-4 h-4" />
                Open Full Report
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowVersionPanel(!showVersionPanel)}
                className="gap-2 min-h-[44px]"
              >
                <GitBranch className="w-4 h-4" />
              </Button>
            </div>
            {showVersionPanel && (
              <VersionControlPanel
                currentVersion={currentVersion}
                onVersionSelect={setCurrentVersion}
                onCompare={() => {}}
                onRestore={() => {}}
              />
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      
      <SEO
        title="AI Technical Report Agent Demo | alfred ai"
        description="Experience AI-powered technical report generation for engineers, certifiers, and consultants. Automate compliance reports with data ingestion, pattern analysis, and integrated workflows."
      />

      <Header />

      <main className="flex-1 container mx-auto px-4 pt-20 pb-6 max-w-7xl">
        {/* Header with Back + Role Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 relative z-10">
          <Link
            to="/resources/demos"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Demos
          </Link>

          <div className="flex items-center gap-3">
            <ProfessionalRoleSelector
              selectedRole={selectedRole}
              onRoleChange={handleRoleChange}
            />
            <Badge variant="outline" className="text-xs hidden sm:flex">
              v{currentVersion} {MOCK_REPORT_VERSIONS.find(v => v.version === currentVersion)?.status}
            </Badge>
          </div>
        </div>

        <ErrorBoundary fallback={<DemoErrorFallback />}>
          <Suspense fallback={<div className="min-h-[600px] animate-pulse bg-muted/50 rounded-xl" />}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Mobile Warning */}
              <MobileWarningBanner />

              {/* Step Progress Bar */}
              <StepProgressBar
                currentStep={currentStep}
                stepProgress={stepProgress}
                isPlaying={isPlaying}
                onStepClick={handleStepClick}
                onPlayPause={handlePlayPause}
                onReset={handleReset}
              />

              {/* Main content area */}
              {isMobile ? (
                /* Mobile: 2 panel swipe navigation */
                <div className="h-[500px]">
                  <MobilePanelNavigation
                    activePanel={activePanel}
                    onPanelChange={setActivePanel}
                  >
                    {{
                      inputs: (
                        <div className="h-full overflow-y-auto pb-4 bg-card border border-border rounded-xl p-4">
                          {renderStepContent()}
                        </div>
                      ),
                      report: (
                        <ReportPreviewPanel
                          currentStep={currentStep}
                          stepProgress={stepProgress}
                          selectedRole={selectedRole}
                        />
                      ),
                    }}
                  </MobilePanelNavigation>
                </div>
              ) : (
                /* Desktop: 2-column layout (40% / 60%) */
                <div className="grid grid-cols-5 gap-4 min-h-[600px]">
                  {/* Left column: Step content + actions (40%) */}
                  <div className="col-span-2 bg-card border border-border rounded-xl p-4 overflow-y-auto">
                    {renderStepContent()}
                  </div>

                  {/* Right column: Report preview (60%) */}
                  <div className="col-span-3">
                    <ReportPreviewPanel
                      currentStep={currentStep}
                      stepProgress={stepProgress}
                      selectedRole={selectedRole}
                    />
                  </div>
                </div>
              )}

              {/* Demo Footer */}
              <DemoFooter
                currentDemoId="technical-report-agent"
                demos={demos}
                onBookDemo={handleBookDemo}
                onSelectDemo={handleSelectDemo}
                demoCompleted={demoComplete}
              />
            </motion.div>
          </Suspense>
        </ErrorBoundary>
      </main>

      <MinimalFooter />

      {/* Tutorial Overlay */}
      <DemoTutorialOverlay tutorial={tutorial} />

      {/* Lead Capture Modal - shows first for new visitors */}
      <DemoLeadCaptureModal
        isOpen={showLeadCapture}
        onClose={() => setShowLeadCapture(false)}
        onSuccess={() => setShowLeadCapture(false)}
        demoId="technical-report-agent"
        demoTitle="Technical Report Agent"
      />

      {/* Intro Modal - shows after lead capture */}
      <DemoIntroModal
        isOpen={!showLeadCapture && tutorial.showIntroModal}
        onDismiss={tutorial.dismissIntro}
      />

      {/* Full Report Modal */}
      <ReportPreviewModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        selectedRole={selectedRole}
      />

      {/* Role Change Warning Dialog */}
      <AnimatePresence>
        {showRoleChangeWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={cancelRoleChange}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Change Role?</h3>
                  <p className="text-xs text-muted-foreground">This will restart the demo</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Switching roles requires restarting the demo to show role-specific data sources, compliance standards, and report formats.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={cancelRoleChange} className="flex-1 min-h-[44px]">
                  Cancel
                </Button>
                <Button onClick={confirmRoleChange} className="flex-1 min-h-[44px]">
                  Restart Demo
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TechnicalReportDemoPage() {
  return (
    <DemoSpeedProvider>
      <TechnicalReportDemoPageContent />
    </DemoSpeedProvider>
  );
}
