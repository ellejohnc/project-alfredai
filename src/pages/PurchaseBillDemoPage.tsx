import { useState, useCallback, Suspense, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, HelpCircle, Mail, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import SEO from "@/components/SEO";
import Header from "@/components/layout/Header";
import MinimalFooter from "@/components/layout/MinimalFooter";
import { DemoFooter } from "@/components/demos/DemoFooter";
import { demos } from "@/pages/resources/demosData";
import { useChatContext } from "@/contexts/ChatContext";
import { Button } from "@/components/ui/button";
import ErrorBoundary from "@/components/ErrorBoundary";
import { DemoSkeleton } from "@/components/demos/DemoSkeleton";

import { 
  generateBillBatch, 
  getBatchStats, 
  PurchaseBill, 
  Industry 
} from "@/components/demos/purchase-bill/purchaseBillData";
import { BillQueue } from "@/components/demos/purchase-bill/BillQueue";
import { BillDetailPanel } from "@/components/demos/purchase-bill/BillDetailPanel";
import { AIAssistPanel } from "@/components/demos/purchase-bill/AIAssistPanel";
import { BatchStatsHeader } from "@/components/demos/purchase-bill/BatchStatsHeader";
import { StatusStepper } from "@/components/demos/purchase-bill/StatusStepper";
import { DemoTutorialOverlay } from "@/components/demos/purchase-bill/DemoTutorialOverlay";
import { XeroSyncPanel } from "@/components/demos/purchase-bill/XeroSyncPanel";
import { BatchApprovalModal } from "@/components/demos/purchase-bill/BatchApprovalModal";
import { IntegrationSyncPanel } from "@/components/demos/purchase-bill/IntegrationSyncPanel";
import { IntegrationBadges } from "@/components/demos/purchase-bill/IntegrationBadges";
import { PaymentForecastPanel } from "@/components/demos/purchase-bill/PaymentForecastPanel";
import { DuplicateDetectionPanel } from "@/components/demos/purchase-bill/DuplicateDetectionPanel";
import { Supplier360Panel } from "@/components/demos/purchase-bill/Supplier360Panel";
import { SupplierQueryEmailPanel } from "@/components/demos/purchase-bill/SupplierQueryEmailPanel";
import { DemoIntroModal } from "@/components/demos/purchase-bill/DemoIntroModal";
import { MobileWarningBanner } from "@/components/demos/purchase-bill/MobileWarningBanner";
import { MobilePanelNavigation } from "@/components/demos/purchase-bill/MobilePanelNavigation";
import { usePurchaseBillTutorial } from "@/hooks/usePurchaseBillTutorial";
import { useHaptics } from "@/hooks/useHaptics";
import { useIsMobile } from "@/hooks/use-mobile";
import { normalizeUrl } from "@/lib/siteConfig";
import { DemoLeadCaptureModal } from "@/components/demos/DemoLeadCaptureModal";
import { shouldBypassLeadCapture, logSilentDemoAccess } from "@/components/demos/demoLeadAccess";
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

function PurchaseBillDemoPageContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const { trigger: haptic } = useHaptics();
  const { openBooking } = useChatContext();
  
  // Lead capture gating - check for internal navigation, recent access, or Meta ads
  const isInternalNavigation = !!(location.state as any)?.fromInternal || searchParams.get('ref') === 'internal';
  const [showLeadCapture, setShowLeadCapture] = useState(() => 
    !isInternalNavigation && !shouldBypassLeadCapture()
  );
  
  // Demo state
  const [industry, setIndustry] = useState<Industry>("construction");
  const [bills, setBills] = useState<PurchaseBill[]>(() => generateBillBatch(industry, 15));
  const [selectedBill, setSelectedBill] = useState<PurchaseBill | null>(bills[0] || null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Mobile panel navigation
  const [activePanel, setActivePanel] = useState<'queue' | 'detail' | 'assist'>('queue');
  
  // Panel states
  const [showXeroSync, setShowXeroSync] = useState(false);
  const [syncingBill, setSyncingBill] = useState<PurchaseBill | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showIntegrationSync, setShowIntegrationSync] = useState(false);
  const [showPaymentForecast, setShowPaymentForecast] = useState(false);
  const [showDuplicateDetection, setShowDuplicateDetection] = useState(false);
  const [showSupplier360, setShowSupplier360] = useState(false);
  const [showQueryEmail, setShowQueryEmail] = useState(false);
  const [connectedPlatforms] = useState(['procore', 'sage300']);
  
  // Tutorial
  const tutorial = usePurchaseBillTutorial();
  
  // Log silent access for returning visitors
  useEffect(() => {
    if (!showLeadCapture && shouldBypassLeadCapture()) {
      logSilentDemoAccess("purchase-bill-intake", "Purchase Bill AI Demo");
    }
  }, [showLeadCapture]);
  
  const stats = getBatchStats(bills);

  const handleIndustryChange = useCallback((newIndustry: Industry) => {
    setIndustry(newIndustry);
    const newBills = generateBillBatch(newIndustry, 15);
    setBills(newBills);
    setSelectedBill(newBills[0] || null);
  }, []);

  const handleRefresh = useCallback(() => {
    const newBills = generateBillBatch(industry, 15);
    setBills(newBills);
    setSelectedBill(newBills[0] || null);
    toast.success("Bills refreshed with new data");
  }, [industry]);

  const updateBillStatus = useCallback((billId: string, newStatus: PurchaseBill["status"]) => {
    setBills(prev => prev.map(b => b.id === billId ? { ...b, status: newStatus } : b));
    setSelectedBill(prev => prev?.id === billId ? { ...prev, status: newStatus } : prev);
  }, []);

  const handleFreezeBill = useCallback((bill: PurchaseBill, reason?: string) => {
    setBills(prev => prev.map(b => 
      b.id === bill.id 
        ? { ...b, is_frozen: true, frozen_at: new Date(), frozen_reason: reason || 'Payment on hold' } 
        : b
    ));
    setSelectedBill(prev => 
      prev?.id === bill.id 
        ? { ...prev, is_frozen: true, frozen_at: new Date(), frozen_reason: reason || 'Payment on hold' } 
        : prev
    );
    haptic('medium'); // Medium haptic feedback for freeze
    toast.info(`${bill.invoice_number} frozen - payment on hold`);
  }, [haptic]);

  const handleUnfreezeBill = useCallback((bill: PurchaseBill) => {
    setBills(prev => prev.map(b => 
      b.id === bill.id 
        ? { ...b, is_frozen: false, frozen_at: undefined, frozen_reason: undefined } 
        : b
    ));
    setSelectedBill(prev => 
      prev?.id === bill.id 
        ? { ...prev, is_frozen: false, frozen_at: undefined, frozen_reason: undefined } 
        : prev
    );
    toast.success(`${bill.invoice_number} unfrozen - ready for payment`);
  }, []);

  const handleApprove = useCallback((bill: PurchaseBill) => {
    setIsProcessing(true);
    setTimeout(() => {
      updateBillStatus(bill.id, "approved");
      toast.success(`${bill.invoice_number} approved`);
      haptic('success'); // Success haptic feedback
      setIsProcessing(false);
    }, 800);
  }, [updateBillStatus, haptic]);

  const handleDelegate = useCallback((bill: PurchaseBill) => {
    toast.info(`${bill.invoice_number} delegated for review`);
  }, []);

  const handleQuery = useCallback((bill: PurchaseBill) => {
    setSyncingBill(bill);
    setShowQueryEmail(true);
  }, []);

  const handleSyncToXero = useCallback((bill: PurchaseBill) => {
    setSyncingBill(bill);
    setShowXeroSync(true);
  }, []);
  
  const handleXeroSyncComplete = useCallback((bill: PurchaseBill) => {
    updateBillStatus(bill.id, "synced");
    toast.success(`${bill.invoice_number} synced to Xero`);
    haptic('success'); // Success haptic on sync complete
    setShowXeroSync(false);
    setSyncingBill(null);
  }, [updateBillStatus, haptic]);

  const handleBatchProcess = useCallback(() => {
    setShowBatchModal(true);
  }, []);
  
  const handleBatchApprove = useCallback((selectedBillIds: string[]) => {
    setIsProcessing(true);
    setShowBatchModal(false);
    
    selectedBillIds.forEach((billId, idx) => {
      setTimeout(() => {
        updateBillStatus(billId, "approved");
        if (idx === selectedBillIds.length - 1) {
          toast.success(`${selectedBillIds.length} bills approved`);
          haptic('success'); // Success haptic on batch complete
          setIsProcessing(false);
        }
      }, (idx + 1) * 200);
    });
  }, [updateBillStatus, haptic]);

  // Handle status-based actions (extraction, matching, etc.)
  const handleStatusAction = useCallback((bill: PurchaseBill, action: string) => {
    setIsProcessing(true);
    const statusTransitions: Record<string, PurchaseBill["status"]> = {
      received: "extracted",
      extracted: "matched",
      matched: "needs_review",
      synced: "paid",
    };
    const nextStatus = statusTransitions[action];
    if (nextStatus) {
      setTimeout(() => {
        updateBillStatus(bill.id, nextStatus);
        toast.success(`${bill.invoice_number} moved to ${nextStatus.replace('_', ' ')}`);
        setIsProcessing(false);
      }, 1000);
    } else {
      setIsProcessing(false);
    }
  }, [updateBillStatus]);

  const handleOpenIntegration = useCallback((bill: PurchaseBill) => {
    setSyncingBill(bill);
    setShowIntegrationSync(true);
  }, []);
  return (
    <div className="min-h-screen bg-background flex flex-col">
      
      <SEO 
        fullTitle="AI Purchase Bill Intake Demo | alfred ai"
        description="Process subcontractor and supplier invoices with AI extraction, matching, discrepancy detection, and Xero sync. High-volume accounts payable with intelligent triage."
        path="/demos/purchase-bill-intake"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Resources", url: "/resources" },
          { name: "Demos", url: "/resources/demos" },
          { name: "AI Purchase Bill Intake", url: "/demos/purchase-bill-intake" }
        ]}
      />
      
      <Header />
      
      <main className="flex-1 pt-20 pb-8">
        <div className="container-wide">
          {/* Back Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
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
                className="flex flex-col gap-4"
              >
                {/* Mobile Warning Banner */}
                <MobileWarningBanner />
                <BatchStatsHeader
                  industry={industry}
                  onIndustryChange={handleIndustryChange}
                  stats={stats}
                  onRefresh={handleRefresh}
                  onBatchProcess={handleBatchProcess}
                  isProcessing={isProcessing}
                  onStartTutorial={tutorial.start}
                  onOpenPaymentForecast={() => setShowPaymentForecast(true)}
                  onOpenDuplicateDetection={() => setShowDuplicateDetection(true)}
                  onOpenSupplier360={() => setShowSupplier360(true)}
                />

                {selectedBill && (
                  <div id="pb-status-stepper" className="bg-card border border-border rounded-lg p-3">
                    <StatusStepper currentStatus={selectedBill.status} />
                  </div>
                )}

                {/* Mobile: Swipe Navigation */}
                {isMobile ? (
                  <div className="h-[500px]">
                    <MobilePanelNavigation
                      activePanel={activePanel}
                      onPanelChange={setActivePanel}
                      children={{
                        queue: (
                          <div id="pb-bill-queue" className="h-full">
                            <BillQueue bills={bills} selectedBillId={selectedBill?.id || null} onSelectBill={(bill) => {
                              setSelectedBill(bill);
                              setActivePanel('detail'); // Auto-navigate to details on selection
                            }} />
                          </div>
                        ),
                        detail: (
                          <div id="pb-detail-panel" className="h-full">
                            <BillDetailPanel bill={selectedBill} />
                          </div>
                        ),
                        assist: (
                          <div id="pb-ai-panel" className="h-full">
                            <AIAssistPanel
                              bill={selectedBill}
                              onApprove={handleApprove}
                              onDelegate={handleDelegate}
                              onQuery={handleQuery}
                              onSyncToXero={handleSyncToXero}
                              onStatusAction={handleStatusAction}
                              onOpenIntegration={handleOpenIntegration}
                              onOpenSupplier360={() => setShowSupplier360(true)}
                              onFreeze={handleFreezeBill}
                              onUnfreeze={handleUnfreezeBill}
                              isProcessing={isProcessing}
                            />
                          </div>
                        ),
                      }}
                    />
                  </div>
                ) : (
                  /* Desktop: 3-Column Grid */
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
                    <div id="pb-bill-queue" className="lg:col-span-4 h-[400px] lg:h-[600px]">
                      <BillQueue bills={bills} selectedBillId={selectedBill?.id || null} onSelectBill={setSelectedBill} />
                    </div>
                    <div id="pb-detail-panel" className="lg:col-span-4 h-[500px] lg:h-[600px]">
                      <BillDetailPanel bill={selectedBill} />
                    </div>
                    <div id="pb-ai-panel" className="lg:col-span-4 h-[450px] lg:h-[600px]">
                      <AIAssistPanel
                        bill={selectedBill}
                        onApprove={handleApprove}
                        onDelegate={handleDelegate}
                        onQuery={handleQuery}
                        onSyncToXero={handleSyncToXero}
                        onStatusAction={handleStatusAction}
                        onOpenIntegration={handleOpenIntegration}
                        onOpenSupplier360={() => setShowSupplier360(true)}
                        onFreeze={handleFreezeBill}
                        onUnfreeze={handleUnfreezeBill}
                        isProcessing={isProcessing}
                      />
                    </div>
                  </div>
                )}
                {/* Demo CTA Footer */}
                <DemoFooter
                  currentDemoId="purchase-bill-intake"
                  demos={demos}
                  onBookDemo={() => openBooking("page_cta")}
                  onSelectDemo={(demoId) => navigate(`/resources/demos?demo=${demoId}`)}
                />
              </motion.div>
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
      
      <MinimalFooter />
      
      {/* Tutorial Overlay */}
      <DemoTutorialOverlay tutorial={tutorial} />
      
      {/* Xero Sync Panel */}
      <XeroSyncPanel 
        isOpen={showXeroSync}
        onClose={() => { setShowXeroSync(false); setSyncingBill(null); }}
        bill={syncingBill}
        onSyncComplete={handleXeroSyncComplete}
      />
      
      {/* Batch Approval Modal */}
      <BatchApprovalModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        bills={bills}
        onApprove={handleBatchApprove}
      />
      
      {/* Integration Sync Panel */}
      <IntegrationSyncPanel
        isOpen={showIntegrationSync}
        onClose={() => { setShowIntegrationSync(false); setSyncingBill(null); }}
        bill={syncingBill}
        onSyncComplete={(bill, platform) => {
          toast.success(`Data synced from ${platform}`);
          setShowIntegrationSync(false);
          setSyncingBill(null);
        }}
      />
      
      {/* Payment Forecast Dashboard */}
      <PaymentForecastPanel
        isOpen={showPaymentForecast}
        onClose={() => setShowPaymentForecast(false)}
        bills={bills}
        availableFunds={stats.availableFunds}
      />
      
      {/* Duplicate Detection Panel */}
      <DuplicateDetectionPanel
        isOpen={showDuplicateDetection}
        onClose={() => setShowDuplicateDetection(false)}
        bills={bills}
        selectedBill={selectedBill}
      />
      
      {/* Supplier 360 View */}
      <Supplier360Panel
        isOpen={showSupplier360}
        onClose={() => setShowSupplier360(false)}
        bill={selectedBill}
        bills={bills}
      />
      
      {/* Supplier Query Email */}
      <SupplierQueryEmailPanel
        isOpen={showQueryEmail}
        onClose={() => { setShowQueryEmail(false); setSyncingBill(null); }}
        bill={syncingBill}
      />
      
      {/* Lead Capture Modal - shows first for new visitors */}
      <DemoLeadCaptureModal
        isOpen={showLeadCapture}
        onClose={() => setShowLeadCapture(false)}
        onSuccess={() => setShowLeadCapture(false)}
        demoId="purchase-bill-intake"
        demoTitle="Purchase Bill Intake"
      />
      
      {/* Demo Introduction Modal - shows after lead capture */}
      <DemoIntroModal 
        isOpen={!showLeadCapture && tutorial.showIntroModal}
        onDismiss={tutorial.dismissIntro}
      />
    </div>
  );
}

export default function PurchaseBillDemoPage() {
  return (
    <DemoSpeedProvider>
      <PurchaseBillDemoPageContent />
    </DemoSpeedProvider>
  );
}
