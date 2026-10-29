import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Industry, getIndustryDisplay, formatCurrency } from "./purchaseBillData";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  FileText, CheckCircle2, AlertTriangle, 
  Cloud, DollarSign, BarChart3, RefreshCw,
  Building2, Home, Briefcase, HelpCircle,
  Sparkles, Copy, Shield, Wallet, ChevronDown
} from "lucide-react";
import { MobileTooltip } from "@/components/ui/mobile-tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";

interface BatchStats {
  total: number;
  received: number;
  extracted: number;
  matched: number;
  needs_review: number;
  approved: number;
  synced: number;
  paid: number;
  totalValue: number;
  avgConfidence: number;
  highRiskCount: number;
  autoApproveEligible: number;
  availableFunds?: number;
}

interface BatchStatsHeaderProps {
  industry: Industry;
  onIndustryChange: (industry: Industry) => void;
  stats: BatchStats;
  onRefresh: () => void;
  onBatchProcess: () => void;
  isProcessing: boolean;
  onStartTutorial?: () => void;
  onOpenPaymentForecast?: () => void;
  onOpenDuplicateDetection?: () => void;
  onOpenSupplier360?: () => void;
}

export function BatchStatsHeader({
  industry,
  onIndustryChange,
  stats,
  onRefresh,
  onBatchProcess,
  isProcessing,
  onStartTutorial,
  onOpenPaymentForecast,
  onOpenDuplicateDetection,
  onOpenSupplier360
}: BatchStatsHeaderProps) {
  const isMobile = useIsMobile();
  const [showSchedulePointer, setShowSchedulePointer] = useState(true);

  // Hide the pointer after 5 seconds
  useEffect(() => {
    if (isMobile && showSchedulePointer) {
      const timer = setTimeout(() => setShowSchedulePointer(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isMobile, showSchedulePointer]);

  const getIndustryIcon = (ind: Industry) => {
    switch (ind) {
      case "construction": return <Building2 className="w-4 h-4" />;
      case "real-estate": return <Home className="w-4 h-4" />;
      case "professional-services": return <Briefcase className="w-4 h-4" />;
      case "healthcare": return <Building2 className="w-4 h-4" />;
      case "manufacturing": return <Building2 className="w-4 h-4" />;
      case "insurance": return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Title & Industry Selector */}
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm text-foreground">AI Bill Intake</span>
          <Select value={industry} onValueChange={(v) => onIndustryChange(v as Industry)}>
            <SelectTrigger className="w-[130px] h-6 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="construction">
                <div className="flex items-center gap-1.5 text-xs">
                  <Building2 className="w-3 h-3" />
                  Construction
                </div>
              </SelectItem>
              <SelectItem value="real-estate">
                <div className="flex items-center gap-1.5 text-xs">
                  <Home className="w-3 h-3" />
                  Real Estate
                </div>
              </SelectItem>
              <SelectItem value="professional-services">
                <div className="flex items-center gap-1.5 text-xs">
                  <Briefcase className="w-3 h-3" />
                  Prof. Services
                </div>
              </SelectItem>
              <SelectItem value="healthcare">
                <div className="flex items-center gap-1.5 text-xs">
                  <Building2 className="w-3 h-3" />
                  Healthcare
                </div>
              </SelectItem>
              <SelectItem value="manufacturing">
                <div className="flex items-center gap-1.5 text-xs">
                  <Building2 className="w-3 h-3" />
                  Manufacturing
                </div>
              </SelectItem>
              <SelectItem value="insurance">
                <div className="flex items-center gap-1.5 text-xs">
                  <Shield className="w-3 h-3" />
                  Insurance
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Inline Stats */}
        <div className="flex items-center gap-3 text-[11px]">
          <InlineStat 
            label="Funds" 
            value={formatCurrency(stats.availableFunds || 500000)} 
            color="text-blue-600 dark:text-blue-400"
          />
          <InlineStat 
            label="Bills" 
            value={stats.total} 
            color="text-foreground"
          />
          <InlineStat 
            label="Review" 
            value={stats.needs_review} 
            color="text-rose-600 dark:text-rose-400"
            highlight={stats.needs_review > 0}
          />
          <InlineStat 
            label="Payable" 
            value={formatCurrency(stats.totalValue)} 
            color="text-primary"
          />
          <span className="text-muted-foreground">|</span>
          <InlineStat 
            label="Confidence" 
            value={`${stats.avgConfidence}%`} 
            color={stats.avgConfidence >= 85 ? "text-emerald-600" : "text-amber-600"}
          />
        </div>

        {/* Actions */}
        <div id="pb-batch-stats" className="flex items-center gap-1">
          {onStartTutorial && (
            <MobileTooltip label="Start Tutorial">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 gap-1 text-[11px] px-2"
                onClick={onStartTutorial}
              >
                <HelpCircle className="w-3 h-3" />
              </Button>
            </MobileTooltip>
          )}
          {onOpenPaymentForecast && (
            <div className="relative">
              <MobileTooltip label="AI Payment Schedule">
                <Button 
                  variant="default"
                  size="sm" 
                  className="h-6 gap-1 text-[11px] px-2 glow-pulse shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
                  onClick={onOpenPaymentForecast}
                >
                  <Sparkles className="w-3 h-3" />
                  <span className="hidden lg:inline">AI Schedule</span>
                </Button>
              </MobileTooltip>
              {/* Mobile pointer indicator */}
              <AnimatePresence>
                {isMobile && showSchedulePointer && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center"
                  >
                    <span className="text-[10px] font-medium text-primary whitespace-nowrap bg-background/90 px-1.5 py-0.5 rounded">
                      Try AI Scheduling
                    </span>
                    <ChevronDown className="w-3 h-3 text-primary animate-bounce" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          {onOpenDuplicateDetection && (
            <MobileTooltip label="Check Duplicates">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-6 gap-1 text-[11px] px-2"
                onClick={onOpenDuplicateDetection}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </MobileTooltip>
          )}
          <MobileTooltip label="Refresh Bills">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-6 gap-1 text-[11px] px-2"
              onClick={onRefresh}
              disabled={isProcessing}
            >
              <RefreshCw className={cn("w-3 h-3", isProcessing && "animate-spin")} />
            </Button>
          </MobileTooltip>
          <MobileTooltip label="Batch Approve">
            <Button 
              size="sm" 
              className="h-6 gap-1 text-[11px] px-2"
              onClick={onBatchProcess}
              disabled={isProcessing || stats.autoApproveEligible === 0}
            >
              <BarChart3 className="w-3 h-3" />
              {stats.autoApproveEligible}
            </Button>
          </MobileTooltip>
        </div>
      </div>
    </div>
  );
}

interface InlineStatProps {
  label: string;
  value: string | number;
  color: string;
  highlight?: boolean;
}

function InlineStat({ label, value, color, highlight }: InlineStatProps) {
  return (
    <div className={cn("flex items-center gap-1", highlight && "font-medium")}>
      <span className="text-muted-foreground">{label}:</span>
      <span className={cn(color, "tabular-nums")}>{value}</span>
    </div>
  );
}

export default BatchStatsHeader;
