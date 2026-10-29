import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { cn } from "@/lib/utils";
import { PurchaseBill, formatCurrency } from "./purchaseBillData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  X, TrendingDown, DollarSign,
  AlertCircle, CheckCircle2, Clock, Wallet,
  PiggyBank, Sparkles, Bot, RefreshCw,
  Zap, Shield, Users, Mail, ExternalLink, Snowflake
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  AIScheduleResponse, 
  PaymentAlert,
  WeeklySummary,
  getAlertTypeColor 
} from "./PaymentScheduleTypes";
import PaymentScheduleTable from "./PaymentScheduleTable";
import WeeklyPaymentTimeline from "./WeeklyPaymentTimeline";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

// Validate and fix any math errors in the AI-generated schedule
function validateAndFixScheduleMath(schedule: AIScheduleResponse, availableFunds: number): AIScheduleResponse {
  const correctedWeeklySummaries: WeeklySummary[] = [];
  let runningCash = availableFunds;
  
  for (let week = 1; week <= 4; week++) {
    const weekItems = schedule.items.filter(item => item.payment_week === week);
    const weekTotal = weekItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const invoiceCount = weekItems.length;
    
    // Subtract this week's payments from running cash
    runningCash = runningCash - weekTotal;
    
    // Find existing summary or create placeholder dates
    const existingSummary = schedule.weekly_summaries.find(s => s.week === week);
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + (1 - today.getDay()) + (week - 1) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    correctedWeeklySummaries.push({
      week,
      start_date: existingSummary?.start_date || weekStart.toISOString().split('T')[0],
      end_date: existingSummary?.end_date || weekEnd.toISOString().split('T')[0],
      total_payments: Math.round(weekTotal * 100) / 100, // Round to 2 decimal places
      invoice_count: invoiceCount,
      cash_remaining: Math.round(runningCash * 100) / 100, // Round to 2 decimal places
    });
  }
  
  // Recalculate total_savings from items
  const totalSavings = schedule.items
    .filter(item => item.discount_captured)
    .reduce((sum, item) => sum + (item.savings || 0), 0);
  
  return {
    ...schedule,
    weekly_summaries: correctedWeeklySummaries,
    total_savings: Math.round(totalSavings * 100) / 100,
  };
}

interface PaymentForecastPanelProps {
  isOpen: boolean;
  onClose: () => void;
  bills: PurchaseBill[];
  availableFunds: number;
}

type OptimizeFor = 'cash_flow' | 'discounts' | 'relationships';

