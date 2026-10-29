import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { capitalizeText, formatName } from '@/lib/textFormatting';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Loader2, 
  Calendar,
  Clock,
  User,
  Building,
  Video,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Phone,
  Mail,
  MessageSquare,
  Link2,
  Copy,
  FileText,
  Target,
  Search,
  CalendarDays,
  ArrowRight,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AdminFilterRow, standardSortOptions } from '@/components/admin';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, isPast } from 'date-fns';
import AccessDenied from '@/components/admin/AccessDenied';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { getGHLContactUrl } from '@/lib/ghlConfig';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MeetingDocumentsSection } from '@/components/admin/MeetingDocumentsSection';
import { Link } from 'react-router-dom';

// Discovery and Solution meeting title patterns to EXCLUDE - flexible matching
const DISCOVERY_PATTERNS = [
  'Discovery Call With alfred ai',
  'Discovery Call Round Robin',
  'Discovery Meeting',
];

const SOLUTION_PATTERNS = [
  'alfred ai - Strategy and Solutions Session',
  'AI Strategy and Solution Session',
  'Strategy and Solutions Session',
  'Solution Session',
  'Solution Call',
  'Proposal Calendar',  // Will's Proposal Calendar
];

// Helper functions for pattern matching
const isDiscoveryPattern = (text: string): boolean => {
  if (!text) return false;
  const lower = text.toLowerCase();
  return DISCOVERY_PATTERNS.some(pattern => lower.includes(pattern.toLowerCase()));
};

const isSolutionPattern = (text: string): boolean => {
  if (!text) return false;
  const lower = text.toLowerCase();
  return SOLUTION_PATTERNS.some(pattern => lower.includes(pattern.toLowerCase()));
};

interface PersonalCalendarMeeting {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  ghlBusinessName?: string | null;
  event_name: string | null;
  appointment_title: string | null;
  status: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  meet_link: string | null;
  calendar_name: string | null;
  created_at: string;
  ghl_contact_id?: string;
  appointment_id?: string;
  hasTranscript?: boolean;
  transcriptCount?: number;
  meeting_category?: string;
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
  created_at: string;
  meeting_category: string | null;
  ghl_response: {
    start_time?: string;
    end_time?: string;
    appointment_id?: string;
    calendar_name?: string;
    appointment_title?: string;
    phone?: string;
    location?: string;
    meet_link?: string;
    google_meet_link?: string;
    ghl_contact_id?: string;
    ghl_business_name?: string;
  } | null;
}

