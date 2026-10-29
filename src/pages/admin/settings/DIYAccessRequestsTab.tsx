import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Loader2, Check, X, Calculator, RefreshCw, Mail, Clock } from 'lucide-react';
import { format } from 'date-fns';

type RequestStatus = 'pending' | 'approved' | 'rejected';

interface DIYRequest {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  company: string | null;
  reason: string | null;
  status: RequestStatus;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
}

const statusBadge: Record<RequestStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  approved: { label: 'Approved', className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
  rejected: { label: 'Rejected', className: 'bg-destructive/15 text-destructive border-destructive/30' },
};

export default function DIYAccessRequestsTab() {
  const { user } = useAdminAuth();
  const [requests, setRequests] = useState<DIYRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<DIYRequest | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data, error } = await supabase
        .from('diy_access_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRequests((data as DIYRequest[]) ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const updateStatus = async (req: DIYRequest, status: RequestStatus, note?: string) => {
    setBusyId(req.id);
    try {
      const { error } = await supabase
        .from('diy_access_requests')
        .update({
          status,
          review_note: note ?? null,
          reviewed_by: user?.id ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', req.id);
      if (error) throw error;
      toast.success(
        status === 'approved'
          ? `Approved ${req.full_name || req.email || 'partner'} for DIY Quote access`
          : `Rejected ${req.full_name || req.email || 'partner'}'s request`,
      );
      await fetchRequests();
    } catch {
      toast.error('Could not update the request. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Approve partners to use the DIY Quote Builder. Approved partners can save and load only the
          quotes they manage.
        </p>
        <Button variant="outline" size="sm" onClick={fetchRequests} className="shrink-0">
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4 text-sm">
            Couldn't load access requests.{' '}
            <button onClick={fetchRequests} className="text-primary underline">Try again</button>.
          </CardContent>
        </Card>
      )}

      {!error && requests.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No DIY Quote Builder access requests yet.</p>
          </CardContent>
        </Card>
      )}

      {pendingCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <Clock className="h-4 w-4" />
          {pendingCount} request{pendingCount === 1 ? '' : 's'} awaiting review
        </div>
      )}

      <div className="space-y-3">
        {requests.map((req) => {
          const badge = statusBadge[req.status];
          return (
            <Card key={req.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    {req.full_name || 'Unnamed partner'}
                    <Badge variant="outline" className={badge.className}>{badge.label}</Badge>
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(req.created_at), 'd MMM yyyy, h:mma')}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {req.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" /> {req.email}
                    </span>
                  )}
                  {req.company && <span>{req.company}</span>}
                </div>
                {req.reason && (
                  <p className="text-sm bg-muted/50 rounded-md p-3 text-foreground">{req.reason}</p>
                )}
                {req.status === 'rejected' && req.review_note && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Note:</span> {req.review_note}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {req.status !== 'approved' && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(req, 'approved')}
                      disabled={busyId === req.id}
                      className="min-h-[40px]"
                    >
                      {busyId === req.id ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-1" />
                      )}
                      Approve
                    </Button>
                  )}
                  {req.status !== 'rejected' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setRejectTarget(req); setRejectNote(req.review_note ?? ''); }}
                      disabled={busyId === req.id}
                      className="min-h-[40px]"
                    >
                      <X className="h-4 w-4 mr-1" />
                      {req.status === 'approved' ? 'Revoke' : 'Reject'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={!!rejectTarget} onOpenChange={(o) => { if (!o) setRejectTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {rejectTarget?.status === 'approved' ? 'Revoke DIY Quote access?' : 'Reject this request?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {rejectTarget?.status === 'approved'
                ? 'The partner will lose Save/Load access to the Quote Builder.'
                : 'The partner can update their reason and re-apply later. Add an optional note explaining why.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Optional note shown to the partner"
            rows={3}
            maxLength={500}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (rejectTarget) updateStatus(rejectTarget, 'rejected', rejectNote.trim() || undefined);
                setRejectTarget(null);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
