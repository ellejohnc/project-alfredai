import { memo, useState, useCallback } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  DollarSign, 
  Factory, 
  Gauge, 
  Layers, 
  Package,
  Workflow,
  ToggleLeft,
  ToggleRight,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  pricingTiers, 
  industryMultipliers, 
  opsComplexityLevels, 
  volumeDiscounts,
  type PricingTier,
  type IndustryMultiplier,
  type OpsComplexity,
  type VolumeDiscount,
} from '@/lib/pricingEngine';
import { defaultWorkflowPricing, type WorkflowPricingEntry } from '@/lib/workflowPricing';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────
export type PricingMode = 'fixed' | 'multiplier';

export interface PricingOverrides {
  tiers: PricingTier[];
  industries: IndustryMultiplier[];
  opsComplexity: OpsComplexity[];
  volumeDiscounts: VolumeDiscount[];
  workflowPricing: WorkflowPricingEntry[];
  pricingMode: PricingMode;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
  children: React.ReactNode;
}

function PriceSection({ title, icon, defaultOpen = false, badge, children }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors text-left">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium">{title}</span>
            {badge && <Badge variant="outline" className="text-[9px] ml-1">{badge}</Badge>}
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-1 pt-2 pb-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

// Inline editable number cell
function EditableCell({ 
  value, 
  onChange, 
  prefix = '$',
  suffix = '',
  className = '',
}: { 
  value: number; 
  onChange: (v: number) => void; 
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const commit = useCallback(() => {
    const parsed = parseFloat(draft);
    if (!isNaN(parsed)) onChange(parsed);
    setEditing(false);
  }, [draft, onChange]);

  if (editing) {
    return (
      <Input
        autoFocus
        type="number"
        step="any"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        className={cn("h-6 w-20 text-xs text-right px-1 py-0 font-mono", className)}
      />
    );
  }

  return (
    <button
      onClick={() => { setDraft(String(value)); setEditing(true); }}
      className={cn(
        "text-xs font-mono cursor-pointer hover:bg-primary/10 rounded px-1 py-0.5 transition-colors text-right inline-block min-w-[3rem]",
        className,
      )}
      title="Click to edit"
    >
      {prefix}{typeof value === 'number' && value % 1 === 0 ? value.toLocaleString() : value.toFixed(2)}{suffix}
    </button>
  );
}

// ─── Component ──────────────────────────────────────
export const PriceListEditor = memo(function PriceListEditor() {
  // Editable state — initialised from defaults
  const [tiers, setTiers] = useState<PricingTier[]>(() => [...pricingTiers]);
  const [industries, setIndustries] = useState<IndustryMultiplier[]>(() => [...industryMultipliers]);
  const [ops, setOps] = useState<OpsComplexity[]>(() => [...opsComplexityLevels]);
  const [volDisc, setVolDisc] = useState<VolumeDiscount[]>(() => [...volumeDiscounts]);
  const [wfPricing, setWfPricing] = useState<WorkflowPricingEntry[]>(() => [...defaultWorkflowPricing]);
  const [pricingMode, setPricingMode] = useState<PricingMode>('fixed');

  // Helpers to update a single row
  const updateTier = useCallback((idx: number, field: keyof PricingTier, val: number) => {
    setTiers(prev => prev.map((t, i) => i === idx ? { ...t, [field]: val } : t));
  }, []);
  const updateIndustry = useCallback((idx: number, field: keyof IndustryMultiplier, val: number) => {
    setIndustries(prev => prev.map((t, i) => i === idx ? { ...t, [field]: val } : t));
  }, []);
  const updateOps = useCallback((idx: number, val: number) => {
    setOps(prev => prev.map((t, i) => i === idx ? { ...t, multiplier: val } : t));
  }, []);
  const updateVolDisc = useCallback((idx: number, val: number) => {
    setVolDisc(prev => prev.map((t, i) => i === idx ? { ...t, discount: val } : t));
  }, []);
  const updateWfPricing = useCallback((idx: number, field: keyof WorkflowPricingEntry, val: number) => {
    setWfPricing(prev => prev.map((t, i) => i === idx ? { ...t, [field]: val } : t));
  }, []);

  const resetAll = useCallback(() => {
    setTiers([...pricingTiers]);
    setIndustries([...industryMultipliers]);
    setOps([...opsComplexityLevels]);
    setVolDisc([...volumeDiscounts]);
    setWfPricing([...defaultWorkflowPricing]);
    setPricingMode('fixed');
  }, []);

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-1">
      <div className="flex items-center gap-2 mb-3 px-1">
        <DollarSign className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-base">Price List</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={resetAll}>
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left"><p className="text-xs">Reset all to defaults</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Badge variant="outline" className="text-[10px]">Editable</Badge>
      </div>

      {/* ── Pricing Tiers ── */}
      <PriceSection 
        title="Pricing Tiers (by Team Size)" 
        icon={<Package className="h-4 w-4 text-primary" />}
        defaultOpen
      >
        <Table containerClassName="rounded-lg border border-border">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8 text-xs px-2">Tier</TableHead>
              <TableHead className="h-8 text-xs px-2">Staff</TableHead>
              <TableHead className="h-8 text-xs px-2 text-right">Setup Base</TableHead>
              <TableHead className="h-8 text-xs px-2 text-right">Setup Ceiling</TableHead>
              <TableHead className="h-8 text-xs px-2 text-right">Monthly</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiers.map((tier, idx) => (
              <TableRow key={tier.id} className="hover:bg-accent/30">
                <TableCell className="py-1.5 px-2 text-xs font-medium">{tier.name}</TableCell>
                <TableCell className="py-1.5 px-2 text-xs text-muted-foreground">{tier.description}</TableCell>
                <TableCell className="py-1.5 px-2 text-xs text-right">
                  <EditableCell value={tier.setupBase} onChange={v => updateTier(idx, 'setupBase', v)} />
                </TableCell>
                <TableCell className="py-1.5 px-2 text-xs text-right">
                  <EditableCell value={tier.setupCeiling} onChange={v => updateTier(idx, 'setupCeiling', v)} />
                </TableCell>
                <TableCell className="py-1.5 px-2 text-xs text-right">
                  <EditableCell value={tier.baseMonthly} onChange={v => updateTier(idx, 'baseMonthly', v)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PriceSection>

      {/* ── Industry Multipliers ── */}
      <PriceSection 
        title="Industry Multipliers" 
        icon={<Factory className="h-4 w-4 text-primary" />}
      >
        <Table containerClassName="rounded-lg border border-border">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8 text-xs px-2">Industry</TableHead>
              <TableHead className="h-8 text-xs px-2 text-right">Setup ×</TableHead>
              <TableHead className="h-8 text-xs px-2 text-right">Monthly ×</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {industries.map((ind, idx) => (
              <TableRow key={ind.id} className="hover:bg-accent/30">
                <TableCell className="py-1.5 px-2 text-xs">
                  <div>
                    <span className="font-medium">{ind.name}</span>
                    <span className="block text-[10px] text-muted-foreground">{ind.description}</span>
                  </div>
                </TableCell>
                <TableCell className="py-1.5 px-2 text-xs text-right">
                  <EditableCell 
                    value={ind.setupMultiplier} 
                    onChange={v => updateIndustry(idx, 'setupMultiplier', v)} 
                    prefix="×" 
                    className={cn(ind.setupMultiplier > 1 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}
                  />
                </TableCell>
                <TableCell className="py-1.5 px-2 text-xs text-right">
                  <EditableCell 
                    value={ind.monthlyMultiplier} 
                    onChange={v => updateIndustry(idx, 'monthlyMultiplier', v)} 
                    prefix="×" 
                    className={cn(ind.monthlyMultiplier > 1 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PriceSection>

      {/* ── Ops Complexity ── */}
      <PriceSection 
        title="Operational Complexity" 
        icon={<Gauge className="h-4 w-4 text-primary" />}
      >
        <Table containerClassName="rounded-lg border border-border">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8 text-xs px-2">Level</TableHead>
              <TableHead className="h-8 text-xs px-2">Description</TableHead>
              <TableHead className="h-8 text-xs px-2 text-right">Multiplier</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ops.map((level, idx) => (
              <TableRow key={level.id} className="hover:bg-accent/30">
                <TableCell className="py-1.5 px-2 text-xs font-medium">{level.name}</TableCell>
                <TableCell className="py-1.5 px-2 text-xs text-muted-foreground">{level.description}</TableCell>
                <TableCell className="py-1.5 px-2 text-xs text-right">
                  <EditableCell 
                    value={level.multiplier} 
                    onChange={v => updateOps(idx, v)} 
                    prefix="×" 
                    className={cn(
                      level.multiplier < 1 ? "text-emerald-600 dark:text-emerald-400" :
                      level.multiplier > 1 ? "text-amber-600 dark:text-amber-400" : 
                      "text-muted-foreground"
                    )}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PriceSection>

      {/* ── Volume Discounts ── */}
      <PriceSection 
        title="Volume Discounts" 
        icon={<Layers className="h-4 w-4 text-primary" />}
      >
        <Table containerClassName="rounded-lg border border-border">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8 text-xs px-2">Workflows</TableHead>
              <TableHead className="h-8 text-xs px-2">Label</TableHead>
              <TableHead className="h-8 text-xs px-2 text-right">Discount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {volDisc.map((vol, i) => (
              <TableRow key={i} className="hover:bg-accent/30">
                <TableCell className="py-1.5 px-2 text-xs font-mono">
                  {vol.maxWorkflows === Infinity 
                    ? `${vol.minWorkflows}+` 
                    : `${vol.minWorkflows}–${vol.maxWorkflows}`}
                </TableCell>
                <TableCell className="py-1.5 px-2 text-xs text-muted-foreground">{vol.label}</TableCell>
                <TableCell className="py-1.5 px-2 text-xs text-right">
                  <EditableCell 
                    value={vol.discount} 
                    onChange={v => updateVolDisc(i, v)} 
                    prefix="×"
                    className={cn(vol.discount < 1 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PriceSection>

      {/* ── Workflow-Specific Pricing ── */}
      <PriceSection 
        title="Workflow Pricing" 
        icon={<Workflow className="h-4 w-4 text-primary" />}
        badge={pricingMode === 'fixed' ? 'Fixed $' : 'Multiplier ×'}
      >
        {/* Mode Toggle */}
        <div className="flex items-center justify-between px-2 pb-2">
          <span className="text-[11px] text-muted-foreground">Pricing mode:</span>
          <button
            onClick={() => setPricingMode(prev => prev === 'fixed' ? 'multiplier' : 'fixed')}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {pricingMode === 'fixed' ? (
              <>
                <ToggleLeft className="h-4 w-4" />
                Fixed Price
              </>
            ) : (
              <>
                <ToggleRight className="h-4 w-4" />
                Multiplier
              </>
            )}
          </button>
        </div>

        <Table containerClassName="rounded-lg border border-border">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8 text-xs px-2">Workflow</TableHead>
              {pricingMode === 'fixed' ? (
                <>
                  <TableHead className="h-8 text-xs px-2 text-right">Setup $</TableHead>
                  <TableHead className="h-8 text-xs px-2 text-right">Monthly $</TableHead>
                </>
              ) : (
                <>
                  <TableHead className="h-8 text-xs px-2 text-right">Setup ×</TableHead>
                  <TableHead className="h-8 text-xs px-2 text-right">Monthly ×</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {wfPricing.map((wf, idx) => (
              <TableRow key={wf.workflowId} className="hover:bg-accent/30">
                <TableCell className="py-1.5 px-2 text-xs font-medium max-w-[140px] truncate" title={wf.name}>
                  {wf.name}
                </TableCell>
                {pricingMode === 'fixed' ? (
                  <>
                    <TableCell className="py-1.5 px-2 text-xs text-right">
                      <EditableCell value={wf.fixedSetupPrice} onChange={v => updateWfPricing(idx, 'fixedSetupPrice', v)} />
                    </TableCell>
                    <TableCell className="py-1.5 px-2 text-xs text-right">
                      <EditableCell value={wf.fixedMonthlyPrice} onChange={v => updateWfPricing(idx, 'fixedMonthlyPrice', v)} />
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className="py-1.5 px-2 text-xs text-right">
                      <EditableCell 
                        value={wf.setupMultiplier} 
                        onChange={v => updateWfPricing(idx, 'setupMultiplier', v)} 
                        prefix="×"
                        className={cn(wf.setupMultiplier > 1 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}
                      />
                    </TableCell>
                    <TableCell className="py-1.5 px-2 text-xs text-right">
                      <EditableCell 
                        value={wf.monthlyMultiplier} 
                        onChange={v => updateWfPricing(idx, 'monthlyMultiplier', v)} 
                        prefix="×"
                        className={cn(wf.monthlyMultiplier > 1 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}
                      />
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PriceSection>

      {/* Footer */}
      <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border mt-2 pt-3 space-y-1">
        <div>
          <span className="font-medium text-foreground">Mode:</span>{' '}
          {pricingMode === 'fixed' 
            ? 'Fixed $ per workflow → then apply industry, ops complexity & volume discounts' 
            : 'Multiplier × base tier rate → then apply industry, ops complexity & volume discounts'
          }
        </div>
        <div>
          <span className="font-medium text-foreground">Click any value</span> to edit inline
        </div>
      </div>
    </div>
  );
});