export default function PersonalCalendarsMeetingsAdmin() {
  const { user } = useAdminAuth();
  const { canViewLeads } = usePermissions();
  const [meetings, setMeetings] = useState<PersonalCalendarMeeting[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<PersonalCalendarMeeting[]>([]);
  const [documentCounts, setDocumentCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'name_asc' | 'name_desc'>('date_desc');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [selectedMeeting, setSelectedMeeting] = useState<PersonalCalendarMeeting | null>(null);

  // Check if meeting is from a personal calendar (NOT discovery or solution)
  const isPersonalCalendarMeeting = useCallback((booking: GHLBooking): boolean => {
    // Exclude if explicitly categorized as discovery or solution
    if (booking.meeting_category === 'discovery' || booking.meeting_category === 'solution') return false;
    
    // Check appointment title and calendar name - exclude if matches discovery or solution patterns
    const appointmentTitle = booking.ghl_response?.appointment_title || '';
    const calendarName = booking.ghl_response?.calendar_name || '';
    
    const isDiscovery = isDiscoveryPattern(appointmentTitle) || isDiscoveryPattern(calendarName);
    const isSolution = isSolutionPattern(appointmentTitle) || isSolutionPattern(calendarName);
    
    // Return true only if NOT discovery AND NOT solution
    return !isDiscovery && !isSolution;
  }, []);

  const fetchMeetings = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch GHL bookings that could be personal calendar meetings
      const { data, error } = await supabase
        .from('ghl_submissions')
        .select('*')
        .is('archived_at', null)
        .in('ghl_status', ['confirmed', 'cancelled', 'rescheduled'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const bookings = (data || []) as GHLBooking[];
      
      // Filter to only personal calendar meetings
      const personalBookings = bookings.filter(isPersonalCalendarMeeting);

      // Fetch document counts
      const { data: docs } = await supabase
        .from('meeting_documents')
        .select('meeting_id')
        .not('meeting_id', 'is', null);

      const counts: Record<string, number> = {};
      (docs || []).forEach((doc) => {
        if (doc.meeting_id) {
          counts[doc.meeting_id] = (counts[doc.meeting_id] || 0) + 1;
        }
      });
      setDocumentCounts(counts);

      // Transform to unified format
      const unified: PersonalCalendarMeeting[] = personalBookings.map((booking) => {
        const response = booking.ghl_response;
        const meetLink = booking.meet_link || response?.meet_link || response?.google_meet_link;
        const displayName = booking.lead_name || 
          (booking.lead_first_name && booking.lead_last_name 
            ? `${booking.lead_first_name} ${booking.lead_last_name}` 
            : booking.lead_first_name || booking.lead_email.split('@')[0]);

        return {
          id: booking.id,
          name: displayName,
          email: booking.lead_email,
          phone: response?.phone || booking.lead_phone,
          company: booking.lead_company,
          ghlBusinessName: response?.ghl_business_name,
          event_name: response?.calendar_name || 'Personal Meeting',
          appointment_title: response?.appointment_title || response?.calendar_name || null,
          status: booking.ghl_status === 'cancelled' ? 'cancelled' 
            : booking.ghl_status === 'rescheduled' ? 'rescheduled' 
            : 'confirmed',
          start_time: response?.start_time || null,
          end_time: response?.end_time || null,
          location: response?.location || null,
          meet_link: meetLink || null,
          calendar_name: response?.calendar_name || null,
          created_at: booking.created_at,
          ghl_contact_id: response?.ghl_contact_id,
          appointment_id: response?.appointment_id,
          hasTranscript: (counts[booking.id] || 0) > 0,
          transcriptCount: counts[booking.id] || 0,
          meeting_category: booking.meeting_category || undefined,
        };
      });

      setMeetings(unified);
    } catch (error) {
      console.error('Error fetching personal calendar meetings:', error);
      toast.error('Failed to load personal calendar meetings');
    } finally {
      setIsLoading(false);
    }
  }, [isPersonalCalendarMeeting]);

  useEffect(() => {
    if (user) {
      fetchMeetings();
    }
  }, [user, fetchMeetings]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('personal-calendar-meetings-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ghl_submissions'
        },
        () => {
          fetchMeetings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchMeetings]);

  // Filter meetings
  useEffect(() => {
    let filtered = [...meetings];

    if (filterStatus !== 'all') {
      filtered = filtered.filter((m) => m.status === filterStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.email.toLowerCase().includes(query) ||
          m.company?.toLowerCase().includes(query) ||
          m.phone?.toLowerCase().includes(query) ||
          m.appointment_title?.toLowerCase().includes(query)
      );
    }

    if (dateRange.from) {
      const fromDate = startOfDay(dateRange.from);
      const toDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(new Date(8640000000000000));
      filtered = filtered.filter((m) => {
        const meetingDate = new Date(m.created_at);
        return isWithinInterval(meetingDate, { start: fromDate, end: toDate });
      });
    }

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
  }, [meetings, searchQuery, filterStatus, sortBy, dateRange]);

  const handleSetCategory = async (meetingId: string, category: 'discovery' | 'solution') => {
    try {
      const { error } = await supabase
        .from('ghl_submissions')
        .update({ meeting_category: category })
        .eq('id', meetingId);

      if (error) throw error;

      toast.success(`Meeting categorized as ${category}`);
      fetchMeetings();
      setSelectedMeeting(null);
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update meeting category');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Confirmed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      case 'rescheduled':
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30"><RefreshCw className="h-3 w-3 mr-1" />Rescheduled</Badge>;
      default:
        return <Badge variant="secondary">{capitalizeText(status)}</Badge>;
    }
  };

  if (!canViewLeads) {
    return <AccessDenied message="Only admins can view personal calendar meetings." requiredRole="Admin or Super Admin" />;
  }

  // Stats
  const stats = {
    total: meetings.length,
    confirmed: meetings.filter(m => m.status === 'confirmed').length,
    upcoming: meetings.filter(m => m.start_time && new Date(m.start_time) > new Date() && m.status === 'confirmed').length,
    withTranscript: meetings.filter(m => m.hasTranscript).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <CalendarDays className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Personal Calendar Meetings</h1>
              <p className="text-sm text-muted-foreground">Ad-hoc and personal calendar appointments</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchMeetings} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Link to="/admin/meetings">
            <Button variant="ghost" size="sm" className="gap-2">
              All Meetings
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <CalendarDays className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Personal</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.confirmed}</p>
                <p className="text-xs text-muted-foreground">Confirmed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.upcoming}</p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <FileText className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.withTranscript}</p>
                <p className="text-xs text-muted-foreground">With Transcripts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <AdminFilterRow
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name, email, company, title..."
        sortOptions={standardSortOptions}
        sortValue={sortBy}
        onSortChange={(v) => setSortBy(v as typeof sortBy)}
        hasActiveFilters={searchQuery !== '' || filterStatus !== 'all' || !!dateRange.from}
        onClearFilters={() => {
          setSearchQuery('');
          setFilterStatus('all');
          setDateRange({ from: undefined, to: undefined });
        }}
        actions={
          <div className="flex items-center gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="rescheduled">Rescheduled</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  <Calendar className="h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
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
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}>Last 7 days</Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}>Last 30 days</Button>
                  <Button variant="ghost" size="sm" className={cn("h-7 text-xs", !dateRange.from && "bg-muted")} onClick={() => setDateRange({ from: undefined, to: undefined })}>All time</Button>
                </div>
                <CalendarComponent
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        }
      />

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {filteredMeetings.length} of {meetings.length} personal calendar meetings</span>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredMeetings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No personal calendar meetings found</p>
            <p className="text-xs text-muted-foreground mt-1">Personal calendar meetings exclude Discovery and Solution sessions</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredMeetings.map((meeting) => {
            const ghlContactUrl = meeting.ghl_contact_id ? getGHLContactUrl(meeting.ghl_contact_id) : null;
            const hasMeetingPassed = meeting.start_time && isPast(new Date(meeting.start_time));
            const displayCompany = meeting.ghlBusinessName || meeting.company;

            return (
              <Card 
                key={meeting.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedMeeting(meeting)}
              >
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Contact Info */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground break-words">{formatName(meeting.name)}</p>
                          {displayCompany && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Building className="h-3 w-3 shrink-0" />
                              <span className="break-words">{displayCompany}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm break-all select-text">{meeting.email}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(meeting.email, 'Email'); }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      {meeting.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm break-all select-text">{meeting.phone}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(meeting.phone!, 'Phone'); }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Event Details */}
                    <div className="space-y-2">
                      {/* Meeting Title */}
                      <div className="flex items-start gap-2">
                        <CalendarDays className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-foreground break-words">
                            {meeting.appointment_title || meeting.calendar_name || 'Personal Meeting'}
                          </p>
                          {meeting.calendar_name && meeting.appointment_title && meeting.calendar_name !== meeting.appointment_title && (
                            <p className="text-xs text-muted-foreground break-words">{meeting.calendar_name}</p>
                          )}
                        </div>
                      </div>
                      {meeting.start_time && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm">{format(new Date(meeting.start_time), 'EEE, MMM d, yyyy')}</span>
                        </div>
                      )}
                      {meeting.start_time && meeting.end_time && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm">
                            {format(new Date(meeting.start_time), 'h:mm a')} - {format(new Date(meeting.end_time), 'h:mm a')}
                          </span>
                        </div>
                      )}
                      {meeting.location && (
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm break-all">{meeting.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions & Status */}
                    <div className="space-y-2 flex flex-col">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(meeting.status)}
                        {meeting.hasTranscript && (
                          <Badge variant="secondary" className="gap-1">
                            <FileText className="h-3 w-3" />
                            {meeting.transcriptCount} doc{meeting.transcriptCount !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap mt-auto pt-2">
                        {meeting.meet_link && meeting.status === 'confirmed' && (
                          hasMeetingPassed ? (
                            <Badge variant="outline" className="text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              Meeting Passed
                            </Badge>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              className="h-10 px-4 gap-2 min-w-[120px]"
                              onClick={(e) => { e.stopPropagation(); window.open(meeting.meet_link!, '_blank'); }}
                            >
                              <Video className="h-4 w-4" />
                              Join Meeting
                            </Button>
                          )
                        )}
                        {ghlContactUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 px-4 gap-2 min-w-[100px]"
                            onClick={(e) => { e.stopPropagation(); window.open(ghlContactUrl, '_blank'); }}
                          >
                            <ExternalLink className="h-4 w-4" />
                            View in GHL
                          </Button>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground mt-auto">
                        Created: {format(new Date(meeting.created_at), 'MMM d, yyyy h:mm a')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Meeting Details Dialog */}
      <Dialog open={!!selectedMeeting} onOpenChange={(open) => !open && setSelectedMeeting(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-violet-500" />
              Personal Calendar Meeting Details
            </DialogTitle>
            <DialogDescription>
              View and manage meeting details
            </DialogDescription>
          </DialogHeader>

          {selectedMeeting && (
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact Information</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium break-words">{formatName(selectedMeeting.name)}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm break-all select-text">{selectedMeeting.email}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 ml-auto" onClick={() => copyToClipboard(selectedMeeting.email, 'Email')}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  {selectedMeeting.phone && (
                    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm break-all select-text">{selectedMeeting.phone}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 ml-auto" onClick={() => copyToClipboard(selectedMeeting.phone!, 'Phone')}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {(selectedMeeting.ghlBusinessName || selectedMeeting.company) && (
                    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                      <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm break-words">{selectedMeeting.ghlBusinessName || selectedMeeting.company}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Meeting Title */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Meeting Title</Label>
                <div className="p-3 bg-violet-500/5 border border-violet-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CalendarDays className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground break-words">
                        {selectedMeeting.appointment_title || selectedMeeting.calendar_name || 'Personal Meeting'}
                      </p>
                      {selectedMeeting.calendar_name && selectedMeeting.appointment_title && selectedMeeting.calendar_name !== selectedMeeting.appointment_title && (
                        <p className="text-xs text-muted-foreground mt-1">Calendar: {selectedMeeting.calendar_name}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Meeting Details */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Meeting Details</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedMeeting.start_time && (
                    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm">{format(new Date(selectedMeeting.start_time), 'EEE, MMM d, yyyy')}</span>
                    </div>
                  )}
                  {selectedMeeting.start_time && selectedMeeting.end_time && (
                    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm">
                        {format(new Date(selectedMeeting.start_time), 'h:mm a')} - {format(new Date(selectedMeeting.end_time), 'h:mm a')}
                      </span>
                    </div>
                  )}
                  {selectedMeeting.location && (
                    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg sm:col-span-2">
                      <Video className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm break-all">{selectedMeeting.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                    {getStatusBadge(selectedMeeting.status)}
                  </div>
                </div>
              </div>

              {/* Categorize as Discovery or Solution */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Re-categorize Meeting</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleSetCategory(selectedMeeting.id, 'discovery')}
                  >
                    <Search className="h-4 w-4 text-cyan-500" />
                    Mark as Discovery
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleSetCategory(selectedMeeting.id, 'solution')}
                  >
                    <Target className="h-4 w-4 text-amber-500" />
                    Mark as Solution
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {selectedMeeting.meet_link && selectedMeeting.status === 'confirmed' && (
                  selectedMeeting.start_time && isPast(new Date(selectedMeeting.start_time)) ? (
                    <Badge variant="outline" className="text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      Meeting Passed
                    </Badge>
                  ) : (
                    <Button
                      variant="default"
                      className="h-10 px-4 gap-2"
                      onClick={() => window.open(selectedMeeting.meet_link!, '_blank')}
                    >
                      <Video className="h-4 w-4" />
                      Join Meeting
                    </Button>
                  )
                )}
                {selectedMeeting.ghl_contact_id && (
                  <Button
                    variant="outline"
                    className="h-10 px-4 gap-2"
                    onClick={() => window.open(getGHLContactUrl(selectedMeeting.ghl_contact_id!), '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                    View in GHL
                  </Button>
                )}
              </div>

              {/* Documents Section */}
              <MeetingDocumentsSection
                meetingId={selectedMeeting.id}
                meetingType="personal"
                contactEmail={selectedMeeting.email}
                contactName={selectedMeeting.name}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
