import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import {
  Archive, Crown, Calendar, Mail, Building2, User, DollarSign, Workflow, Loader2, Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DuplicateEntry {
  id: string;
  displayId: string;
  primaryLabel: string;
  secondaryLabel: string | null;
  email: string | null;
  assignee: string | null;
  createdAt: string;
  updatedAt: string | null;
  status: string | null;
  source: 'quote' | 'lead';
  // Extra metadata for comparison
  meta: {
    setupFee?: string | null;
    monthlyRetainer?: string | null;
    workflowCount?: number;
    phone?: string | null;
    leadType?: string | null;
    leadSource?: string | null;
    industry?: string | null;
  };
}

export interface DuplicateGroup {
  groupKey: string;
  matchLabel: string;
  entries: DuplicateEntry[];
}

interface DuplicateResolverProps {
  group: DuplicateGroup | null;
  onClose: () => void;
  onResolve: (keepId: string, archiveIds: string[]) => Promise<void>;
  onArchiveAll?: (ids: string[]) => Promise<void>;
  isProcessing: boolean;
}

function formatFee(val?: string | null) {
  if (!val) return '—';
  return val;
}

function getStatusColor(status: string | null) {
  switch (status) {
    case 'won': case 'signed': return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
    case 'sent': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
    case 'lost': return 'bg-destructive/10 text-destructive border-destructive/20';
    default: return 'bg-muted text-muted-foreground';
  }
}

export function DuplicateResolver({ group, onClose, onResolve, onArchiveAll, isProcessing }: DuplicateResolverProps) {
  const [keepId, setKeepId] = useState<string | null>(null);

  if (!group) return null;

  const archiveIds = group.entries.filter(e => e.id !== keepId).map(e => e.id);

  // Auto-suggest: most recent update or highest status
  const statusRank: Record<string, number> = { won: 5, signed: 4, sent: 3, draft: 1, lost: 0 };
  const sorted = [...group.entries].sort((a, b) => {
    const sa = statusRank[a.status || 'draft'] ?? 1;
    const sb = statusRank[b.status || 'draft'] ?? 1;
    if (sb !== sa) return sb - sa;
    const da = new Date(a.updatedAt || a.createdAt).getTime();
    const db = new Date(b.updatedAt || b.createdAt).getTime();
    return db - da;
  });
  const suggestedId = sorted[0]?.id;

  const isQuote = group.entries[0]?.source === 'quote';

  return (
    <Dialog open={!!group} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-primary" />
            Resolve Duplicates
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{group.matchLabel}</span>
            {' '} — {group.entries.length} entries found. Choose which one to keep.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6" type="always">
          <div className="overflow-x-auto pb-1 [touch-action:pan-x]">
            <RadioGroup value={keepId || ''} onValueChange={setKeepId} className="space-y-3 min-w-[980px]">
            {group.entries.map((entry, idx) => {
              const isSuggested = entry.id === suggestedId;
              const isKept = entry.id === keepId;

              return (
                <Card
                  key={entry.id}
                  className={cn(
                    'cursor-pointer transition-all border-2',
                    isKept ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/30',
                  )}
                  onClick={() => setKeepId(entry.id)}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value={entry.id} id={entry.id} className="mt-1 shrink-0" />
                      <Label htmlFor={entry.id} className="flex-1 cursor-pointer space-y-2">
                        {/* Header row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-muted-foreground">{entry.displayId}</span>
                          <Badge variant="outline" className={cn('text-[10px]', getStatusColor(entry.status))}>
                            {entry.status || 'draft'}
                          </Badge>
                          {isSuggested && (
                            <Badge className="text-[10px] gap-1 bg-primary/10 text-primary border-primary/20" variant="outline">
                              <Crown className="h-3 w-3" />
                              Recommended
                            </Badge>
                          )}
                          {isKept && (
                            <Badge className="text-[10px] gap-1 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" variant="outline">
                              Keep
                            </Badge>
                          )}
                          {keepId && !isKept && (
                            <Badge className="text-[10px] gap-1 bg-destructive/10 text-destructive border-destructive/20" variant="outline">
                              <Archive className="h-3 w-3" />
                              Will archive
                            </Badge>
                          )}
                        </div>

                        {/* Detail grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Building2 className="h-3 w-3 shrink-0" />
                            <span className="truncate">{entry.primaryLabel}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <User className="h-3 w-3 shrink-0" />
                            <span className="truncate">{entry.secondaryLabel || '—'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{entry.email || '—'}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>Created {entry.createdAt ? format(new Date(entry.createdAt), 'MMM d, yyyy') : '—'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>Updated {entry.updatedAt ? format(new Date(entry.updatedAt), 'MMM d, yyyy') : '—'}</span>
                          </div>

                          {entry.assignee && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <User className="h-3 w-3 shrink-0" />
                              <span className="truncate">Rep: {entry.assignee}</span>
                            </div>
                          )}

                          {/* Quote-specific fields */}
                          {isQuote && (
                            <>
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <DollarSign className="h-3 w-3 shrink-0" />
                                <span>Setup: {formatFee(entry.meta.setupFee)}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <DollarSign className="h-3 w-3 shrink-0" />
                                <span>Monthly: {formatFee(entry.meta.monthlyRetainer)}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Workflow className="h-3 w-3 shrink-0" />
                                <span>{entry.meta.workflowCount ?? 0} workflow{(entry.meta.workflowCount ?? 0) !== 1 ? 's' : ''}</span>
                              </div>
                              {entry.meta.industry && (
                                <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                                  <Building2 className="h-3 w-3 shrink-0" />
                                  <span>Industry: {entry.meta.industry}</span>
                                </div>
                              )}
                            </>
                          )}

                          {/* Lead-specific fields */}
                          {!isQuote && (
                            <>
                              {entry.meta.phone && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Mail className="h-3 w-3 shrink-0" />
                                  <span>{entry.meta.phone}</span>
                                </div>
                              )}
                              {entry.meta.leadType && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <span>Type: {entry.meta.leadType}</span>
                                </div>
                              )}
                              {entry.meta.leadSource && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <span>Source: {entry.meta.leadSource}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </RadioGroup>
          </div>
        </ScrollArea>

        <Separator />

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing} className="min-h-[44px]">
            Cancel
          </Button>
          {onArchiveAll && (
            <Button
              variant="destructive"
              onClick={() => onArchiveAll(group.entries.map(e => e.id))}
              disabled={isProcessing}
              className="gap-1.5 min-h-[44px]"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
              Archive All {group.entries.length}
            </Button>
          )}
          <Button
            onClick={() => keepId && onResolve(keepId, archiveIds)}
            disabled={!keepId || isProcessing}
            className="gap-1.5 min-h-[44px]"
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
            {isProcessing ? 'Processing...' : `Keep 1, Archive ${archiveIds.length}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
