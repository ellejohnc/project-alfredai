import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Square, AlertCircle, Info, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  availableTrades, 
  availableExclusions, 
  availableAssumptions, 
  measurementBasisOptions 
} from "./demoData";
import type { ScopeConfirmation } from "./types";

interface ScopeConfirmationStepProps {
  onComplete: (scope: ScopeConfirmation) => void;
  isActive: boolean;
}

export function ScopeConfirmationStep({ onComplete, isActive }: ScopeConfirmationStepProps) {
  const [includedTrades, setIncludedTrades] = useState<string[]>(['structural', 'mechanical', 'electrical', 'fitout', 'joinery']);
  const [exclusions, setExclusions] = useState<string[]>(['furniture', 'landscaping']);
  const [assumptions, setAssumptions] = useState<string[]>(['finishes', 'suppliers', 'hours', 'access']);
  const [measurementBasis, setMeasurementBasis] = useState<'gfa' | 'nla' | 'custom'>('gfa');
  
  // Collapsible sections state
  const [openSections, setOpenSections] = useState<string[]>(['trades']);

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const toggleTrade = (id: string) => {
    setIncludedTrades(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const toggleExclusion = (id: string) => {
    setExclusions(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const toggleAssumption = (id: string) => {
    setAssumptions(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const canProceed = includedTrades.length >= 2 && assumptions.length >= 2;

  const handleComplete = () => {
    onComplete({
      includedTrades,
      exclusions,
      assumptions,
      measurementBasis,
    });
  };

  return (
    <div className="space-y-3">
      {/* Reinforcement banner - compact */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-200"
      >
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-amber-900">Human interprets → AI structures</p>
            <p className="text-[11px] text-amber-700">Confirm scope before AI processing.</p>
          </div>
        </div>
      </motion.div>

      {/* Included Trades - Collapsible */}
      <Collapsible 
        open={openSections.includes('trades')} 
        onOpenChange={() => toggleSection('trades')}
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Included Trades</span>
              <span className="text-xs text-muted-foreground">({includedTrades.length} selected)</span>
            </div>
            {openSections.includes('trades') ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {availableTrades.map((trade) => (
              <label
                key={trade.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-xs",
                  includedTrades.includes(trade.id)
                    ? "bg-primary/5 border-primary/30"
                    : "bg-muted/20 border-transparent hover:border-muted-foreground/20"
                )}
              >
                <Checkbox
                  checked={includedTrades.includes(trade.id)}
                  onCheckedChange={() => toggleTrade(trade.id)}
                  className="h-3.5 w-3.5"
                />
                <span className="font-medium truncate">{trade.label}</span>
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Exclusions - Collapsible */}
      <Collapsible 
        open={openSections.includes('exclusions')} 
        onOpenChange={() => toggleSection('exclusions')}
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Square className="w-4 h-4 text-red-500" />
              <span className="font-medium text-sm">Exclusions</span>
              <span className="text-xs text-muted-foreground">({exclusions.length} excluded)</span>
            </div>
            {openSections.includes('exclusions') ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {availableExclusions.map((exc) => (
              <button
                key={exc.id}
                onClick={() => toggleExclusion(exc.id)}
                className={cn(
                  "px-2 py-1 rounded-full text-[11px] font-medium transition-all",
                  exclusions.includes(exc.id)
                    ? "bg-red-100 text-red-700 border border-red-200"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {exclusions.includes(exc.id) && <span className="mr-0.5">✕</span>}
                {exc.label}
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Assumptions - Collapsible */}
      <Collapsible 
        open={openSections.includes('assumptions')} 
        onOpenChange={() => toggleSection('assumptions')}
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-sm">Assumptions</span>
              <span className="text-xs text-muted-foreground">({assumptions.length} confirmed)</span>
            </div>
            {openSections.includes('assumptions') ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid grid-cols-1 gap-1 mt-2">
            {availableAssumptions.map((assumption) => (
              <label
                key={assumption.id}
                className={cn(
                  "flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer transition-all text-xs",
                  assumptions.includes(assumption.id)
                    ? "bg-blue-50 border-blue-200"
                    : "bg-muted/20 border-transparent hover:border-muted-foreground/20"
                )}
              >
                <Checkbox
                  checked={assumptions.includes(assumption.id)}
                  onCheckedChange={() => toggleAssumption(assumption.id)}
                  className="h-3.5 w-3.5"
                />
                <span className="text-xs">{assumption.label}</span>
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Measurement Basis - Always visible but compact */}
      <div className="p-2 rounded-lg bg-muted/30">
        <h4 className="font-medium text-sm mb-2">Measurement Basis</h4>
        <RadioGroup
          value={measurementBasis}
          onValueChange={(v) => setMeasurementBasis(v as 'gfa' | 'nla' | 'custom')}
          className="flex flex-wrap gap-3"
        >
          {measurementBasisOptions.map((option) => (
            <div key={option.id} className="flex items-center space-x-1.5">
              <RadioGroupItem value={option.id} id={option.id} className="h-3.5 w-3.5" />
              <Label htmlFor={option.id} className="cursor-pointer text-xs">
                <span className="font-medium">{option.label}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Validation message */}
      {!canProceed && (
        <div className="flex items-center gap-2 text-[11px] text-amber-600 bg-amber-50 p-2 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Select at least 2 trades and 2 assumptions to proceed</span>
        </div>
      )}

      {/* Proceed button */}
      <Button 
        onClick={handleComplete} 
        className="w-full" 
        size="default"
        disabled={!canProceed}
      >
        Confirm Scope & Extract Data
      </Button>
    </div>
  );
}
