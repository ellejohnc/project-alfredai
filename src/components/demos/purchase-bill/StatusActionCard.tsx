import { cn } from "@/lib/utils";
import { BillStatus, PurchaseBill } from "./purchaseBillData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileSearch, Link2, ClipboardCheck, Scale, 
  CloudUpload, Calendar, Archive, Sparkles, 
  ArrowRight
} from "lucide-react";

interface StatusActionCardProps {
  bill: PurchaseBill;
  onAction: (action: string) => void;
  isProcessing: boolean;
}

// Status-specific guidance
const STATUS_GUIDANCE: Record<BillStatus, {
  action_label: string;
  action_icon: React.ReactNode;
  guidance: string;
  data_sources: string[];
  next_status: BillStatus;
}> = {
  received: {
    action_label: "Start Extraction",
    action_icon: <FileSearch className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
    guidance: "AI will scan the invoice PDF, extract supplier details, line items, amounts, and dates.",
    data_sources: ["Invoice PDF", "OCR Engine", "Template Library"],
    next_status: "extracted",
  },
  extracted: {
    action_label: "Match & Verify",
    action_icon: <Link2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
    guidance: "Cross-reference against PO system, approved supplier list, and active contracts.",
    data_sources: ["Procore POs", "Contract Database", "Supplier Registry"],
    next_status: "matched",
  },
  matched: {
    action_label: "Review Matches",
    action_icon: <ClipboardCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
    guidance: "AI found matches across systems. Review confidence scores and flagged variances.",
    data_sources: ["Match Results", "Variance Report", "Historical Patterns"],
    next_status: "needs_review",
  },
  needs_review: {
    action_label: "Make Decision",
    action_icon: <Scale className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
    guidance: "Review AI recommendations, risk flags, and supplier history before approval.",
    data_sources: ["AI Analysis", "Risk Assessment", "Approval Matrix"],
    next_status: "approved",
  },
  approved: {
    action_label: "Sync to Accounting",
    action_icon: <CloudUpload className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
    guidance: "Push approved invoice to Xero with matched cost codes.",
    data_sources: ["Xero API", "Chart of Accounts", "Job Costing"],
    next_status: "synced",
  },
  synced: {
    action_label: "Schedule Payment",
    action_icon: <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
    guidance: "Invoice is in Xero. Schedule for payment run based on due date.",
    data_sources: ["Xero Invoices", "Payment Schedule", "Cash Flow"],
    next_status: "paid",
  },
  paid: {
    action_label: "Archive & Close",
    action_icon: <Archive className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
    guidance: "Payment complete. Archive invoice and update supplier history.",
    data_sources: ["Bank Feed", "Supplier Ledger"],
    next_status: "paid",
  },
};

export function StatusActionCard({ bill, onAction, isProcessing }: StatusActionCardProps) {
  const guidance = STATUS_GUIDANCE[bill.status];
  const isTerminal = bill.status === 'paid';
  
  return (
    <div className="space-y-2 sm:space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-medium text-foreground min-w-0">
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary shrink-0" />
          <span className="truncate">AI Suggested Next Step</span>
        </div>
        {!isTerminal && (
          <Badge variant="outline" className="text-[8px] sm:text-[9px] py-0 h-3.5 sm:h-4 shrink-0 px-1 sm:px-1.5">
            → {guidance.next_status.replace('_', ' ')}
          </Badge>
        )}
      </div>
      
      {/* Action Button */}
      {!isTerminal && (
        <Button
          size="sm"
          className={cn(
            "w-full h-8 sm:h-9 text-[10px] sm:text-sm gap-1.5 sm:gap-2 font-medium",
            bill.status === 'received' && "bg-slate-600 hover:bg-slate-700",
            bill.status === 'extracted' && "bg-blue-600 hover:bg-blue-700",
            bill.status === 'matched' && "bg-cyan-600 hover:bg-cyan-700",
            bill.status === 'needs_review' && "bg-amber-600 hover:bg-amber-700",
            bill.status === 'approved' && "bg-green-600 hover:bg-green-700",
            bill.status === 'synced' && "bg-emerald-600 hover:bg-emerald-700"
          )}
          onClick={() => onAction(bill.status)}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            guidance.action_icon
          )}
          <span className="truncate">{guidance.action_label}</span>
          <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-auto shrink-0" />
        </Button>
      )}
      
      {/* Guidance Text */}
      <p className="text-[9px] sm:text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
        {guidance.guidance}
      </p>
      
      {/* Data Sources - inline text */}
      <p className="text-[9px] sm:text-[10px] text-muted-foreground/70 break-words">
        Where to look: {guidance.data_sources.join(" • ")}
      </p>
      
      {/* Terminal State */}
      {isTerminal && (
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 text-purple-600 dark:text-purple-400">
          <Archive className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm font-medium">Invoice Complete</span>
        </div>
      )}
    </div>
  );
}

export default StatusActionCard;
