import { memo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { format, formatDistanceToNow } from 'date-fns';
import { History, ChevronDown, ChevronUp, User, Clock, FileText, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuoteVersionHistoryItem } from '@/hooks/useQuoteBuilder';

interface NotesHistoryProps {
  history: QuoteVersionHistoryItem[];
  className?: string;
}

export const NotesHistory = memo(function NotesHistory({
  history,
  className,
}: NotesHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Filter to only show versions that have notes
  const versionsWithNotes = history.filter(v => v.notes && v.notes.trim().length > 0);

  if (versionsWithNotes.length === 0) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return format(date, 'MMM d, yyyy');
  };

  return (
    <Collapsible 
      open={isOpen} 
      onOpenChange={setIsOpen} 
      className={cn("w-full", className)}
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full flex items-center justify-between gap-2 h-auto py-2 px-3 text-muted-foreground hover:text-foreground"
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4" />
            <span className="text-sm">Previous Notes</span>
            <Badge variant="secondary" className="text-xs">
              {versionsWithNotes.length}
            </Badge>
          </div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-2">
        <ScrollArea className="max-h-[250px]">
          <div className="space-y-3 pr-2">
            {versionsWithNotes.map((version, index) => (
              <div
                key={`${version.version_number}-${index}`}
                className="p-3 bg-muted/50 rounded-lg border border-border"
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      v{version.version_number}
                    </Badge>
                    {version.created_by && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {version.created_by}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(version.created_at)}
                  </span>
                </div>

                {/* Notes Content */}
                <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-background/50 rounded p-2 border border-border/50">
                  <div className="flex items-start gap-2">
                    <StickyNote className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary/70" />
                    <p className="flex-1">{version.notes}</p>
                  </div>
                </div>

                {/* Transcript Summary (if available) */}
                {version.transcript_summary && (
                  <div className="mt-2 text-xs text-muted-foreground/70">
                    <div className="flex items-start gap-2">
                      <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <p className="line-clamp-2">{version.transcript_summary}</p>
                    </div>
                  </div>
                )}

                {/* Change Summary */}
                {version.change_summary && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground/60 italic">
                      {version.change_summary}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
});
