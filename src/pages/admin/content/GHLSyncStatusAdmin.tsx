import { useState } from "react";
import { SourceSyncHealth } from '@/components/admin/SourceSyncHealth';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/supabasePaging";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { capitalizeText } from "@/lib/textFormatting";
import { getGHLContactUrl } from "@/lib/ghlConfig";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ExternalLink,
  RotateCcw,
  Tag,
  History,
  CloudOff,
  Mail,
  Users,
  Activity,
  Zap,
  XCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadPanelErrorState } from "@/components/admin/LeadPanelErrorState";

interface GHLSubmission {
  id: string;
  lead_email: string;
  lead_name: string | null;
  lead_first_name: string | null;
  lead_last_name: string | null;
  source_page: string;
  source_medium: string;
  source_campaign: string | null;
  lead_source: string | null;
  ghl_status: string;
  ghl_response: Record<string, unknown> | null;
  created_at: string;
  archived_at: string | null;
}

interface GHLSyncHistory {
  id: string;
  submission_id: string | null;
  lead_email: string;
  sync_type: string;
  sync_status: string;
  ghl_contact_id: string | null;
  ghl_response: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
}

// Helper to check if submission is synced AND verified in GHL
const isGHLSynced = (submission: GHLSubmission): boolean => {
  const response = submission.ghl_response as Record<string, unknown> | null;
  if (response?.ghl_synced === true && response?.ghl_verified === true) {
    return true;
  }
  if (submission.ghl_status === 'synced' && response?.ghl_contact_id) {
    return true;
  }
  if (['confirmed', 'cancelled', 'rescheduled'].includes(submission.ghl_status)) {
    return true;
  }
  return false;
};

// Check if sync has failed
const hasSyncFailed = (submission: GHLSubmission): boolean => {
  const response = submission.ghl_response as Record<string, unknown> | null;
  const syncError = response?.ghl_sync_error as string | undefined;
  if (syncError && !syncError.includes('Skipped for booking_shown')) {
    return true;
  }
  if (response?.ghl_synced === true && response?.ghl_verified === false) {
    return true;
  }
  return false;
};

// Get sync status category
const getSyncCategory = (submission: GHLSubmission): 'synced' | 'failed' | 'pending' => {
  if (isGHLSynced(submission)) return 'synced';
  if (hasSyncFailed(submission)) return 'failed';
  return 'pending';
};

// Get tags from submission
const getTagsFromSubmission = (submission: GHLSubmission): string[] => {
  const response = submission.ghl_response as Record<string, unknown> | null;
  const tags = response?.tags_applied as string[] | undefined;
  return tags || [];
};

