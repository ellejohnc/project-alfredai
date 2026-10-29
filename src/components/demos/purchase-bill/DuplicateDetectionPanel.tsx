import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { cn } from "@/lib/utils";
import { PurchaseBill, formatCurrency, formatDate } from "./purchaseBillData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  X, AlertTriangle, CheckCircle2, Copy, FileWarning,
  Calendar, DollarSign, Building2, ArrowRight, Shield,
  Sparkles, Eye, XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

interface DuplicateDetectionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  bills: PurchaseBill[];
  selectedBill: PurchaseBill | null;
}

interface DuplicateMatch {
  bill: PurchaseBill;
  matchType: 'exact' | 'similar_amount' | 'overlapping_period' | 'same_po';
  confidence: number;
  evidence: string[];
  risk: 'high' | 'medium' | 'low';
}

interface DetectionResult {
  scannedBill: PurchaseBill;
  duplicates: DuplicateMatch[];
  status: 'clear' | 'warning' | 'alert';
}

export function DuplicateDetectionPanel({ 
  isOpen, 
  onClose, 
  bills,
  selectedBill 
}: DuplicateDetectionPanelProps) {
  // Lock background scroll when panel is open
  useBodyScrollLock(isOpen);

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [results, setResults] = useState<DetectionResult[]>([]);

  // Generate mock duplicate detection results
  const runScan = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setResults([]);

    const billsToScan = selectedBill ? [selectedBill] : bills.slice(0, 15);
    const newResults: DetectionResult[] = [];

    for (let i = 0; i < billsToScan.length; i++) {
      await new Promise(r => setTimeout(r, 150));
      setScanProgress(((i + 1) / billsToScan.length) * 100);

      const bill = billsToScan[i];
      const duplicates: DuplicateMatch[] = [];

      // Simulate finding duplicates (20% chance for each bill)
      if (Math.random() < 0.2) {
        // Find a "similar" bill from the list
        const otherBills = bills.filter(b => b.id !== bill.id);
        const matchBill = otherBills[Math.floor(Math.random() * otherBills.length)];
        
        if (matchBill) {
          const matchTypes = ['exact', 'similar_amount', 'overlapping_period', 'same_po'] as const;
          const matchType = matchTypes[Math.floor(Math.random() * matchTypes.length)];
          
          const evidenceByType: Record<string, string[]> = {
            exact: [
              `Invoice number ${bill.invoice_number} matches historical record`,
              `Same supplier and amount detected`,
              `Submitted ${Math.floor(Math.random() * 30) + 1} days apart`,
            ],
            similar_amount: [
              `Amount ${formatCurrency(bill.total_amount)} within 5% of ${formatCurrency(matchBill.total_amount)}`,
              `Same supplier: ${bill.supplier_name}`,
              `Similar line item descriptions detected`,
            ],
            overlapping_period: [
              `Claim period overlaps with ${matchBill.invoice_number}`,
              `Both invoices cover dates in ${formatDate(bill.invoice_date)}`,
              `Risk of double-billing for same work period`,
            ],
            same_po: [
              `Both reference PO: ${bill.po_reference}`,
              `Combined value may exceed PO limit`,
              `Review PO remaining balance before approval`,
            ],
          };

          duplicates.push({
            bill: matchBill,
            matchType,
            confidence: Math.floor(Math.random() * 30) + 70,
            evidence: evidenceByType[matchType],
            risk: matchType === 'exact' ? 'high' : matchType === 'similar_amount' ? 'medium' : 'low',
          });
        }
      }

      newResults.push({
        scannedBill: bill,
        duplicates,
        status: duplicates.length === 0 ? 'clear' : 
                duplicates.some(d => d.risk === 'high') ? 'alert' : 'warning',
      });
    }

    setResults(newResults);
    setIsScanning(false);
  };

  const stats = useMemo(() => {
    const alerts = results.filter(r => r.status === 'alert').length;
    const warnings = results.filter(r => r.status === 'warning').length;
    const clear = results.filter(r => r.status === 'clear').length;
    const totalDuplicateValue = results
      .flatMap(r => r.duplicates)
      .reduce((sum, d) => sum + d.bill.total_amount, 0);

    return { alerts, warnings, clear, totalDuplicateValue };
  }, [results]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-700 bg-red-50 border-red-500/50 dark:text-red-400 dark:bg-red-950/30';
      case 'medium': return 'text-amber-700 bg-amber-50 border-amber-500/50 dark:text-amber-400 dark:bg-amber-950/30';
      case 'low': return 'text-blue-700 bg-blue-50 border-blue-500/50 dark:text-blue-400 dark:bg-blue-950/30';
      default: return '';
    }
  };

  const getMatchTypeLabel = (type: string) => {
    switch (type) {
      case 'exact': return 'Exact Match';
      case 'similar_amount': return 'Similar Amount';
      case 'overlapping_period': return 'Overlapping Period';
      case 'same_po': return 'Same PO Reference';
      default: return type;
    }
  };

  if (!isOpen) return null;

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
          className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Copy className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Duplicate Invoice Detection</h2>
                <p className="text-xs text-muted-foreground">
                  AI-powered scan for potential duplicate charges
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {/* Scan Controls */}
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-medium">
                        {selectedBill 
                          ? `Scanning: ${selectedBill.invoice_number}`
                          : `Batch scan: ${bills.length} invoices`
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Checking against 12 months of historical data
                      </div>
                    </div>
                    <Button 
                      onClick={runScan}
                      disabled={isScanning}
                    >
                      {isScanning ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          Run Scan
                        </>
                      )}
                    </Button>
                  </div>

                  {isScanning && (
                    <div className="space-y-2">
                      <Progress value={scanProgress} className="h-2" />
                      <div className="text-xs text-muted-foreground text-center">
                        {Math.round(scanProgress)}% complete
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Results Summary */}
              {results.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  <Card className="border-border">
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl font-bold text-foreground">{results.length}</div>
                      <div className="text-xs text-muted-foreground">Scanned</div>
                    </CardContent>
                  </Card>
                  <Card className="border-red-500/30 bg-red-50 dark:bg-red-950/20">
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.alerts}</div>
                      <div className="text-xs text-red-700 dark:text-red-400">Alerts</div>
                    </CardContent>
                  </Card>
                  <Card className="border-amber-500/30 bg-amber-50 dark:bg-amber-950/20">
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.warnings}</div>
                      <div className="text-xs text-amber-700 dark:text-amber-400">Warnings</div>
                    </CardContent>
                  </Card>
                  <Card className="border-green-500/30 bg-green-50 dark:bg-green-950/20">
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.clear}</div>
                      <div className="text-xs text-green-700 dark:text-green-400">Clear</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Duplicate Findings */}
              {results.filter(r => r.duplicates.length > 0).length > 0 && (
                <Card className="border-border">
                  <CardHeader className="py-2 px-3 bg-amber-50 dark:bg-amber-950/30">
                    <CardTitle className="text-sm flex items-center gap-2 text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="w-4 h-4" />
                      Potential Duplicates Found ({results.filter(r => r.duplicates.length > 0).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 divide-y divide-border">
                    {results
                      .filter(r => r.duplicates.length > 0)
                      .map((result, idx) => (
                        <div key={idx} className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <FileWarning className="w-4 h-4 text-amber-500" />
                              <span className="font-medium text-sm">
                                {result.scannedBill.invoice_number}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                from {result.scannedBill.supplier_name}
                              </span>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-[9px]",
                                result.status === 'alert' ? 'text-red-700 border-red-500/50 dark:text-red-400' : 'text-amber-700 border-amber-500/50 dark:text-amber-400'
                              )}
                            >
                              {result.status.toUpperCase()}
                            </Badge>
                          </div>

                          {result.duplicates.map((dup, dupIdx) => (
                            <div 
                              key={dupIdx}
                              className={cn(
                                "ml-6 p-3 rounded-lg border mt-2",
                                getRiskColor(dup.risk)
                              )}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[9px]">
                                    {getMatchTypeLabel(dup.matchType)}
                                  </Badge>
                                  <span className="text-xs">
                                    Matches: {dup.bill.invoice_number}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    Confidence:
                                  </span>
                                  <Progress value={dup.confidence} className="w-16 h-1.5" />
                                  <span className="text-xs font-medium">{dup.confidence}%</span>
                                </div>
                              </div>

                              <div className="space-y-1">
                                {dup.evidence.map((ev, evIdx) => (
                                  <div key={evIdx} className="flex items-start gap-2 text-[11px]">
                                    <ArrowRight className="w-3 h-3 mt-0.5 shrink-0" />
                                    <span>{ev}</span>
                                  </div>
                                ))}
                              </div>

                              <div className="flex gap-2 mt-3">
                                <Button size="sm" variant="outline" className="h-7 text-xs hover:bg-muted">
                                  <Eye className="w-3 h-3 mr-1" />
                                  Compare
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs text-red-700 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Mark as Duplicate
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs text-green-700 hover:text-green-800 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/50">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Dismiss
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                  </CardContent>
                </Card>
              )}

              {/* Clear Results */}
              {results.filter(r => r.duplicates.length === 0).length > 0 && (
                <Card className="border-border">
                  <CardHeader className="py-2 px-3 bg-green-50 dark:bg-green-950/30">
                    <CardTitle className="text-sm flex items-center gap-2 text-green-800 dark:text-green-300">
                      <CheckCircle2 className="w-4 h-4" />
                      No Duplicates Found ({results.filter(r => r.duplicates.length === 0).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="flex flex-wrap gap-2">
                      {results
                        .filter(r => r.duplicates.length === 0)
                        .slice(0, 10)
                        .map((result, idx) => (
                          <Badge key={idx} variant="secondary" className="text-[10px]">
                            {result.scannedBill.invoice_number}
                          </Badge>
                        ))}
                      {results.filter(r => r.duplicates.length === 0).length > 10 && (
                        <Badge variant="outline" className="text-[10px]">
                          +{results.filter(r => r.duplicates.length === 0).length - 10} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Empty State */}
              {results.length === 0 && !isScanning && (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="font-medium mb-2">Ready to Scan</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Click "Run Scan" to check for duplicate invoices against your historical data
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default DuplicateDetectionPanel;
