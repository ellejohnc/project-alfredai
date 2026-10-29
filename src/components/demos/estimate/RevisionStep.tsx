import { useState, useEffect, useCallback } from "react";
import { useDemoSpeed } from "@/contexts/DemoSpeedContext";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Zap, ArrowUp, ArrowDown, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { generateTradeBreakdown, generateEstimateSummary } from "./demoData";
import type { TradeBreakdown, EstimateSummary, RevisionChange } from "./types";

interface RevisionStepProps {
  initialEstimate: EstimateSummary;
  initialTrades: TradeBreakdown[];
  onComplete: () => void;
  isActive: boolean;
}

export function RevisionStep({ initialEstimate, initialTrades, onComplete, isActive }: RevisionStepProps) {
  const { applySpeed } = useDemoSpeed();
  const [floorArea, setFloorArea] = useState(initialEstimate.floorArea);
  const [specGrade, setSpecGrade] = useState<'basic' | 'standard' | 'premium'>(initialEstimate.specGrade);
  const [includeFurniture, setIncludeFurniture] = useState(false);
  const [includeLandscaping, setIncludeLandscaping] = useState(false);
  
  const [currentEstimate, setCurrentEstimate] = useState<EstimateSummary>(initialEstimate);
  const [currentTrades, setCurrentTrades] = useState<TradeBreakdown[]>(initialTrades);
  const [revisionHistory, setRevisionHistory] = useState<RevisionChange[]>([]);
  const [isRevising, setIsRevising] = useState(false);
  const [revisionTime, setRevisionTime] = useState<number | null>(null);
  const [revisionCount, setRevisionCount] = useState(0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const recalculateEstimate = useCallback(() => {
    setIsRevising(true);
    const startTime = performance.now();
    
    // Simulate calculation delay
    setTimeout(() => {
      const newTrades = generateTradeBreakdown(floorArea, specGrade);
      
      // Add optional items
      let additionalCost = 0;
      if (includeFurniture) {
        additionalCost += floorArea * 450; // $450/m² for FF&E
      }
      if (includeLandscaping) {
        additionalCost += 35000; // Flat landscaping cost
      }
      
      const newEstimate = generateEstimateSummary(floorArea, specGrade, revisionCount + 1);
      newEstimate.totalAmount += additionalCost;
      newEstimate.squareMetreRate = Math.round(newEstimate.totalAmount / floorArea);
      
      // Track changes
      const changes: RevisionChange[] = [];
      if (floorArea !== currentEstimate.floorArea) {
        changes.push({
          field: 'Floor Area',
          oldValue: `${currentEstimate.floorArea} m²`,
          newValue: `${floorArea} m²`,
          impact: newEstimate.totalAmount - currentEstimate.totalAmount,
        });
      }
      if (specGrade !== currentEstimate.specGrade) {
        changes.push({
          field: 'Spec Grade',
          oldValue: currentEstimate.specGrade,
          newValue: specGrade,
          impact: newEstimate.totalAmount - currentEstimate.totalAmount,
        });
      }
      
      setCurrentTrades(newTrades);
      setCurrentEstimate(newEstimate);
      setRevisionHistory(prev => [...changes, ...prev].slice(0, 5));
      setRevisionCount(prev => prev + 1);
      
      const endTime = performance.now();
      setRevisionTime(Math.round((endTime - startTime)));
      setIsRevising(false);
    }, applySpeed(300));
  }, [floorArea, specGrade, includeFurniture, includeLandscaping, currentEstimate, revisionCount]);

  const getSpecGradeLabel = (grade: string) => {
    switch (grade) {
      case 'basic': return 'Basic';
      case 'standard': return 'Standard';
      case 'premium': return 'Premium';
      default: return grade;
    }
  };

  return (
    <div className="space-y-5">
      {/* Speed demonstration header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-4 border border-primary/10"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <p className="text-sm font-medium">
            Instant recalculation — adjust parameters and watch totals update in real-time
          </p>
        </div>
      </motion.div>

      {/* Parameter controls */}
      <div className="space-y-4">
        {/* Floor Area Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Floor Area</Label>
            <span className="text-sm font-semibold">{floorArea} m²</span>
          </div>
          <Slider
            value={[floorArea]}
            onValueChange={([val]) => setFloorArea(val)}
            min={500}
            max={2000}
            step={50}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>500 m²</span>
            <span>2000 m²</span>
          </div>
        </div>

        {/* Spec Grade Selector */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Specification Grade</Label>
          <div className="grid grid-cols-3 gap-2">
            {(['basic', 'standard', 'premium'] as const).map((grade) => (
              <button
                key={grade}
                onClick={() => setSpecGrade(grade)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                  specGrade === grade
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted hover:bg-muted/80 border-transparent"
                )}
              >
                {getSpecGradeLabel(grade)}
              </button>
            ))}
          </div>
        </div>

        {/* Inclusion toggles */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Optional Inclusions</Label>
          
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <p className="text-sm font-medium">Furniture, Fixtures & Equipment</p>
              <p className="text-xs text-muted-foreground">+$450/m² allowance</p>
            </div>
            <Switch
              checked={includeFurniture}
              onCheckedChange={setIncludeFurniture}
            />
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <p className="text-sm font-medium">External Landscaping</p>
              <p className="text-xs text-muted-foreground">+$35,000 allowance</p>
            </div>
            <Switch
              checked={includeLandscaping}
              onCheckedChange={setIncludeLandscaping}
            />
          </div>
        </div>

        {/* Recalculate button */}
        <Button 
          onClick={recalculateEstimate} 
          className="w-full" 
          size="lg"
          disabled={isRevising}
        >
          {isRevising ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Recalculating...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Recalculate Estimate
            </>
          )}
        </Button>
      </div>

      {/* Updated totals */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentEstimate.totalAmount}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white border-2 rounded-lg p-4 shadow-sm"
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Total Estimate</p>
              <p className="text-xl font-bold">{formatCurrency(currentEstimate.totalAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rate / m²</p>
              <p className="text-xl font-bold">{formatCurrency(currentEstimate.squareMetreRate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Revisions</p>
              <p className="text-xl font-bold">{revisionCount}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Revision time indicator */}
      {revisionTime !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 text-sm text-green-600"
        >
          <Clock className="w-4 h-4" />
          <span>Revised in {revisionTime}ms</span>
        </motion.div>
      )}

      {/* Change summary */}
      {revisionHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h5 className="text-sm font-medium">Recent Changes</h5>
          <div className="space-y-1">
            {revisionHistory.slice(0, 3).map((change, idx) => (
              <motion.div
                key={`${change.field}-${idx}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center justify-between text-xs bg-muted/50 p-2 rounded"
              >
                <span className="font-medium">{change.field}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{change.oldValue}</span>
                  <span>→</span>
                  <span className="font-medium">{change.newValue}</span>
                  {change.impact !== 0 && (
                    <span className={cn(
                      "flex items-center gap-0.5",
                      change.impact > 0 ? "text-red-600" : "text-green-600"
                    )}>
                      {change.impact > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      {formatCurrency(Math.abs(change.impact))}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Complete demo */}
      {revisionCount >= 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pt-4"
        >
          <Button onClick={onComplete} className="w-full" size="lg" variant="default">
            <CheckCircle className="w-4 h-4 mr-2" />
            Complete Demo
          </Button>
        </motion.div>
      )}
    </div>
  );
}
