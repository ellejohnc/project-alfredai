import { motion } from "framer-motion";
import { Receipt, FileSpreadsheet, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InvoiceItem } from "./types";

interface InvoicePreviewProps {
  invoiceNumber: string;
  clientName: string;
  items: InvoiceItem[];
  onExportToXero?: () => void;
}

export function InvoicePreview({
  invoiceNumber,
  clientName,
  items,
  onExportToXero,
}: InvoicePreviewProps) {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const gst = subtotal * 0.1;
  const total = subtotal + gst;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Invoice Preview</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {invoiceNumber}
          </Badge>
        </div>
      </div>

      {/* Invoice content */}
      <div className="p-4 space-y-4">
        {/* Client info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Building2 className="w-3.5 h-3.5" />
          <span>Bill to: <span className="text-foreground font-medium">{clientName}</span></span>
        </div>

        {/* Line items */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-2 p-2 bg-muted/50 text-[10px] font-semibold text-muted-foreground">
            <div className="col-span-6">Description</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-2 text-right">Rate</div>
            <div className="col-span-2 text-right">Total</div>
          </div>
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-2 p-2 text-xs border-t border-border"
            >
              <div className="col-span-6 text-foreground">{item.description}</div>
              <div className="col-span-2 text-center text-muted-foreground">{item.quantity}</div>
              <div className="col-span-2 text-right text-muted-foreground tabular-nums">
                ${item.unitPrice.toLocaleString()}
              </div>
              <div className="col-span-2 text-right font-medium text-foreground tabular-nums">
                ${item.total.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground tabular-nums">${subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">GST (10%)</span>
            <span className="text-foreground tabular-nums">${gst.toLocaleString()}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border font-semibold">
            <span className="text-foreground">Total</span>
            <span className="text-primary text-sm tabular-nums">${total.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment terms */}
        <p className="text-[10px] text-muted-foreground">
          Payment due within 14 days. ABN: 12 345 678 901
        </p>

        {/* Export button */}
        <Button
          onClick={onExportToXero}
          variant="outline"
          className="w-full gap-2 min-h-[44px]"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Sync to Xero
        </Button>
      </div>
    </motion.div>
  );
}
