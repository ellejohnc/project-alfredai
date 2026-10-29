import { memo, useMemo, useState } from 'react';
import { FileDown, ZoomIn, ZoomOut, Eye, ShieldCheck, Building2, Zap, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PricingResult, formatCurrency } from '@/lib/pricingEngine';
import { ROICalculation } from '@/lib/roiScenarios';
import { QuoteFormData } from '@/hooks/useQuoteBuilder';
import { getWorkflowById } from '@/lib/workflowDefinitions';
import { PRODUCTION_URL, PRODUCTION_DOMAIN } from '@/lib/siteConfig';

interface VoiceAgentCosts {
  monthly: number;
  setup: number;
  planName?: string;
  workflowCount?: number;
}

interface PaymentLinks {
  slotReservation?: string;
  setupFee?: string;
  monthlyRetainer?: string;
}

interface ProposalInfo {
  quoteId?: string;
  accessCode?: string;
}

interface PDFPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: QuoteFormData;
  pricing: PricingResult;
  roiCalculations: ROICalculation[];
  effectivePricingOption: 'A' | 'A1' | 'B' | 'C';
  voiceAgentCosts?: VoiceAgentCosts;
  salesRepName: string;
  onExport: () => void;
  isExporting: boolean;
  paymentLinks?: PaymentLinks;
  proposalInfo?: ProposalInfo;
}

// Brand colors matching the PDF
const colors = {
  signalPink: '#EC4899',
  mintSignal: '#2DD4BF',
  deepIndigo: '#1E293B',
  slateGrey: '#475569',
  lightSlate: '#94A3B8',
  cardBg: '#F8FAFC',
  cardBorder: '#E2E8F0',
  gold: '#EAB308',
};

const pricingOptionNames: Record<'A' | 'A1' | 'B' | 'C', string> = {
  A: 'Standard Setup',
  A1: 'Pay Full Upfront',
  B: 'Price-Friendly Setup (20% Off)',
  C: 'Long-Term Commitment (50% Off)',
};

