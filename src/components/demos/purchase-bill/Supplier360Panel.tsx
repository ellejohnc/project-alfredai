import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { cn } from "@/lib/utils";
import { PurchaseBill, formatCurrency, formatDate } from "./purchaseBillData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  X, Building2, FileText, DollarSign, AlertTriangle,
  CheckCircle2, Clock, TrendingUp, TrendingDown, CreditCard,
  FileWarning, History, Shield, Phone, Mail, MapPin,
  Calendar, BarChart3, Banknote, Star, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

interface Supplier360PanelProps {
  isOpen: boolean;
  onClose: () => void;
  bill: PurchaseBill | null;
  bills: PurchaseBill[];
}

interface SupplierProfile {
  id: string;
  name: string;
  abn: string;
  category: string;
  creditScore: number;
  creditRating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC';
  riskLevel: 'low' | 'medium' | 'high';
  relationshipSince: Date;
  primaryContact: {
    name: string;
    email: string;
    phone: string;
  };
  address: string;
  paymentTerms: number;
  totalSpendYTD: number;
  totalSpendAllTime: number;
  averageInvoiceValue: number;
  onTimePaymentRate: number;
}

interface InvoiceHistory {
  invoiceNumber: string;
  date: Date;
  amount: number;
  status: 'paid' | 'pending' | 'disputed' | 'overdue';
  paidDate?: Date;
  daysToPayment?: number;
}

interface DisputeRecord {
  id: string;
  date: Date;
  invoiceNumber: string;
  reason: string;
  status: 'open' | 'resolved' | 'escalated';
  resolution?: string;
  amount: number;
}

interface BankChangeRecord {
  date: Date;
  previousBsb: string;
  previousAccount: string;
  newBsb: string;
  newAccount: string;
  verifiedBy?: string;
  verifiedDate?: Date;
}

interface ContractSummary {
  reference: string;
  title: string;
  startDate: Date;
  endDate: Date;
  totalValue: number;
  invoicedToDate: number;
  retentionHeld: number;
  status: 'active' | 'expired' | 'pending';
}

