import { memo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SafeAnimatePresence } from '@/components/ui/safe-animate-presence';
import { 
  History, 
  Building2, 
  Users, 
  Check, 
  X, 
  Clock,
  Loader2,
  RefreshCw,
  Workflow,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SimilarQuote } from '@/hooks/useQuoteBuilder';
import { formatCurrency } from '@/lib/pricingEngine';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface SimilarQuotesPanelProps {
  quotes: SimilarQuote[];
  isLoading: boolean;
  onRefresh: () => void;
  industry?: string;
  teamSize?: number;
  onApplyFees?: (setupFee: number, monthlyRetainer: number) => void;
}

export const SimilarQuotesPanel = memo(function SimilarQuotesPanel({
  quotes,
  isLoading,
  onRefresh,
  industry,
  teamSize,
  onApplyFees,
}: SimilarQuotesPanelProps) {
  // Auto-fetch when industry or team size changes
  useEffect(() => {
    if (industry && industry !== 'general') {
      onRefresh();
    }
  }, [industry, teamSize]);

  const getOutcomeBadge = (outcome: string | null, status: string) => {
    if (outcome === 'won') return <Badge className="bg-green-100 text-green-700 text-xs border-0">Won</Badge>;
    if (outcome === 'lost') return <Badge className="bg-red-100 text-red-700 text-xs border-0">Lost</Badge>;
    if (status === 'sent') return <Badge className="bg-amber-100 text-amber-700 text-xs border-0">Pending</Badge>;
    if (status === 'signed') return <Badge className="bg-blue-100 text-blue-700 text-xs border-0">Signed</Badge>;
    return <Badge variant="outline" className="text-xs">Draft</Badge>;
  };

  const getDisplayFees = (quote: SimilarQuote) => {
    const setup = quote.setup_fee_final ?? quote.setup_fee_min;
    const monthly = quote.monthly_retainer_final ?? quote.monthly_retainer_min;
    return { setup, monthly };
  };

  const handleCopyFees = (quote: SimilarQuote) => {
    const fees = getDisplayFees(quote);
    const text = `${quote.company_name || 'Quote'} Fee Structure:\nSetup Fee: ${formatCurrency(fees.setup)}\nMonthly Retainer: ${formatCurrency(fees.monthly)}/mo`;
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Fee structure copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy');
    });

    // If parent provided an apply callback, also apply the fees
    if (onApplyFees && fees.setup > 0 && fees.monthly > 0) {
      onApplyFees(fees.setup, fees.monthly);
      toast.success(`Applied fees from ${quote.company_name || 'past quote'}`, {
        description: `Setup: ${formatCurrency(fees.setup)} · Monthly: ${formatCurrency(fees.monthly)}/mo`,
      });
    }
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Similar Quotes</h3>
          {quotes.length > 0 && (
            <Badge variant="secondary" className="text-xs">{quotes.length}</Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        <SafeAnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-8"
            >
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </motion.div>
          ) : quotes.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 text-center text-sm text-muted-foreground"
            >
              {industry && industry !== 'general' 
                ? 'No similar quotes found for this industry yet.'
                : 'Select an industry to find similar quotes.'}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {quotes.map((quote, index) => {
                const fees = getDisplayFees(quote);
                const workflowCount = quote.workflows?.length || 0;
                return (
                  <motion.div
                    key={quote.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {quote.company_name || 'Unnamed Company'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 shrink-0" />
                            {quote.industry}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 shrink-0" />
                            {quote.team_size}
                          </span>
                          {workflowCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Workflow className="w-3 h-3 shrink-0" />
                              {workflowCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyFees(quote)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="text-xs">
                            {onApplyFees ? 'Apply this fee structure' : 'Copy fee structure'}
                          </TooltipContent>
                        </Tooltip>
                        {getOutcomeBadge(quote.outcome, quote.status)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {format(new Date(quote.created_at), 'MMM d, yyyy')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">
                          {formatCurrency(fees.setup)}
                        </span>
                        <span className="text-muted-foreground">+</span>
                        <span className="font-medium">
                          {formatCurrency(fees.monthly)}/mo
                        </span>
                        {(quote.setup_fee_final || quote.monthly_retainer_final) && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">Final</Badge>
                        )}
                      </div>
                    </div>

                    {quote.roi_likely > 0 && (
                      <div className="mt-1.5 flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {quote.roi_likely}% ROI
                        </Badge>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </SafeAnimatePresence>
      </div>
    </div>
  );
});
