import { useState, useCallback, useMemo } from "react";
import { 
  generateVendors, 
  generateIncomingDocuments, 
  generateEmails,
  getBatchStats,
  ComplianceVendor,
  IncomingDocument,
  IncomingEmail
} from "./vendorComplianceData";
import { DocumentQueue } from "./DocumentQueue";
import { DocumentDetailPanel } from "./DocumentDetailPanel";
import { AIVerificationPanel } from "./AIVerificationPanel";
import { BatchStatsHeader } from "./BatchStatsHeader";
import { VendorDashboard } from "./VendorDashboard";
import { EmailInboxPreview } from "./EmailInboxPreview";
import { OutreachPanel } from "./OutreachPanel";
import { SharePointSync } from "./SharePointSync";
import { InitialSyncOverlay } from "./InitialSyncOverlay";
import { DemoIntroModal } from "./DemoIntroModal";
import { DemoTutorialOverlay } from "./DemoTutorialOverlay";

import { MobileDocumentDrawer } from "./MobileDocumentDrawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { toast } from "sonner";
import { Inbox, LayoutGrid, Send, Cloud } from "lucide-react";
import { useVendorComplianceTutorial } from "@/hooks/useVendorComplianceTutorial";
import { useIsMobile } from "@/hooks/use-mobile";

