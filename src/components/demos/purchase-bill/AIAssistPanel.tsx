import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  PurchaseBill, 
  formatCurrency,
  getRecommendationDisplay 
} from "./purchaseBillData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Bot, AlertTriangle, CheckCircle2, XCircle, 
  ArrowRight, Send, MessageSquare, Check, Link2,
  Shield, FileWarning, Zap, Sparkles, ExternalLink, Building2,
  Snowflake, Play
} from "lucide-react";
import { StatusActionCard } from "./StatusActionCard";
import { HistoricalContextCard } from "./HistoricalContextCard";
import { CostCodeSuggestionCard } from "./CostCodeSuggestionCard";
import { MobileTooltip } from "@/components/ui/mobile-tooltip";

interface AIAssistPanelProps {
  bill: PurchaseBill | null;
  onApprove: (bill: PurchaseBill) => void;
  onDelegate: (bill: PurchaseBill) => void;
  onQuery: (bill: PurchaseBill) => void;
  onSyncToXero: (bill: PurchaseBill) => void;
  onStatusAction?: (bill: PurchaseBill, action: string) => void;
  onOpenIntegration?: (bill: PurchaseBill) => void;
  onOpenSupplier360?: (bill: PurchaseBill) => void;
  onFreeze?: (bill: PurchaseBill, reason?: string) => void;
  onUnfreeze?: (bill: PurchaseBill) => void;
  isProcessing: boolean;
}

