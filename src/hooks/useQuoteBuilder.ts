import { useState, useMemo, useCallback } from 'react';
import { 
  calculateInvestment, 
  PricingResult, 
  industryMultipliers,
  getComplexityFromWorkflowCount 
} from '@/lib/pricingEngine';
import { 
  calculateROIScenarios, 
  ROICalculation, 
  ClientInputs, 
  defaultClientInputs 
} from '@/lib/roiScenarios';
import { generateQuoteId } from '@/lib/generateQuotePDF';

export type { ClientInputs } from '@/lib/roiScenarios';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { workflowDefinitions } from '@/lib/workflowDefinitions';

/**
 * Returns the quick-access code the user typed (stored in sessionStorage),
 * so the edge function can server-validate read access without an admin session.
 * The code is never hardcoded in the client bundle.
 */
function getQuickAccessCode(): string | undefined {
  try {
    if (sessionStorage.getItem('diy_quote_quick_access') !== 'true') return undefined;
    const code = sessionStorage.getItem('diy_quote_quick_access_code');
    return code && code.trim().length > 0 ? code : undefined;
  } catch {
    return undefined;
  }
}


// Workflow IDs that overlap with Voice Agent functionality
// When Voice Agent is selected, these should not be double-counted in pricing
const VOICE_OVERLAPPING_WORKFLOWS = [
  'customer-experience',  // AI Customer Service Agent
  'voice-agent',          // Conversational Voice AI Agent
  'voice-operations',     // High-Volume Call Automation
  'butler-voice',         // Executive Voice Assistant
  'property-management',  // Property Management Voice Agent
];

/**
 * Filter out voice-related workflows when Voice Agent is enabled
 * to prevent double-counting in pricing/ROI calculations
 */
function getEffectiveWorkflows(
  workflows: string[], 
  voiceAgent: VoiceAgentSelection
): string[] {
  if (voiceAgent.planId && voiceAgent.planId !== 'none') {
    return workflows.filter(w => !VOICE_OVERLAPPING_WORKFLOWS.includes(w));
  }
  return workflows;
}

export interface MeetingSentiment {
  interestLevel: 'high' | 'medium' | 'low';
  productFit: 'strong' | 'moderate' | 'weak';
  pricingSensitivity: 'high' | 'medium' | 'low';
  recommendedPricingOption: 'A' | 'A1' | 'B' | 'C';
  pricingRationale: string;
}

// Tech Stack item extracted from transcript
export interface TechStackItem {
  name: string;
  category: 'CRM' | 'ERP' | 'Communication' | 'Project Management' | 'Accounting' | 'Storage' | 'Custom/Legacy' | 'Other';
  integrationNeed: 'integrate' | 'replace' | 'augment';
  notes?: string;
}

export type TimelineConfidence = 'explicit' | 'inferred' | 'unknown';
export type FieldConfidence = 'explicit' | 'inferred' | 'unknown' | 'manual';

// Voice Agent Types
export type VoiceAgentPlan = 'starter' | 'growth' | 'scale' | 'enterprise-10k' | 'enterprise-20k' | 'payg' | 'none';

export interface VoiceAgentPlanDetails {
  id: VoiceAgentPlan;
  name: string;
  monthlyFee: number;
  setupFee: number;
  description: string;
  included?: {
    kbBots?: number;
    minutes?: number;
    sms?: number;
    emails?: number;
  };
  perMinuteRate?: number;
}

// Setup fee per workflow applies to ALL voice agent packages
export const VOICE_AGENT_SETUP_PER_WORKFLOW = 2500;

export const voiceAgentPlans: VoiceAgentPlanDetails[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyFee: 99,
    setupFee: VOICE_AGENT_SETUP_PER_WORKFLOW, // $2,500 per workflow
    description: '10 KB bots, 250 min, 200 SMS, 200 emails',
    included: { kbBots: 10, minutes: 250, sms: 200, emails: 200 },
  },
  {
    id: 'growth',
    name: 'Growth',
    monthlyFee: 259,
    setupFee: VOICE_AGENT_SETUP_PER_WORKFLOW, // $2,500 per workflow
    description: '30 KB bots, 1,500 min, 500 SMS, 500 emails',
    included: { kbBots: 30, minutes: 1500, sms: 500, emails: 500 },
  },
  {
    id: 'scale',
    name: 'Scale',
    monthlyFee: 499,
    setupFee: VOICE_AGENT_SETUP_PER_WORKFLOW, // $2,500 per workflow
    description: '30 KB bots, 3,000 min, 1,500 SMS, 1,500 emails',
    included: { kbBots: 30, minutes: 3000, sms: 1500, emails: 1500 },
  },
  {
    id: 'enterprise-10k',
    name: 'Enterprise 10K',
    monthlyFee: 3200,
    setupFee: VOICE_AGENT_SETUP_PER_WORKFLOW, // $2,500 per workflow
    description: 'Platform fee + $0.25/min above 10K min',
    perMinuteRate: 0.25,
  },
  {
    id: 'enterprise-20k',
    name: 'Enterprise 20K',
    monthlyFee: 3900,
    setupFee: VOICE_AGENT_SETUP_PER_WORKFLOW, // $2,500 per workflow
    description: 'Platform fee + $0.18/min above 20K min',
    perMinuteRate: 0.18,
  },
  {
    id: 'payg',
    name: 'Pay-as-you-go',
    monthlyFee: 0,
    setupFee: VOICE_AGENT_SETUP_PER_WORKFLOW, // $2,500 per workflow
    description: '$0.40/min, no monthly fee',
    perMinuteRate: 0.40,
  },
  {
    id: 'none',
    name: 'Not Applicable',
    monthlyFee: 0,
    setupFee: 0,
    description: 'Skip voice agent for this quote',
  },
];