export function PaymentForecastPanel({ isOpen, onClose, bills, availableFunds }: PaymentForecastPanelProps) {
  // Lock background scroll when panel is open
  useBodyScrollLock(isOpen);

  const [optimizeFor, setOptimizeFor] = useState<OptimizeFor>('discounts');
  const [isLoading, setIsLoading] = useState(false);
  const [aiSchedule, setAiSchedule] = useState<AIScheduleResponse | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [activeTab, setActiveTab] = useState('schedule');
  const [parseError, setParseError] = useState<string | null>(null);

  // Calculate quick stats - exclude frozen bills
  const stats = useMemo(() => {
    const payableBills = bills.filter(b => 
      !b.is_frozen && (b.status === 'approved' || b.status === 'needs_review' || b.status === 'matched')
    );
    const frozenBills = bills.filter(b => b.is_frozen);
    const today = new Date();
    
    const totalPayable = payableBills.reduce((sum, b) => sum + b.total_amount, 0);
    const frozenAmount = frozenBills.reduce((sum, b) => sum + b.total_amount, 0);
    const overdueCount = payableBills.filter(b => new Date(b.due_date) < today).length;
    const overdueAmount = payableBills
      .filter(b => new Date(b.due_date) < today)
      .reduce((sum, b) => sum + b.total_amount, 0);
    
    // Simulate early pay discounts (20% of bills have 2% discount)
    const discountEligible = Math.floor(payableBills.length * 0.2);
    const potentialSavings = totalPayable * 0.02 * (discountEligible / Math.max(payableBills.length, 1));

    return {
      totalPayable,
      frozenAmount,
      frozenCount: frozenBills.length,
      billCount: payableBills.length,
      overdueCount,
      overdueAmount,
      potentialSavings,
      runwayWeeks: Math.floor(availableFunds / (totalPayable / 8 || 1)),
      utilization: (totalPayable / availableFunds) * 100,
      afterPayments: availableFunds - totalPayable,
    };
  }, [bills, availableFunds]);

  // Prepare bills summary for AI - exclude frozen bills
  const prepareBillsForAI = () => {
    const today = new Date();
    return bills
      .filter(b => !b.is_frozen && (b.status === 'approved' || b.status === 'needs_review' || b.status === 'matched'))
      .map(b => {
        const dueDate = new Date(b.due_date);
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: b.id,
          supplier_name: b.supplier_name,
          invoice_number: b.invoice_number,
          total_amount: b.total_amount,
          due_date: b.due_date.toISOString(),
          status: b.status,
          has_early_pay_discount: Math.random() > 0.8, // Simulate 20% have discounts
          discount_percentage: 2,
          risk_level: b.risk_flags.some(f => f.severity === 'high') ? 'high' : 'low',
          days_until_due: daysUntilDue,
        };
      });
  };

  const generateAISchedule = async () => {
    setIsLoading(true);
    setAiSchedule(null);
    setParseError(null);

    try {
      const billsSummary = prepareBillsForAI();
      
      const { data, error } = await supabase.functions.invoke('ai-payment-schedule', {
        body: {
          bills: billsSummary,
          available_funds: availableFunds,
          optimize_for: optimizeFor,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate schedule');
      }

      if (data?.error) {
        if (data.error.includes('Rate limit')) {
          toast.error('AI is busy. Please try again in a moment.');
        } else if (data.error.includes('credits')) {
          toast.error('AI credits exhausted. Contact support.');
        } else if (data.error.includes('unexpected format')) {
          setParseError(data.error);
          toast.error('AI returned an unexpected format. Please try again.');
        } else {
          toast.error(data.error);
        }
        return;
      }

      if (data?.schedule && typeof data.schedule === 'object') {
        const schedule = data.schedule as AIScheduleResponse;
        
        // Frontend validation: recalculate weekly summaries if needed
        const validatedSchedule = validateAndFixScheduleMath(schedule, availableFunds);
        
        setAiSchedule(validatedSchedule);
        setHasGenerated(true);
        setActiveTab('schedule');
        toast.success('AI Payment Schedule generated!');
      } else {
        throw new Error('Invalid schedule format received');
      }
    } catch (error) {
      console.error('Failed to generate AI schedule:', error);
      toast.error('Failed to generate schedule. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getOptimizeIcon = (type: OptimizeFor) => {
    switch (type) {
      case 'cash_flow': return <Wallet className="w-4 h-4" />;
      case 'discounts': return <PiggyBank className="w-4 h-4" />;
      case 'relationships': return <Users className="w-4 h-4" />;
    }
  };

  const getOptimizeLabel = (type: OptimizeFor) => {
    switch (type) {
      case 'cash_flow': return 'Preserve Cash';
      case 'discounts': return 'Maximize Savings';
      case 'relationships': return 'Supplier Priority';
    }
  };

  const getAlertIcon = (type: PaymentAlert['type']) => {
    switch (type) {
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      case 'risk': return <Shield className="w-4 h-4" />;
      case 'discount_expiring': return <Clock className="w-4 h-4" />;
    }
  };

  const handleReportError = () => {
    const subject = encodeURIComponent('AI Payment Schedule Error Report');
    const body = encodeURIComponent(
      `Error Details:\n\nPage URL: ${window.location.href}\n\nError: ${parseError || 'Unknown error'}\n\nPlease describe what you were trying to do:\n\n`
    );
    window.open(`mailto:support@alfred.ai?subject=${subject}&body=${body}`, '_blank');
  };

  const cashRemaining = aiSchedule?.weekly_summaries?.[aiSchedule.weekly_summaries.length - 1]?.cash_remaining || 
    (availableFunds - (aiSchedule?.items?.reduce((s, i) => s + i.amount, 0) || 0));

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
          className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Compact Header */}
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">AI Payment Schedule</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 overflow-auto">
            <div className="p-3 space-y-3">
              {/* Frozen Bills Notice - Compact */}
              {stats.frozenCount > 0 && (
                <div className="flex items-center gap-2 px-2 py-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-500/40 text-xs">
                  <Snowflake className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span className="text-blue-800 dark:text-blue-300">
                    {stats.frozenCount} frozen ({formatCurrency(stats.frozenAmount)}) excluded
                  </span>
                </div>
              )}

              {/* Inline Stats Row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs border border-border rounded-md px-3 py-2 bg-muted/30">
                <div className="flex items-center gap-1.5">
                  <Wallet className="w-3 h-3 text-blue-500" />
                  <span className="text-muted-foreground">Funds:</span>
                  <span className="font-medium">{formatCurrency(availableFunds)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3 h-3 text-amber-500" />
                  <span className="text-muted-foreground">Payable:</span>
                  <span className="font-medium">{formatCurrency(stats.totalPayable)}</span>
                  <span className="text-muted-foreground">({stats.billCount})</span>
                </div>
                {stats.overdueAmount > 0 && (
                  <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-3 h-3" />
                    <span>Overdue: {formatCurrency(stats.overdueAmount)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                  <PiggyBank className="w-3 h-3" />
                  <span>{aiSchedule ? 'Saved' : 'Potential'}:</span>
                  <span className="font-medium">{formatCurrency(aiSchedule?.total_savings || stats.potentialSavings)}</span>
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-muted-foreground">Use:</span>
                  <span className={cn(
                    "font-medium",
                    stats.utilization > 80 ? "text-red-600" : stats.utilization > 50 ? "text-amber-600" : "text-green-600"
                  )}>{stats.utilization.toFixed(0)}%</span>
                </div>
              </div>

              {/* Compact Strategy + Generate Row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Optimize for:</span>
                <div className="flex gap-1">
                  {(['cash_flow', 'discounts', 'relationships'] as OptimizeFor[]).map((type) => (
                    <Button
                      key={type}
                      variant={optimizeFor === type ? "default" : "outline"}
                      size="sm"
                      className="h-7 gap-1 text-xs px-2"
                      onClick={() => {
                        setOptimizeFor(type);
                        setHasGenerated(false);
                        setAiSchedule(null);
                      }}
                    >
                      {getOptimizeIcon(type)}
                      <span className="hidden sm:inline">{getOptimizeLabel(type)}</span>
                    </Button>
                  ))}
                </div>
                <Button 
                  className="h-8 gap-1.5 ml-auto"
                  onClick={generateAISchedule}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span className="text-xs">Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Bot className="w-3.5 h-3.5" />
                      <span className="text-xs">{hasGenerated ? 'Regenerate' : 'Generate Schedule'}</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Parse Error State */}
              {parseError && (
                <Card className="border-red-500/30 bg-red-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-red-600">Schedule Generation Failed</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          The AI returned an unexpected format. This can happen occasionally.
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" onClick={generateAISchedule}>
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Try Again
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleReportError}>
                            <Mail className="w-3 h-3 mr-1" />
                            Report Issue
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* AI Generated Schedule - Tabbed Interface */}
              {aiSchedule && (
                <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      AI-Generated Payment Schedule
                      <Badge variant="secondary" className="text-[9px] ml-auto">
                        {optimizeFor === 'cash_flow' ? 'Cash Optimized' : 
                         optimizeFor === 'discounts' ? 'Savings Optimized' : 
                         'Relationship Optimized'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid w-full grid-cols-4 mb-4">
                        <TabsTrigger value="schedule" className="text-xs">
                          Schedule
                        </TabsTrigger>
                        <TabsTrigger value="timeline" className="text-xs">
                          Timeline
                        </TabsTrigger>
                        <TabsTrigger value="alerts" className="text-xs">
                          Alerts
                          {aiSchedule.alerts?.length > 0 && (
                            <Badge variant="destructive" className="ml-1 text-[9px] px-1">
                              {aiSchedule.alerts.length}
                            </Badge>
                          )}
                        </TabsTrigger>
                        <TabsTrigger value="summary" className="text-xs">
                          Summary
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="schedule" className="mt-0">
                        <PaymentScheduleTable
                          items={aiSchedule.items || []}
                          weeklySummaries={aiSchedule.weekly_summaries || []}
                          totalSavings={aiSchedule.total_savings || 0}
                          cashRemaining={cashRemaining}
                        />
                      </TabsContent>

                      <TabsContent value="timeline" className="mt-0">
                        <WeeklyPaymentTimeline
                          items={aiSchedule.items || []}
                          weeklySummaries={aiSchedule.weekly_summaries || []}
                          availableFunds={availableFunds}
                        />
                      </TabsContent>

                      <TabsContent value="alerts" className="mt-0">
                        <div className="space-y-2">
                          {aiSchedule.alerts?.length > 0 ? (
                            aiSchedule.alerts.map((alert, idx) => (
                              <Card key={idx} className={cn("border", getAlertTypeColor(alert.type))}>
                                <CardContent className="p-3 flex items-start gap-3">
                                  {getAlertIcon(alert.type)}
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{alert.message}</p>
                                    {alert.invoice_ids?.length > 0 && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Affected: {alert.invoice_ids.length} invoice{alert.invoice_ids.length !== 1 ? 's' : ''}
                                      </p>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
                              <p className="text-sm">No critical alerts</p>
                              <p className="text-xs">Your payment schedule looks healthy</p>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="summary" className="mt-0">
                        <div className="space-y-4">
                          {/* Key Metrics */}
                          <div className="grid grid-cols-3 gap-3">
                            <Card className="border-border">
                              <CardContent className="p-3 text-center">
                                <div className="text-2xl font-bold text-foreground">
                                  {aiSchedule.items?.length || 0}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Invoices Scheduled
                                </div>
                              </CardContent>
                            </Card>
                            <Card className="border-green-500/30">
                              <CardContent className="p-3 text-center">
                                <div className="text-2xl font-bold text-green-600">
                                  {formatCurrency(aiSchedule.total_savings || 0)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Total Savings
                                </div>
                              </CardContent>
                            </Card>
                            <Card className="border-border">
                              <CardContent className="p-3 text-center">
                                <div className={cn(
                                  "text-2xl font-bold",
                                  cashRemaining < 50000 ? "text-red-600" :
                                  cashRemaining < 100000 ? "text-amber-600" : "text-green-600"
                                )}>
                                  {formatCurrency(cashRemaining)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Final Balance
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Recommendations */}
                          {aiSchedule.recommendations?.length > 0 && (
                            <Card className="border-border">
                              <CardHeader className="py-2 px-3">
                                <CardTitle className="text-sm">Strategic Recommendations</CardTitle>
                              </CardHeader>
                              <CardContent className="p-3">
                                <ul className="space-y-2">
                                  {aiSchedule.recommendations.map((rec, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm">
                                      <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                      <span>{rec}</span>
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}

              {/* Empty State */}
              {!aiSchedule && !isLoading && !parseError && (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Select a strategy and click generate to create your AI payment schedule</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              Powered by alfred ai
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Close</Button>
              {aiSchedule && (
                <Button>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Apply Schedule
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default PaymentForecastPanel;
