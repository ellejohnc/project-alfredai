import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Loader2, AlertTriangle, Download, Share2, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import DemoButton from "@/components/demos/shared/DemoButton";
import { generateTradeBreakdown, generateEstimateSummary, estimateAssumptions } from "./demoData";
import { ConfidenceFlagBadge, ConfidenceLegend } from "./ConfidenceFlagBadge";
import type { TradeBreakdown, EstimateSummary, ExtractedItem } from "./types";

interface EstimateGeneratorStepProps {
  extractedItems: ExtractedItem[];
  onComplete: (estimate: EstimateSummary, trades: TradeBreakdown[]) => void;
  isActive: boolean;
}

export function EstimateGeneratorStep({ extractedItems, onComplete, isActive }: EstimateGeneratorStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<'idle' | 'calculating' | 'building' | 'complete'>('idle');
  const [progress, setProgress] = useState(0);
  const [trades, setTrades] = useState<TradeBreakdown[]>([]);
  const [estimate, setEstimate] = useState<EstimateSummary | null>(null);
  const [visibleTradeIndex, setVisibleTradeIndex] = useState(-1);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Check if scroll indicator should be shown
  const checkScrollIndicator = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const hasOverflow = container.scrollHeight > container.clientHeight;
    const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 10;
    
    setShowScrollIndicator(hasOverflow && !isNearBottom);
  }, []);

  // Update scroll indicator when trades change
  useEffect(() => {
    if (trades.length > 0) {
      // Small delay to ensure DOM has updated
      setTimeout(checkScrollIndicator, 100);
    }
  }, [trades, checkScrollIndicator]);

  // Auto-start generation when step becomes active
  useEffect(() => {
    if (isActive && generationPhase === 'idle') {
      startGeneration();
    }
  }, [isActive]);

  const startGeneration = useCallback(() => {
    setIsGenerating(true);
    setGenerationPhase('calculating');
    setProgress(0);
    setTrades([]);
    setVisibleTradeIndex(-1);

    // Progress animation
    let prog = 0;
    const progressInterval = setInterval(() => {
      prog += 2;
      setProgress(prog);
      if (prog >= 40) {
        clearInterval(progressInterval);
        setGenerationPhase('building');
        buildEstimate();
      }
    }, 50);
  }, []);

  const buildEstimate = useCallback(() => {
    const generatedTrades = generateTradeBreakdown(845, 'standard');
    
    // Reveal trades one by one
    generatedTrades.forEach((trade, idx) => {
      setTimeout(() => {
        setTrades(prev => [...prev, trade]);
        setVisibleTradeIndex(idx);
        setProgress(40 + ((idx + 1) / generatedTrades.length) * 50);
      }, idx * 300);
    });

    // Complete
    setTimeout(() => {
      const summary = generateEstimateSummary(845, 'standard', 0);
      setEstimate(summary);
      setProgress(100);
      setGenerationPhase('complete');
      setIsGenerating(false);
    }, generatedTrades.length * 300 + 500);
  }, []);

  const handleProceed = () => {
    if (estimate) {
      onComplete(estimate, trades);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Generation progress */}
      {generationPhase !== 'complete' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Calculator className="w-6 h-6 text-primary" />
              {isGenerating && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {generationPhase === 'calculating' && 'Calculating quantities...'}
                {generationPhase === 'building' && 'Building estimate structure...'}
              </p>
              <p className="text-xs text-muted-foreground">
                Processing {extractedItems.length} extracted items
              </p>
            </div>
          </div>
          
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
        </motion.div>
      )}

      {/* Trade breakdown cards */}
      <AnimatePresence>
        {trades.length > 0 && (
          <div className="relative">
            <motion.div
              ref={scrollContainerRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2 max-h-48 overflow-y-auto"
              onScroll={checkScrollIndicator}
            >
              {trades.map((trade, idx) => (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white border rounded-lg p-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-sm">{trade.name}</h5>
                      <p className="text-xs text-muted-foreground">{trade.itemCount} line items</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(trade.total)}</p>
                      <div className="flex gap-1 mt-1">
                        {trade.items.slice(0, 4).map((item, i) => (
                          <ConfidenceFlagBadge key={i} confidence={item.confidence} size="sm" />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            
            {/* Scroll indicator */}
            <AnimatePresence>
              {showScrollIndicator && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-0 left-0 right-0 pointer-events-none"
                >
                  {/* Gradient fade */}
                  <div className="h-8 bg-gradient-to-t from-white to-transparent" />
                  
                  {/* Bouncing arrow */}
                  <motion.div
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-white/90 shadow-sm border pointer-events-auto cursor-pointer"
                    animate={{ y: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    onClick={() => {
                      scrollContainerRef.current?.scrollBy({ top: 80, behavior: 'smooth' });
                    }}
                  >
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>

      {/* Complete state */}
      <AnimatePresence>
        {generationPhase === 'complete' && estimate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Draft warning banner */}
            <div className="bg-amber-50 border-2 border-amber-300 border-dashed rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Draft Only — Requires Estimator Review</p>
                  <p className="text-xs text-amber-700 mt-1">
                    This estimate is generated from extracted data and requires professional verification before use.
                  </p>
                </div>
              </div>
            </div>

            {/* Summary card */}
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg p-4 border">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Total Estimate</p>
                  <p className="text-lg font-bold">{formatCurrency(estimate.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rate / m²</p>
                  <p className="text-lg font-bold">{formatCurrency(estimate.squareMetreRate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Confidence</p>
                  <p className="text-lg font-bold">{estimate.overallConfidence}%</p>
                </div>
              </div>
            </div>

            {/* Confidence legend */}
            <ConfidenceLegend />

            {/* Assumption notes */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Key Assumptions</h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                {estimateAssumptions.slice(0, 4).map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Export actions */}
            <div className="flex gap-2">
              <DemoButton variant="outline" size="sm" className="flex-1" featureName="PDF Export">
                <FileText className="w-4 h-4 mr-1" />
                PDF
              </DemoButton>
              <DemoButton variant="outline" size="sm" className="flex-1" featureName="Excel Export">
                <FileSpreadsheet className="w-4 h-4 mr-1" />
                Excel
              </DemoButton>
              <DemoButton variant="outline" size="sm" className="flex-1" featureName="Share Estimate">
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </DemoButton>
            </div>

            {/* Proceed button */}
            <Button onClick={handleProceed} className="w-full" size="lg">
              Try Rapid Revisions
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