export function AIAssistPanel({ 
  bill, 
  onApprove, 
  onDelegate, 
  onQuery,
  onSyncToXero,
  onStatusAction,
  onOpenIntegration,
  onOpenSupplier360,
  onFreeze,
  onUnfreeze,
  isProcessing 
}: AIAssistPanelProps) {
  const [showDraftEmail, setShowDraftEmail] = useState(false);

  if (!bill) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-card rounded-lg border border-border text-center p-8">
        <Bot className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h3 className="font-semibold text-foreground mb-1">AI Analysis</h3>
        <p className="text-sm text-muted-foreground">
          Select a bill to see AI recommendations
        </p>
      </div>
    );
  }

  const recInfo = getRecommendationDisplay(bill.ai_recommendation);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high": return <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 shrink-0" />;
      case "medium": return <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 shrink-0" />;
      case "low": return <FileWarning className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 shrink-0" />;
      default: return null;
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case "high": return "bg-red-500/10 border-red-500/30";
      case "medium": return "bg-amber-500/10 border-amber-500/30";
      case "low": return "bg-blue-500/10 border-blue-500/30";
      default: return "bg-muted";
    }
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border border-border overflow-hidden min-w-0">
      {/* Header */}
      <div className="p-2 sm:p-3 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center gap-2">
          <div className="p-1 sm:p-1.5 bg-primary/20 rounded-lg shrink-0">
            <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-xs sm:text-sm truncate">AI Analysis</h3>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground truncate">alfred ai • Bill Review Agent</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
          {/* Frozen State Banner */}
          {bill.is_frozen && (
            <Card className="border-blue-500/40 bg-blue-50 dark:bg-blue-950/30">
              <CardContent className="p-2 sm:p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Snowflake className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-300 truncate">Payment Frozen</p>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground truncate">
                        {bill.frozen_reason || 'Payment on hold until further notice'}
                      </p>
                    </div>
                  </div>
                  {onUnfreeze && (
                    <MobileTooltip label="Resume Payment">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 sm:h-7 text-[10px] sm:text-xs gap-1 border-blue-500/50 text-blue-800 hover:text-blue-900 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/50 shrink-0 px-2"
                        onClick={() => onUnfreeze(bill)}
                      >
                        <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span className="hidden xs:inline">Unfreeze</span>
                      </Button>
                    </MobileTooltip>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Action Card - AI Suggested Next Step */}
          {!bill.is_frozen && (
            <StatusActionCard 
              bill={bill} 
              onAction={(action) => onStatusAction?.(bill, action)} 
              isProcessing={isProcessing} 
            />
          )}

          {/* Freeze/Unfreeze Action */}
          {!bill.is_frozen && onFreeze && bill.status !== 'received' && bill.status !== 'synced' && bill.status !== 'paid' && (
            <MobileTooltip label="Freeze Payment">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 sm:h-9 text-[10px] sm:text-xs gap-1 sm:gap-1.5 border-dashed border-blue-500/50 text-blue-700 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
                onClick={() => onFreeze(bill)}
              >
                <Snowflake className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                Freeze Payment
              </Button>
            </MobileTooltip>
          )}

          {/* Historical Context - Supplier History */}
          {bill.status !== 'received' && (
            <HistoricalContextCard 
              bill={bill} 
              onViewSupplier360={onOpenSupplier360 ? () => onOpenSupplier360(bill) : undefined}
            />
          )}

          {/* Integration Sync Button */}
          {(bill.status === 'extracted' || bill.status === 'matched') && onOpenIntegration && !bill.is_frozen && (
            <MobileTooltip label="Sync from Procore/Buildertrend">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 sm:h-9 text-[10px] sm:text-xs gap-1 sm:gap-1.5 border-dashed"
                onClick={() => onOpenIntegration(bill)}
              >
                <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                Pull from Construction PM
              </Button>
            </MobileTooltip>
          )}

          {/* AI Cost Code Suggestions */}
          {bill.status !== 'received' && bill.line_items.length > 0 && (
            <CostCodeSuggestionCard bill={bill} />
          )}

          {/* Risk Flags */}
          {bill.risk_flags.length > 0 && (
            <Card className="border-border overflow-hidden">
              <CardHeader className="py-1.5 sm:py-2 px-2 sm:px-3 bg-muted/30">
                <CardTitle className="text-[10px] sm:text-xs flex items-center gap-1.5 sm:gap-2">
                  <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">Discrepancies ({bill.risk_flags.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
                {bill.risk_flags.map((flag, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "p-2 rounded-lg border",
                      getSeverityBg(flag.severity)
                    )}
                  >
                    <div className="flex items-start gap-1.5 sm:gap-2">
                      {getSeverityIcon(flag.severity)}
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="font-medium text-[10px] sm:text-xs text-foreground capitalize truncate max-w-[100px] sm:max-w-none">
                            {flag.type.replace(/_/g, " ")}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[8px] sm:text-[9px] py-0 h-3.5 sm:h-4 uppercase shrink-0",
                              flag.severity === "high" && "border-red-500/50 text-red-700 dark:text-red-400",
                              flag.severity === "medium" && "border-amber-500/50 text-amber-700 dark:text-amber-400",
                              flag.severity === "low" && "border-blue-500/50 text-blue-700 dark:text-blue-400"
                            )}
                          >
                            {flag.severity}
                          </Badge>
                        </div>
                        <p className="text-[9px] sm:text-[11px] text-muted-foreground mt-1 line-clamp-2">
                          {flag.evidence}
                        </p>
                        <p className="text-[9px] sm:text-[11px] text-foreground mt-1 sm:mt-1.5 flex items-center gap-1">
                          <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                          <span className="truncate">{flag.suggested_action}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Match Results */}
          <Card className="border-border overflow-hidden">
            <CardHeader className="py-1.5 sm:py-2 px-2 sm:px-3 bg-muted/30">
              <CardTitle className="text-[10px] sm:text-xs flex items-center gap-1.5 sm:gap-2">
                <Link2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary shrink-0" />
                Matching Results
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-3 space-y-1 sm:space-y-2">
              {bill.match_results.map((match, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 sm:py-1.5 border-b border-border/50 last:border-0 gap-2 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden">
                    {match.matched ? (
                      <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 shrink-0" />
                    )}
                    <span className="text-[10px] sm:text-xs text-foreground truncate min-w-0" title={match.source}>{match.source}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground whitespace-nowrap">
                      {match.confidence}%
                    </span>
                    <Progress value={match.confidence} className="w-10 sm:w-12 h-1 sm:h-1.5" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* PO Comparison */}
          {bill.po_reference && bill.po_amount && (
            <Card className="border-border overflow-hidden">
              <CardHeader className="py-1.5 sm:py-2 px-2 sm:px-3 bg-muted/30">
                <CardTitle className="text-[10px] sm:text-xs flex items-center gap-1.5 sm:gap-2">
                  <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary shrink-0" />
                  PO Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0 truncate max-w-[80px] sm:max-w-[100px]" title={bill.po_reference}>{bill.po_reference}</span>
                  <span className="text-[10px] sm:text-xs font-medium shrink-0">{formatCurrency(bill.po_amount)}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">Invoice Total</span>
                  <span className="text-[10px] sm:text-xs font-medium shrink-0">{formatCurrency(bill.total_amount)}</span>
                </div>
                <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center pt-1.5 sm:pt-2 border-t border-border gap-1">
                  <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">Variance</span>
                  <span className={cn(
                    "text-[10px] sm:text-xs font-semibold text-right break-words",
                    bill.total_amount > bill.po_amount ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400"
                  )}>
                    {bill.total_amount > bill.po_amount ? "+" : ""}
                    {formatCurrency(bill.total_amount - bill.po_amount)}
                    <span className="ml-1">
                      ({bill.total_amount > bill.po_amount ? "+" : ""}
                      {Math.round(((bill.total_amount - bill.po_amount) / bill.po_amount) * 100)}%)
                    </span>
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Recommendation */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
            <CardHeader className="py-1.5 sm:py-2 px-2 sm:px-3">
              <CardTitle className="text-[10px] sm:text-xs flex items-center gap-1.5 sm:gap-2">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary shrink-0" />
                AI Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-3">
              <div className={cn("font-semibold text-xs sm:text-sm mb-1.5 sm:mb-2", recInfo.color)}>
                {recInfo.label}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 line-clamp-3">
                {bill.ai_recommendation_reason}
              </p>

              {/* Draft Email Preview */}
              {(bill.ai_recommendation === "request_revision" || 
                bill.ai_recommendation === "hold_clarification") && (
                <div className="mt-2 sm:mt-3">
                  <MobileTooltip label="Preview Email Draft">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-[10px] sm:text-xs h-7 sm:h-8 gap-1 sm:gap-1.5"
                      onClick={() => setShowDraftEmail(!showDraftEmail)}
                    >
                      <MessageSquare className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      {showDraftEmail ? "Hide" : "View"} Draft Communication
                    </Button>
                  </MobileTooltip>
                  
                  {showDraftEmail && (
                    <div className="mt-2 p-2 bg-muted/50 rounded-lg text-[10px] sm:text-xs">
                      <div className="font-medium text-foreground mb-1 truncate">
                        To: {bill.supplier_name}
                      </div>
                      <div className="text-muted-foreground truncate">
                        Re: Invoice {bill.invoice_number} - Clarification Required
                      </div>
                      <div className="mt-2 text-foreground">
                        Dear Supplier,<br /><br />
                        We have reviewed invoice {bill.invoice_number} and require the following clarification before processing:
                        <ul className="list-disc ml-4 mt-1">
                          {bill.risk_flags.map((flag, i) => (
                            <li key={i} className="break-words">{flag.evidence}</li>
                          ))}
                        </ul>
                        <br />
                        Please provide updated documentation or clarification at your earliest convenience.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Action Buttons */}
      <div className="p-2 sm:p-3 border-t border-border bg-muted/30 space-y-1.5 sm:space-y-2">
        {bill.status === "needs_review" && (
          <>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <MobileTooltip label="Approve Invoice">
                <Button
                  size="sm"
                  className="h-8 sm:h-9 text-[10px] sm:text-xs gap-1 sm:gap-1.5"
                  onClick={() => onApprove(bill)}
                  disabled={isProcessing}
                >
                  <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  Approve
                </Button>
              </MobileTooltip>
              <MobileTooltip label="Delegate for Review">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 sm:h-9 text-[10px] sm:text-xs gap-1 sm:gap-1.5"
                  onClick={() => onDelegate(bill)}
                  disabled={isProcessing}
                >
                  <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  Delegate
                </Button>
              </MobileTooltip>
            </div>
            <MobileTooltip label="Send Query to Supplier">
              <Button
                variant="secondary"
                size="sm"
                className="w-full h-8 sm:h-9 text-[10px] sm:text-xs gap-1 sm:gap-1.5"
                onClick={() => onQuery(bill)}
                disabled={isProcessing}
              >
                <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                Query Supplier
              </Button>
            </MobileTooltip>
          </>
        )}

        {bill.status === "approved" && (
          <MobileTooltip label="Sync to Accounting">
            <Button
              size="sm"
              className="w-full h-8 sm:h-9 text-[10px] sm:text-xs gap-1 sm:gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => onSyncToXero(bill)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="truncate">Syncing to Xero...</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  Sync to Xero
                </>
              )}
            </Button>
          </MobileTooltip>
        )}

        {(bill.status === "synced" || bill.status === "paid") && (
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">
              {bill.status === "synced" ? "Synced to Xero" : "Payment Complete"}
            </span>
          </div>
        )}

        {(bill.status === "matched" || bill.status === "extracted") && 
          bill.ai_recommendation === "auto_approve" && !bill.is_frozen && (
          <MobileTooltip label="AI Auto-Approve">
            <Button
              size="sm"
              className="w-full h-8 sm:h-9 text-[10px] sm:text-xs gap-1 sm:gap-1.5"
              onClick={() => onApprove(bill)}
              disabled={isProcessing}
            >
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Auto-Approve (AI Confident)
            </Button>
          </MobileTooltip>
        )}
      </div>
    </div>
  );
}

export default AIAssistPanel;
