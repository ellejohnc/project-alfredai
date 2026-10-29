import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { SafeAnimatePresence } from "@/components/ui/safe-animate-presence";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Check, ChevronDown, Filter, AlertTriangle, 
  CheckCircle2, Sparkles, DollarSign, BarChart3,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PurchaseBill, formatCurrency, getRecommendationDisplay } from "./purchaseBillData";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

interface BatchFilters {
  minConfidence: number;
  maxAmount: number | null;
  riskLevel: 'low' | 'low_medium' | 'all';
  aiRecommendation: 'auto_approve' | 'auto_approve_route_finance' | 'all';
}

interface BatchApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  bills: PurchaseBill[];
  onApprove: (billIds: string[]) => void;
}

export function BatchApprovalModal({ isOpen, onClose, bills, onApprove }: BatchApprovalModalProps) {
  // Lock background scroll when modal is open
  useBodyScrollLock(isOpen);

  const [filters, setFilters] = useState<BatchFilters>({
    minConfidence: 85,
    maxAmount: null,
    riskLevel: 'low_medium',
    aiRecommendation: 'auto_approve_route_finance'
  });
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [selectedBillIds, setSelectedBillIds] = useState<Set<string>>(new Set());
  const [isApproving, setIsApproving] = useState(false);

  // Get eligible bills (not already approved/synced/paid)
  const eligibleBills = useMemo(() => {
    return bills.filter(b => 
      b.status !== 'approved' && 
      b.status !== 'synced' && 
      b.status !== 'paid'
    );
  }, [bills]);

  // Apply filters
  const filteredBills = useMemo(() => {
    return eligibleBills.filter(bill => {
      // Confidence filter
      if (bill.confidence_score < filters.minConfidence) return false;
      
      // Amount filter
      if (filters.maxAmount && bill.total_amount > filters.maxAmount) return false;
      
      // Risk level filter
      const highRiskCount = bill.risk_flags.filter(f => f.severity === 'high').length;
      const mediumRiskCount = bill.risk_flags.filter(f => f.severity === 'medium').length;
      
      if (filters.riskLevel === 'low' && (highRiskCount > 0 || mediumRiskCount > 0)) return false;
      if (filters.riskLevel === 'low_medium' && highRiskCount > 0) return false;
      
      // AI recommendation filter
      if (filters.aiRecommendation === 'auto_approve' && bill.ai_recommendation !== 'auto_approve') return false;
      if (filters.aiRecommendation === 'auto_approve_route_finance' && 
          bill.ai_recommendation !== 'auto_approve' && 
          bill.ai_recommendation !== 'route_finance') return false;
      
      return true;
    });
  }, [eligibleBills, filters]);

  // Auto-select filtered bills on filter change
  useMemo(() => {
    setSelectedBillIds(new Set(filteredBills.map(b => b.id)));
  }, [filteredBills]);

  // Calculate stats
  const stats = useMemo(() => {
    const selected = bills.filter(b => selectedBillIds.has(b.id));
    return {
      selectedCount: selected.length,
      eligibleCount: filteredBills.length,
      totalValue: selected.reduce((sum, b) => sum + b.total_amount, 0),
      avgConfidence: selected.length > 0 
        ? Math.round(selected.reduce((sum, b) => sum + b.confidence_score, 0) / selected.length)
        : 0,
      highRiskCount: selected.filter(b => b.risk_flags.some(f => f.severity === 'high')).length
    };
  }, [bills, selectedBillIds, filteredBills]);

  const toggleBill = useCallback((billId: string) => {
    setSelectedBillIds(prev => {
      const next = new Set(prev);
      if (next.has(billId)) {
        next.delete(billId);
      } else {
        next.add(billId);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedBillIds.size === filteredBills.length) {
      setSelectedBillIds(new Set());
    } else {
      setSelectedBillIds(new Set(filteredBills.map(b => b.id)));
    }
  }, [filteredBills, selectedBillIds]);

  const handleApprove = useCallback(() => {
    setIsApproving(true);
    setTimeout(() => {
      onApprove(Array.from(selectedBillIds));
      setIsApproving(false);
    }, 500);
  }, [selectedBillIds, onApprove]);

  const getRiskBadge = (bill: PurchaseBill) => {
    const highRisk = bill.risk_flags.filter(f => f.severity === 'high').length;
    const mediumRisk = bill.risk_flags.filter(f => f.severity === 'medium').length;
    
    if (highRisk > 0) return <Badge className="bg-red-500/10 text-red-500 text-[10px]">High Risk</Badge>;
    if (mediumRisk > 0) return <Badge className="bg-amber-500/10 text-amber-500 text-[10px]">Medium</Badge>;
    return <Badge className="bg-green-500/10 text-green-500 text-[10px]">Low Risk</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Batch Approve Bills
          </DialogTitle>
          <DialogDescription>
            Review and approve multiple bills at once with tolerance filters
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Filters */}
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="border-b border-border">
            <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm">Tolerance Filters</span>
                <Badge variant="outline" className="text-xs">
                  {filteredBills.length} of {eligibleBills.length} eligible
                </Badge>
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                filtersOpen && "rotate-180"
              )} />
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="p-4 pt-0 grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Minimum Confidence */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Min Confidence
                  </label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[filters.minConfidence]}
                      onValueChange={([v]) => setFilters(prev => ({ ...prev, minConfidence: v }))}
                      min={70}
                      max={99}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-10 text-right">
                      {filters.minConfidence}%
                    </span>
                  </div>
                </div>

                {/* Max Amount */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Max Amount
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {[10000, 50000, 100000, null].map((amount) => (
                      <Button
                        key={amount ?? 'unlimited'}
                        variant={filters.maxAmount === amount ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setFilters(prev => ({ ...prev, maxAmount: amount }))}
                      >
                        {amount ? formatCurrency(amount) : "∞"}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Risk Level */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Risk Level
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { value: 'low', label: 'Low Only' },
                      { value: 'low_medium', label: 'Low+Med' },
                      { value: 'all', label: 'All' }
                    ].map(({ value, label }) => (
                      <Button
                        key={value}
                        variant={filters.riskLevel === value ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setFilters(prev => ({ 
                          ...prev, 
                          riskLevel: value as BatchFilters['riskLevel'] 
                        }))}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* AI Recommendation */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    AI Recommendation
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { value: 'auto_approve', label: 'Auto Only' },
                      { value: 'auto_approve_route_finance', label: '+Route' },
                      { value: 'all', label: 'All' }
                    ].map(({ value, label }) => (
                      <Button
                        key={value}
                        variant={filters.aiRecommendation === value ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setFilters(prev => ({ 
                          ...prev, 
                          aiRecommendation: value as BatchFilters['aiRecommendation'] 
                        }))}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Bills Table */}
          <ScrollArea className="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedBillIds.size === filteredBills.length && filteredBills.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Confidence</TableHead>
                  <TableHead className="text-center">Risk</TableHead>
                  <TableHead>AI Rec</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No bills match the current filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBills.map((bill) => {
                    const recInfo = getRecommendationDisplay(bill.ai_recommendation);
                    return (
                      <TableRow 
                        key={bill.id}
                        className={cn(
                          "cursor-pointer",
                          selectedBillIds.has(bill.id) && "bg-primary/5"
                        )}
                        onClick={() => toggleBill(bill.id)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            checked={selectedBillIds.has(bill.id)}
                            onCheckedChange={() => toggleBill(bill.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{bill.supplier_name}</TableCell>
                        <TableCell className="font-mono text-xs">{bill.invoice_number}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(bill.total_amount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            "font-medium",
                            bill.confidence_score >= 90 ? "text-green-500" : 
                            bill.confidence_score >= 80 ? "text-amber-500" : "text-red-500"
                          )}>
                            {bill.confidence_score}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {getRiskBadge(bill)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={cn("text-[10px]", recInfo.color)}
                          >
                            {recInfo.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* Summary Stats */}
          <div className="border-t border-border p-4 bg-muted/30">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{stats.selectedCount}</div>
                <div className="text-xs text-muted-foreground">Selected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{formatCurrency(stats.totalValue)}</div>
                <div className="text-xs text-muted-foreground">Total Value</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{stats.avgConfidence}%</div>
                <div className="text-xs text-muted-foreground">Avg Confidence</div>
              </div>
              <div className="text-center">
                <div className={cn(
                  "text-2xl font-bold",
                  stats.highRiskCount > 0 ? "text-red-500" : "text-green-500"
                )}>
                  {stats.highRiskCount}
                </div>
                <div className="text-xs text-muted-foreground">High Risk</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">
                  ~{Math.ceil(stats.selectedCount * 0.3)}s
                </div>
                <div className="text-xs text-muted-foreground">Est. Time</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={onClose} disabled={isApproving}>
                Cancel
              </Button>
              <Button 
                onClick={handleApprove}
                disabled={selectedBillIds.size === 0 || isApproving}
                className="gap-2"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Approve {stats.selectedCount} Bills
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BatchApprovalModal;
