import { cn } from "@/lib/utils";
import { 
  PurchaseBill, 
  getStatusDisplay, 
  formatCurrency, 
  formatDate 
} from "./purchaseBillData";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Mail, Upload, Zap, AlertTriangle, Snowflake } from "lucide-react";

interface BillQueueProps {
  bills: PurchaseBill[];
  selectedBillId: string | null;
  onSelectBill: (bill: PurchaseBill) => void;
}

export function BillQueue({ bills, selectedBillId, onSelectBill }: BillQueueProps) {
  const getSourceIcon = (source: PurchaseBill["source_channel"]) => {
    switch (source) {
      case "email": return <Mail className="w-3 h-3" />;
      case "upload": return <Upload className="w-3 h-3" />;
      case "api": return <Zap className="w-3 h-3" />;
    }
  };

  const getSeverityIndicator = (bill: PurchaseBill) => {
    // Show frozen indicator first
    if (bill.is_frozen) {
      return <Snowflake className="w-3 h-3 text-blue-400" />;
    }
    
    const hasHigh = bill.risk_flags.some(f => f.severity === "high");
    const hasMedium = bill.risk_flags.some(f => f.severity === "medium");
    
    if (hasHigh) return <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />;
    if (hasMedium) return <div className="w-2 h-2 rounded-full bg-sky-500" />;
    return null;
  };

  // Sort bills: frozen at bottom
  const sortedBills = [...bills].sort((a, b) => {
    if (a.is_frozen && !b.is_frozen) return 1;
    if (!a.is_frozen && b.is_frozen) return -1;
    return 0;
  });

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border border-border">
      <div className="p-3 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Incoming Bills</h3>
          </div>
          <div className="flex items-center gap-2">
            {bills.filter(b => b.is_frozen).length > 0 && (
              <Badge variant="outline" className="text-[10px] border-blue-500/50 text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30">
                <Snowflake className="w-2.5 h-2.5 mr-1" />
                {bills.filter(b => b.is_frozen).length} frozen
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {bills.length}
            </Badge>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sortedBills.map((bill) => {
            const statusInfo = getStatusDisplay(bill.status);
            const isSelected = bill.id === selectedBillId;
            const hasRisk = bill.risk_flags.length > 0;

            return (
              <button
                key={bill.id}
                onClick={() => onSelectBill(bill)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-all duration-200",
                  "hover:bg-muted/50 border border-transparent",
                  isSelected && "bg-primary/10 dark:bg-primary/20 border-primary/40 shadow-sm",
                  !isSelected && "hover:border-border",
                  bill.is_frozen && "opacity-60 bg-blue-500/5"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="shrink-0">{getSeverityIndicator(bill)}</span>
                      <span className={cn(
                        "font-medium text-sm truncate block max-w-[140px]",
                        isSelected ? "text-primary dark:text-primary-foreground" : "text-foreground",
                        bill.is_frozen && "text-muted-foreground"
                      )} title={bill.supplier_name}>
                        {bill.supplier_name}
                      </span>
                    </div>
                    <div className={cn(
                      "text-xs mt-0.5 truncate max-w-[140px]",
                      isSelected ? "text-primary/70 dark:text-primary-foreground/70" : "text-muted-foreground"
                    )} title={bill.invoice_number}>
                      {bill.invoice_number}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={cn(
                      "font-semibold text-sm tabular-nums",
                      isSelected ? "text-primary dark:text-primary-foreground" : "text-foreground",
                      bill.is_frozen && "text-muted-foreground"
                    )}>
                      {formatCurrency(bill.total_amount)}
                    </div>
                    <div className={cn(
                      "text-xs",
                      isSelected ? "text-primary/70 dark:text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {formatDate(bill.invoice_date)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5">
                    {bill.is_frozen ? (
                      <Badge 
                        variant="outline" 
                        className="text-[10px] px-1.5 py-0 h-5 border-blue-500/50 text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30"
                      >
                        <Snowflake className="w-2.5 h-2.5 mr-0.5" /> Frozen
                      </Badge>
                    ) : (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px] px-1.5 py-0 h-5",
                          bill.status === "needs_review" && "border-rose-500/50 text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30",
                          bill.status === "approved" && "border-emerald-500/50 text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30",
                          bill.status === "synced" && "border-teal-500/50 text-teal-700 bg-teal-50 dark:text-teal-400 dark:bg-teal-950/30",
                          bill.status === "matched" && "border-cyan-500/50 text-cyan-700 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-950/30"
                        )}
                      >
                        {statusInfo.icon} {statusInfo.label}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    {getSourceIcon(bill.source_channel)}
                    <span className="text-[10px]">{bill.confidence_score}%</span>
                  </div>
                </div>

                {hasRisk && bill.status === "needs_review" && !bill.is_frozen && (
                  <div className="flex items-center gap-1 mt-2 text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="text-[10px]">
                      {bill.risk_flags.length} issue{bill.risk_flags.length > 1 ? "s" : ""} detected
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

export default BillQueue;