export interface VoiceAgentSelection {
  planId: VoiceAgentPlan | null;
  workflowCount: number; // Dedicated voice agent workflow count
  addons: {
    extraMinutes: number;
    extraSMS: number;
    extraEmails: number;
    privateVoice: boolean;
    privateVoiceCount: number;
    multiLanguage: boolean;
    languageCount: number;
  };
  aiRecommended?: boolean;
}

export const defaultVoiceAgentSelection: VoiceAgentSelection = {
  planId: null,
  workflowCount: 1,
  addons: {
    extraMinutes: 0,
    extraSMS: 0,
    extraEmails: 0,
    privateVoice: false,
    privateVoiceCount: 1,
    multiLanguage: false,
    languageCount: 1,
  },
};

export function calculateVoiceAgentCosts(selection: VoiceAgentSelection, workflowCount: number = 1): { monthly: number; setup: number; setupPerWorkflow: number } {
  if (!selection.planId || selection.planId === 'none') {
    return { monthly: 0, setup: 0, setupPerWorkflow: 0 };
  }

  const plan = voiceAgentPlans.find(p => p.id === selection.planId);
  if (!plan) return { monthly: 0, setup: 0, setupPerWorkflow: 0 };

  let monthly = plan.monthlyFee;
  // Setup fee is per workflow
  const setupPerWorkflow = plan.setupFee;
  const setup = setupPerWorkflow * Math.max(1, workflowCount);

  // Add-on costs
  monthly += selection.addons.extraMinutes * 0.4;
  monthly += selection.addons.extraSMS * 0.03;
  monthly += selection.addons.extraEmails * 0.01;
  
  if (selection.addons.privateVoice) {
    monthly += 39 * selection.addons.privateVoiceCount;
  }
  
  if (selection.addons.multiLanguage) {
    monthly += 19 * selection.addons.languageCount;
  }

  return { monthly: Math.round(monthly), setup, setupPerWorkflow };
}

// Custom workflow with ad-hoc pricing
export interface CustomWorkflow {
  id: string; // unique ID (generated)
  name: string;
  setupFee: number;
  monthlyFee: number;
}

export interface QuoteFormData {
  companyName: string;
  contactName: string;
  contactEmail: string;
  industry: string;
  teamSize: number;
  affectedTeamSize: number; // Subset of staff whose workflows will be optimised
  teamSizeConfidence?: FieldConfidence;
  opsComplexity: string; // 'simple' | 'standard' | 'moderate' | 'complex' | 'enterprise'
  specialDiscount: string; // Special sales discount ID
  specialDiscountCustomPercent: number; // Custom percentage for CEO approval (0-100)
  workflows: string[];
  suggestedWorkflows: string[]; // AI-suggested workflows from transcript (NOT auto-added to selection)
  customWorkflows: CustomWorkflow[]; // Ad-hoc manual workflows with custom pricing
  challenges: string[];
  timeline: string;
  timelineConfidence?: TimelineConfidence;
  notes: string;
  transcriptSummary: string;
  meetingTranscript: string; // Raw transcript text for history
  sentiment?: MeetingSentiment;
  voiceAgent: VoiceAgentSelection;
  voiceAgentRecommendedPlan?: VoiceAgentPlan | null;
  voiceAgentRationale?: string;
  currentTechStack: TechStackItem[];
  bundlePricing: boolean; // Show bundled pricing instead of per-workflow breakdown
  contractMonths: number; // Contract period in months for Option C (default 24)
  // Confidence tracking for ROI input fields
  hoursPerWeekConfidence?: FieldConfidence;
  salaryConfidence?: FieldConfidence;
  workflowsToReplaceConfidence?: FieldConfidence;
}

export interface QuoteResult {
  pricing: PricingResult;
  roiCalculations: ROICalculation[];
  formData: QuoteFormData;
  clientInputs: ClientInputs;
}

export interface SimilarQuote {
  id: string;
  company_name: string;
  industry: string;
  team_size: number;
  setup_fee_min: number;
  setup_fee_final: number | null;
  monthly_retainer_min: number;
  monthly_retainer_final: number | null;
  roi_likely: number;
  status: string;
  outcome: string | null;
  workflows: string[] | null;
  created_at: string;
}

export const defaultFormData: QuoteFormData = {
  companyName: '',
  contactName: '',
  contactEmail: '',
  industry: 'general',
  teamSize: 10,
  affectedTeamSize: 10,
  opsComplexity: 'standard',
  specialDiscount: 'none',
  specialDiscountCustomPercent: 30,
  workflows: [],
  suggestedWorkflows: [],
  customWorkflows: [],
  challenges: [],
  timeline: 'exploring',
  notes: '',
  transcriptSummary: '',
  meetingTranscript: '',
  voiceAgent: defaultVoiceAgentSelection,
  currentTechStack: [],
  bundlePricing: true,
  contractMonths: 24,
};

