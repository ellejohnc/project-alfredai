import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { WeeklySummary, PaymentScheduleItem } from "./PaymentScheduleTypes";
import { formatCurrency } from "./purchaseBillData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar, TrendingDown, TrendingUp, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

interface WeeklyPaymentTimelineProps {
  items: PaymentScheduleItem[];
  weeklySummaries: WeeklySummary[];
  availableFunds: number;
}

export function WeeklyPaymentTimeline({
  items,
  weeklySummaries,
  availableFunds,
}: WeeklyPaymentTimelineProps) {
  const chartData = useMemo(() => {
    // Recalculate weekly totals from items to ensure accuracy
    const recalculatedWeeks = weeklySummaries.map(summary => {
      const weekItems = items.filter(i => i.payment_week === summary.week);
      const recalculatedTotal = weekItems.reduce((s, i) => s + (i.amount || 0), 0);
      
      return {
        ...summary,
        total_payments: Math.round(recalculatedTotal * 100) / 100, // Use recalculated value
        invoice_count: weekItems.length,
      };
    });
    
    const maxPayment = Math.max(...recalculatedWeeks.map(s => s.total_payments), 1);
    
    return recalculatedWeeks.map(summary => {
      const weekItems = items.filter(i => i.payment_week === summary.week);
      const barHeight = (summary.total_payments / maxPayment) * 100;
      
      // Group by priority for stacked bar
      const byPriority = {
        critical: weekItems.filter(i => i.priority === 'critical').reduce((s, i) => s + (i.amount || 0), 0),
        high: weekItems.filter(i => i.priority === 'high').reduce((s, i) => s + (i.amount || 0), 0),
        medium: weekItems.filter(i => i.priority === 'medium').reduce((s, i) => s + (i.amount || 0), 0),
        low: weekItems.filter(i => i.priority === 'low').reduce((s, i) => s + (i.amount || 0), 0),
      };
      
      const total = summary.total_payments;
      
      return {
        ...summary,
        weekItems,
        barHeight,
        byPriority,
        priorityHeights: {
          critical: total > 0 ? (byPriority.critical / total) * barHeight : 0,
          high: total > 0 ? (byPriority.high / total) * barHeight : 0,
          medium: total > 0 ? (byPriority.medium / total) * barHeight : 0,
          low: total > 0 ? (byPriority.low / total) * barHeight : 0,
        },
      };
    });
  }, [items, weeklySummaries]);

  const cashFlowLine = useMemo(() => {
    // Calculate points for cash balance line
    const minCash = Math.min(...weeklySummaries.map(s => s.cash_remaining));
    const maxCash = availableFunds;
    const range = maxCash - minCash;
    
    return weeklySummaries.map((summary, index) => {
      const y = range > 0 
        ? 100 - ((summary.cash_remaining - minCash) / range) * 100
        : 50;
      const x = (index / (weeklySummaries.length - 1 || 1)) * 100;
      return { x, y, cash: summary.cash_remaining };
    });
  }, [weeklySummaries, availableFunds]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-AU', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  if (weeklySummaries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No weekly summary data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline Chart */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium">4-Week Payment Timeline</h4>
            <div className="flex items-center gap-3 text-[10px]">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-muted-foreground">Critical</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">High</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-muted-foreground">Low</span>
              </div>
            </div>
          </div>

          <div className="relative">
            {/* Chart Area */}
            <div className="flex items-end justify-around h-40 gap-2 px-4 relative">
              {/* Cash flow line overlay */}
              <svg 
                className="absolute inset-0 pointer-events-none z-10" 
                viewBox="0 0 100 100" 
                preserveAspectRatio="none"
              >
                <polyline
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="0.5"
                  strokeDasharray="2,2"
                  points={cashFlowLine.map(p => `${p.x},${p.y}`).join(' ')}
                />
                {cashFlowLine.map((point, i) => (
                  <circle
                    key={i}
                    cx={point.x}
                    cy={point.y}
                    r="1.5"
                    fill="hsl(var(--primary))"
                  />
                ))}
              </svg>

              {/* Stacked Bars */}
              <TooltipProvider>
                {chartData.map((week, index) => (
                  <Tooltip key={week.week}>
                    <TooltipTrigger asChild>
                      <div className="flex-1 flex flex-col items-center">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${week.barHeight}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="w-full max-w-16 flex flex-col-reverse rounded-t-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                        >
                          {/* Low priority */}
                          {week.priorityHeights.low > 0 && (
                            <div 
                              className="bg-slate-400 w-full"
                              style={{ height: `${(week.priorityHeights.low / week.barHeight) * 100}%` }}
                            />
                          )}
                          {/* Medium priority */}
                          {week.priorityHeights.medium > 0 && (
                            <div 
                              className="bg-blue-500 w-full"
                              style={{ height: `${(week.priorityHeights.medium / week.barHeight) * 100}%` }}
                            />
                          )}
                          {/* High priority */}
                          {week.priorityHeights.high > 0 && (
                            <div 
                              className="bg-amber-500 w-full"
                              style={{ height: `${(week.priorityHeights.high / week.barHeight) * 100}%` }}
                            />
                          )}
                          {/* Critical priority */}
                          {week.priorityHeights.critical > 0 && (
                            <div 
                              className="bg-red-500 w-full"
                              style={{ height: `${(week.priorityHeights.critical / week.barHeight) * 100}%` }}
                            />
                          )}
                        </motion.div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="w-52 p-3">
                      <div className="space-y-2">
                        <div className="font-semibold">Week {week.week}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(week.start_date)} - {formatDate(week.end_date)}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Payments:</span>
                            <span className="font-medium ml-1">{formatCurrency(week.total_payments)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Invoices:</span>
                            <span className="font-medium ml-1">{week.invoice_count}</span>
                          </div>
                        </div>
                        <div className="pt-1 border-t border-border">
                          <span className="text-muted-foreground text-xs">Cash remaining:</span>
                          <span className={cn(
                            "font-semibold text-xs ml-1",
                            week.cash_remaining < 50000 ? "text-red-600" :
                            week.cash_remaining < 100000 ? "text-amber-600" : "text-green-600"
                          )}>
                            {formatCurrency(week.cash_remaining)}
                          </span>
                        </div>
                        {week.byPriority.critical > 0 && (
                          <div className="text-xs">
                            <span className="text-red-600">Critical:</span>
                            <span className="ml-1">{formatCurrency(week.byPriority.critical)}</span>
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>

            {/* X-axis labels */}
            <div className="flex justify-around px-4 mt-2 border-t border-border pt-2">
              {chartData.map(week => (
                <div key={week.week} className="flex-1 text-center">
                  <div className="text-xs font-medium">Week {week.week}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {formatDate(week.start_date)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {chartData.map((week, index) => {
          const prevCash = index === 0 ? availableFunds : chartData[index - 1].cash_remaining;
          const cashChange = week.cash_remaining - prevCash;
          
          return (
            <Card key={week.week} className={cn(
              "border-border transition-all hover:border-primary/30",
              week.week === 1 && "ring-1 ring-primary/20"
            )}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="text-[10px]">
                    Week {week.week}
                  </Badge>
                  {week.week === 1 && (
                    <Badge className="text-[9px] bg-primary/10 text-primary">
                      Next
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Pay out</span>
                    <span className="text-sm font-semibold">
                      {formatCurrency(week.total_payments)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Invoices</span>
                    <span className="text-xs">{week.invoice_count}</span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-1 border-t border-border">
                    <span className="text-[10px] text-muted-foreground">Balance</span>
                    <div className="flex items-center gap-1">
                      {cashChange < 0 ? (
                        <TrendingDown className="w-3 h-3 text-red-500" />
                      ) : (
                        <TrendingUp className="w-3 h-3 text-green-500" />
                      )}
                      <span className={cn(
                        "text-xs font-medium",
                        week.cash_remaining < 50000 ? "text-red-600" :
                        week.cash_remaining < 100000 ? "text-amber-600" : "text-green-600"
                      )}>
                        {formatCurrency(week.cash_remaining)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cash Flow Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Cash Flow Summary</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Starting:</span>
                <span className="font-medium ml-1">{formatCurrency(availableFunds)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Ending:</span>
                <span className={cn(
                  "font-bold ml-1",
                  chartData[chartData.length - 1]?.cash_remaining < 50000 ? "text-red-600" :
                  chartData[chartData.length - 1]?.cash_remaining < 100000 ? "text-amber-600" : "text-green-600"
                )}>
                  {formatCurrency(chartData[chartData.length - 1]?.cash_remaining || 0)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default WeeklyPaymentTimeline;
