import { useEffect, useMemo, useRef, useState } from "react";
import { getLeadsCache, peekLeadsCache, setLeadsCache } from "@/lib/leadsPageCache";

import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { LeadOverlaySection, LeadOverlayBadges } from "@/components/admin/leads/LeadOverlayWidgets";
import { SourceBadge } from "@/components/admin/leads/SourceBadge";
import { leadStatusLabel } from "@/lib/unifiedLead";
import { LegacyLeadActions } from "@/components/admin/leads/LegacyLeadActions";
import { GHLSyncDot } from "@/components/admin/GHLSyncDot";
import { LeadList, LeadListHeader, LeadListRow } from "@/components/admin/leads/LeadListRow";
import { LeadOverlayOwnerCell } from "@/components/admin/leads/LeadOverlayOwnerCell";
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { capitalizeText, formatTag, formatName, formatDisplayName } from '@/lib/textFormatting';
import { getGHLContactUrl } from '@/lib/ghlConfig';
import { useRecordHistory } from '@/hooks/useRecordHistory';
import { ConvertToQuoteButton } from '@/components/quotes/ConvertToQuoteButton';
import { RecordHistoryPanel } from '@/components/admin/RecordHistoryPanel';
import { viewModeOptions } from '@/components/admin/adminFilterOptions';
import { AdminToolbar } from '@/components/admin/AdminToolbar';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminActionsRow } from '@/components/admin/AdminActionsRow';
import { AdminMetricsStrip } from '@/components/admin/AdminMetricsStrip';
import { useLeadOverlayData } from '@/hooks/useLeadOverlay';
import { useSalesReps } from '@/hooks/useSalesReps';
import { ownerName } from '@/components/admin/leads/ownerName';
import { leadKey } from '@/lib/unifiedLead';
import { matchesLeadSearch, optionsFromData } from '@/lib/leadSearch';
import { ColumnSortState } from '@/components/admin/SortableTableHeader';
import { compareValues } from '@/components/admin/compareValues';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { 
  Loader2, 
  Mail, 
  Building, 
  Calendar, 
  User, 
  Download,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Globe,
  Trash2,
  Archive,
  ArchiveRestore,
  Phone,
  Clock,
  Video,
  XCircle,
  RotateCcw,
  BadgeCheck,
  Users,
  Upload,
  AlertCircle,
  Lock,
  Search,
  Receipt,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, startOfToday, startOfWeek, endOfWeek } from 'date-fns';
import AccessDenied from '@/components/admin/AccessDenied';
import { AdminErrorBanner } from '@/components/admin/AdminErrorBanner';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { SUPPORT_EMAIL } from "@/lib/siteConfig";
import { getGHLSyncStatus as getSharedGHLSyncStatus } from "@/lib/ghlSyncStatus";

interface GHLResponseData {
  start_time?: string;
  end_time?: string;
  appointment_id?: string;
  calendar_name?: string;
  phone?: string;
  location?: string;
  meet_link?: string;
  google_meet_link?: string;
  ghl_contact_id?: string;
  website?: string;
  tags_applied?: string[];
  synced_at?: string;
  event_type?: string;
  ghl_synced?: boolean;
  ghl_verified?: boolean;
  ghl_sync_error?: string;
  // Deletion tracking fields
  deleted_at?: string;
  deleted_reason?: 'contact_deleted' | 'appointment_deleted' | 'email_not_found';
  deleted_check_at?: string;
  deleted_check_result?: 'exists' | 'deleted' | 'error' | 'no_identifier';
  deleted_check_error?: string;
}

// Helper to check if lead is synced AND verified in GHL
const isGHLSynced = (lead: GHLBookedLead): boolean => {
  const response = lead.ghl_response as GHLResponseData | null;
  if (!response) return false;
  // Must have both ghl_synced=true AND ghl_verified=true (or ghl_contact_id exists)
  if (response.ghl_synced === true && response.ghl_verified === true) {
    return true;
  }
  // Legacy check: if status is 'synced' and has a contact ID
  if (lead.ghl_status === 'synced' && response.ghl_contact_id) {
    return true;
  }
  return false;
};

// Get sync status for display with verification check
const getGHLSyncStatus = (lead: GHLBookedLead): { label: string; color: string; synced: boolean; icon: typeof CheckCircle2; deletedReason?: string } => {
  const response = lead.ghl_response as GHLResponseData | null;

  // Check if deleted from GHL - simple label, details in tooltip
  if (lead.ghl_status === 'deleted_from_ghl') {
    const deletedReason = response?.deleted_reason;
    return {
      label: 'Deleted',
      color: 'bg-rose-500/20 text-rose-700 border-rose-500/30',
      synced: false,
      icon: Trash2,
      deletedReason,
    };
  }

  // Delegate all remaining classification to the shared single source of truth
  // so the benign "booking_shown / calendar widget handles contact creation"
  // state reads as amber "Awaiting Booking" — never a red failure.
  const shared = getSharedGHLSyncStatus({ ghl_status: lead.ghl_status, ghl_response: response as Record<string, unknown> | null });
  const iconMap: Record<string, typeof CheckCircle2> = {
    synced: CheckCircle2,
    awaiting: Clock,
    error: AlertCircle,
    pending: Upload,
  };
  return {
    label: shared.label,
    color: shared.color,
    synced: shared.synced,
    icon: iconMap[shared.icon] ?? Upload,
  };
};

// Helper to format deletion reason for display
const formatDeletionReason = (reason?: string): string => {
  switch (reason) {
    case 'appointment_deleted':
      return 'The appointment was deleted from GoHighLevel. The contact may still exist.';
    case 'contact_deleted':
      return 'The contact was deleted from GoHighLevel.';
    case 'email_not_found':
      return 'The email address was not found in GoHighLevel.';
    default:
      return 'This record was deleted from GoHighLevel.';
  }
};

// Helper to format last checked timestamp
const formatLastChecked = (timestamp?: string): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

/** True when the record holds hard evidence of a real, scheduled appointment. */
const hasAppointmentEvidence = (lead: GHLBookedLead): boolean => {
  const gr = (lead.ghl_response ?? {}) as GHLResponseData;
  return Boolean(
    lead.meet_link || gr.meet_link || gr.google_meet_link || gr.start_time || gr.appointment_id,
  );
};

// Get display status - overrides ghl_status if deleted
const getDisplayStatus = (lead: GHLBookedLead): string => {
  if (lead.ghl_status === 'deleted_from_ghl') {
    return 'deleted_from_ghl';
  }
  // Trust the evidence over the label. A record that has a scheduled time and a
  // join link IS confirmed, even if the status field never got updated — that
  // happens when the confirmation webhook fails, and it was showing bookings as
  // "Booking shown / awaiting" that were long since confirmed in GHL. The
  // status field is a claim; the appointment is a fact.
  if (
    hasAppointmentEvidence(lead) &&
    (!lead.ghl_status || ['booking_shown', 'submitted', 'synced'].includes(lead.ghl_status))
  ) {
    return 'confirmed';
  }
  return lead.ghl_status || 'submitted';
};


