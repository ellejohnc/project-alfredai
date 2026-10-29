import { memo, useState, useCallback, useEffect, lazy, Suspense, useMemo } from 'react';
import { 
  Save, 
  Copy, 
  RotateCcw,
  Check,
  Loader2,
  ExternalLink,
  ClipboardCheck,
  ChevronRight,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PricingResult, formatCurrency } from '@/lib/pricingEngine';
import { ROICalculation } from '@/lib/roiScenarios';
import { QuoteFormData } from '@/hooks/useQuoteBuilder';
import { RegionCurrency } from '@/hooks/useRegionCurrency';
import { StepLabel } from './StepLabel';
import { SalesRepInput } from './SalesRepInput';
import { PaymentLinkConfigurator } from './PaymentLinkConfigurator';
import { ResetPaymentLinksDialog } from './ResetPaymentLinksDialog';
import { ProposalReviewModal } from './ProposalReviewModal';
import { ProposalFlowSteps, ProposalFlowStep } from './ProposalFlowSteps';
import { PaymentLinks } from '@/lib/generateQuotePDF';
import { PRODUCTION_URL } from '@/lib/siteConfig';
import { validateProposalData, ValidationResult } from '@/lib/validateProposalData';
import { cn } from '@/lib/utils';

// Lazy load PDF modal (heavy component with jspdf/html2canvas)
const PDFPreviewModal = lazy(() => import('./PDFPreviewModal').then(m => ({ default: m.PDFPreviewModal })));

interface VoiceAgentCosts {
  monthly: number;
  setup: number;
  planName?: string;
  workflowCount?: number;
}

interface InstallmentAmounts {
  depositAmount: number;
  initiation: number;
  month1: number;
  month2: number;
  month3: number;
}

interface QuoteActionsProps {
  pricing: PricingResult;
  roiCalculations: ROICalculation[];
  formData: QuoteFormData;
  effectivePricingOption: 'A' | 'A1' | 'B' | 'C';
  isSaving: boolean;
  voiceAgentCosts?: VoiceAgentCosts;
  loadedQuoteId?: string | null;
  loadedAccessCode?: string | null;
  savedQuoteId: string | null; // ID after save (for payment link generation)
  onSave: (salesRepName: string, options?: { isRegeneration?: boolean; changeSummary?: string }) => Promise<{ id: string | null; quoteId?: string; accessCode?: string } | null>;
  onReset: () => void;
  onToggleWorkflow: (workflowId: string) => void; // NEW: for human-in-the-loop workflow editing
  onUpdateFinalFees: (quoteDbId: string, setupFee: number, monthlyRetainer: number) => Promise<boolean>;
  // Payment link props
  includePaymentLinks: boolean;
  includeSlotReservation: boolean;
  setupFeeAmount: number;
  monthlyRetainerAmount: number;
  generatedLinks: PaymentLinks | null;
  generatedAmounts: { setupFee: number; monthlyRetainer: number } | null;
  installmentAmounts: InstallmentAmounts | null;
  isGeneratingLinks: boolean;
  generationError: string | null;
  hasPriceChanged: boolean;
  slotReservationOverride: number | null;
  effectiveSlotReservation: number;
  calculatedSlotReservation: number;
  onTogglePaymentLinks: (include: boolean) => void;
  onToggleSlotReservation: (include: boolean) => void;
  onSetupFeeChange: (amount: number) => void;
  onMonthlyRetainerChange: (amount: number) => void;
  onSlotReservationOverrideChange: (amount: number | null) => void;
  onGeneratePaymentLinks: (overrideSetupFee?: number, overrideMonthlyRetainer?: number, currency?: RegionCurrency) => void;
  onClearPaymentLinks: (silent?: boolean) => void;
  onContactEmailChange?: (email: string) => void;
}

