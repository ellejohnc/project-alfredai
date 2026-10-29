import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  PurchaseBill, 
  formatCurrency, 
  formatDate,
  getBillTypeDisplay,
  getStatusDisplay 
} from "./purchaseBillData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, Building2, Calendar, DollarSign, 
  CheckCircle2, AlertCircle, Layers, CreditCard,
  Hash, Briefcase, Clock, ExternalLink
} from "lucide-react";

interface BillDetailPanelProps {
  bill: PurchaseBill | null;
}

export function BillDetailPanel({ bill }: BillDetailPanelProps) {
  const [activeTab, setActiveTab] = useState("extraction");

  if (!bill) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-card rounded-lg border border-border text-center p-8">
        <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h3 className="font-semibold text-foreground mb-1">No Bill Selected</h3>
        <p className="text-sm text-muted-foreground">
          Select a bill from the queue to view details
        </p>
      </div>
    );
  }

  const statusInfo = getStatusDisplay(bill.status);

  const getConfidenceColor = (score: number) => {
    if (score >= 95) return "text-green-500";
    if (score >= 85) return "text-emerald-500";
    if (score >= 75) return "text-amber-500";
    return "text-red-500";
  };

  const FieldRow = ({ 
    label, 
    value, 
    confidence, 
    icon: Icon 
  }: { 
    label: string; 
    value: string; 
    confidence?: number;
    icon?: typeof FileText;
  }) => (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 gap-2">
      <div className="flex items-center gap-2 shrink-0">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground shrink-0" />}
        <span className="text-sm text-muted-foreground whitespace-nowrap">{label}</span>
      </div>
      <div className="flex items-center gap-2 min-w-0 justify-end">
        <span className="font-medium text-sm text-foreground truncate" title={value}>{value}</span>
        {confidence !== undefined && (
          <span className={cn("text-xs shrink-0", getConfidenceColor(confidence))}>
            {confidence}%
          </span>
        )}
        {confidence !== undefined && confidence >= 90 && (
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
        )}
        {confidence !== undefined && confidence < 90 && (
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-lg text-foreground truncate max-w-[200px]" title={bill.supplier_name}>
                {bill.supplier_name}
              </h2>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs shrink-0 whitespace-nowrap",
                  bill.status === "needs_review" && "border-amber-500/50 text-amber-600 bg-amber-500/10",
                  bill.status === "approved" && "border-green-500/50 text-green-600 bg-green-500/10",
                  bill.status === "synced" && "border-emerald-500/50 text-emerald-600 bg-emerald-500/10"
                )}
              >
                {statusInfo.icon} {statusInfo.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 truncate" title={`${bill.invoice_number} • ABN: ${bill.supplier_abn}`}>
              {bill.invoice_number} • ABN: {bill.supplier_abn}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xl font-bold text-foreground whitespace-nowrap tabular-nums">
              {formatCurrency(bill.total_amount)}
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              Due: {formatDate(bill.due_date)}
            </div>
          </div>
        </div>

        {/* Confidence Score Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">AI Extraction Confidence</span>
            <span className={cn("font-medium", getConfidenceColor(bill.confidence_score))}>
              {bill.confidence_score}%
            </span>
          </div>
          <Progress 
            value={bill.confidence_score} 
            className="h-2"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0 h-auto">
          <TabsTrigger 
            value="extraction" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5"
          >
            Extracted Data
          </TabsTrigger>
          <TabsTrigger 
            value="line-items"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5"
          >
            Line Items
          </TabsTrigger>
          <TabsTrigger 
            value="preview"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5"
          >
            Invoice Preview
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="extraction" className="p-4 m-0 space-y-4">
            {/* Core Fields */}
            <Card className="border-border">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <FieldRow 
                  label="Supplier" 
                  value={bill.supplier_name} 
                  confidence={bill.field_confidence.supplier_name}
                  icon={Building2}
                />
                <FieldRow 
                  label="Invoice #" 
                  value={bill.invoice_number} 
                  confidence={bill.field_confidence.invoice_number}
                  icon={Hash}
                />
                <FieldRow 
                  label="Invoice Date" 
                  value={formatDate(bill.invoice_date)} 
                  confidence={bill.field_confidence.invoice_date}
                  icon={Calendar}
                />
                <FieldRow 
                  label="Due Date" 
                  value={formatDate(bill.due_date)}
                  icon={Clock}
                />
              </CardContent>
            </Card>

            {/* Amounts */}
            <Card className="border-border">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Amounts
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <FieldRow 
                  label="Subtotal" 
                  value={formatCurrency(bill.subtotal)} 
                  confidence={bill.field_confidence.subtotal}
                />
                <FieldRow 
                  label="GST (10%)" 
                  value={formatCurrency(bill.tax_amount)} 
                  confidence={bill.field_confidence.tax_amount}
                />
                <div className="flex items-center justify-between py-2 bg-muted/50 rounded px-2 mt-2">
                  <span className="font-semibold text-sm">Total</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg tabular-nums">{formatCurrency(bill.total_amount)}</span>
                    <span className={cn("text-xs", getConfidenceColor(bill.field_confidence.total_amount))}>
                      {bill.field_confidence.total_amount}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project & Classification */}
            <Card className="border-border">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  Classification
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <FieldRow 
                  label="Project" 
                  value={bill.project_name}
                  icon={Layers}
                />
                <FieldRow 
                  label="Cost Code" 
                  value={bill.cost_code}
                  icon={Hash}
                />
                <FieldRow 
                  label="Bill Type" 
                  value={getBillTypeDisplay(bill.bill_type)}
                />
                {bill.po_reference && (
                  <FieldRow 
                    label="PO Reference" 
                    value={bill.po_reference}
                  />
                )}
              </CardContent>
            </Card>

            {/* Bank Details */}
            <Card className="border-border">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <FieldRow 
                  label="BSB" 
                  value={bill.bank_details.bsb}
                />
                <FieldRow 
                  label="Account" 
                  value={bill.bank_details.account_number}
                />
                <FieldRow 
                  label="Account Name" 
                  value={bill.bank_details.account_name}
                />
                {bill.previous_bank_details && (
                  <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="flex items-center gap-1.5 text-amber-600 text-xs font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Bank details changed from previous invoice
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Previous BSB: {bill.previous_bank_details.bsb}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="line-items" className="p-4 m-0">
            <Card className="border-border">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Line Items ({bill.line_items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-3">
                  {bill.line_items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-muted/30 rounded-lg border border-border/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-foreground">
                            {item.description}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-[10px] py-0 h-4">
                              {item.cost_code}
                            </Badge>
                            <span>{item.category}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm">
                            {formatCurrency(item.total)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.quantity} × {formatCurrency(item.unit_price)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(bill.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">GST (10%)</span>
                    <span>{formatCurrency(bill.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
                    <span>Total</span>
                    <span>{formatCurrency(bill.total_amount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="p-4 m-0">
            {/* Simulated Invoice Preview */}
            <div className="bg-white rounded-lg border border-border p-6 shadow-sm">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="text-2xl font-bold text-slate-800">{bill.supplier_name}</div>
                  <div className="text-sm text-slate-500">ABN: {bill.supplier_abn}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-slate-800">TAX INVOICE</div>
                  <div className="text-sm text-slate-500">{bill.invoice_number}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-6">
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Bill To</div>
                  <div className="text-sm text-slate-700 font-medium">{bill.project_name}</div>
                  <div className="text-sm text-slate-500">Project: {bill.cost_code}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Invoice Date</div>
                  <div className="text-sm text-slate-700">{formatDate(bill.invoice_date)}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider mt-2 mb-1">Due Date</div>
                  <div className="text-sm text-slate-700">{formatDate(bill.due_date)}</div>
                </div>
              </div>

              <table className="w-full mb-6">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left text-xs text-slate-400 uppercase py-2">Description</th>
                    <th className="text-right text-xs text-slate-400 uppercase py-2">Qty</th>
                    <th className="text-right text-xs text-slate-400 uppercase py-2">Rate</th>
                    <th className="text-right text-xs text-slate-400 uppercase py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.line_items.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-2 text-sm text-slate-700">{item.description}</td>
                      <td className="py-2 text-sm text-slate-600 text-right">{item.quantity}</td>
                      <td className="py-2 text-sm text-slate-600 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="py-2 text-sm text-slate-700 text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-48">
                  <div className="flex justify-between py-1 text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="text-slate-700">{formatCurrency(bill.subtotal)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-sm">
                    <span className="text-slate-500">GST (10%)</span>
                    <span className="text-slate-700">{formatCurrency(bill.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-base font-bold border-t border-slate-200 mt-2">
                    <span className="text-slate-800">Total AUD</span>
                    <span className="text-slate-800">{formatCurrency(bill.total_amount)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Payment Details</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">BSB:</span>
                    <span className="text-slate-700 ml-2">{bill.bank_details.bsb}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Account:</span>
                    <span className="text-slate-700 ml-2">{bill.bank_details.account_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Name:</span>
                    <span className="text-slate-700 ml-2">{bill.bank_details.account_name}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
              <ExternalLink className="w-3 h-3" />
              <span>Simulated invoice preview • Original PDF available in attachments</span>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

export default BillDetailPanel;
