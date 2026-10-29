import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  ChevronDown, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Send,
  FileSignature,
  Loader2,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';

interface QuoteBulkActionsProps {
  selectedIds: string[];
  quotes: Array<{
    id: string;
    quote_id: string | null;
    company_name: string | null;
    contact_name: string | null;
    contact_email: string | null;
    status: string | null;
    signed_at?: string | null;
  }>;
  onSuccess: () => void;
  onClearSelection: () => void;
}

export function QuoteBulkActions({ 
  selectedIds, 
  quotes, 
  onSuccess, 
  onClearSelection 
}: QuoteBulkActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [pendingStatusReversion, setPendingStatusReversion] = useState<string | null>(null);

  const selectedQuotes = quotes.filter(q => selectedIds.includes(q.id));

  const handleStatusChange = async (newStatus: string) => {
    // Block direct admin setting of "signed" status
    if (newStatus === 'signed') {
      toast.error('Quotes can only be signed via the proposal page');
      return;
    }

    // Check if any selected quotes are reverting from signed status
    const quotesRevertingFromSigned = selectedQuotes.filter(q => 
      (q.status === 'signed' || q.status === 'won') && 
      (newStatus === 'draft' || newStatus === 'sent') &&
      q.signed_at
    );

    if (quotesRevertingFromSigned.length > 0) {
      setPendingStatusReversion(newStatus);
      return;
    }

    await executeStatusChange(newStatus);
  };

  const executeStatusChange = async (newStatus: string) => {
    const quotesRevertingFromSigned = selectedQuotes.filter(q => 
      (q.status === 'signed' || q.status === 'won') && 
      (newStatus === 'draft' || newStatus === 'sent') &&
      q.signed_at
    );

    setIsLoading(true);
    setPendingAction(`status-${newStatus}`);
    setPendingStatusReversion(null);

    try {
      // Build update payload
      const updatePayload: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // Clear signature fields if reverting from signed
      if (quotesRevertingFromSigned.length > 0) {
        const revertingIds = quotesRevertingFromSigned.map(q => q.id);
        
        // Update quotes with signature field resets
        const { error: revertError } = await supabase
          .from('quotes')
          .update({
            ...updatePayload,
            signed_at: null,
            signed_by_name: null,
            signed_by_email: null,
            signature_ip_hash: null,
            handover_status: 'pending',
            handover_triggered_at: null
          })
          .in('id', revertingIds);

        if (revertError) throw revertError;

        // Supersede payment links and cancel handover requests
        const revertingQuoteIds = quotesRevertingFromSigned.map(q => q.quote_id).filter(Boolean);
        if (revertingQuoteIds.length > 0) {
          await supabase
            .from('quote_payments')
            .update({ status: 'superseded' })
            .in('quote_id', revertingQuoteIds)
            .eq('status', 'pending');
        }

        await supabase
          .from('handover_requests')
          .update({ status: 'cancelled' })
          .in('quote_id', revertingIds)
          .neq('status', 'completed');

        // Update remaining quotes (without signature resets)
        const nonRevertingIds = selectedIds.filter(id => !revertingIds.includes(id));
        if (nonRevertingIds.length > 0) {
          const { error } = await supabase
            .from('quotes')
            .update(updatePayload)
            .in('id', nonRevertingIds);

          if (error) throw error;
        }
      } else {
        // Simple update for all selected quotes
        const { error } = await supabase
          .from('quotes')
          .update(updatePayload)
          .in('id', selectedIds);

        if (error) throw error;
      }

      toast.success(`${selectedIds.length} quote(s) updated to "${newStatus}"`);
      onSuccess();
      onClearSelection();
    } catch (err: unknown) {
      console.error('Bulk status update failed:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update quotes');
    } finally {
      setIsLoading(false);
      setPendingAction(null);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    setPendingAction('delete');
    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .in('id', selectedIds);

      if (error) throw error;

      toast.success(`${selectedIds.length} quote(s) deleted`);
      onSuccess();
      onClearSelection();
    } catch (err) {
      console.error('Bulk delete failed:', err);
      toast.error(err.message || 'Failed to delete quotes');
    } finally {
      setIsLoading(false);
      setPendingAction(null);
      setShowDeleteDialog(false);
    }
  };

  const handleExportSelected = () => {
    if (selectedQuotes.length === 0) {
      toast.error('No quotes selected');
      return;
    }

    const headers = [
      'Quote ID',
      'Company Name',
      'Contact Name',
      'Contact Email',
      'Status',
    ];

    const rows = selectedQuotes.map(quote => [
      quote.quote_id || '',
      quote.company_name || '',
      quote.contact_name || '',
      quote.contact_email || '',
      quote.status || 'draft',
    ]);

    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `quotes-selected-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${selectedQuotes.length} selected quotes`);
  };

  if (selectedIds.length === 0) return null;

  return (
    <>
      <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
        <Badge variant="secondary" className="gap-1">
          {selectedIds.length} selected
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Bulk Actions
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-popover border shadow-lg z-50 min-w-[180px]">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <CheckCircle className="h-4 w-4 mr-2" />
                Change Status
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="bg-popover border shadow-lg z-50">
                <DropdownMenuItem onClick={() => handleStatusChange('draft')}>
                  <span className="h-2 w-2 rounded-full bg-gray-400 mr-2" />
                  Draft
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('sent')}>
                  <span className="h-2 w-2 rounded-full bg-blue-500 mr-2" />
                  Sent
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleStatusChange('signed')}
                  disabled
                  className="opacity-50"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500 mr-2" />
                  Signed (via proposal only)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('won')}>
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                  Won
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('refunded')}>
                  <span className="h-2 w-2 rounded-full bg-amber-500 mr-2" />
                  Refunded
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('lost')}>
                  <span className="h-2 w-2 rounded-full bg-red-500 mr-2" />
                  Lost
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuItem onClick={handleExportSelected}>
              <Download className="h-4 w-4 mr-2" />
              Export Selected
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem 
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearSelection}
          className="text-muted-foreground"
        >
          <XCircle className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete {selectedIds.length} Quote(s)?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected quotes 
              and all associated data including version history and signatures.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Reversion Confirmation Dialog */}
      <AlertDialog open={!!pendingStatusReversion} onOpenChange={() => setPendingStatusReversion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revert Signed Quotes?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-3">
                  Some selected quotes have signatures. Changing status to "{pendingStatusReversion}" will:
                </p>
                <ul className="text-sm space-y-1.5 list-disc list-inside text-muted-foreground">
                  <li>Clear all signature data</li>
                  <li>Cancel handover requests</li>
                  <li>Invalidate payment links</li>
                  <li>Require clients to re-sign</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading} className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingStatusReversion && executeStatusChange(pendingStatusReversion)}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-h-[44px]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Yes, Revert Quotes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
