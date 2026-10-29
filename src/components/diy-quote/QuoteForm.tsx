import { memo, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  Building2, 
  Users, 
  Clock, 
  FileText, 
  StickyNote,
  CheckCircle2,
  Sparkles,
  MessageCircleQuestion,
  HelpCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SliderWithArrows } from '@/components/ui/slider-with-arrows';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  QuoteFormData, 
  challengeOptions,
  timelineOptions,
  TimelineConfidence,
  VoiceAgentSelection,
  QuoteVersionHistoryItem,
  FieldConfidence,
  CustomWorkflow,
} from '@/hooks/useQuoteBuilder';
import { IndustryMultiplier, getTierFromTeamSize } from '@/lib/pricingEngine';
import { ClientInputs } from '@/lib/roiScenarios';
import { cn } from '@/lib/utils';
import { StepLabel } from './StepLabel';
import { VoiceAgentStep } from './VoiceAgentStep';
import { WorkflowSelector } from './WorkflowSelector';
import { NotesHistory } from './NotesHistory';
import { QuoteNotesManager } from './QuoteNotesManager';
import { OpsComplexitySelector } from './OpsComplexitySelector';
import { ConfidenceIndicator, NeedsAttentionSection } from './ConfidenceIndicator';

interface QuoteFormProps {
  formData: QuoteFormData;
  clientInputs: ClientInputs;
  industryOptions: IndustryMultiplier[];
  quoteHistory?: QuoteVersionHistoryItem[];
  quoteDbId?: string | null;
  excludedWorkflows?: string[];
  onUpdateField: <K extends keyof QuoteFormData>(field: K, value: QuoteFormData[K]) => void;
  onUpdateClientInput: <K extends keyof ClientInputs>(field: K, value: ClientInputs[K]) => void;
  onToggleWorkflow: (workflowId: string) => void;
  onToggleChallenge: (challenge: string) => void;
  onAddCustomWorkflow: (workflow: Omit<CustomWorkflow, 'id'>) => void;
  onUpdateCustomWorkflow: (id: string, updates: Partial<Omit<CustomWorkflow, 'id'>>) => void;
  onRemoveCustomWorkflow: (id: string) => void;
  onUpdateVoiceAgent: (selection: VoiceAgentSelection) => void;
}

const getTimelineConfidenceIndicator = (confidence?: TimelineConfidence, timeline?: string) => {
  if (timeline === 'not-mentioned') {
    return {
      icon: MessageCircleQuestion,
      label: 'Not discussed',
      tooltip: 'No timeline was mentioned in the conversation. Discuss with the client.',
      variant: 'secondary' as const,
    };
  }
  
  if (confidence === 'inferred') {
    return {
      icon: Sparkles,
      label: 'AI best guess',
      tooltip: 'Timeline was inferred from conversation context and tone, not explicitly stated.',
      variant: 'outline' as const,
    };
  }
  
  if (confidence === 'explicit') {
    return {
      icon: CheckCircle2,
      label: 'Confirmed',
      tooltip: 'Timeline was explicitly mentioned in the conversation.',
      variant: 'default' as const,
    };
  }
  
  return null;
};

