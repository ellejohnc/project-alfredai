import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  ChevronRight,
  Sparkles,
  Shield,
  Target,
  Zap,
  Phone,
  Pencil,
  Check,
  X,
  RotateCcw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PricingResult, formatCurrency } from '@/lib/pricingEngine';
import { ROICalculation } from '@/lib/roiScenarios';
import { ComplexityLevel } from '@/lib/pricingEngine';
import { cn } from '@/lib/utils';

interface VoiceAgentCosts {
  monthly: number;
  setup: number;
  planName?: string;
  workflowCount?: number;
}

interface CustomWorkflowTotals {
  count: number;
  setupFee: number;
  monthlyFee: number;
}

interface QuoteResultCardProps {
  pricing: PricingResult;
  roiCalculations: ROICalculation[];
  complexity: ComplexityLevel;
  workflowCount: number;
  voiceAgentCosts?: VoiceAgentCosts;
  customWorkflowTotals?: CustomWorkflowTotals;
  roiOverrides?: { conservative?: number; likely?: number; best?: number };
  onRoiOverride?: (scenario: 'conservative' | 'likely' | 'best', value: number) => void;
  onRoiReset?: () => void;
}

export const QuoteResultCard = memo(function QuoteResultCard({
  pricing,
  roiCalculations,
  complexity,
  workflowCount,
  voiceAgentCosts,
  customWorkflowTotals,
  roiOverrides,
  onRoiOverride,
  onRoiReset,
}: QuoteResultCardProps) {
  const conservative = roiCalculations.find(r => r.scenario.type === 'conservative');
  const likely = roiCalculations.find(r => r.scenario.type === 'likely');
  const best = roiCalculations.find(r => r.scenario.type === 'best');

  // Recalculate payback months when ROI is overridden
  const calcPaybackFromRoi = (roiPercent: number, totalInvestment: number): number => {
    if (roiPercent <= -100 || totalInvestment <= 0) return 36;
    const annualSavings = totalInvestment * (1 + roiPercent / 100);
    const monthlySavings = annualSavings / 12;
    if (monthlySavings <= 0) return 36;
    return Math.min(Math.ceil(totalInvestment / monthlySavings), 36);
  };

  const totalInvestment = pricing.annualInvestment;
  const conservativePayback = roiOverrides?.conservative != null
    ? calcPaybackFromRoi(roiOverrides.conservative, totalInvestment)
    : conservative?.paybackMonths ?? 0;
  const likelyPayback = roiOverrides?.likely != null
    ? calcPaybackFromRoi(roiOverrides.likely, totalInvestment)
    : likely?.paybackMonths ?? 0;
  const bestPayback = roiOverrides?.best != null
    ? calcPaybackFromRoi(roiOverrides.best, totalInvestment)
    : best?.paybackMonths ?? 0;
  
  const hasVoiceAgent = voiceAgentCosts && (voiceAgentCosts.monthly > 0 || voiceAgentCosts.setup > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold">Quote Summary</h2>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="w-3 h-3" />
            {complexity.name}
          </Badge>
          <Badge variant="outline">
            {workflowCount > 0 ? `${workflowCount} AI Agent${workflowCount !== 1 ? 's' : ''}` : 'No AI Agent'}
          </Badge>
        </div>
      </div>

      {/* Investment Card */}
      <motion.div 
        className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 rounded-xl p-5 space-y-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <DollarSign className="w-4 h-4" />
          Investment Estimate
        </div>

        <div className="space-y-3">
          {/* Setup Fee */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Setup Fee</span>
            <div className="text-right">
              <span className="font-semibold">
                {formatCurrency(pricing.setupInvestment + (customWorkflowTotals?.setupFee || 0))}
              </span>
            </div>
          </div>

          {/* Monthly Retainer */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Monthly Retainer</span>
            <div className="text-right">
              <span className="font-semibold">
                {formatCurrency(pricing.monthlyRetainer + (customWorkflowTotals?.monthlyFee || 0))}
              </span>
              <span className="text-xs text-muted-foreground">/mo</span>
            </div>
          </div>

          {/* Voice Agent (if selected) */}
          {hasVoiceAgent && (
            <>
              <div className="border-t border-primary/10 pt-3 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Voice Agent{voiceAgentCosts.planName ? ` (${voiceAgentCosts.planName})` : ''}</span>
                </div>
                {voiceAgentCosts.setup > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">VA Setup ({voiceAgentCosts.workflowCount || 1} workflow{(voiceAgentCosts.workflowCount || 1) !== 1 ? 's' : ''} × $2,500)</span>
                    <span className="font-semibold">{formatCurrency(voiceAgentCosts.setup)}</span>
                  </div>
                )}
                {voiceAgentCosts.monthly > 0 && (
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-muted-foreground">VA Monthly</span>
                    <span className="font-semibold">{formatCurrency(voiceAgentCosts.monthly)}<span className="text-xs text-muted-foreground">/mo</span></span>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="border-t border-primary/20 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">First Year Total</span>
              <span className="text-lg font-bold text-primary">
                {formatCurrency(pricing.annualRange.min + (customWorkflowTotals?.setupFee || 0) + (customWorkflowTotals?.monthlyFee || 0) * 12 + (voiceAgentCosts?.setup || 0) + (voiceAgentCosts?.monthly || 0) * 12)} - {formatCurrency(pricing.annualRange.max + (customWorkflowTotals?.setupFee || 0) + (customWorkflowTotals?.monthlyFee || 0) * 12 + (voiceAgentCosts?.setup || 0) + (voiceAgentCosts?.monthly || 0) * 12)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-right">
              *Prices exclude GST (Australia) / tax (other regions)
            </p>
          </div>
        </div>
      </motion.div>

      {/* ROI Scenarios */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="w-4 h-4 text-primary" />
            ROI Scenarios
          </div>
          {onRoiReset && roiOverrides && (roiOverrides.conservative != null || roiOverrides.likely != null || roiOverrides.best != null) && (
            <button
              onClick={onRoiReset}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors min-h-[32px] px-2"
              title="Reset ROI overrides to calculated defaults"
            >
              <RotateCcw className="w-3 h-3" />
              Reset to defaults
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* Conservative */}
          {conservative && (
            <ROIScenarioRow
              icon={Shield}
              label="Guaranteed"
              savings={conservative.annualSavings}
              roi={roiOverrides?.conservative ?? conservative.roiPercentage}
              payback={conservativePayback}
              color="blue"
              isOverridden={roiOverrides?.conservative != null}
              onRoiEdit={onRoiOverride ? (v) => onRoiOverride('conservative', v) : undefined}
            />
          )}

          {/* Most Likely */}
          {likely && (
            <ROIScenarioRow
              icon={Target}
              label="Most Likely"
              savings={likely.annualSavings}
              roi={roiOverrides?.likely ?? likely.roiPercentage}
              payback={likelyPayback}
              color="green"
              highlight
              isOverridden={roiOverrides?.likely != null}
              onRoiEdit={onRoiOverride ? (v) => onRoiOverride('likely', v) : undefined}
            />
          )}

          {/* Best Case */}
          {best && (
            <ROIScenarioRow
              icon={Zap}
              label="Best Case"
              savings={best.annualSavings}
              roi={roiOverrides?.best ?? best.roiPercentage}
              payback={bestPayback}
              color="yellow"
              isOverridden={roiOverrides?.best != null}
              onRoiEdit={onRoiOverride ? (v) => onRoiOverride('best', v) : undefined}
            />
          )}
        </div>
      </div>

      {/* Breakdown Accordion */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
          <span>View calculation breakdown</span>
          <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
        </summary>
        <div className="mt-3 p-4 bg-muted/50 rounded-lg text-xs space-y-2">
          <div className="flex justify-between">
            <span>Tier:</span>
            <span className="font-medium">{pricing.tier.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Industry:</span>
            <span className="font-medium">{pricing.industry.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Ops Complexity:</span>
            <span className="font-medium">{pricing.opsComplexity.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Setup per Agent:</span>
            <span className="font-medium">{formatCurrency(pricing.setupBreakdown.perWorkflowRate)}</span>
          </div>
          <div className="flex justify-between">
            <span>× {pricing.setupBreakdown.workflowCount} agent{pricing.setupBreakdown.workflowCount !== 1 ? 's' : ''}:</span>
            <span className="font-medium">{formatCurrency(pricing.setupBreakdown.baseSetup)}</span>
          </div>
          {pricing.setupBreakdown.industryAdjustment !== 0 && (
            <div className="flex justify-between">
              <span>Industry Adjustment:</span>
              <span className="font-medium">{pricing.setupBreakdown.industryAdjustment > 0 ? '+' : ''}{formatCurrency(pricing.setupBreakdown.industryAdjustment)}</span>
            </div>
          )}
          {pricing.setupBreakdown.complexityAdjustment !== 0 && (
            <div className="flex justify-between">
              <span>Complexity Adjustment:</span>
              <span className="font-medium">{pricing.setupBreakdown.complexityAdjustment > 0 ? '+' : ''}{formatCurrency(pricing.setupBreakdown.complexityAdjustment)}</span>
            </div>
          )}
          {pricing.setupBreakdown.volumeDiscountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Volume Discount ({pricing.volumeDiscount.label}):</span>
              <span className="font-medium">-{formatCurrency(pricing.setupBreakdown.volumeDiscountAmount)}</span>
            </div>
          )}
          {pricing.setupBreakdown.specialDiscountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Special Discount:</span>
              <span className="font-medium">-{formatCurrency(pricing.setupBreakdown.specialDiscountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2 font-semibold">
            <span>Setup Total:</span>
            <span>{formatCurrency(pricing.setupBreakdown.total)}</span>
          </div>
          <div className="flex justify-between">
            <span>Monthly Retainer:</span>
            <span className="font-medium">{formatCurrency(pricing.monthlyRetainer)}/mo</span>
          </div>
        </div>
      </details>
    </div>
  );
});

interface ROIScenarioRowProps {
  icon: React.ElementType;
  label: string;
  savings: number;
  roi: number;
  payback: number;
  color: 'blue' | 'green' | 'yellow';
  highlight?: boolean;
  isOverridden?: boolean;
  onRoiEdit?: (value: number) => void;
}

function ROIScenarioRow({
  icon: Icon,
  label,
  savings,
  roi,
  payback,
  color,
  highlight,
  isOverridden,
  onRoiEdit,
}: ROIScenarioRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(roi));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) setEditValue(String(roi));
  }, [roi, isEditing]);

  useEffect(() => {
    if (isEditing) inputRef.current?.select();
  }, [isEditing]);

  const handleSave = useCallback(() => {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed) && onRoiEdit) {
      onRoiEdit(Math.round(parsed * 100) / 100);
    }
    setIsEditing(false);
  }, [editValue, onRoiEdit]);

  const handleCancel = useCallback(() => {
    setEditValue(String(roi));
    setIsEditing(false);
  }, [roi]);

  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    yellow: 'text-amber-600 bg-amber-50 border-amber-200',
  };

  return (
    <div 
      className={cn(
        "p-3 rounded-lg border transition-all",
        highlight 
          ? "bg-primary/5 border-primary/30" 
          : "bg-card border-border"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", colorClasses[color])}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-medium">{label}</span>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
              className="w-16 h-6 text-xs text-right rounded border border-primary bg-background px-1 focus:outline-none focus:ring-1 focus:ring-primary"
              step="0.1"
            />
            <span className="text-xs text-muted-foreground">%</span>
            <button onClick={handleSave} className="p-0.5 rounded hover:bg-primary/10 text-primary">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleCancel} className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <Badge
            variant={roi > 0 ? "default" : "secondary"}
            className={cn(
              "text-xs cursor-pointer group/badge transition-all hover:ring-2 hover:ring-primary/30",
              isOverridden && "ring-1 ring-primary/50"
            )}
            onClick={() => onRoiEdit && setIsEditing(true)}
            title={onRoiEdit ? "Click to edit ROI %" : undefined}
          >
            {roi > 0 ? '+' : ''}{roi}% ROI
            {onRoiEdit && <Pencil className="w-2.5 h-2.5 ml-1 opacity-0 group-hover/badge:opacity-100 transition-opacity" />}
            {isOverridden && <span className="ml-0.5 text-[10px] opacity-70">✎</span>}
          </Badge>
        )}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatCurrency(savings)}/yr savings</span>
        <span>{payback} mo payback</span>
      </div>
    </div>
  );
}
