import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { SafeAnimatePresence } from '@/components/ui/safe-animate-presence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  CheckCircle2, 
  AlertCircle,
  DollarSign,
  Calendar,
  Sparkles,
  HelpCircle,
  RotateCcw,
  FilePlus,
  BadgePercent,
  ChevronDown
} from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { MeetingSentiment } from '@/hooks/useQuoteBuilder';
import { PricingResult } from '@/lib/pricingEngine';
import { StepLabel } from './StepLabel';
import { SpecialDiscountSelector } from './SpecialDiscountSelector';

interface PricingRecommendationProps {
  sentiment: MeetingSentiment | undefined;
  pricing: PricingResult;
  selectedOption: 'A' | 'A1' | 'B' | 'C' | null;
  effectiveOption: 'A' | 'A1' | 'B' | 'C';
  onSelectOption: (option: 'A' | 'A1' | 'B' | 'C' | null) => void;
  isLoadedQuote?: boolean;
  onNewQuote?: () => void;
  onSaveAndNewQuote?: () => Promise<void>;
  isSaving?: boolean;
  specialDiscount?: string;
  specialDiscountCustomPercent?: number;
  onSpecialDiscountChange?: (value: string) => void;
  onSpecialDiscountCustomPercentChange?: (value: number) => void;
  contractMonths: number;
  onContractMonthsChange: (months: number) => void;
}

interface PricingOption {
  id: 'A' | 'A1' | 'B' | 'C';
  name: string;
  description: string;
  setupStructure: string[];
  retainerNote: string;
  discount: string;
  bestFor: string;
  tooltip: string;
  whyChoose: string[];
}

const pricingOptions: PricingOption[] = [
  {
    id: 'A',
    name: 'Standard Setup',
    description: 'Normal payment terms for confident buyers',
    setupStructure: [
      '50% Project Initiation Fee (upfront)',
      '20% Month 1',
      '20% Month 2', 
      '10% Month 3'
    ],
    retainerNote: 'Retainer kicks in at UAT (User Approved Testing) - usually week 3-4',
    discount: 'No discount',
    bestFor: 'High interest prospects with strong product fit',
    tooltip: 'Standard payment terms with spread-out setup costs. Best when the prospect shows strong buying signals and isn\'t price-sensitive.',
    whyChoose: [
      'Prospect shows high interest and urgency',
      'Clear product-problem fit identified',
      'Budget is not a primary concern',
      'Standard cash flow for your business'
    ]
  },
  {
    id: 'A1',
    name: 'Pay Full Upfront',
    description: 'Full setup fee paid upfront, no installments',
    setupStructure: [
      '100% Setup Fee paid upfront',
    ],
    retainerNote: 'Retainer kicks in at UAT (User Approved Testing) - usually week 3-4',
    discount: 'No discount',
    bestFor: 'Confident buyers who prefer a single payment over installments',
    tooltip: 'Same pricing as Standard Setup but collected as a single upfront payment. Best for buyers who want simplicity and have budget available.',
    whyChoose: [
      'Prospect prefers one-time payment simplicity',
      'Strong buying signals with available budget',
      'No need for installment flexibility',
      'Faster onboarding without payment milestones'
    ]
  },
  {
    id: 'B',
    name: 'Price-Friendly Setup',
    description: 'Discounted setup for budget-conscious buyers',
    setupStructure: [
      '20% Discounted Setup',
      'Paid 100% upfront'
    ],
    retainerNote: 'Same retainer structure as Standard (kicks in at UAT)',
    discount: '20% off setup',
    bestFor: 'Price-sensitive prospects who need a deal to commit',
    tooltip: 'Offer a 20% discount on setup to close price-conscious deals. Requires full upfront payment for the discounted setup.',
    whyChoose: [
      'Prospect is interested but hesitant on price',
      'Mentioned budget constraints or competitor pricing',
      'Needs a "deal" to justify the purchase internally',
      'Good fit but moderate closing urgency'
    ]
  },
  {
    id: 'C',
    name: 'Long-Term Commitment',
    description: 'Maximum savings with long-term contract',
    setupStructure: [
      '50% Discounted Setup',
      'Paid 100% upfront'
    ],
    retainerNote: 'Setup savings redistributed into monthly retainer over contract period',
    discount: '50% off setup',
    bestFor: 'Budget-constrained but long-term committed prospects',
    tooltip: 'Maximum discount (50% off setup) in exchange for a long-term retainer commitment. The setup savings are redistributed into your monthly retainer, providing predictable long-term costs.',
    whyChoose: [
      'Strong interest but very budget-constrained',
      'Willing to commit long-term for maximum savings',
      'Prefer predictable ongoing costs over large upfront payments',
      'Values long-term partnership and relationship building'
    ]
  }
];

