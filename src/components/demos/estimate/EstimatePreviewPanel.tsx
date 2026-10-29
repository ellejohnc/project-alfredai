import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Calendar, 
  ChevronDown, 
  ChevronRight, 
  Download, 
  Share2, 
  Edit3,
  AlertTriangle,
  CheckCircle,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import DemoButton from "@/components/demos/shared/DemoButton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ConfidenceFlagBadge, ConfidenceLegend } from "./ConfidenceFlagBadge";
import { PROJECT_NAME, PROJECT_ADDRESS, estimateAssumptions } from "./demoData";
import type { TradeBreakdown, EstimateSummary, StepId } from "./types";

interface EstimatePreviewPanelProps {
  estimate: EstimateSummary | null;
  trades: TradeBreakdown[];
  currentStep: StepId;
  className?: string;
}

export function EstimatePreviewPanel({ estimate, trades, currentStep, className }: EstimatePreviewPanelProps) {
  const [expandedTrades, setExpandedTrades] = useState<string[]>([]);

  const toggleTrade = (tradeId: string) => {
    setExpandedTrades(prev => 
      prev.includes(tradeId) 
        ? prev.filter(id => id !== tradeId) 
        : [...prev, tradeId]
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalLineItems = useMemo(() => 
    trades.reduce((sum, t) => sum + t.items.length, 0), 
    [trades]
  );

  const confidenceDistribution = useMemo(() => {
    const allItems = trades.flatMap(t => t.items);
    return {
      high: allItems.filter(i => i.confidence === 'high').length,
      medium: allItems.filter(i => i.confidence === 'medium').length,
      low: allItems.filter(i => i.confidence === 'low').length,
      missing: allItems.filter(i => i.confidence === 'missing').length,
    };
  }, [trades]);

  // Show placeholder before estimate is generated
  if (!estimate && currentStep < 4) {
    return (
      <div className={cn("h-full flex flex-col", className)}>
        {/* Placeholder header */}
        <div className="shrink-0 border-b bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">Estimate Preview</span>
          </div>
        </div>
        
        {/* Placeholder content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-xs">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <h4 className="font-medium text-muted-foreground mb-2">No Estimate Yet</h4>
            <p className="text-sm text-muted-foreground/70">
              Complete the upload, scope confirmation, and extraction steps to generate your draft estimate.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col bg-white", className)}>
      {/* Header */}
      <div className="shrink-0 border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <span className="font-semibold">Draft Estimate</span>
            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
              v{estimate?.revisionCount ?? 1}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <DemoButton variant="ghost" size="icon" className="h-8 w-8" featureName="Download Estimate" showDemoBadge={false}>
              <Download className="w-4 h-4" />
            </DemoButton>
            <DemoButton variant="ghost" size="icon" className="h-8 w-8" featureName="Share Estimate" showDemoBadge={false}>
              <Share2 className="w-4 h-4" />
            </DemoButton>
          </div>
        </div>
      </div>

      {/* Scrollable content - improved mobile scroll */}
      <div className="flex-1 overflow-y-auto overscroll-contain pb-16 md:pb-0 touch-pan-y">
        <div className="p-3 space-y-3">
          {/* Project header */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-3 text-white">
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{PROJECT_NAME}</h3>
                <p className="text-xs text-white/60 mt-0.5">{PROJECT_ADDRESS}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-white/70">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary card */}
          {estimate && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border rounded-lg p-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total Estimate</p>
                  <p className="text-2xl font-bold tabular-nums">{formatCurrency(estimate.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rate / m²</p>
                  <p className="text-2xl font-bold tabular-nums">{formatCurrency(estimate.squareMetreRate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Floor Area</p>
                  <p className="text-lg font-semibold">{estimate.floorArea} m²</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Confidence</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold">{estimate.overallConfidence}%</p>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full",
                          estimate.overallConfidence >= 80 ? "bg-green-500" :
                          estimate.overallConfidence >= 60 ? "bg-amber-500" : "bg-red-500"
                        )}
                        style={{ width: `${estimate.overallConfidence}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Draft warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">
              <strong>Draft Only</strong> — Requires professional review before commercial use.
            </p>
          </div>

          {/* Confidence legend */}
          <ConfidenceLegend className="py-2" />

          {/* Trade breakdown */}
          {trades.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center justify-between">
                <span>Trade Breakdown</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {totalLineItems} line items
                </span>
              </h4>
              
              <div className="space-y-1">
                {trades.map((trade) => (
                  <Collapsible
                    key={trade.id}
                    open={expandedTrades.includes(trade.id)}
                    onOpenChange={() => toggleTrade(trade.id)}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          {expandedTrades.includes(trade.id) ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="font-medium text-sm">{trade.name}</span>
                          <span className="text-xs text-muted-foreground">({trade.itemCount})</span>
                        </div>
                        <span className="font-semibold text-sm">{formatCurrency(trade.total)}</span>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="ml-6 border-l pl-3 py-1 space-y-1">
                        {trade.items.map((item) => (
                          <div 
                            key={item.id}
                            className="flex items-center justify-between py-1 text-xs group hover:bg-muted/30 px-2 rounded"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <ConfidenceFlagBadge confidence={item.confidence} size="sm" />
                              <span className="truncate">{item.description}</span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-muted-foreground">
                                {item.quantity} {item.unit} × {formatCurrency(item.rate)}
                              </span>
                              <span className="font-medium w-20 text-right">{formatCurrency(item.total)}</span>
                              {item.isEditable && (
                                <Edit3 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </div>
          )}

          {/* Assumptions */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Assumptions & Notes</h4>
            <ul className="space-y-1">
              {estimateAssumptions.map((note, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Footer actions - touch-friendly */}
      <div className="shrink-0 border-t p-3 flex gap-2 bg-white">
        <DemoButton variant="outline" size="sm" className="flex-1 min-h-[44px]" featureName="Download Draft Estimate">
          <Download className="w-4 h-4 mr-1.5" />
          Download Draft
        </DemoButton>
        <DemoButton size="sm" className="flex-1 min-h-[44px]" featureName="Share for Review">
          <Share2 className="w-4 h-4 mr-1.5" />
          Share
        </DemoButton>
      </div>
    </div>
  );
}