export interface RecentQuote {
  id: string;
  quote_id: string | null;
  company_name: string | null;
  contact_name: string | null;
  industry: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuoteVersionHistoryItem {
  version_number: number;
  created_at: string;
  created_by: string | null;
  change_summary: string | null;
  transcript_summary: string | null;
  meeting_transcript?: string | null;
  notes: string | null;
  status?: string | null;
  outcome?: string | null;
  sentiment_analysis?: MeetingSentiment | null;
}

// All workflow options sourced from contextualized workflow definitions
export const workflowOptions = workflowDefinitions.map(w => ({
  id: w.id,
  label: w.name,
  category: w.category,
}));

export const challengeOptions = [
  'Too much manual data entry',
  'Slow response times to leads',
  'Inconsistent proposal quality',
  'Difficulty scaling operations',
  'High admin overhead',
  'Document chaos',
  'Poor visibility into projects',
  'Customer service bottlenecks',
  'Compliance concerns',
  'Tool fragmentation',
];

export const timelineOptions = [
  { id: 'immediate', label: 'Immediate (this month)' },
  { id: 'next-quarter', label: 'Next Quarter' },
  { id: 'next-6-months', label: 'Next 6 Months' },
  { id: 'exploring', label: 'Just Exploring' },
  { id: 'not-mentioned', label: 'Not Mentioned' },
];

export function useQuoteBuilder() {
  const [formData, setFormData] = useState<QuoteFormData>(defaultFormData);
  const [clientInputs, setClientInputs] = useState<ClientInputs>(defaultClientInputs);
  const [similarQuotes, setSimilarQuotes] = useState<SimilarQuote[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPricingOption, setSelectedPricingOption] = useState<'A' | 'A1' | 'B' | 'C' | null>('A1');
  
  // Quote loading state
  const [recentQuotes, setRecentQuotes] = useState<RecentQuote[]>([]);
  const [searchResults, setSearchResults] = useState<RecentQuote[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [loadedQuoteId, setLoadedQuoteId] = useState<string | null>(null);
  const [loadedQuoteDbId, setLoadedQuoteDbId] = useState<string | null>(null); // Actual database UUID
  const [hasSearched, setHasSearched] = useState(false);
  const [quoteHistory, setQuoteHistory] = useState<QuoteVersionHistoryItem[]>([]);
  const [originalQuoteData, setOriginalQuoteData] = useState<{
    status?: string | null;
    outcome?: string | null;
    created_at?: string;
    created_by?: string | null;
  } | null>(null);

  // Loaded quote financial data (for syncing to payment link configurator)
  const [loadedQuoteFees, setLoadedQuoteFees] = useState<{
    setupFee: number | null;
    monthlyRetainer: number | null;
    roiConservative: number | null;
    roiLikely: number | null;
    roiBest: number | null;
    accessCode: string | null;
  } | null>(null);

  // Duplicate detection state
  const [duplicateMatches, setDuplicateMatches] = useState<RecentQuote[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  // Track if user has made any input (for deferred loading optimization)
  const hasUserInput = useMemo(() => {
    return (
      formData.companyName !== '' ||
      formData.contactName !== '' ||
      formData.workflows.length > 0 ||
      formData.challenges.length > 0 ||
      formData.notes !== '' ||
      formData.transcriptSummary !== '' ||
      formData.teamSize !== defaultFormData.teamSize ||
      formData.industry !== defaultFormData.industry ||
      loadedQuoteId !== null
    );
  }, [formData, loadedQuoteId]);

  // Calculate effective workflows (excluding voice duplicates when Voice Agent is active)
  const effectiveWorkflows = useMemo(() => {
    return getEffectiveWorkflows(formData.workflows, formData.voiceAgent);
  }, [formData.workflows, formData.voiceAgent]);

  // Calculate custom workflow totals
  const customWorkflowTotals = useMemo(() => {
    const count = formData.customWorkflows.length;
    const setupFee = formData.customWorkflows.reduce((sum, cw) => sum + (cw.setupFee || 0), 0);
    const monthlyFee = formData.customWorkflows.reduce((sum, cw) => sum + (cw.monthlyFee || 0), 0);
    return { count, setupFee, monthlyFee };
  }, [formData.customWorkflows]);

  // Calculate pricing based on effective workflow count (prevents double-counting)
  // Custom workflows have their own fixed pricing, so only standard workflows go into the pricing engine
  const standardWorkflowCount = effectiveWorkflows.length;
  const totalWorkflowCount = standardWorkflowCount + customWorkflowTotals.count;
  const pricing = useMemo(() => {
    return calculateInvestment({
      teamSize: formData.teamSize,
      affectedTeamSize: Math.min(formData.affectedTeamSize ?? formData.teamSize, formData.teamSize),
      industry: formData.industry,
      workflowCount: standardWorkflowCount,
      workflowsToReplace: clientInputs.adminStaffCount,
      opsComplexity: formData.opsComplexity,
      specialDiscount: formData.specialDiscount,
      specialDiscountCustomPercent: formData.specialDiscountCustomPercent,
    });
  }, [formData.teamSize, formData.affectedTeamSize, formData.industry, standardWorkflowCount, clientInputs.adminStaffCount, formData.opsComplexity, formData.specialDiscount, formData.specialDiscountCustomPercent]);

  // Calculate ROI scenarios using effective workflow count
  const roiCalculations = useMemo(() => {
    const inputs: ClientInputs = {
      ...clientInputs,
      workflowCount: totalWorkflowCount,
      // ROI labor savings should reflect the staff whose work is being optimised
      teamSize: Math.min(formData.affectedTeamSize ?? formData.teamSize, formData.teamSize),
    };
    return calculateROIScenarios(pricing, inputs);
  }, [pricing, clientInputs, effectiveWorkflows.length, formData.teamSize, formData.affectedTeamSize]);

  // Get complexity label based on effective workflow count
  const complexity = useMemo(() => {
    return getComplexityFromWorkflowCount(totalWorkflowCount);
  }, [effectiveWorkflows.length]);

  // Update form field
  const updateField = useCallback(<K extends keyof QuoteFormData>(
    field: K,
    value: QuoteFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Update client inputs
  const updateClientInput = useCallback(<K extends keyof ClientInputs>(
    field: K,
    value: ClientInputs[K]
  ) => {
    setClientInputs(prev => ({ ...prev, [field]: value }));
  }, []);

  // Toggle workflow selection
  const toggleWorkflow = useCallback((workflowId: string) => {
    setFormData(prev => ({
      ...prev,
      workflows: prev.workflows.includes(workflowId)
        ? prev.workflows.filter(w => w !== workflowId)
        : [...prev.workflows, workflowId],
    }));
  }, []);

  // Custom workflow management
  const addCustomWorkflow = useCallback((workflow: Omit<CustomWorkflow, 'id'>) => {
    setFormData(prev => ({
      ...prev,
      customWorkflows: [...prev.customWorkflows, { ...workflow, id: crypto.randomUUID() }],
    }));
  }, []);

  const updateCustomWorkflow = useCallback((id: string, updates: Partial<Omit<CustomWorkflow, 'id'>>) => {
    setFormData(prev => ({
      ...prev,
      customWorkflows: prev.customWorkflows.map(cw => cw.id === id ? { ...cw, ...updates } : cw),
    }));
  }, []);

  const removeCustomWorkflow = useCallback((id: string) => {
    setFormData(prev => ({
      ...prev,
      customWorkflows: prev.customWorkflows.filter(cw => cw.id !== id),
    }));
  }, []);

  const toggleChallenge = useCallback((challenge: string) => {
    setFormData(prev => ({
      ...prev,
      challenges: prev.challenges.includes(challenge)
        ? prev.challenges.filter(c => c !== challenge)
        : [...prev.challenges, challenge],
    }));
  }, []);

  // Update voice agent selection
  const updateVoiceAgent = useCallback((selection: VoiceAgentSelection) => {
    setFormData(prev => ({ ...prev, voiceAgent: selection }));
  }, []);

  // Calculate voice agent costs (uses dedicated voice agent workflow count)
  const voiceAgentCosts = useMemo(() => {
    const costs = calculateVoiceAgentCosts(formData.voiceAgent, formData.voiceAgent.workflowCount);
    const selectedPlan = formData.voiceAgent.planId 
      ? voiceAgentPlans.find(p => p.id === formData.voiceAgent.planId)
      : null;
    return {
      ...costs,
      planName: selectedPlan?.name,
      workflowCount: formData.voiceAgent.workflowCount,
    };
  }, [formData.voiceAgent]);

  // Fetch similar historical quotes via edge function (bypasses RLS)
  const fetchSimilarQuotes = useCallback(async () => {
    if (!formData.industry && !formData.teamSize) return;
    
    setIsLoadingSimilar(true);
    try {
      const { data: fnData, error } = await supabase.functions.invoke('quote-operations', {
        body: {
          action: 'similar_quotes',
          industry: formData.industry,
          teamSize: formData.teamSize,
          challenges: formData.challenges,
          workflows: formData.workflows?.map((w: any) => (
            typeof w === 'string' ? w : w?.name || w?.label || w?.id
          )).filter(Boolean) || [],
          excludeQuoteId: loadedQuoteId || undefined,
          quickAccessCode: getQuickAccessCode(),
        },
      });
      
      if (error) throw error;
      if (fnData?.success === false || fnData?.error) {
        setSimilarQuotes([]);
        return;
      }
      setSimilarQuotes((fnData?.data as SimilarQuote[]) || []);
    } catch (err) {
      console.error('Failed to fetch similar quotes:', err);
      setSimilarQuotes([]);
    } finally {
      setIsLoadingSimilar(false);
    }
  }, [formData.industry, formData.teamSize, formData.challenges, formData.workflows, loadedQuoteId]);

  // Helper: recalculate payback months from an overridden ROI percentage
  const calcPaybackFromRoi = (roiPercent: number, totalInvestment: number): number => {
    if (roiPercent <= -100 || totalInvestment <= 0) return 36;
    const annualSavings = totalInvestment * (1 + roiPercent / 100);
    const monthlySavings = annualSavings / 12;
    if (monthlySavings <= 0) return 36;
    return Math.min(Math.ceil(totalInvestment / monthlySavings), 36);
  };

  // Save quote to database (with versioning for updates)
  const saveQuote = useCallback(async (
    createdBy?: string,
    finalAmounts?: { setupFee?: number; monthlyRetainer?: number },
    roiOverrides?: { conservative?: number; likely?: number; best?: number },
    pricingOptionOverride?: 'A' | 'A1' | 'B' | 'C',
    options?: { isRegeneration?: boolean; changeSummary?: string }
  ): Promise<{ id: string | null; quoteId?: string; accessCode?: string } | null> => {
    // Enforce contact details before a quote can be generated/saved.
    const contactName = (formData.contactName || '').trim();
    const contactEmail = (formData.contactEmail || '').trim();
    const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail);

    if (!contactName || !contactEmail || !emailValid) {
      const missing: string[] = [];
      if (!contactName) missing.push('contact name');
      if (!contactEmail) missing.push('contact email');
      else if (!emailValid) missing.push('a valid contact email');

      toast.error('Contact details required', {
        description: `Please add ${missing.join(' and ')} before generating this quote.`,
      });
      return null;
    }

    setIsSaving(true);

    try {
      const conservative = roiCalculations.find(r => r.scenario.type === 'conservative');
      const likely = roiCalculations.find(r => r.scenario.type === 'likely');
      const best = roiCalculations.find(r => r.scenario.type === 'best');

      // If final fees are provided, recalculate ROI using those instead of auto-calc
      let effectiveConservative = conservative;
      let effectiveLikely = likely;
      let effectiveBest = best;

      if (finalAmounts && (finalAmounts.setupFee || finalAmounts.monthlyRetainer)) {
        const finalSetup = finalAmounts.setupFee ?? pricing.setupInvestment;
        const finalMonthly = finalAmounts.monthlyRetainer ?? pricing.monthlyRetainer;
        const finalAnnualInvestment = finalSetup + (finalMonthly * 11);

        // Create a modified pricing object with final fees for ROI recalculation
        const adjustedPricing = { ...pricing, annualInvestment: finalAnnualInvestment };
        const recalculated = calculateROIScenarios(adjustedPricing, {
          ...clientInputs,
          workflowCount: formData.workflows?.length || 3,
          teamSize: formData.teamSize,
        });
        effectiveConservative = recalculated.find(r => r.scenario.type === 'conservative');
        effectiveLikely = recalculated.find(r => r.scenario.type === 'likely');
        effectiveBest = recalculated.find(r => r.scenario.type === 'best');
      }

      // Calculate voice agent costs using dedicated workflow count
      const voiceCosts = calculateVoiceAgentCosts(formData.voiceAgent, formData.voiceAgent.workflowCount);

      const quoteData = {
        created_by: createdBy || 'DIY Quote Builder',
        company_name: formData.companyName || null,
        contact_name: formData.contactName || null,
        contact_email: formData.contactEmail || null,
        industry: formData.industry,
        team_size: formData.teamSize,
        workflows: [
          ...formData.workflows,
          ...formData.customWorkflows.map(cw => ({ custom: true, id: cw.id, name: cw.name, setupFee: cw.setupFee, monthlyFee: cw.monthlyFee })),
        ],
        challenges: formData.challenges,
        timeline: formData.timeline,
        setup_fee_min: pricing.setupRange.min,
        setup_fee_max: pricing.setupRange.max,
        monthly_retainer_min: pricing.monthlyRange.min,
        monthly_retainer_max: pricing.monthlyRange.max,
        roi_conservative: roiOverrides?.conservative ?? effectiveConservative?.roiPercentage ?? 0,
        roi_likely: roiOverrides?.likely ?? effectiveLikely?.roiPercentage ?? 0,
        roi_best: roiOverrides?.best ?? effectiveBest?.roiPercentage ?? 0,
        payback_months_conservative: roiOverrides?.conservative != null
          ? calcPaybackFromRoi(roiOverrides.conservative, finalAmounts ? (finalAmounts.setupFee ?? pricing.setupInvestment) + ((finalAmounts.monthlyRetainer ?? pricing.monthlyRetainer) * 11) : pricing.annualInvestment)
          : (effectiveConservative?.paybackMonths || 0),
        payback_months_likely: roiOverrides?.likely != null
          ? calcPaybackFromRoi(roiOverrides.likely, finalAmounts ? (finalAmounts.setupFee ?? pricing.setupInvestment) + ((finalAmounts.monthlyRetainer ?? pricing.monthlyRetainer) * 11) : pricing.annualInvestment)
          : (effectiveLikely?.paybackMonths || 0),
        payback_months_best: roiOverrides?.best != null
          ? calcPaybackFromRoi(roiOverrides.best, finalAmounts ? (finalAmounts.setupFee ?? pricing.setupInvestment) + ((finalAmounts.monthlyRetainer ?? pricing.monthlyRetainer) * 11) : pricing.annualInvestment)
          : (effectiveBest?.paybackMonths || 0),
        notes: formData.notes || null,
        transcript_summary: formData.transcriptSummary || null,
        meeting_transcript: formData.meetingTranscript || null,
        sentiment_analysis: (formData.sentiment as unknown as Json) || null,
        voice_agent_plan: formData.voiceAgent.planId || null,
        voice_agent_monthly_cost: voiceCosts.monthly || null,
        voice_agent_setup_cost: voiceCosts.setup || null,
        voice_agent_workflow_count: formData.voiceAgent.workflowCount || 1,
        voice_agent_addons: formData.voiceAgent.planId && formData.voiceAgent.planId !== 'none'
          ? formData.voiceAgent.addons
          : null,
        // Final definitive amounts (single values, not ranges)
        setup_fee_final: finalAmounts?.setupFee || null,
        monthly_retainer_final: finalAmounts?.monthlyRetainer || null,
        pricing_option: pricingOptionOverride || null,
        bundle_pricing: formData.bundlePricing || false,
        contract_months: formData.contractMonths || 24,
        current_tech_stack: formData.currentTechStack && formData.currentTechStack.length > 0
          ? (formData.currentTechStack as unknown as Json)
          : null,
      };

      // If we're editing an existing quote, save version history first
      // and preserve generated fields that weren't explicitly changed in the builder
      if (loadedQuoteDbId) {
        // Get current version number via edge function
        const { data: versionFnData } = await supabase.functions.invoke('quote-operations', {
          body: { action: 'get_version_count', quoteDbId: loadedQuoteDbId, quickAccessCode: getQuickAccessCode() },
        });
        const versionData = versionFnData?.data;
        
        const nextVersion = (versionData?.[0]?.version_number || 0) + 1;

        // Fetch current quote data via edge function
        const { data: currentQuoteFn } = await supabase.functions.invoke('quote-operations', {
          body: { action: 'get_current_quote', id: loadedQuoteDbId, quickAccessCode: getQuickAccessCode() },
        });
        const currentQuote = currentQuoteFn?.data;

        if (currentQuote) {
          // Preserve generated/proposal-edited fields if the builder didn't explicitly set them
          // This prevents the DIY builder from overwriting content set via ProposalEditMode
          const generatedFields = ['transcript_summary', 'notes', 'sentiment_analysis', 'meeting_transcript'] as const;
          for (const field of generatedFields) {
            if (!quoteData[field] && currentQuote[field]) {
              (quoteData as any)[field] = currentQuote[field];
            }
          }

          // Save current state as a version before updating (service-role edge fn)
          await supabase.functions.invoke('quote-operations', {
            body: {
              action: 'insert_version',
              quickAccessCode: getQuickAccessCode(),
              version: {
                quote_id: loadedQuoteDbId,
                version_number: nextVersion,
                company_name: currentQuote.company_name,
                contact_name: currentQuote.contact_name,
                contact_email: currentQuote.contact_email,
                industry: currentQuote.industry,
                team_size: currentQuote.team_size,
                workflows: currentQuote.workflows,
                challenges: currentQuote.challenges,
                timeline: currentQuote.timeline,
                notes: currentQuote.notes,
                transcript_summary: currentQuote.transcript_summary,
                meeting_transcript: currentQuote.meeting_transcript,
                sentiment_analysis: currentQuote.sentiment_analysis,
                setup_fee_min: currentQuote.setup_fee_min,
                setup_fee_max: currentQuote.setup_fee_max,
                setup_fee_final: currentQuote.setup_fee_final,
                monthly_retainer_min: currentQuote.monthly_retainer_min,
                monthly_retainer_max: currentQuote.monthly_retainer_max,
                monthly_retainer_final: currentQuote.monthly_retainer_final,
                roi_conservative: currentQuote.roi_conservative,
                roi_likely: currentQuote.roi_likely,
                roi_best: currentQuote.roi_best,
                voice_agent_plan: currentQuote.voice_agent_plan,
                voice_agent_monthly_cost: currentQuote.voice_agent_monthly_cost,
                voice_agent_setup_cost: currentQuote.voice_agent_setup_cost,
                voice_agent_workflow_count: currentQuote.voice_agent_workflow_count,
                created_by: currentQuote.created_by,
                change_summary: options?.changeSummary
                  ?? (options?.isRegeneration
                    ? `Regenerated by ${createdBy || 'Unknown'} at ${new Date().toISOString()}`
                    : `Updated by ${createdBy || 'Unknown'} at ${new Date().toISOString()}`),
              },
            } as any,
          });
        }

        // Update existing quote via service-role edge function
        const { data: updateFn } = await supabase.functions.invoke('quote-operations', {
          body: { action: 'update_quote', id: loadedQuoteDbId, quote: quoteData, quickAccessCode: getQuickAccessCode() } as any,
        });
        if (updateFn?.success === false) throw new Error(updateFn?.error || 'Update failed');
        
        // Fetch updated quote data including access_code via edge function
        const { data: updatedQuoteFn } = await supabase.functions.invoke('quote-operations', {
          body: { action: 'get_by_id', id: loadedQuoteDbId, quickAccessCode: getQuickAccessCode() },
        });
        const updatedQuote = updatedQuoteFn?.data;
        
        toast.success(`Quote ${loadedQuoteId} updated (v${nextVersion})`);
        return { id: loadedQuoteDbId, quoteId: updatedQuote?.quote_id, accessCode: updatedQuote?.access_code };
      } else {
        // Create new quote via service-role edge function
        const quoteId = generateQuoteId();
        const { data: createFn } = await supabase.functions.invoke('quote-operations', {
          body: {
            action: 'create_quote',
            quickAccessCode: getQuickAccessCode(),
            quote: { ...quoteData, quote_id: quoteId, status: 'draft' },
          } as any,
        });
        if (createFn?.success === false) throw new Error(createFn?.error || 'Create failed');
        const data = createFn?.data;
        
        // Set as loaded quote for future updates
        setLoadedQuoteId(quoteId);
        setLoadedQuoteDbId(data?.id || null);
        
        toast.success('Quote saved successfully');
        
        // Return object with both id and access_code for sharing
        return { id: data?.id || null, quoteId: data?.quote_id || quoteId, accessCode: data?.access_code };
      }
    } catch (err) {
      console.error('Failed to save quote:', err);
      toast.error('Failed to save quote. Please try again.');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [formData, pricing, roiCalculations]);

  // Lightweight function to update only final fees (used when confirming proposal)
  const updateFinalFees = useCallback(async (
    quoteDbId: string,
    setupFee: number,
    monthlyRetainer: number
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('quote-operations', {
        body: {
          action: 'update_final_fees',
          quoteDbId,
          setupFee,
          monthlyRetainer,
          quickAccessCode: getQuickAccessCode(),
        },
      });

      if (error) throw error;
      if (data?.success === false) throw new Error(data.error || 'Update failed');
      return true;
    } catch (err) {
      console.error('Failed to update final fees:', err);
      toast.error('Failed to save fee changes');
      return false;
    }
  }, []);

  // Check for existing quotes by company name (duplicate detection)
  const checkForDuplicates = useCallback(async (companyName: string): Promise<RecentQuote[]> => {
    if (!companyName?.trim()) return [];
    
    try {
      const searchTerm = `%${companyName.trim()}%`;
      const { data, error } = await supabase
        .from('quotes')
        .select('id, quote_id, company_name, contact_name, industry, status, created_at')
        .ilike('company_name', searchTerm)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return (data as RecentQuote[]) || [];
    } catch (err) {
      console.error('Failed to check for duplicates:', err);
      return [];
    }
  }, []);

  // Dismiss duplicate dialog
  const dismissDuplicateDialog = useCallback(() => {
    setShowDuplicateDialog(false);
    setDuplicateMatches([]);
  }, []);

  // Analyze transcript using AI
  const analyzeTranscript = useCallback(async (transcript: string) => {
    if (!transcript.trim()) {
      toast.error('Please paste a meeting transcript first');
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-meeting-transcript', {
        body: { transcript },
      });

      if (error) throw error;

      // Update form with extracted data
      if (data) {
        if (data.companyName) updateField('companyName', data.companyName);
        if (data.contactName) updateField('contactName', data.contactName);
        if (data.contactEmail) updateField('contactEmail', data.contactEmail);
        if (data.industry) updateField('industry', data.industry);
        if (data.teamSize) {
          updateField('teamSize', data.teamSize);
          updateField('teamSizeConfidence', data.teamSizeConfidence || 'unknown');
        }
        if (data.workflows?.length) {
          // Don't auto-add to selection — surface as suggestions for the user to confirm
          updateField('suggestedWorkflows', data.workflows);
        }
        if (data.challenges?.length) updateField('challenges', data.challenges);
        if (data.timeline) updateField('timeline', data.timeline);
        if (data.timelineConfidence) updateField('timelineConfidence', data.timelineConfidence);
        // Store raw transcript for history
        updateField('meetingTranscript', transcript);
        if (data.summary) updateField('transcriptSummary', data.summary);
        
        // Update hours per week confidence
        if (data.hoursPerWeekOnAdmin !== undefined) {
          updateClientInput('hoursPerWeekOnAdmin', data.hoursPerWeekOnAdmin);
          updateField('hoursPerWeekConfidence', data.hoursPerWeekConfidence || 'unknown');
        } else {
          // Mark as unknown if not detected
          updateField('hoursPerWeekConfidence', 'unknown');
        }
        
        // Salary is rarely mentioned in transcripts, default to unknown
        updateField('salaryConfidence', 'unknown');
        
        // Workflows to replace confidence - inferred from pain points
        if (data.challenges?.length > 0) {
          updateField('workflowsToReplaceConfidence', 'inferred');
        } else {
          updateField('workflowsToReplaceConfidence', 'unknown');
        }
        
        // Update sentiment analysis
        if (data.interestLevel || data.productFit || data.pricingSensitivity || data.recommendedPricingOption) {
          updateField('sentiment', {
            interestLevel: data.interestLevel || 'medium',
            productFit: data.productFit || 'moderate',
            pricingSensitivity: data.pricingSensitivity || 'medium',
            recommendedPricingOption: data.recommendedPricingOption || 'A1',
            pricingRationale: data.pricingRationale || '',
          });
        }

        // Update voice agent recommendation
        if (data.voiceAgentNeeded !== undefined) {
          updateField('voiceAgentRecommendedPlan', data.voiceAgentPlanRecommendation || null);
          updateField('voiceAgentRationale', data.voiceAgentRationale || '');
          
          // Auto-select recommended plan if voice agent is needed
          if (data.voiceAgentNeeded && data.voiceAgentPlanRecommendation) {
            updateField('voiceAgent', {
              ...defaultVoiceAgentSelection,
              planId: data.voiceAgentPlanRecommendation,
              aiRecommended: true,
            });
          }
        }

        // Update current tech stack
        if (data.currentTechStack && Array.isArray(data.currentTechStack)) {
          updateField('currentTechStack', data.currentTechStack);
        }

        toast.success('Transcript analyzed! Form fields have been pre-filled.');

        // Check for existing quotes with the same company name (only if not already loading a quote)
        if (data.companyName && !loadedQuoteId) {
          const matches = await checkForDuplicates(data.companyName);
          if (matches.length > 0) {
            setDuplicateMatches(matches);
            setShowDuplicateDialog(true);
          }
        }
      }
    } catch (err) {
      console.error('Failed to analyze transcript:', err);
      toast.error('Failed to analyze transcript. Please fill the form manually.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [updateField, loadedQuoteId, checkForDuplicates]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(defaultFormData);
    setClientInputs(defaultClientInputs);
    setSimilarQuotes([]);
    setSelectedPricingOption(null);
    setLoadedQuoteId(null);
    setLoadedQuoteDbId(null);
    setHasSearched(false);
    setQuoteHistory([]);
    setOriginalQuoteData(null);
  }, []);

  // Fetch recent quotes via edge function (bypasses RLS)
  // Scoped to the current sales rep / partner name (stored by SalesRepInput).
  const fetchRecentQuotes = useCallback(async () => {
    setIsLoadingRecent(true);
    try {
      const salesRep =
        typeof window !== 'undefined'
          ? localStorage.getItem('diy_quote_sales_rep_name') || undefined
          : undefined;
      const { data: fnData, error } = await supabase.functions.invoke('quote-operations', {
        body: { action: 'list_recent', quickAccessCode: getQuickAccessCode(), salesRep },
      });
      
      if (error) throw error;
      if (fnData?.error) throw new Error(fnData.error);
      setRecentQuotes((fnData?.data as RecentQuote[]) || []);
    } catch (err) {
      console.error('Failed to fetch recent quotes:', err);
      toast.error('Failed to load recent quotes');
    } finally {
      setIsLoadingRecent(false);
    }
  }, []);


  // Search quotes via edge function
  const searchQuotes = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoadingSearch(true);
    setHasSearched(false);
    try {
      const salesRep =
        typeof window !== 'undefined'
          ? localStorage.getItem('diy_quote_sales_rep_name') || undefined
          : undefined;
      const { data: fnData, error } = await supabase.functions.invoke('quote-operations', {
        body: { action: 'search', query, quickAccessCode: getQuickAccessCode(), salesRep },
      });
      
      if (error) throw error;
      if (fnData?.error) throw new Error(fnData.error);
      setSearchResults((fnData?.data as RecentQuote[]) || []);
      setHasSearched(true);
    } catch (err) {
      console.error('Failed to search quotes:', err);
      toast.error('Search failed. Please try again.');
      setHasSearched(true);
    } finally {
      setIsLoadingSearch(false);
    }
  }, []);

  // Load a specific quote by ID
  const loadQuote = useCallback(async (quoteId: string) => {
    setIsLoadingQuote(true);
    try {
      // Load quote + version history via edge function (bypasses RLS)
      const { data: fnData, error } = await supabase.functions.invoke('quote-operations', {
        body: { action: 'load', quoteId, quickAccessCode: getQuickAccessCode() },
      });
      
      if (error) throw error;
      if (fnData?.error) throw new Error(fnData.error);
      
      const data = fnData.data;
      if (!data) throw new Error('Quote not found');

      const historyResult = { data: fnData.history || [] };

      // Map database fields to form data
      const sentimentData = (data as Record<string, unknown>).sentiment_analysis as MeetingSentiment | null;
      setFormData({
        companyName: data.company_name || '',
        contactName: data.contact_name || '',
        contactEmail: data.contact_email || '',
        industry: data.industry || 'general',
        teamSize: data.team_size || 10,
        affectedTeamSize: data.team_size || 10,
        opsComplexity: 'standard', // Default for legacy quotes without opsComplexity
        specialDiscount: 'none', // Default for legacy quotes
        specialDiscountCustomPercent: 30, // Default custom percent
        workflows: Array.isArray(data.workflows) ? data.workflows.filter((w: unknown) => typeof w === 'string').map((w: unknown) => String(w)) : [],
        suggestedWorkflows: [],
        customWorkflows: Array.isArray(data.workflows)
          ? data.workflows
              .filter((w: unknown) => typeof w === 'object' && w !== null && (w as any).custom === true)
              .map((w: any) => ({ id: w.id || crypto.randomUUID(), name: w.name || '', setupFee: w.setupFee || 0, monthlyFee: w.monthlyFee || 0 }))
          : [],
        challenges: data.challenges || [],
        timeline: data.timeline || 'exploring',
        notes: data.notes || '',
        transcriptSummary: data.transcript_summary || '',
        meetingTranscript: (data as Record<string, unknown>).meeting_transcript as string || '',
        sentiment: sentimentData ? {
          interestLevel: sentimentData.interestLevel || 'medium',
          productFit: sentimentData.productFit || 'moderate',
          pricingSensitivity: sentimentData.pricingSensitivity || 'medium',
          recommendedPricingOption: sentimentData.recommendedPricingOption || 'A1',
          pricingRationale: sentimentData.pricingRationale || '',
        } : undefined,
        voiceAgent: {
          planId: (data.voice_agent_plan as VoiceAgentPlan) || null,
          workflowCount: data.voice_agent_workflow_count || 1,
          addons: (data.voice_agent_addons as VoiceAgentSelection['addons']) || defaultVoiceAgentSelection.addons,
          aiRecommended: false,
        },
        currentTechStack: (data as Record<string, unknown>).current_tech_stack as TechStackItem[] || [],
        bundlePricing: !!(data as Record<string, unknown>).bundle_pricing,
        contractMonths: ((data as Record<string, unknown>).contract_months as number) || 24,
      });

      // Store original quote metadata for context
      setOriginalQuoteData({
        status: data.status,
        outcome: data.outcome,
        created_at: data.created_at,
        created_by: data.created_by,
      });

      // Store version history for AI context
      setQuoteHistory((historyResult.data as QuoteVersionHistoryItem[]) || []);

      // Restore saved pricing option if present
      if ((data as Record<string, unknown>).pricing_option) {
        setSelectedPricingOption((data as Record<string, unknown>).pricing_option as 'A' | 'A1' | 'B' | 'C');
      }

      // Restore saved financial data for payment link configurator
      setLoadedQuoteFees({
        setupFee: (data as Record<string, unknown>).setup_fee_final as number | null,
        monthlyRetainer: (data as Record<string, unknown>).monthly_retainer_final as number | null,
        roiConservative: data.roi_conservative ?? null,
        roiLikely: data.roi_likely ?? null,
        roiBest: data.roi_best ?? null,
        accessCode: data.access_code ?? null,
      });

      setLoadedQuoteId(data.quote_id || data.id);
      setLoadedQuoteDbId(data.id); // Store the actual DB ID for updates
      toast.success(`Quote ${data.quote_id || data.id.slice(0, 8)} loaded with ${(historyResult.data?.length || 0)} version(s)`);
    } catch (err) {
      console.error('Failed to load quote:', err);
      toast.error('Failed to load quote. Please try again or contact support.');
    } finally {
      setIsLoadingQuote(false);
    }
  }, []);

  // Get effective pricing option (manual override or AI recommendation)
  const effectivePricingOption = useMemo(() => {
    return selectedPricingOption || formData.sentiment?.recommendedPricingOption || 'A1';
  }, [selectedPricingOption, formData.sentiment?.recommendedPricingOption]);

  return {
    formData,
    clientInputs,
    pricing,
    roiCalculations,
    complexity,
    similarQuotes,
    isLoadingSimilar,
    isSaving,
    isAnalyzing,
    selectedPricingOption,
    effectivePricingOption,
    voiceAgentCosts,
    effectiveWorkflows,
    excludedWorkflows: formData.workflows.filter(w => 
      VOICE_OVERLAPPING_WORKFLOWS.includes(w) && 
      formData.voiceAgent.planId && 
      formData.voiceAgent.planId !== 'none'
    ),
    updateField,
    updateClientInput,
    toggleWorkflow,
    toggleChallenge,
    addCustomWorkflow,
    updateCustomWorkflow,
    removeCustomWorkflow,
    customWorkflowTotals,
    updateVoiceAgent,
    fetchSimilarQuotes,
    saveQuote,
    updateFinalFees,
    analyzeTranscript,
    resetForm,
    setSelectedPricingOption,
    workflowOptions,
    challengeOptions,
    timelineOptions,
    industryOptions: industryMultipliers,
    voiceAgentPlans,
    // Quote loading
    recentQuotes,
    searchResults,
    isLoadingRecent,
    isLoadingSearch,
    isLoadingQuote,
    loadedQuoteId,
    loadedQuoteDbId, // Database UUID for notes management
    hasSearched,
    fetchRecentQuotes,
    searchQuotes,
    loadQuote,
    // Quote history context for AI
    quoteHistory,
    originalQuoteData,
    // Performance optimization flag
    hasUserInput,
    // Loaded quote financial data
    loadedQuoteFees,
    // Duplicate detection
    duplicateMatches,
    showDuplicateDialog,
    dismissDuplicateDialog,
    checkForDuplicates,
  };
}
