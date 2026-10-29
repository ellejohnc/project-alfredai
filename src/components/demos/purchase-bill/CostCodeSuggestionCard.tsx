import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { PurchaseBill } from "./purchaseBillData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles, Check, ChevronDown, ChevronUp, Tag,
  History, TrendingUp, ArrowRight
} from "lucide-react";
import { MobileTooltip } from "@/components/ui/mobile-tooltip";

interface CostCodeSuggestionCardProps {
  bill: PurchaseBill;
  onApplySuggestion?: (lineItemIndex: number, costCode: string) => void;
}

interface CostCodeSuggestion {
  code: string;
  name: string;
  confidence: number;
  reason: string;
  historicalUsage: number;
  isRecommended: boolean;
}

// Mock cost code database
const COST_CODE_DATABASE: Record<string, CostCodeSuggestion[]> = {
  'earthworks': [
    { code: '01.100.001', name: 'Site Preparation', confidence: 94, reason: 'Matches "Earthworks" keyword', historicalUsage: 45, isRecommended: true },
    { code: '01.100.002', name: 'Excavation', confidence: 78, reason: 'Related to earthworks category', historicalUsage: 23, isRecommended: false },
    { code: '01.200.001', name: 'Demolition', confidence: 45, reason: 'Sometimes grouped with earthworks', historicalUsage: 8, isRecommended: false },
  ],
  'concrete': [
    { code: '03.100.001', name: 'Concrete Supply', confidence: 96, reason: 'Exact match for concrete items', historicalUsage: 67, isRecommended: true },
    { code: '03.100.002', name: 'Concrete Pour', confidence: 82, reason: 'Often used together', historicalUsage: 34, isRecommended: false },
    { code: '03.200.001', name: 'Concrete Pumping', confidence: 65, reason: 'Related service', historicalUsage: 12, isRecommended: false },
  ],
  'electrical': [
    { code: '16.100.001', name: 'Electrical Rough-In', confidence: 92, reason: 'Matches electrical description', historicalUsage: 56, isRecommended: true },
    { code: '16.200.001', name: 'Electrical Fit-Off', confidence: 71, reason: 'Phase-related code', historicalUsage: 28, isRecommended: false },
    { code: '16.300.001', name: 'Electrical Testing', confidence: 45, reason: 'Compliance related', historicalUsage: 9, isRecommended: false },
  ],
  'plumbing': [
    { code: '15.100.001', name: 'Plumbing Rough-In', confidence: 91, reason: 'Matches plumbing description', historicalUsage: 48, isRecommended: true },
    { code: '15.200.001', name: 'Plumbing Fit-Off', confidence: 68, reason: 'Phase-related code', historicalUsage: 22, isRecommended: false },
  ],
  'default': [
    { code: '99.100.001', name: 'General Construction', confidence: 60, reason: 'Fallback category', historicalUsage: 15, isRecommended: true },
    { code: '99.200.001', name: 'Miscellaneous', confidence: 40, reason: 'Uncategorized items', historicalUsage: 8, isRecommended: false },
  ],
};

function getSuggestionsForLineItem(description: string): CostCodeSuggestion[] {
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes('earth') || lowerDesc.includes('excavat') || lowerDesc.includes('site prep')) {
    return COST_CODE_DATABASE['earthworks'];
  }
  if (lowerDesc.includes('concrete') || lowerDesc.includes('pour') || lowerDesc.includes('slab')) {
    return COST_CODE_DATABASE['concrete'];
  }
  if (lowerDesc.includes('electric') || lowerDesc.includes('wiring') || lowerDesc.includes('power')) {
    return COST_CODE_DATABASE['electrical'];
  }
  if (lowerDesc.includes('plumb') || lowerDesc.includes('pipe') || lowerDesc.includes('drain')) {
    return COST_CODE_DATABASE['plumbing'];
  }
  
  return COST_CODE_DATABASE['default'];
}

