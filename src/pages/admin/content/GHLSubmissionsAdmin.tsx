import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { LeadOverlayBadges } from "@/components/admin/leads/LeadOverlayWidgets";
import { SourceBadge, LeadStatusPill } from "@/components/admin/leads/SourceBadge";
import { leadStatusLabel } from "@/lib/unifiedLead";
import { LegacyLeadActions } from "@/components/admin/leads/LegacyLeadActions";
import { LeadQuickView } from "@/components/admin/leads/LeadQuickView";
import { toast } from "sonner";
import { format } from "date-fns";
import { getGHLSyncStatus, isGHLSynced as sharedIsGHLSynced, type GHLSyncIcon } from "@/lib/ghlSyncStatus";
import { GHLSyncDot } from "@/components/admin/GHLSyncDot";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { capitalizeText, formatSource, formatCampaign, formatName, formatDisplayName } from "@/lib/textFormatting";
import { LeadPanelErrorState } from "@/components/admin/LeadPanelErrorState";
import { useRecordHistory } from "@/hooks/useRecordHistory";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WebhookActivityPanel } from "@/components/admin/WebhookActivityPanel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  CheckCircle2,
  Clock,
  Download,
  MessageSquare,
  FileText,
  Megaphone,
  Mail,
  UserPlus,
  Handshake,
  Globe,
  Calendar,
  Building,
  CloudOff,
  AlertCircle,
  RotateCcw,
  Loader2,
  Trash2,
  Archive,
  ArchiveRestore,
  Sparkles,
  Phone,
  Send,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DateRangeFilter, DatePreset } from "@/components/admin/DateRangeFilter";
import { getDateFilterBounds } from "@/components/admin/dateFilterBounds";
import { standardSortOptions } from "@/components/admin";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminMetricsStrip } from "@/components/admin/AdminMetricsStrip";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { AdminActionsRow } from "@/components/admin/AdminActionsRow";

