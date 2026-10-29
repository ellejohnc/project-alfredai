import { memo, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { History, ChevronDown, ChevronUp, User, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuoteVersion {
  id: string;
  quote_id: string;
  version_number: number;
  company_name: string | null;
  contact_name: string | null;
  industry: string | null;
  team_size: number | null;
  setup_fee_min: number | null;
  setup_fee_max: number | null;
  monthly_retainer_min: number | null;
  monthly_retainer_max: number | null;
  roi_likely: number | null;
  voice_agent_plan: string | null;
  created_by: string | null;
  created_at: string;
  change_summary: string | null;
}

interface QuoteVersionHistoryProps {
  quoteId: string;
}

export const QuoteVersionHistory = memo(function QuoteVersionHistory({
  quoteId,
}: QuoteVersionHistoryProps) {
  const [versions, setVersions] = useState<QuoteVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && versions.length === 0 && !isLoading) {
      fetchVersions();
    }
  }, [isOpen]);

  const fetchVersions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .rpc('get_quote_versions_safe', { p_quote_id: quoteId });

      
      if (fetchError) throw fetchError;
      setVersions(data || []);
    } catch (err) {
      console.error('Failed to fetch versions:', err);
      setError('Failed to load version history');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4" />
            <span>Version History</span>
            {versions.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {versions.length} version{versions.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            {error}
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No previous versions
          </div>
        ) : (
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-2">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="p-3 bg-muted/50 rounded-lg border border-border"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        v{version.version_number}
                      </Badge>
                      {version.change_summary && (
                        <span className="text-xs text-muted-foreground">
                          {version.change_summary}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(version.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span>{version.created_by || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <DollarSign className="w-3 h-3" />
                      <span>
                        {formatCurrency(version.setup_fee_min)} - {formatCurrency(version.setup_fee_max)}
                      </span>
                    </div>
                    {version.company_name && (
                      <div className="col-span-2 text-muted-foreground">
                        Company: {version.company_name}
                      </div>
                    )}
                    {version.roi_likely && (
                      <div className="text-muted-foreground">
                        ROI: {version.roi_likely.toFixed(0)}%
                      </div>
                    )}
                    {version.voice_agent_plan && version.voice_agent_plan !== 'none' && (
                      <div className="text-muted-foreground capitalize">
                        Voice: {version.voice_agent_plan}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
});
