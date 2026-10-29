import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import type { UnifiedLead } from '@/lib/unifiedLead';
import { usePermissions } from '@/hooks/usePermissions';

/**
 * Investor Approve / Reject / Resend access-code actions surfaced INSIDE the
 * unified record's "Investor details" card. Reuses the same edge functions
 * that InvestorLeadsAdmin's legacy dialog invokes:
 *   - `approve-investor-access` (with `{ resend: true }` for resend)
 *   - `reject-investor-access`  (with `rejectionReason`)
 */
export function InvestorAdminActions({ lead }: { lead: UnifiedLead }) {
  const { isAdmin } = usePermissions();
  const qc = useQueryClient();
  const raw = (lead.raw ?? {}) as Record<string, unknown>;
  const status: string = (raw.status ?? '').toString();
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';

  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [resending, setResending] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');

  if (!isAdmin) return null;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['unified-leads'] });
    qc.invalidateQueries({ queryKey: ['investor-leads'] });
  };

  const approve = async () => {
    setApproving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const { error } = await supabase.functions.invoke('approve-investor-access', {
        body: { investorId: lead.id },
        headers: { Authorization: `Bearer ${sessionData.session?.access_token}` },
      });
      if (error) throw new Error(error.message);
      toast.success(`Approved ${lead.name} — access code sent`);
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve investor');
    } finally {
      setApproving(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const { error } = await supabase.functions.invoke('approve-investor-access', {
        body: { investorId: lead.id, resend: true },
        headers: { Authorization: `Bearer ${sessionData.session?.access_token}` },
      });
      if (error) throw new Error(error.message);
      toast.success(`Access code resent to ${lead.email ?? 'investor'}`);
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend access code');
    } finally {
      setResending(false);
    }
  };

  const reject = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setRejecting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const { error } = await supabase.functions.invoke('reject-investor-access', {
        body: { investorId: lead.id, rejectionReason: reason.trim() },
        headers: { Authorization: `Bearer ${sessionData.session?.access_token}` },
      });
      if (error) throw new Error(error.message);
      toast.success(`Rejected ${lead.name} — notification sent`);
      setShowReject(false);
      setReason('');
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject investor');
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="pt-3 mt-1 border-t flex flex-wrap gap-2">
      {!isApproved && !isRejected && (
        <Button size="sm" onClick={approve} disabled={approving} className="min-h-[40px]">
          {approving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
          Approve
        </Button>
      )}
      {!isRejected && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowReject(true)}
          disabled={rejecting}
          className="min-h-[40px]"
        >
          <XCircle className="h-4 w-4 mr-2" />
          Reject
        </Button>
      )}
      {isApproved && (
        <Button size="sm" variant="outline" onClick={resend} disabled={resending} className="min-h-[40px]">
          {resending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
          Resend access code
        </Button>
      )}

      <AlertDialog open={showReject} onOpenChange={setShowReject}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject {lead.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They'll receive an email with the reason below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejection…"
            rows={4}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rejecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={rejecting || !reason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => { e.preventDefault(); void reject(); }}
            >
              {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
