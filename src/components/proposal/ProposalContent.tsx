import { useMemo, useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SALES_EMAIL, PRODUCTION_URL } from '@/lib/siteConfig';
import alfredLogo from '@/assets/alfred-ai-mid.png';
import { 
  Building2, 
  Users, 
  Calendar, 
  CheckCircle2, 
  TrendingUp,
  Clock,
  Shield,
  Mail,
  Phone,
  Globe,
  Pencil,
  Copy,
  Check,
  Loader2,
  FileText,
  ChevronDown,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatCurrency, industryMultipliers } from '@/lib/pricingEngine';
import { normalizeQuotePaymentAmount } from '@/lib/quotePaymentAmounts';
import { shouldShowSlotReservation } from '@/lib/proposalSlotReservation';
import { AdminPasswordDialog } from '@/components/proposal/AdminPasswordDialog';
import { workflowDefinitions, WorkflowDefinition, validWorkflowIds } from '@/lib/workflowDefinitions';
import { voiceAgentPlans } from '@/hooks/useQuoteBuilder';
import { ProposalActions } from './ProposalActions';
import { ProposalEditMode } from './ProposalEditMode';
import { ProposalVersionHistory } from './ProposalVersionHistory';
import { ProposalPDFDownload } from './ProposalPDFDownload';
import { WorkflowCard } from './WorkflowCard';
import { SlotReservationButton } from './SlotReservationButton';
import { SectionErrorBoundary } from '@/components/ui/section-error-boundary';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaymentLink {
  id: string;
  payment_type: string;
  amount: number;
  currency: string;
  payment_link_url: string | null;
  installment_type?: string | null;
  status: string;
  client_confirmed_at?: string | null;
  completed_at?: string | null;
}

interface ProposalContentProps {
  data: {
    quote_id: string;
    company_name: string | null;
    contact_name: string | null;
    contact_email: string | null;
    industry: string | null;
    team_size: number | null;
    workflows: string[] | null;
    challenges: string[] | null;
    timeline: string | null;
    notes: string | null;
    transcript_summary: string | null;
    setup_fee_min: number | null;
    setup_fee_max: number | null;
    monthly_retainer_min: number | null;
    monthly_retainer_max: number | null;
    setup_fee_final: number | null;
    monthly_retainer_final: number | null;
    roi_conservative: number | null;
    roi_likely: number | null;
    roi_best: number | null;
    payback_months_conservative: number | null;
    payback_months_likely: number | null;
    payback_months_best: number | null;
    voice_agent_plan: string | null;
    voice_agent_monthly_cost: number | null;
    voice_agent_setup_cost: number | null;
    voice_agent_workflow_count: number | null;
    status: string | null;
    signed_at?: string | null;
    access_code?: string | null;
    created_at: string;
    created_by: string | null;
    sentiment_analysis?: any;
    current_tech_stack?: any;
    meeting_transcript?: string | null;
    bundle_pricing?: boolean | null;
    pricing_option?: string | null;
    contract_months?: number | null;
    poc_requested?: boolean | null;

  };
  accessCode?: string;
  paymentLinks?: PaymentLink[] | null;
}

const timelineLabels: Record<string, string> = {
  'immediate': 'Immediate (this month)',
  'next-quarter': 'Next Quarter',
  'next-6-months': 'Next 6 Months',
  'exploring': 'Just Exploring',
  'not-mentioned': 'To be discussed',
};