interface GHLSubmission {
  id: string;
  lead_email: string;
  lead_name: string | null;
  lead_first_name: string | null;
  lead_last_name: string | null;
  lead_phone: string | null;
  lead_company: string | null;
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

// Status labels - more meaningful names
const statusLabels: Record<string, string> = {
  submitted: "Lead Captured",
  synced: "Synced to GHL",
  confirmed: "Synced to GHL",
  failed: "Failed",
  booking_shown: "Booking Viewed",
  cancelled: "Synced to GHL",
  rescheduled: "Synced to GHL",
  deleted_from_ghl: "Deleted",
};

// Helper to get status label
const getStatusLabel = (status: string | null): string => {
  if (!status) return "Unknown";
  return statusLabels[status] || capitalizeText(status);
};

const statusColors: Record<string, string> = {
  submitted: "bg-slate-500/20 text-slate-700 border-slate-500/30",
  synced: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30",
  confirmed: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30",
  failed: "bg-red-500/20 text-red-700 border-red-500/30",
  booking_shown: "bg-amber-500/20 text-amber-700 border-amber-500/30",
  cancelled: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30",
  rescheduled: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30",
  deleted_from_ghl: "bg-rose-500/20 text-rose-700 border-rose-500/30",
};

// Helper to check if submission is synced AND verified in GHL (shared logic)
const isGHLSynced = (submission: GHLSubmission): boolean => sharedIsGHLSynced(submission);

// Get sync status badge info using the shared classifier.
// booking_shown deferrals read as "Awaiting Booking" (amber), never red.
const getSyncStatusBadge = (submission: GHLSubmission): { label: string; color: string; icon: GHLSyncIcon } => {
  const status = getGHLSyncStatus(submission);
  return { label: status.label, color: status.color, icon: status.icon };
};


// Enhanced medium styles with icons and colors
const mediumConfig: Record<string, { icon: typeof Users; label: string; color: string }> = {
  lead_chatbot: { icon: MessageSquare, label: "AI Assistant", color: "bg-violet-500/20 text-violet-700 border-violet-500/30" },
  lead_form: { icon: FileText, label: "Form", color: "bg-slate-500/20 text-slate-700 border-slate-500/30" },
  chatbot: { icon: MessageSquare, label: "AI Assistant", color: "bg-violet-500/20 text-violet-700 border-violet-500/30" },
  form: { icon: FileText, label: "Form", color: "bg-slate-500/20 text-slate-700 border-slate-500/30" },
  booking_modal: { icon: Clock, label: "Booking", color: "bg-amber-500/20 text-amber-700 border-amber-500/30" },
  webhook: { icon: Globe, label: "Webhook", color: "bg-purple-500/20 text-purple-700 border-purple-500/30" },
  header_cta: { icon: Sparkles, label: "Header CTA", color: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30" },
  signup_page: { icon: Sparkles, label: "Get Started Page", color: "bg-cyan-500/20 text-cyan-700 border-cyan-500/30" },
  page_cta: { icon: Sparkles, label: "Page CTA", color: "bg-amber-500/20 text-amber-700 border-amber-500/30" },
  personalization_flow: { icon: Sparkles, label: "Hero CTA", color: "bg-cyan-500/20 text-cyan-700 border-cyan-500/30" },
  ghl_direct_booking: { icon: Calendar, label: "GHL Direct", color: "bg-indigo-500/20 text-indigo-700 border-indigo-500/30" },
};

// Lead source config for badges
const leadSourceConfig: Record<string, { icon: typeof Users; label: string; color: string }> = {
  chatbot: { icon: MessageSquare, label: "Chatbot", color: "bg-violet-500/20 text-violet-700 border-violet-500/30" },
  calendar_widget: { icon: Calendar, label: "Calendar", color: "bg-indigo-500/20 text-indigo-700 border-indigo-500/30" },
  form: { icon: FileText, label: "Form", color: "bg-slate-500/20 text-slate-700 border-slate-500/30" },
  header_cta: { icon: Sparkles, label: "Header CTA", color: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30" },
  signup_page: { icon: Sparkles, label: "Get Started Page", color: "bg-cyan-500/20 text-cyan-700 border-cyan-500/30" },
  page_cta: { icon: Sparkles, label: "Page CTA", color: "bg-amber-500/20 text-amber-700 border-amber-500/30" },
  personalization_flow: { icon: Sparkles, label: "Hero CTA", color: "bg-cyan-500/20 text-cyan-700 border-cyan-500/30" },
  unknown: { icon: Globe, label: "Unknown", color: "bg-muted text-muted-foreground border-border" },
};

// Campaign styles with icons and colors
const campaignConfig: Record<string, { icon: typeof Users; label: string; color: string }> = {
  demo_request: { icon: Megaphone, label: "Demo", color: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30" },
  contact_inquiry: { icon: Mail, label: "Contact", color: "bg-blue-500/20 text-blue-700 border-blue-500/30" },
  contact_form: { icon: Mail, label: "Contact", color: "bg-blue-500/20 text-blue-700 border-blue-500/30" },
  support_request: { icon: Users, label: "Support", color: "bg-orange-500/20 text-orange-700 border-orange-500/30" },
  partnership_inquiry: { icon: Handshake, label: "Partnership", color: "bg-indigo-500/20 text-indigo-700 border-indigo-500/30" },
  newsletter: { icon: UserPlus, label: "Newsletter", color: "bg-pink-500/20 text-pink-700 border-pink-500/30" },
};

// Source page badge helper
const getSourcePageLabel = (sourcePage: string): string => {
  if (!sourcePage || sourcePage === '/') return 'Homepage';
  // Clean up the path for display
  return sourcePage
    .replace(/^\//, '')
    .split('/')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '))
    .join(' › ') || 'Homepage';
};

// Helper components for badges
const MediumBadge = ({ medium }: { medium: string }) => {
  const config = mediumConfig[medium] || { icon: Globe, label: formatSource(medium), color: "bg-muted text-muted-foreground border-border" };
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={cn("gap-1 text-xs font-medium", config.color)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
};

const SourcePageBadge = ({ sourcePage }: { sourcePage: string }) => {
  const label = getSourcePageLabel(sourcePage);
  return (
    <Badge variant="outline" className="gap-1 text-xs font-medium bg-slate-500/10 text-slate-600 border-slate-500/20">
      <FileText className="w-3 h-3" />
      {label}
    </Badge>
  );
};

const LeadSourceBadge = ({ leadSource }: { leadSource: string | null }) => {
  const source = leadSource || 'unknown';
  const config = leadSourceConfig[source] || leadSourceConfig.unknown;
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={cn("gap-1 text-xs font-medium", config.color)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
};

const CampaignBadge = ({ campaign }: { campaign: string | null }) => {
  if (!campaign) return <span className="text-muted-foreground text-sm">—</span>;
  const config = campaignConfig[campaign] || { icon: Globe, label: formatCampaign(campaign), color: "bg-muted text-muted-foreground border-border" };
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={cn("gap-1 text-xs font-medium", config.color)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
};

export default function GHLSubmissionsAdmin() {
  const queryClient = useQueryClient();
  const { session, user } = useAdminAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<GHLSubmission | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [isBulkRetrying, setIsBulkRetrying] = useState(false);
  
  // Initialize filters from URL params
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [mediumFilter, setMediumFilter] = useState<string>(searchParams.get('medium') || 'all');
  const [sourcePageFilter, setSourcePageFilter] = useState<string>(searchParams.get('page') || 'all');
  const [leadSourceFilter, setLeadSourceFilter] = useState<string>(searchParams.get('lead_source') || 'all');
  
  // Date filter state
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [activePreset, setActivePreset] = useState<DatePreset>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GHLSubmission | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteFromGHL, setDeleteFromGHL] = useState(true);
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [bulkDeleteFromGHL, setBulkDeleteFromGHL] = useState(true);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const [isArchiving, setIsArchiving] = useState(false);
  const [isBulkArchiving, setIsBulkArchiving] = useState(false);
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'name_asc' | 'name_desc'>('date_desc');

  // History hook
  const {
    history: submissionHistory,
    newNote,
    setNewNote,
    isAddingNote,
    addNote: handleAddNote,
  } = useRecordHistory({
    recordId: selectedSubmission?.id || null,
    recordType: 'ghl_submission',
    userId: user?.id,
  });

  // Retry sync function
  const retrySync = async (submission: GHLSubmission) => {
    setRetryingId(submission.id);
    try {
      const response = await supabase.functions.invoke('log-ghl-submission', {
        body: {
          submission_id: submission.id, // Pass ID to update existing instead of creating duplicate
          lead_email: submission.lead_email,
          lead_name: submission.lead_name,
          lead_phone: submission.lead_phone,
          lead_company: submission.lead_company,
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
        toast.success('Successfully synced to GHL', {
          description: `Contact verified in GoHighLevel`,
        });
      } else if (data?.error) {
        toast.error('Sync failed', {
          description: data.error,
        });
      } else {
        toast.warning('Sync completed but not verified', {
          description: 'Contact may not exist in GoHighLevel',
        });
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['ghl-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['ghl-sync-history'] });
    } catch (error) {
      console.error('Error retrying sync:', error);
      toast.error('Failed to sync to GHL', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setRetryingId(null);
    }
  };

  // Bulk retry all failed syncs
  const bulkRetrySync = async (submissions: GHLSubmission[]) => {
    const failedSubmissions = submissions.filter(sub => !isGHLSynced(sub));
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
            lead_email: submission.lead_email,
            lead_name: submission.lead_name,
            lead_company: submission.lead_company,
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
      } catch (error) {
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

    // Refresh data including sync history
    queryClient.invalidateQueries({ queryKey: ['ghl-submissions'] });
    queryClient.invalidateQueries({ queryKey: ['ghl-sync-history'] });
  };

  // Delete submission function
  const handleDeleteSubmission = async () => {
    if (!deleteTarget) return;
    if (!session?.access_token) {
      toast.error('Session expired. Please sign in again.');
      return;
    }
    
    setIsDeleting(true);
    try {
      const ghlContactId = deleteTarget.ghl_response?.ghl_contact_id as string | undefined;
      
      const { data, error } = await supabase.functions.invoke('delete-ghl-contact', {
        body: {
          email: deleteTarget.lead_email,
          submission_id: deleteTarget.id,
          contact_id: ghlContactId,
          delete_from_ghl: deleteFromGHL,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to delete submission');
      }

      toast.success('Submission deleted successfully', {
        description: deleteFromGHL && data?.ghl_deleted 
          ? 'Also removed from GoHighLevel'
          : 'Removed from local database',
      });

      setDeleteTarget(null);
      setSelectedSubmission(null);
      queryClient.invalidateQueries({ queryKey: ['ghl-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['ghl-sync-history'] });
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete submission', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk delete function - parallel execution for speed
  const handleBulkDelete = async () => {
    if (selectedSubmissionIds.size === 0) return;
    if (!session?.access_token) {
      toast.error('Session expired. Please sign in again.');
      return;
    }
    
    const submissionsToDelete = submissions?.filter(s => selectedSubmissionIds.has(s.id)) || [];
    const deleteCount = submissionsToDelete.length;
    
    // Optimistic UI update - close dialogs immediately
    setShowBulkDeleteDialog(false);
    setSelectedSubmissionIds(new Set());
    setIsBulkDeleting(true);
    
    // Show progress toast
    const toastId = toast.loading(`Deleting ${deleteCount} submission${deleteCount > 1 ? 's' : ''}...`);

    // Execute all deletions in parallel for speed
    const results = await Promise.allSettled(
      submissionsToDelete.map(async (submission) => {
        const ghlContactId = submission.ghl_response?.ghl_contact_id as string | undefined;
        
        const { error } = await supabase.functions.invoke('delete-ghl-contact', {
          body: {
            email: submission.lead_email,
            submission_id: submission.id,
            contact_id: ghlContactId,
            delete_from_ghl: bulkDeleteFromGHL,
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        
        if (error) throw error;
        return submission.id;
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failCount = results.filter(r => r.status === 'rejected').length;

    setIsBulkDeleting(false);

    // Update toast with result
    if (failCount === 0) {
      toast.success(`Deleted ${successCount} submission${successCount > 1 ? 's' : ''}`, { id: toastId });
    } else if (successCount === 0) {
      toast.error(`Failed to delete ${failCount} submission${failCount > 1 ? 's' : ''}`, { id: toastId });
    } else {
      toast.warning(`Deleted ${successCount}, failed ${failCount}`, { id: toastId });
    }

    // Realtime will handle UI update, but invalidate to ensure consistency
    queryClient.invalidateQueries({ queryKey: ['ghl-submissions'] });
    queryClient.invalidateQueries({ queryKey: ['ghl-sync-history'] });
  };

  // Toggle submission selection
  const toggleSubmissionSelection = (submissionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSubmissionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });
  };

  // Select all submissions
  const selectAllSubmissions = () => {
    const allIds = filteredSubmissions?.map(s => s.id) || [];
    if (allIds.length === selectedSubmissionIds.size && allIds.every(id => selectedSubmissionIds.has(id))) {
      setSelectedSubmissionIds(new Set());
    } else {
      setSelectedSubmissionIds(new Set(allIds));
    }
  };

  // Archive submission (soft delete)
  const handleArchiveSubmission = async (submission: GHLSubmission) => {
    setIsArchiving(true);
    try {
      const { error } = await supabase
        .from('ghl_submissions')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', submission.id);

      if (error) throw error;

      toast.success('Submission archived', {
        description: 'You can restore it from the Archived tab',
      });

      setSelectedSubmission(null);
      queryClient.invalidateQueries({ queryKey: ['ghl-submissions'] });
    } catch (error) {
      console.error('Archive error:', error);
      toast.error('Failed to archive submission');
    } finally {
      setIsArchiving(false);
    }
  };

  // Restore submission from archive and re-sync to GHL
  const handleRestoreSubmission = async (submission: GHLSubmission) => {
    setIsArchiving(true);
    try {
      const { error } = await supabase
        .from('ghl_submissions')
        .update({ archived_at: null })
        .eq('id', submission.id);

      if (error) throw error;

      // Re-sync to GHL on restore
      try {
        await supabase.functions.invoke('log-ghl-submission', {
          body: {
            lead_email: submission.lead_email,
            lead_name: submission.lead_name,
            lead_company: submission.lead_company,
            source_page: submission.source_page,
            source_medium: submission.source_medium,
            source_campaign: submission.source_campaign,
            ghl_status: 'submitted',
            ghl_response: { sync_type: 'restore' },
          },
        });
        toast.success('Submission restored and re-synced to GHL');
      } catch (syncError) {
        console.error('Failed to re-sync to GHL:', syncError);
        toast.success('Submission restored (GHL sync pending)');
      }

      setSelectedSubmission(null);
      queryClient.invalidateQueries({ queryKey: ['ghl-submissions'] });
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Failed to restore submission');
    } finally {
      setIsArchiving(false);
    }
  };

  // Bulk archive submissions
  const handleBulkArchive = async () => {
    if (selectedSubmissionIds.size === 0) return;
    
    setIsBulkArchiving(true);
    try {
      const isRestoring = viewMode === 'archived';
      
      const { error } = await supabase
        .from('ghl_submissions')
        .update({ archived_at: isRestoring ? null : new Date().toISOString() })
        .in('id', Array.from(selectedSubmissionIds));

      if (error) throw error;

      // If restoring, re-sync all to GHL
      if (isRestoring) {
        const submissionsToRestore = submissions?.filter(s => selectedSubmissionIds.has(s.id)) || [];
        let syncSuccess = 0;
        
        for (const sub of submissionsToRestore) {
          try {
            await supabase.functions.invoke('log-ghl-submission', {
              body: {
                lead_email: sub.lead_email,
                lead_name: sub.lead_name,
                lead_company: sub.lead_company,
                source_page: sub.source_page,
                source_medium: sub.source_medium,
                source_campaign: sub.source_campaign,
                ghl_status: 'submitted',
                ghl_response: { sync_type: 'bulk_restore' },
              },
            });
            syncSuccess++;
          } catch (e) {
            console.error('Failed to sync restored submission:', e);
          }
        }
        
        toast.success(`${selectedSubmissionIds.size} submission${selectedSubmissionIds.size > 1 ? 's' : ''} restored`, {
          description: `${syncSuccess} re-synced to GHL`,
        });
      } else {
        toast.success(`${selectedSubmissionIds.size} submission${selectedSubmissionIds.size > 1 ? 's' : ''} archived`);
      }
      
      setSelectedSubmissionIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['ghl-submissions'] });
    } catch (error) {
      console.error('Bulk archive error:', error);
      toast.error('Failed to update submissions');
    } finally {
      setIsBulkArchiving(false);
    }
  };
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (mediumFilter !== 'all') params.set('medium', mediumFilter);
    if (sourcePageFilter !== 'all') params.set('page', sourcePageFilter);
    setSearchParams(params, { replace: true });
  }, [statusFilter, mediumFilter, sourcePageFilter, setSearchParams]);

  // Set up realtime subscription with auto-refresh
  useEffect(() => {
    const channel = supabase
      .channel('ghl-submissions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ghl_submissions',
        },
        (payload) => {
          // Invalidate query to refetch data
          queryClient.invalidateQueries({ queryKey: ['ghl-submissions'] });
          queryClient.invalidateQueries({ queryKey: ['ghl-sync-history'] });
          queryClient.invalidateQueries({ queryKey: ['analytics-ghl'] });
          
          // Show toast for new submissions (excluding calendar-originated ones)
          if (payload.eventType === 'INSERT') {
            const newSubmission = payload.new as GHLSubmission;
            // Only show toast for form submissions, not calendar bookings
            if (newSubmission.lead_source !== 'calendar_widget' && newSubmission.source_medium !== 'ghl_direct_booking') {
              toast.info('New GHL submission received', {
                description: newSubmission.lead_email,
              });
            }
          }
          // NOTE: intentionally no toast on UPDATE status changes — the background
          // GHL verification job re-syncs many rows at once, which previously spammed
          // "Submission status updated" toasts. The query invalidation above still
          // refreshes the table live.
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Get date filter bounds with validation
  const { start: filterStart, end: filterEnd, isValid: isDateValid } = getDateFilterBounds(startDate, endDate);

  const { data: submissions, isLoading, refetch, isError: submissionsError } = useQuery({
    queryKey: ["ghl-submissions", statusFilter, mediumFilter, leadSourceFilter, startDate?.toISOString(), endDate?.toISOString(), viewMode],
    queryFn: async () => {
      let query = supabase
        .from("ghl_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      // Filter by archived status
      if (viewMode === 'active') {
        query = query.is("archived_at", null);
      } else {
        query = query.not("archived_at", "is", null);
      }

      // CRITICAL: Exclude calendar-originated leads - they belong in Meetings panel
      // This includes: ghl_status = confirmed/cancelled/rescheduled (booked appointments)
      // AND lead_source = calendar_widget or source_medium = ghl_direct_booking
      query = query.not("ghl_status", "in", '("confirmed","cancelled","rescheduled")');
      
      // Also exclude direct calendar leads that haven't booked yet
      query = query.not("lead_source", "eq", "calendar_widget");
      query = query.neq("source_medium", "ghl_direct_booking");

      // Don't filter by ghl_status for verified/failed/pending - we filter client-side based on verified status
      if (statusFilter !== "all" && statusFilter !== "verified" && statusFilter !== "failed" && statusFilter !== "pending") {
        query = query.eq("ghl_status", statusFilter);
      }
      if (mediumFilter !== "all") {
        query = query.eq("source_medium", mediumFilter);
      }
      if (leadSourceFilter !== "all") {
        query = query.eq("lead_source", leadSourceFilter);
      }
      if (filterStart) {
        query = query.gte("created_at", filterStart.toISOString());
      }
      if (filterEnd) {
        query = query.lte("created_at", filterEnd.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as GHLSubmission[];
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Deep-link: open a specific record when arriving via ?record=<id> (e.g. from the
  // "View in Admin" button in lead-alert emails). Falls back gracefully if the record
  // is not in the current (active) list — clears the param and lets the user search.
  useEffect(() => {
    const recordId = searchParams.get('record');
    if (!recordId || !submissions) return;
    const match = submissions.find((s) => s.id === recordId);
    if (match) {
      setSelectedSubmission(match);
      const next = new URLSearchParams(searchParams);
      next.delete('record');
      setSearchParams(next, { replace: true });
    } else if (viewMode === 'active') {
      // Not in active view — check the archived list before giving up.
      setViewMode('archived');
    } else {
      toast.error('Lead not found in this list', {
        description: 'It may have been deleted or moved. Try searching by email.',
      });
      const next = new URLSearchParams(searchParams);
      next.delete('record');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, submissions, viewMode]);


  // Query for sync history of selected submission
  const { data: syncHistory, isLoading: isSyncHistoryLoading } = useQuery({
    queryKey: ["ghl-sync-history", selectedSubmission?.id],
    queryFn: async () => {
      if (!selectedSubmission) return [];
      
      const { data, error } = await supabase
        .from("ghl_sync_history")
        .select("*")
        .or(`submission_id.eq.${selectedSubmission.id},lead_email.eq.${selectedSubmission.lead_email}`)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as GHLSyncHistory[];
    },
    enabled: !!selectedSubmission,
  });

  // Get unique source pages for filter dropdown
  const uniqueSourcePages = Array.from(new Set(submissions?.map(s => s.source_page) || [])).sort();

  const filteredSubmissions = submissions?.filter((sub) => {
    // Filter by source page
    if (sourcePageFilter !== 'all' && sub.source_page !== sourcePageFilter) {
      return false;
    }
    
    // Filter by lead source
    if (leadSourceFilter !== 'all') {
      const subLeadSource = sub.lead_source || 'unknown';
      if (subLeadSource !== leadSourceFilter) return false;
    }
    
    // Filter by sync status (client-side using the shared classifier so labels
    // and filter buckets always agree with what the row badge shows).
    if (statusFilter === 'verified') {
      if (!isGHLSynced(sub)) return false;
    } else if (statusFilter === 'failed') {
      if (getGHLSyncStatus(sub).icon !== 'error') return false;
    } else if (statusFilter === 'pending') {
      const s = getGHLSyncStatus(sub);
      if (s.icon !== 'pending') return false;
    } else if (statusFilter === 'awaiting') {
      if (getGHLSyncStatus(sub).icon !== 'awaiting') return false;
    }
    
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const digits = q.replace(/\D/g, '');
    const phone = sub.lead_phone ?? '';
    return (
      sub.lead_email?.toLowerCase().includes(q) ||
      sub.lead_name?.toLowerCase().includes(q) ||
      sub.lead_company?.toLowerCase().includes(q) ||
      sub.source_page?.toLowerCase().includes(q) ||
      phone.toLowerCase().includes(q) ||
      (digits.length >= 3 && phone.replace(/\D/g, '').includes(digits))
    );
  })?.sort((a, b) => {
    const aName = a.lead_name || `${a.lead_first_name || ''} ${a.lead_last_name || ''}`.trim() || '';
    const bName = b.lead_name || `${b.lead_first_name || ''} ${b.lead_last_name || ''}`.trim() || '';
    
    switch (sortBy) {
      case 'date_asc':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'date_desc':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'name_asc':
        return aName.localeCompare(bName);
      case 'name_desc':
        return bName.localeCompare(aName);
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  // Tile counts use the SAME classifier as the Status filter and the row badge,
  // so the number on a tile is the number of rows clicking it shows. Failed used
  // to count every row with ghl_sync_error, which includes the booking_shown
  // deferrals the badge shows as Awaiting Booking — the tile said ~58 and the
  // filter showed 1.
  const syncIcon = (s: GHLSubmission) => getGHLSyncStatus(s).icon;
  const stats = {
    total: submissions?.length || 0,
    synced: submissions?.filter((s) => isGHLSynced(s)).length || 0,
    failed: submissions?.filter((s) => syncIcon(s) === 'error').length || 0,
    notSynced: submissions?.filter((s) => syncIcon(s) === 'pending').length || 0,
  };
  // What "Retry sync" actually retries: every row in the current view that is
  // not synced. The old button showed the Not Synced tile count instead.
  const retryCount = filteredSubmissions?.filter((s) => !isGHLSynced(s)).length || 0;
  const toggleStatus = (value: string) => setStatusFilter(statusFilter === value ? 'all' : value);

  const exportToCSV = () => {
    if (!filteredSubmissions?.length) return;

    const headers = ["Email", "Name", "Phone", "Company", "Source Page", "Source Medium", "Campaign", "Status", "Date"];
    const rows = filteredSubmissions.map((sub) => [
      sub.lead_email,
      sub.lead_name || "",
      sub.lead_phone || "",
      sub.lead_company || "",
      sub.source_page,
      formatSource(sub.source_medium),
      formatCampaign(sub.source_campaign),
      capitalizeText(sub.ghl_status),
      format(new Date(sub.created_at), "yyyy-MM-dd HH:mm:ss"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ghl-submissions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
      {submissionsError && <LeadPanelErrorState panelName="GHL submissions" />}
      {/* Band 1 — title. */}
      <AdminPageHeader
        title="GHL Submissions"
        description="Website form and chatbot submissions, and whether each reached GoHighLevel"
        icon={<Send className="h-4 w-4" />}
        isRealtimeConnected={isRealtimeConnected}
        onRefresh={() => refetch()}
        isLoading={isLoading}
      />

      {/* Band 2 — tiles. Each one filters the table. Failed and Not synced are
          the ones that ask for something; the sync-rate percentage was a
          statistic nobody could click, so it is gone. */}
      <AdminMetricsStrip
        metrics={[
          { label: 'All submissions', value: stats.total, active: statusFilter === 'all', onClick: () => setStatusFilter('all') },
          { label: 'Synced', value: stats.synced, tone: 'good', active: statusFilter === 'verified', onClick: () => toggleStatus('verified') },
          { label: 'Failed', value: stats.failed, tone: stats.failed > 0 ? 'warn' : 'default', active: statusFilter === 'failed', onClick: () => toggleStatus('failed') },
          { label: 'Not synced', value: stats.notSynced, tone: stats.notSynced > 0 ? 'warn' : 'default', active: statusFilter === 'pending', onClick: () => toggleStatus('pending') },
        ]}
      />

      {/* Admin tools — role-gated by the row itself. */}
      <AdminActionsRow
        actions={[
          {
            key: 'retry',
            label: `Retry sync (${retryCount})`,
            icon: <RotateCcw className="h-3.5 w-3.5" />,
            onClick: () => filteredSubmissions && bulkRetrySync(filteredSubmissions),
            loading: isBulkRetrying,
            disabled: retryCount === 0,
          },
          { key: 'export', label: 'Export CSV', icon: <Download className="h-3.5 w-3.5" />, onClick: exportToCSV, disabled: !filteredSubmissions?.length },
        ]}
      />

      {/* Band 3 — the shared toolbar: Search · Sort · Status first, in the
          Standard's order (a submission has no owner or outcome), then View,
          Source, Page and Origin. The date range keeps its presets and
          pickers, in the actions slot. */}
      <AdminToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by email, name, company or phone..."
        resultCount={filteredSubmissions?.length || 0}
        resultNoun="submissions"
        filters={[
          { key: 'sort', label: 'Sort', options: standardSortOptions, value: sortBy, onChange: (v) => setSortBy(v as typeof sortBy), allValue: 'date_desc' },
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'all', label: 'All Status' },
              { value: 'verified', label: 'Synced' },
              { value: 'failed', label: 'Sync Failed' },
              { value: 'pending', label: 'Not Synced' },
              { value: 'awaiting', label: 'Awaiting Booking' },
              { value: 'booking_shown', label: 'Booking Shown' },
            ],
          },
          {
            key: 'view',
            label: 'View',
            value: viewMode,
            onChange: (v) => {
              setViewMode(v as 'active' | 'archived');
              setSelectedSubmissionIds(new Set());
            },
            allValue: 'active',
            options: [
              { value: 'active', label: 'Active' },
              { value: 'archived', label: 'Archived' },
            ],
          },
          {
            key: 'medium',
            label: 'Source',
            value: mediumFilter,
            onChange: setMediumFilter,
            options: [
              { value: 'all', label: 'All Sources' },
              { value: 'lead_chatbot', label: 'Chatbot' },
              { value: 'lead_form', label: 'Form' },
              { value: 'booking_modal', label: 'Booking' },
              { value: 'webhook', label: 'Webhook' },
            ],
          },
          {
            key: 'page',
            label: 'Page',
            value: sourcePageFilter,
            onChange: setSourcePageFilter,
            options: [
              { value: 'all', label: 'All Pages' },
              ...uniqueSourcePages.map((page) => ({ value: page, label: getSourcePageLabel(page) })),
            ],
          },
          {
            key: 'origin',
            label: 'Origin',
            value: leadSourceFilter,
            onChange: setLeadSourceFilter,
            options: [
              { value: 'all', label: 'All Origins' },
              { value: 'chatbot', label: 'Chatbot' },
              { value: 'form', label: 'Form' },
              { value: 'header_cta', label: 'Header CTA' },
              { value: 'signup_page', label: 'Get Started Page' },
              { value: 'page_cta', label: 'Page CTA' },
              { value: 'personalization_flow', label: 'Hero CTA (Legacy)' },
            ],
          },
        ]}
        onClearAll={() => {
          setSearchQuery('');
          setStatusFilter('all');
          setMediumFilter('all');
          setSourcePageFilter('all');
          setLeadSourceFilter('all');
          setSortBy('date_desc');
          setViewMode('active');
          setSelectedSubmissionIds(new Set());
          setStartDate(undefined);
          setEndDate(undefined);
          setActivePreset(null);
        }}
        actions={
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <Calendar className="h-4 w-4" />
                {startDate || endDate ? (
                  <span>
                    {startDate ? format(startDate, 'MMM d') : '…'} - {endDate ? format(endDate, 'MMM d') : '…'}
                  </span>
                ) : (
                  <span>All dates</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto max-w-[95vw] p-3" align="end">
              <DateRangeFilter
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                activePreset={activePreset}
                onPresetChange={setActivePreset}
              />
            </PopoverContent>
          </Popover>
        }
      />

      <Card>
        <CardContent className="pt-6">
          {/* Bulk Controls */}
          {filteredSubmissions && filteredSubmissions.length > 0 && (
            <div className="flex items-center gap-3 mb-4 p-3 rounded-lg border bg-muted/30">
              <Checkbox 
                checked={selectedSubmissionIds.size > 0 && selectedSubmissionIds.size === filteredSubmissions.length}
                onCheckedChange={selectAllSubmissions}
                aria-label="Select all submissions"
              />
              <span className="text-sm text-muted-foreground">
                {selectedSubmissionIds.size > 0 
                  ? `${selectedSubmissionIds.size} of ${filteredSubmissions.length} selected`
                  : `Select all ${filteredSubmissions.length} submission${filteredSubmissions.length > 1 ? 's' : ''}`
                }
              </span>
              <div className="ml-auto flex gap-2">
                {/* Bulk Archive/Restore Button */}
                {selectedSubmissionIds.size > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkArchive}
                    disabled={isBulkArchiving}
                    className="gap-2"
                  >
                    {isBulkArchiving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : viewMode === 'active' ? (
                      <Archive className="w-4 h-4" />
                    ) : (
                      <ArchiveRestore className="w-4 h-4" />
                    )}
                    {viewMode === 'active' ? 'Archive' : 'Restore'} {selectedSubmissionIds.size}
                  </Button>
                )}
                {/* Bulk Delete Button */}
                {selectedSubmissionIds.size > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setShowBulkDeleteDialog(true)}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete {selectedSubmissionIds.size}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Table */}
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10">
                    <Checkbox 
                      checked={filteredSubmissions && filteredSubmissions.length > 0 && selectedSubmissionIds.size === filteredSubmissions.length}
                      onCheckedChange={selectAllSubmissions}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Origin</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[52px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isDateValid ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-red-500">
                      Invalid date range - end date must be after start date
                    </TableCell>
                  </TableRow>
                ) : filteredSubmissions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No submissions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubmissions?.map((sub) => (
                    <TableRow 
                      key={sub.id} 
                      className={cn("hover:bg-muted/30 cursor-pointer", selectedSubmissionIds.has(sub.id) && "bg-primary/5")}
                      onClick={() => setSelectedSubmission(sub)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox 
                          checked={selectedSubmissionIds.has(sub.id)}
                          onCheckedChange={() => {
                            setSelectedSubmissionIds(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(sub.id)) {
                                newSet.delete(sub.id);
                              } else {
                                newSet.add(sub.id);
                              }
                              return newSet;
                            });
                          }}
                          aria-label={`Select ${sub.lead_email}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="select-text">
                          <LeadOverlayBadges source="ghl_submissions" id={sub.id} className="mb-1 flex flex-wrap items-center gap-1.5" />
                          {(sub.lead_first_name || sub.lead_last_name || sub.lead_name) ? (
                            <>
                              <p className="font-medium flex items-center gap-1.5 flex-wrap">
                                <GHLSyncDot input={sub} className="shrink-0" />
                                <Link
                                  to={`/admin/leads/${sub.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="truncate hover:underline"
                                >
                                  {formatDisplayName(sub.lead_first_name, sub.lead_last_name, sub.lead_name || undefined)}
                                </Link>
                                <SourceBadge label="Submission" className="shrink-0" />
                                <LeadStatusPill label={leadStatusLabel({ source: 'ghl_submissions', status: sub.ghl_status })} className="shrink-0" />
                              </p>
                              <p className="text-sm text-muted-foreground">{sub.lead_email}</p>
                            </>
                          ) : (
                            <p className="font-medium flex items-center gap-1.5 flex-wrap">
                              <GHLSyncDot input={sub} className="shrink-0" />
                              <Link
                                to={`/admin/leads/${sub.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="truncate hover:underline"
                              >
                                {sub.lead_email}
                              </Link>
                              <SourceBadge label="Submission" className="shrink-0" />
                              <LeadStatusPill label={leadStatusLabel({ source: 'ghl_submissions', status: sub.ghl_status })} className="shrink-0" />
                            </p>
                          )}
                          {sub.lead_company && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {formatName(sub.lead_company)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {sub.lead_phone ? (
                          <a 
                            href={`tel:${sub.lead_phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            {sub.lead_phone}
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <LeadSourceBadge leadSource={sub.lead_source} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <MediumBadge medium={sub.source_medium} />
                          <SourcePageBadge sourcePage={sub.source_page} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <CampaignBadge campaign={sub.source_campaign} />
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const syncStatus = getSyncStatusBadge(sub);
                          const needsRetry = syncStatus.icon === 'error' || syncStatus.icon === 'pending';
                          return (
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={cn("gap-1", syncStatus.color)}
                              >
                                {syncStatus.icon === 'synced' && <CheckCircle2 className="w-3 h-3" />}
                                {syncStatus.icon === 'pending' && <CloudOff className="w-3 h-3" />}
                                {syncStatus.icon === 'awaiting' && <Clock className="w-3 h-3" />}
                                {syncStatus.icon === 'error' && <AlertCircle className="w-3 h-3" />}
                                {syncStatus.label}
                              </Badge>
                              {needsRetry && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    retrySync(sub);
                                  }}
                                  disabled={retryingId === sub.id}
                                  title="Retry sync to GHL"
                                >
                                  {retryingId === sub.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <RotateCcw className="w-3 h-3" />
                                  )}
                                </Button>
                              )}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(sub.created_at), "MMM d, h:mm a")}
                        </span>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <LegacyLeadActions
                          source="ghl_submissions"
                          id={sub.id}
                          name={formatDisplayName(sub.lead_first_name, sub.lead_last_name, sub.lead_name || undefined) || sub.lead_email}
                          email={sub.lead_email}
                          phone={sub.lead_phone}
                          company={sub.lead_company}
                          status={sub.ghl_status}
                          createdAt={sub.created_at}
                          sourceUrl={sub.source_page}
                          ghlContactId={(sub.ghl_response as Record<string, unknown> | null)?.ghl_contact_id as string | null}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* The board asked for this page to be "consolidated with Webhook logs".
          The filter and the retry were already here; this is the half that was
          missing — answering "why did this one not sync?" without leaving the
          page and losing the filter. The full log keeps its own page for search
          and payload inspection. */}
      <div className="mt-4">
        <WebhookActivityPanel />
      </div>

      {/* Shared quick-view drawer (replaces the legacy Submission Details dialog). */}
      <LeadQuickView
        open={!!selectedSubmission}
        onOpenChange={(open) => { if (!open) setSelectedSubmission(null); }}
        lead={selectedSubmission ? {
          source: 'ghl_submissions',
          id: selectedSubmission.id,
          name:
            formatDisplayName(selectedSubmission.lead_first_name, selectedSubmission.lead_last_name, selectedSubmission.lead_name || undefined) ||
            selectedSubmission.lead_email ||
            'Submission',
          email: selectedSubmission.lead_email,
          phone: selectedSubmission.lead_phone,
          company: selectedSubmission.lead_company,
          status: selectedSubmission.ghl_status,
          createdAt: selectedSubmission.created_at,
          sourceUrl: selectedSubmission.source_page,
          ghlContactId: (selectedSubmission.ghl_response as Record<string, unknown> | null)?.ghl_contact_id as string | undefined,
          raw: selectedSubmission as unknown as Record<string, unknown>,
        } : null}
      />


      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the submission for <strong>{deleteTarget?.lead_email}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {deleteTarget?.ghl_response?.ghl_contact_id && (
            <div className="flex items-center space-x-2 py-2">
              <Checkbox 
                id="delete-from-ghl-submission"
                checked={deleteFromGHL}
                onCheckedChange={(checked) => setDeleteFromGHL(checked === true)}
              />
              <label
                htmlFor="delete-from-ghl-submission"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Also delete from GoHighLevel
              </label>
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubmission}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedSubmissionIds.size} Submissions</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedSubmissionIds.size} selected submission{selectedSubmissionIds.size > 1 ? 's' : ''}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="flex items-center space-x-2 py-2">
            <Checkbox 
              id="bulk-delete-from-ghl"
              checked={bulkDeleteFromGHL}
              onCheckedChange={(checked) => setBulkDeleteFromGHL(checked === true)}
            />
            <label
              htmlFor="bulk-delete-from-ghl"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Also delete from GoHighLevel
            </label>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete {selectedSubmissionIds.size}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
