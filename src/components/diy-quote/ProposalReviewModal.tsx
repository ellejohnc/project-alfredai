import { memo, useState, useMemo, useCallback, useEffect } from 'react';
import { 
  Check, 
  X, 
  AlertTriangle, 
  Trash2, 
  Plus, 
  RefreshCw,
  ChevronDown,
  Zap,
  Phone,
  DollarSign,
  Link,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { workflowDefinitions, WorkflowDefinition } from '@/lib/workflowDefinitions';
import { voiceAgentPlans, type CustomWorkflow } from '@/hooks/useQuoteBuilder';
import { Discrepancy } from '@/lib/validateProposalData';
import { calculateInvestment, formatCurrency } from '@/lib/pricingEngine';
import { cn } from '@/lib/utils';

interface ProposalReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
  contactName: string;
  contactEmail?: string;
  industry: string;
  workflows: string[];
  customWorkflows?: CustomWorkflow[];
  voiceAgentPlan?: string | null;
  setupFeeMin: number;
  setupFeeMax: number;
  monthlyMin: number;
  monthlyMax: number;
  setupFeeFinal?: number;
  monthlyFinal?: number;
  teamSize: number;
  industryId: string;
  opsComplexity?: string;
  pricingOption?: 'A' | 'A1' | 'B' | 'C';
  contractMonths?: number;
  includeSlotReservation?: boolean;
  effectiveSlotReservation?: number;
  discrepancies: Discrepancy[];
  generatedAmounts?: { setupFee: number; monthlyRetainer: number } | null;
  installmentAmounts?: { depositAmount: number; initiation: number; month1: number; month2: number; month3: number } | null;
  generatedLinks?: {
    slotReservation?: string;
    setupFee?: string;
    setupInitiation?: string;
    setupMonth1?: string;
    setupMonth2?: string;
    setupMonth3?: string;
    monthlyRetainer?: string;
  } | null;
  isGeneratingLinks?: boolean;
  onRegeneratePaymentLinks?: (overrideSetupFee: number, overrideMonthlyRetainer: number) => void;
  onRemoveWorkflow: (workflowId: string) => void;
  onAddWorkflow: (workflowId: string) => void;
  onFeesChange?: (setupFee: number, monthlyFee: number) => void;
  onContactEmailChange?: (email: string) => void;
  onConfirm: () => void;
}

// Compact Payment Link Row Component
const PaymentLinkRowCompact = memo(function PaymentLinkRowCompact({
  label,
  amount,
  url,
  suffix = '',
}: {
  label: string;
  amount: number;
  url: string;
  suffix?: string;
}) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-sm font-medium truncate">{label}</span>
        <span className="text-xs text-muted-foreground shrink-0">
          {formatCurrency(amount)}{suffix}
        </span>
      </div>
      <div className="flex gap-1 shrink-0">
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8 min-h-[44px] min-w-[44px]"
          onClick={handleCopy}
          aria-label={`Copy ${label} link`}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-600" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </Button>
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8 min-h-[44px] min-w-[44px]"
          onClick={() => window.open(url, '_blank')}
          aria-label={`Open ${label} link`}
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
});