interface GHLBookedLead {
  id: string;
  lead_email: string;
  lead_name: string | null;
  lead_first_name: string | null;
  lead_last_name: string | null;
  lead_phone: string | null;
  lead_company: string | null;
  ghl_status: string | null;
  source_medium: string;
  source_page: string;
  lead_source: string | null;
  meet_link: string | null;
  created_at: string;
  archived_at: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ghl_response: GHLResponseData | any;
}

// Status badge colors
const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30",
  cancelled: "bg-red-500/20 text-red-700 border-red-500/30",
  canceled: "bg-red-500/20 text-red-700 border-red-500/30",
  rescheduled: "bg-orange-500/20 text-orange-700 border-orange-500/30",
  deleted_from_ghl: "bg-rose-500/20 text-rose-700 border-rose-500/30",
  synced: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30",
  submitted: "bg-slate-500/20 text-slate-700 border-slate-500/30",
};

// Human labels for the ghl_status values present in the data. Anything not listed
// falls back to a title-cased version of the raw value.
const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  canceled: 'Cancelled',
  rescheduled: 'Rescheduled',
  deleted_from_ghl: 'Deleted in GHL',
  completed: 'Completed',
  booking_shown: 'Booking shown',
  booking_abandoned: 'Abandoned',
  submitted: 'Submitted',
};

// Chart colors
const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#6366F1'];