export function Supplier360Panel({ 
  isOpen, 
  onClose, 
  bill,
  bills 
}: Supplier360PanelProps) {
  // Lock background scroll when panel is open
  useBodyScrollLock(isOpen);

  const [activeTab, setActiveTab] = useState('overview');

  // Generate comprehensive supplier data
  const supplierData = useMemo(() => {
    if (!bill) return null;

    const supplierBills = bills.filter(b => b.supplier_id === bill.supplier_id);
    const now = new Date();

    // Profile
    const profile: SupplierProfile = {
      id: bill.supplier_id,
      name: bill.supplier_name,
      abn: bill.supplier_abn,
      category: bill.line_items[0]?.category || 'General',
      creditScore: Math.floor(Math.random() * 200) + 600,
      creditRating: ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC'][Math.floor(Math.random() * 4)] as any,
      riskLevel: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
      relationshipSince: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), 1),
      primaryContact: {
        name: 'John Smith',
        email: `accounts@${bill.supplier_name.toLowerCase().replace(/\s+/g, '')}.com.au`,
        phone: `+61 ${Math.floor(Math.random() * 9) + 1}${Math.random().toString().slice(2, 10)}`,
      },
      address: '123 Industrial Ave, Capital Region NSW 2000',
      paymentTerms: 30,
      totalSpendYTD: supplierBills.reduce((sum, b) => sum + b.total_amount, 0) * 3,
      totalSpendAllTime: supplierBills.reduce((sum, b) => sum + b.total_amount, 0) * 12,
      averageInvoiceValue: supplierBills.length > 0 
        ? supplierBills.reduce((sum, b) => sum + b.total_amount, 0) / supplierBills.length
        : 0,
      onTimePaymentRate: Math.floor(Math.random() * 15) + 85,
    };

    // Invoice History
    const invoiceHistory: InvoiceHistory[] = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const isPaid = i > 1 || Math.random() > 0.3;
      const isDisputed = Math.random() < 0.1;
      
      invoiceHistory.push({
        invoiceNumber: `INV-${2025 - Math.floor(i / 12)}-${1000 + Math.floor(Math.random() * 900)}`,
        date,
        amount: Math.floor(Math.random() * 50000) + 10000,
        status: isDisputed ? 'disputed' : isPaid ? 'paid' : i === 0 ? 'pending' : 'overdue',
        paidDate: isPaid ? new Date(date.getTime() + (Math.random() * 30 + 15) * 24 * 60 * 60 * 1000) : undefined,
        daysToPayment: isPaid ? Math.floor(Math.random() * 20) + 20 : undefined,
      });
    }

    // Disputes
    const disputes: DisputeRecord[] = [];
    if (Math.random() > 0.5) {
      disputes.push({
        id: 'DIS-001',
        date: new Date(now.getTime() - Math.random() * 180 * 24 * 60 * 60 * 1000),
        invoiceNumber: 'INV-2024-0892',
        reason: 'Rate variance - billed at $185/hr vs contracted $165/hr',
        status: 'resolved',
        resolution: 'Credit note issued for $2,400',
        amount: 2400,
      });
    }
    if (Math.random() > 0.7) {
      disputes.push({
        id: 'DIS-002',
        date: new Date(now.getTime() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        invoiceNumber: 'INV-2025-0234',
        reason: 'Duplicate charge for site mobilisation',
        status: 'open',
        amount: 8500,
      });
    }

    // Bank Changes
    const bankChanges: BankChangeRecord[] = [];
    if (bill.previous_bank_details) {
      bankChanges.push({
        date: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        previousBsb: bill.previous_bank_details.bsb,
        previousAccount: bill.previous_bank_details.account_number,
        newBsb: bill.bank_details.bsb,
        newAccount: bill.bank_details.account_number,
        verifiedBy: 'Sarah Johnson',
        verifiedDate: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      });
    }

    // Contracts
    const contracts: ContractSummary[] = [{
      reference: `SC-2024-${Math.floor(Math.random() * 100).toString().padStart(3, '0')}`,
      title: `${bill.project_name} - Subcontract`,
      startDate: new Date(2024, 0, 15),
      endDate: new Date(2025, 6, 30),
      totalValue: Math.floor(Math.random() * 500000) + 200000,
      invoicedToDate: Math.floor(Math.random() * 200000) + 100000,
      retentionHeld: Math.floor(Math.random() * 15000) + 5000,
      status: 'active',
    }];

    return { profile, invoiceHistory, disputes, bankChanges, contracts };
  }, [bill, bills]);

  const getCreditRatingColor = (rating: string) => {
    if (rating.startsWith('AA')) return 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/30';
    if (rating.startsWith('A')) return 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30';
    if (rating.startsWith('BB')) return 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30';
    return 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/30';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-700 bg-green-50 border-green-500/30 dark:text-green-400 dark:bg-green-950/30';
      case 'medium': return 'text-amber-700 bg-amber-50 border-amber-500/30 dark:text-amber-400 dark:bg-amber-950/30';
      case 'high': return 'text-red-700 bg-red-50 border-red-500/30 dark:text-red-400 dark:bg-red-950/30';
      default: return '';
    }
  };

  if (!isOpen || !bill || !supplierData) return null;

  const { profile, invoiceHistory, disputes, bankChanges, contracts } = supplierData;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="h-full w-full max-w-2xl bg-card border-l border-border shadow-2xl flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">{profile.name}</h2>
                  <p className="text-xs text-muted-foreground">ABN: {profile.abn}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-2">
              <div className="p-2 bg-muted/50 rounded-lg text-center">
                <div className={cn(
                  "text-lg font-bold",
                  getCreditRatingColor(profile.creditRating)
                )}>
                  {profile.creditRating}
                </div>
                <div className="text-[10px] text-muted-foreground">Credit Rating</div>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg text-center">
                <div className="text-lg font-bold">{profile.creditScore}</div>
                <div className="text-[10px] text-muted-foreground">Credit Score</div>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg text-center">
                <Badge variant="outline" className={cn("text-[10px]", getRiskColor(profile.riskLevel))}>
                  {profile.riskLevel.toUpperCase()}
                </Badge>
                <div className="text-[10px] text-muted-foreground mt-0.5">Risk Level</div>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg text-center">
                <div className="text-lg font-bold text-green-700 dark:text-green-400">{profile.onTimePaymentRate}%</div>
                <div className="text-[10px] text-muted-foreground">On-Time Pay</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full justify-start px-4 py-2 bg-muted/30 rounded-none border-b border-border">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="invoices" className="text-xs">Invoices</TabsTrigger>
              <TabsTrigger value="contracts" className="text-xs">Contracts</TabsTrigger>
              <TabsTrigger value="disputes" className="text-xs">
                Disputes
                {disputes.filter(d => d.status === 'open').length > 0 && (
                  <Badge variant="destructive" className="ml-1 text-[8px] py-0 h-4">
                    {disputes.filter(d => d.status === 'open').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="banking" className="text-xs">
                Banking
                {bankChanges.length > 0 && (
                  <Badge variant="outline" className="ml-1 text-[8px] py-0 h-4 border-amber-500/50 text-amber-600">
                    Changed
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              <TabsContent value="overview" className="p-4 space-y-4 mt-0">
                {/* Contact Info */}
                <Card className="border-border">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-xs">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.primaryContact.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.primaryContact.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.address}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Spend Summary */}
                <Card className="border-border">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-xs flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-primary" />
                      Spend Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground">YTD Spend</div>
                        <div className="text-lg font-semibold">{formatCurrency(profile.totalSpendYTD)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">All Time</div>
                        <div className="text-lg font-semibold">{formatCurrency(profile.totalSpendAllTime)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Avg Invoice</div>
                        <div className="text-lg font-semibold">{formatCurrency(profile.averageInvoiceValue)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Relationship</div>
                        <div className="text-lg font-semibold">
                          {new Date().getFullYear() - profile.relationshipSince.getFullYear()}+ years
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Performance */}
                <Card className="border-border">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-xs flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      Payment Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>On-Time Payment Rate</span>
                        <span className="font-medium text-green-700 dark:text-green-400">{profile.onTimePaymentRate}%</span>
                      </div>
                      <Progress value={profile.onTimePaymentRate} className="h-2" />
                      <div className="text-[10px] text-muted-foreground">
                        Average days to payment: {Math.round(invoiceHistory.filter(i => i.daysToPayment).reduce((sum, i) => sum + (i.daysToPayment || 0), 0) / invoiceHistory.filter(i => i.daysToPayment).length || 0)} days
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="invoices" className="p-4 mt-0">
                <Card className="border-border">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-xs flex items-center justify-between">
                      <span>Invoice History (Last 12 Months)</span>
                      <Badge variant="outline" className="text-[9px]">
                        {invoiceHistory.length} invoices
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 divide-y divide-border">
                    {invoiceHistory.map((inv, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {inv.status === 'paid' && <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />}
                          {inv.status === 'pending' && <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                          {inv.status === 'disputed' && <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                          {inv.status === 'overdue' && <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />}
                          <div>
                            <div className="text-sm font-medium">{inv.invoiceNumber}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {formatDate(inv.date)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{formatCurrency(inv.amount)}</div>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[9px]",
                              inv.status === 'paid' && "text-green-700 border-green-500/50 dark:text-green-400",
                              inv.status === 'pending' && "text-blue-700 border-blue-500/50 dark:text-blue-400",
                              inv.status === 'disputed' && "text-amber-700 border-amber-500/50 dark:text-amber-400",
                              inv.status === 'overdue' && "text-red-700 border-red-500/50 dark:text-red-400"
                            )}
                          >
                            {inv.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contracts" className="p-4 mt-0">
                <div className="space-y-3">
                  {contracts.map((contract, idx) => (
                    <Card key={idx} className="border-border">
                      <CardHeader className="py-2 px-3">
                        <CardTitle className="text-xs flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            {contract.reference}
                          </div>
                          <Badge 
                            variant="outline"
                            className={cn(
                              "text-[9px]",
                              contract.status === 'active' && "text-green-600 border-green-500/50"
                            )}
                          >
                            {contract.status}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3">
                        <div className="text-sm font-medium mb-2">{contract.title}</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Contract Value:</span>
                            <span className="font-medium ml-1">{formatCurrency(contract.totalValue)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Invoiced:</span>
                            <span className="font-medium ml-1">{formatCurrency(contract.invoicedToDate)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Retention Held:</span>
                            <span className="font-medium ml-1">{formatCurrency(contract.retentionHeld)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Ends:</span>
                            <span className="font-medium ml-1">{formatDate(contract.endDate)}</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <Progress 
                            value={(contract.invoicedToDate / contract.totalValue) * 100} 
                            className="h-1.5" 
                          />
                          <div className="text-[10px] text-muted-foreground mt-1">
                            {Math.round((contract.invoicedToDate / contract.totalValue) * 100)}% invoiced
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="disputes" className="p-4 mt-0">
                {disputes.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500/30" />
                    <h3 className="font-medium mb-1">No Dispute History</h3>
                    <p className="text-sm text-muted-foreground">
                      This supplier has no recorded disputes
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {disputes.map((dispute, idx) => (
                      <Card 
                        key={idx} 
                        className={cn(
                          "border-border",
                          dispute.status === 'open' && "border-amber-500/50"
                        )}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <FileWarning className="w-4 h-4 text-amber-500" />
                              <span className="font-medium text-sm">{dispute.id}</span>
                            </div>
                            <Badge 
                              variant="outline"
                              className={cn(
                                "text-[9px]",
                                dispute.status === 'open' && "text-amber-600 border-amber-500/50",
                                dispute.status === 'resolved' && "text-green-600 border-green-500/50",
                                dispute.status === 'escalated' && "text-red-600 border-red-500/50"
                              )}
                            >
                              {dispute.status}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-xs">
                            <div>
                              <span className="text-muted-foreground">Invoice:</span>
                              <span className="ml-1">{dispute.invoiceNumber}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Amount:</span>
                              <span className="ml-1 font-medium">{formatCurrency(dispute.amount)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Reason:</span>
                              <span className="ml-1">{dispute.reason}</span>
                            </div>
                            {dispute.resolution && (
                              <div className="pt-1 text-green-600">
                                <span className="text-muted-foreground">Resolution:</span>
                                <span className="ml-1">{dispute.resolution}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="banking" className="p-4 mt-0">
                {/* Current Bank Details */}
                <Card className="border-border mb-4">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-xs flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-primary" />
                      Current Bank Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">BSB:</span>
                        <div className="font-mono">{bill.bank_details.bsb}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Account:</span>
                        <div className="font-mono">{bill.bank_details.account_number}</div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground text-xs">Account Name:</span>
                        <div>{bill.bank_details.account_name}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bank Change History */}
                <Card className="border-border">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-xs flex items-center gap-2">
                      <History className="w-4 h-4 text-amber-500" />
                      Bank Detail Changes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    {bankChanges.length === 0 ? (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500/30" />
                        No bank detail changes recorded
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {bankChanges.map((change, idx) => (
                          <div key={idx} className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-500/50">
                                {formatDate(change.date)}
                              </Badge>
                              {change.verifiedBy && (
                                <Badge variant="outline" className="text-[9px] text-green-600 border-green-500/50">
                                  Verified by {change.verifiedBy}
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <div className="text-muted-foreground">Previous BSB:</div>
                                <div className="font-mono line-through">{change.previousBsb}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">New BSB:</div>
                                <div className="font-mono text-amber-600">{change.newBsb}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Previous Account:</div>
                                <div className="font-mono line-through">{change.previousAccount}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">New Account:</div>
                                <div className="font-mono text-amber-600">{change.newAccount}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          {/* Footer */}
          <div className="p-4 border-t border-border flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button>
              <Mail className="w-4 h-4 mr-2" />
              Contact Supplier
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default Supplier360Panel;
