import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { cn } from "@/lib/utils";
import { PurchaseBill, formatCurrency, formatDate } from "./purchaseBillData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X, Mail, Send, Sparkles, AlertTriangle, FileText,
  CheckCircle2, Copy, Edit3, RefreshCw, Building2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

interface SupplierQueryEmailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  bill: PurchaseBill | null;
  onSendEmail?: (bill: PurchaseBill, emailData: EmailData) => void;
}

interface EmailData {
  to: string;
  cc: string;
  subject: string;
  body: string;
  queryType: string;
}

type QueryType = 'rate_variance' | 'missing_documentation' | 'duplicate_charge' | 'bank_verification' | 'po_variance' | 'general';

const QUERY_TEMPLATES: Record<QueryType, { subject: string; body: string }> = {
  rate_variance: {
    subject: 'Query: Rate Variance on Invoice {invoice_number}',
    body: `Dear {supplier_name} Accounts Team,

We are processing invoice {invoice_number} dated {invoice_date} for the amount of {total_amount}, and have identified a rate variance that requires clarification.

**Issue Identified:**
{issue_details}

**Requested Action:**
Please review and provide one of the following:
1. An updated invoice with the correct contracted rates
2. Documentation supporting the rate change (e.g., approved variation order)
3. A credit note for the difference of {variance_amount}

**Reference Information:**
- Invoice Number: {invoice_number}
- Invoice Date: {invoice_date}
- Invoice Amount: {total_amount}
- Project: {project_name}
- PO Reference: {po_reference}

Please respond within 5 business days to avoid payment delays.

Best regards,
Accounts Payable Team`,
  },
  missing_documentation: {
    subject: 'Documentation Required: Invoice {invoice_number}',
    body: `Dear {supplier_name} Accounts Team,

We are processing invoice {invoice_number} and require additional documentation before we can proceed with payment.

**Missing Documentation:**
{issue_details}

**Please Provide:**
- Signed delivery docket or completion certificate
- Approved timesheet (if applicable)
- Work order reference

**Reference Information:**
- Invoice Number: {invoice_number}
- Invoice Date: {invoice_date}
- Invoice Amount: {total_amount}
- Project: {project_name}

Payment will be processed upon receipt of the required documentation.

Best regards,
Accounts Payable Team`,
  },
  duplicate_charge: {
    subject: 'Potential Duplicate Charge: Invoice {invoice_number}',
    body: `Dear {supplier_name} Accounts Team,

Our system has flagged invoice {invoice_number} as a potential duplicate charge.

**Details:**
{issue_details}

**Please Confirm:**
1. Whether this invoice is a duplicate of a previous submission
2. If this is a separate charge, please provide documentation differentiating the work

**Reference Information:**
- Invoice Number: {invoice_number}
- Invoice Date: {invoice_date}
- Invoice Amount: {total_amount}
- Project: {project_name}

We will hold payment pending your clarification.

Best regards,
Accounts Payable Team`,
  },
  bank_verification: {
    subject: 'URGENT: Bank Details Verification Required - Invoice {invoice_number}',
    body: `Dear {supplier_name} Accounts Team,

**IMPORTANT: This email requires immediate attention.**

Our records indicate that the bank details on invoice {invoice_number} differ from our previous records for your company.

**Previous Details on File:**
- BSB: {previous_bsb}
- Account: {previous_account}

**New Details on Invoice:**
- BSB: {new_bsb}
- Account: {new_account}

**For security purposes, please:**
1. Confirm this change is legitimate via a return phone call to the number we have on file
2. Provide official company letterhead confirming the new banking details
3. Include contact details of an authorized signatory we can verify with

**We will not process payment until bank details are independently verified.**

This is a standard fraud prevention measure to protect both our organizations.

Best regards,
Accounts Payable Team`,
  },
  po_variance: {
    subject: 'Purchase Order Variance: Invoice {invoice_number}',
    body: `Dear {supplier_name} Accounts Team,

Invoice {invoice_number} exceeds the approved Purchase Order value and requires clarification.

**Variance Details:**
- Invoice Amount: {total_amount}
- PO Amount: {po_amount}
- Variance: {variance_amount} ({variance_percent}%)

**Please Provide:**
- Approved variation order for the additional amount
- Or, a revised invoice matching the PO value

**Reference Information:**
- Invoice Number: {invoice_number}
- PO Reference: {po_reference}
- Project: {project_name}

Best regards,
Accounts Payable Team`,
  },
  general: {
    subject: 'Query Regarding Invoice {invoice_number}',
    body: `Dear {supplier_name} Accounts Team,

We are writing regarding invoice {invoice_number}.

{issue_details}

**Reference Information:**
- Invoice Number: {invoice_number}
- Invoice Date: {invoice_date}
- Invoice Amount: {total_amount}
- Project: {project_name}

Please respond at your earliest convenience.

Best regards,
Accounts Payable Team`,
  },
};

const EMAIL_PROVIDERS = [
  { id: 'outlook', name: 'Microsoft Outlook', icon: '📧' },
  { id: 'gmail', name: 'Gmail', icon: '📬' },
  { id: 'internal', name: 'Internal System', icon: '🏢' },
];

