import { useState, useEffect, useCallback, memo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import {
  Sparkles,
  AlertTriangle,
  UserX,
  MailX,
  Copy as CopyIcon,
  Archive,
  Clock,
  Loader2,
  Check,
  Trash2,
  FileX,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TidyUpIssue {
  quoteId: string;       // DB uuid
  quoteDisplayId: string; // Human-readable quote_id
  companyName: string;
  createdAt: string;
  status: string | null;
  issues: string[];       // issue category keys
}

type IssueCategory = {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  severity: 'warning' | 'info' | 'destructive';
  autoFixable: boolean;
  actionLabel: string;
};

const ISSUE_CATEGORIES: IssueCategory[] = [
  {
    key: 'empty_deal',
    label: 'Empty Deals',
    description: 'No company name, no fees, no workflows — likely test entries',
    icon: <FileX className="w-4 h-4" />,
    severity: 'destructive',
    autoFixable: true,
    actionLabel: 'Archive',
  },
  {
    key: 'no_sales_rep',
    label: 'No Sales Rep',
    description: 'Missing created_by field — no one assigned',
    icon: <UserX className="w-4 h-4" />,
    severity: 'warning',
    autoFixable: false,
    actionLabel: 'Review',
  },
  {
    key: 'no_contact',
    label: 'No Contact Details',
    description: 'Missing contact name or email',
    icon: <MailX className="w-4 h-4" />,
    severity: 'warning',
    autoFixable: false,
    actionLabel: 'Review',
  },
  {
    key: 'no_company',
    label: 'No Company Name',
    description: 'Company name is blank',
    icon: <AlertTriangle className="w-4 h-4" />,
    severity: 'warning',
    autoFixable: false,
    actionLabel: 'Review',
  },
  {
    key: 'duplicate',
    label: 'Potential Duplicates',
    description: 'Same company + contact email appears multiple times',
    icon: <CopyIcon className="w-4 h-4" />,
    severity: 'info',
    autoFixable: false,
    actionLabel: 'Review',
  },
  {
    key: 'stale',
    label: 'Stale Prospects',
    description: 'Draft status with no updates in 90+ days',
    icon: <Clock className="w-4 h-4" />,
    severity: 'info',
    autoFixable: true,
    actionLabel: 'Archive',
  },
];

interface QuoteDataTidyUpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

export const QuoteDataTidyUp = memo(function QuoteDataTidyUp({
  open,
  onOpenChange,
  onRefresh,
}: QuoteDataTidyUpProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [issues, setIssues] = useState<TidyUpIssue[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    action: 'archive' | 'delete';
    ids: string[];
    label: string;
  } | null>(null);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());

  const scanForIssues = useCallback(async () => {
    setIsScanning(true);
    setIssues([]);
    setSelectedIds(new Set());
    setCompletedActions(new Set());

    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('id, quote_id, company_name, contact_name, contact_email, created_by, status, created_at, updated_at, setup_fee_min, setup_fee_max, setup_fee_final, monthly_retainer_min, monthly_retainer_max, monthly_retainer_final, workflows')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return;

      const issueMap: Map<string, TidyUpIssue> = new Map();

      const addIssue = (row: typeof data[0], issueKey: string) => {
        const existing = issueMap.get(row.id);
        if (existing) {
          existing.issues.push(issueKey);
        } else {
          issueMap.set(row.id, {
            quoteId: row.id,
            quoteDisplayId: row.quote_id || row.id.slice(0, 8),
            companyName: row.company_name || '(No company)',
            createdAt: row.created_at || '',
            status: row.status,
            issues: [issueKey],
          });
        }
      };

      // Detect issues
      for (const row of data) {
        // Empty deals: no company, no fees, no workflows
        const hasFees = (row.setup_fee_min || row.setup_fee_max || row.setup_fee_final ||
                        row.monthly_retainer_min || row.monthly_retainer_max || row.monthly_retainer_final);
        const hasWorkflows = Array.isArray(row.workflows) && (row.workflows as unknown[]).length > 0;
        if (!row.company_name && !hasFees && !hasWorkflows) {
          addIssue(row, 'empty_deal');
        }

        // No sales rep
        if (!row.created_by || row.created_by.trim() === '') {
          addIssue(row, 'no_sales_rep');
        }

        // No contact details
        if (!row.contact_name && !row.contact_email) {
          addIssue(row, 'no_contact');
        } else if (!row.contact_email) {
          addIssue(row, 'no_contact');
        }

        // No company name (but has some other data)
        if (!row.company_name && (hasFees || hasWorkflows)) {
          addIssue(row, 'no_company');
        }

        // Stale: draft, no update in 90+ days
        if (row.status === 'draft' || !row.status) {
          const lastTouch = row.updated_at || row.created_at;
          if (lastTouch && differenceInDays(new Date(), new Date(lastTouch)) >= 90) {
            addIssue(row, 'stale');
          }
        }
      }

      // Detect duplicates: same company_name + contact_email
      const dupMap = new Map<string, typeof data>();
      for (const row of data) {
        if (row.company_name && row.contact_email) {
          const key = `${row.company_name.toLowerCase().trim()}|${row.contact_email.toLowerCase().trim()}`;
          const existing = dupMap.get(key) || [];
          existing.push(row);
          dupMap.set(key, existing);
        }
      }
      for (const [, group] of dupMap) {
        if (group.length > 1) {
          for (const row of group) {
            addIssue(row, 'duplicate');
          }
        }
      }

      setIssues(Array.from(issueMap.values()));
      
      if (issueMap.size === 0) {
        toast.success('All clean! No data quality issues found.');
      }
    } catch (err) {
      console.error('Scan failed:', err);
      toast.error('Failed to scan quotes for issues');
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Auto-scan when dialog opens
  useEffect(() => {
    if (open) {
      scanForIssues();
    }
  }, [open, scanForIssues]);

  const getIssuesForCategory = (categoryKey: string) => {
    return issues.filter(i => i.issues.includes(categoryKey) && !completedActions.has(i.quoteId));
  };

  const getCategoryCounts = () => {
    return ISSUE_CATEGORIES.map(cat => ({
      ...cat,
      count: getIssuesForCategory(cat.key).length,
    })).filter(cat => cat.count > 0);
  };

  const toggleSelectAll = (categoryKey: string) => {
    const categoryIssues = getIssuesForCategory(categoryKey);
    const allSelected = categoryIssues.every(i => selectedIds.has(i.quoteId));
    
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        categoryIssues.forEach(i => next.delete(i.quoteId));
      } else {
        categoryIssues.forEach(i => next.add(i.quoteId));
      }
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleArchiveSelected = (categoryKey: string) => {
    const ids = getIssuesForCategory(categoryKey)
      .filter(i => selectedIds.has(i.quoteId))
      .map(i => i.quoteId);
    
    if (ids.length === 0) {
      toast.error('No quotes selected');
      return;
    }

    const cat = ISSUE_CATEGORIES.find(c => c.key === categoryKey);
    setConfirmAction({
      action: 'archive',
      ids,
      label: `Archive ${ids.length} ${cat?.label?.toLowerCase() || 'quotes'}`,
    });
  };

  const executeArchive = async (ids: string[]) => {
    setIsProcessing(true);
    try {
      // Archive by setting status to 'lost' with outcome noting tidy-up
      const { error } = await supabase
        .from('quotes')
        .update({ 
          status: 'lost', 
          outcome: 'Archived via Data Tidy-Up',
          updated_at: new Date().toISOString(),
        })
        .in('id', ids);

      if (error) throw error;

      setCompletedActions(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.add(id));
        return next;
      });
      setSelectedIds(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.delete(id));
        return next;
      });

      toast.success(`Archived ${ids.length} quote(s)`);
    } catch (err) {
      console.error('Archive failed:', err);
      toast.error('Failed to archive quotes');
    } finally {
      setIsProcessing(false);
      setConfirmAction(null);
    }
  };

  const handleAutoFix = async () => {
    // Auto-fix: archive empty deals + stale prospects
    const autoFixIds = new Set<string>();
    
    for (const issue of issues) {
      if (completedActions.has(issue.quoteId)) continue;
      const hasAutoFixable = issue.issues.some(key => {
        const cat = ISSUE_CATEGORIES.find(c => c.key === key);
        return cat?.autoFixable;
      });
      if (hasAutoFixable) {
        autoFixIds.add(issue.quoteId);
      }
    }

    if (autoFixIds.size === 0) {
      toast.info('Nothing to auto-fix');
      return;
    }

    setConfirmAction({
      action: 'archive',
      ids: Array.from(autoFixIds),
      label: `Auto-archive ${autoFixIds.size} empty deals & stale prospects`,
    });
  };

  const totalIssueCount = issues.filter(i => !completedActions.has(i.quoteId)).length;
  const categoriesWithIssues = getCategoryCounts();

  const handleClose = () => {
    if (completedActions.size > 0) {
      onRefresh();
    }
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Data Tidy-Up
            </DialogTitle>
            <DialogDescription>
              Scan your quotes for missing info, duplicates, empty deals, and stale prospects.
            </DialogDescription>
          </DialogHeader>

          {/* Summary Bar */}
          <div className="flex items-center justify-between gap-3 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              {isScanning ? (
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scanning...
                </span>
              ) : totalIssueCount > 0 ? (
                <span className="text-sm">
                  <strong>{totalIssueCount}</strong> quote{totalIssueCount !== 1 ? 's' : ''} with issues found
                </span>
              ) : (
                <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  All clean!
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {totalIssueCount > 0 && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleAutoFix}
                  disabled={isProcessing}
                  className="gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Auto-Fix
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={scanForIssues}
                disabled={isScanning}
              >
                Re-scan
              </Button>
            </div>
          </div>

          {/* Issue Categories */}
          <ScrollArea className="flex-1 -mx-6 px-6">
            {isScanning ? (
              <div className="py-12 text-center text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                <p className="text-sm">Analyzing {issues.length > 0 ? `${issues.length} quotes...` : 'quotes...'}</p>
              </div>
            ) : categoriesWithIssues.length === 0 ? (
              <div className="py-12 text-center">
                <Check className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No issues found. Your data is clean!</p>
              </div>
            ) : (
              <div className="space-y-2 py-2">
                {categoriesWithIssues.map(cat => {
                  const isExpanded = expandedCategory === cat.key;
                  const catIssues = getIssuesForCategory(cat.key);
                  const allSelected = catIssues.length > 0 && catIssues.every(i => selectedIds.has(i.quoteId));
                  const someSelected = catIssues.some(i => selectedIds.has(i.quoteId));
                  const selectedCount = catIssues.filter(i => selectedIds.has(i.quoteId)).length;

                  return (
                    <div key={cat.key} className="border border-border rounded-lg overflow-hidden">
                      {/* Category Header */}
                      <button
                        onClick={() => setExpandedCategory(isExpanded ? null : cat.key)}
                        className="w-full flex items-center justify-between gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                            cat.severity === 'destructive' && "bg-destructive/10 text-destructive",
                            cat.severity === 'warning' && "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
                            cat.severity === 'info' && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                          )}>
                            {cat.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium">{cat.label}</div>
                            <div className="text-xs text-muted-foreground truncate">{cat.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={cat.severity === 'destructive' ? 'destructive' : 'secondary'} className="text-xs">
                            {cat.count}
                          </Badge>
                          {cat.autoFixable && (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-300 dark:border-green-700">
                              Auto-fix
                            </Badge>
                          )}
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      {/* Expanded List */}
                      {isExpanded && (
                        <div className="border-t border-border">
                          {/* Bulk actions bar */}
                          <div className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/30">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={allSelected}
                                onCheckedChange={() => toggleSelectAll(cat.key)}
                                className="data-[state=indeterminate]:bg-primary"
                                {...(someSelected && !allSelected ? { 'data-state': 'indeterminate' } : {})}
                              />
                              <span className="text-xs text-muted-foreground">
                                {selectedCount > 0 ? `${selectedCount} selected` : 'Select all'}
                              </span>
                            </div>
                            {selectedCount > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleArchiveSelected(cat.key)}
                                disabled={isProcessing}
                                className="h-7 text-xs gap-1"
                              >
                                <Archive className="w-3 h-3" />
                                {cat.actionLabel} ({selectedCount})
                              </Button>
                            )}
                          </div>

                          {/* Quote rows */}
                          <div className="max-h-60 overflow-y-auto divide-y divide-border">
                            {catIssues.map(issue => (
                              <div
                                key={issue.quoteId}
                                className="flex items-center gap-3 px-3 py-2 hover:bg-muted/20 transition-colors"
                              >
                                <Checkbox
                                  checked={selectedIds.has(issue.quoteId)}
                                  onCheckedChange={() => toggleSelect(issue.quoteId)}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-mono text-xs truncate max-w-[120px]">
                                      {issue.quoteDisplayId}
                                    </span>
                                    <span className="text-sm truncate">{issue.companyName}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{issue.createdAt ? format(new Date(issue.createdAt), 'MMM d, yyyy') : '—'}</span>
                                    {issue.status && (
                                      <Badge variant="outline" className="text-[10px] h-4 px-1">
                                        {issue.status}
                                      </Badge>
                                    )}
                                    {issue.issues.length > 1 && (
                                      <span className="text-yellow-600 dark:text-yellow-400">
                                        +{issue.issues.length - 1} more issue{issue.issues.length > 2 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {completedActions.size > 0 && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                ✓ {completedActions.size} quote{completedActions.size !== 1 ? 's' : ''} tidied up this session.
                Changes are saved — quotes list will refresh when you close.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.label}? This will set their status to "lost" with an archive note.
              This action can be reversed by changing the status back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmAction && executeArchive(confirmAction.ids)}
              disabled={isProcessing}
              className="gap-1"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
              {isProcessing ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