export const QuoteActions = memo(function QuoteActions({
  pricing,
  roiCalculations,
  formData,
  effectivePricingOption,
  isSaving,
  voiceAgentCosts,
  loadedQuoteId,
  loadedAccessCode,
  savedQuoteId,
  onSave,
  onReset,
  onToggleWorkflow,
  onUpdateFinalFees,
  // Payment link props
  includePaymentLinks,
  includeSlotReservation,
  setupFeeAmount,
  monthlyRetainerAmount,
  generatedLinks,
  generatedAmounts,
  installmentAmounts,
  isGeneratingLinks,
  generationError,
  hasPriceChanged,
  slotReservationOverride,
  effectiveSlotReservation,
  calculatedSlotReservation,
  onTogglePaymentLinks,
  onToggleSlotReservation,
  onSetupFeeChange,
  onMonthlyRetainerChange,
  onSlotReservationOverrideChange,
  onGeneratePaymentLinks,
  onClearPaymentLinks,
  onContactEmailChange,
}: QuoteActionsProps) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [salesRepName, setSalesRepName] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [proposalInfo, setProposalInfo] = useState<{ quoteId?: string; accessCode?: string; showProposal?: boolean } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [localWorkflows, setLocalWorkflows] = useState<string[]>([]); // For tracking edits in review modal
  
  // Hydrate proposal info + sales rep from a loaded past quote so all steps
  // (URL, access code, share buttons) are pre-populated on next visit.
  useEffect(() => {
    if (loadedQuoteId) {
      setProposalInfo(prev => ({
        quoteId: loadedQuoteId,
        accessCode: loadedAccessCode || prev?.accessCode,
        showProposal: prev?.showProposal ?? true,
      }));
    }
  }, [loadedQuoteId, loadedAccessCode]);
  
  
  const hasVoiceAgent = voiceAgentCosts && (voiceAgentCosts.monthly > 0 || voiceAgentCosts.setup > 0);

  // Determine current step in proposal flow
  const currentFlowStep = useMemo((): ProposalFlowStep => {
    if (proposalInfo?.showProposal) return 'ready';
    if (generatedLinks && proposalInfo?.quoteId) return 'review';
    if (savedQuoteId) return 'payment-links';
    return 'save';
  }, [savedQuoteId, generatedLinks, proposalInfo]);

  const handleCopy = useCallback(async () => {
    const conservative = roiCalculations.find(r => r.scenario.type === 'conservative');
    const likely = roiCalculations.find(r => r.scenario.type === 'likely');
    const best = roiCalculations.find(r => r.scenario.type === 'best');

    let voiceAgentSection = '';
    if (hasVoiceAgent) {
      const vaWorkflowCount = voiceAgentCosts?.workflowCount || 1;
      voiceAgentSection = `
Voice Agent${voiceAgentCosts?.planName ? ` (${voiceAgentCosts.planName})` : ''}
-----------
Setup Fee: ${formatCurrency(voiceAgentCosts?.setup || 0)} ($2,500 per workflow × ${vaWorkflowCount} workflow${vaWorkflowCount !== 1 ? 's' : ''})
Monthly Fee: ${formatCurrency(voiceAgentCosts?.monthly || 0)}/month
`;
    }

    const quoteText = `
alfred ai Quote Summary
======================

Client: ${formData.companyName || 'TBD'}
Contact: ${formData.contactName || 'TBD'}
Industry: ${pricing.industry.name}
Team Size: ${formData.teamSize} staff
AI Agents: ${formData.workflows.length || 1}

Investment Estimate (excl. GST/tax)
-----------------------------------
Setup Fee: ${formatCurrency(pricing.setupRange.min)} - ${formatCurrency(pricing.setupRange.max)}
Monthly Retainer: ${formatCurrency(pricing.monthlyRange.min)} - ${formatCurrency(pricing.monthlyRange.max)}/month
First Year Total: ${formatCurrency(pricing.annualRange.min)} - ${formatCurrency(pricing.annualRange.max)}
${voiceAgentSection}
ROI Scenarios
-------------
Guaranteed: ${formatCurrency(conservative?.annualSavings || 0)}/yr savings, ${conservative?.roiPercentage || 0}% ROI, ${conservative?.paybackMonths || 0} month payback
Most Likely: ${formatCurrency(likely?.annualSavings || 0)}/yr savings, ${likely?.roiPercentage || 0}% ROI, ${likely?.paybackMonths || 0} month payback
Best Case: ${formatCurrency(best?.annualSavings || 0)}/yr savings, ${best?.roiPercentage || 0}% ROI, ${best?.paybackMonths || 0} month payback

Selected Workflows
------------------
${formData.workflows.length > 0 ? formData.workflows.join('\n') : 'N/A'}

Challenges Identified
---------------------
${formData.challenges.length > 0 ? formData.challenges.join('\n') : 'N/A'}

Timeline: ${formData.timeline}
Notes: ${formData.notes || 'None'}

Generated: ${new Date().toLocaleDateString()}
    `.trim();

    try {
      await navigator.clipboard.writeText(quoteText);
      setCopied(true);
      toast.success('Quote copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy. Please try again.');
    }
  }, [formData, pricing, roiCalculations, hasVoiceAgent, voiceAgentCosts]);

  const handleExportPDF = useCallback(async () => {
    if (!salesRepName.trim()) {
      toast.error('Please enter your name before exporting');
      return;
    }
    setIsExporting(true);
    try {
      // Use generated payment links if available, with confirmed amounts
      const paymentLinks = includePaymentLinks && generatedLinks ? {
        ...generatedLinks,
        setupFeeAmount: setupFeeAmount,
        monthlyRetainerAmount: monthlyRetainerAmount,
      } : undefined;
      
      // Dynamic import for PDF generation (heavy library)
      const { generateQuotePDF } = await import('@/lib/generateQuotePDF');
      await generateQuotePDF(
        formData,
        pricing,
        roiCalculations,
        effectivePricingOption,
        formData.sentiment,
        voiceAgentCosts,
        salesRepName.trim(),
        paymentLinks,
        proposalInfo || undefined
      );
      
      const linkCount = paymentLinks ? [paymentLinks.slotReservation, paymentLinks.setupFee, paymentLinks.monthlyRetainer].filter(Boolean).length : 0;
      const proposalNote = proposalInfo?.quoteId ? ' with proposal link' : '';
      toast.success('PDF exported successfully' + (linkCount > 0 ? ` with ${linkCount} payment link${linkCount > 1 ? 's' : ''}` : '') + proposalNote);
    } catch (err) {
      console.error('PDF export failed:', err);
      toast.error('Failed to export PDF. Please try copying instead.');
    } finally {
      setIsExporting(false);
    }
  }, [formData, pricing, roiCalculations, effectivePricingOption, voiceAgentCosts, salesRepName, includePaymentLinks, generatedLinks, setupFeeAmount, monthlyRetainerAmount, proposalInfo]);

  const handleSave = useCallback(async () => {
    if (!salesRepName.trim()) {
      toast.error('Please enter your name before saving');
      return;
    }
    const result = await onSave(salesRepName.trim());
    if (result?.quoteId && result?.accessCode) {
      setProposalInfo({ quoteId: result.quoteId, accessCode: result.accessCode });
    }
  }, [onSave, salesRepName]);

  const copyProposalUrl = useCallback(async () => {
    if (!proposalInfo?.quoteId) return;
    const url = `${PRODUCTION_URL}/proposal/${proposalInfo.quoteId}`;
    await navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    toast.success('Proposal URL copied');
    setTimeout(() => setCopiedUrl(false), 2000);
  }, [proposalInfo]);

  const copyAccessCode = useCallback(async () => {
    if (!proposalInfo?.accessCode) return;
    await navigator.clipboard.writeText(proposalInfo.accessCode);
    setCopiedCode(true);
    toast.success('Access code copied');
    setTimeout(() => setCopiedCode(false), 2000);
  }, [proposalInfo]);

  // Open review modal for human-in-the-loop validation
  const openReviewModal = useCallback(() => {
    // Initialize local workflows from current form data
    setLocalWorkflows([...formData.workflows]);
    
    // Run validation
    const result = validateProposalData({
      workflows: formData.workflows,
      customWorkflows: formData.customWorkflows,
      voice_agent_plan: formData.voiceAgent?.planId || null,
      industry: formData.industry,
      company_name: formData.companyName
    });
    setValidationResult(result);
    setShowReviewModal(true);
  }, [formData]);

  // Handle workflow removal in review modal
  const handleReviewRemoveWorkflow = useCallback((workflowId: string) => {
    // Update local state in modal
    setLocalWorkflows(prev => prev.filter(id => id !== workflowId));
    // Actually update the form data
    onToggleWorkflow(workflowId);
    // Re-validate with updated workflows
    const updatedWorkflows = localWorkflows.filter(id => id !== workflowId);
    const result = validateProposalData({
      workflows: updatedWorkflows,
      customWorkflows: formData.customWorkflows,
      voice_agent_plan: formData.voiceAgent?.planId || null,
      industry: formData.industry,
      company_name: formData.companyName
    });
    setValidationResult(result);
  }, [formData, localWorkflows, onToggleWorkflow]);

  // Handle workflow addition in review modal
  const handleReviewAddWorkflow = useCallback((workflowId: string) => {
    // Update local state in modal
    setLocalWorkflows(prev => [...prev, workflowId]);
    // Actually update the form data
    onToggleWorkflow(workflowId);
    // Re-validate with updated workflows
    const updatedWorkflows = [...localWorkflows, workflowId];
    const result = validateProposalData({
      workflows: updatedWorkflows,
      customWorkflows: formData.customWorkflows,
      voice_agent_plan: formData.voiceAgent?.planId || null,
      industry: formData.industry,
      company_name: formData.companyName
    });
    setValidationResult(result);
  }, [formData, localWorkflows, onToggleWorkflow]);

  // Confirm and generate URL after human review
  const handleConfirmProposal = useCallback(async () => {
    // Final validation check
    const result = validateProposalData({
      workflows: formData.workflows,
      customWorkflows: formData.customWorkflows,
      voice_agent_plan: formData.voiceAgent?.planId || null,
      industry: formData.industry,
      company_name: formData.companyName
    });
    
    if (result.isValid) {
      // Save the final fees to database before showing URL
      if (savedQuoteId && setupFeeAmount > 0 && monthlyRetainerAmount > 0) {
        const saved = await onUpdateFinalFees(savedQuoteId, setupFeeAmount, monthlyRetainerAmount);
        if (!saved) {
          toast.error('Failed to save fee changes. Please try again.');
          return;
        }
      }

      // Re-save the full quote so workflows, custom workflows and other edits
      // are persisted to the database AND the Past Quotes list is refreshed.
      if (salesRepName.trim()) {
        try {
          await onSave(salesRepName.trim(), {
            isRegeneration: true,
            changeSummary: `Proposal regenerated by ${salesRepName.trim()} at ${new Date().toISOString()}`,
          });
        } catch (e) {
          console.warn('Failed to re-save quote on proposal regeneration', e);
        }
      }
      
      setProposalInfo(prev => prev ? { ...prev, showProposal: true } : null);
      setShowReviewModal(false);
      toast.success('Proposal validated, saved and ready to share');
    } else {
      toast.error(`Still has ${result.discrepancies.length} issue(s) to fix`);
      setValidationResult(result);
    }
  }, [formData, savedQuoteId, setupFeeAmount, monthlyRetainerAmount, onUpdateFinalFees, onSave, salesRepName]);


  return (
    <div id="step-actions" className="space-y-5">
      <StepLabel 
        step={7} 
        title="Generate Proposal" 
        description={loadedQuoteId ? `Editing: ${loadedQuoteId}` : "Save quote, generate links, and share with client"}
      />
      
      {/* Progress Steps Indicator */}
      <ProposalFlowSteps
        currentStep={currentFlowStep}
        savedQuoteId={savedQuoteId}
        hasPaymentLinks={!!generatedLinks}
        isProposalReady={!!proposalInfo?.showProposal}
      />
      
      {/* STEP 1: Save Quote */}
      <div className={cn(
        "p-4 rounded-lg border transition-all",
        currentFlowStep === 'save' 
          ? "bg-card border-primary/30 shadow-sm" 
          : savedQuoteId 
            ? "bg-muted/30 border-muted" 
            : "bg-muted/20 border-muted opacity-60"
      )}>
        <div className="flex items-center gap-2 mb-3">
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
            savedQuoteId ? "bg-green-500 text-white" : "bg-primary text-primary-foreground"
          )}>
            {savedQuoteId ? <Check className="w-3.5 h-3.5" /> : '1'}
          </div>
          <span className="text-sm font-medium">Save Quote</span>
          {savedQuoteId && (
            <span className="text-xs text-green-600 ml-auto">✓ Saved</span>
          )}
        </div>
        
        <SalesRepInput value={salesRepName} onChange={setSalesRepName} />
        
        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            onClick={handleSave}
            disabled={isSaving || !salesRepName.trim()}
            className="flex-1 sm:flex-none gap-2 min-h-[44px]"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {savedQuoteId ? 'Update Quote' : 'Save Quote'}
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowResetDialog(true)}
            className="flex-1 sm:flex-none gap-2 min-h-[44px] border-destructive/50 hover:border-destructive hover:bg-destructive/5 text-destructive hover:text-destructive"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>
      </div>
      
      {/* STEP 2: Generate Payment Links */}
      <div className={cn(
        "rounded-lg border transition-all overflow-hidden",
        currentFlowStep === 'payment-links'
          ? "border-primary/30 shadow-sm" 
          : generatedLinks 
            ? "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20" 
            : "border-muted opacity-60"
      )}>
        <PaymentLinkConfigurator
          pricing={pricing}
          effectivePricingOption={effectivePricingOption}
          formData={formData}
          savedQuoteId={savedQuoteId}
          includePaymentLinks={includePaymentLinks}
          includeSlotReservation={includeSlotReservation}
          setupFeeAmount={setupFeeAmount}
          monthlyRetainerAmount={monthlyRetainerAmount}
          generatedLinks={generatedLinks}
          generatedAmounts={generatedAmounts}
          installmentAmounts={installmentAmounts}
          isGenerating={isGeneratingLinks}
          generationError={generationError}
          hasPriceChanged={hasPriceChanged}
          slotReservationOverride={slotReservationOverride}
          effectiveSlotReservation={effectiveSlotReservation}
          calculatedSlotReservation={calculatedSlotReservation}
          onToggleInclude={onTogglePaymentLinks}
          onToggleSlotReservation={onToggleSlotReservation}
          onSetupFeeChange={onSetupFeeChange}
          onMonthlyRetainerChange={onMonthlyRetainerChange}
          onSlotReservationOverrideChange={onSlotReservationOverrideChange}
          onGenerateLinks={onGeneratePaymentLinks}
          onClearLinks={onClearPaymentLinks}
        />
      </div>
      
      {/* STEP 3: Review & Generate URL */}
      {generatedLinks && proposalInfo?.quoteId && !proposalInfo?.showProposal && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-medium">
              3
            </div>
            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Review & Confirm Proposal
            </span>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-300 pl-8">
            Review all details before generating the client-facing URL. You can adjust fees or workflows if needed.
          </p>
          <Button
            onClick={openReviewModal}
            className="w-full gap-2 min-h-[44px]"
            variant="default"
          >
            <ClipboardCheck className="w-4 h-4" />
            Review & Generate Proposal URL
            <ChevronRight className="w-4 h-4 ml-auto" />
          </Button>
        </div>
      )}
      
      {/* STEP 4: Share with Client */}
      {proposalInfo?.quoteId && proposalInfo?.showProposal && (
        <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-green-800 dark:text-green-200">
              Proposal Ready — Share with Client
            </span>
          </div>
          
          <div className="space-y-3 pl-8">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground shrink-0">Proposal URL:</span>
              <code className="text-xs bg-white dark:bg-black/20 px-2 py-1.5 rounded font-mono flex-1 min-w-0 truncate text-green-700 dark:text-green-300 border">
                {PRODUCTION_URL}/proposal/{proposalInfo.quoteId}
              </code>
            </div>

            {/* Access Code Display */}
            {proposalInfo.accessCode && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground shrink-0">Access Code:</span>
                <code className="text-sm bg-white dark:bg-black/20 px-3 py-1.5 rounded font-mono font-bold tracking-widest text-green-700 dark:text-green-300 border">
                  {proposalInfo.accessCode}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyAccessCode}
                  className="h-8 px-2 min-h-[36px]"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            )}
            
            <div className="flex gap-2 flex-wrap">
              <Button 
                size="sm" 
                variant="outline"
                onClick={copyProposalUrl}
                className="flex-1 gap-2 min-h-[44px] bg-white dark:bg-transparent"
              >
                {copiedUrl ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copiedUrl ? 'Copied!' : 'Copy URL'}
              </Button>
              <a 
                href={`${PRODUCTION_URL}/proposal/${proposalInfo.quoteId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button size="sm" variant="default" className="w-full gap-2 min-h-[44px]">
                  <ExternalLink className="w-4 h-4" />
                  Open Proposal
                </Button>
              </a>
            </div>

            {/* Regenerate Proposal — re-open review modal to refresh proposal with latest fees/workflows */}
            <Button
              size="sm"
              variant="outline"
              onClick={openReviewModal}
              className="w-full gap-2 min-h-[44px] bg-white dark:bg-transparent border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
            >
              <RotateCcw className="w-4 h-4" />
              Regenerate Proposal
            </Button>
          </div>
          <p className="text-xs text-green-600 dark:text-green-400 pl-8">
            Client needs the access code above to view the proposal. Use <strong>Regenerate Proposal</strong> to refresh with the latest fees or workflow changes (payment links stay intact).
          </p>
        </div>
      )}

      {/* Fallback: Regenerate proposal review even when payment links missing/cleared */}
      {savedQuoteId && proposalInfo?.quoteId && !generatedLinks && (
        <div className="p-4 bg-muted/30 rounded-lg border border-dashed space-y-3">
          <p className="text-sm text-muted-foreground">
            Need to regenerate the proposal without touching payment links? You can re-open the review here.
          </p>
          <Button
            onClick={openReviewModal}
            variant="outline"
            className="w-full gap-2 min-h-[44px]"
          >
            <ClipboardCheck className="w-4 h-4" />
            Regenerate Proposal
          </Button>
        </div>
      )}
      
      {/* Reset Payment Links Dialog */}
      <ResetPaymentLinksDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        onConfirm={() => {
          try {
            // Clear generated payment links from hook state (silent mode - we show our own toast)
            onClearPaymentLinks(true);
            // Reset proposal URL state (requires regeneration)
            setProposalInfo(prev => prev ? { ...prev, showProposal: false } : null);
            toast.success('Payment links cleared. Regenerate to update proposal.');
          } catch (error) {
            console.error('Reset failed:', error);
            toast.error('Failed to reset. Please try again.');
          }
        }}
      />
      
      <Suspense fallback={null}>
        <PDFPreviewModal
          open={showPreview}
          onOpenChange={setShowPreview}
          formData={formData}
          pricing={pricing}
          roiCalculations={roiCalculations}
          effectivePricingOption={effectivePricingOption}
          voiceAgentCosts={voiceAgentCosts}
          salesRepName={salesRepName}
          onExport={handleExportPDF}
          isExporting={isExporting}
          paymentLinks={includePaymentLinks ? generatedLinks : undefined}
          proposalInfo={proposalInfo}
        />
      </Suspense>
      
      {/* Human-in-the-loop Review Modal */}
      <ProposalReviewModal
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        companyName={formData.companyName}
        contactName={formData.contactName}
        contactEmail={formData.contactEmail}
        industry={pricing.industry.name}
        workflows={formData.workflows}
        customWorkflows={formData.customWorkflows}
        voiceAgentPlan={formData.voiceAgent?.planId}
        setupFeeMin={pricing.setupRange.min}
        setupFeeMax={pricing.setupRange.max}
        monthlyMin={pricing.monthlyRange.min}
        monthlyMax={pricing.monthlyRange.max}
        setupFeeFinal={setupFeeAmount}
        monthlyFinal={monthlyRetainerAmount}
        teamSize={formData.teamSize}
        industryId={formData.industry}
        opsComplexity={formData.opsComplexity}
        pricingOption={effectivePricingOption}
        contractMonths={formData.contractMonths}
        includeSlotReservation={includeSlotReservation}
        effectiveSlotReservation={effectiveSlotReservation}
        discrepancies={validationResult?.discrepancies || []}
        generatedAmounts={generatedAmounts}
        installmentAmounts={installmentAmounts}
        generatedLinks={generatedLinks}
        onContactEmailChange={onContactEmailChange}
        isGeneratingLinks={isGeneratingLinks}
        onRegeneratePaymentLinks={(setupFee, monthlyFee) => onGeneratePaymentLinks(setupFee, monthlyFee)}
        onRemoveWorkflow={handleReviewRemoveWorkflow}
        onAddWorkflow={handleReviewAddWorkflow}
        onFeesChange={(setupFee, monthlyFee) => {
          onSetupFeeChange(setupFee);
          onMonthlyRetainerChange(monthlyFee);
        }}
        onConfirm={handleConfirmProposal}
      />
    </div>
  );
});
