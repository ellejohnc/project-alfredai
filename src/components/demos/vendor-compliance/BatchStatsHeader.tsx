import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Zap,
  Send,
  Cloud,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

interface BatchStats {
  totalVendors: number;
  compliantVendors: number;
  expiringVendors: number;
  nonCompliantVendors: number;
  totalDocuments: number;
  currentDocuments: number;
  expiringDocuments: number;
  expiredDocuments: number;
  missingDocuments: number;
  pendingReviewDocuments: number;
}

interface BatchStatsHeaderProps {
  stats: BatchStats;
  incomingCount: number;
  onRefresh: () => void;
  onBatchProcess: () => void;
  onSendReminders: () => void;
  onSyncAll: () => void;
  isProcessing: boolean;
}

export function BatchStatsHeader({
  stats,
  incomingCount,
  onRefresh,
  onBatchProcess,
  onSendReminders,
  onSyncAll,
  isProcessing
}: BatchStatsHeaderProps) {
  const isMobile = useIsMobile();
  const compliantPercent = Math.round((stats.compliantVendors / stats.totalVendors) * 100);

  // Mobile: Condensed 3-stat layout
  if (isMobile) {
    return (
      <div id="vc-batch-stats" className="bg-card border border-border rounded-lg px-3 py-2 space-y-2">
        {/* Mobile: 3 key metrics */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <MobileStat 
            icon={CheckCircle}
            value={`${compliantPercent}%`}
            label="Compliant"
            colorClass="text-emerald-600 dark:text-emerald-400"
          />
          <MobileStat 
            icon={Clock}
            value={stats.expiringVendors}
            label="Expiring"
            colorClass="text-amber-600 dark:text-amber-400"
          />
          <MobileStat 
            icon={AlertTriangle}
            value={stats.nonCompliantVendors}
            label="Non-Compliant"
            colorClass="text-rose-600 dark:text-rose-400"
          />
        </div>

        {/* Mobile: Icon-only buttons with touch-friendly sizing */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
          <TooltipProvider delayDuration={400}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRefresh}
                  disabled={isProcessing}
                  className="min-h-[44px] min-w-[44px] p-0"
                  aria-label="Refresh"
                >
                  <RefreshCw className={cn("w-5 h-5", isProcessing && "animate-spin")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh data</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="default"
                  onClick={onBatchProcess}
                  disabled={isProcessing}
                  className="min-h-[44px] flex-1 gap-2"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  <span className="text-xs">Auto-Verify</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Auto-approve ≥90% confidence</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onSendReminders}
                  disabled={isProcessing}
                  className="min-h-[44px] min-w-[44px] p-0"
                  aria-label="Send Reminders"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send reminders</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onSyncAll}
                  disabled={isProcessing}
                  className="min-h-[44px] min-w-[44px] p-0"
                  aria-label="Sync to SharePoint"
                >
                  <Cloud className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sync to SharePoint</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    );
  }

  // Desktop: Original layout
  return (
    <div id="vc-batch-stats" className="bg-card border border-border rounded-lg px-3 py-2 space-y-2">
      {/* Ultra-compact inline stats row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <InlineStat 
          icon={Users} 
          value={stats.totalVendors} 
          label="Total Vendors" 
          color="slate" 
        />
        <InlineStat 
          icon={FileText} 
          value={stats.totalDocuments} 
          label="Documents" 
          color="slate" 
        />
        <InlineStat 
          icon={CheckCircle} 
          value={stats.compliantVendors} 
          label="Compliant" 
          subValue={`${compliantPercent}%`}
          color="emerald" 
        />
        <InlineStat 
          icon={Clock} 
          value={stats.expiringVendors} 
          label="Expiring" 
          color="amber" 
        />
        <InlineStat 
          icon={AlertTriangle} 
          value={stats.nonCompliantVendors} 
          label="Non-Compliant" 
          color="rose" 
        />
        <InlineStat 
          icon={FileText} 
          value={incomingCount} 
          label="In Queue" 
          color="sky" 
        />
      </div>

      {/* Action Buttons - compact */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={onRefresh}
                disabled={isProcessing}
                className="h-8 px-2.5 text-xs"
              >
                <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", isProcessing && "animate-spin")} />
                Refresh
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh vendor and document data</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="default"
                onClick={onBatchProcess}
                disabled={isProcessing}
                className="h-8 px-2.5 text-xs"
              >
                {isProcessing ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5 mr-1.5" />
                )}
                Auto-Verify All
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Auto-approve documents with all fields ≥90% confidence</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                onClick={onSendReminders}
                disabled={isProcessing}
                className="h-8 px-2.5 text-xs"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Send Reminders
                <Badge variant="outline" className="ml-1.5 h-4 px-1 text-[10px]">
                  {stats.expiringVendors + stats.nonCompliantVendors}
                </Badge>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Send reminders to expiring and non-compliant vendors</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={onSyncAll}
                disabled={isProcessing}
                className="h-8 px-2.5 text-xs"
              >
                <Cloud className="w-3.5 h-3.5 mr-1.5" />
                Sync to SharePoint
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Sync all verified documents to SharePoint</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

// Mobile stat component
function MobileStat({
  icon: Icon,
  value,
  label,
  colorClass
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  colorClass: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Icon className={cn("w-4 h-4", colorClass)} />
      <span className={cn("text-lg font-bold", colorClass)}>{value}</span>
      <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
    </div>
  );
}

function InlineStat({
  icon: Icon,
  value,
  label,
  subValue,
  color
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  subValue?: string;
  color: "slate" | "emerald" | "amber" | "rose" | "sky";
}) {
  const iconColorClasses = {
    slate: "text-muted-foreground",
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    rose: "text-rose-600 dark:text-rose-400",
    sky: "text-sky-600 dark:text-sky-400",
  };

  return (
    <div className="flex items-center gap-1.5">
      <Icon className={cn("w-3.5 h-3.5", iconColorClasses[color])} />
      <span className="text-sm font-bold tabular-nums">{value.toLocaleString()}</span>
      {subValue && (
        <span className="text-[11px] text-muted-foreground">{subValue}</span>
      )}
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

export default BatchStatsHeader;
