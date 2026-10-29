import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { capitalizeText, formatName } from '@/lib/textFormatting';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Lightbulb,
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
// Discovery meeting title patterns - flexible matching for various calendar name variations
const DISCOVERY_PATTERNS = [
  'Discovery Call With alfred ai',
  'Discovery Call Round Robin',
  'Discovery Meeting',
];

// Helper to check if text matches any discovery pattern
const isDiscoveryPattern = (text: string): boolean => {
  if (!text) return false;
  const lower = text.toLowerCase();
  return DISCOVERY_PATTERNS.some(pattern => lower.includes(pattern.toLowerCase()));
};

interface DiscoveryMeeting {
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

export default function DiscoveryMeetingsAdmin() {
  const { user } = useAdminAuth();
  const { canViewLeads } = usePermissions();
  const [meetings, setMeetings] = useState<DiscoveryMeeting[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<DiscoveryMeeting[]>([]);
  const [documentCounts, setDocumentCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'name_asc' | 'name_desc'>('date_desc');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [selectedMeeting, setSelectedMeeting] = useState<DiscoveryMeeting | null>(null);

  const isDiscoveryMeeting = useCallback((booking: GHLBooking): boolean => {
    // Check if explicitly categorized as discovery
    if (booking.meeting_category === 'discovery') return true;
    if (booking.meeting_category === 'solution') return false;
    
    // Check appointment title or calendar name for discovery patterns
    const appointmentTitle = booking.ghl_response?.appointment_title || '';
    const calendarName = booking.ghl_response?.calendar_name || '';
    return isDiscoveryPattern(appointmentTitle) || isDiscoveryPattern(calendarName);
  }, []);

  const fetchMeetings = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch GHL bookings that could be discovery meetings
      const { data, error } = await supabase
        .from('ghl_submissions')
        .select('*')
        .is('archived_at', null)
        .or('ghl_status.in.(confirmed,cancelled,rescheduled),meeting_category.eq.discovery')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const bookings = (data || []) as GHLBooking[];
      
      // Filter to only discovery meetings
      const discoveryBookings = bookings.filter(isDiscoveryMeeting);

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
      const unified: DiscoveryMeeting[] = discoveryBookings.map((booking) => {
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
          event_name: response?.calendar_name || 'Discovery Call',
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
      console.error('Error fetching discovery meetings:', error);
      toast.error('Failed to load discovery meetings');
    } finally {
      setIsLoading(false);
    }
  }, [isDiscoveryMeeting]);

  useEffect(() => {
    if (user) {
      fetchMeetings();
    }
  }, [user, fetchMeetings]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('discovery-meetings-realtime')
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
          m.phone?.toLowerCase().includes(query)
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
    return <AccessDenied message="Only admins can view discovery meetings." requiredRole="Admin or Super Admin" />;
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
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <Search className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Discovery Meetings</h1>
              <p className="text-sm text-muted-foreground">Initial consultations and needs assessments</p>
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
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <Search className="h-4 w-4 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Discovery</p>
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
        searchPlaceholder="Search by name, email, company..."
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
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        }
      />

      {/* Meetings List */}
      <div className="space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">Loading discovery meetings...</p>
            </CardContent>
          </Card>
        ) : filteredMeetings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">No discovery meetings found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || filterStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Discovery meetings will appear here when booked'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredMeetings.map((meeting) => (
            <Card 
              key={meeting.id} 
              className="hover:border-cyan-500/50 transition-colors cursor-pointer group"
              onClick={() => setSelectedMeeting(meeting)}
            >
              <CardContent className="p-4 sm:p-5">
                {/* Badges Row */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <Badge variant="outline" className="bg-cyan-500/10 text-cyan-600 border-cyan-500/30">
                    <Search className="h-3 w-3 mr-1" />
                    Discovery
                  </Badge>
                  {getStatusBadge(meeting.status)}
                  {meeting.hasTranscript && (
                    <Badge variant="secondary" className="bg-purple-500/10 text-purple-600">
                      <FileText className="h-3 w-3 mr-1" />
                      {meeting.transcriptCount} doc{meeting.transcriptCount !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Contact Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground text-lg select-text">{formatName(meeting.name)}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="select-text break-all">{meeting.email}</span>
                    </div>
                    {meeting.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4 shrink-0" />
                        <span className="select-text">{meeting.phone}</span>
                      </div>
                    )}
                    {(meeting.company || meeting.ghlBusinessName) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building className="h-4 w-4 shrink-0" />
                        <span className="select-text">{meeting.ghlBusinessName || meeting.company}</span>
                      </div>
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="space-y-2">
                    {/* Meeting Title - Primary identifier */}
                    {meeting.appointment_title && (
                      <div className="flex items-start gap-2 text-sm">
                        <Target className="h-4 w-4 shrink-0 text-cyan-600 mt-0.5" />
                        <span className="select-text text-foreground font-medium">{meeting.appointment_title}</span>
                      </div>
                    )}
                    {/* Calendar Name - if different from title */}
                    {meeting.calendar_name && meeting.calendar_name !== meeting.appointment_title && (
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="ml-6 select-text">Calendar: {meeting.calendar_name}</span>
                      </div>
                    )}
                    {meeting.start_time && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="font-medium">{format(new Date(meeting.start_time), 'EEEE, MMM d, yyyy')}</span>
                      </div>
                    )}
                    {meeting.start_time && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 shrink-0" />
                        <span>
                          {format(new Date(meeting.start_time), 'h:mm a')}
                          {meeting.end_time && ` - ${format(new Date(meeting.end_time), 'h:mm a')}`}
                        </span>
                      </div>
                    )}
                    {meeting.location && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MessageSquare className="h-4 w-4 shrink-0 mt-0.5" />
                        <span className="select-text break-all">{meeting.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions & Links */}
                  <div className="space-y-2 flex flex-col">
                    {meeting.meet_link && (
                      <a
                        href={meeting.meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium min-h-[40px]"
                      >
                        <Video className="h-4 w-4" />
                        Join Meeting
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {meeting.ghl_contact_id && (
                      <a
                        href={getGHLContactUrl(meeting.ghl_contact_id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground min-h-[40px]"
                      >
                        <Link2 className="h-4 w-4" />
                        View in GHL
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <p className="text-xs text-muted-foreground mt-auto pt-2">
                      Created {format(new Date(meeting.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Meeting Detail Dialog */}
      <Dialog open={!!selectedMeeting} onOpenChange={(open) => !open && setSelectedMeeting(null)}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-hidden flex flex-col p-0">
          {selectedMeeting && (
            <>
              <DialogHeader className="px-6 pt-6 pb-4 border-b">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-cyan-500/10 text-cyan-600 border-cyan-500/30">
                    <Search className="h-3 w-3 mr-1" />
                    Discovery Meeting
                  </Badge>
                  {getStatusBadge(selectedMeeting.status)}
                </div>
                <DialogTitle className="text-xl">{formatName(selectedMeeting.name)}</DialogTitle>
                <DialogDescription>{selectedMeeting.email}</DialogDescription>
              </DialogHeader>

              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
                <div className="space-y-6 pb-6">
                  {/* Contact Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wide">Email</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="select-text font-medium">{selectedMeeting.email}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(selectedMeeting.email, 'Email')}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wide">Phone</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="select-text font-medium">{selectedMeeting.phone || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {(selectedMeeting.company || selectedMeeting.ghlBusinessName) && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wide">Company</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="select-text font-medium">{selectedMeeting.ghlBusinessName || selectedMeeting.company}</span>
                      </div>
                    </div>
                  )}

                  {/* Schedule */}
                  {selectedMeeting.start_time && (
                    <div className="p-5 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-blue-700">Scheduled Time</span>
                      </div>
                      <p className="text-lg font-medium">{format(new Date(selectedMeeting.start_time), 'EEEE, MMMM d, yyyy')}</p>
                      <p className="text-muted-foreground mt-1">{format(new Date(selectedMeeting.start_time), 'h:mm a')} - {selectedMeeting.end_time && format(new Date(selectedMeeting.end_time), 'h:mm a')}</p>
                    </div>
                  )}

                  {/* Meeting Link */}
                  <div className="space-y-3">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wide">Meeting Link</Label>
                    <div className="flex items-center gap-2">
                      <Input value={selectedMeeting.meet_link || ''} readOnly className="flex-1" placeholder="No meeting link" />
                      {selectedMeeting.meet_link && (
                        <>
                          <Button variant="outline" size="icon" onClick={() => copyToClipboard(selectedMeeting.meet_link!, 'Meeting link')}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <a href={selectedMeeting.meet_link} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="icon">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Documents Section */}
                  <MeetingDocumentsSection
                    meetingId={selectedMeeting.id}
                    meetingType="demo"
                    contactEmail={selectedMeeting.email}
                  />

                  {/* Category Actions */}
                  <div className="pt-4 border-t">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wide mb-3 block">Move to Solution</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      If this meeting has progressed to a solution discussion, you can recategorize it.
                    </p>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => handleSetCategory(selectedMeeting.id, 'solution')}
                    >
                      <Lightbulb className="h-4 w-4" />
                      Move to Solution Meetings
                    </Button>
                  </div>

                  {/* GHL Link */}
                  {selectedMeeting.ghl_contact_id && (
                    <div className="text-xs pt-4 border-t">
                      <a
                        href={getGHLContactUrl(selectedMeeting.ghl_contact_id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        View in GHL <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