export default function LeadsBookedAdmin() {
  const navigate = useNavigate();
  const { user } = useAdminAuth();
  const { canViewLeads, canExportLeads } = usePermissions();
  // Owner comes from the shared CRM overlay — the SAME cache the Owner column
  // reads (react-query dedupes it), so the filter can never disagree with the
  // column and no extra request is made.
  const { data: overlay } = useLeadOverlayData();
  const { data: salesReps = [] } = useSalesReps();
  const [searchParams, setSearchParams] = useSearchParams();
  const [leads, setLeads] = useState<GHLBookedLead[]>(
    () => peekLeadsCache<GHLBookedLead[]>('booked-active') ?? [],
  );
  const [archivedLeads, setArchivedLeads] = useState<GHLBookedLead[]>(
    () => peekLeadsCache<GHLBookedLead[]>('booked-archived') ?? [],
  );
  const [filteredLeads, setFilteredLeads] = useState<GHLBookedLead[]>([]);
  const [awaitingCount, setAwaitingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(() => getLeadsCache('booked-active') === null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<GHLBookedLead | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  // Always show all leads by default - no date filtering
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const [columnSort, setColumnSort] = useState<ColumnSortState>({ column: 'created', direction: 'desc' });
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past' | 'week'>('all');
  const [calendarFilter, setCalendarFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  
  // Delete state
  const [leadToDelete, setLeadToDelete] = useState<GHLBookedLead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [syncingLeadId, setSyncingLeadId] = useState<string | null>(null);
  const [isVerifyingAll, setIsVerifyingAll] = useState(false);
  const [isCheckingDeleted, setIsCheckingDeleted] = useState(false);
  const [recheckingLeadId, setRecheckingLeadId] = useState<string | null>(null);
  const [checkingAppointmentId, setCheckingAppointmentId] = useState<string | null>(null);
  const checkingAppointmentIdRef = useRef<string | null>(null);
  const [hasAutoVerified, setHasAutoVerified] = useState(false);
  const [hasAutoDeletionChecked, setHasAutoDeletionChecked] = useState(false);
  const fetchInFlightRef = useRef(false);
  const fetchDebounceRef = useRef<number | null>(null);
  const suppressRealtimeRef = useRef(false); // Suppress realtime during auto-sync
  const detailOpenRef = useRef(false); // True while the Lead Details modal is open
  const missedRealtimeRef = useRef(false); // A realtime refresh was skipped while modal was open
  const [loadError, setLoadError] = useState<string | null>(null);

  /** Owner display name for a booking id, or null when unassigned. */
  const ownerNameFor = useMemo(() => {
    const byKey = new Map<string, string>();
    for (const a of overlay?.annotations ?? []) {
      if (a.lead_source !== 'ghl_submissions' || !a.owner_id) continue;
      const name = ownerName(a.owner_id, salesReps);
      if (name) byKey.set(leadKey(a.lead_source, a.lead_id), name);
    }
    return (id: string) => byKey.get(leadKey('ghl_submissions', id)) ?? null;
  }, [overlay, salesReps]);


  // Keep an always-fresh ref for realtime callback guards
  useEffect(() => {
    checkingAppointmentIdRef.current = checkingAppointmentId;
  }, [checkingAppointmentId]);



  
  // History hook
  const {
    history: leadHistory,
    newNote,
    setNewNote,
    isAddingNote,
    addNote: handleAddNote,
  } = useRecordHistory({
    recordId: selectedLead?.id || null,
    recordType: 'lead_booked',
    userId: user?.id,
  });

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [user]);

  const scheduleFetchLeads = useMemo(() => {
    return () => {
      if (fetchDebounceRef.current) window.clearTimeout(fetchDebounceRef.current);
      fetchDebounceRef.current = window.setTimeout(() => {
        fetchLeads();
      }, 400);
    };
  }, []);

  // Track whether the detail modal is open (ref for realtime callbacks) and
  // catch up on any refresh that was skipped while it was open.
  useEffect(() => {
    detailOpenRef.current = !!selectedLead;
    if (!selectedLead && missedRealtimeRef.current) {
      missedRealtimeRef.current = false;
      scheduleFetchLeads();
    }
  }, [selectedLead, scheduleFetchLeads]);


  // Auto-verify unsynced leads on initial load (only once)
  useEffect(() => {
    if (leads.length > 0 && !hasAutoVerified && !isLoading && !selectedLead) {
      // Check if there are any leads that need verification
      const needsVerification = leads.filter(lead => !isGHLSynced(lead));
      if (needsVerification.length > 0) {
        verifyAllPendingLeads(true); // silent mode
      }
      setHasAutoVerified(true);
    }
  }, [leads.length, hasAutoVerified, isLoading]); // removed leads array dependency to avoid re-triggers

  // Auto-audit for "Deleted in GHL" exactly once after the first successful load.
  // We set the guard flag immediately to prevent loops while the audit triggers row updates.
  useEffect(() => {
    if (!user) return;
    if (isLoading) return;
    if (hasAutoDeletionChecked) return;
    if (loadError) return;
    if (selectedLead) return; // Don't run when modal is open
    if (leads.length === 0) {
      setHasAutoDeletionChecked(true);
      return;
    }

    // Only audit records that appear verified/synced (reduces API calls).
    const hasAnyVerifiedLike = leads.some((l) => isGHLSynced(l));
    if (!hasAnyVerifiedLike) {
      setHasAutoDeletionChecked(true);
      return;
    }

    setHasAutoDeletionChecked(true);
    void checkForDeletedContacts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading, loadError, leads.length, hasAutoDeletionChecked]);

  // Real-time subscription - synced with Meetings panel
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('leads-booked-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ghl_submissions',
        },
        (payload) => {
          // Skip if we're suppressing realtime (during auto-sync operations)
          if (suppressRealtimeRef.current) return;
          // Also skip while a manual appointment check is in-flight to prevent refresh loops
          if (checkingAppointmentIdRef.current) return;
          // Don't refetch/re-render while the detail modal is open; catch up on close
          if (detailOpenRef.current) { missedRealtimeRef.current = true; return; }
          

          
          // Only refresh if the change is relevant to calendar bookings
          const record = payload.new as Record<string, unknown> | undefined;
          const leadSource = record?.lead_source as string | undefined;
          const sourceMedium = record?.source_medium as string | undefined;
          const ghlStatus = record?.ghl_status as string | undefined;
          
          const isRelevant = 
            leadSource === 'calendar_widget' ||
            sourceMedium === 'ghl_direct_booking' ||
            ['confirmed', 'cancelled', 'rescheduled', 'deleted_from_ghl'].includes(ghlStatus || '');
          
          if (isRelevant || payload.eventType === 'DELETE') {
            scheduleFetchLeads();
          }
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, scheduleFetchLeads]);

  // Auto-sync Leads Booked when investor_bookings updates (meeting link + appointment date)
  useEffect(() => {
    if (!user) return;

    const meetingsChannel = supabase
      .channel('leads-booked-meetings-sync')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'investor_bookings',
        },
        async (payload) => {
          // Skip if suppressed
          if (suppressRealtimeRef.current) return;
          if (checkingAppointmentIdRef.current) return;
          if (detailOpenRef.current) { missedRealtimeRef.current = true; return; }


          const booking = payload.new as Record<string, unknown>;
          const startTime = booking.start_time as string | undefined;
          const endTime = booking.end_time as string | undefined;
          const location = booking.location as string | undefined;
          const investorId = booking.investor_id as string | undefined;

          // Only sync if we have meaningful data
          if (!startTime && !location) return;

          // Find matching lead by investor_id (cross-reference investor_leads email → ghl_submissions)
          if (investorId) {
            try {
              // Get investor email
              const { data: investor } = await supabase
                .from('investor_leads')
                .select('email')
                .eq('id', investorId)
                .maybeSingle();

              if (investor?.email) {
                // Find matching ghl_submission by email
                const { data: matchingLeads } = await supabase
                  .from('ghl_submissions')
                  .select('id, ghl_response')
                  .eq('lead_email', investor.email.toLowerCase())
                  .or('lead_source.eq.calendar_widget,source_medium.eq.ghl_direct_booking')
                  .limit(1);

                if (matchingLeads && matchingLeads.length > 0) {
                  const lead = matchingLeads[0];
                  const existingResponse = (lead.ghl_response || {}) as Record<string, string | number | boolean | null>;
                  
                  // Merge new meeting data (cast to string for type safety)
                  const updatedResponse: Record<string, string | number | boolean | null> = {
                    ...existingResponse,
                    start_time: (startTime as string) || (existingResponse.start_time as string) || null,
                    end_time: (endTime as string) || (existingResponse.end_time as string) || null,
                    ...(location && location.includes('meet.google.com') ? { meet_link: location } : {}),
                    meetings_synced_at: new Date().toISOString(),
                  };

                  // Check if meet_link should be updated at top level
                  const meetLink = location && location.includes('meet.google.com') ? location : undefined;

                  await supabase
                    .from('ghl_submissions')
                    .update({
                      ghl_response: updatedResponse,
                      ...(meetLink ? { meet_link: meetLink } : {}),
                    })
                    .eq('id', lead.id);
                }
              }
            } catch (error) {
              console.error('Error syncing meeting data to lead:', error);
            }
          }
        }
      )
      .subscribe();

    // Subscribe to meeting_history for webhook-driven status updates (confirmed/cancelled/rescheduled)
    const historyChannel = supabase
      .channel('leads-booked-history-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'meeting_history'
        },
        (payload) => {
          // Skip if suppressed
          if (suppressRealtimeRef.current) return;
          if (checkingAppointmentIdRef.current) return;
          if (detailOpenRef.current) { missedRealtimeRef.current = true; return; }


          console.log('Meeting history updated (webhook), refreshing leads booked...', payload.new);
          scheduleFetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(meetingsChannel);
      supabase.removeChannel(historyChannel);
    };
  }, [user, scheduleFetchLeads]);

  // Verify all pending leads against GHL
  const verifyAllPendingLeads = async (silent = false) => {
    setIsVerifyingAll(true);
    suppressRealtimeRef.current = true; // Suppress realtime during sync
    try {
      const response = await supabase.functions.invoke('verify-ghl-sync', {
        body: { verify_all_pending: true, source: 'leads_booked' },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Verification failed');
      }

      const result = response.data;
      if (!silent && result.updated > 0) {
        toast.success(`Verified ${result.updated} lead(s) in GHL`);
      }
      
      // Refresh leads to show updated status
      if (result.updated > 0) {
        await fetchLeads();
      }
    } catch (error) {
      console.error('Error verifying leads:', error);
      if (!silent) {
        toast.error('Failed to verify leads in GHL');
      }
    } finally {
      setIsVerifyingAll(false);
      // Re-enable realtime after a short delay to let any pending events pass
      setTimeout(() => { suppressRealtimeRef.current = false; }, 1000);
    }
  };

  // Check if verified contacts still exist in GHL (detect deleted)
  const checkForDeletedContacts = async (arg?: boolean | unknown) => {
    const silent = typeof arg === 'boolean' ? arg : false;
    setIsCheckingDeleted(true);
    suppressRealtimeRef.current = true; // Suppress realtime during check
    try {
      const response = await supabase.functions.invoke('verify-ghl-sync', {
        body: { verify_all_pending: true, check_deleted: true, source: 'leads_booked' },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Check failed');
      }

      const result = response.data;
      if (result.markedDeleted > 0) {
        if (!silent) toast.success(`Found ${result.markedDeleted} contact(s) deleted from GHL`);
        await fetchLeads();
      } else {
        if (!silent) toast.info('All verified contacts still exist in GHL');
      }
    } catch (error) {
      console.error('Error checking for deleted contacts:', error);
      if (!silent) {
        const subject = encodeURIComponent('Issue: Leads Booked "Deleted in GHL" check failed');
        const body = encodeURIComponent(
          `Hi team,\n\nThe "Deleted in GHL" check failed on this page:\n${window.location.href}\n\nPlease include a screenshot of the page with the affected record visible.\n\nError: ${(error as Error)?.message || 'Unknown error'}\n`
        );
        toast.error('Failed to check for deleted contacts', {
          description: 'Please try again. If it keeps happening, email support with a screenshot + this page URL.',
          action: {
            label: 'Email support',
            onClick: () => window.open(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`),
          },
        });
      }
    } finally {
      setIsCheckingDeleted(false);
      // Re-enable realtime after a short delay
      setTimeout(() => { suppressRealtimeRef.current = false; }, 1000);
    }
  };

  // Recheck a single lead for deletion status
  const recheckSingleLead = async (lead: GHLBookedLead, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRecheckingLeadId(lead.id);
    try {
      const response = await supabase.functions.invoke('verify-ghl-sync', {
        body: { 
          submission_ids: [lead.id], 
          check_deleted: true, 
          source: 'leads_booked',
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Recheck failed');
      }

      const result = response.data;
      if (result.markedDeleted > 0) {
        toast.success('Lead marked as deleted from GHL');
      } else if (result.results?.[0]?.status === 'still_exists') {
        toast.success('Lead verified - still exists in GHL');
      } else if (result.results?.[0]?.status === 'check_failed') {
        toast.warning('Could not verify - API error. Try again later.');
      } else {
        toast.info('Recheck complete');
      }
      await fetchLeads();
    } catch (error) {
      console.error('Error rechecking lead:', error);
      toast.error('Failed to recheck lead status');
    } finally {
      setRecheckingLeadId(null);
    }
  };

  // Check appointment status from GHL
  const checkAppointmentStatus = async (lead: GHLBookedLead, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const appointmentId = (lead.ghl_response as GHLResponseData)?.appointment_id;
    if (!appointmentId) {
      toast.error('No appointment ID found for this lead');
      return;
    }
    
    setCheckingAppointmentId(lead.id);
    suppressRealtimeRef.current = true;
    try {
      const response = await supabase.functions.invoke('verify-ghl-sync', {
        body: { 
          submission_ids: [lead.id],
          check_appointment_status: true,
          source: 'leads_booked',
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Status check failed');
      }

      const result = response.data;
      const leadResult = result.results?.[0];

      // Helper: format appointment time for toast
      const toastTime = leadResult?.start_time
        ? format(new Date(leadResult.start_time), "MMM d, yyyy 'at' h:mm a")
        : undefined;
      
      if (leadResult?.appointment_status) {
        const status = leadResult.appointment_status;
        const description = toastTime ? `Appointment time: ${toastTime}` : undefined;

        if (status === 'confirmed') {
          toast.success('Appointment confirmed', { description });
        } else if (status === 'cancelled' || status === 'canceled') {
          toast.warning('Appointment cancelled', { description });
        } else if (status === 'rescheduled') {
          toast.info('Appointment rescheduled', { description });
        } else {
          toast.info(`Appointment status: ${status}`, { description });
        }
      } else if (leadResult?.error) {
        toast.error(`Check failed: ${leadResult.error}`);
      } else {
        toast.info('Status check complete');
      }
      
      await fetchLeads();
    } catch (error) {
      console.error('Error checking appointment status:', error);
      const subject = encodeURIComponent('Issue: Leads Booked "Check Status" failed');
      const body = encodeURIComponent(
        `Hi team,\n\n"Check Status" failed on this page:\n${window.location.href}\n\nPlease include a screenshot of the page with the affected record visible.\n\nLead ID: ${lead.id}\nEmail: ${lead.lead_email}\n\nError: ${(error as Error)?.message || 'Unknown error'}\n`
      );
      toast.error('Failed to check appointment status', {
        description: 'Please try again. If it keeps happening, email support with a screenshot + this page URL.',
        action: {
          label: 'Email support',
          onClick: () => window.open(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`),
        },
      });
    } finally {
      setCheckingAppointmentId(null);
      // Give the backend a moment to finish any chained updates before resuming realtime.
      setTimeout(() => { suppressRealtimeRef.current = false; }, 2000);
    }
  };

  // Higher score = stronger/more-complete record for the same person
  function bookingScore(row: any): number {
    const gr = row.ghl_response || {};
    const hasAppt = Boolean(row.meet_link || gr.meet_link || gr.start_time || gr.appointment_id);
    const statusRank: Record<string, number> = {
      confirmed: 5, rescheduled: 4, booking_shown: 2, cancelled: 1, deleted_from_ghl: 0,
    };
    return (hasAppt ? 100 : 0) + (statusRank[row.ghl_status] ?? 3);
  }

  function dedupeBooked<T extends { lead_email?: string | null; created_at?: string }>(rows: T[]): T[] {
    const byKey = new Map<string, T>();
    const passthrough: T[] = [];
    for (const row of rows) {
      const key = (row.lead_email || '').trim().toLowerCase();
      if (!key) { passthrough.push(row); continue; } // no email → can't dedupe, keep as-is
      const existing = byKey.get(key);
      if (!existing) { byKey.set(key, row); continue; }
      const a = bookingScore(row as any), b = bookingScore(existing as any);
      // keep higher score; tie-break on most recent created_at
      if (a > b || (a === b && (row.created_at || '') > (existing.created_at || ''))) {
        byKey.set(key, row);
      }
    }
    return [...byKey.values(), ...passthrough];
  }

  const fetchLeads = async () => {
    if (fetchInFlightRef.current) return;
    fetchInFlightRef.current = true;
    // Only block the UI with a spinner when there is no fresh cached page data.
    if (getLeadsCache('booked-active') === null) setIsLoading(true);
    setLoadError(null);
    try {
      // Fetch calendar-originated leads (not archived)
      const { data: activeData, error: activeError } = await supabase
        .from('ghl_submissions')
        .select('*')
        .is('archived_at', null)
        .or('lead_source.eq.calendar_widget,source_medium.eq.ghl_direct_booking')
        .order('created_at', { ascending: false });

      if (activeError) throw activeError;

      // Fetch archived calendar-originated leads
      const { data: archivedData, error: archivedError } = await supabase
        .from('ghl_submissions')
        .select('*')
        .not('archived_at', 'is', null)
        .or('lead_source.eq.calendar_widget,source_medium.eq.ghl_direct_booking')
        .order('created_at', { ascending: false });

      if (archivedError) throw archivedError;

      const dedupedActive = dedupeBooked(activeData || []);
      const dedupedArchived = dedupeBooked(archivedData || []);
      setLeads(dedupedActive);
      setArchivedLeads(dedupedArchived);
      setLeadsCache('booked-active', dedupedActive);
      setLeadsCache('booked-archived', dedupedArchived);
    } catch (error) {
      console.error('Error fetching booked leads:', error);
      toast.error('Failed to load booked leads');
      setLoadError(error instanceof Error ? error.message : 'Failed to load booked leads');
    } finally {
      setIsLoading(false);
      fetchInFlightRef.current = false;
    }
  };

  // Deep-link: open a specific booking when arriving via ?record=<id>.
  // Confirmed/cancelled/rescheduled bookings live here, not in GHL Submissions.
  useEffect(() => {
    const recordId = searchParams.get('record');
    if (!recordId || isLoading) return;
    const inActive = leads.find((l) => l.id === recordId);
    const inArchived = archivedLeads.find((l) => l.id === recordId);
    const match = inActive || inArchived;
    const clearParam = () => {
      const next = new URLSearchParams(searchParams);
      next.delete('record');
      setSearchParams(next, { replace: true });
    };
    if (match) {
      if (inArchived && !inActive && viewMode !== 'archived') setViewMode('archived');
      clearParam();
      navigate(`/admin/leads-booked/${match.id}`);
    } else {
      toast.error('Booking not found in this list', {
        description: 'It may have been deleted or moved. Try searching by email.',
      });
      clearParam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, leads, archivedLeads, isLoading]);



  // Filter and sort leads
  useEffect(() => {
    let result = viewMode === 'archived' ? archivedLeads : leads;

    // Apply status filter. `__awaiting` is a pseudo-status: those rows are
    // normally excluded from this page (no appointment behind them), so the
    // Awaiting tile has to opt them back in rather than filter by ghl_status.
    if (filterStatus !== 'all' && filterStatus !== '__awaiting') {
      if (filterStatus === 'cancelled') {
        result = result.filter(l => l.ghl_status === 'cancelled' || l.ghl_status === 'canceled');
      } else {
        result = result.filter(l => l.ghl_status === filterStatus);
      }
    }


    // Upcoming / Past / This week (by meeting time)
    if (timeFilter !== 'all') {
      const now = Date.now();
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).getTime();
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 }).getTime();
      result = result.filter((l) => {
        const st = (l.ghl_response as GHLResponseData)?.start_time;
        if (!st) return timeFilter === 'past';
        const t = new Date(st).getTime();
        if (timeFilter === 'upcoming') return t >= now;
        if (timeFilter === 'week') return t >= weekStart && t <= weekEnd;
        return t < now;
      });
    }

    // Calendar filter
    if (calendarFilter !== 'all') {
      result = result.filter((l) => (l.ghl_response as GHLResponseData)?.calendar_name === calendarFilter);
    }

    // Owner filter — read from the shared overlay, keyed the same way the Owner
    // column is, so "Unassigned" means exactly "no owner in the overlay".
    if (ownerFilter !== 'all') {
      result = result.filter((l) => {
        const name = ownerNameFor(l.id);
        return ownerFilter === '__unassigned' ? !name : name === ownerFilter;
      });
    }



    // Apply date range filter
    if (dateRange.from) {
      const fromDate = startOfDay(dateRange.from);
      const toDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(new Date(8640000000000000)); // Max date if no end
      result = result.filter(l => {
        const leadDate = new Date(l.created_at);
        return isWithinInterval(leadDate, { start: fromDate, end: toDate });
      });
    }

    // Apply search — the ONE shared matcher (src/lib/leadSearch.ts), so every
    // lead surface searches identically and no null field can break the list.
    if (searchQuery.trim()) {
      result = result.filter((lead) =>
        matchesLeadSearch(searchQuery, {
          text: [
            lead.lead_email,
            lead.lead_name,
            lead.lead_first_name,
            lead.lead_last_name,
            lead.lead_company,
          ],
          phones: [lead.lead_phone, (lead.ghl_response as GHLResponseData)?.phone],
        }),
      );
    }

    // Booked Leads is a confirmed-bookings page. A record that is still only
    // "booking shown" has no appointment behind it — no time, no link, nothing
    // to attend — so listing it here made the page impossible to trust at a
    // glance. Those still live in the Leads Inbox until GHL confirms them.
    // Cancelled / rescheduled / completed stay: they were real bookings and
    // still need attention.
    const isAwaiting = (l: GHLBookedLead) =>
      !hasAppointmentEvidence(l) && ['booking_shown', 'submitted', 'synced'].includes(getDisplayStatus(l));
    const awaitingConfirmation = result.filter(isAwaiting).length;
    setAwaitingCount(awaitingConfirmation);
    // The Awaiting tile shows exactly these rows; every other view hides them.
    result = filterStatus === '__awaiting' ? result.filter(isAwaiting) : result.filter((l) => !isAwaiting(l));


    // Apply column sorting
    if (columnSort.direction) {
      result = [...result].sort((a, b) => {
        switch (columnSort.column) {
          case 'lead':
            return compareValues(a, b, columnSort.direction, (item) => 
              item.lead_name || `${item.lead_first_name || ''} ${item.lead_last_name || ''}`.trim() || ''
            );
          case 'phone':
            return compareValues(a, b, columnSort.direction, (item) => 
              item.lead_phone || (item.ghl_response as GHLResponseData)?.phone || ''
            );
          case 'status':
            return compareValues(a, b, columnSort.direction, (item) => getDisplayStatus(item));
          case 'ghl_sync':
            return compareValues(a, b, columnSort.direction, (item) => 
              isGHLSynced(item) ? 'synced' : 'pending'
            );
          case 'source':
            return compareValues(a, b, columnSort.direction, (item) => item.lead_source || '');
          case 'appointment':
            return compareValues(a, b, columnSort.direction, (item) => {
              const startTime = (item.ghl_response as GHLResponseData)?.start_time;
              return startTime ? new Date(startTime) : null;
            });
          case 'created':
          default:
            return compareValues(a, b, columnSort.direction, (item) => new Date(item.created_at));
        }
      });
    } else {
      // Default sort by created date descending
      result = [...result].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    setFilteredLeads(result);
  }, [leads, archivedLeads, filterStatus, dateRange, searchQuery, viewMode, columnSort, timeFilter, calendarFilter, ownerFilter, ownerNameFor]);

  // Stats
  const stats = {
    total: leads.length,
    confirmed: leads.filter(l => l.ghl_status === 'confirmed').length,
    cancelled: leads.filter(l => l.ghl_status === 'cancelled' || l.ghl_status === 'canceled').length,
    rescheduled: leads.filter(l => l.ghl_status === 'rescheduled').length,
    deleted: leads.filter(l => l.ghl_status === 'deleted_from_ghl').length,
    archived: archivedLeads.length,
    // Meetings falling inside the current (Mon–Sun) week — same rule the
    // "This week" time filter applies, so tile and filter always agree.
    thisWeek: leads.filter((l) => {
      const st = (l.ghl_response as GHLResponseData)?.start_time;
      if (!st) return false;
      return isWithinInterval(new Date(st), {
        start: startOfWeek(new Date(), { weekStartsOn: 1 }),
        end: endOfWeek(new Date(), { weekStartsOn: 1 }),
      });
    }).length,
  };

  // Weekly trend data (last 7 days)
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateString = date.toDateString();
    const dayLeads = leads.filter(l => {
      const leadDate = new Date(l.created_at);
      return leadDate.toDateString() === dateString;
    });
    return {
      day: format(date, 'EEE'),
      fullDate: dateString,
      formattedDate: format(date, 'MMM d'),
      leads: dayLeads.length,
      isActive: dateRange.from && new Date(dateString).toDateString() === dateRange.from.toDateString() && !dateRange.to,
    };
  });

  const handleArchive = async (lead: GHLBookedLead) => {
    setIsArchiving(true);
    try {
      const { error } = await supabase
        .from('ghl_submissions')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', lead.id);

      if (error) throw error;
      toast.success('Lead archived');
      setSelectedLead(null);
      fetchLeads();
    } catch (error) {
      console.error('Error archiving lead:', error);
      toast.error('Failed to archive lead');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleRestore = async (lead: GHLBookedLead) => {
    try {
      const { error } = await supabase
        .from('ghl_submissions')
        .update({ archived_at: null })
        .eq('id', lead.id);

      if (error) throw error;
      toast.success('Lead restored');
      setSelectedLead(null);
      fetchLeads();
    } catch (error) {
      console.error('Error restoring lead:', error);
      toast.error('Failed to restore lead');
    }
  };

  const handleDelete = async (lead: GHLBookedLead) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('ghl_submissions')
        .delete()
        .eq('id', lead.id);

      if (error) throw error;
      toast.success('Lead deleted');
      setLeadToDelete(null);
      setSelectedLead(null);
      fetchLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Failed to delete lead');
    } finally {
      setIsDeleting(false);
    }
  };

  // Retry GHL sync for a lead
  const retryGHLSync = async (lead: GHLBookedLead, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (lead.ghl_status === 'deleted_from_ghl') {
      toast.info('This lead is marked as Deleted in GHL. Sync is disabled for deleted contacts.');
      return;
    }

    setSyncingLeadId(lead.id);
    // Prevent realtime -> fetch loops while the backend updates this record during a sync retry.
    suppressRealtimeRef.current = true;
    
    try {
      const response = await supabase.functions.invoke('log-ghl-submission', {
        body: {
          submission_id: lead.id, // Pass ID to update existing instead of creating duplicate
          lead_email: lead.lead_email,
          lead_name: lead.lead_name || `${lead.lead_first_name || ''} ${lead.lead_last_name || ''}`.trim(),
          lead_first_name: lead.lead_first_name,
          lead_last_name: lead.lead_last_name,
          lead_phone: lead.lead_phone,
          lead_company: lead.lead_company,
          source_page: lead.source_page,
          source_medium: lead.source_medium,
          lead_source: lead.lead_source,
          ghl_status: 'submitted',
          ghl_response: { sync_type: 'retry' },
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Sync failed');
      }

      toast.success('GHL sync retry initiated');
      await fetchLeads();
    } catch (error) {
      console.error('Error syncing to GHL:', error);
      const subject = encodeURIComponent('Issue: Leads Booked sync retry failed');
      const body = encodeURIComponent(
        `Hi team,\n\nThe Leads Booked sync retry failed on this page:\n${window.location.href}\n\nPlease include a screenshot of the page with the affected record visible.\n\nLead: ${lead.lead_email}\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n`
      );

      toast.error('Failed to sync to GHL', {
        description: 'Please try again. If it keeps happening, email support with a screenshot + this page URL.',
        action: {
          label: 'Email support',
          onClick: () => window.open(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`),
        },
      });
    } finally {
      setSyncingLeadId(null);
      // Re-enable realtime after a short delay to let any pending update events pass.
      setTimeout(() => {
        suppressRealtimeRef.current = false;
      }, 1000);
    }
  };

  const exportToCSV = () => {
    if (!filteredLeads.length) return;

    const headers = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Source', 'Appointment Time', 'Created'];
    const rows = filteredLeads.map((lead) => {
      const name = lead.lead_name || `${lead.lead_first_name || ''} ${lead.lead_last_name || ''}`.trim();
      const startTime = lead.ghl_response?.start_time;
      return [
        name,
        lead.lead_email,
        lead.lead_phone || '',
        lead.lead_company || '',
        capitalizeText(lead.ghl_status || ''),
        lead.lead_source === 'calendar_widget' ? 'Calendar Widget' : 'Direct Booking',
        startTime ? format(new Date(startTime), 'yyyy-MM-dd HH:mm') : '',
        format(new Date(lead.created_at), 'yyyy-MM-dd HH:mm'),
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads-booked-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('CSV exported successfully');
  };

  const getStatusBadge = (status: string | null) => {
    const statusClass = statusColors[status || ''] || "bg-muted text-muted-foreground";
    let icon = null;
    let label = capitalizeText(status || 'Unknown');
    
    if (status === 'confirmed') {
      icon = <CheckCircle2 className="w-3 h-3" />;
      label = 'Confirmed';
    } else if (status === 'cancelled' || status === 'canceled') {
      icon = <XCircle className="w-3 h-3" />;
      label = 'Cancelled';
    } else if (status === 'rescheduled') {
      icon = <RotateCcw className="w-3 h-3" />;
      label = 'Rescheduled';
    } else if (status === 'deleted_from_ghl') {
      icon = <Trash2 className="w-3 h-3" />;
      label = 'Deleted';
    }

    return (
      <Badge variant="outline" className={cn("gap-1 text-xs", statusClass)}>
        {icon}
        {label}
      </Badge>
    );
  };

  if (!canViewLeads) {
    return <AccessDenied message="Only admins can view leads." requiredRole="Admin or Super Admin" />;
  }

  if (loadError && !isLoading && leads.length === 0 && archivedLeads.length === 0) {
    return (
      <div className="space-y-4 p-4">
        <AdminErrorBanner
          error={loadError}
          context="load booked leads"
          onRetry={fetchLeads}
          isRetrying={isLoading}
          metadata={{
            route: '/admin/leads-booked',
            viewMode,
            filterStatus,
          }}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Leads Booked"
        icon={<Calendar className="h-5 w-5 text-primary" />}
        description={`${filteredLeads.length} ${filteredLeads.length === 1 ? 'lead' : 'leads'} from calendar bookings`}
        isRealtimeConnected={isRealtimeConnected}
      />

      <AdminMetricsStrip
        metrics={[
          {
            value: leads.length,
            label: 'Total booked',
            onClick: () => { setFilterStatus('all'); setViewMode('active'); setTimeFilter('all'); },
            active: filterStatus === 'all' && viewMode === 'active' && timeFilter === 'all',
          },
          {
            value: stats.confirmed,
            label: 'Confirmed',
            tone: 'good',
            onClick: () => { setFilterStatus('confirmed'); setViewMode('active'); },
            active: filterStatus === 'confirmed',
          },
          {
            // Bookings with no confirmed time yet — the same rows that render
            // "Awaiting time". Clicking opts them into the list (they're hidden
            // from every other view because there's no appointment behind them).
            value: awaitingCount,
            label: 'Awaiting',
            tone: 'warn',
            onClick: () => { setFilterStatus('__awaiting'); setViewMode('active'); setTimeFilter('all'); },
            active: filterStatus === '__awaiting',
          },

          {
            value: stats.thisWeek,
            label: 'This week',
            onClick: () => { setTimeFilter('week'); setViewMode('active'); },
            active: timeFilter === 'week',
          },
        ]}
      />

      {/* Admin-only tools row (S1): hidden entirely for non-admins. */}
      <AdminActionsRow
        actions={[
          {
            key: 'verify-all',
            label: 'Verify All',
            icon: <CheckCircle2 className="h-3.5 w-3.5" />,
            onClick: () => verifyAllPendingLeads(false),
            loading: isVerifyingAll,
          },
          {
            key: 'check-deleted',
            label: 'Check Deleted',
            icon: <Trash2 className="h-3.5 w-3.5" />,
            onClick: checkForDeletedContacts,
            loading: isCheckingDeleted,
          },
          {
            key: 'export',
            label: 'Export',
            icon: <Download className="h-3.5 w-3.5" />,
            onClick: exportToCSV,
            disabled: !filteredLeads.length,
            allowed: canExportLeads,
          },
          {
            key: 'refresh',
            label: 'Refresh',
            icon: <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />,
            onClick: fetchLeads,
          },
        ]}
      />


      {/* Weekly Trend Chart */}
      {leads.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Last 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} barSize={30}>
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                  />
                  <YAxis 
                    hide 
                    domain={[0, 'dataMax + 1']} 
                  />
                  <RechartsTooltip
                    cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-popover border shadow-lg rounded-lg px-3 py-2 text-sm">
                            <p className="font-medium">{data.formattedDate}</p>
                            <p className="text-muted-foreground">{data.leads} lead{data.leads !== 1 ? 's' : ''}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="leads" 
                    radius={[4, 4, 0, 0]}
                    onClick={(data) => {
                      const clickedDate = new Date(data.fullDate);
                      const isCurrentlySelected = dateRange.from && 
                        clickedDate.toDateString() === dateRange.from.toDateString() && 
                        !dateRange.to;
                      if (isCurrentlySelected) {
                        // Clear date filter to show all
                        setDateRange({ from: undefined, to: undefined });
                      } else {
                        setDateRange({ from: clickedDate, to: clickedDate });
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {weeklyData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isActive ? 'hsl(var(--primary))' : 'hsl(var(--primary)/0.3)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unified Filter Row */}
      <AdminToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name, email, company..."
        resultCount={filteredLeads.length}
        resultNoun="booking"
        filters={[
          {
            key: 'status',
            label: 'Status',
            // Cancelled and Archived moved off the metrics strip — they stay
            // fully reachable here. Archived is a view, not a ghl_status, so it
            // gets a pseudo-value that flips viewMode.
            options: [
              { value: 'all', label: 'All Status' },
              ...Array.from(
                new Set(leads.map((l) => l.ghl_status).filter((s): s is string => !!s)),
              )
                .filter((s) => s !== 'canceled')
                .sort()
                .map((s) => ({ value: s, label: STATUS_LABELS[s] ?? s.replace(/_/g, ' ') })),
              { value: '__awaiting', label: `Awaiting time (${awaitingCount})` },
              { value: '__archived', label: `Archived (${archivedLeads.length})` },
            ],
            value: viewMode === 'archived' ? '__archived' : filterStatus,
            onChange: (v) => {
              if (v === '__archived') {
                setViewMode('archived');
                setFilterStatus('all');
                return;
              }
              setViewMode('active');
              setFilterStatus(v);
            },
          },
          {
            key: 'timeFilter',
            label: 'Time',
            options: [
              { value: 'all', label: 'All times' },
              { value: 'upcoming', label: 'Upcoming' },
              { value: 'week', label: 'This week' },
              { value: 'past', label: 'Past' },
            ],
            value: timeFilter,
            onChange: (v) => setTimeFilter(v as 'all' | 'upcoming' | 'past' | 'week'),
            width: 'w-[130px]',
          },
          {
            key: 'owner',
            label: 'Owner',
            // Built from the owners actually present on these rows, so the list
            // can never offer a name that matches nothing.
            options: [
              { value: 'all', label: 'All owners' },
              { value: '__unassigned', label: 'Unassigned' },
              ...optionsFromData(
                viewMode === 'archived' ? archivedLeads : leads,
                (l) => ownerNameFor(l.id),
              ),
            ],
            value: ownerFilter,
            onChange: setOwnerFilter,
            width: 'w-[150px]',
          },
          {
            key: 'calendar',
            label: 'Calendar',
            options: [
              { value: 'all', label: 'All calendars' },
              ...Array.from(
                new Set(
                  leads
                    .map((l) => (l.ghl_response as GHLResponseData)?.calendar_name)
                    .filter((n): n is string => !!n),
                ),
              )
                .sort()
                .map((n) => ({ value: n, label: n })),
            ],
            value: calendarFilter,
            onChange: setCalendarFilter,
            width: 'w-[160px]',
          },
          {
            key: 'viewMode',
            allValue: 'active',
            label: 'View Mode',
            options: viewModeOptions,
            value: viewMode,
            onChange: (v) => setViewMode(v as 'active' | 'archived'),
            width: 'w-[120px]',
          },
          {
            key: 'sort',
            label: 'Sort',
            width: 'w-[170px]',
            allValue: 'created:desc',
            value: `${columnSort.column}:${columnSort.direction ?? 'desc'}`,
            onChange: (v) => {
              const [column, direction] = v.split(':');
              setColumnSort({ column, direction: direction as 'asc' | 'desc' });
            },
            options: [
              { value: 'created:desc', label: 'Newest first' },
              { value: 'created:asc', label: 'Oldest first' },
              { value: 'appointment:asc', label: 'Meeting soonest' },
              { value: 'appointment:desc', label: 'Meeting latest' },
              { value: 'lead:asc', label: 'Name A–Z' },
              { value: 'status:asc', label: 'Status' },
            ],
          },
        ]}
        onClearAll={() => {
          setSearchQuery('');
          setFilterStatus('all');
          setDateRange({ from: undefined, to: undefined });
          setTimeFilter('all');
          setCalendarFilter('all');
          setOwnerFilter('all');
          setColumnSort({ column: 'created', direction: 'desc' });
        }}
        actions={
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
                <Calendar className="h-3.5 w-3.5" />
                {dateRange.from ? (
                  dateRange.to && dateRange.from.toDateString() !== dateRange.to.toDateString() ? (
                    <span>{format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}</span>
                  ) : (
                    <span>{format(dateRange.from, 'MMM d, yyyy')}</span>
                  )
                ) : (
                  <span>All dates</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-2 border-b flex gap-1 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("h-7 text-xs", !dateRange.from && "bg-muted")}
                  onClick={() => setDateRange({ from: undefined, to: undefined })}
                >
                  All time
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}
                >
                  Last 7 days
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}
                >
                  Last 30 days
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setDateRange({ from: startOfToday(), to: undefined })}
                >
                  Today onwards
                </Button>
              </div>
              <CalendarComponent
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  setDateRange({ from: range?.from, to: range?.to });
                }}
                numberOfMonths={2}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        }
      />

      <Card>
        <CardContent className="pt-4">
      {awaitingCount > 0 && (
        <div className="mb-3 rounded-lg border border-[hsl(var(--status-atrisk)/0.3)] bg-[hsl(var(--status-atrisk-surface))] px-3 py-2 text-xs text-[hsl(var(--status-atrisk))]">
          <b>{awaitingCount}</b> {awaitingCount === 1 ? 'lead is' : 'leads are'} awaiting confirmation and{' '}
          {awaitingCount === 1 ? 'is' : 'are'} not shown here — they have no appointment time yet. Find them in the{' '}
          <Link to="/admin/leads" className="underline underline-offset-2">Leads Inbox</Link>.
        </div>
      )}
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-1">No booked leads found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || filterStatus !== 'all' || dateRange.from
                  ? 'Try adjusting your filters'
                  : 'Leads from calendar bookings will appear here'}
              </p>
            </div>
          ) : (
            <LeadList>
              <LeadListHeader whenLabel="Meeting" />
              {filteredLeads.map((lead) => {
                const name = formatDisplayName(lead.lead_first_name, lead.lead_last_name, lead.lead_name || undefined) || 'Unknown';
                const startTime = lead.ghl_response?.start_time;
                const ghlContactId = lead.ghl_response?.ghl_contact_id;
                const syncStatus = getGHLSyncStatus(lead);
                const SyncIcon = syncStatus.icon;
                const phone = lead.lead_phone || lead.ghl_response?.phone;
                const isPast = startTime ? new Date(startTime) < new Date() : false;
                const joinLink =
                  lead.meet_link || lead.ghl_response?.meet_link || lead.ghl_response?.google_meet_link;
                // The evidence, not the label. See getDisplayStatus.
                const displayStatus = getDisplayStatus(lead);

                return (
                  <LeadListRow
                    key={lead.id}
                    onClick={() => navigate(`/admin/leads-booked/${lead.id}`)}
                    syncSlot={
                      <GHLSyncDot
                        input={lead.ghl_response ? { ghl_status: lead.ghl_status, ghl_response: lead.ghl_response } : lead}
                      />
                    }
                    name={name}
                    badgeSlot={<SourceBadge label="Booked" />}
                    extraSlot={
                      <>
                        <Badge variant="outline" className="gap-1 text-[10px] font-normal">
                          {lead.lead_source === 'calendar_widget' ? 'Widget' : 'Direct'}
                        </Badge>
                        <Badge variant="outline" className={cn('gap-1 text-[10px] font-normal', syncStatus.color)}>
                          <SyncIcon className="h-3 w-3" />
                          {syncStatus.label}
                        </Badge>
                        <LeadOverlayBadges source="ghl_submissions" id={lead.id} />
                      </>
                    }
                    contactLine={
                      <span className="flex flex-wrap items-center gap-x-2">
                        <span className="truncate">{lead.lead_email}</span>
                        {phone && (
                          <>
                            <span aria-hidden>·</span>
                            <a
                              href={`tel:${phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-primary hover:underline"
                            >
                              {phone}
                            </a>
                          </>
                        )}
                        {lead.lead_company && (
                          <>
                            <span aria-hidden>·</span>
                            <span className="truncate">{formatName(lead.lead_company)}</span>
                          </>
                        )}
                      </span>
                    }
                    status={displayStatus}
                    statusLabel={leadStatusLabel({ source: 'ghl_submissions', status: displayStatus })}
                    ownerSlot={<LeadOverlayOwnerCell source="ghl_submissions" id={lead.id} />}
                    whenSlot={
                      <div className="flex flex-col gap-0.5">
                        {startTime ? (
                          <span className={cn('flex items-center gap-1', isPast && 'opacity-60')}>
                            <Clock className="h-3 w-3 shrink-0" />
                            {format(new Date(startTime), 'MMM d, h:mm a')}
                            {isPast && <span className="text-[10px] uppercase tracking-wide">past</span>}
                          </span>
                        ) : (
                          <span>—</span>
                        )}
                        {joinLink && (
                          <a
                            href={joinLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-primary hover:underline"
                          >
                            Join meeting
                          </a>
                        )}
                        <span className="opacity-70">Added {format(new Date(lead.created_at), 'MMM d')}</span>
                      </div>
                    }
                    actionsSlot={
                      <div className="flex items-center gap-0.5">
                        {!syncStatus.synced && viewMode === 'active' && lead.ghl_status !== 'deleted_from_ghl' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Retry GHL sync"
                            onClick={(e) => retryGHLSync(lead, e)}
                            disabled={syncingLeadId === lead.id}
                          >
                            {syncingLeadId === lead.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                        {(syncStatus.synced || lead.ghl_status === 'deleted_from_ghl') && viewMode === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Recheck GHL status"
                            onClick={(e) => recheckSingleLead(lead, e)}
                            disabled={recheckingLeadId === lead.id}
                          >
                            {recheckingLeadId === lead.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Search className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                        <LegacyLeadActions
                          source="ghl_submissions"
                          id={lead.id}
                          name={name}
                          email={lead.lead_email}
                          phone={lead.lead_phone}
                          company={lead.lead_company}
                          status={lead.ghl_status}
                          createdAt={lead.created_at}
                          ghlContactId={ghlContactId}
                          appointmentId={lead.ghl_response?.appointment_id as string | undefined}
                          raw={lead as unknown as Record<string, unknown>}
                        />
                      </div>
                    }
                  />
                );
              })}
            </LeadList>
          )}
        </CardContent>
      </Card>



      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!leadToDelete} onOpenChange={(open) => !open && setLeadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this lead for{' '}
              <span className="font-medium text-foreground">
                {leadToDelete?.lead_name || leadToDelete?.lead_email}
              </span>?
              <br /><br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => leadToDelete && handleDelete(leadToDelete)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
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
    </div>
  );
}