export const ProposalReviewModal = memo(function ProposalReviewModal({
  open,
  onOpenChange,
  companyName,
  contactName,
  contactEmail,
  industry,
  workflows,
  customWorkflows = [],
  voiceAgentPlan,
  setupFeeMin,
  setupFeeMax,
  monthlyMin,
  monthlyMax,
  setupFeeFinal,
  monthlyFinal,
  teamSize,
  industryId,
  opsComplexity,
  pricingOption = 'A',
  contractMonths,
  includeSlotReservation = true,
  effectiveSlotReservation,
  discrepancies,
  generatedAmounts,
  installmentAmounts,
  generatedLinks,
  isGeneratingLinks,
  onRegeneratePaymentLinks,
  onRemoveWorkflow,
  onAddWorkflow,
  onFeesChange,
  onContactEmailChange,
  onConfirm,
}: ProposalReviewModalProps) {
  const [showWorkflowPicker, setShowWorkflowPicker] = useState(false);
  const [workflowSearch, setWorkflowSearch] = useState('');
  const [workflowsExpanded, setWorkflowsExpanded] = useState(false);
  
  // Local email state for inline editing
  const [localEmail, setLocalEmail] = useState(contactEmail || '');
  const [isEditingEmail, setIsEditingEmail] = useState(!contactEmail);
  
  // Local state for editable fees
  const [localSetupFee, setLocalSetupFee] = useState(setupFeeFinal || 0);
  const [localMonthlyFee, setLocalMonthlyFee] = useState(monthlyFinal || 0);
  const [isManualOverride, setIsManualOverride] = useState(false);
  
  // Check if prices have drifted from generated payment link amounts
  const pricesNeedRegeneration = useMemo(() => {
    if (!generatedAmounts) return false;
    return localSetupFee !== generatedAmounts.setupFee || 
           localMonthlyFee !== generatedAmounts.monthlyRetainer;
  }, [localSetupFee, localMonthlyFee, generatedAmounts]);
  
  // Get valid workflows with details
  const validWorkflows = useMemo(() => {
    return workflows
      .map(id => workflowDefinitions.find(w => w.id === id))
      .filter((w): w is WorkflowDefinition => !!w);
  }, [workflows]);
  
  // Get invalid workflow IDs
  const invalidWorkflowIds = useMemo(() => {
    return workflows.filter(id => !workflowDefinitions.some(w => w.id === id));
  }, [workflows]);
  
  // Get voice plan details
  const voicePlan = useMemo(() => {
    if (!voiceAgentPlan) return null;
    return voiceAgentPlans.find(p => p.id === voiceAgentPlan);
  }, [voiceAgentPlan]);
  
  // Filter available workflows for picker
  const availableWorkflows = useMemo(() => {
    const selected = new Set(workflows);
    return workflowDefinitions
      .filter(w => !selected.has(w.id))
      .filter(w => 
        !workflowSearch || 
        w.name.toLowerCase().includes(workflowSearch.toLowerCase()) ||
        w.category.toLowerCase().includes(workflowSearch.toLowerCase())
      );
  }, [workflows, workflowSearch]);
  
  // Auto-recalculate when workflows change (unless manual override)
  useEffect(() => {
    if (isManualOverride) return;
    
    const result = calculateInvestment({
      teamSize: teamSize || 10,
      industry: industryId || 'general',
      workflowCount: validWorkflows.length,
      opsComplexity: opsComplexity || 'standard'
    });
    
    setLocalSetupFee(result.setupInvestment);
    setLocalMonthlyFee(result.monthlyRetainer);
  }, [validWorkflows.length, isManualOverride, teamSize, industryId, opsComplexity]);
  
  // Sync with parent values when modal opens
  useEffect(() => {
    if (open && setupFeeFinal && monthlyFinal) {
      setLocalSetupFee(setupFeeFinal);
      setLocalMonthlyFee(monthlyFinal);
    }
  }, [open, setupFeeFinal, monthlyFinal]);
  
  // Check if ready to proceed
  const hasBlockingIssues = discrepancies.some(d => 
    d.type === 'missing_field' || d.type === 'missing_workflow'
  );
  
  // Email is required for proposal URL generation
  const isMissingEmail = !contactEmail || !contactEmail.trim();
  
  const handleRemoveInvalid = useCallback((id: string) => {
    onRemoveWorkflow(id);
  }, [onRemoveWorkflow]);
  
  const handleAddWorkflow = useCallback((id: string) => {
    onAddWorkflow(id);
    setWorkflowSearch('');
  }, [onAddWorkflow]);
  
  const handleConfirmClick = useCallback(() => {
    if (onFeesChange) {
      onFeesChange(localSetupFee, localMonthlyFee);
    }
    onConfirm();
  }, [localSetupFee, localMonthlyFee, onFeesChange, onConfirm]);
  
  const handleResetToAuto = useCallback(() => {
    setIsManualOverride(false);
  }, []);

  const hasPaymentLinks = generatedLinks && (
    generatedLinks.slotReservation || 
    generatedLinks.setupFee || 
    generatedLinks.setupInitiation || 
    generatedLinks.monthlyRetainer
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Compact Header */}
        <DialogHeader className="px-4 py-3 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Check className="w-4 h-4 text-primary" />
            Review Proposal
          </DialogTitle>
        </DialogHeader>
        
        {/* Scrollable Content */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-4 py-3 space-y-3">
            {/* Validation Issues - Compact */}
            {discrepancies.length > 0 && (
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/30 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-semibold text-destructive">
                    {discrepancies.length} Issue{discrepancies.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {discrepancies.map((d, i) => (
                    <div key={i} className="flex items-start justify-between gap-2 text-sm p-2 bg-background rounded">
                      <div className="min-w-0">
                        <p className="text-xs">{d.message}</p>
                      </div>
                      {(d.type === 'missing_workflow' || d.type === 'invalid_workflow') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveInvalid(d.id)}
                          className="h-6 px-2 text-xs text-destructive shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Client Details - Dense 2-column grid */}
            <div className="p-3 bg-muted/50 rounded-lg border">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Client Details</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <div className="truncate">
                  <span className="text-muted-foreground">Company: </span>
                  <span className={cn("font-medium", !companyName && "text-destructive")}>
                    {companyName || 'Missing'}
                  </span>
                </div>
                <div className="truncate">
                  <span className="text-muted-foreground">Contact: </span>
                  <span className="font-medium">{contactName || '—'}</span>
                </div>
                <div className="col-span-2 flex items-center gap-1">
                  <span className="text-muted-foreground shrink-0">Email: </span>
                  {isMissingEmail || isEditingEmail ? (
                    <Input
                      type="email"
                      value={localEmail}
                      onChange={(e) => {
                        setLocalEmail(e.target.value);
                        onContactEmailChange?.(e.target.value);
                      }}
                      onBlur={() => {
                        if (localEmail.trim()) setIsEditingEmail(false);
                      }}
                      placeholder="client@company.com"
                      className="h-7 text-xs flex-1 min-w-0 max-w-[200px]"
                      autoFocus={isMissingEmail}
                    />
                  ) : (
                    <span 
                      className="font-medium truncate cursor-pointer hover:underline"
                      onClick={() => setIsEditingEmail(true)}
                    >
                      {contactEmail}
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] px-2 shrink-0 gap-1"
                    onClick={() => {
                      if (contactEmail && contactEmail.trim()) {
                        setLocalEmail(contactEmail);
                        onContactEmailChange?.(contactEmail);
                        setIsEditingEmail(true);
                        toast.success('Email autofilled from Client Details — please double-check');
                      } else {
                        toast.info('No email found in Client Information. Please enter an email above first.');
                      }
                    }}
                  >
                    <RefreshCw className="w-3 h-3" />
                    Autofill & Check
                  </Button>
                </div>
                <div className="truncate">
                  <span className="text-muted-foreground">Industry: </span>
                  <span className="font-medium">{industry || 'General'}</span>
                </div>
              </div>
            </div>
            
            {/* Investment Summary - Compact */}
            <div className="p-3 bg-muted/50 rounded-lg border space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  Investment
                </p>
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="manual-override" className="text-xs text-muted-foreground">
                    Manual
                  </Label>
                  <Switch 
                    id="manual-override"
                    checked={isManualOverride}
                    onCheckedChange={setIsManualOverride}
                    className="scale-75"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Setup Fee</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={localSetupFee}
                      onChange={(e) => {
                        setLocalSetupFee(Number(e.target.value));
                        setIsManualOverride(true);
                      }}
                      className="pl-5 h-8 text-sm"
                      min={0}
                      step={500}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Monthly</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={localMonthlyFee}
                      onChange={(e) => {
                        setLocalMonthlyFee(Number(e.target.value));
                        setIsManualOverride(true);
                      }}
                      className="pl-5 pr-8 h-8 text-sm"
                      min={0}
                      step={50}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">/mo</span>
                  </div>
                </div>
              </div>
              
              {!isManualOverride && (
                <p className="text-xs text-muted-foreground">
                  Auto-calculated • {validWorkflows.length} workflow{validWorkflows.length !== 1 ? 's' : ''}
                </p>
              )}
              
              {/* Contract Period */}
              {contractMonths && contractMonths > 0 && (
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded">
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    📋 {contractMonths}-month contracted period
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {pricingOption === 'C'
                      ? 'Termination for convenience requires payment of remaining contractual value in full.'
                      : 'Agreed minimum contract duration.'}
                  </p>
                </div>
              )}
              
              {/* Price Change Warning - Inline */}
              {pricesNeedRegeneration && onRegeneratePaymentLinks && (
                <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-600">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Prices changed</span>
                  </div>
                  <Button
                    onClick={() => {
                      if (onFeesChange) onFeesChange(localSetupFee, localMonthlyFee);
                      onRegeneratePaymentLinks(localSetupFee, localMonthlyFee);
                    }}
                    disabled={isGeneratingLinks}
                    variant="default"
                    size="sm"
                    className="w-full h-8 gap-1.5 text-xs"
                  >
                    {isGeneratingLinks ? (
                      <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Regenerating...</>
                    ) : (
                      <><RefreshCw className="w-3.5 h-3.5" /> Regenerate Links</>
                    )}
                  </Button>
                </div>
              )}
              
              {isManualOverride && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetToAuto}
                  className="h-6 text-xs gap-1 px-2"
                >
                  <RefreshCw className="w-3 h-3" /> Reset to auto
                </Button>
              )}
            </div>
            
            {/* Payment Links - Compact single-line rows with scroll */}
            {hasPaymentLinks && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Link className="w-3.5 h-3.5 text-green-700 dark:text-green-400" />
                  <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                    Payment Links
                  </span>
                  {pricingOption === 'A' && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1">4 Installments</Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-0.5">
                    <span className="hidden sm:inline">Scroll</span>
                    <span className="sm:hidden">Swipe</span> ↓
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mb-2 italic">
                  Amounts shown exclude GST. 10% GST is added at checkout for AUD payments.
                </p>

                {/* Slot Reservation Missing Warning */}
                {includeSlotReservation && !generatedLinks?.slotReservation && (
                  <div className="p-2 mb-2 bg-destructive/10 border border-destructive/30 rounded flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <p className="font-medium text-destructive">Slot Reservation link missing</p>
                      <p className="text-muted-foreground">The commitment deposit payment link must be generated before confirming.</p>
                      {onRegeneratePaymentLinks && (
                        <Button
                          onClick={() => onRegeneratePaymentLinks(localSetupFee, localMonthlyFee)}
                          disabled={isGeneratingLinks}
                          variant="default"
                          size="sm"
                          className="h-8 gap-1.5 text-xs mt-1 min-h-[44px]"
                        >
                          <RefreshCw className={cn("w-3.5 h-3.5", isGeneratingLinks && "animate-spin")} />
                          Retry Generation
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Native scroll - works better than nested Radix ScrollArea */}
                <div 
                  className="max-h-44 overflow-y-auto overscroll-contain rounded"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  <div className="bg-background rounded border divide-y">
                  {/* Slot Reservation */}
                  {generatedLinks?.slotReservation && (
                    <PaymentLinkRowCompact
                      label="Slot Reservation"
                      amount={installmentAmounts?.depositAmount ?? (effectiveSlotReservation || 5000)}
                      url={generatedLinks.slotReservation}
                    />
                  )}
                  
                  {/* Option A Installments */}
                  {pricingOption === 'A' && (
                    <>
                      {generatedLinks?.setupInitiation && (installmentAmounts?.initiation || 0) > 0 && (
                        <PaymentLinkRowCompact
                          label="Initiation (50%)"
                          amount={installmentAmounts?.initiation || 0}
                          url={generatedLinks.setupInitiation}
                        />
                      )}
                      {generatedLinks.setupMonth1 && (
                        <PaymentLinkRowCompact
                          label="Month 1 (20%)"
                          amount={installmentAmounts?.month1 || 0}
                          url={generatedLinks.setupMonth1}
                        />
                      )}
                      {generatedLinks.setupMonth2 && (
                        <PaymentLinkRowCompact
                          label="Month 2 (20%)"
                          amount={installmentAmounts?.month2 || 0}
                          url={generatedLinks.setupMonth2}
                        />
                      )}
                      {generatedLinks.setupMonth3 && (
                        <PaymentLinkRowCompact
                          label="Final (10%)"
                          amount={installmentAmounts?.month3 || 0}
                          url={generatedLinks.setupMonth3}
                        />
                      )}
                    </>
                  )}
                  
                  {/* Options A1, B & C: Single Setup Fee */}
                  {pricingOption !== 'A' && generatedLinks?.setupFee && (() => {
                    const fullSetup = generatedAmounts?.setupFee || localSetupFee;
                    const depositAmt = includeSlotReservation
                      ? (effectiveSlotReservation || Math.max(5000, Math.round(fullSetup * 0.5)))
                      : 0;
                    const setupAfterDeposit = Math.max(0, fullSetup - depositAmt);
                    const label = includeSlotReservation ? "Setup Fee (less deposit)" : "Setup Fee (100%)";
                    return (
                      <PaymentLinkRowCompact
                        label={label}
                        amount={setupAfterDeposit}
                        url={generatedLinks.setupFee}
                      />
                    );
                  })()}
                  
                  {/* Monthly Retainer */}
                  {generatedLinks?.monthlyRetainer && (
                    <PaymentLinkRowCompact
                      label="Monthly Retainer"
                      amount={generatedAmounts?.monthlyRetainer || localMonthlyFee}
                      url={generatedLinks.monthlyRetainer}
                      suffix="/mo"
                    />
                  )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Workflows - Collapsible */}
            <div className="p-3 bg-muted/50 rounded-lg border">
              <Collapsible open={workflowsExpanded} onOpenChange={setWorkflowsExpanded}>
                <div className="flex items-center justify-between">
                  <CollapsibleTrigger className="flex items-center gap-2 hover:bg-muted/50 rounded px-1 py-0.5 -mx-1">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      Workflows ({validWorkflows.length + customWorkflows.length})
                    </span>
                    <ChevronDown className={cn(
                      "w-3.5 h-3.5 text-muted-foreground transition-transform",
                      workflowsExpanded && "rotate-180"
                    )} />
                  </CollapsibleTrigger>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowWorkflowPicker(!showWorkflowPicker);
                      setWorkflowsExpanded(true);
                    }}
                    className="h-6 px-2 text-xs gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </Button>
                </div>
                
                <CollapsibleContent className="pt-2 space-y-2">
                  {/* Invalid workflows */}
                  {invalidWorkflowIds.length > 0 && (
                    <div className="space-y-1">
                      {invalidWorkflowIds.map(id => (
                        <div key={id} className="flex items-center justify-between py-1 px-2 bg-destructive/10 rounded text-xs">
                          <span className="font-mono text-destructive truncate">{id}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveInvalid(id)}
                            className="h-6 w-6 p-0 text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Valid workflows list */}
                  {validWorkflows.length > 0 ? (
                    <div className="space-y-1.5">
                      {/* Scroll hint for workflows list */}
                      {validWorkflows.length > 3 && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <span className="hidden sm:inline">Scroll</span>
                          <span className="sm:hidden">Swipe</span> ↓
                        </span>
                      )}
                      {/* Native scroll container */}
                      <div 
                        className="max-h-32 overflow-y-auto overscroll-contain rounded"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                      >
                        <div className="space-y-1">
                          {validWorkflows.map(w => (
                            <div key={w.id} className="flex items-center justify-between py-1.5 px-2 bg-background rounded border text-xs">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">{w.name}</p>
                                <p className="text-muted-foreground text-[10px]">{w.category}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onRemoveWorkflow(w.id)}
                                className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : customWorkflows.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-1">No workflows selected</p>
                  ) : null}

                  {/* Custom workflows (read-only display) */}
                  {customWorkflows.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Custom Workflows ({customWorkflows.length})
                      </p>
                      <div className="max-h-40 overflow-y-auto overscroll-contain space-y-1 pr-1">
                        {customWorkflows.map((cw, idx) => (
                          <div key={cw.id || `cw-${idx}`} className="py-1.5 px-2 bg-primary/5 rounded border border-primary/20 text-xs min-w-0">
                            <p className="font-medium break-words whitespace-normal leading-snug">{cw.name}</p>
                            <p className="text-muted-foreground text-[10px] mt-0.5 break-words">
                              Setup: {formatCurrency(cw.setupFee || 0)} · Monthly: {formatCurrency(cw.monthlyFee || 0)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Workflow Picker */}
                  <Collapsible open={showWorkflowPicker} onOpenChange={setShowWorkflowPicker}>
                    <CollapsibleContent className="space-y-2 pt-2 border-t">
                      <input
                        type="text"
                        placeholder="Search workflows..."
                        value={workflowSearch}
                        onChange={(e) => setWorkflowSearch(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border rounded bg-background"
                      />
                      <div 
                        className="max-h-32 overflow-y-auto overscroll-contain rounded"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                      >
                        <div className="space-y-0.5">
                          {availableWorkflows.slice(0, 8).map(w => (
                            <button
                              key={w.id}
                              onClick={() => handleAddWorkflow(w.id)}
                              className="w-full flex items-center justify-between py-1.5 px-2 text-left rounded hover:bg-primary/10 text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">{w.name}</p>
                                <p className="text-muted-foreground text-[10px]">{w.category}</p>
                              </div>
                              <Plus className="w-3.5 h-3.5 text-primary shrink-0" />
                            </button>
                          ))}
                          {availableWorkflows.length > 8 && (
                            <p className="text-[10px] text-muted-foreground text-center py-1">
                              +{availableWorkflows.length - 8} more
                            </p>
                          )}
                          {availableWorkflows.length === 0 && workflowSearch && (
                            <p className="text-[10px] text-muted-foreground text-center py-1">
                              No matches
                            </p>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CollapsibleContent>
              </Collapsible>
            </div>
            
            {/* Voice Agent - Compact */}
            {voiceAgentPlan && (
              <div className="p-3 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground">Voice Agent</span>
                </div>
                {voicePlan && voicePlan.name ? (
                  <p className="text-xs font-medium mt-1">{voicePlan.name}</p>
                ) : (
                  <p className="text-xs text-destructive mt-1">Plan not found</p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Compact Footer */}
        <DialogFooter className="px-4 py-3 border-t shrink-0 flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmClick}
            disabled={hasBlockingIssues || !companyName || isMissingEmail}
            className="flex-1 h-10 gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span className="hidden sm:inline">
              {hasBlockingIssues ? 'Fix Issues' : isMissingEmail ? 'Email Required' : 'Confirm & Generate'}
            </span>
            <span className="sm:hidden">
              {hasBlockingIssues ? 'Fix' : isMissingEmail ? 'Add Email' : 'Confirm'}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