export function ProposalContent({ data: initialData, accessCode, paymentLinks: initialPaymentLinks }: ProposalContentProps) {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(initialData);
  const [localPaymentLinks, setLocalPaymentLinks] = useState<PaymentLink[] | null>(initialPaymentLinks || null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminVerify, setShowAdminVerify] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);

  // ========== ALL useMemo HOOKS FIRST (before any early returns) ==========
  // This ensures React hooks are called in the same order every render
  
  const industryInfo = useMemo(() => {
    const industry = data?.industry || 'general';
    // Default fallback object to guarantee we never have undefined
    const defaultIndustry = { 
      id: 'general', 
      name: 'General Business', 
      setupMultiplier: 1.0, 
      monthlyMultiplier: 1.0, 
      description: 'Standard implementation' 
    };
    
    // Guard against missing data during initial render
    if (!data) return defaultIndustry;
    
    const found = industryMultipliers.find(i => i.id === industry) || 
                  industryMultipliers.find(i => i.id === 'general') || 
                  industryMultipliers[0];
    
    // Extra safety: verify found has name
    if (!found || typeof found.name !== 'string') {
      console.warn('[ProposalContent] Industry not found or invalid:', industry);
      return defaultIndustry;
    }
    return found;
  }, [data?.industry]);

  // Extract custom workflows from the mixed workflows array
  const customWorkflows = useMemo(() => {
    if (!data?.workflows || !Array.isArray(data.workflows)) return [];
    return (data.workflows as any[])
      .filter((w): w is { custom: boolean; name: string; setupFee?: number; monthlyFee?: number; id?: string } => 
        typeof w === 'object' && w !== null && (w as any).custom === true
      );
  }, [data?.workflows]);

  const selectedWorkflows = useMemo((): WorkflowDefinition[] => {
    // Guard against missing/invalid data during initial render
    if (!data) return [];
    if (!data.workflows || !Array.isArray(data.workflows)) {
      return [];
    }
    
    const validWorkflows = data.workflows
      .filter((id): id is string => typeof id === 'string') // only string IDs, skip custom workflow objects
      .map(id => {
        const workflow = workflowDefinitions.find(w => w.id === id);
        if (!workflow) {
          console.warn('[ProposalContent] Workflow not found:', id);
        }
        return workflow;
      })
      .filter((w): w is WorkflowDefinition => {
        if (w === undefined || w === null) return false;
        if (typeof w !== 'object') return false;
        if (typeof w.id !== 'string') return false;
        if (typeof w.name !== 'string') {
          console.warn('[ProposalContent] Workflow missing name property:', w);
          return false;
        }
        return true;
      });
    
    return validWorkflows;
  }, [data?.workflows]);

  const voicePlan = useMemo(() => {
    if (!data?.voice_agent_plan) return null;
    const plan = voiceAgentPlans.find(p => p.id === data.voice_agent_plan);
    // Defensive: ensure plan has ALL required properties including name
    if (!plan || typeof plan.id !== 'string' || typeof plan.name !== 'string') {
      console.warn('[ProposalContent] Voice plan missing or invalid:', data.voice_agent_plan);
      return null;
    }
    return plan;
  }, [data?.voice_agent_plan]);

  const setupFeeDisplay = useMemo(() => {
    if (!data) return null;
    const fee = data.setup_fee_final ?? data.setup_fee_min;
    console.log('[ProposalContent] setupFeeDisplay computed:', {
      final: data.setup_fee_final,
      min: data.setup_fee_min,
      result: fee
    });
    return fee ? formatCurrency(fee) : null;
  }, [data]);

  // Root fix: the slot reservation section must be driven by the quote's own
  // `poc_requested` flag, NOT solely by the existence of a generated payment
  // link row. Payment links can be missing/regenerated/expired, which silently
  // hid the whole PoC reservation section on quotes that DO require it.
  const hasSlotReservation = useMemo(
    () => shouldShowSlotReservation(data?.poc_requested, localPaymentLinks),
    [localPaymentLinks, data],
  );



  const slotReservationAmount = useMemo(() => {
    const slotLink = localPaymentLinks?.find(l => l.payment_type === 'slot_reservation');

    if (slotLink && slotLink.amount > 0) {
      return normalizeQuotePaymentAmount({
        amountCents: slotLink.amount,
        currency: slotLink.currency,
        paymentType: slotLink.payment_type,
      }).baseCents / 100;
    }

    return 5000;
  }, [localPaymentLinks]);

  const monthlyRetainerDisplay = useMemo(() => {
    if (!data) return null;
    const fee = data.monthly_retainer_final ?? data.monthly_retainer_min;
    console.log('[ProposalContent] monthlyRetainerDisplay computed:', {
      final: data.monthly_retainer_final,
      min: data.monthly_retainer_min,
      result: fee
    });
    return fee ? `${formatCurrency(fee)}/mo` : null;
  }, [data]);

  // ========== ALL useEffect HOOKS NEXT ==========

  // PRE-RENDER VALIDATION GATE
  // This useEffect validates workflows BEFORE any rendering occurs
  // Prevents "Cannot read properties of undefined" errors during first render
  useEffect(() => {
    if (!initialData) {
      setIsDataReady(true);
      return;
    }

    // Validate and filter workflows before allowing render
    if (initialData.workflows && Array.isArray(initialData.workflows)) {
      const validatedWorkflows = (initialData.workflows as any[]).filter(item => {
        // Allow custom workflow objects
        if (typeof item === 'object' && item !== null && (item as any).custom === true) {
          return true;
        }
        // Must be a string for standard workflows
        if (typeof item !== 'string') {
          console.warn('[ProposalContent] Invalid workflow item type:', typeof item);
          return false;
        }
        // Must exist in workflowDefinitions with valid name
        const workflow = workflowDefinitions.find(w => w.id === item);
        if (!workflow || typeof workflow.name !== 'string') {
          console.warn('[ProposalContent] Workflow not found or invalid:', item);
          return false;
        }
        return true;
      });

      // Update data with only valid workflows if any were filtered
      if (validatedWorkflows.length !== initialData.workflows.length) {
        console.warn(
          `[ProposalContent] Filtered ${initialData.workflows.length - validatedWorkflows.length} invalid workflow(s)`
        );
        setData(prev => ({ ...prev, workflows: validatedWorkflows }));
      }
    }

    setIsDataReady(true);
  }, [initialData]);

  // Sync local data state when initialData prop changes
  useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData]);

  // Sync payment links from parent prop
  useEffect(() => {
    if (initialPaymentLinks) {
      setLocalPaymentLinks(initialPaymentLinks);
    }
  }, [initialPaymentLinks]);

  // Check if user is admin on mount
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (session?.session?.user) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.session.user.id)
            .maybeSingle();
          
          if (roleData && ['admin', 'super_admin', 'editor'].includes(roleData.role)) {
            setIsAdmin(true);
          }
        }
      } catch {
        // Ignore errors
      }
    };
    checkAdmin();
  }, []);

  // ========== ALL CALLBACKS BEFORE EARLY RETURNS ==========

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${PRODUCTION_URL}/proposal/${data.quote_id}`);
      setCopied(true);
      toast.success('URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy URL');
    }
  }, [data.quote_id]);

  const handleContactClick = useCallback(() => {
    const subject = encodeURIComponent(`Proposal ${data.quote_id} - Next Steps`);
    const body = encodeURIComponent(
      `Hi,\n\nI've reviewed my proposal (${data.quote_id}) and would like to discuss next steps.\n\nThank you`
    );
    window.location.href = `mailto:${SALES_EMAIL}?subject=${subject}&body=${body}`;
  }, [data.quote_id]);

  const handleEditUpdate = useCallback((updatedData: any) => {
    setData(updatedData);
    setIsEditMode(false);
    // Update sessionStorage cache so refreshes reflect the edit
    if (updatedData?.quote_id) {
      const storageKey = `proposal_unlocked_${updatedData.quote_id}`;
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(updatedData));
      } catch {
        // Non-critical — next refresh will re-fetch from DB anyway
      }
    }
  }, []);

  // Re-fetch payment links via edge function (quote_payments not publicly readable).
  // Used after signing AND after an admin ticks a payment off.
  const refreshPaymentLinks = useCallback(async () => {
    try {
      if (accessCode && initialData.quote_id) {
        const { data: refreshData, error: refreshError } = await supabase.functions.invoke('verify-proposal-access', {
          body: { quoteId: initialData.quote_id, accessCode }
        });

        if (!refreshError && refreshData?.paymentLinks?.length > 0) {
          setLocalPaymentLinks(refreshData.paymentLinks);
        }
      }
    } catch (err) {
      console.error('[ProposalContent] Failed to refresh payment links:', err);
      // Non-blocking: links will show on next page load
    }
  }, [accessCode, initialData.quote_id]);

  const handleSignSuccess = useCallback(async () => {
    setData(prev => ({
      ...prev,
      status: 'signed',
      signed_at: new Date().toISOString()
    }));
    await refreshPaymentLinks();
  }, [refreshPaymentLinks]);

  // ========== EARLY RETURNS ONLY AFTER ALL HOOKS ==========

  // LOADING GATE: Show spinner until data is validated
  if (!isDataReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Preparing your proposal...</p>
      </div>
    );
  }

  // Defensive check - ensure we have valid data before rendering
  if (!initialData || !initialData.quote_id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
        <p className="text-muted-foreground">Unable to load proposal data.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  const isSigned = data.status === 'signed' || !!data.signed_at;
  const effectiveAccessCode = accessCode || data.access_code || '';

  // Edit Mode Overlay
  if (isEditMode) {
    return (
      <ProposalEditMode
        quoteId={data.quote_id}
        data={data}
        onUpdate={handleEditUpdate}
        onCancel={() => setIsEditMode(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={alfredLogo} alt="alfred ai" className="h-8 w-auto" loading="eager" />
          </div>
          <div className="flex items-center gap-2">
            {!isSigned && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isAdmin) {
                    setIsEditMode(true);
                  } else {
                    setShowAdminVerify(true);
                  }
                }}
                className="gap-1"
              >
                <Pencil className="w-3 h-3" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            )}
            <ProposalPDFDownload
              quoteId={data.quote_id}
              companyName={data.company_name}
              contactName={data.contact_name}
              contactEmail={data.contact_email}
              industry={data.industry}
              teamSize={data.team_size}
              setupFee={setupFeeDisplay}
              monthlyRetainer={monthlyRetainerDisplay}
              workflows={[...selectedWorkflows.map(w => w.name), ...customWorkflows.map(cw => cw.name)]}
              challenges={data.challenges || []}
              timeline={data.timeline}
              notes={data.notes}
              transcriptSummary={data.transcript_summary}
              roiConservative={data.roi_conservative}
              roiLikely={data.roi_likely}
              roiBest={data.roi_best}
              paybackConservative={data.payback_months_conservative}
              paybackLikely={data.payback_months_likely}
              paybackBest={data.payback_months_best}
              voiceAgentPlan={data.voice_agent_plan}
              voiceAgentMonthlyCost={data.voice_agent_monthly_cost}
              voiceAgentSetupCost={data.voice_agent_setup_cost}
              voiceAgentWorkflowCount={data.voice_agent_workflow_count}
              paymentLinks={localPaymentLinks}
              createdAt={data.created_at}
              createdBy={data.created_by}
              pricingOption={data.pricing_option}
              contractMonths={data.contract_months}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyUrl}
              className="gap-1"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Badge variant="outline" className="font-mono text-xs hidden sm:flex">
              {data.quote_id}
            </Badge>
            {isSigned && (
              <Badge className="bg-green-600 text-white">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Signed
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section - Client-focused messaging */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <Badge className="mb-4" variant="secondary">
            Your Custom Proposal
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Your AI Automation Blueprint
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            Tailored for <span className="text-foreground font-semibold">{data.company_name || 'Your Team'}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Prepared on {new Date(data.created_at).toLocaleDateString('en-AU', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
            {data.created_by && ` by ${data.created_by}`}
          </p>
        </motion.section>

        {/* Executive Summary - Enhanced client messaging */}
        {data.transcript_summary && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>What We Heard</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Here's what we learned about your business and priorities.</p>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {data.transcript_summary}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* About Your Business */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                About Your Business
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Company</p>
                  <p className="font-semibold">{data.company_name || 'Not specified'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Contact</p>
                  <p className="font-semibold">{data.contact_name || 'Not specified'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Industry</p>
                  <p className="font-semibold">{industryInfo?.name || 'General Business'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Team Size</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {data.team_size || 'Not specified'}
                  </p>
                </div>
              </div>
              {data.timeline && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Timeline</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {timelineLabels[data.timeline] || data.timeline}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.section>

        {/* Your Challenges */}
        {data.challenges && data.challenges.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>The Challenges We'll Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data.challenges.map((challenge, idx) => (
                    <Badge key={idx} variant="outline" className="py-1.5">
                      {challenge}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* Current Tech Stack Section */}
        {data.current_tech_stack && Array.isArray(data.current_tech_stack) && data.current_tech_stack.length > 0 && (
          <SectionErrorBoundary title="Current Tech Stack" compact>
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Globe className="w-5 h-5 text-primary" />
                    Your Current Tech Stack
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tools and systems we'll integrate with
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {data.current_tech_stack.map((tool: any, index: number) => {
                      const label = typeof tool === 'string' ? tool : tool?.name || 'Unknown';
                      return (
                        <Badge key={index} variant="secondary" className="text-sm px-3 py-1.5">
                          {label}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          </SectionErrorBoundary>
        )}

        <SectionErrorBoundary title="Your AI Automation Solutions" compact>
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <img src={alfredLogo} alt="" className="h-5 w-auto" />
                Your AI Automation Solutions ({selectedWorkflows.length + customWorkflows.length})
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Each AI agent below is purpose-built for your specific workflows.
              </p>
            </CardHeader>
            <CardContent>
              {(selectedWorkflows.length + customWorkflows.length) > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {selectedWorkflows.map((workflow) => (
                    <SectionErrorBoundary key={workflow?.id || Math.random().toString()} compact>
                      <WorkflowCard workflow={workflow} />
                    </SectionErrorBoundary>
                  ))}
                  {customWorkflows.map((cw, idx) => (
                    <div key={cw.id || `custom-${idx}`} className="p-4 rounded-lg border bg-card border-primary/30">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold">{cw.name}</h4>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Custom</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Custom workflow tailored to your specific requirements.
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No workflows selected for this proposal.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.section>
        </SectionErrorBoundary>

        {/* Delivery Timeline */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Delivery Timeline
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Your project journey from kickoff to go-live.
              </p>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-0">
                {[
                  { week: 'Week 1–2', title: 'Discovery & Onboarding', desc: 'Requirements deep-dive, system access, data mapping' },
                  { week: 'Week 2–4', title: 'Build & Configure', desc: 'AI agent development, integrations, workflow setup' },
                  { week: 'Week 4–5', title: 'Internal Testing', desc: 'QA, edge-case handling, performance tuning' },
                  { week: 'Week 5–6', title: 'UAT (User Acceptance Testing)', desc: 'Your team validates in a live-like environment' },
                  { week: 'Week 6+', title: 'Go Live & Retainer Begins', desc: 'Full deployment, ongoing support and optimization' },
                ].map((step, idx, arr) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                        {idx + 1}
                      </div>
                      {idx < arr.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border my-1" />
                      )}
                    </div>
                    <div className="pb-6 last:pb-0">
                      <p className="text-xs font-medium text-primary">{step.week}</p>
                      <p className="font-semibold">{step.title}</p>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              {selectedWorkflows.length > 3 && (
                <p className="text-xs text-muted-foreground mt-4 border-t pt-3">
                  * With {selectedWorkflows.length} workflows, delivery may extend by 1–2 weeks to ensure quality across all agents.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.section>

        {voicePlan && voicePlan.id !== 'none' && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary" />
                  Voice AI Agent
                </CardTitle>
              </CardHeader>
              <CardContent>
              <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{voicePlan?.name || 'Voice'} Plan</p>
                    <p className="text-sm text-muted-foreground">{voicePlan?.description || ''}</p>
                    {data.voice_agent_workflow_count && data.voice_agent_workflow_count > 1 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {data.voice_agent_workflow_count} voice workflows included
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(data.voice_agent_monthly_cost || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">per month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* Your Investment */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Your Investment</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Transparent pricing with no hidden fees.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Setup Fee (One-time)</p>
                  <p className="text-2xl font-bold">
                    {setupFeeDisplay || `${formatCurrency(data.setup_fee_min || 0)} - ${formatCurrency(data.setup_fee_max || 0)}`}
                  </p>
                  {voicePlan && data.voice_agent_setup_cost && data.voice_agent_setup_cost > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      + {formatCurrency(data.voice_agent_setup_cost)} Voice Agent setup
                    </p>
                  )}
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Monthly Retainer</p>
                  <p className="text-2xl font-bold">
                    {monthlyRetainerDisplay || `${formatCurrency(data.monthly_retainer_min || 0)} - ${formatCurrency(data.monthly_retainer_max || 0)}/mo`}
                  </p>
                  {voicePlan && data.voice_agent_monthly_cost && data.voice_agent_monthly_cost > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      + {formatCurrency(data.voice_agent_monthly_cost)}/mo Voice Agent
                    </p>
                  )}
                </div>
              </div>

              {/* Contract Period Note */}
              {data.contract_months && data.contract_months > 0 && (
                <div className="mt-4 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5 flex items-start gap-3">
                  <FileText className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Pricing based on {data.contract_months}-month contract
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      This proposal is priced on the basis of a <span className="font-medium text-foreground">{data.contract_months}-month minimum commitment</span>. 
                      Cancellation for convenience prior to the end of the contracted period requires payment of the remainder of the total contractual value in full.
                    </p>
                  </div>
                </div>
              )}

              {/* Monthly Retainer Start Note */}
              <div className="mt-4 p-3 rounded-lg border border-primary/20 bg-primary/5 flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Monthly retainer commences at UAT sign-off</span>, typically 6 weeks from contract execution.
                </p>
              </div>

              {/* Per-Workflow Price Breakdown */}
              {(selectedWorkflows.length + customWorkflows.length) > 0 && !data.bundle_pricing && (
                <Collapsible className="mt-4">
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-3 px-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-medium min-h-[44px]">
                    <span>Price Breakdown by Workflow</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 space-y-2 px-1">
                      {(() => {
                        // Subtract custom workflow fixed costs from totals before splitting per standard workflow
                        const customSetupTotal = customWorkflows.reduce((sum, cw) => sum + (cw.setupFee || 0), 0);
                        const customMonthlyTotal = customWorkflows.reduce((sum, cw) => sum + (cw.monthlyFee || 0), 0);
                        const totalSetup = data.setup_fee_final || data.setup_fee_min || 0;
                        const totalMonthly = data.monthly_retainer_final || data.monthly_retainer_min || 0;
                        const setupTotal = Math.max(totalSetup - customSetupTotal, 0);
                        const monthlyTotal = Math.max(totalMonthly - customMonthlyTotal, 0);
                        const bundleIds = ['drawings-to-estimate', 'smart-quote-builder'];
                        const hasBothBundle = bundleIds.every(id => selectedWorkflows.some(wf => wf.id === id));
                        const bundledWorkflows = hasBothBundle ? selectedWorkflows.filter(wf => bundleIds.includes(wf.id)) : [];
                        const nonBundledWorkflows = hasBothBundle ? selectedWorkflows.filter(wf => !bundleIds.includes(wf.id)) : selectedWorkflows;
                        const count = Math.max(selectedWorkflows.length, 1);

                        return (
                          <>
                            {hasBothBundle && (
                              <div className="flex items-center justify-between py-2 border-b border-border">
                                <div>
                                  <span className="text-sm font-medium">Estimation & Quoting Bundle</span>
                                  <p className="text-xs text-muted-foreground">
                                    {bundledWorkflows.map(wf => wf.name).join(' + ')}
                                  </p>
                                </div>
                                <div className="text-right text-sm text-muted-foreground">
                                  <span>{formatCurrency((setupTotal / count) * bundledWorkflows.length)}</span>
                                  <span className="mx-1">·</span>
                                  <span>{formatCurrency((monthlyTotal / count) * bundledWorkflows.length)}/mo</span>
                                </div>
                              </div>
                            )}
                            {nonBundledWorkflows.map((wf) => (
                              <div key={wf.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                                <span className="text-sm">{wf.name}</span>
                                <div className="text-right text-sm text-muted-foreground">
                                  <span>{formatCurrency(setupTotal / count)}</span>
                                  <span className="mx-1">·</span>
                                  <span>{formatCurrency(monthlyTotal / count)}/mo</span>
                                </div>
                              </div>
                            ))}
                            {customWorkflows.map((cw, idx) => (
                              <div key={cw.id || `custom-${idx}`} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                                <span className="text-sm flex items-center gap-2">
                                  {cw.name}
                                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Custom</span>
                                </span>
                                <div className="text-right text-sm text-muted-foreground">
                                  <span>{formatCurrency(cw.setupFee || 0)}</span>
                                  <span className="mx-1">·</span>
                                  <span>{formatCurrency(cw.monthlyFee || 0)}/mo</span>
                                </div>
                              </div>
                            ))}
                          </>
                        );
                      })()}
                      {voicePlan && voicePlan.id !== 'none' && data.voice_agent_setup_cost && (
                        <div className="flex items-center justify-between py-2 border-b border-border">
                          <span className="text-sm flex items-center gap-1">
                            <Phone className="w-3 h-3" /> Voice Agent Add-on
                          </span>
                          <div className="text-right text-sm text-muted-foreground">
                            <span>{formatCurrency(data.voice_agent_setup_cost)}</span>
                            <span className="mx-1">·</span>
                            <span>{formatCurrency(data.voice_agent_monthly_cost || 0)}/mo</span>
                          </div>
                        </div>
                      )}
                      {hasSlotReservation && (
                        <div className="flex items-center justify-between py-2 text-sm font-medium">
                          <span>Slot Reservation (deducted from setup)</span>
                          <span>{formatCurrency(slotReservationAmount)}</span>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              <p className="text-xs text-muted-foreground mt-4 text-center">
                All prices in AUD, excluding GST
              </p>
            </CardContent>
          </Card>
        </motion.section>

        {/* Getting Started — Slot Reservation & Timelines */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
          className="relative"
        >
          {/* Animated arrows pointing inward */}
          <motion.div
            className="absolute -left-8 top-1/2 -translate-y-1/2 text-primary hidden lg:block"
            animate={{ x: [0, 8, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l6 7-6 7" />
            </svg>
          </motion.div>
          <motion.div
            className="absolute -right-8 top-1/2 -translate-y-1/2 text-primary hidden lg:block"
            animate={{ x: [0, -8, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M11 5l-6 7 6 7" />
            </svg>
          </motion.div>
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Getting Started
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {hasSlotReservation 
                  ? "Secure your build slot and get started quickly."
                  : "Here's what happens next once you're ready to proceed."}
              </p>
            </CardHeader>
            <CardContent>
              <div className={`grid gap-4 ${hasSlotReservation ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                {hasSlotReservation && (
                  <div className="p-4 rounded-lg bg-background border">
                    <p className="text-xs text-muted-foreground mb-1">Slot Reservation</p>
                    <p className="text-xl font-bold">{formatCurrency(slotReservationAmount)} <span className="text-sm font-normal text-muted-foreground">AUD</span></p>
                    <p className="text-xs text-muted-foreground mt-1">Deducted from your setup fee</p>
                  </div>
                )}
                <div className="p-4 rounded-lg bg-background border">
                  <p className="text-xs text-muted-foreground mb-1">Lead Time to Start</p>
                  <p className="text-xl font-bold">1 Week</p>
                  <p className="text-xs text-muted-foreground mt-1">{hasSlotReservation ? "From reservation confirmation" : "From project sign-off"}</p>
                </div>
                <div className="p-4 rounded-lg bg-background border">
                  <p className="text-xs text-muted-foreground mb-1">PoC Build Time</p>
                  <p className="text-xl font-bold">2 Weeks</p>
                  <p className="text-xs text-muted-foreground mt-1">Proof of Concept delivery</p>
                </div>
              </div>
              {hasSlotReservation && (
                <div className="mt-4 p-3 rounded-lg border border-green-500/30 bg-green-500/10 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">100% Refundable</span> — Your slot reservation is fully refundable if the project doesn't proceed. Zero risk to get started.
                  </p>
                </div>
              )}
              {!isSigned && hasSlotReservation && (
                <SlotReservationButton
                  quoteId={data.quote_id}
                  companyName={data.company_name}
                  contactEmail={data.contact_email}
                  contactName={data.contact_name}
                  amount={slotReservationAmount * 100}
                />
              )}
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Your Expected Return
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Based on industry benchmarks and your specific use case.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {/* Guaranteed - Highlighted */}
                <div className="p-4 rounded-lg border-2 border-primary bg-primary/5 text-center relative">
                  <Badge className="mb-3 bg-primary">Guaranteed*</Badge>
                  <p className="text-4xl font-bold text-primary mb-1">
                    {data.roi_conservative || 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">ROI Year 1</p>
                  <div className="mt-3 pt-3 border-t border-primary/20">
                    <p className="text-sm flex items-center justify-center gap-1">
                      <Clock className="w-4 h-4" />
                      {data.payback_months_conservative || 0} months payback
                    </p>
                  </div>
                </div>

                {/* Possible */}
                <div className="p-4 rounded-lg border bg-card text-center">
                  <Badge variant="outline" className="mb-3">Possible</Badge>
                  <p className="text-3xl font-bold text-primary mb-1">
                    {data.roi_likely || 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">ROI Year 1</p>
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm flex items-center justify-center gap-1">
                      <Clock className="w-4 h-4" />
                      {data.payback_months_likely || 0} months payback
                    </p>
                  </div>
                </div>

                {/* A-team result */}
                <div className="p-4 rounded-lg border bg-card text-center">
                  <Badge variant="outline" className="mb-3">A-team result</Badge>
                  <p className="text-3xl font-bold text-primary mb-1">
                    {data.roi_best || 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">ROI Year 1</p>
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm flex items-center justify-center gap-1">
                      <Clock className="w-4 h-4" />
                      {data.payback_months_best || 0} months payback
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                *If ROI thresholds are not achieved after reasonable remediation efforts, we will continue optimization work at no additional charge. Monthly retainer fees continue during this period.
              </p>
            </CardContent>
          </Card>
        </motion.section>

        {/* Why alfred ai - Trust indicators */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold">Why Partner with Us</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Shield, label: 'SOC 2 Type II', sublabel: 'Compliant' },
              { icon: Shield, label: 'ISO 27001', sublabel: 'Certified' },
              { icon: Globe, label: 'Australian Owned', sublabel: 'Local Support' },
              { icon: CheckCircle2, label: 'Enterprise SLA', sublabel: '99.9% Uptime' },
            ].map((cred, idx) => (
              <div key={idx} className="p-4 rounded-lg border bg-card text-center">
                <cred.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="font-semibold text-sm">{cred.label}</p>
                <p className="text-xs text-muted-foreground">{cred.sublabel}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Additional Notes */}
        {data.notes && data.notes.trim() && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Additional Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {data.notes}
                </p>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* Version History - Admins see all, clients see only signed revisions */}
        <ProposalVersionHistory quoteId={data.quote_id} isAdmin={isAdmin} />

        {/* Getting Started (Repeated before CTA) */}
        {!isSigned && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.68 }}
            className="relative"
          >
            {/* Animated arrows pointing inward */}
            <motion.div
              className="absolute -left-8 top-1/2 -translate-y-1/2 text-primary hidden lg:block"
              animate={{ x: [0, 8, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l6 7-6 7" />
              </svg>
            </motion.div>
            <motion.div
              className="absolute -right-8 top-1/2 -translate-y-1/2 text-primary hidden lg:block"
              animate={{ x: [0, -8, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M11 5l-6 7 6 7" />
              </svg>
            </motion.div>
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Getting Started
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasSlotReservation 
                    ? "Secure your build slot and get started quickly."
                    : "Here's what happens next once you're ready to proceed."}
                </p>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-4 ${hasSlotReservation ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                  {hasSlotReservation && (
                    <div className="p-4 rounded-lg bg-background border">
                      <p className="text-xs text-muted-foreground mb-1">Slot Reservation</p>
                      <p className="text-xl font-bold">{formatCurrency(slotReservationAmount)} <span className="text-sm font-normal text-muted-foreground">AUD</span></p>
                      <p className="text-xs text-muted-foreground mt-1">Deducted from your setup fee</p>
                    </div>
                  )}
                  <div className="p-4 rounded-lg bg-background border">
                    <p className="text-xs text-muted-foreground mb-1">Lead Time to Start</p>
                    <p className="text-xl font-bold">1 Week</p>
                    <p className="text-xs text-muted-foreground mt-1">{hasSlotReservation ? "From reservation confirmation" : "From project sign-off"}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background border">
                    <p className="text-xs text-muted-foreground mb-1">PoC Build Time</p>
                    <p className="text-xl font-bold">2 Weeks</p>
                    <p className="text-xs text-muted-foreground mt-1">Proof of Concept delivery</p>
                  </div>
                </div>
                {hasSlotReservation && (
                  <div className="mt-4 p-3 rounded-lg border border-green-500/30 bg-green-500/10 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">100% Refundable</span> — Your slot reservation is fully refundable if the project doesn't proceed. Zero risk to get started.
                    </p>
                  </div>
                )}
                {hasSlotReservation && (
                  <SlotReservationButton
                    quoteId={data.quote_id}
                    companyName={data.company_name}
                    contactEmail={data.contact_email}
                    contactName={data.contact_name}
                    amount={slotReservationAmount * 100}
                  />
                )}
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* CTA Section with Signature */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          id="proposal-cta-section"
          className="py-8"
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-2">
                {isSigned ? 'Thank You for Choosing alfred ai' : 'Ready to Transform Your Operations?'}
              </h2>
              <p className="mb-6 text-muted-foreground max-w-lg mx-auto">
                {isSigned 
                  ? 'Your proposal has been accepted. Our implementation team will reach out within 1 business day to kick off your project.'
                  : "Accept this proposal to secure your implementation slot. We'll guide you through every step of the journey."
                }
              </p>
              {!isSigned && (
              <p className="text-sm text-muted-foreground mb-4">
                  By proceeding, you agree to our{' '}
                  <Link
                    to={`/proposal/${data.quote_id}/ssa`}
                    className="text-primary underline hover:text-primary/80 inline-flex items-center gap-1 min-h-[44px] min-w-[44px]"
                  >
                    <FileText className="w-3 h-3" />
                    Standard Service Agreement
                  </Link>
                </p>
              )}
              <ProposalActions
                quoteId={data.quote_id}
                accessCode={effectiveAccessCode}
                companyName={data.company_name || undefined}
                contactName={data.contact_name || undefined}
                contactEmail={data.contact_email || undefined}
                setupFee={setupFeeDisplay}
                monthlyRetainer={monthlyRetainerDisplay}
                paymentLinks={localPaymentLinks}
                pocRequested={hasSlotReservation}
                slotReservationAmount={slotReservationAmount}

                isSigned={isSigned}
                isAdmin={isAdmin}
                onPaymentsChanged={refreshPaymentLinks}
                onSignSuccess={handleSignSuccess}
              />
            </CardContent>
          </Card>
        </motion.section>

        {/* Footer */}
        <footer className="py-8 border-t text-center text-sm text-muted-foreground space-y-2">
          <p>© {new Date().getFullYear()} alfred ai. All rights reserved.</p>
          <p>
            Questions? Contact us at{' '}
            <a href={`mailto:${SALES_EMAIL}`} className="text-primary hover:underline">
              {SALES_EMAIL}
            </a>
          </p>
          <p>
            <Link
              to={`/proposal/${data.quote_id}/ssa`}
              className="text-primary hover:underline inline-flex items-center gap-1 min-h-[44px] justify-center"
            >
              <FileText className="w-3 h-3" />
              Standard Service Agreement
            </Link>
          </p>
        </footer>
      </main>
      <AdminPasswordDialog
        open={showAdminVerify}
        onOpenChange={setShowAdminVerify}
        onSuccess={() => {
          setIsAdmin(true);
          setIsEditMode(true);
        }}
        title="Admin Verification Required"
        description="Please enter your admin password to access Edit mode."
      />
    </div>
  );
}
