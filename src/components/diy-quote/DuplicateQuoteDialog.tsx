import { memo } from 'react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, FileText, Building2, User, Calendar, ExternalLink } from 'lucide-react';
import { RecentQuote } from '@/hooks/useQuoteBuilder';

interface DuplicateQuoteDialogProps {
  open: boolean;
  matches: RecentQuote[];
  onDismiss: () => void;
  onLoadQuote: (quoteId: string) => void;
  onContinueNew: () => void;
}

export const DuplicateQuoteDialog = memo(function DuplicateQuoteDialog({
  open,
  matches,
  onDismiss,
  onLoadQuote,
  onContinueNew,
}: DuplicateQuoteDialogProps) {
  const handleLoadQuote = (quoteId: string) => {
    onDismiss();
    onLoadQuote(quoteId);
  };

  const handleContinueNew = () => {
    onDismiss();
    onContinueNew();
  };

  return (
    <AlertDialog open={open} onOpenChange={onDismiss}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Existing Quotes Found
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            We found {matches.length} existing quote{matches.length > 1 ? 's' : ''} for this client. 
            Would you like to load an existing quote or continue with a new one?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ScrollArea className="max-h-[300px] -mx-2 px-2">
          <div className="space-y-2">
            {matches.map((quote) => (
              <div
                key={quote.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-sm truncate">
                      {quote.company_name || 'Unnamed Company'}
                    </span>
                    {quote.status && (
                      <Badge 
                        variant={quote.status === 'won' ? 'default' : quote.status === 'lost' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {quote.status}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      <span className="font-mono">{quote.quote_id}</span>
                    </div>
                    {quote.contact_name && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="truncate">{quote.contact_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{format(new Date(quote.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLoadQuote(quote.quote_id)}
                  className="gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity"
                >
                  <ExternalLink className="w-4 h-4" />
                  Load
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <AlertDialogCancel onClick={onDismiss}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleContinueNew} className="gap-2">
            <FileText className="w-4 h-4" />
            Continue as New Quote
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});