const getSentimentIcon = (level: string, type: 'interest' | 'fit' | 'price') => {
  if (type === 'price') {
    if (level === 'high') return <TrendingUp className="h-4 w-4 text-amber-500" />;
    if (level === 'low') return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
  if (level === 'high' || level === 'strong') return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (level === 'low' || level === 'weak') return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

const getSentimentColor = (level: string, type: 'interest' | 'fit' | 'price') => {
  if (type === 'price') {
    if (level === 'high') return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    if (level === 'low') return 'bg-green-500/10 text-green-600 border-green-500/20';
    return 'bg-muted text-muted-foreground';
  }
  if (level === 'high' || level === 'strong') return 'bg-green-500/10 text-green-600 border-green-500/20';
  if (level === 'low' || level === 'weak') return 'bg-red-500/10 text-red-600 border-red-500/20';
  return 'bg-muted text-muted-foreground';
};

export const PricingRecommendation = memo(function PricingRecommendation({ 
  sentiment, 
  pricing,
  selectedOption,
  effectiveOption,
  onSelectOption,
  isLoadedQuote = false,
  onNewQuote,
  onSaveAndNewQuote,
  isSaving = false,
  specialDiscount = 'none',
  specialDiscountCustomPercent = 20,
  onSpecialDiscountChange,
  onSpecialDiscountCustomPercentChange,
  contractMonths,
  onContractMonthsChange,
}: PricingRecommendationProps) {
  const [showNewQuoteDialog, setShowNewQuoteDialog] = useState(false);

  const handleNewQuoteClick = () => {
    setShowNewQuoteDialog(true);
  };

  const handleDiscard = () => {
    setShowNewQuoteDialog(false);
    onNewQuote?.();
  };

  const handleSaveAndNew = async () => {
    await onSaveAndNewQuote?.();
    setShowNewQuoteDialog(false);
  };
  const currentOption = pricingOptions.find(o => o.id === effectiveOption) || pricingOptions[0];
  const isManualOverride = selectedOption !== null;
  
  const getSetupPrice = (option: PricingOption) => {
    const base = pricing.setupInvestment;
    if (option.id === 'B') return Math.round(base * 0.8);
    if (option.id === 'C') return Math.round(base * 0.5);
    return base;
  };

  // Calculate Option C's redistributed monthly retainer
  const getMonthlyRetainer = (option: PricingOption) => {
    const base = pricing.monthlyRetainer;
    if (option.id === 'C') {
      const setupDiscount = pricing.setupInvestment * 0.5;
      const months = contractMonths || 24;
      return Math.round(base + (setupDiscount / months));
    }
    return base;
  };

  const setupPrice = getSetupPrice(currentOption);
  const monthlyRetainer = getMonthlyRetainer(currentOption);

  return (
    <TooltipProvider>
      <motion.div
        id="step-pricing"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <StepLabel 
          step={6} 
          title="Choose Pricing Option" 
          description="Select the best pricing structure"
        />
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                Pricing Structure
              </CardTitle>
              {isManualOverride && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectOption(null)}
                  className="text-xs gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset to AI
                </Button>
              )}
            </div>
            {isManualOverride && (
              <Badge variant="outline" className="w-fit text-xs">
                Manual Override Active
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sentiment Analysis Summary - Show sentiment, fallback for old quotes, or nothing for new quotes */}
            {sentiment ? (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Meeting Sentiment Analysis</h4>
                <div className="grid grid-cols-3 gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="space-y-1 cursor-help">
                        <span className="text-xs text-muted-foreground">Interest Level</span>
                        <Badge 
                          variant="outline" 
                          className={`w-full justify-center gap-1.5 ${getSentimentColor(sentiment.interestLevel, 'interest')}`}
                        >
                          {getSentimentIcon(sentiment.interestLevel, 'interest')}
                          {sentiment.interestLevel.charAt(0).toUpperCase() + sentiment.interestLevel.slice(1)}
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p><strong>High:</strong> Asks detailed questions, discusses timelines, shows urgency</p>
                      <p><strong>Medium:</strong> Engaged but non-committal on next steps</p>
                      <p><strong>Low:</strong> Skeptical, many objections, disengaged</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="space-y-1 cursor-help">
                        <span className="text-xs text-muted-foreground">Product Fit</span>
                        <Badge 
                          variant="outline" 
                          className={`w-full justify-center gap-1.5 ${getSentimentColor(sentiment.productFit, 'fit')}`}
                        >
                          {getSentimentIcon(sentiment.productFit, 'fit')}
                          {sentiment.productFit.charAt(0).toUpperCase() + sentiment.productFit.slice(1)}
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p><strong>Strong:</strong> Clear pain points matching our solutions</p>
                      <p><strong>Moderate:</strong> Some relevant needs, some gaps</p>
                      <p><strong>Weak:</strong> Pain points don't align with AI/automation</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="space-y-1 cursor-help">
                        <span className="text-xs text-muted-foreground">Price Sensitivity</span>
                        <Badge 
                          variant="outline" 
                          className={`w-full justify-center gap-1.5 ${getSentimentColor(sentiment.pricingSensitivity, 'price')}`}
                        >
                          {getSentimentIcon(sentiment.pricingSensitivity, 'price')}
                          {sentiment.pricingSensitivity.charAt(0).toUpperCase() + sentiment.pricingSensitivity.slice(1)}
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p><strong>High:</strong> Budget constraints, asks about discounts</p>
                      <p><strong>Medium:</strong> Price-aware but focuses on value</p>
                      <p><strong>Low:</strong> Budget not a concern, outcome-focused</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ) : isLoadedQuote ? (
              <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                        Sentiment Analysis Not Available
                      </p>
                      <p className="text-sm text-amber-600 dark:text-amber-500">
                        This quote was created before AI sentiment analysis was added. 
                        To get AI pricing recommendations, paste a new transcript in Step 1 
                        and click "Analyze with AI".
                      </p>
                      <p className="text-xs text-amber-500 dark:text-amber-600">
                        Without sentiment data, pricing defaults to Option A1 (Standard Setup + Slot Reservation).
                      </p>
                    </div>
                    {onNewQuote && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNewQuoteClick}
                        className="gap-2 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                      >
                        <FilePlus className="w-4 h-4" />
                        Start New Quote
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {/* New Quote Confirmation Dialog */}
            <AlertDialog open={showNewQuoteDialog} onOpenChange={setShowNewQuoteDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    Start New Quote?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>You have an unsaved quote loaded. What would you like to do?</p>
                    <p className="text-xs text-muted-foreground">
                      Starting a new quote will clear the current form. Any unsaved changes will be lost.
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <Button
                    variant="outline"
                    onClick={handleDiscard}
                    className="border-destructive/50 text-destructive hover:bg-destructive/10"
                  >
                    Discard & Create New
                  </Button>
                  {onSaveAndNewQuote && (
                    <AlertDialogAction
                      onClick={handleSaveAndNew}
                      disabled={isSaving}
                      className="gap-2"
                    >
                      {isSaving ? 'Saving...' : 'Save & Create New'}
                    </AlertDialogAction>
                  )}
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Option Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">Select Pricing Option</h4>
                {sentiment && !isManualOverride && (
                  <Badge variant="secondary" className="text-xs">
                    AI Recommended: Option {sentiment.recommendedPricingOption}
                  </Badge>
                )}
              </div>
              <div className="grid gap-2">
                {pricingOptions.map((option) => (
                  <Tooltip key={option.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onSelectOption(option.id === effectiveOption && isManualOverride ? null : option.id)}
                        className={`flex items-center justify-between rounded-lg border p-3 text-sm text-left transition-all hover:border-primary/50 ${
                          option.id === effectiveOption 
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                            : 'border-border bg-card/50 hover:bg-card'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {option.id === effectiveOption ? (
                            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                          )}
                          <div>
                            <span className="font-medium">Option {option.id}:</span>{' '}
                            <span className="text-muted-foreground">{option.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {option.discount}
                          </Badge>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-sm p-4">
                      <div className="space-y-2">
                        <p className="font-medium">{option.name}</p>
                        <p className="text-sm text-muted-foreground">{option.tooltip}</p>
                        <div className="pt-2 border-t">
                          <p className="text-xs font-medium mb-1">Why choose this option:</p>
                          <ul className="text-xs text-muted-foreground space-y-0.5">
                            {option.whyChoose.map((reason, i) => (
                              <li key={i}>• {reason}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>

            {/* Selected Option Details */}
            <SafeAnimatePresence mode="wait">
              <motion.div
                key={effectiveOption}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="rounded-lg border bg-card p-4 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{currentOption.name}</h3>
                    <p className="text-sm text-muted-foreground">{currentOption.description}</p>
                  </div>
                  {currentOption.discount !== 'No discount' && (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                      {currentOption.discount}
                    </Badge>
                  )}
                </div>

                {/* Setup Structure */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Setup Fee Structure
                  </div>
                  <div className="pl-6 space-y-1">
                    {currentOption.setupStructure.map((step, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary/60" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pl-6 pt-1">
                    <span className="text-sm font-medium text-primary">
                      Total Setup: ${setupPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Retainer Note */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4 text-primary" />
                    Monthly Retainer
                  </div>
                  <p className="pl-6 text-sm text-muted-foreground">
                    {currentOption.retainerNote}
                  </p>
                  <div className="pl-6 space-y-1">
                    <span className="text-sm font-medium text-primary">
                      ${monthlyRetainer.toLocaleString()}/month
                    </span>
                    {currentOption.id === 'C' && (
                      <span className="block text-xs text-muted-foreground">
                        (includes ${Math.round((pricing.setupInvestment * 0.5) / (contractMonths || 24)).toLocaleString()}/mo redistributed from setup discount over {contractMonths || 24} months)
                      </span>
                    )}

                    {pricing.potentialSaasSavings && pricing.potentialSaasSavings.monthlySavings > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block text-xs text-green-600 dark:text-green-400 cursor-help underline decoration-dotted">
                            💰 +${pricing.potentialSaasSavings.monthlySavings.toLocaleString()}/mo potential SaaS savings
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p className="font-medium mb-1">💰 Potential SaaS Savings</p>
                          <p className="text-sm">
                            {pricing.potentialSaasSavings.workflowsToReplace} workflows × {pricing.potentialSaasSavings.teamSize} users × ${pricing.potentialSaasSavings.ratePerUserPerWorkflow}/mo
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">
                            Annual savings: ${pricing.potentialSaasSavings.annualSavings.toLocaleString()}/year
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Estimated savings from replacing legacy SaaS products. Included in ROI calculations.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>

                {/* Commitment Payment Note */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <DollarSign className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm">
                    <span className="font-medium text-primary">$5,000 commitment payment required</span>
                    <span className="text-muted-foreground"> to secure your project slot.</span>
                  </p>
                </div>

                {/* Best For */}
                <div className="flex items-start gap-2 pt-2 border-t">
                  <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Best for:</span> {currentOption.bestFor}
                  </p>
                </div>

                {/* Contract Period - Available for all options */}
                <div className="flex flex-col gap-2 pt-2 border-t">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Contract Period:</label>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={contractMonths > 0}
                      onClick={() => {
                        if (contractMonths > 0) {
                          onContractMonthsChange(0);
                        } else {
                          onContractMonthsChange(12);
                        }
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        contractMonths > 0 ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                          contractMonths > 0 ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs text-muted-foreground">{contractMonths > 0 ? 'On' : 'Off'}</span>
                  </div>
                  {contractMonths > 0 && (
                    <div className="flex items-center gap-2 pl-0 sm:pl-24">
                      <input
                        type="number"
                        min={6}
                        max={60}
                        value={contractMonths}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === '') {
                            onContractMonthsChange(0);
                            return;
                          }
                          const parsed = parseInt(raw, 10);
                          if (!isNaN(parsed)) {
                            onContractMonthsChange(parsed);
                          }
                        }}
                        onBlur={() => {
                          if (!contractMonths || contractMonths < 6) {
                            onContractMonthsChange(6);
                          } else if (contractMonths > 60) {
                            onContractMonthsChange(60);
                          }
                        }}
                        className={`w-20 h-8 px-2 text-sm rounded-md border bg-background text-foreground text-center ${
                          contractMonths < 6 || contractMonths > 60
                            ? 'border-destructive ring-1 ring-destructive/30'
                            : 'border-border'
                        }`}
                      />
                      <span className="text-xs text-muted-foreground">months</span>
                      {(contractMonths < 6 || contractMonths > 60) && contractMonths !== 0 && (
                        <span className="text-xs text-destructive whitespace-nowrap">Must be 6–60</span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </SafeAnimatePresence>

            {/* AI Rationale */}
            {sentiment?.pricingRationale && !isManualOverride && (
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">AI Rationale</h4>
                <p className="text-sm">{sentiment.pricingRationale}</p>
              </div>
            )}

            {/* Special Sales Discount - Collapsed by default */}
            {onSpecialDiscountChange && onSpecialDiscountCustomPercentChange && (
              <div className="pt-4 border-t border-border">
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2 group">
                    <div className="flex items-center gap-2">
                      <BadgePercent className="w-5 h-5 text-primary" />
                      <span className="text-base font-semibold">Special Sales Discount</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="pt-2">
                      <SpecialDiscountSelector
                        value={specialDiscount}
                        customPercent={specialDiscountCustomPercent}
                        onChange={onSpecialDiscountChange}
                        onCustomPercentChange={onSpecialDiscountCustomPercentChange}
                        hideHeader
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
});
