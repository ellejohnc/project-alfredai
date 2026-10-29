import { PurchaseBill, formatCurrency, formatDate } from "./purchaseBillData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  History, FileText, Receipt, AlertTriangle, 
  CheckCircle2, Building2, ExternalLink, ChevronDown, ChevronUp
} from "lucide-react";
import { useState } from "react";
import { MobileTooltip } from "@/components/ui/mobile-tooltip";

interface HistoricalContextCardProps {
  bill: PurchaseBill;
  onViewSupplier360?: () => void;
}

// Generate mock supplier history based on bill data
function generateSupplierHistory(bill: PurchaseBill) {
  const now = new Date();
  const pastInvoices = [];
  
  // Generate 3-6 past invoices
  const numPast = Math.floor(Math.random() * 4) + 3;
  for (let i = 0; i < numPast; i++) {
    const daysAgo = Math.floor(Math.random() * 180) + 30;
    const invoiceDate = new Date(now);
    invoiceDate.setDate(invoiceDate.getDate() - daysAgo);
    
    const hasDispute = Math.random() < 0.15;
    
    pastInvoices.push({
      invoice_number: `INV-${2024}-${1000 + Math.floor(Math.random() * 900)}`,
      date: invoiceDate,
      amount: Math.round(bill.total_amount * (0.6 + Math.random() * 0.8)),
      status: hasDispute ? 'disputed' as const : 'paid' as const,
      dispute_reason: hasDispute ? 'Rate variance' : undefined,
    });
  }
  
  // Sort by date descending
  pastInvoices.sort((a, b) => b.date.getTime() - a.date.getTime());
  
  // Generate contract info (70% chance)
  const hasContract = Math.random() > 0.3;
  const contract = hasContract ? {
    reference: `SC-2024-${Math.floor(Math.random() * 100).toString().padStart(3, '0')}`,
    start_date: new Date(now.getFullYear(), 0, 15),
    end_date: new Date(now.getFullYear() + 1, 5, 30),
    value: Math.round(bill.total_amount * (8 + Math.random() * 12)),
    retention_rate: 0.05,
  } : null;
  
  // Calculate metrics
  const totalPaid = pastInvoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0);
  
  const disputeCount = pastInvoices.filter(i => i.status === 'disputed').length;
  const avgPaymentDays = Math.floor(Math.random() * 15) + 20;
  
  return {
    supplier_id: bill.supplier_id,
    supplier_name: bill.supplier_name,
    past_invoices: pastInvoices,
    contract,
    total_paid_ytd: totalPaid,
    avg_payment_days: avgPaymentDays,
    dispute_count: disputeCount,
    bank_change_count: bill.previous_bank_details ? 1 : 0,
    relationship_since: new Date(2022, Math.floor(Math.random() * 12), 1),
  };
}

export function HistoricalContextCard({ bill, onViewSupplier360 }: HistoricalContextCardProps) {
  const history = generateSupplierHistory(bill);
  const [showInvoices, setShowInvoices] = useState(false);
  
  return (
    <div className="space-y-2 sm:space-y-2.5 pt-2 sm:pt-3 border-t border-border">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-medium text-foreground min-w-0">
          <History className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary shrink-0" />
          <span className="truncate">Supplier History</span>
        </div>
        {onViewSupplier360 && (
          <MobileTooltip label="View Full Supplier Profile">
            <Button
              variant="ghost"
              size="sm"
              className="h-4 sm:h-5 text-[9px] sm:text-[10px] px-1 sm:px-1.5 gap-0.5 sm:gap-1 text-primary hover:text-primary shrink-0"
              onClick={onViewSupplier360}
            >
              <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span className="hidden xs:inline">360 View</span>
              <span className="xs:hidden">360</span>
            </Button>
          </MobileTooltip>
        )}
      </div>
      
      {/* Quick Stats - Responsive */}
      <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-3 sm:gap-4 text-[10px] sm:text-xs">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">YTD Paid:</span>
          <span className="font-medium text-foreground">{formatCurrency(history.total_paid_ytd)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Avg:</span>
          <span className="font-medium text-foreground">{history.avg_payment_days} days</span>
        </div>
      </div>
      
      {/* Contract Info - Simple */}
      {history.contract && (
        <div className="text-[9px] sm:text-[11px] text-muted-foreground flex items-start gap-1">
          <FileText className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary shrink-0 mt-0.5" />
          <span className="break-words">
            Contract {history.contract.reference} • {formatCurrency(history.contract.value)} • Ends {formatDate(history.contract.end_date)}
          </span>
        </div>
      )}
      
      {/* Past Invoices - Collapsible */}
      <button
        onClick={() => setShowInvoices(!showInvoices)}
        className="flex items-center gap-1 text-[9px] sm:text-[11px] text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <Receipt className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
        <span>Recent Invoices ({history.past_invoices.length})</span>
        {showInvoices ? <ChevronUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-auto shrink-0" /> : <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-auto shrink-0" />}
      </button>
      
      {showInvoices && (
        <div className="space-y-0.5 sm:space-y-1 max-h-[70px] sm:max-h-[80px] overflow-y-auto">
          {history.past_invoices.slice(0, 4).map((inv, idx) => (
            <div 
              key={idx}
              className="flex items-center justify-between text-[9px] sm:text-[10px] py-0.5 gap-1.5 sm:gap-2 min-w-0"
            >
              <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
                {inv.status === 'paid' ? (
                  <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-500 shrink-0" />
                ) : (
                  <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 shrink-0" />
                )}
                <span className="text-muted-foreground truncate min-w-0">{inv.invoice_number}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 shrink-0 text-[8px] sm:text-[10px]">
                <span className="text-foreground">{formatCurrency(inv.amount)}</span>
                <span className="text-muted-foreground hidden xs:inline">{formatDate(inv.date)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Risk Indicators - Responsive */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] flex-wrap">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Building2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
          <span>Since {history.relationship_since.getFullYear()}</span>
        </div>
        {history.dispute_count > 0 && (
          <Badge variant="outline" className="text-[8px] sm:text-[9px] py-0 h-3.5 sm:h-4 border-amber-500/50 text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30 px-1 sm:px-1.5">
            {history.dispute_count} dispute{history.dispute_count > 1 ? 's' : ''}
          </Badge>
        )}
        {history.bank_change_count > 0 && (
          <Badge variant="outline" className="text-[8px] sm:text-[9px] py-0 h-3.5 sm:h-4 border-red-500/50 text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/30 px-1 sm:px-1.5">
            Bank changed
          </Badge>
        )}
      </div>
    </div>
  );
}

export default HistoricalContextCard;