export function SupplierQueryEmailPanel({ 
  isOpen, 
  onClose, 
  bill,
  onSendEmail 
}: SupplierQueryEmailPanelProps) {
  // Lock background scroll when panel is open
  useBodyScrollLock(isOpen);

  const [queryType, setQueryType] = useState<QueryType>('general');
  const [emailProvider, setEmailProvider] = useState('outlook');
  const [isEditing, setIsEditing] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Generate email content based on bill and query type
  const generateEmailContent = useMemo(() => {
    if (!bill) return { to: '', cc: '', subject: '', body: '' };

    const template = QUERY_TEMPLATES[queryType];
    const issueDetails = bill.risk_flags.length > 0 
      ? bill.risk_flags.map(f => `• ${f.evidence}`).join('\n')
      : 'Please review and provide clarification.';

    const variance = bill.po_amount ? bill.total_amount - bill.po_amount : 0;
    const variancePercent = bill.po_amount ? ((variance / bill.po_amount) * 100).toFixed(1) : '0';

    const subject = template.subject
      .replace('{invoice_number}', bill.invoice_number);

    const body = template.body
      .replace(/{supplier_name}/g, bill.supplier_name)
      .replace(/{invoice_number}/g, bill.invoice_number)
      .replace(/{invoice_date}/g, formatDate(bill.invoice_date))
      .replace(/{total_amount}/g, formatCurrency(bill.total_amount))
      .replace(/{project_name}/g, bill.project_name)
      .replace(/{po_reference}/g, bill.po_reference || 'N/A')
      .replace(/{po_amount}/g, bill.po_amount ? formatCurrency(bill.po_amount) : 'N/A')
      .replace(/{variance_amount}/g, formatCurrency(Math.abs(variance)))
      .replace(/{variance_percent}/g, variancePercent)
      .replace(/{issue_details}/g, issueDetails)
      .replace(/{previous_bsb}/g, bill.previous_bank_details?.bsb || 'N/A')
      .replace(/{previous_account}/g, bill.previous_bank_details?.account_number || 'N/A')
      .replace(/{new_bsb}/g, bill.bank_details.bsb)
      .replace(/{new_account}/g, bill.bank_details.account_number);

    return {
      to: `accounts@${bill.supplier_name.toLowerCase().replace(/\s+/g, '')}.com.au`,
      cc: 'accounts.payable@company.com',
      subject,
      body,
    };
  }, [bill, queryType]);

  const [emailData, setEmailData] = useState<EmailData>({
    ...generateEmailContent,
    queryType,
  });

  // Update email when query type changes
  const handleQueryTypeChange = (type: QueryType) => {
    setQueryType(type);
    if (!isEditing) {
      setEmailData(prev => ({
        ...prev,
        ...generateEmailContent,
        queryType: type,
      }));
    }
  };

  const handleSend = async () => {
    if (!bill) return;
    
    setIsSending(true);
    
    // Simulate email sending
    await new Promise(r => setTimeout(r, 1500));
    
    onSendEmail?.(bill, emailData);
    toast.success('Query email sent successfully');
    
    setIsSending(false);
    onClose();
  };

  const handleCopy = () => {
    const fullEmail = `To: ${emailData.to}\nCC: ${emailData.cc}\nSubject: ${emailData.subject}\n\n${emailData.body}`;
    navigator.clipboard.writeText(fullEmail);
    toast.success('Email copied to clipboard');
  };

  const handleReset = () => {
    setEmailData({
      ...generateEmailContent,
      queryType,
    });
    setIsEditing(false);
  };

  if (!isOpen || !bill) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Mail className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Query Supplier</h2>
                <p className="text-xs text-muted-foreground">
                  {bill.invoice_number} • {bill.supplier_name}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {/* Issue Summary */}
              {bill.risk_flags.length > 0 && (
                <Card className="border-amber-500/30 bg-amber-500/5">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-xs flex items-center gap-2 text-amber-700">
                      <AlertTriangle className="w-4 h-4" />
                      Issues to Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="space-y-1">
                      {bill.risk_flags.map((flag, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[9px] py-0 shrink-0",
                              flag.severity === 'high' && "text-red-600 border-red-500/50",
                              flag.severity === 'medium' && "text-amber-600 border-amber-500/50"
                            )}
                          >
                            {flag.severity}
                          </Badge>
                          <span>{flag.evidence}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Query Type & Provider Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Query Type</Label>
                  <Select value={queryType} onValueChange={(v) => handleQueryTypeChange(v as QueryType)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rate_variance">Rate Variance</SelectItem>
                      <SelectItem value="missing_documentation">Missing Documentation</SelectItem>
                      <SelectItem value="duplicate_charge">Duplicate Charge</SelectItem>
                      <SelectItem value="bank_verification">Bank Verification</SelectItem>
                      <SelectItem value="po_variance">PO Variance</SelectItem>
                      <SelectItem value="general">General Query</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Send Via</Label>
                  <Select value={emailProvider} onValueChange={setEmailProvider}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMAIL_PROVIDERS.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="flex items-center gap-2">
                            <span>{p.icon}</span>
                            <span>{p.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Email Form */}
              <Card className="border-border">
                <CardHeader className="py-2 px-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    AI-Generated Email
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Edit3 className="w-3 h-3 mr-1" />
                      {isEditing ? 'View Only' : 'Edit'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={handleReset}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Reset
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">To</Label>
                      <Input
                        value={emailData.to}
                        onChange={e => setEmailData(prev => ({ ...prev, to: e.target.value }))}
                        disabled={!isEditing}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">CC</Label>
                      <Input
                        value={emailData.cc}
                        onChange={e => setEmailData(prev => ({ ...prev, cc: e.target.value }))}
                        disabled={!isEditing}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Subject</Label>
                    <Input
                      value={emailData.subject}
                      onChange={e => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                      disabled={!isEditing}
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Body</Label>
                    <Textarea
                      value={emailData.body}
                      onChange={e => setEmailData(prev => ({ ...prev, body: e.target.value }))}
                      disabled={!isEditing}
                      className="min-h-[300px] text-sm font-mono"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border flex justify-between items-center">
            <Button variant="outline" onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSend} disabled={isSending}>
                {isSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Query
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default SupplierQueryEmailPanel;