export const PDFPreviewModal = memo(function PDFPreviewModal({
  open,
  onOpenChange,
  formData,
  pricing,
  roiCalculations,
  effectivePricingOption,
  voiceAgentCosts,
  salesRepName,
  onExport,
  isExporting,
  paymentLinks,
  proposalInfo,
}: PDFPreviewModalProps) {
  const [scale, setScale] = useState(1);
  
  const hasVoiceAgent = voiceAgentCosts && (voiceAgentCosts.monthly > 0 || voiceAgentCosts.setup > 0);
  
  const setupPrice = useMemo(() => {
    const baseMin = pricing.setupRange.min;
    const baseMax = pricing.setupRange.max;
    
    if (effectivePricingOption === 'B') {
      return { min: baseMin * 0.8, max: baseMax * 0.8 };
    }
    if (effectivePricingOption === 'C') {
      return { min: baseMin * 0.5, max: baseMax * 0.5 };
    }
    return { min: baseMin, max: baseMax };
  }, [pricing, effectivePricingOption]);
  
  const monthlyRetainer = useMemo(() => {
    if (effectivePricingOption === 'C') {
      const months = formData.contractMonths || 24;
      const setupDiscountMin = pricing.setupRange.min * 0.5;
      const setupDiscountMax = pricing.setupRange.max * 0.5;
      return {
        min: Math.round(pricing.monthlyRange.min + (setupDiscountMin / months)),
        max: Math.round(pricing.monthlyRange.max + (setupDiscountMax / months))
      };
    }
    return pricing.monthlyRange;
  }, [pricing, effectivePricingOption, formData.contractMonths]);

  const firstYearMin = setupPrice.min + (monthlyRetainer.min * 12);
  const firstYearMax = setupPrice.max + (monthlyRetainer.max * 12);

  const getTimelineDisplay = () => {
    if (formData.timeline === 'not-mentioned') return 'To be discussed';
    const label = formData.timeline.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    if (formData.timelineConfidence === 'inferred') return `${label} (estimated)`;
    return label;
  };

  const roiLabels = [
    { title: 'Conservative', subtitle: 'Guaranteed', color: colors.mintSignal },
    { title: 'Most Likely', subtitle: 'Expected', color: colors.signalPink },
    { title: 'Best Case', subtitle: 'Maximum', color: colors.gold },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-primary" />
              <DialogTitle>PDF Preview</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
                disabled={scale <= 0.5}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground w-12 text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setScale(s => Math.min(1.5, s + 0.1))}
                disabled={scale >= 1.5}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button onClick={onExport} disabled={isExporting} className="ml-4 gap-2">
                <FileDown className="w-4 h-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-6 bg-muted/20">
          <div 
            className="mx-auto space-y-6"
            style={{ 
              transform: `scale(${scale})`, 
              transformOrigin: 'top center',
              width: '210mm',
              maxWidth: '100%'
            }}
          >
            {/* PAGE 1 PREVIEW */}
            <div 
              className="bg-white shadow-xl rounded-lg overflow-hidden border"
              style={{ aspectRatio: '210/297', minHeight: '400px' }}
            >
              {/* Header */}
              <div 
                className="relative p-6 overflow-hidden"
                style={{ background: colors.deepIndigo }}
              >
                {/* Diagonal pattern overlay */}
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: `repeating-linear-gradient(
                      45deg,
                      transparent,
                      transparent 5px,
                      rgba(255,255,255,0.1) 5px,
                      rgba(255,255,255,0.1) 10px
                    )`
                  }}
                />
                <div className="relative flex justify-between items-start">
                  <div>
                    <h1 className="text-xl font-bold" style={{ color: colors.signalPink }}>
                      alfred ai
                    </h1>
                    <p className="text-sm italic mt-1" style={{ color: colors.mintSignal }}>
                      Your AI Workforce Partner
                    </p>
                  </div>
                  <div className="text-right">
                    <span 
                      className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white"
                      style={{ background: colors.signalPink }}
                    >
                      ABC-DEFG-HIJK
                    </span>
                    <p className="text-xs mt-2" style={{ color: colors.lightSlate }}>
                      {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    {salesRepName && (
                      <p className="text-xs" style={{ color: colors.lightSlate }}>
                        Prepared by {salesRepName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-5">
                {/* Client Info Card */}
                <div className="border rounded-lg p-4" style={{ borderColor: colors.cardBorder }}>
                  <h3 className="font-bold text-sm mb-3" style={{ color: colors.deepIndigo }}>
                    Client Information
                  </h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Company:</span>{' '}
                      <span className="font-medium">{formData.companyName || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Contact:</span>{' '}
                      <span className="font-medium">{formData.contactName || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Industry:</span>{' '}
                      <span className="font-medium">{formData.industry.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Team Size:</span>{' '}
                      <span className="font-medium">{formData.teamSize} people</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Timeline:</span>{' '}
                      <span className="font-medium">{getTimelineDisplay()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>{' '}
                      <span className="font-medium">{formData.contactEmail || 'Not provided'}</span>
                    </div>
                  </div>
                </div>
                
                {/* Current Systems (Tech Stack) */}
                {formData.currentTechStack && formData.currentTechStack.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-4 rounded" style={{ background: '#F97316' }} />
                      <h3 className="font-bold text-sm" style={{ color: colors.deepIndigo }}>
                        Current Systems
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.currentTechStack.slice(0, 6).map((tech, i) => (
                        <span 
                          key={i} 
                          className="text-[10px] px-2 py-0.5 rounded-full border"
                          style={{ 
                            borderColor: tech.integrationNeed === 'replace' ? '#FCA5A5' : 
                                        tech.integrationNeed === 'integrate' ? '#93C5FD' : '#86EFAC',
                            background: tech.integrationNeed === 'replace' ? '#FEF2F2' : 
                                        tech.integrationNeed === 'integrate' ? '#EFF6FF' : '#F0FDF4'
                          }}
                        >
                          {tech.integrationNeed === 'replace' ? '→' : 
                           tech.integrationNeed === 'integrate' ? '+' : '↑'} {tech.name}
                        </span>
                      ))}
                      {formData.currentTechStack.length > 6 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100">
                          +{formData.currentTechStack.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Client's Expressed Needs */}
                {formData.challenges.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-4 rounded" style={{ background: colors.signalPink }} />
                      <h3 className="font-bold text-sm" style={{ color: colors.deepIndigo }}>
                        Client's Expressed Needs
                      </h3>
                    </div>
                    <div className="space-y-1">
                      {formData.challenges.map((challenge, i) => (
                        <p key={i} className="text-xs" style={{ color: colors.deepIndigo }}>
                          • {challenge}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Our Solution (Workflows with descriptions) */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 rounded" style={{ background: colors.mintSignal }} />
                    <h3 className="font-bold text-sm" style={{ color: colors.deepIndigo }}>
                      Our Solution: AI Agent Workflows
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {formData.workflows.length > 0 ? (
                      formData.workflows.map((workflowId, i) => {
                        if (typeof workflowId !== 'string') return null;
                        const workflow = getWorkflowById(workflowId);
                        // Defensive: ensure workflow has required properties
                        if (!workflow || typeof workflow.name !== 'string') {
                          return (
                            <div key={i} className="pl-2 border-l-2" style={{ borderColor: colors.mintSignal }}>
                              <p className="text-xs font-medium" style={{ color: colors.deepIndigo }}>
                                {workflowId}
                              </p>
                            </div>
                          );
                        }
                        return (
                          <div key={i} className="pl-2 border-l-2" style={{ borderColor: colors.mintSignal }}>
                            <p className="text-xs font-medium" style={{ color: colors.deepIndigo }}>
                              {workflow.name}
                            </p>
                            {workflow.description && (
                              <p className="text-[10px] text-muted-foreground line-clamp-2">
                                {workflow.description}
                              </p>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-xs text-muted-foreground">No workflows selected</span>
                    )}
                  </div>
                </div>
                
                {/* Investment Box */}
                <div 
                  className="rounded-lg p-4 border-2"
                  style={{ 
                    background: 'linear-gradient(135deg, #FFF5FA 0%, #F0FDFA 100%)',
                    borderColor: colors.signalPink 
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm" style={{ color: colors.deepIndigo }}>
                      Investment Estimate
                    </h3>
                    <span 
                      className="text-xs px-2 py-0.5 rounded-full text-white font-bold"
                      style={{ background: colors.signalPink }}
                    >
                      Option {effectivePricingOption}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Setup Fee</p>
                      <p className="font-bold" style={{ color: colors.deepIndigo }}>
                        {formatCurrency(setupPrice.min)} - {formatCurrency(setupPrice.max)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly Retainer</p>
                      <p className="font-bold" style={{ color: colors.deepIndigo }}>
                        {formatCurrency(monthlyRetainer.min)} - {formatCurrency(monthlyRetainer.max)}/mo
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-muted-foreground">First Year Investment</p>
                      <p className="text-lg font-bold" style={{ color: colors.signalPink }}>
                        {formatCurrency(firstYearMin)} - {formatCurrency(firstYearMax)}
                      </p>
                    </div>
                    {pricing.potentialSaasSavings && pricing.potentialSaasSavings.annualSavings > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">SaaS Savings</p>
                        <p className="font-bold" style={{ color: colors.mintSignal }}>
                          {formatCurrency(pricing.potentialSaasSavings.annualSavings)}/yr
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {hasVoiceAgent && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: colors.cardBorder }}>
                      <p className="text-xs font-medium" style={{ color: colors.deepIndigo }}>
                        Voice Agent{voiceAgentCosts?.planName ? ` (${voiceAgentCosts.planName})` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Setup: {formatCurrency(voiceAgentCosts?.setup || 0)} • Monthly: {formatCurrency(voiceAgentCosts?.monthly || 0)}/mo
                      </p>
                    </div>
                  )}
                  
                  {/* Commitment callout */}
                  <div 
                    className="mt-3 py-2 px-3 rounded text-center"
                    style={{ background: colors.signalPink }}
                  >
                    <p className="text-xs font-bold text-white">
                      $5,000 Commitment Payment Required to Secure Your Project Slot
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 px-6 py-3 border-t text-xs text-muted-foreground flex justify-between">
                <span>Your AI Workforce Partner • {PRODUCTION_DOMAIN}</span>
                <span>Page 1 of 2</span>
              </div>
            </div>
            
            {/* PAGE 2 PREVIEW */}
            <div 
              className="bg-white shadow-xl rounded-lg overflow-hidden border"
              style={{ aspectRatio: '210/297', minHeight: '400px' }}
            >
              {/* Mini Header */}
              <div 
                className="p-4 flex justify-between items-center"
                style={{ background: colors.deepIndigo }}
              >
                <span className="font-bold" style={{ color: colors.signalPink }}>alfred ai</span>
                <span className="text-sm text-white">Return on Investment Analysis</span>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-5">
                {/* ROI Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 rounded" style={{ background: colors.signalPink }} />
                    <h3 className="font-bold text-sm" style={{ color: colors.deepIndigo }}>
                      ROI Projections
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {roiCalculations.map((roi, i) => (
                      <div 
                        key={i}
                        className="rounded-lg border-2 p-3 text-center relative overflow-hidden"
                        style={{ borderColor: roiLabels[i].color }}
                      >
                        <div 
                          className="absolute top-0 left-0 right-0 h-1"
                          style={{ background: roiLabels[i].color }}
                        />
                        <p className="font-bold text-xs" style={{ color: colors.deepIndigo }}>
                          {roiLabels[i].title}
                        </p>
                        <p className="text-[10px] text-muted-foreground mb-2">
                          {roiLabels[i].subtitle}
                        </p>
                        <p 
                          className="text-2xl font-bold"
                          style={{ color: roiLabels[i].color }}
                        >
                          {roi.roiPercentage}%
                        </p>
                        <p className="text-xs mt-1" style={{ color: colors.deepIndigo }}>
                          {roi.paybackMonths} month payback
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(roi.annualSavings)}/year
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Credentials Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 rounded" style={{ background: colors.gold }} />
                    <h3 className="font-bold text-sm" style={{ color: colors.deepIndigo }}>
                      Our Credentials & Certifications
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: ShieldCheck, title: 'SOC 2 Type II', desc: 'Enterprise security certified' },
                      { icon: Heart, title: 'HIPAA (Certifiable)', desc: 'Healthcare compliance ready' },
                      { icon: Building2, title: 'Australian Owned', desc: 'Local support & data sovereignty' },
                      { icon: Zap, title: 'Enterprise SLA', desc: '99.9% uptime guarantee' },
                    ].map((cred, i) => (
                      <div 
                        key={i}
                        className="rounded p-2 flex items-start gap-2"
                        style={{ background: colors.cardBg }}
                      >
                        <cred.icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: colors.signalPink }} />
                        <div>
                          <p className="text-xs font-medium" style={{ color: colors.deepIndigo }}>
                            {cred.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{cred.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Meeting Analysis */}
                {formData.sentiment && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-4 rounded" style={{ background: colors.mintSignal }} />
                      <h3 className="font-bold text-sm" style={{ color: colors.deepIndigo }}>
                        Meeting Analysis
                      </h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Interest Level', value: formData.sentiment.interestLevel },
                        { label: 'Product Fit', value: formData.sentiment.productFit },
                        { label: 'Price Sensitivity', value: formData.sentiment.pricingSensitivity },
                      ].map((item, i) => (
                        <div 
                          key={i}
                          className="rounded p-2 text-center"
                          style={{ background: colors.cardBg }}
                        >
                          <p className="text-[10px] text-muted-foreground">{item.label}</p>
                          <p className="text-xs font-bold capitalize" style={{ color: colors.deepIndigo }}>
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Meeting Summary */}
                {formData.transcriptSummary && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-4 rounded" style={{ background: colors.signalPink }} />
                      <h3 className="font-bold text-sm" style={{ color: colors.deepIndigo }}>
                        Meeting Summary
                      </h3>
                    </div>
                    <div 
                      className="rounded p-3 text-xs"
                      style={{ background: colors.cardBg, color: colors.deepIndigo }}
                    >
                      {formData.transcriptSummary.slice(0, 200)}
                      {formData.transcriptSummary.length > 200 && '...'}
                    </div>
                  </div>
                )}
                
                {/* QR Code Indicator */}
                <div className="flex items-center gap-3 pt-4">
                  <div 
                    className="w-16 h-16 rounded border-2 flex items-center justify-center"
                    style={{ borderColor: colors.cardBorder }}
                  >
                    <div className="w-12 h-12 bg-muted/50 rounded grid grid-cols-3 gap-0.5 p-1">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div 
                          key={i} 
                          className="rounded-sm"
                          style={{ 
                            background: [0, 2, 3, 5, 6, 8].includes(i) ? colors.deepIndigo : 'transparent' 
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-xs">
                    <p className="font-medium" style={{ color: colors.deepIndigo }}>
                      Scan to Book
                    </p>
                    <p className="text-muted-foreground">
                      Quick access to schedule your Impact Conversation
                    </p>
                  </div>
                </div>
                
                {/* Online Proposal Link - shows if saved */}
                {proposalInfo?.quoteId && proposalInfo?.accessCode && (
                  <div 
                    className="rounded-lg p-3 border-2"
                    style={{ borderColor: colors.mintSignal, background: `${colors.mintSignal}10` }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: colors.mintSignal }}>
                        <span className="text-white text-[10px]">🔗</span>
                      </div>
                      <p className="text-xs font-bold" style={{ color: colors.deepIndigo }}>
                        Interactive Proposal (Shareable)
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">URL:</span>
                        <code className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded">
                          {PRODUCTION_URL.replace('https://', '')}/proposal/{proposalInfo.quoteId}
                        </code>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">Access Code:</span>
                        <code className="text-xs font-mono font-bold tracking-widest bg-white px-1.5 py-0.5 rounded">
                          {proposalInfo.accessCode}
                        </code>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Payment Steps Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 rounded" style={{ background: colors.signalPink }} />
                    <h3 className="font-bold text-sm" style={{ color: colors.deepIndigo }}>
                      Ready to Get Started?
                    </h3>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-2">
                    Your payment schedule: Slot reservation → Setup fee → Monthly retainer
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { step: '1', title: '$5,000', subtitle: 'Slot Reservation', desc: 'Secure your project slot', color: colors.signalPink },
                      { step: '2', title: 'Setup Fee', subtitle: `Option ${effectivePricingOption}`, desc: `${formatCurrency(setupPrice.min)} – ${formatCurrency(setupPrice.max)}`, color: colors.deepIndigo },
                      { step: '3', title: 'Monthly', subtitle: 'Retainer', desc: `${formatCurrency(monthlyRetainer.min)} – ${formatCurrency(monthlyRetainer.max)}/mo`, color: colors.mintSignal },
                    ].map((pay, i) => (
                      <div 
                        key={i}
                        className="rounded p-2 relative"
                        style={{ background: colors.cardBg }}
                      >
                        <div 
                          className="absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ background: pay.color }}
                        >
                          {pay.step}
                        </div>
                        <div className="pl-4">
                          <p className="text-xs font-bold" style={{ color: colors.deepIndigo }}>{pay.title}</p>
                          <p className="text-[10px] text-muted-foreground">{pay.subtitle}</p>
                          <p className="text-[9px] text-muted-foreground">{pay.desc}</p>
                        </div>
                        {i === 0 && (
                          <div 
                            className="mt-1 text-center text-[8px] font-bold text-white py-0.5 rounded"
                            style={{ background: colors.signalPink }}
                          >
                            PAY NOW →
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* CTA Box - Button Only */}
                <div 
                  className="rounded-lg p-4 text-center"
                  style={{ background: colors.deepIndigo }}
                >
                  <h4 className="font-bold text-white mb-1">
                    Ready to Transform Your Operations?
                  </h4>
                  <p className="text-xs mb-3" style={{ color: colors.lightSlate }}>
                    Discuss your custom implementation plan
                  </p>
                  <span 
                    className="inline-block px-4 py-2 rounded text-xs font-bold text-white cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ background: colors.signalPink }}
                  >
                    Book an Impact Conversation
                  </span>
                </div>
              </div>
              
              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 px-6 py-3 border-t text-xs text-muted-foreground flex justify-between">
                <span>Your AI Workforce Partner • {PRODUCTION_DOMAIN}</span>
                <span>Page 2 of 2</span>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
});