function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email.trim());
      setCopied(true);
      toast.success('Email copied');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Failed to copy');
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      title="Copy email"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export const QuoteForm = memo(function QuoteForm({
  formData,
  clientInputs,
  industryOptions,
  quoteHistory = [],
  quoteDbId,
  excludedWorkflows = [],
  onUpdateField,
  onUpdateClientInput,
  onToggleWorkflow,
  onToggleChallenge,
  onAddCustomWorkflow,
  onUpdateCustomWorkflow,
  onRemoveCustomWorkflow,
  onUpdateVoiceAgent,
}: QuoteFormProps) {
  const confidenceIndicator = getTimelineConfidenceIndicator(formData.timelineConfidence, formData.timeline);

  return (
    <div className="space-y-8">
      {/* Client Information */}
      <section id="step-client" className="space-y-4">
        <StepLabel 
          step={2} 
          title="Client Information" 
          description="Enter company and contact details"
        />
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Building2 className="w-5 h-5 text-primary" />
          <h3>Client Information</h3>
        </div>
        
        {(() => {
          const company = (formData.companyName || '').trim();
          const contactName = (formData.contactName || '').trim();
          const email = (formData.contactEmail || '').trim();
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
          const emailValid = emailRegex.test(email);
          const domain = emailValid ? email.split('@')[1].toLowerCase() : '';
          const freeMail = new Set([
            'gmail.com','yahoo.com','outlook.com','hotmail.com','live.com',
            'icloud.com','me.com','aol.com','proton.me','protonmail.com',
            'msn.com','bigpond.com','optusnet.com.au','iinet.net.au',
          ]);
          const isFreeMail = !!domain && freeMail.has(domain);

          const normalise = (s: string) =>
            s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
          const stop = new Set([
            'pty','ltd','limited','inc','llc','co','company','group','holdings',
            'the','and','of','services','construction','constructions','corp',
            'corporation','australia','au','solutions','consulting','consultants',
          ]);
          const companyTokens = normalise(company)
            .split(' ')
            .filter((t) => t.length >= 3 && !stop.has(t));
          const domainCore = domain
            .replace(/\.(com|net|org|co|io|ai|app|biz|info)(\.[a-z]{2})?$/,'')
            .replace(/[^a-z0-9]+/g,'');

          let domainMismatch = false;
          if (emailValid && !isFreeMail && companyTokens.length > 0 && domainCore) {
            const anyMatch = companyTokens.some(
              (t) => domainCore.includes(t) || t.includes(domainCore),
            );
            domainMismatch = !anyMatch;
          }

          const companyTooShort = company.length > 0 && company.length < 2;
          const emailInvalid = email.length > 0 && !emailValid;

          // Required-field enforcement: contact name + email must be filled.
          const contactNameMissing = contactName.length === 0;
          const contactEmailMissing = email.length === 0;

          const companyWarning = companyTooShort
            ? 'Company name looks too short.'
            : null;
          const contactNameError = contactNameMissing
            ? 'Contact name is required to generate a quote.'
            : null;
          const emailError = contactEmailMissing
            ? 'Contact email is required to generate a quote.'
            : null;
          const emailWarning = emailInvalid
            ? 'This doesn’t look like a valid email address.'
            : isFreeMail
              ? 'This is a personal email domain — confirm it’s the right contact.'
              : domainMismatch
                ? `Email domain (${domain}) doesn’t match the company name — please double-check.`
                : null;


          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="e.g., Acme Construction"
                  value={formData.companyName}
                  onChange={(e) => onUpdateField('companyName', e.target.value)}
                  aria-invalid={!!companyWarning}
                  className={cn(companyWarning && 'border-amber-500 focus-visible:ring-amber-500')}
                />
                {companyWarning && (
                  <p className="text-xs text-amber-600 dark:text-amber-500">
                    ⚠ {companyWarning}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactName">
                  Contact Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contactName"
                  placeholder="e.g., John Smith"
                  value={formData.contactName}
                  onChange={(e) => onUpdateField('contactName', e.target.value)}
                  aria-invalid={!!contactNameError}
                  className={cn(contactNameError && 'border-destructive focus-visible:ring-destructive')}
                />
                {contactNameError && (
                  <p className="text-xs text-destructive">⚠ {contactNameError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">
                  Contact Email <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="e.g., john@acme.com"
                    value={formData.contactEmail}
                    onChange={(e) => onUpdateField('contactEmail', e.target.value)}
                    aria-invalid={!!emailError || !!emailWarning}
                    className={cn(
                      'pr-9',
                      emailError && 'border-destructive focus-visible:ring-destructive',
                      !emailError && emailWarning && 'border-amber-500 focus-visible:ring-amber-500',
                    )}
                  />
                  {formData.contactEmail && formData.contactEmail.trim() !== '' && (
                    <CopyEmailButton email={formData.contactEmail} />
                  )}
                </div>
                {emailError ? (
                  <p className="text-xs text-destructive">⚠ {emailError}</p>
                ) : emailWarning ? (
                  <p className="text-xs text-amber-600 dark:text-amber-500">⚠ {emailWarning}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => onUpdateField('industry', value)}
                >
                  <SelectTrigger id="industry">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industryOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })()}
      </section>


      {/* Team & Operations */}
      <section id="step-team" className="space-y-4">
        <StepLabel 
          step={3} 
          title="Team & Operations" 
          description="Set team size and operational parameters"
        />
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Users className="w-5 h-5 text-primary" />
          <h3>Team & Operations</h3>
        </div>

        {/* Needs Attention Section */}
        <NeedsAttentionSection
          hasTranscriptAnalysis={!!formData.transcriptSummary}
          fields={[
            { name: 'Team Size', confidence: formData.teamSizeConfidence, scrollToId: 'slider-team-size' },
            { name: 'Manual Work Hours', confidence: formData.hoursPerWeekConfidence, scrollToId: 'slider-hours' },
            { name: 'Average Salary', confidence: formData.salaryConfidence, scrollToId: 'slider-salary' },
          ]}
        />

        <TooltipProvider>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total Staff Count */}
            <div id="slider-team-size" className="space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-1 min-w-0">
                  <Label className="text-sm">Total Staff Count</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-medium mb-1">Pricing Tier Factor</p>
                      <p className="text-sm text-muted-foreground">
                        Total headcount across the organisation. Determines your pricing tier.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <ConfidenceIndicator confidence={formData.teamSizeConfidence} fieldName="Total Staff" compact />
                </div>
                <span className="text-sm font-medium text-primary whitespace-nowrap">{formData.teamSize} staff</span>
              </div>
              <SliderWithArrows
                value={[formData.teamSize]}
                onValueChange={([value]) => {
                  onUpdateField('teamSize', value);
                  // Keep affected team size within bounds
                  if ((formData.affectedTeamSize ?? value) > value) {
                    onUpdateField('affectedTeamSize', value);
                  }
                }}
                min={1}
                max={500}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>250</span>
                <span>500+</span>
              </div>
            </div>

            {/* Team Size that needs optimisation */}
            <div id="slider-affected-team-size" className="space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-1 min-w-0">
                  <Label className="text-sm">Team Size that needs optimisation</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-medium mb-1">ROI &amp; SaaS Savings Factor</p>
                      <p className="text-sm text-muted-foreground">
                        The subset of staff whose workflows will actually be automated. Drives labor savings and per-seat SaaS replacement maths.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-sm font-medium text-primary whitespace-nowrap">
                  {Math.min(formData.affectedTeamSize ?? formData.teamSize, formData.teamSize)} staff
                </span>
              </div>
              <SliderWithArrows
                value={[Math.min(formData.affectedTeamSize ?? formData.teamSize, formData.teamSize)]}
                onValueChange={([value]) => onUpdateField('affectedTeamSize', value)}
                min={1}
                max={Math.max(1, formData.teamSize)}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>of {formData.teamSize}</span>
              </div>
            </div>

            {/* Workflows/SaaS to replace */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
                <div className="flex items-center gap-1 min-w-0">
                  <Label className="text-sm leading-tight">
                    <span className="hidden sm:inline">No. of non-agentic workflows or SaaS products to be replaced</span>
                    <span className="sm:hidden">Workflows/SaaS to replace</span>
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p className="font-medium mb-1">💰 Potential SaaS Savings</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Each legacy workflow or SaaS product replaced represents potential monthly savings for your client.
                      </p>
                      <div className="bg-green-500/10 p-2 rounded text-xs border border-green-500/20">
                        <p className="font-medium text-green-700 dark:text-green-400">Formula: Workflows × Team Size that needs optimisation × $20/month</p>
                        <p className="text-green-600 dark:text-green-300 font-medium mt-1">
                          Potential savings: {clientInputs.adminStaffCount} × {Math.min(formData.affectedTeamSize ?? formData.teamSize, formData.teamSize)} × $20 = ${(clientInputs.adminStaffCount * Math.min(formData.affectedTeamSize ?? formData.teamSize, formData.teamSize) * 20).toLocaleString()}/mo
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Based on typical per-seat SaaS costs that would no longer be needed after automation. Added to ROI calculations.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-sm font-medium text-primary whitespace-nowrap">{clientInputs.adminStaffCount} workflows</span>
              </div>
              <SliderWithArrows
                value={[clientInputs.adminStaffCount]}
                onValueChange={([value]) => onUpdateClientInput('adminStaffCount', value)}
                min={1}
                max={50}
                step={1}
              />
              <div className="text-xs text-green-600 dark:text-green-400">
                💰 Potential savings: ${(clientInputs.adminStaffCount * Math.min(formData.affectedTeamSize ?? formData.teamSize, formData.teamSize) * 20).toLocaleString()}/mo
              </div>
            </div>

            {/* Average Salary */}
            <div id="slider-salary" className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
                <div className="flex items-center gap-1 min-w-0">
                  <Label className="text-sm leading-tight">
                    <span className="hidden sm:inline">Average equivalent annual Salary</span>
                    <span className="sm:hidden">Avg. Annual Salary</span>
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-medium mb-1">ROI Calculation Factor</p>
                      <p className="text-sm text-muted-foreground">
                        Used to calculate potential savings from automating manual work. Higher salaries mean higher potential ROI.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <ConfidenceIndicator confidence={formData.salaryConfidence} fieldName="Avg. Salary" compact />
                </div>
                <span className="text-sm font-medium text-primary whitespace-nowrap">${clientInputs.averageHourlyCost.toLocaleString()}/year</span>
              </div>
              <SliderWithArrows
                value={[clientInputs.averageHourlyCost]}
                onValueChange={([value]) => onUpdateClientInput('averageHourlyCost', value)}
                min={50000}
                max={300000}
                step={5000}
              />
            </div>

            {/* Hours per week */}
            <div id="slider-hours" className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
                <div className="flex items-center gap-1 min-w-0">
                  <Label className="text-sm leading-tight">
                    <span className="hidden sm:inline">Hours per person per week on manual/repetitive work</span>
                    <span className="sm:hidden">Manual work hrs/week</span>
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-medium mb-1">Labor Savings Calculation</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Hours each team member spends weekly on repetitive tasks that AI can automate.
                      </p>
                      <div className="bg-muted/50 p-2 rounded text-xs">
                        <p className="font-medium">Formula: Hours × Team Size that needs optimisation × Hourly Rate × 52 weeks</p>
                        <p className="text-primary font-medium mt-1">
                          {clientInputs.hoursPerWeekOnAdmin} hrs × {Math.min(formData.affectedTeamSize ?? formData.teamSize, formData.teamSize)} staff × ${Math.round(clientInputs.averageHourlyCost / 2080)}/hr × 52 = ${Math.round(clientInputs.hoursPerWeekOnAdmin * Math.min(formData.affectedTeamSize ?? formData.teamSize, formData.teamSize) * (clientInputs.averageHourlyCost / 2080) * 52).toLocaleString()}/year potential
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                  <ConfidenceIndicator confidence={formData.hoursPerWeekConfidence} fieldName="Hours/Week" compact />
                </div>
                <span className="text-sm font-medium text-primary whitespace-nowrap">{clientInputs.hoursPerWeekOnAdmin} hrs/person</span>
              </div>
              <SliderWithArrows
                value={[clientInputs.hoursPerWeekOnAdmin]}
                onValueChange={([value]) => onUpdateClientInput('hoursPerWeekOnAdmin', value)}
                min={5}
                max={40}
                step={1}
              />
            </div>
          </div>
        </TooltipProvider>

        {/* Operational Complexity Selector */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <OpsComplexitySelector
            value={formData.opsComplexity}
            onChange={(value) => onUpdateField('opsComplexity', value)}
            tierSetupBase={getTierFromTeamSize(formData.teamSize).setupBase}
            tierSetupCeiling={getTierFromTeamSize(formData.teamSize).setupCeiling}
          />
        </div>
      </section>

      {/* Workflows - using new WorkflowSelector component */}
      <WorkflowSelector
        selectedWorkflows={formData.workflows}
        suggestedWorkflows={formData.suggestedWorkflows || []}
        excludedWorkflows={excludedWorkflows}
        bundlePricing={formData.bundlePricing}
        customWorkflows={formData.customWorkflows}
        onToggleWorkflow={onToggleWorkflow}
        onDismissSuggestion={(id) => onUpdateField('suggestedWorkflows', (formData.suggestedWorkflows || []).filter(w => w !== id))}
        onClearSuggestions={() => onUpdateField('suggestedWorkflows', [])}
        onToggleBundlePricing={(value) => onUpdateField('bundlePricing', value)}
        onAddCustomWorkflow={onAddCustomWorkflow}
        onUpdateCustomWorkflow={onUpdateCustomWorkflow}
        onRemoveCustomWorkflow={onRemoveCustomWorkflow}
        hasTranscriptAnalysis={!!formData.transcriptSummary && formData.workflows.length > 0}
      />

      {/* Challenges */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <FileText className="w-5 h-5 text-primary" />
          <h3>Current Challenges</h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {challengeOptions.map((challenge) => {
            const isSelected = formData.challenges.includes(challenge);
            return (
              <Badge
                key={challenge}
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-all",
                  isSelected && "bg-primary hover:bg-primary/90"
                )}
                onClick={() => onToggleChallenge(challenge)}
              >
                {challenge}
              </Badge>
            );
          })}
        </div>
      </section>

      {/* Voice Agent - Step 4a */}
      <VoiceAgentStep
        selection={formData.voiceAgent}
        onUpdateSelection={onUpdateVoiceAgent}
        aiRecommendedPlan={formData.voiceAgentRecommendedPlan}
        aiRationale={formData.voiceAgentRationale}
      />

      {/* Timeline */}
      <section id="step-timeline" className="space-y-4">
        <StepLabel 
          step={5} 
          title="Timeline" 
          description="Set expected implementation timeline"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Clock className="w-5 h-5 text-primary" />
            <h3>Timeline</h3>
          </div>
          {confidenceIndicator && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant={confidenceIndicator.variant}
                    className={cn(
                      "flex items-center gap-1 cursor-help",
                      formData.timeline === 'not-mentioned' && "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700",
                      formData.timelineConfidence === 'inferred' && "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700"
                    )}
                  >
                    <confidenceIndicator.icon className="w-3 h-3" />
                    {confidenceIndicator.label}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{confidenceIndicator.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {timelineOptions.map((option) => {
            const isNotMentioned = option.id === 'not-mentioned';
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onUpdateField('timeline', option.id);
                  // Clear confidence when manually selecting
                  if (formData.timelineConfidence) {
                    onUpdateField('timelineConfidence', undefined);
                  }
                }}
                className={cn(
                  "p-3 rounded-lg border text-sm font-medium transition-all",
                  formData.timeline === option.id
                    ? isNotMentioned
                      ? "bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-600"
                      : "bg-primary text-primary-foreground border-primary"
                    : isNotMentioned
                      ? "bg-card border-dashed border-muted-foreground/50 text-muted-foreground hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                      : "bg-card border-border hover:border-primary/50"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Notes */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <StickyNote className="w-5 h-5 text-primary" />
          <h3>Additional Notes</h3>
        </div>

        <Textarea
          placeholder="Any additional context, special requirements, or notes from the meeting..."
          value={formData.notes}
          onChange={(e) => onUpdateField('notes', e.target.value)}
          rows={4}
        />

        {/* Notes Management - always visible */}
        <QuoteNotesManager quoteDbId={quoteDbId ?? null} />

        {/* Notes History - only shown when there's history */}
        {quoteHistory.length > 0 && (
          <NotesHistory history={quoteHistory} />
        )}
      </section>
    </div>
  );
});