import { memo, useState, useCallback, useEffect } from 'react';
import { 
  Search, 
  Loader2, 
  FolderOpen, 
  Clock, 
  ChevronDown,
  ChevronUp,
  Building2,
  User,
  AlertCircle,
  X,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface RecentQuote {
  id: string;
  quote_id: string | null;
  company_name: string | null;
  contact_name: string | null;
  industry: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

interface QuoteLoaderProps {
  recentQuotes: RecentQuote[];
  isLoadingRecent: boolean;
  isLoadingSearch: boolean;
  isLoadingQuote: boolean;
  searchResults: RecentQuote[];
  loadedQuoteId: string | null;
  hasSearched: boolean;
  onSearch: (query: string) => Promise<void>;
  onLoadQuote: (quoteId: string) => Promise<void>;
  onFetchRecent: () => Promise<void>;
}

export const QuoteLoader = memo(function QuoteLoader({
  recentQuotes,
  isLoadingRecent,
  isLoadingSearch,
  isLoadingQuote,
  searchResults,
  loadedQuoteId,
  hasSearched,
  onSearch,
  onLoadQuote,
  onFetchRecent,
}: QuoteLoaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isPendingSearch, setIsPendingSearch] = useState(false);

  // Track if we've already fetched to prevent loops
  const [hasFetchedRecent, setHasFetchedRecent] = useState(false);

  // Fetch recent quotes when panel opens (only once)
  useEffect(() => {
    if (isOpen && !hasFetchedRecent && !isLoadingRecent) {
      setHasFetchedRecent(true);
      onFetchRecent();
    }
  }, [isOpen, hasFetchedRecent, isLoadingRecent, onFetchRecent]);

  // Reset fetch flag when panel closes
  useEffect(() => {
    if (!isOpen) {
      setHasFetchedRecent(false);
    }
  }, [isOpen]);

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }

    // Clear pending state if query is too short
    if (value.trim().length < 2) {
      setIsPendingSearch(false);
      return;
    }

    // Mark as pending during debounce
    setIsPendingSearch(true);
    
    const timeout = setTimeout(() => {
      setIsPendingSearch(false); // Clear pending when search starts
      onSearch(value.trim());
    }, 300);
    setSearchTimeout(timeout);
  }, [onSearch, searchTimeout]);

  const handleLoadQuote = useCallback(async (quoteId: string) => {
    await onLoadQuote(quoteId);
    setIsOpen(false);
    setSearchQuery('');
  }, [onLoadQuote]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setIsPendingSearch(false);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }
  }, [searchTimeout]);

  const handleRefresh = useCallback(() => {
    setHasFetchedRecent(false);
    onFetchRecent();
    setHasFetchedRecent(true);
  }, [onFetchRecent]);

  const displayQuotes = searchQuery.trim().length >= 2 ? searchResults : recentQuotes;
  const isSearchMode = searchQuery.trim().length >= 2;
  const isLoading = isSearchMode ? isLoadingSearch : isLoadingRecent;

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'sent': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'accepted': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'declined': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatQuoteDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else if (diffDays < 7) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return format(date, 'MMM d, yyyy h:mm a');
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-4 h-auto hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <FolderOpen className="w-5 h-5 text-primary" />
              <span className="font-medium">Load Previous Quote</span>
              {loadedQuoteId && (
                <Badge variant="secondary" className="text-xs">
                  Editing: {loadedQuoteId}
                </Badge>
              )}
            </div>
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="border-t border-border">
          <div className="p-4 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by quote ID, company, or contact name..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && !isLoadingSearch && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
              {isLoadingSearch && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
              )}
            </div>

            {/* Results List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    {searchQuery.trim().length >= 2 
                      ? `Search Results (${displayQuotes.length})`
                      : 'Recent Quotes'
                    }
                  </span>
                </div>
                {!isSearchMode && (
                  <button
                    onClick={handleRefresh}
                    disabled={isLoadingRecent}
                    className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-50"
                    aria-label="Refresh recent quotes"
                  >
                    <RefreshCw className={cn("w-4 h-4", isLoadingRecent && "animate-spin")} />
                  </button>
                )}
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : displayQuotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">
                    {isSearchMode && hasSearched
                      ? 'No quotes found matching your search'
                      : !isSearchMode
                      ? 'No recent quotes'
                      : 'Type at least 2 characters to search'
                    }
                  </p>
                  {isSearchMode && hasSearched && (
                    <p className="text-xs mt-1 text-muted-foreground/70">
                      Try a different quote ID, company name, or contact name
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {displayQuotes.map((quote) => (
                    <button
                      key={quote.id}
                      onClick={() => handleLoadQuote(quote.quote_id || quote.id)}
                      disabled={isLoadingQuote}
                      className={cn(
                        "w-full p-3 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors text-left",
                        "flex items-start justify-between gap-4",
                        isLoadingQuote && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-medium text-primary">
                            {quote.quote_id || quote.id.slice(0, 8)}
                          </span>
                          <Badge className={cn("text-xs", getStatusColor(quote.status))}>
                            {quote.status || 'Draft'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {quote.company_name && (
                            <span className="flex items-center gap-1 truncate">
                              <Building2 className="w-3 h-3 flex-shrink-0" />
                              {quote.company_name}
                            </span>
                          )}
                          {quote.contact_name && (
                            <span className="flex items-center gap-1 truncate">
                              <User className="w-3 h-3 flex-shrink-0" />
                              {quote.contact_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap flex flex-col items-end">
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Last updated</span>
                        <span>{formatQuoteDate(quote.updated_at || quote.created_at)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
});
