import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { capitalizeText, formatName } from '@/lib/textFormatting';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { 
  Loader2, 
  Calendar,
  Clock,
  User,
  Building,
  Video,
  RefreshCw,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Phone,
  Mail,
  MessageSquare,
  Users,
  Link2,
  Copy,
  Save,
  RotateCcw,
  History,
  Plus,
  FileText,
  Globe,
  Briefcase,
  Target,
  Timer,
  Sparkles,
  Tag,
  
  Trash2,
  Archive,
  Lock,
  FolderSync } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { standardSortOptions } from '@/components/admin';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminMetricsStrip } from '@/components/admin/AdminMetricsStrip';
import { AdminToolbar } from '@/components/admin/AdminToolbar';
import { AdminActionsRow } from '@/components/admin/AdminActionsRow';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, isPast, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import AccessDenied from '@/components/admin/AccessDenied';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { getGHLContactUrl } from '@/lib/ghlConfig';
import { MeetingDocumentsSection } from '@/components/admin/MeetingDocumentsSection';
import { UnmatchedTranscriptsSection } from '@/components/admin/UnmatchedTranscriptsSection';
import { recordOwnedByDistributor, shouldHideCompanyWideRecords } from '@/lib/distributorScope';

interface MeetingHistoryEntry {
  id: string;
  meeting_id: string;
  previous_status: string | null;
  new_status: string;
  event_type: string;
  notes: string | null;
  appointment_id: string | null;
  created_by: string | null;
  created_at: string;
}

interface InvestorBooking {
  id: string;
  investor_id: string | null;
  event_name: string | null;
  event_type: string | null;
  status: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  cancellation_reason: string | null;
  calendly_event_id: string | null;
  created_at: string;
  investor?: {
    full_name: string;
    email: string;
    firm_name: string;
  } | null;
}

interface QualificationData {
  role?: string;
  industry?: string;
  challenge?: string;
  size?: string;
  timeline?: string;
  topic?: string;
}

interface GHLBooking {
  id: string;
  lead_email: string;
  lead_name: string | null;
  lead_first_name: string | null;
  lead_last_name: string | null;
  lead_phone: string | null;
  lead_company: string | null;
  ghl_status: string;
  meet_link: string | null;
  source_page: string;
  source_medium: string;
  lead_source: string | null;
  created_at: string;
  ghl_response: {
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
    qualification_data?: QualificationData;
    tags_applied?: string[];
    synced_at?: string;
    event_type?: string;
    ghl_company_synced?: boolean;
    ghl_company_synced_at?: string;
    ghl_business_name?: string;
  } | null;
}

// Unified meeting type
interface UnifiedMeeting {
  id: string;
  type: 'investor' | 'demo';
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  ghlBusinessName?: string | null;
  event_name: string | null;
  status: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  meet_link: string | null;
  calendar_name: string | null;
  cancellation_reason: string | null;
  created_at: string;
  source?: string;
  sourceMedium?: string;
  leadSource?: string;
  ghl_contact_id?: string;
  appointment_id?: string;
  website?: string;
  qualification?: QualificationData;
  tags?: string[];
  syncedAt?: string;
  hasTranscript?: boolean;
  transcriptCount?: number;
  companyGhlSynced?: boolean;
}

