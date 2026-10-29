import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { 
  PaymentScheduleItem, 
  WeeklySummary, 
  getPriorityColor, 
  getPriorityLabel 
} from "./PaymentScheduleTypes";
import { formatCurrency } from "./purchaseBillData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  PiggyBank,
  Calendar,
  ArrowUpDown,
} from "lucide-react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";

interface PaymentScheduleTableProps {
  items: PaymentScheduleItem[];
  weeklySummaries: WeeklySummary[];
  totalSavings: number;
  cashRemaining: number;
}

type SortField = 'supplier_name' | 'amount' | 'due_date' | 'payment_week' | 'priority';
type SortDirection = 'asc' | 'desc';

const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

export function PaymentScheduleTable({ 
  items, 
  weeklySummaries, 
  totalSavings,
  cashRemaining 
}: PaymentScheduleTableProps) {
  const [sortField, setSortField] = useState<SortField>('payment_week');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([1, 2, 3, 4]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'supplier_name':
          comparison = a.supplier_name.localeCompare(b.supplier_name);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'due_date':
          comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
        case 'payment_week':
          comparison = a.payment_week - b.payment_week;
          break;
        case 'priority':
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [items, sortField, sortDirection]);

  // Group items by week
  const itemsByWeek = useMemo(() => {
    const grouped: Record<number, PaymentScheduleItem[]> = { 1: [], 2: [], 3: [], 4: [] };
    sortedItems.forEach(item => {
      if (grouped[item.payment_week]) {
        grouped[item.payment_week].push(item);
      }
    });
    return grouped;
  }, [sortedItems]);

  // Recalculate totals to ensure math consistency
  const calculatedTotals = useMemo(() => {
    const totalScheduled = items.reduce((sum, i) => sum + (i.amount || 0), 0);
    const calculatedSavings = items
      .filter(i => i.discount_captured)
      .reduce((sum, i) => sum + (i.savings || 0), 0);
    
    return {
      totalScheduled: Math.round(totalScheduled * 100) / 100,
      savings: Math.round(calculatedSavings * 100) / 100,
    };
  }, [items]);

  const toggleWeek = (week: number) => {
    setExpandedWeeks(prev => 
      prev.includes(week) 
        ? prev.filter(w => w !== week)
        : [...prev, week]
    );
  };

  const toggleItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 -ml-2 font-medium text-muted-foreground hover:text-foreground"
      onClick={() => handleSort(field)}
    >
      {children}
      {sortField === field ? (
        sortDirection === 'asc' ? 
          <ChevronUp className="w-3 h-3 ml-1" /> : 
          <ChevronDown className="w-3 h-3 ml-1" />
      ) : (
        <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />
      )}
    </Button>
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-AU', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No payment schedule items available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Week Groups */}
      {[1, 2, 3, 4].map(week => {
        const weekItems = itemsByWeek[week] || [];
        const weekSummary = weeklySummaries.find(s => s.week === week);
        const isExpanded = expandedWeeks.includes(week);
        const weekTotal = weekItems.reduce((sum, item) => sum + item.amount, 0);
        const weekSavings = weekItems.reduce((sum, item) => sum + item.savings, 0);

        if (weekItems.length === 0) return null;

        return (
          <div key={week} className="border border-border rounded-lg overflow-hidden">
            {/* Week Header */}
            <button
              onClick={() => toggleWeek(week)}
              className="w-full px-3 py-2 bg-muted/50 hover:bg-muted/70 transition-colors flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="font-medium text-sm">Week {week}</span>
                {weekSummary && (
                  <span className="text-xs text-muted-foreground">
                    {formatDate(weekSummary.start_date)} - {formatDate(weekSummary.end_date)}
                  </span>
                )}
                <Badge variant="secondary" className="text-[10px]">
                  {weekItems.length} invoice{weekItems.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                {weekSavings > 0 && (
                  <Badge variant="outline" className="text-[10px] text-green-700 border-green-500/30 bg-green-50 dark:text-green-400 dark:bg-green-950/30">
                    <PiggyBank className="w-3 h-3 mr-1" />
                    {formatCurrency(weekSavings)} saved
                  </Badge>
                )}
                <span className="font-semibold text-sm">
                  {formatCurrency(weekTotal)}
                </span>
              </div>
            </button>

            {/* Week Items */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-8"></TableHead>
                        <TableHead className="w-20">
                          <SortHeader field="priority">Priority</SortHeader>
                        </TableHead>
                        <TableHead>
                          <SortHeader field="supplier_name">Supplier</SortHeader>
                        </TableHead>
                        <TableHead className="w-28">Invoice</TableHead>
                        <TableHead className="w-24 text-right">
                          <SortHeader field="amount">Amount</SortHeader>
                        </TableHead>
                        <TableHead className="w-24">
                          <SortHeader field="due_date">Due Date</SortHeader>
                        </TableHead>
                        <TableHead className="w-24">Pay Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weekItems.map((item) => (
                        <TableRow 
                          key={item.invoice_id}
                          className={cn(
                            "group cursor-pointer",
                            selectedItems.includes(item.invoice_id) && "bg-primary/5"
                          )}
                          onClick={() => toggleItem(item.invoice_id)}
                        >
                          <TableCell className="p-2">
                            <Checkbox
                              checked={selectedItems.includes(item.invoice_id)}
                              onCheckedChange={() => toggleItem(item.invoice_id)}
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Badge 
                              variant="outline" 
                              className={cn("text-[10px]", getPriorityColor(item.priority))}
                            >
                              {getPriorityLabel(item.priority)}
                            </Badge>
                          </TableCell>
                          <TableCell className="p-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate max-w-[180px]">
                                {item.supplier_name}
                              </span>
                              {item.discount_captured && (
                                <Badge variant="outline" className="text-[9px] text-green-700 border-green-500/30 bg-green-50 dark:text-green-400 dark:bg-green-950/30">
                                  <PiggyBank className="w-2.5 h-2.5 mr-0.5" />
                                  {formatCurrency(item.savings)}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="p-2">
                            <span className="text-xs text-muted-foreground font-mono">
                              {item.invoice_number}
                            </span>
                          </TableCell>
                          <TableCell className="p-2 text-right">
                            <span className="font-semibold text-sm">
                              {formatCurrency(item.amount)}
                            </span>
                          </TableCell>
                          <TableCell className="p-2">
                            <span className="text-xs">{formatDate(item.due_date)}</span>
                          </TableCell>
                          <TableCell className="p-2">
                            <span className="text-xs text-primary font-medium">
                              {formatDate(item.payment_date)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Week Footer with Cash Remaining */}
                      {weekSummary && (
                        <div className="px-3 py-2 bg-muted/30 border-t border-border flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            Cash remaining after Week {week}:
                          </span>
                          <span className={cn(
                            "font-semibold",
                            weekSummary.cash_remaining < 50000 ? "text-red-700 dark:text-red-400" :
                            weekSummary.cash_remaining < 100000 ? "text-amber-700 dark:text-amber-400" : "text-green-700 dark:text-green-400"
                          )}>
                            {formatCurrency(weekSummary.cash_remaining)}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Summary Footer */}
      <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total Scheduled:</span>
            <span className="font-semibold ml-2">
              {formatCurrency(calculatedTotals.totalScheduled)}
            </span>
          </div>
          {calculatedTotals.savings > 0 && (
            <div className="flex items-center gap-1 text-green-700 dark:text-green-400">
              <PiggyBank className="w-4 h-4" />
              <span className="font-semibold">{formatCurrency(calculatedTotals.savings)} saved</span>
            </div>
          )}
        </div>
        <div>
          <span className="text-muted-foreground text-sm">Final Balance:</span>
          <span className={cn(
            "font-bold text-lg ml-2",
            cashRemaining < 50000 ? "text-red-700 dark:text-red-400" :
            cashRemaining < 100000 ? "text-amber-700 dark:text-amber-400" : "text-green-700 dark:text-green-400"
          )}>
            {formatCurrency(cashRemaining)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default PaymentScheduleTable;
