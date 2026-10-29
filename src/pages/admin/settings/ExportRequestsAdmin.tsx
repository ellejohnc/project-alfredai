import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Download, CheckCircle, XCircle, Clock, Shield, RefreshCw, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
  approved: { label: 'Approved', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle },
  denied: { label: 'Denied', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle },
};

export default function ExportRequestsAdmin() {
  const { user } = useAdminAuth();
  const { isSuperAdmin } = usePermissions();
  const queryClient = useQueryClient();
  const [reviewDialog, setReviewDialog] = useState<{ id: string; action: 'approved' | 'denied' } | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const { data: requests, isLoading, refetch } = useQuery({
    queryKey: ['export-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('export_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Realtime subscription for instant updates
  useEffect(() => {
    const channel = supabase
      .channel('export-requests-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'export_requests' }, () => {
        queryClient.invalidateQueries({ queryKey: ['export-requests'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const { error } = await supabase
        .from('export_requests')
        .update({
          status,
          reviewed_by: user?.id,
          reviewed_by_email: user?.email,
          reviewed_at: new Date().toISOString(),
          review_notes: notes || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(`Export request ${variables.status}`);
      queryClient.invalidateQueries({ queryKey: ['export-requests'] });
      setReviewDialog(null);
      setReviewNotes('');
    },
    onError: (err) => {
      toast.error('Failed to update request: ' + (err as Error).message);
    },
  });

  const handleReview = () => {
    if (!reviewDialog) return;
    reviewMutation.mutate({ id: reviewDialog.id, status: reviewDialog.action, notes: reviewNotes });
  };

  const pendingCount = requests?.filter((r) => r.status === 'pending').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <FileDown className="h-6 w-6 text-primary" />
            Export Requests
            {pendingCount > 0 && (
              <Badge className="bg-amber-500 text-white ml-2">{pendingCount} pending</Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isSuperAdmin ? 'Review and approve data export requests from team members' : 'View your export request status'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="touch-manipulation">
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[600px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !requests?.length ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No export requests yet</div>
            ) : (
              <div className="divide-y divide-border">
                {requests.map((req) => {
                  const config = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                  const StatusIcon = config.icon;

                  return (
                    <div key={req.id} className="px-4 py-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground">{req.requested_by_email}</span>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${config.color}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground mt-1">
                            <Download className="h-3.5 w-3.5 inline mr-1 text-muted-foreground" />
                            Export: <strong>{req.export_type}</strong>
                          </p>
                          {req.export_description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{req.export_description}</p>
                          )}
                          {req.reviewed_by_email && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Reviewed by {req.reviewed_by_email} • {format(new Date(req.reviewed_at!), 'MMM d, HH:mm')}
                              {req.review_notes && ` — "${req.review_notes}"`}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(req.created_at), 'MMM d, HH:mm')}
                          </span>
                          {isSuperAdmin && req.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 touch-manipulation"
                                onClick={() => setReviewDialog({ id: req.id, action: 'approved' })}
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs text-red-600 border-red-500/30 hover:bg-red-500/10 touch-manipulation"
                                onClick={() => setReviewDialog({ id: req.id, action: 'denied' })}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Deny
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!reviewDialog} onOpenChange={(open) => !open && setReviewDialog(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>
              {reviewDialog?.action === 'approved' ? 'Approve Export Request' : 'Deny Export Request'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {reviewDialog?.action === 'approved'
                ? 'This will allow the user to proceed with the data export.'
                : 'This will deny the export request. Please provide a reason.'}
            </p>
            <Textarea
              placeholder="Add notes (optional for approval, recommended for denial)..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(null)} className="touch-manipulation">
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={reviewMutation.isPending}
              className={`touch-manipulation ${
                reviewDialog?.action === 'approved'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {reviewMutation.isPending ? 'Processing...' : reviewDialog?.action === 'approved' ? 'Approve' : 'Deny'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