export default function GHLSyncStatusAdmin() {
  const queryClient = useQueryClient();
  const { session } = useAdminAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'synced' | 'failed' | 'pending'>('all');
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());
  const [isBulkRetrying, setIsBulkRetrying] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  // Query all submissions
  const { data: submissions, isLoading, refetch, isError: submissionsError } = useQuery({
    queryKey: ["ghl-sync-submissions"],
    queryFn: async () => {
      // Paged, not `.limit(1000)`. PostgREST caps a response at 1000 rows, so
      // that limit meant "the first thousand" — and every tile on this page is
      // computed from this array. At 876 live submissions the counts were
      // months away from silently going wrong.
      return (await fetchAllRows<GHLSubmission>(
        "ghl_submissions",
        (q) => q.is("archived_at", null),
      ));
    },
    refetchInterval: 30000,
  });

  // Query sync history for selected email
  const { data: selectedHistory, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["ghl-sync-history-selected", selectedEmail],
    queryFn: async () => {
      if (!selectedEmail) return [];
      
      const { data, error } = await supabase
        .from("ghl_sync_history")
        .select("*")
        .eq("lead_email", selectedEmail)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as GHLSyncHistory[];
    },
    enabled: !!selectedEmail,
  });

  // Query all recent sync history
  const { data: allHistory, isLoading: isAllHistoryLoading } = useQuery({
    queryKey: ["ghl-sync-history-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ghl_sync_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      
      if (error) throw error;
      return data as GHLSyncHistory[];
    },
  });

  // Retry sync function
  const retrySync = async (submission: GHLSubmission) => {
    setRetryingIds(prev => new Set(prev).add(submission.id));
    try {
      const response = await supabase.functions.invoke('log-ghl-submission', {
        body: {
          submission_id: submission.id,
          lead_email: submission.lead_email,
          lead_name: submission.lead_name,
          source_page: submission.source_page,
          source_medium: submission.source_medium,
          source_campaign: submission.source_campaign,
          ghl_status: 'submitted',
          ghl_response: { sync_type: 'retry' },
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to sync to GHL');
      }

      const data = response.data;
      if (data?.ghl_synced && data?.ghl_verified) {
        toast.success('Successfully synced to GHL');
      } else if (data?.error) {
        toast.error('Sync failed', { description: data.error });
      } else {
        toast.warning('Sync completed but not verified');
      }

      queryClient.invalidateQueries({ queryKey: ['ghl-sync-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['ghl-sync-history-all'] });
    } catch (error) {
      toast.error('Failed to sync to GHL', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setRetryingIds(prev => {
        const next = new Set(prev);
        next.delete(submission.id);
        return next;
      });
    }
  };

  // Bulk retry all failed syncs
  const bulkRetryFailed = async () => {
    const failedSubmissions = submissions?.filter(s => getSyncCategory(s) === 'failed') || [];
    if (failedSubmissions.length === 0) {
      toast.info('No failed syncs to retry');
      return;
    }

    setIsBulkRetrying(true);
    let successCount = 0;
    let failCount = 0;

    for (const submission of failedSubmissions) {
      try {
        const response = await supabase.functions.invoke('log-ghl-submission', {
          body: {
            submission_id: submission.id,
            lead_email: submission.lead_email,
            lead_name: submission.lead_name,
            source_page: submission.source_page,
            source_medium: submission.source_medium,
            source_campaign: submission.source_campaign,
            ghl_status: 'submitted',
            ghl_response: { sync_type: 'bulk_retry' },
          },
        });

        if (response.error) {
          failCount++;
        } else if (response.data?.ghl_synced && response.data?.ghl_verified) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setIsBulkRetrying(false);

    if (successCount > 0) {
      toast.success(`Successfully synced ${successCount} contact${successCount > 1 ? 's' : ''}`);
    }
    if (failCount > 0) {
      toast.error(`Failed to sync ${failCount} contact${failCount > 1 ? 's' : ''}`);
    }

    queryClient.invalidateQueries({ queryKey: ['ghl-sync-submissions'] });
    queryClient.invalidateQueries({ queryKey: ['ghl-sync-history-all'] });
  };

  // Calculate stats
  const stats = {
    total: submissions?.length || 0,
    synced: submissions?.filter(s => getSyncCategory(s) === 'synced').length || 0,
    failed: submissions?.filter(s => getSyncCategory(s) === 'failed').length || 0,
    pending: submissions?.filter(s => getSyncCategory(s) === 'pending').length || 0,
  };

  // Filter submissions
  const filteredSubmissions = submissions?.filter(sub => {
    if (statusFilter !== 'all' && getSyncCategory(sub) !== statusFilter) {
      return false;
    }
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      sub.lead_email.toLowerCase().includes(q) ||
      sub.lead_name?.toLowerCase().includes(q)
    );
  });

  // Get selected submission for tag display
  const selectedSubmission = selectedEmail 
    ? submissions?.find(s => s.lead_email === selectedEmail)
    : null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* This page answers ONE question: every source, and how much of it
          reached GoHighLevel. Cron health, the API version probe, content
          freshness and the findings log moved to System Health — they are
          questions about the machinery, not about whether a contact synced,
          and they were buried under the submissions table here.
          The follower pull panel is gone entirely: it runs hourly on its own,
          and a button someone has to remember to press is not a sync. */}
      <SourceSyncHealth />

      {submissionsError && <LeadPanelErrorState panelName="GHL sync status" />}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">GHL Sync Status</h1>
          <p className="text-muted-foreground">Monitor and manage GoHighLevel synchronization</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {stats.failed > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={bulkRetryFailed}
              disabled={isBulkRetrying}
            >
              {isBulkRetrying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retry All Failed ({stats.failed})
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            statusFilter === 'all' && "ring-2 ring-primary"
          )}
          onClick={() => setStatusFilter('all')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            statusFilter === 'synced' && "ring-2 ring-emerald-500"
          )}
          onClick={() => setStatusFilter('synced')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Synced
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.synced}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.synced / stats.total) * 100) : 0}% success rate
            </p>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            statusFilter === 'failed' && "ring-2 ring-red-500"
          )}
          onClick={() => setStatusFilter('failed')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            statusFilter === 'pending' && "ring-2 ring-amber-500"
          )}
          onClick={() => setStatusFilter('pending')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Not yet synced</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'overview' | 'history')}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="h-4 w-4" />
            Sync Overview
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Sync History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="synced">Synced</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Last Sync</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No submissions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubmissions?.map((submission) => {
                        const category = getSyncCategory(submission);
                        const tags = getTagsFromSubmission(submission);
                        const response = submission.ghl_response as Record<string, unknown> | null;
                        const contactId = response?.ghl_contact_id as string | undefined;
                        const syncError = response?.ghl_sync_error as string | undefined;
                        const isRetrying = retryingIds.has(submission.id);

                        return (
                          <TableRow key={submission.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {submission.lead_name || submission.lead_email.split('@')[0]}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {submission.lead_email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "gap-1",
                                  category === 'synced' && "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
                                  category === 'failed' && "bg-red-500/10 text-red-700 border-red-500/20",
                                  category === 'pending' && "bg-amber-500/10 text-amber-700 border-amber-500/20"
                                )}
                              >
                                {category === 'synced' && <CheckCircle2 className="h-3 w-3" />}
                                {category === 'failed' && <XCircle className="h-3 w-3" />}
                                {category === 'pending' && <Clock className="h-3 w-3" />}
                                {category === 'synced' ? 'Synced' : category === 'failed' ? 'Failed' : 'Pending'}
                              </Badge>
                              {syncError && (
                                <p className="text-xs text-red-600 mt-1 max-w-[200px] truncate" title={syncError}>
                                  {syncError}
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-[250px]">
                                {tags.slice(0, 3).map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {tags.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{tags.length - 3}
                                  </Badge>
                                )}
                                {tags.length === 0 && (
                                  <span className="text-xs text-muted-foreground">No tags</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {response?.synced_at 
                                  ? format(new Date(response.synced_at as string), 'MMM d, h:mm a')
                                  : format(new Date(submission.created_at), 'MMM d, h:mm a')
                                }
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedEmail(submission.lead_email)}
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                                {contactId && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                  >
                                    <a href={getGHLContactUrl(contactId)} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                                {category !== 'synced' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => retrySync(submission)}
                                    disabled={isRetrying}
                                  >
                                    {isRetrying ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <RotateCcw className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Sync Activity
              </CardTitle>
              <CardDescription>
                Last 200 sync attempts across all leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAllHistoryLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {allHistory?.map((history) => (
                      <div
                        key={history.id}
                        className={cn(
                          "p-4 rounded-lg border",
                          history.sync_status === 'success' && "bg-emerald-500/5 border-emerald-500/20",
                          history.sync_status === 'failed' && "bg-red-500/5 border-red-500/20",
                          !['success', 'failed'].includes(history.sync_status) && "bg-muted/30"
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {history.sync_status === 'success' ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                              ) : history.sync_status === 'failed' ? (
                                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                              ) : (
                                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              )}
                              <span className="font-medium truncate">{history.lead_email}</span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs flex-shrink-0",
                                  history.sync_status === 'success' && "bg-emerald-500/10 text-emerald-700",
                                  history.sync_status === 'failed' && "bg-red-500/10 text-red-700"
                                )}
                              >
                                {capitalizeText(history.sync_status)}
                              </Badge>
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                {history.sync_type === 'initial' ? 'Initial' :
                                 history.sync_type === 'retry' ? 'Retry' :
                                 history.sync_type === 'bulk_retry' ? 'Bulk' :
                                 capitalizeText(history.sync_type)}
                              </Badge>
                            </div>
                            {history.error_message && (
                              <p className="text-sm text-red-600 mt-1">{history.error_message}</p>
                            )}
                            {history.ghl_contact_id && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Contact: <code className="bg-muted px-1 rounded">{history.ghl_contact_id}</code>
                              </p>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(history.created_at), 'MMM d, h:mm a')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Sync Details: {selectedEmail}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Tags Section */}
            {selectedSubmission && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Applied Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {getTagsFromSubmission(selectedSubmission).length > 0 ? (
                    getTagsFromSubmission(selectedSubmission).map((tag, i) => (
                      <Badge key={i} variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No tags applied</p>
                  )}
                </div>
              </div>
            )}

            {/* Sync History */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Sync History
              </h4>
              {isHistoryLoading ? (
                <div className="space-y-2">
                  {[1, 2].map(i => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : selectedHistory && selectedHistory.length > 0 ? (
                <ScrollArea className="h-[300px] rounded-lg border">
                  <div className="divide-y">
                    {selectedHistory.map((history) => (
                      <div
                        key={history.id}
                        className={cn(
                          "p-3",
                          history.sync_status === 'success' && "bg-emerald-500/5",
                          history.sync_status === 'failed' && "bg-red-500/5"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {history.sync_status === 'success' ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : history.sync_status === 'failed' ? (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-muted-foreground" />
                            )}
                            <Badge variant="outline" className="text-xs">
                              {capitalizeText(history.sync_status)}
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-slate-500/10">
                              {capitalizeText(history.sync_type)}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(history.created_at), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        {history.ghl_contact_id && (
                          <p className="text-xs text-muted-foreground">
                            Contact ID: <code className="bg-muted px-1 rounded">{history.ghl_contact_id}</code>
                          </p>
                        )}
                        {history.error_message && (
                          <p className="text-xs text-red-600 mt-1">{history.error_message}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
                  No sync history available
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setSelectedEmail(null)}>
                Close
              </Button>
              {selectedSubmission && getSyncCategory(selectedSubmission) !== 'synced' && (
                <Button onClick={() => {
                  retrySync(selectedSubmission);
                  setSelectedEmail(null);
                }}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retry Sync
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