export function VendorComplianceDemo() {
  // Mobile detection
  const isMobile = useIsMobile();
  
  // Tutorial system
  const tutorial = useVendorComplianceTutorial();
  
  // Initial sync state - show overlay first
  const [isInitialSyncing, setIsInitialSyncing] = useState(() => {
    // Skip if already seen in this session
    return sessionStorage.getItem('vendor-compliance-sync-skipped') !== 'true';
  });

  // Deferred data generation - empty until sync completes
  const [vendors, setVendors] = useState<ComplianceVendor[]>([]);
  const [incomingDocuments, setIncomingDocuments] = useState<IncomingDocument[]>([]);
  const [emails, setEmails] = useState<IncomingEmail[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<IncomingDocument | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("inbox");
  
  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Handle sync completion - generate data
  const handleSyncComplete = useCallback(() => {
    const newVendors = generateVendors(50);
    const newDocs = generateIncomingDocuments(newVendors, 25);
    const newEmails = generateEmails(newVendors, 15);
    
    setVendors(newVendors);
    setIncomingDocuments(newDocs);
    setEmails(newEmails);
    setSelectedDocument(newDocs[0] || null);
    setIsInitialSyncing(false);
    
    toast.success("AI Agent ready — 247 vendors, 25 documents in queue");
  }, []);

  const stats = useMemo(() => getBatchStats(vendors), [vendors]);

  const handleRefresh = useCallback(() => {
    const newVendors = generateVendors(50);
    const newDocs = generateIncomingDocuments(newVendors, 25);
    setVendors(newVendors);
    setIncomingDocuments(newDocs);
    setSelectedDocument(newDocs[0] || null);
    toast.success("Data refreshed with new vendors and documents");
  }, []);

  const updateDocumentStatus = useCallback((docId: string, newStatus: IncomingDocument["status"]) => {
    setIncomingDocuments(prev => 
      prev.map(d => d.id === docId ? { ...d, status: newStatus } : d)
    );
    setSelectedDocument(prev => 
      prev?.id === docId ? { ...prev, status: newStatus } : prev
    );
  }, []);

  const handleApprove = useCallback((doc: IncomingDocument) => {
    setIsProcessing(true);
    setTimeout(() => {
      updateDocumentStatus(doc.id, "verified");
      toast.success(`${doc.attachment_name} verified and approved`);
      setIsProcessing(false);
    }, 800);
  }, [updateDocumentStatus]);

  const handleReject = useCallback((doc: IncomingDocument) => {
    setIsProcessing(true);
    setTimeout(() => {
      updateDocumentStatus(doc.id, "rejected");
      toast.info(`${doc.attachment_name} rejected`);
      setIsProcessing(false);
    }, 500);
  }, [updateDocumentStatus]);

  const handleRequestUpdate = useCallback((doc: IncomingDocument, channel: "email" | "sms" | "voice") => {
    toast.success(`Update request sent via ${channel.toUpperCase()} to ${doc.matched_vendor?.contact_name || "vendor"}`);
  }, []);

  const handleSyncToSharePoint = useCallback((doc: IncomingDocument) => {
    toast.success(`${doc.attachment_name} synced to SharePoint`);
  }, []);

  // Check if document is eligible for auto-verify (ALL field confidences ≥90%)
  const isEligibleForAutoVerify = useCallback((doc: IncomingDocument): boolean => {
    const extraction = doc.extraction_result;
    if (!extraction) return false;
    
    // All required fields must be ≥90% confidence
    const { vendor_name, expiry_date, policy_number, coverage } = extraction.field_confidence;
    const allFieldsHighConfidence = 
      vendor_name >= 90 && 
      expiry_date >= 90 && 
      policy_number >= 90 && 
      coverage >= 90;
    
    return (
      allFieldsHighConfidence &&
      extraction.issues.length === 0 &&
      doc.status !== "verified" &&
      doc.status !== "rejected"
    );
  }, []);

  const handleBatchProcess = useCallback(() => {
    setIsProcessing(true);
    const eligible = incomingDocuments.filter(isEligibleForAutoVerify);
    
    if (eligible.length === 0) {
      toast.info("No documents with all fields ≥90% confidence to auto-verify");
      setIsProcessing(false);
      return;
    }

    let processed = 0;
    eligible.forEach((doc, idx) => {
      setTimeout(() => {
        updateDocumentStatus(doc.id, "verified");
        processed++;
        if (processed === eligible.length) {
          toast.success(`${eligible.length} documents auto-verified (all checks ≥90%)`);
          setIsProcessing(false);
        }
      }, (idx + 1) * 150);
    });
  }, [incomingDocuments, updateDocumentStatus, isEligibleForAutoVerify]);

  const handleSendReminders = useCallback(() => {
    toast.success("Reminder campaign initiated");
  }, []);

  const handleSyncAll = useCallback(() => {
    const verified = incomingDocuments.filter(d => d.status === "verified");
    if (verified.length === 0) {
      toast.info("No verified documents to sync");
      return;
    }
    toast.success(`${verified.length} documents synced to SharePoint`);
  }, [incomingDocuments]);

  // Mobile document selection handler - must be before early return
  const handleMobileDocumentSelect = useCallback((doc: IncomingDocument) => {
    setSelectedDocument(doc);
    if (isMobile) {
      setMobileDrawerOpen(true);
    }
  }, [isMobile]);

  // Show sync overlay first
  if (isInitialSyncing) {
    return (
      <InitialSyncOverlay 
        isActive={isInitialSyncing}
        onComplete={handleSyncComplete}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-2">
      {/* Header Stats */}
      <div className="shrink-0">
        <BatchStatsHeader
          stats={stats}
          incomingCount={incomingDocuments.length}
          onRefresh={handleRefresh}
          onBatchProcess={handleBatchProcess}
          onSendReminders={handleSendReminders}
          onSyncAll={handleSyncAll}
          isProcessing={isProcessing}
        />
      </div>

      {/* Main Tabs - Bottom navigation on mobile */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        {/* Desktop: Top tabs */}
        <TabsList className="hidden lg:inline-flex w-auto shrink-0">
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox className="w-4 h-4" />
            <span>Inbox</span>
          </TabsTrigger>
          <TabsTrigger value="dashboard" id="vc-tab-dashboard" className="gap-2">
            <LayoutGrid className="w-4 h-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="outreach" id="vc-tab-outreach" className="gap-2">
            <Send className="w-4 h-4" />
            <span>Outreach</span>
          </TabsTrigger>
          <TabsTrigger value="sync" id="vc-tab-sync" className="gap-2">
            <Cloud className="w-4 h-4" />
            <span>Sync</span>
          </TabsTrigger>
        </TabsList>

        {/* Inbox Tab - Document Processing */}
        <TabsContent value="inbox" className="flex-1 mt-2 min-h-0 overflow-hidden pb-16 lg:pb-0">
          {/* Mobile: Full-height document queue with drawer for details */}
          <div className="lg:hidden h-full">
            <DocumentQueue 
              documents={incomingDocuments}
              selectedId={selectedDocument?.id || null}
              onSelect={handleMobileDocumentSelect}
            />
          </div>
          
          {/* Desktop: Resizable panels */}
          <div className="hidden lg:block h-full">
            <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg">
              <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
                <div className="h-full overflow-hidden pr-1">
                  <DocumentQueue 
                    documents={incomingDocuments}
                    selectedId={selectedDocument?.id || null}
                    onSelect={setSelectedDocument}
                  />
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              <ResizablePanel defaultSize={45} minSize={30} maxSize={60}>
                <div className="h-full overflow-hidden px-1">
                  <DocumentDetailPanel document={selectedDocument} />
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              <ResizablePanel defaultSize={35} minSize={20} maxSize={45}>
                <div className="h-full overflow-hidden pl-1">
                  <AIVerificationPanel
                    document={selectedDocument}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onRequestUpdate={handleRequestUpdate}
                    onSyncToSharePoint={handleSyncToSharePoint}
                    isProcessing={isProcessing}
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </TabsContent>

        {/* Dashboard Tab - Vendor Overview */}
        <TabsContent value="dashboard" className="flex-1 mt-2 min-h-0 overflow-hidden pb-16 lg:pb-0">
          {/* Mobile: Single full-height view */}
          <div className="lg:hidden h-full">
            <VendorDashboard 
              vendors={vendors}
              onSelectVendor={(vendor) => toast.info(`Selected: ${vendor.name}`)}
            />
          </div>
          
          {/* Desktop: Resizable */}
          <div className="hidden lg:block h-full">
            <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg">
              <ResizablePanel defaultSize={65} minSize={40} maxSize={80}>
                <div className="h-full overflow-hidden pr-1">
                  <VendorDashboard 
                    vendors={vendors}
                    onSelectVendor={(vendor) => toast.info(`Selected: ${vendor.name}`)}
                  />
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              <ResizablePanel defaultSize={35} minSize={20} maxSize={60}>
                <div className="h-full overflow-hidden pl-1">
                  <EmailInboxPreview 
                    emails={emails}
                    onSelectEmail={(email) => toast.info(`Email from: ${email.from_name}`)}
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </TabsContent>

        {/* Outreach Tab - Reminder Campaigns */}
        <TabsContent value="outreach" className="flex-1 mt-2 min-h-0 overflow-hidden pb-16 lg:pb-0">
          {/* Mobile: Single view */}
          <div className="lg:hidden h-full">
            <OutreachPanel 
              vendors={vendors}
              onSendReminders={() => {}}
            />
          </div>
          
          {/* Desktop: Resizable */}
          <div className="hidden lg:block h-full">
            <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg">
              <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
                <div className="h-full overflow-hidden pr-1">
                  <OutreachPanel 
                    vendors={vendors}
                    onSendReminders={() => {}}
                  />
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
                <div className="h-full overflow-hidden pl-1">
                  <VendorDashboard 
                    vendors={vendors.filter(v => v.overall_status !== "compliant")}
                    onSelectVendor={(vendor) => toast.info(`Selected: ${vendor.name}`)}
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </TabsContent>

        {/* Sync Tab - SharePoint Integration */}
        <TabsContent value="sync" className="flex-1 mt-2 min-h-0 overflow-hidden pb-16 lg:pb-0">
          {/* Mobile: Single view */}
          <div className="lg:hidden h-full">
            <SharePointSync 
              documents={incomingDocuments}
              onSync={() => {}}
            />
          </div>
          
          {/* Desktop: Resizable */}
          <div className="hidden lg:block h-full">
            <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg">
              <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
                <div className="h-full overflow-hidden pr-1">
                  <SharePointSync 
                    documents={incomingDocuments}
                    onSync={() => {}}
                  />
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
                <div className="h-full overflow-hidden pl-1">
                  <DocumentQueue 
                    documents={incomingDocuments.filter(d => d.status === "verified")}
                    selectedId={null}
                    onSelect={() => {}}
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </TabsContent>

        {/* Mobile: Bottom Navigation Tabs */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border">
          <TabsList className="grid grid-cols-4 h-auto p-0 bg-transparent rounded-none">
            <TabsTrigger 
              value="inbox" 
              className="flex-col gap-1 py-3 min-h-[56px] rounded-none data-[state=active]:bg-muted/50"
            >
              <Inbox className="w-5 h-5" />
              <span className="text-[10px]">Inbox</span>
            </TabsTrigger>
            <TabsTrigger 
              value="dashboard" 
              id="vc-tab-dashboard-mobile"
              className="flex-col gap-1 py-3 min-h-[56px] rounded-none data-[state=active]:bg-muted/50"
            >
              <LayoutGrid className="w-5 h-5" />
              <span className="text-[10px]">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger 
              value="outreach" 
              id="vc-tab-outreach-mobile"
              className="flex-col gap-1 py-3 min-h-[56px] rounded-none data-[state=active]:bg-muted/50"
            >
              <Send className="w-5 h-5" />
              <span className="text-[10px]">Outreach</span>
            </TabsTrigger>
            <TabsTrigger 
              value="sync" 
              id="vc-tab-sync-mobile"
              className="flex-col gap-1 py-3 min-h-[56px] rounded-none data-[state=active]:bg-muted/50"
            >
              <Cloud className="w-5 h-5" />
              <span className="text-[10px]">Sync</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
      
      {/* Mobile Document Drawer */}
      <MobileDocumentDrawer
        document={selectedDocument}
        open={mobileDrawerOpen}
        onOpenChange={setMobileDrawerOpen}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestUpdate={handleRequestUpdate}
        onSyncToSharePoint={handleSyncToSharePoint}
        isProcessing={isProcessing}
      />
      
      {/* Tutorial Overlay */}
      <DemoTutorialOverlay tutorial={tutorial} />
      
      {/* Intro Modal - shows after sync animation */}
      <DemoIntroModal 
        isOpen={!isInitialSyncing && tutorial.showIntroModal}
        onDismiss={tutorial.dismissIntro}
      />
    </div>
  );
}

export default VendorComplianceDemo;