export default function MeetingsAdmin() {
  const { user } = useAdminAuth();
  const { canViewLeads, isDistributor, viewAsProfile } = usePermissions();
  // When an admin previews via "View As", scope distributor data to the previewed user.
  const scopedUserId = viewAsProfile?.userId ?? user?.id ?? null;
  const [collaboratorMeetingIds, setCollaboratorMeetingIds] = useState<Set<string>>(new Set());
  const [investorBookings, setInvestorBookings] = useState<InvestorBooking[]>([]);
  const [ghlBookings, setGhlBookings] = useState<GHLBooking[]>([]);
  const [archivedMeetings, setArchivedMeetings] = useState<GHLBooking[]>([]);
  const [unifiedMeetings, setUnifiedMeetings] = useState<UnifiedMeeting[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<UnifiedMeeting[]>([]);
  const [documentCounts, setDocumentCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  // Four independent filters, combinable — they used to be ONE "active tab"
  // shared by time, type, status and platform, so picking "Zoom" silently
  // dropped "Upcoming". Archived is a view, not a status, so it stays a
  // pseudo-value of the status filter.
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'name_asc' | 'name_desc'>('date_desc');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined });
  
  // Dialog state
  const [selectedMeeting, setSelectedMeeting] = useState<UnifiedMeeting | null>(null);
  const [editMeetLink, setEditMeetLink] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingLink, setIsFetchingLink] = useState(false);
  const [isBulkFetching, setIsBulkFetching] = useState(false);
  const [isMergingDuplicates, setIsMergingDuplicates] = useState(false);
  const [fetchProgress, setFetchProgress] = useState({ current: 0, total: 0, success: 0 });
  const [hasAutoFetched, setHasAutoFetched] = useState(false);
  
  // History and notes state
  const [meetingHistory, setMeetingHistory] = useState<MeetingHistoryEntry[]>([]);
  const [historyMeetingIds, setHistoryMeetingIds] = useState<string[]>([]);
  const [historyAuthors, setHistoryAuthors] = useState<Record<string, { display_name: string; email: string }>>({});
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  
  // Delete state
  const [meetingToDelete, setMeetingToDelete] = useState<UnifiedMeeting | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Google Drive sync state
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  
  // Business name sync state
  const [isSyncingBusinessNames, setIsSyncingBusinessNames] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAllBookings();
    }
  }, [user]);

  // Real-time subscription for new bookings - synced with Leads Booked panel
  useEffect(() => {
    if (!user) return;

    // Subscribe to all GHL submissions changes - refresh on any meeting-related change
    // This ensures Meetings and Leads Booked panels stay in sync
    const ghlChannel = supabase
      .channel('meetings-ghl-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ghl_submissions'
        },
        (payload) => {
          // Check if this submission belongs in Meetings panel
          const record = payload.new as Record<string, unknown> | undefined;
          const ghlStatus = record?.ghl_status as string | undefined;
          const leadSource = record?.lead_source as string | undefined;
          const sourceMedium = record?.source_medium as string | undefined;
          const archivedAt = record?.archived_at as string | undefined;
          
          const isMeetingRelated = 
            ['confirmed', 'cancelled', 'rescheduled', 'deleted_from_ghl'].includes(ghlStatus || '') ||
            leadSource === 'calendar_widget' ||
            sourceMedium === 'ghl_direct_booking';
          
          // Also refresh on archive/restore actions or deletions
          if (isMeetingRelated || payload.eventType === 'DELETE' || archivedAt !== undefined) {
            console.log('GHL submission changed (meeting-related), refreshing meetings...');
            fetchGHLBookings();
          }
        }
      )
      .subscribe();

    const investorChannel = supabase
      .channel('meetings-investor-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'investor_bookings'
        },
        () => {
          console.log('Investor booking changed, refreshing meetings...');
          fetchInvestorBookings();
        }
      )
      .subscribe();

    // Subscribe to meeting_history for webhook-driven status updates
    const historyChannel = supabase
      .channel('meetings-history-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'meeting_history'
        },
        (payload) => {
          console.log('Meeting history updated (webhook), refreshing...', payload.new);
          // Refresh both sources to catch any status changes
          fetchGHLBookings();
          fetchInvestorBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ghlChannel);
      supabase.removeChannel(investorChannel);
      supabase.removeChannel(historyChannel);
    };
  }, [user]);

  useEffect(() => {
    combineBookings();
  }, [investorBookings, ghlBookings, documentCounts, isDistributor, scopedUserId, collaboratorMeetingIds]);

  // Load collaborator meeting (ghl_submission) ids for the previewed/current distributor.
  useEffect(() => {
    if (!isDistributor || !scopedUserId) {
      setCollaboratorMeetingIds(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('record_collaborators')
          .select('entity_id')
          .eq('entity_type', 'ghl_submission')
          .eq('user_id', scopedUserId);
        if (error) throw error;
        if (!cancelled) setCollaboratorMeetingIds(new Set((data || []).map((r) => r.entity_id)));
      } catch (err) {
        console.error('Failed to load collaborator meetings:', err);
        if (!cancelled) setCollaboratorMeetingIds(new Set());
      }
    })();
    return () => { cancelled = true; };
  }, [isDistributor, scopedUserId]);

  useEffect(() => {
    filterMeetings();
  }, [unifiedMeetings, archivedMeetings, searchQuery, statusFilter, timeFilter, filterType, platformFilter, sortBy, dateRange, isDistributor, scopedUserId, collaboratorMeetingIds]);

  // Auto-fetch meeting links on initial load
  useEffect(() => {
    if (!isLoading && unifiedMeetings.length > 0 && !hasAutoFetched && !isBulkFetching) {
      const meetingsNeedingLinks = unifiedMeetings.filter(
        m => m.type === 'demo' && !m.meet_link && m.status === 'confirmed'
      );
      if (meetingsNeedingLinks.length > 0) {
        setHasAutoFetched(true);
        handleBulkFetchLinks(true);
      } else {
        setHasAutoFetched(true);
      }
    }
  }, [isLoading, unifiedMeetings, hasAutoFetched, isBulkFetching]);

  const fetchAllBookings = async () => {
    setIsLoading(true);
    await Promise.all([fetchInvestorBookings(), fetchGHLBookings(), fetchDocumentCounts()]);
    setIsLoading(false);
  };

  const fetchDocumentCounts = async () => {
    // Fetch count of documents per meeting
    const { data, error } = await supabase
      .from('meeting_documents')
      .select('meeting_id, meeting_type')
      .not('meeting_id', 'is', null);

    if (error) {
      console.error('Failed to fetch document counts:', error);
      return;
    }

    // Build a map of meeting_id -> count
    const counts: Record<string, number> = {};
    (data || []).forEach((doc) => {
      if (doc.meeting_id) {
        counts[doc.meeting_id] = (counts[doc.meeting_id] || 0) + 1;
      }
    });
    setDocumentCounts(counts);
  };

  const fetchInvestorBookings = async () => {
    const { data, error } = await supabase
      .from('investor_bookings')
      .select(`
        *,
        investor:investor_leads(full_name, email, firm_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch investor bookings:', error);
    } else {
      setInvestorBookings(data || []);
    }
  };

  const fetchGHLBookings = async () => {
    // Fetch active meetings - includes:
    // 1. Booked appointments (ghl_status in confirmed, cancelled, rescheduled, deleted_from_ghl)
    // 2. Calendar-originated leads (lead_source = calendar_widget OR source_medium = ghl_direct_booking)
    const { data, error } = await supabase
      .from('ghl_submissions')
      .select('*')
      .is('archived_at', null)
      .or('ghl_status.in.(confirmed,cancelled,rescheduled,deleted_from_ghl),lead_source.eq.calendar_widget,source_medium.eq.ghl_direct_booking')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch GHL bookings:', error);
    } else {
      setGhlBookings((data || []) as GHLBooking[]);
    }
    
    // Fetch archived meetings - ONLY from meetings context (those with meeting statuses or calendar origin)
    // This keeps archived meetings separate from archived GHL submissions
    const { data: archivedData } = await supabase
      .from('ghl_submissions')
      .select('*')
      .not('archived_at', 'is', null)
      .or('ghl_status.in.(confirmed,cancelled,rescheduled,deleted_from_ghl),lead_source.eq.calendar_widget,source_medium.eq.ghl_direct_booking')
      .order('archived_at', { ascending: false });
    
    setArchivedMeetings((archivedData || []) as GHLBooking[]);
  };

  const combineBookings = () => {
    const meetings: UnifiedMeeting[] = [];

    // Distributor scope: only this distributor's own meetings (assigned, created, or collaborator).
    const ghlOwnedByDistributor = (booking: { id: string; assigned_distributor_id?: string | null; created_by_user_id?: string | null }): boolean =>
      recordOwnedByDistributor(booking, { isDistributor, scopedUserId, collaboratorIds: collaboratorMeetingIds });

    // Add investor bookings — hidden entirely for distributors (company-wide data).
    if (!shouldHideCompanyWideRecords({ isDistributor, scopedUserId })) investorBookings.forEach((booking) => {
      const transcriptCount = documentCounts[booking.id] || 0;
      meetings.push({
        id: booking.id,
        type: 'investor',
        name: booking.investor?.full_name || 'Unknown Investor',
        email: booking.investor?.email || '',
        phone: null,
        company: booking.investor?.firm_name || null,
        event_name: booking.event_name,
        status: booking.status,
        start_time: booking.start_time,
        end_time: booking.end_time,
        location: booking.location,
        meet_link: extractMeetLink(booking.location),
        calendar_name: null,
        cancellation_reason: booking.cancellation_reason,
        created_at: booking.created_at,
        hasTranscript: transcriptCount > 0,
        transcriptCount });
    });

    // Add GHL demo bookings
    ghlBookings.forEach((booking) => {
      if (!ghlOwnedByDistributor(booking as unknown as { id: string; assigned_distributor_id?: string | null; created_by_user_id?: string | null })) return;
      const response = booking.ghl_response;
      // Priority: database meet_link > response meet_link > extracted from location
      const meetLink = booking.meet_link || response?.meet_link || response?.google_meet_link || extractMeetLink(response?.location);
      
      // Map ghl_status to meeting status
      const meetingStatus = booking.ghl_status === 'cancelled' ? 'cancelled' 
        : booking.ghl_status === 'rescheduled' ? 'rescheduled' 
        : booking.ghl_status === 'deleted_from_ghl' ? 'deleted_from_ghl'
        : booking.ghl_status === 'booking_shown' ? 'pending'
        : 'confirmed';
      
      // Build display name from available data
      const displayName = booking.lead_name || 
        (booking.lead_first_name && booking.lead_last_name 
          ? `${booking.lead_first_name} ${booking.lead_last_name}` 
          : booking.lead_first_name || booking.lead_email.split('@')[0]);
      
      const transcriptCount = documentCounts[booking.id] || 0;
      
      meetings.push({
        id: booking.id,
        type: 'demo',
        name: displayName,
        email: booking.lead_email,
        phone: response?.phone || booking.lead_phone,
        company: booking.lead_company || extractCompanyFromEmail(booking.lead_email),
        event_name: 'Impact Conversation',
        status: meetingStatus,
        start_time: response?.start_time || null,
        end_time: response?.end_time || null,
        location: response?.location || null,
        meet_link: meetLink,
        calendar_name: response?.calendar_name || null,
        cancellation_reason: null,
        created_at: booking.created_at,
        source: booking.source_page,
        sourceMedium: booking.source_medium,
        leadSource: booking.lead_source || undefined,
        ghl_contact_id: response?.ghl_contact_id,
        appointment_id: response?.appointment_id,
        website: response?.website,
        qualification: response?.qualification_data,
        tags: response?.tags_applied,
        syncedAt: response?.synced_at,
        hasTranscript: transcriptCount > 0,
        transcriptCount,
        companyGhlSynced: response?.ghl_company_synced === true,
        ghlBusinessName: response?.ghl_business_name || null });
    });

    // Sort by start_time (upcoming first), then by created_at
    meetings.sort((a, b) => {
      if (a.start_time && b.start_time) {
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      }
      if (a.start_time) return -1;
      if (b.start_time) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setUnifiedMeetings(meetings);
  };

  // Extract company name from email domain (fallback when lead_company is null)
  const extractCompanyFromEmail = (email: string): string | null => {
    if (!email) return null;
    const domain = email.split('@')[1];
    if (!domain) return null;
    // Skip common email providers
    const commonProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'live.com', 'aol.com', 'msn.com', 'mail.com'];
    if (commonProviders.includes(domain.toLowerCase())) return null;
    // Extract company name from domain (remove TLD)
    const parts = domain.split('.');
    if (parts.length >= 2) {
      // Capitalize first letter of company name
      const companyName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      return companyName;
    }
    return null;
  };

  const extractMeetLink = (location: string | null | undefined): string | null => {
    if (!location) return null;
    // Check for Google Meet links
    const meetMatch = location.match(/https:\/\/meet\.google\.com\/[a-z-]+/i);
    if (meetMatch) return meetMatch[0];
    // Check for Zoom links
    const zoomMatch = location.match(/https:\/\/[a-z0-9-]*\.?zoom\.us\/[^\s]+/i);
    if (zoomMatch) return zoomMatch[0];
    // Check if the entire location is a URL
    if (location.startsWith('https://')) return location;
    return null;
  };

  const filterMeetings = () => {
    // If viewing archived, show archived meetings instead
    if (statusFilter === 'archived') {
      const scopedArchived = (isDistributor && scopedUserId)
        ? archivedMeetings.filter((b) => {
            const rec = b as unknown as { id: string; assigned_distributor_id?: string | null; created_by_user_id?: string | null };
            return rec.assigned_distributor_id === scopedUserId
              || rec.created_by_user_id === scopedUserId
              || collaboratorMeetingIds.has(b.id);
          })
        : archivedMeetings;
      const archivedUnified: UnifiedMeeting[] = scopedArchived.map((booking) => ({
        id: booking.id,
        type: 'demo' as const,
        name: booking.lead_name || 'Unknown',
        email: booking.lead_email,
        phone: booking.lead_phone,
        company: booking.lead_company || extractCompanyFromEmail(booking.lead_email),
        event_name: booking.ghl_response?.calendar_name as string || null,
        status: 'archived',
        start_time: booking.ghl_response?.start_time as string || null,
        end_time: booking.ghl_response?.end_time as string || null,
        location: null,
        meet_link: booking.meet_link || booking.ghl_response?.meet_link as string || null,
        calendar_name: booking.ghl_response?.calendar_name as string || null,
        cancellation_reason: null,
        created_at: booking.created_at || '',
        source: booking.source_page,
        ghl_contact_id: booking.ghl_response?.ghl_contact_id as string,
        appointment_id: booking.ghl_response?.appointment_id as string }));
      setFilteredMeetings(archivedUnified);
      return;
    }
    
    let filtered = [...unifiedMeetings];
    const now = new Date();

    const isPastStart = (m: UnifiedMeeting) => !!m.start_time && new Date(m.start_time) <= now;

    if (timeFilter === 'upcoming') {
      filtered = filtered.filter((m) => !!m.start_time && new Date(m.start_time) > now && m.status !== 'cancelled');
    } else if (timeFilter === 'past') {
      filtered = filtered.filter((m) => isPastStart(m) && m.status !== 'cancelled');
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((m) => m.type === filterType);
    }

    if (statusFilter === 'confirmed') {
      filtered = filtered.filter((m) => m.status === 'confirmed');
    } else if (statusFilter === 'completed') {
      filtered = filtered.filter((m) => isPastStart(m) && m.status === 'confirmed');
    } else if (statusFilter === 'cancelled') {
      filtered = filtered.filter((m) => m.status === 'cancelled' || m.status === 'canceled');
    } else if (statusFilter === 'rescheduled') {
      filtered = filtered.filter((m) => m.status === 'rescheduled');
    } else if (statusFilter === 'deleted') {
      filtered = filtered.filter((m) => m.status === 'deleted_from_ghl');
    }

    if (platformFilter === 'googleMeet') {
      filtered = filtered.filter((m) => m.meet_link?.includes('meet.google.com'));
    } else if (platformFilter === 'zoom') {
      filtered = filtered.filter((m) => m.meet_link?.includes('zoom'));
    } else if (platformFilter === 'noLink') {
      filtered = filtered.filter((m) => !m.meet_link && m.status === 'confirmed');
    } else if (platformFilter === 'transcript') {
      filtered = filtered.filter((m) => m.hasTranscript);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.email.toLowerCase().includes(query) ||
          m.company?.toLowerCase().includes(query) ||
          m.phone?.toLowerCase().includes(query) ||
          m.event_name?.toLowerCase().includes(query) ||
          m.website?.toLowerCase().includes(query)
      );
    }

    // Apply date range filter
    if (dateRange.from) {
      const fromDate = startOfDay(dateRange.from);
      const toDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(new Date(8640000000000000));
      filtered = filtered.filter((m) => {
        const meetingDate = new Date(m.created_at);
        return isWithinInterval(meetingDate, { start: fromDate, end: toDate });
      });
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'date_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredMeetings(filtered);
  };

  const fetchMeetingHistoryForIds = async (meetingIds: string[]) => {
    if (meetingIds.length === 0) {
      setMeetingHistory([]);
      setHistoryAuthors({});
      return;
    }

    const { data: history } = await supabase
      .from('meeting_history')
      .select('*')
      .in('meeting_id', meetingIds)
      .order('created_at', { ascending: false });

    const typedHistory = (history || []) as MeetingHistoryEntry[];
    setMeetingHistory(typedHistory);

    const authorIds = Array.from(
      new Set(typedHistory.map((h) => h.created_by).filter(Boolean) as string[])
    );

    if (authorIds.length === 0) {
      setHistoryAuthors({});
      return;
    }

    const { data: authors } = await supabase
      .from('admin_users')
      .select('id, display_name, email')
      .in('id', authorIds);

    const authorMap: Record<string, { display_name: string; email: string }> = {};
    (authors || []).forEach((a) => {
      authorMap[a.id] = { display_name: a.display_name, email: a.email };
    });
    setHistoryAuthors(authorMap);
  };

  const refreshSelectedDemoMeetingFromBackend = async (meeting: UnifiedMeeting) => {
    if (meeting.type !== 'demo') return;

    try {
      // Proactively sync latest contact/company data from GHL on open
      await supabase.functions.invoke('verify-ghl-sync', {
        body: {
          submission_ids: [meeting.id],
          sync_business_names: true,
          source: 'meetings' } });
    } catch (e) {
      // Non-blocking; we'll still try to read whatever is in the DB
      console.warn('verify-ghl-sync (details) failed:', e);
    }

    try {
      const { data, error } = await supabase
        .from('ghl_submissions')
        .select('id, lead_email, lead_phone, lead_company, lead_first_name, lead_last_name, lead_name, meet_link, ghl_status, created_at, source_page, source_medium, lead_source, ghl_response')
        .eq('id', meeting.id)
        .maybeSingle();

      if (error || !data) return;

      const response = (data.ghl_response as any) || null;
      const meetLink = (data.meet_link as string | null) || response?.meet_link || response?.google_meet_link || extractMeetLink(response?.location);

      const meetingStatus = data.ghl_status === 'cancelled' ? 'cancelled'
        : data.ghl_status === 'rescheduled' ? 'rescheduled'
        : data.ghl_status === 'deleted_from_ghl' ? 'deleted_from_ghl'
        : data.ghl_status === 'booking_shown' ? 'pending'
        : 'confirmed';

      const displayName = (data.lead_name as string | null) ||
        ((data.lead_first_name as string | null) && (data.lead_last_name as string | null)
          ? `${data.lead_first_name} ${data.lead_last_name}`
          : (data.lead_first_name as string | null) || (data.lead_email as string).split('@')[0]);

      setSelectedMeeting((prev) => {
        // If the user closed the dialog meanwhile, don't overwrite
        if (!prev || prev.id !== meeting.id) return prev;

        return {
          ...prev,
          name: displayName,
          email: data.lead_email as string,
          phone: response?.phone || (data.lead_phone as string | null) || null,
          company: (data.lead_company as string | null) || extractCompanyFromEmail(data.lead_email as string),
          status: meetingStatus,
          start_time: response?.start_time || null,
          end_time: response?.end_time || null,
          location: response?.location || null,
          meet_link: meetLink,
          calendar_name: response?.calendar_name || null,
          source: data.source_page as string | null,
          sourceMedium: data.source_medium as string | null,
          leadSource: (data.lead_source as string | null) || undefined,
          ghl_contact_id: response?.ghl_contact_id,
          appointment_id: response?.appointment_id,
          website: response?.website,
          qualification: response?.qualification_data,
          tags: response?.tags_applied,
          syncedAt: response?.synced_at,
          companyGhlSynced: response?.ghl_company_synced === true,
          ghlBusinessName: response?.ghl_business_name ?? null };
      });
    } catch (e) {
      console.error('Failed refreshing meeting details:', e);
    }
  };

  const handleMeetingClick = async (meeting: UnifiedMeeting) => {
    setSelectedMeeting(meeting);
    setEditMeetLink(meeting.meet_link || '');
    setNewNote('');
    setShowHistoryPanel(false);

    // Ensure company/business name reflects latest edits/deletes in GHL
    if (meeting.type === 'demo' && meeting.ghl_contact_id) {
      void refreshSelectedDemoMeetingFromBackend(meeting);
    }

    // If this contact has duplicate meetings, show a combined history across them.
    // Include archived meetings too, so past appointments remain visible.
    const relatedMeetingIds =
      meeting.type === 'demo' && meeting.ghl_contact_id
        ? Array.from(
            new Set([
              ...unifiedMeetings
                .filter((m) => m.type === 'demo' && m.ghl_contact_id === meeting.ghl_contact_id)
                .map((m) => m.id),
              ...archivedMeetings
                .filter((b) => (b.ghl_response?.ghl_contact_id as string | undefined) === meeting.ghl_contact_id)
                .map((b) => b.id),
            ])
          )
        : [meeting.id];

    setHistoryMeetingIds(relatedMeetingIds);
    await fetchMeetingHistoryForIds(relatedMeetingIds);
  };

  const handleAddNote = async () => {
    if (!selectedMeeting || !newNote.trim() || !user) return;
    
    setIsAddingNote(true);
    try {
      const { error } = await supabase
        .from('meeting_history')
        .insert({
          meeting_id: selectedMeeting.id,
          meeting_type: selectedMeeting.type,
          previous_status: selectedMeeting.status,
          new_status: selectedMeeting.status,
          event_type: 'note_added',
          notes: newNote.trim(),
          created_by: user.id });

      if (error) throw error;
      
      toast.success('Note added');
      setNewNote('');
      
      // Refresh history (respecting duplicate-contact scope)
      await fetchMeetingHistoryForIds(historyMeetingIds.length ? historyMeetingIds : [selectedMeeting.id]);
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleSaveMeetLink = async () => {
    if (!selectedMeeting) return;

    const previousLink = selectedMeeting.meet_link || null;
    const nextLink = editMeetLink || null;

    setIsSaving(true);
    try {
      if (selectedMeeting.type === 'demo') {
        const { error } = await supabase
          .from('ghl_submissions')
          .update({ meet_link: nextLink })
          .eq('id', selectedMeeting.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('investor_bookings')
          .update({ location: nextLink })
          .eq('id', selectedMeeting.id);

        if (error) throw error;
      }

      // Log meet link changes (who + when)
      if (previousLink !== nextLink) {
        await supabase.from('meeting_history').insert({
          meeting_id: selectedMeeting.id,
          meeting_type: selectedMeeting.type,
          previous_status: selectedMeeting.status,
          new_status: selectedMeeting.status,
          event_type: 'meet_link_saved',
          notes: `Meeting link updated: ${previousLink || '(empty)'} → ${nextLink || '(empty)'}`,
          created_by: user?.id });
      }

      toast.success('Meeting link saved');

      // Update local state
      setUnifiedMeetings((prev) =>
        prev.map((m) => (m.id === selectedMeeting.id ? { ...m, meet_link: nextLink } : m))
      );
      setSelectedMeeting((prev) => (prev ? { ...prev, meet_link: nextLink } : null));

      // Refresh history (respecting duplicate-contact scope)
      await fetchMeetingHistoryForIds(historyMeetingIds.length ? historyMeetingIds : [selectedMeeting.id]);

      // Refresh data
      fetchAllBookings();
    } catch (error) {
      console.error('Error saving meet link:', error);
      toast.error('Failed to save meeting link');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFetchGHLLink = async () => {
    if (!selectedMeeting || selectedMeeting.type !== 'demo') return;
    
    setIsFetchingLink(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-ghl-meeting-link', {
        body: {
          submissionId: selectedMeeting.id,
          email: selectedMeeting.email,
          contactId: selectedMeeting.ghl_contact_id }
      });

      if (error) throw error;

      if (data?.success && data?.meetLink) {
        const previousLink = selectedMeeting.meet_link || null;
        const nextLink = data.meetLink as string;

        setEditMeetLink(nextLink);

        // Update local state immediately
        setUnifiedMeetings((prev) => prev.map((m) => (m.id === selectedMeeting.id ? { ...m, meet_link: nextLink } : m)));
        setSelectedMeeting((prev) => (prev ? { ...prev, meet_link: nextLink } : null));

        // Log link fetch (who + when)
        if (previousLink !== nextLink) {
          await supabase.from('meeting_history').insert({
            meeting_id: selectedMeeting.id,
            meeting_type: selectedMeeting.type,
            previous_status: selectedMeeting.status,
            new_status: selectedMeeting.status,
            event_type: 'meet_link_fetched',
            notes: `Meeting link fetched from GHL: ${nextLink}`,
            created_by: user?.id });
        }

        toast.success('Meeting link fetched from GHL');

        // Refresh history (respecting duplicate-contact scope)
        await fetchMeetingHistoryForIds(historyMeetingIds.length ? historyMeetingIds : [selectedMeeting.id]);

        // Refresh to get updated data
        fetchAllBookings();
      } else {
        toast.error(data?.error || 'No meeting link found in GHL');
      }
    } catch (error) {
      console.error('Error fetching GHL link:', error);
      toast.error('Failed to fetch meeting link from GHL');
    } finally {
      setIsFetchingLink(false);
    }
  };

  const handleBulkFetchLinks = async (silent = false) => {
    // Get all demo meetings without meet_link
    const meetingsToFetch = unifiedMeetings.filter(
      m => m.type === 'demo' && !m.meet_link && m.status === 'confirmed'
    );

    if (meetingsToFetch.length === 0) {
      if (!silent) toast.info('All demo meetings already have links');
      return;
    }

    setIsBulkFetching(true);
    setFetchProgress({ current: 0, total: meetingsToFetch.length, success: 0 });
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < meetingsToFetch.length; i++) {
      const meeting = meetingsToFetch[i];
      try {
        const { data, error } = await supabase.functions.invoke('fetch-ghl-meeting-link', {
          body: {
            submissionId: meeting.id,
            email: meeting.email,
            contactId: meeting.ghl_contact_id }
        });

        if (!error && data?.success && data?.meetLink) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
      setFetchProgress({ current: i + 1, total: meetingsToFetch.length, success: successCount });
    }

    setIsBulkFetching(false);
    setFetchProgress({ current: 0, total: 0, success: 0 });
    
    if (successCount > 0) {
      if (!silent) toast.success(`Fetched ${successCount} meeting link${successCount > 1 ? 's' : ''}`);
      fetchAllBookings();
    }
    if (failCount > 0 && !silent) {
      toast.error(`Failed to fetch ${failCount} link${failCount > 1 ? 's' : ''}`);
    }
  };

  const handleSyncGoogleDrive = async () => {
    setIsSyncingDrive(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-drive-webhook', {
        body: {} });

      if (error) throw error;

      if (data?.processed?.length > 0) {
        toast.success(`Synced ${data.processed.length} transcript${data.processed.length > 1 ? 's' : ''} from Google Drive`);
        // Refresh the page to show new documents
        fetchAllBookings();
      } else {
        toast.info('No new transcripts found in Google Drive');
      }

      if (data?.errors?.length > 0) {
        console.warn('Some files had errors:', data.errors);
      }
    } catch (error) {
      console.error('Google Drive sync error:', error);
      toast.error('Failed to sync from Google Drive');
    } finally {
      setIsSyncingDrive(false);
    }
  };

  // Sync business names from GHL for meetings that don't have them
  const handleSyncBusinessNames = async () => {
    // Count meetings that need business name sync
    const needsSync = unifiedMeetings.filter(m => 
      m.type === 'demo' && 
      m.ghl_contact_id && 
      !m.ghlBusinessName && 
      !m.company
    );

    if (needsSync.length === 0) {
      toast.info('All meetings already have company names');
      return;
    }

    setIsSyncingBusinessNames(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-ghl-sync', {
        body: {
          sync_business_names: true,
          source: 'meetings',
          verify_all_pending: true } });

      if (error) throw error;

      if (data?.synced > 0) {
        toast.success(`Synced ${data.synced} business name${data.synced > 1 ? 's' : ''} from GHL`);
        // Refresh to show updated data
        fetchAllBookings();
      } else {
        toast.info('No business names found to sync from GHL');
      }
    } catch (error) {
      console.error('Business name sync error:', error);
      toast.error('Failed to sync business names from GHL');
    } finally {
      setIsSyncingBusinessNames(false);
    }
  };

  const handleMergeDuplicates = async () => {
    // Group meetings by contact ID - includes meetings with DIFFERENT appointment IDs
    const contactGroups: Record<string, UnifiedMeeting[]> = {};
    unifiedMeetings.forEach(m => {
      if (m.ghl_contact_id && m.type === 'demo') {
        if (!contactGroups[m.ghl_contact_id]) {
          contactGroups[m.ghl_contact_id] = [];
        }
        contactGroups[m.ghl_contact_id].push(m);
      }
    });

    // Filter to only groups with duplicates (same contact, potentially different appointments)
    const duplicateGroups = Object.entries(contactGroups).filter(([_, meetings]) => meetings.length > 1);

    if (duplicateGroups.length === 0) {
      toast.info('No duplicate contacts found');
      return;
    }

    setIsMergingDuplicates(true);
    let mergedCount = 0;
    let archivedCount = 0;

    try {
      for (const [contactId, meetings] of duplicateGroups) {
        // Sort by start_time (most recent/latest first), then by created_at as fallback
        const sorted = [...meetings].sort((a, b) => {
          const aTime = a.start_time ? new Date(a.start_time).getTime() : 0;
          const bTime = b.start_time ? new Date(b.start_time).getTime() : 0;
          // Latest start_time first (for keeping the most recent appointment)
          if (bTime !== aTime) return bTime - aTime;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        // Keep the latest meeting (by start_time), archive the rest
        const keepMeeting = sorted[0];
        const archiveMeetings = sorted.slice(1);

        // Archive duplicates (this is Meetings-specific archiving, not GHL Submissions)
        for (const meeting of archiveMeetings) {
          const { error } = await supabase
            .from('ghl_submissions')
            .update({ archived_at: new Date().toISOString() })
            .eq('id', meeting.id);

          if (!error) {
            archivedCount++;
            
            // Log to meeting history
            await supabase.from('meeting_history').insert({
              meeting_id: meeting.id,
              meeting_type: 'demo',
              previous_status: meeting.status,
              new_status: 'archived',
              event_type: 'merged',
              notes: `Merged with ${keepMeeting.name} (${keepMeeting.email}) - kept latest appointment (${keepMeeting.appointment_id || 'N/A'})`,
              created_by: user?.id });
          }
        }

        // If the kept meeting doesn't have a link but a duplicate does, sync it
        if (!keepMeeting.meet_link) {
          const meetingWithLink = archiveMeetings.find(m => m.meet_link);
          if (meetingWithLink) {
            await supabase
              .from('ghl_submissions')
              .update({ meet_link: meetingWithLink.meet_link })
              .eq('id', keepMeeting.id);
          }
        }

        mergedCount++;
      }

      toast.success(`Merged ${mergedCount} duplicate contact${mergedCount > 1 ? 's' : ''}, archived ${archivedCount} record${archivedCount > 1 ? 's' : ''}`);
      // Refresh immediately to remove the "x meetings" badges
      await fetchAllBookings();
    } catch (error) {
      console.error('Error merging duplicates:', error);
      toast.error('Failed to merge some duplicates');
    } finally {
      setIsMergingDuplicates(false);
    }
  };

  const handleArchiveMeeting = async (meeting: UnifiedMeeting) => {
    try {
      const { error } = await supabase
        .from('ghl_submissions')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', meeting.id);

      if (error) throw error;

      // Log to meeting history
      await supabase.from('meeting_history').insert({
        meeting_id: meeting.id,
        meeting_type: 'demo',
        previous_status: meeting.status || 'confirmed',
        new_status: 'archived',
        event_type: 'archived',
        notes: 'Archived by admin',
        created_by: user?.id });

      toast.success('Meeting archived');
      setSelectedMeeting(null);
      fetchAllBookings();
    } catch (error) {
      console.error('Error archiving meeting:', error);
      toast.error('Failed to archive meeting');
    }
  };

  const handleRestoreArchivedMeeting = async (meeting: UnifiedMeeting) => {
    try {
      const { error } = await supabase
        .from('ghl_submissions')
        .update({ archived_at: null })
        .eq('id', meeting.id);

      if (error) throw error;

      // Log to meeting history
      await supabase.from('meeting_history').insert({
        meeting_id: meeting.id,
        meeting_type: 'demo',
        previous_status: 'archived',
        new_status: meeting.status || 'confirmed',
        event_type: 'restored',
        notes: 'Restored from archive by admin',
        created_by: user?.id });

      toast.success('Meeting restored');
      setSelectedMeeting(null);
      fetchAllBookings();
    } catch (error) {
      console.error('Error restoring meeting:', error);
      toast.error('Failed to restore meeting');
    }
  };

  const handleDeleteMeeting = async (meeting: UnifiedMeeting) => {
    setIsDeleting(true);
    try {
      if (meeting.type === 'demo') {
        // Delete from ghl_submissions
        const { error } = await supabase
          .from('ghl_submissions')
          .delete()
          .eq('id', meeting.id);

        if (error) throw error;
      } else {
        // Delete from investor_bookings
        const { error } = await supabase
          .from('investor_bookings')
          .delete()
          .eq('id', meeting.id);

        if (error) throw error;
      }

      // Log to meeting history (optional - for audit trail)
      await supabase.from('meeting_history').insert({
        meeting_id: meeting.id,
        meeting_type: meeting.type,
        previous_status: meeting.status,
        new_status: 'deleted',
        event_type: 'deleted',
        notes: `Deleted by admin: ${meeting.name} (${meeting.email})`,
        created_by: user?.id });

      toast.success('Meeting deleted');
      setMeetingToDelete(null);
      fetchAllBookings();
    } catch (error) {
      console.error('Error deleting meeting:', error);
      toast.error('Failed to delete meeting');
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStatusBadge = (status: string, startTime: string | null) => {
    const now = new Date();
    const isUpcoming = startTime && new Date(startTime) > now;
    const isPastMeeting = startTime && new Date(startTime) <= now;

    // Show Cancelled/Rescheduled first (regardless of time)
    if (status === 'canceled' || status === 'cancelled') {
      return (
        <Badge variant="outline" className="bg-red-500/15 text-red-600 border-red-500/30 font-medium">
          <XCircle className="h-3 w-3 mr-1" />
          Cancelled
        </Badge>
      );
    }

    if (status === 'rescheduled') {
      return (
        <Badge variant="outline" className="bg-orange-500/15 text-orange-600 border-orange-500/30 font-medium">
          <RotateCcw className="h-3 w-3 mr-1" />
          Rescheduled
        </Badge>
      );
    }

    if (status === 'no_show') {
      return (
        <Badge variant="outline" className="bg-amber-500/15 text-amber-600 border-amber-500/30 font-medium">
          <AlertCircle className="h-3 w-3 mr-1" />
          No Show
        </Badge>
      );
    }

    if (status === 'archived') {
      return (
        <Badge variant="outline" className="bg-slate-500/15 text-slate-600 border-slate-500/30 font-medium">
          <History className="h-3 w-3 mr-1" />
          Archived
        </Badge>
      );
    }

    if (status === 'deleted_from_ghl') {
      return (
        <Badge variant="outline" className="bg-rose-500/15 text-rose-600 border-rose-500/30 font-medium">
          <Trash2 className="h-3 w-3 mr-1" />
          Deleted
        </Badge>
      );
    }

    // For confirmed meetings, show time-based status
    if (status === 'confirmed') {
      if (isUpcoming) {
        return (
          <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 font-medium">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Confirmed
          </Badge>
        );
      }
      if (isPastMeeting) {
        return (
          <Badge variant="outline" className="bg-slate-500/15 text-slate-600 border-slate-500/30 font-medium">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      }
      // No time set
      return (
        <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 font-medium">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Confirmed
        </Badge>
      );
    }

    if (status === 'scheduled') {
      return (
        <Badge variant="outline" className="bg-blue-500/15 text-blue-600 border-blue-500/30 font-medium">
          <Calendar className="h-3 w-3 mr-1" />
          Scheduled
        </Badge>
      );
    }

    if (status === 'completed') {
      return (
        <Badge variant="outline" className="bg-slate-500/15 text-slate-600 border-slate-500/30 font-medium">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="bg-muted text-muted-foreground font-medium">
        {capitalizeText(status)}
      </Badge>
    );
  };

  const getTypeBadge = (type: 'investor' | 'demo') => {
    if (type === 'investor') {
      return (
        <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
          <Users className="h-3 w-3 mr-1" />
          Investor
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
        <MessageSquare className="h-3 w-3 mr-1" />
        Demo
      </Badge>
    );
  };

  const now = new Date();
  
  // Find contact IDs that appear multiple times (duplicates)
  const contactIdCounts = unifiedMeetings.reduce((acc, m) => {
    if (m.ghl_contact_id) {
      acc[m.ghl_contact_id] = (acc[m.ghl_contact_id] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  const duplicateContactIds = new Set(
    Object.entries(contactIdCounts)
      .filter(([_, count]) => count > 1)
      .map(([id]) => id)
  );
  
  const counts = {
    all: unifiedMeetings.length,
    upcoming: unifiedMeetings.filter((m) => {
      if (!m.start_time) return false;
      const startDate = new Date(m.start_time);
      return startDate > now && m.status !== 'cancelled';
    }).length,
    past: unifiedMeetings.filter((m) => {
      if (!m.start_time) return false;
      const startDate = new Date(m.start_time);
      return startDate <= now && m.status !== 'cancelled';
    }).length,
    completed: unifiedMeetings.filter((m) => {
      if (!m.start_time) return false;
      const startDate = new Date(m.start_time);
      return startDate <= now && m.status === 'confirmed';
    }).length,
    demo: unifiedMeetings.filter((m) => m.type === 'demo').length,
    investor: unifiedMeetings.filter((m) => m.type === 'investor').length,
    confirmed: unifiedMeetings.filter((m) => m.status === 'confirmed').length,
    cancelled: unifiedMeetings.filter((m) => m.status === 'cancelled' || m.status === 'canceled').length,
    rescheduled: unifiedMeetings.filter((m) => m.status === 'rescheduled').length,
    deleted: unifiedMeetings.filter((m) => m.status === 'deleted_from_ghl').length,
    googleMeet: unifiedMeetings.filter((m) => m.meet_link?.includes('meet.google.com')).length,
    zoom: unifiedMeetings.filter((m) => m.meet_link?.includes('zoom')).length,
    noLink: unifiedMeetings.filter((m) => !m.meet_link && m.status === 'confirmed').length,
    transcript: unifiedMeetings.filter((m) => m.hasTranscript).length,
    duplicateContacts: duplicateContactIds.size,
    archived: archivedMeetings.length };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Type', 'Event', 'Status', 'Start Time', 'Meet Link', 'Created'];
    const rows = filteredMeetings.map((m) => [
      m.name,
      m.email,
      m.phone || '',
      m.company || '',
      capitalizeText(m.type),
      m.event_name || '',
      capitalizeText(m.status),
      m.start_time ? format(new Date(m.start_time), 'yyyy-MM-dd HH:mm') : '',
      m.meet_link || '',
      format(new Date(m.created_at), 'yyyy-MM-dd HH:mm'),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meetings-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Exported to CSV');
  };

  if (!canViewLeads && !isDistributor) {
    return <AccessDenied message="Only admins can view meetings." requiredRole="Admin or Super Admin" />;
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
      {/* Band 1 — title. Refresh lives here, not in the admin row, because a
          distributor viewing their own meetings needs it too. */}
      <AdminPageHeader
        title="Meetings"
        description={`${filteredMeetings.length} ${filteredMeetings.length === 1 ? 'meeting' : 'meetings'}`}
        icon={<Video className="h-4 w-4" />}
        onRefresh={fetchAllBookings}
        isLoading={isLoading}
      />

      {/* Unmatched Transcripts Section */}
      <UnmatchedTranscriptsSection />

      {/* Band 2 — tiles. Each one is a filter. "Confirmed, no link" is the one
          that asks for something: a booked meeting nobody can join yet. */}
      <AdminMetricsStrip
        metrics={[
          {
            label: 'All meetings',
            value: counts.all,
            active: statusFilter === 'all' && timeFilter === 'all' && platformFilter === 'all',
            onClick: () => { setStatusFilter('all'); setTimeFilter('all'); setPlatformFilter('all'); } },
          {
            label: 'Upcoming',
            value: counts.upcoming,
            tone: 'accent',
            active: timeFilter === 'upcoming',
            onClick: () => { setStatusFilter('all'); setTimeFilter(timeFilter === 'upcoming' ? 'all' : 'upcoming'); } },
          {
            label: 'Completed',
            value: counts.completed,
            tone: 'good',
            active: statusFilter === 'completed',
            onClick: () => { setTimeFilter('all'); setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed'); } },
          {
            label: 'Confirmed, no link',
            value: counts.noLink,
            tone: counts.noLink > 0 ? 'warn' : 'default',
            active: platformFilter === 'noLink',
            onClick: () => setPlatformFilter(platformFilter === 'noLink' ? 'all' : 'noLink') },
        ]}
      />

      {/* Admin tools — role-gated by the row itself. */}
      <AdminActionsRow
        actions={[
          ...(counts.duplicateContacts > 0
            ? [{
                key: 'merge',
                label: `Merge ${counts.duplicateContacts} duplicates`,
                icon: <Users className="h-3.5 w-3.5" />,
                onClick: handleMergeDuplicates,
                loading: isMergingDuplicates,
                allowed: !isDistributor }]
            : []),
          { key: 'links', label: 'Fetch links', icon: <Link2 className="h-3.5 w-3.5" />, onClick: () => handleBulkFetchLinks(false), loading: isBulkFetching, allowed: !isDistributor },
          { key: 'drive', label: 'Sync Drive', icon: <FolderSync className="h-3.5 w-3.5" />, onClick: handleSyncGoogleDrive, loading: isSyncingDrive, allowed: !isDistributor },
          { key: 'companies', label: 'Sync companies', icon: <Building className="h-3.5 w-3.5" />, onClick: handleSyncBusinessNames, loading: isSyncingBusinessNames, allowed: !isDistributor },
          { key: 'export', label: 'Export CSV', icon: <Download className="h-3.5 w-3.5" />, onClick: exportToCSV, disabled: !filteredMeetings.length, allowed: !isDistributor },
        ]}
      />

      {/* Inline progress indicator for auto-fetch */}
      {isBulkFetching && fetchProgress.total > 0 && (
        <div className="flex items-center gap-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-blue-700 font-medium">
                Fetching meeting links from GHL...
              </span>
              <span className="text-blue-600">
                {fetchProgress.current}/{fetchProgress.total}
              </span>
            </div>
            <div className="w-full h-1.5 bg-blue-500/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${(fetchProgress.current / fetchProgress.total) * 100}%` }}
              />
            </div>
            {fetchProgress.success > 0 && (
              <div className="text-xs text-blue-600 mt-1">
                {fetchProgress.success} link{fetchProgress.success > 1 ? 's' : ''} found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Band 3 — the shared toolbar. Search · Sort · Status first, in the
          Standard's order; Time, Type and Platform after them. The date range
          rides in the actions slot because a range is not a select. */}
      <AdminToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name, email, company..."
        resultCount={filteredMeetings.length}
        resultNoun="meetings"
        filters={[
          {
            key: 'sort',
            label: 'Sort',
            options: standardSortOptions,
            value: sortBy,
            onChange: (v) => setSortBy(v as typeof sortBy),
            allValue: 'date_desc' },
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'all', label: 'All status' },
              { value: 'confirmed', label: `Confirmed (${counts.confirmed})` },
              { value: 'completed', label: `Completed (${counts.completed})` },
              { value: 'rescheduled', label: `Rescheduled (${counts.rescheduled})` },
              { value: 'cancelled', label: `Cancelled (${counts.cancelled})` },
              ...(counts.deleted > 0 ? [{ value: 'deleted', label: `Deleted in GHL (${counts.deleted})` }] : []),
              ...(counts.archived > 0 ? [{ value: 'archived', label: `Archived (${counts.archived})` }] : []),
            ],
            value: statusFilter,
            onChange: setStatusFilter },
          {
            key: 'time',
            label: 'Time',
            options: [
              { value: 'all', label: 'Any time' },
              { value: 'upcoming', label: `Upcoming (${counts.upcoming})` },
              { value: 'past', label: `Past (${counts.past})` },
            ],
            value: timeFilter,
            onChange: setTimeFilter },
          {
            key: 'type',
            label: 'Type',
            options: [
              { value: 'all', label: 'All types' },
              { value: 'demo', label: `Demo (${counts.demo})` },
              { value: 'investor', label: `Investor (${counts.investor})` },
            ],
            value: filterType,
            onChange: setFilterType },
          {
            key: 'platform',
            label: 'Platform',
            options: [
              { value: 'all', label: 'Any platform' },
              { value: 'googleMeet', label: `Google Meet (${counts.googleMeet})` },
              { value: 'zoom', label: `Zoom (${counts.zoom})` },
              { value: 'noLink', label: `Confirmed, no link (${counts.noLink})` },
              ...(counts.transcript > 0 ? [{ value: 'transcript', label: `Has transcript (${counts.transcript})` }] : []),
            ],
            value: platformFilter,
            onChange: setPlatformFilter },
        ]}
        onClearAll={() => {
          setSearchQuery('');
          setStatusFilter('all');
          setTimeFilter('all');
          setFilterType('all');
          setPlatformFilter('all');
          setSortBy('date_desc');
          setDateRange({ from: undefined, to: undefined });
        }}
        actions={
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <Calendar className="h-4 w-4" />
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
                  className={cn("h-7 text-xs", !dateRange.from && "bg-muted")}
                  onClick={() => setDateRange({ from: undefined, to: undefined })}
                >
                  All time
                </Button>
              </div>
              <CalendarComponent
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        }
      />

      {/* Meetings List */}
      <div className="space-y-3">
        {filteredMeetings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">No meetings found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== 'all' || timeFilter !== 'all' || filterType !== 'all' || platformFilter !== 'all' || dateRange.from
                  ? 'Try adjusting your filters'
                  : 'Meetings will appear here when booked'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredMeetings.map((meeting) => (
            <Card 
              key={meeting.id} 
              className="hover:border-primary/50 transition-colors cursor-pointer group"
              onClick={() => handleMeetingClick(meeting)}
            >
              <CardContent className="p-3 sm:p-4">
                {/* Mobile-first: compact two-line card */}
                <div className="sm:hidden space-y-2">
                  {/* Row 1: Name + Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {meeting.status === 'deleted_from_ghl' && <Lock className="h-3.5 w-3.5 text-rose-500 shrink-0" />}
                      <span className="font-medium text-foreground truncate text-sm">{formatName(meeting.name)}</span>
                    </div>
                    <div className="shrink-0">
                      {getStatusBadge(meeting.status, meeting.start_time)}
                    </div>
                  </div>
                  
                  {/* Row 2: Company/email + date */}
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="truncate">
                      {meeting.ghlBusinessName || meeting.company || meeting.email}
                    </span>
                    <span className="shrink-0">
                      {meeting.start_time 
                        ? format(new Date(meeting.start_time), 'MMM d, h:mm a')
                        : `Booked ${format(new Date(meeting.created_at), 'MMM d')}`}
                    </span>
                  </div>

                  {/* Row 3: Quick badges + join button */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 flex-wrap">
                      {getTypeBadge(meeting.type)}
                      {meeting.hasTranscript && (
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-[10px]">
                          <FileText className="h-2.5 w-2.5 mr-0.5" />
                          {meeting.transcriptCount}
                        </Badge>
                      )}
                      {meeting.ghl_contact_id && duplicateContactIds.has(meeting.ghl_contact_id) && (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                          <Users className="h-2.5 w-2.5 mr-0.5" />
                          {contactIdCounts[meeting.ghl_contact_id]}
                        </Badge>
                      )}
                    </div>
                    {meeting.meet_link && (
                      <a
                        href={meeting.meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          "inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md font-medium min-h-[36px]",
                          meeting.status === 'cancelled' || meeting.status === 'canceled'
                            ? "bg-gray-500/10 text-gray-500 line-through"
                            : meeting.meet_link.includes('meet.google.com')
                            ? "bg-blue-500/10 text-blue-600"
                            : meeting.meet_link.includes('zoom')
                            ? "bg-indigo-500/10 text-indigo-600"
                            : "bg-emerald-500/10 text-emerald-600"
                        )}
                      >
                        <Video className="h-3 w-3" />
                        Join
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                  
                  {/* Archived actions */}
                  {statusFilter === 'archived' && (
                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs min-h-[44px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30" onClick={(e) => { e.stopPropagation(); handleRestoreArchivedMeeting(meeting); }}>
                        <RotateCcw className="h-3 w-3" /> Restore
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs min-h-[44px] bg-red-500/10 text-red-600 border-red-500/30" onClick={(e) => { e.stopPropagation(); setMeetingToDelete(meeting); }}>
                        <Trash2 className="h-3 w-3" /> Delete
                      </Button>
                    </div>
                  )}
                  
                  {meeting.cancellation_reason && (
                    <div className="p-2 bg-red-500/5 border border-red-500/20 rounded-md">
                      <p className="text-xs text-red-600"><strong>Reason:</strong> {meeting.cancellation_reason}</p>
                    </div>
                  )}
                </div>

                {/* Desktop: original three-column layout */}
                <div className="hidden sm:block">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Contact Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {meeting.status === 'deleted_from_ghl' && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1"><Lock className="h-3.5 w-3.5 text-rose-500 shrink-0" /></div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p className="text-sm font-medium">Sync Disabled</p>
                                <p className="text-xs text-muted-foreground">This meeting was deleted from GHL. Actions are disabled.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {getStatusBadge(meeting.status, meeting.start_time)}
                        {getTypeBadge(meeting.type)}
                        {meeting.ghl_contact_id && duplicateContactIds.has(meeting.ghl_contact_id) && (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs" title="Same contact has multiple meetings">
                            <Users className="h-3 w-3 mr-1" />{contactIdCounts[meeting.ghl_contact_id]} meetings
                          </Badge>
                        )}
                        {meeting.calendar_name && (
                          <Badge variant="outline" className="bg-slate-500/10 text-slate-600 border-slate-500/20 text-xs">{meeting.calendar_name}</Badge>
                        )}
                        {meeting.meet_link && (
                          meeting.meet_link.includes('meet.google.com') ? (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs"><Video className="h-3 w-3 mr-1" />Google Meet</Badge>
                          ) : meeting.meet_link.includes('zoom') ? (
                            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 text-xs"><Video className="h-3 w-3 mr-1" />Zoom</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs"><Video className="h-3 w-3 mr-1" />Meeting Link</Badge>
                          )
                        )}
                        {meeting.hasTranscript && (
                          <TooltipProvider><Tooltip><TooltipTrigger asChild>
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-xs">
                              <FileText className="h-3 w-3 mr-1" />{meeting.transcriptCount === 1 ? 'Transcript' : `${meeting.transcriptCount} Docs`}
                            </Badge>
                          </TooltipTrigger><TooltipContent><p>{meeting.transcriptCount} document{meeting.transcriptCount !== 1 ? 's' : ''} attached</p></TooltipContent></Tooltip></TooltipProvider>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-1 select-text">
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-foreground truncate">{formatName(meeting.name)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1 select-text">
                        <Mail className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{meeting.email}</span>
                      </div>
                      {meeting.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1 select-text">
                          <Phone className="h-3.5 w-3.5 shrink-0" /><span>{meeting.phone}</span>
                        </div>
                      )}
                      {(meeting.ghlBusinessName || meeting.company) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground select-text">
                          <Building className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{formatName(meeting.ghlBusinessName || meeting.company || '')}</span>
                          {(meeting.ghlBusinessName || meeting.companyGhlSynced) && (
                            <TooltipProvider><Tooltip><TooltipTrigger asChild>
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] px-1 py-0">GHL</Badge>
                            </TooltipTrigger><TooltipContent><p className="text-xs">Company synced from GoHighLevel</p></TooltipContent></Tooltip></TooltipProvider>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Middle: Event Info & Meeting Link */}
                    <div className="flex-1 min-w-0 lg:text-center space-y-2">
                      {meeting.event_name && <div className="font-medium text-foreground">{meeting.event_name}</div>}
                      {meeting.start_time && isPast(new Date(meeting.start_time)) && meeting.status !== 'cancelled' && (
                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><History className="h-3 w-3" />Past Meeting</div>
                      )}
                      {meeting.meet_link ? (
                        <a href={meeting.meet_link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                          className={cn("inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors font-medium",
                            meeting.status === 'cancelled' || meeting.status === 'canceled' ? "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 line-through"
                            : meeting.meet_link.includes('meet.google.com') ? "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
                            : meeting.meet_link.includes('zoom') ? "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20"
                            : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                          )}
                        >
                          <Video className="h-3.5 w-3.5" />
                          {meeting.meet_link.includes('meet.google.com') ? 'Join Google Meet' : meeting.meet_link.includes('zoom') ? 'Join Zoom' : 'Join Meeting'}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <div className="text-xs text-muted-foreground italic">Click to add meeting link</div>
                      )}
                    </div>

                    {/* Right: Date/Time */}
                    <div className="text-right text-sm shrink-0 lg:min-w-[140px]">
                      {meeting.start_time ? (
                        <>
                          <div className="flex items-center gap-1.5 text-foreground font-medium mb-1 justify-end">
                            <Clock className="h-3.5 w-3.5" />{format(new Date(meeting.start_time), 'MMM d, yyyy')}
                          </div>
                          <div className="text-muted-foreground">
                            {format(new Date(meeting.start_time), 'h:mm a')}
                            {meeting.end_time && ` - ${format(new Date(meeting.end_time), 'h:mm a')}`}
                          </div>
                        </>
                      ) : (
                        <div className="text-muted-foreground">No time set</div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">Booked {format(new Date(meeting.created_at), 'MMM d')}</div>
                      {statusFilter === 'archived' && (
                        <div className="flex gap-1.5 mt-2 justify-end">
                          <Button variant="outline" size="sm" className="gap-1.5 text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20" onClick={(e) => { e.stopPropagation(); handleRestoreArchivedMeeting(meeting); }}>
                            <RotateCcw className="h-3 w-3" /> Restore
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1.5 text-xs bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20" onClick={(e) => { e.stopPropagation(); setMeetingToDelete(meeting); }}>
                            <Trash2 className="h-3 w-3" /> Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {meeting.cancellation_reason && (
                    <div className="mt-3 p-2 bg-red-500/5 border border-red-500/20 rounded-md">
                      <p className="text-xs text-red-600"><strong>Cancellation reason:</strong> {meeting.cancellation_reason}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Meeting Detail Dialog - full-screen on mobile */}
      <Dialog open={!!selectedMeeting} onOpenChange={(open) => !open && setSelectedMeeting(null)}>
        <DialogContent className="max-w-3xl max-h-[95vh] sm:max-h-[95vh] overflow-hidden flex flex-col p-0 w-[calc(100vw-16px)] sm:w-auto h-[calc(100vh-32px)] sm:h-auto rounded-xl">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Meeting Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedMeeting && (
            <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">
              <div className="space-y-4 sm:space-y-6 pb-10">
                {/* Status & Type Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(selectedMeeting.status, selectedMeeting.start_time)}
                  {getTypeBadge(selectedMeeting.type)}
                </div>

                {/* Contact Info Card */}
                <div className="p-3 sm:p-5 bg-muted/50 rounded-xl space-y-4 sm:space-y-5">
                  {/* Name Row */}
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground shrink-0" />
                    <span className="font-semibold text-base sm:text-lg text-foreground select-text break-words">{selectedMeeting.name}</span>
                  </div>
                  
                  {/* Contact Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Email */}
                    <div className="flex items-start gap-3 p-3 rounded-md bg-background/50 border">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                        <div className="flex items-center gap-1">
                          <a href={`mailto:${selectedMeeting.email}`} className="text-primary hover:underline text-sm truncate select-text">{selectedMeeting.email}</a>
                          <Button variant="ghost" size="icon" className="h-7 w-7 min-h-[44px] min-w-[44px] shrink-0" onClick={() => copyToClipboard(selectedMeeting.email)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Phone */}
                    <div className="flex items-start gap-3 p-3 rounded-md bg-background/50 border">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                        {selectedMeeting.phone ? (
                          <div className="flex items-center gap-1">
                            <a href={`tel:${selectedMeeting.phone}`} className="text-primary hover:underline text-sm select-text">{selectedMeeting.phone}</a>
                            <Button variant="ghost" size="icon" className="h-7 w-7 min-h-[44px] min-w-[44px] shrink-0" onClick={() => copyToClipboard(selectedMeeting.phone!)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Not provided</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Company */}
                    <div className="flex items-start gap-3 p-3 rounded-md bg-background/50 border">
                      <Building className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs text-muted-foreground">Company</p>
                          {(selectedMeeting.ghlBusinessName || selectedMeeting.companyGhlSynced) && (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] px-1.5 py-0">GHL</Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate select-text">{selectedMeeting.ghlBusinessName || selectedMeeting.company || '—'}</p>
                      </div>
                    </div>
                    
                    {/* Website */}
                    <div className="flex items-start gap-3 p-3 rounded-md bg-background/50 border">
                      <Globe className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground mb-0.5">Website</p>
                        {selectedMeeting.website ? (
                          <a href={selectedMeeting.website.startsWith('http') ? selectedMeeting.website : `https://${selectedMeeting.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm flex items-center gap-1 select-text">
                            {selectedMeeting.website.replace(/^https?:\/\//, '')}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Not provided</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Location */}
                  {selectedMeeting.location && !selectedMeeting.location.includes('meet.google.com') && !selectedMeeting.location.includes('zoom') && (
                    <div className="flex items-start gap-3 p-3 rounded-md bg-background/50 border">
                      <Target className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground mb-0.5">Location</p>
                        <p className="text-sm select-text">{selectedMeeting.location}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Qualification Details */}
                {selectedMeeting.type === 'demo' && (
                  <div className="p-3 sm:p-5 bg-purple-500/5 border border-purple-500/20 rounded-xl space-y-4">
                    <Label className="flex items-center gap-2 text-sm font-semibold text-purple-700 uppercase tracking-wide">
                      <Sparkles className="h-4 w-4" />
                      Qualification Details
                    </Label>
                    {selectedMeeting.qualification && Object.keys(selectedMeeting.qualification).some(k => selectedMeeting.qualification?.[k as keyof QualificationData]) ? (
                      <>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          {[
                            { icon: Briefcase, label: 'Role', value: selectedMeeting.qualification?.role },
                            { icon: Building, label: 'Industry', value: selectedMeeting.qualification?.industry },
                            { icon: Users, label: 'Team Size', value: selectedMeeting.qualification?.size },
                            { icon: Timer, label: 'Timeline', value: selectedMeeting.qualification?.timeline },
                          ].map(({ icon: QIcon, label, value }) => (
                            <div key={label} className="flex items-start gap-2 p-2 rounded bg-background/50">
                              <QIcon className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                              <div>
                                <span className="text-xs text-muted-foreground block">{label}</span>
                                <span className="text-sm font-medium select-text">{value ? capitalizeText(value) : '—'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        {selectedMeeting.qualification?.challenge && (
                          <div className="flex items-start gap-2 p-2 rounded bg-background/50">
                            <AlertCircle className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                              <span className="text-xs text-muted-foreground block">Challenge</span>
                              <span className="text-sm font-medium select-text">{selectedMeeting.qualification.challenge}</span>
                            </div>
                          </div>
                        )}
                        {selectedMeeting.qualification?.topic && (
                          <div className="flex items-start gap-2 p-2 rounded bg-background/50">
                            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                              <span className="text-xs text-muted-foreground block">Topic</span>
                              <span className="text-sm font-medium select-text">{selectedMeeting.qualification.topic}</span>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No qualification data collected</p>
                    )}
                    
                    {/* Tags */}
                    {selectedMeeting.tags && selectedMeeting.tags.length > 0 && (
                      <div className="pt-3 border-t border-purple-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Tag className="h-3.5 w-3.5 text-purple-600" />
                          <span className="text-xs font-medium text-purple-700">Tags</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedMeeting.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Schedule Info */}
                {selectedMeeting.start_time && (
                  <div className="p-3 sm:p-5 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm sm:text-base">
                      <Calendar className="h-5 w-5" />
                      {format(new Date(selectedMeeting.start_time), 'EEEE, MMMM d, yyyy')}
                    </div>
                    <div className="text-sm text-blue-600 ml-7 font-medium">
                      {format(new Date(selectedMeeting.start_time), 'h:mm a')}
                      {selectedMeeting.end_time && ` - ${format(new Date(selectedMeeting.end_time), 'h:mm a')}`}
                    </div>
                    {selectedMeeting.event_name && (
                      <div className="text-xs text-blue-500 mt-2 ml-6">
                        {selectedMeeting.event_name}
                        {selectedMeeting.calendar_name && ` • ${selectedMeeting.calendar_name}`}
                      </div>
                    )}
                    {isPast(new Date(selectedMeeting.start_time)) && selectedMeeting.status !== 'cancelled' && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-600 mt-2 ml-6">
                        <History className="h-3 w-3" />
                        This meeting has passed
                      </div>
                    )}
                  </div>
                )}

                {/* Booked Info */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                  <Clock className="h-3 w-3" />
                  Booked on {format(new Date(selectedMeeting.created_at), 'MMMM d, yyyy \'at\' h:mm a')}
                </div>

                {/* Meeting Link */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                    <Link2 className="h-4 w-4" />
                    Meeting Link
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                      value={editMeetLink}
                      onChange={(e) => setEditMeetLink(e.target.value)}
                      className="flex-1 text-sm"
                    />
                    <Button onClick={handleSaveMeetLink} disabled={isSaving} size="icon" className="shrink-0 min-h-[44px] min-w-[44px]">
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  {selectedMeeting.type === 'demo' && (
                    <Button variant="outline" size="sm" onClick={handleFetchGHLLink} disabled={isFetchingLink} className="gap-2 w-full min-h-[44px]">
                      {isFetchingLink ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" />Fetching from GHL...</>
                      ) : (
                        <><RefreshCw className="h-3.5 w-3.5" />Fetch Meeting Link from GHL</>
                      )}
                    </Button>
                  )}
                  
                  {editMeetLink && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <a href={editMeetLink} target="_blank" rel="noopener noreferrer"
                        className={cn("inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors font-medium min-h-[44px]",
                          editMeetLink.includes('meet.google.com') ? "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
                          : editMeetLink.includes('zoom') ? "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20"
                          : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                        )}
                      >
                        <Video className="h-3.5 w-3.5" />
                        {editMeetLink.includes('meet.google.com') ? 'Open Google Meet' : editMeetLink.includes('zoom') ? 'Open Zoom' : 'Open Meeting'}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(editMeetLink)} className="gap-1 min-h-[44px]">
                        <Copy className="h-3 w-3" /> Copy
                      </Button>
                    </div>
                  )}
                </div>

                {/* Documents */}
                <MeetingDocumentsSection
                  meetingId={selectedMeeting.id}
                  meetingType={selectedMeeting.type}
                  contactEmail={selectedMeeting.email}
                />

                {/* Action Buttons for past confirmed */}
                {selectedMeeting.status === 'confirmed' && selectedMeeting.start_time && isPast(new Date(selectedMeeting.start_time)) && (
                  <div className="p-3 sm:p-4 bg-muted/50 rounded-lg space-y-3">
                    <Label className="text-sm font-medium">Update Meeting Outcome</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-2 min-h-[44px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20"
                        onClick={async () => {
                          try {
                            const table = selectedMeeting.type === 'demo' ? 'ghl_submissions' : 'investor_bookings';
                            const field = selectedMeeting.type === 'demo' ? 'ghl_status' : 'status';
                            const { error } = await supabase.from(table).update({ [field]: 'completed' }).eq('id', selectedMeeting.id);
                            if (error) throw error;
                            await supabase.from('meeting_history').insert({ meeting_id: selectedMeeting.id, meeting_type: selectedMeeting.type, previous_status: selectedMeeting.status, new_status: 'completed', event_type: 'completed', notes: 'Marked as completed by admin', created_by: user?.id });
                            toast.success('Meeting marked as completed');
                            setSelectedMeeting(null);
                            fetchAllBookings();
                          } catch (error) { console.error('Error updating meeting:', error); toast.error('Failed to update meeting status'); }
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4" /> Mark as Completed
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 gap-2 min-h-[44px] bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20"
                        onClick={async () => {
                          try {
                            const table = selectedMeeting.type === 'demo' ? 'ghl_submissions' : 'investor_bookings';
                            const field = selectedMeeting.type === 'demo' ? 'ghl_status' : 'status';
                            const { error } = await supabase.from(table).update({ [field]: 'no_show' }).eq('id', selectedMeeting.id);
                            if (error) throw error;
                            await supabase.from('meeting_history').insert({ meeting_id: selectedMeeting.id, meeting_type: selectedMeeting.type, previous_status: selectedMeeting.status, new_status: 'no_show', event_type: 'no_show', notes: 'Marked as no show by admin', created_by: user?.id });
                            toast.success('Meeting marked as no show');
                            setSelectedMeeting(null);
                            fetchAllBookings();
                          } catch (error) { console.error('Error updating meeting:', error); toast.error('Failed to update meeting status'); }
                        }}
                      >
                        <AlertCircle className="h-4 w-4" /> Mark as No Show
                      </Button>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-3 pt-3 border-t">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4" /> Add Note
                  </Label>
                  <Textarea placeholder="Add a note about this meeting..." value={newNote} onChange={(e) => setNewNote(e.target.value)} className="min-h-[60px] text-sm" />
                  <Button onClick={handleAddNote} disabled={isAddingNote || !newNote.trim()} size="sm" className="gap-2 min-h-[44px]">
                    {isAddingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    Add Note
                  </Button>
                </div>

                {/* History */}
                {meetingHistory.length > 0 && (
                  <div className="space-y-3 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2 text-sm font-medium">
                        <History className="h-4 w-4" /> Update History
                      </Label>
                      <div className="flex items-center gap-2">
                        {historyMeetingIds.length > 1 && <Badge variant="secondary" className="text-xs">Across {historyMeetingIds.length} meetings</Badge>}
                        <Badge variant="secondary" className="text-xs">{meetingHistory.length} update{meetingHistory.length !== 1 ? 's' : ''}</Badge>
                      </div>
                    </div>
                    <div className="space-y-2 pr-1">
                      {meetingHistory.map((entry, idx) => {
                        const isWebhook = entry.event_type.includes('webhook') || entry.appointment_id;
                        const isManual = entry.created_by && !isWebhook;
                        const relatedMeeting = unifiedMeetings.find((m) => m.id === entry.meeting_id);
                        const relatedArchived = archivedMeetings.find((b) => b.id === entry.meeting_id);
                        const meetingName = relatedMeeting?.name || relatedArchived?.lead_name || relatedArchived?.lead_email || 'Meeting';
                        const meetingLabel = relatedMeeting?.start_time
                          ? format(new Date(relatedMeeting.start_time), 'MMM d, h:mm a')
                          : relatedArchived?.ghl_response?.start_time
                            ? format(new Date(relatedArchived.ghl_response.start_time as string), 'MMM d, h:mm a')
                            : relatedMeeting ? format(new Date(relatedMeeting.created_at), 'MMM d, yyyy') : entry.meeting_id.slice(0, 8);
                        const author = entry.created_by ? historyAuthors[entry.created_by] : undefined;
                        const authorLabel = author ? author.display_name : isWebhook ? 'Webhook' : 'System';
                        return (
                          <div key={entry.id} className={cn("relative pl-4 pb-4", idx !== meetingHistory.length - 1 && "border-l-2 border-muted ml-1.5")}>
                            <div className={cn("absolute -left-[5px] top-1 w-3 h-3 rounded-full border-2 border-background",
                              entry.event_type === 'confirmed' && "bg-emerald-500",
                              entry.event_type === 'cancelled' && "bg-red-500",
                              entry.event_type === 'rescheduled' && "bg-orange-500",
                              entry.event_type === 'completed' && "bg-slate-500",
                              entry.event_type === 'no_show' && "bg-amber-500",
                              entry.event_type === 'note_added' && "bg-blue-500",
                              entry.event_type === 'created' && "bg-purple-500",
                              entry.event_type === 'updated' && "bg-indigo-500",
                              (entry.event_type === 'deleted_from_ghl' || entry.event_type === 'contact_deleted') && "bg-rose-500",
                              !['confirmed','cancelled','rescheduled','completed','no_show','note_added','created','updated','deleted_from_ghl','contact_deleted'].includes(entry.event_type) && "bg-muted-foreground"
                            )} />
                            <div className="ml-2 p-2 sm:p-3 bg-muted/30 rounded-lg border border-border/50">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className={cn("text-xs font-medium",
                                      entry.event_type === 'confirmed' && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                                      entry.event_type === 'cancelled' && "bg-red-500/10 text-red-600 border-red-500/20",
                                      entry.event_type === 'rescheduled' && "bg-orange-500/10 text-orange-600 border-orange-500/20",
                                      entry.event_type === 'completed' && "bg-slate-500/10 text-slate-600 border-slate-500/20",
                                      entry.event_type === 'no_show' && "bg-amber-500/10 text-amber-600 border-amber-500/20",
                                      entry.event_type === 'note_added' && "bg-blue-500/10 text-blue-600 border-blue-500/20",
                                      entry.event_type === 'created' && "bg-purple-500/10 text-purple-600 border-purple-500/20",
                                      entry.event_type === 'updated' && "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
                                      (entry.event_type === 'deleted_from_ghl' || entry.event_type === 'contact_deleted') && "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                    )}>
                                      {capitalizeText(entry.event_type.replace(/_/g, ' '))}
                                    </Badge>
                                    {isWebhook && <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-600 border-cyan-500/20"><RefreshCw className="h-2.5 w-2.5 mr-1" />Webhook</Badge>}
                                    {isManual && <Badge variant="outline" className="text-[10px] bg-violet-500/10 text-violet-600 border-violet-500/20"><User className="h-2.5 w-2.5 mr-1" />Manual</Badge>}
                                  </div>
                                  {(historyMeetingIds.length > 1 || author) && (
                                    <div className="mt-1 text-[10px] text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                                      {historyMeetingIds.length > 1 && <span><span className="opacity-70">Meeting:</span> {meetingName} — {meetingLabel}</span>}
                                      <span><span className="opacity-70">By:</span> {authorLabel}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-xs text-muted-foreground block">{format(new Date(entry.created_at), 'MMM d, yyyy')}</span>
                                  <span className="text-[10px] text-muted-foreground/70">{format(new Date(entry.created_at), 'h:mm:ss a')}</span>
                                </div>
                              </div>
                              {entry.previous_status && entry.previous_status !== entry.new_status && (
                                <div className="flex items-center gap-2 mb-2 text-xs">
                                  <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{capitalizeText(entry.previous_status)}</span>
                                  <span className="text-muted-foreground">→</span>
                                  <span className={cn("px-1.5 py-0.5 rounded font-medium",
                                    entry.new_status === 'confirmed' && "bg-emerald-500/20 text-emerald-700",
                                    entry.new_status === 'cancelled' && "bg-red-500/20 text-red-700",
                                    entry.new_status === 'rescheduled' && "bg-orange-500/20 text-orange-700",
                                    entry.new_status === 'completed' && "bg-slate-500/20 text-slate-700",
                                    entry.new_status === 'no_show' && "bg-amber-500/20 text-amber-700",
                                    entry.new_status === 'deleted_from_ghl' && "bg-rose-500/20 text-rose-700"
                                  )}>{capitalizeText(entry.new_status)}</span>
                                </div>
                              )}
                              {entry.notes && (
                                <div className="text-sm text-foreground/80 bg-background/50 p-2 rounded border border-border/30">
                                  <MessageSquare className="h-3 w-3 text-muted-foreground inline mr-1.5" />{entry.notes}
                                </div>
                              )}
                              {entry.appointment_id && (
                                <div className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                                  <span className="opacity-60">Appointment:</span>
                                  <code className="bg-muted px-1 rounded">{entry.appointment_id.slice(0, 20)}...</code>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {meetingHistory.length === 0 && (
                  <div className="p-4 bg-muted/30 rounded-lg border border-dashed border-border text-center">
                    <History className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No update history yet</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">Changes will be logged here</p>
                  </div>
                )}

                {/* Additional Info */}
                {(selectedMeeting.ghl_contact_id || selectedMeeting.appointment_id) && (
                  <div className="text-xs space-y-1.5 pt-3 border-t">
                    {selectedMeeting.ghl_contact_id && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">GHL Contact:</span>
                        <a href={getGHLContactUrl(selectedMeeting.ghl_contact_id)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {selectedMeeting.ghl_contact_id.slice(0, 12)}...<ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {selectedMeeting.appointment_id && (
                      <div className="text-muted-foreground">Appointment ID: {selectedMeeting.appointment_id}</div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t mt-4">
                  {statusFilter === 'archived' ? (
                    <Button variant="outline" className="flex-1 gap-2 min-h-[44px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20" onClick={() => handleRestoreArchivedMeeting(selectedMeeting)}>
                      <RotateCcw className="h-4 w-4" /> Restore
                    </Button>
                  ) : (
                    <Button variant="outline" className="flex-1 gap-2 min-h-[44px] bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20" onClick={() => handleArchiveMeeting(selectedMeeting)}>
                      <Archive className="h-4 w-4" /> Archive
                    </Button>
                  )}
                  <Button variant="outline" className="flex-1 gap-2 min-h-[44px] bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20" onClick={() => { setMeetingToDelete(selectedMeeting); setSelectedMeeting(null); }}>
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!meetingToDelete} onOpenChange={(open) => !open && setMeetingToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this meeting for{' '}
              <span className="font-medium text-foreground">{meetingToDelete?.name}</span>
              {meetingToDelete?.email && ` (${meetingToDelete.email})`}?
              <br /><br />
              This action cannot be undone and will remove the meeting record from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => meetingToDelete && handleDeleteMeeting(meetingToDelete)}
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