export function CostCodeSuggestionCard({ bill, onApplySuggestion }: CostCodeSuggestionCardProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set([0]));
  const [appliedCodes, setAppliedCodes] = useState<Map<number, string>>(new Map());

  const lineItemSuggestions = useMemo(() => {
    return bill.line_items.map((item, idx) => ({
      item,
      index: idx,
      suggestions: getSuggestionsForLineItem(item.description),
    }));
  }, [bill.line_items]);

  const toggleExpand = (idx: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        newSet.add(idx);
      }
      return newSet;
    });
  };

  const applyCode = (lineItemIndex: number, code: string) => {
    setAppliedCodes(prev => new Map(prev).set(lineItemIndex, code));
    onApplySuggestion?.(lineItemIndex, code);
  };

  const applyAllRecommended = () => {
    lineItemSuggestions.forEach(({ index, suggestions }) => {
      const recommended = suggestions.find(s => s.isRecommended);
      if (recommended) {
        applyCode(index, recommended.code);
      }
    });
  };

  const allApplied = lineItemSuggestions.every(({ index }) => appliedCodes.has(index));

  if (bill.line_items.length === 0) {
    return null;
  }

  return (
    <Card className="border-border overflow-hidden">
      <CardHeader className="py-1.5 sm:py-2 px-2 sm:px-3 bg-gradient-to-r from-violet-500/10 to-transparent">
        <CardTitle className="text-[10px] sm:text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-violet-500 shrink-0" />
            <span className="truncate">AI Cost Code Suggestions</span>
          </div>
          <MobileTooltip label="Apply AI Suggestions">
            <Button
              size="sm"
              variant="ghost"
              className="h-5 sm:h-6 text-[9px] sm:text-[10px] text-violet-600 px-1.5 sm:px-2"
              onClick={applyAllRecommended}
              disabled={allApplied}
            >
              <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
              <span className="hidden xs:inline">Apply All</span>
              <span className="xs:hidden">Apply</span>
            </Button>
          </MobileTooltip>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-1.5 sm:p-2 space-y-1.5 sm:space-y-2">
        {lineItemSuggestions.map(({ item, index, suggestions }) => {
          const isExpanded = expandedItems.has(index);
          const appliedCode = appliedCodes.get(index);
          const recommended = suggestions.find(s => s.isRecommended);
          
          return (
            <div 
              key={index}
              className={cn(
                "border border-border rounded-lg overflow-hidden",
                appliedCode && "border-green-500/50 bg-green-500/5"
              )}
            >
              {/* Line Item Header */}
              <button
                onClick={() => toggleExpand(index)}
                className="w-full p-1.5 sm:p-2 flex items-center justify-between hover:bg-muted/30 transition-colors gap-2"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 text-left min-w-0 flex-1 overflow-hidden">
                  <Tag className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="text-[10px] sm:text-xs font-medium truncate">
                      {item.description}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-muted-foreground truncate">
                      Current: {item.cost_code}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {appliedCode ? (
                    <Badge variant="outline" className="text-[8px] sm:text-[9px] text-green-600 border-green-500/50 px-1 sm:px-1.5">
                      <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5" />
                      <span className="hidden xs:inline">{appliedCode}</span>
                      <span className="xs:hidden">✓</span>
                    </Badge>
                  ) : recommended && (
                    <Badge variant="outline" className="text-[8px] sm:text-[9px] text-violet-600 border-violet-500/50 px-1 sm:px-1.5">
                      {recommended.confidence}%
                    </Badge>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                  )}
                </div>
              </button>

              {/* Suggestions */}
              {isExpanded && (
                <div className="border-t border-border p-1.5 sm:p-2 space-y-1 sm:space-y-1.5 bg-muted/20">
                  {suggestions.map((suggestion, sIdx) => (
                    <div
                      key={sIdx}
                      className={cn(
                        "p-1.5 sm:p-2 rounded border transition-all",
                        suggestion.isRecommended 
                          ? "border-violet-500/30 bg-violet-500/5" 
                          : "border-border bg-background",
                        appliedCode === suggestion.code && "border-green-500/50 bg-green-500/10"
                      )}
                    >
                      <div className="flex items-start sm:items-center justify-between mb-1 gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap min-w-0">
                          <code className="text-[9px] sm:text-xs font-mono bg-muted px-1 sm:px-1.5 py-0.5 rounded break-all">
                            {suggestion.code}
                          </code>
                          <span className="text-[10px] sm:text-xs font-medium truncate max-w-[80px] sm:max-w-none">{suggestion.name}</span>
                          {suggestion.isRecommended && (
                            <Badge variant="secondary" className="text-[7px] sm:text-[8px] py-0 h-3.5 sm:h-4 px-1">
                              <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5" />
                              <span className="hidden xs:inline">Recommended</span>
                              <span className="xs:hidden">★</span>
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant={appliedCode === suggestion.code ? "default" : "outline"}
                          className="h-5 sm:h-6 text-[9px] sm:text-[10px] px-1.5 sm:px-2 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            applyCode(index, suggestion.code);
                          }}
                          disabled={appliedCode === suggestion.code}
                        >
                          {appliedCode === suggestion.code ? (
                            <>
                              <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" />
                              <span className="hidden xs:inline">Applied</span>
                              <span className="xs:hidden">✓</span>
                            </>
                          ) : (
                            'Apply'
                          )}
                        </Button>
                      </div>
                      
                      <div className="flex flex-col xs:flex-row items-start xs:items-center gap-1 xs:gap-2 sm:gap-3 text-[9px] sm:text-[10px]">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground">Confidence:</span>
                          <Progress value={suggestion.confidence} className="w-8 sm:w-12 h-1" />
                          <span className="font-medium">{suggestion.confidence}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <History className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground">Used {suggestion.historicalUsage}x</span>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-1 mt-1 text-[9px] sm:text-[10px] text-muted-foreground">
                        <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 mt-0.5" />
                        <span className="break-words">{suggestion.reason}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default CostCodeSuggestionCard;
