import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Users, 
  TrendingUp, 
  Radio, 
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileText,
  Megaphone,
  Mail,
  Calendar,
  Target,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import AccessDenied from '@/components/admin/AccessDenied';
import { DateRangeFilter, DatePreset } from '@/components/admin/DateRangeFilter';
import { getDateFilterBounds } from '@/components/admin/dateFilterBounds';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { cn } from '@/lib/utils';

interface Lead {
  id: string;
  lead_type: string;
  created_at: string;
}

interface GHLSubmission {
  id: string;
  source_medium: string;
  source_campaign: string | null;
  ghl_status: string;
  lead_source: string | null;
  created_at: string;
}

const COLORS = {
  primary: '#8B5CF6',
  secondary: '#0EA5E9',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  pink: '#EC4899',
};

const funnelColors = ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'];

export default function AnalyticsDashboard() {
  const { user } = useAdminAuth();
  const { canViewLeads } = usePermissions();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  
  // Date filter state
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 29));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [activePreset, setActivePreset] = useState<DatePreset>('30days');

  // Set up realtime subscriptions with auto-refresh
  useEffect(() => {
    let leadsConnected = false;
    let ghlConnected = false;

    const updateConnectionStatus = () => {
      setIsRealtimeConnected(leadsConnected && ghlConnected);
    };

    const leadsChannel = supabase
      .channel('analytics-leads-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['analytics-leads'] });
        
        if (payload.eventType === 'INSERT') {
          const newLead = payload.new as Lead;
          toast.info('New lead captured', {
            description: `Type: ${newLead.lead_type || 'Unknown'} • KPIs updated`,
          });
        } else if (payload.eventType === 'UPDATE') {
          toast.info('Lead updated', {
            description: 'Dashboard metrics refreshed',
          });
        }
      })
      .subscribe((status) => {
        leadsConnected = status === 'SUBSCRIBED';
        updateConnectionStatus();
      });

    const ghlChannel = supabase
      .channel('analytics-ghl-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ghl_submissions' }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['analytics-ghl'] });
        
        if (payload.eventType === 'INSERT') {
          const newSubmission = payload.new as GHLSubmission;
          const isBooking = newSubmission.lead_source === 'calendar_widget' || 
                           newSubmission.source_medium === 'ghl_direct_booking';
          toast.info(isBooking ? 'New booking received' : 'New submission received', {
            description: `${newSubmission.lead_source || newSubmission.source_medium || 'Unknown source'} • KPIs updated`,
          });
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as GHLSubmission;
          const old = payload.old as Partial<GHLSubmission>;
          if (old.ghl_status !== updated.ghl_status && updated.ghl_status) {
            toast.info('Status changed', {
              description: `${updated.ghl_status} • Metrics refreshed`,
            });
          }
        }
      })
      .subscribe((status) => {
        ghlConnected = status === 'SUBSCRIBED';
        updateConnectionStatus();
      });

    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(ghlChannel);
    };
  }, [queryClient]);

  // Fetch leads
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['analytics-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('id, lead_type, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!user,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Fetch GHL submissions
  const { data: ghlSubmissions = [], isLoading: ghlLoading } = useQuery({
    queryKey: ['analytics-ghl'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ghl_submissions')
        .select('id, source_medium, source_campaign, ghl_status, lead_source, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as GHLSubmission[];
    },
    enabled: !!user,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const isLoading = leadsLoading || ghlLoading;

  // Helper to check if a GHL submission is calendar-originated (belongs to Leads Booked)
  const isCalendarOrigin = (g: GHLSubmission): boolean => {
    return (
      g.lead_source === 'calendar_widget' ||
      g.source_medium === 'ghl_direct_booking' ||
      ['confirmed', 'cancelled', 'rescheduled'].includes(g.ghl_status || '')
    );
  };

  // Get date filter bounds with validation
  const { start: filterStart, end: filterEnd, isValid: isDateValid } = getDateFilterBounds(startDate, endDate);

  // Filter data by date range
  const filteredLeads = leads.filter(l => {
    if (!isDateValid) return false;
    const date = new Date(l.created_at);
    if (filterStart && date < filterStart) return false;
    if (filterEnd && date > filterEnd) return false;
    return true;
  });

  // All GHL submissions filtered by date
  const allFilteredGHL = ghlSubmissions.filter(g => {
    if (!isDateValid) return false;
    const date = new Date(g.created_at);
    if (filterStart && date < filterStart) return false;
    if (filterEnd && date > filterEnd) return false;
    return true;
  });

  // Separate: form leads (for Leads/GHL Submissions) vs calendar leads (for Leads Booked)
  const filteredGHL = allFilteredGHL.filter(g => !isCalendarOrigin(g)); // Form leads only
  const calendarGHL = allFilteredGHL.filter(g => isCalendarOrigin(g)); // Calendar bookings only

  // Calculate stats - separate form leads from calendar bookings
  const stats = {
    totalLeads: filteredLeads.length,
    totalGHL: filteredGHL.length, // Form leads only (excludes calendar)
    totalBooked: calendarGHL.length, // Calendar bookings only
    confirmed: calendarGHL.filter(g => g.ghl_status === 'confirmed').length,
    cancelled: calendarGHL.filter(g => g.ghl_status === 'cancelled' || g.ghl_status === 'canceled').length,
    pending: filteredGHL.filter(g => g.ghl_status === 'submitted' || g.ghl_status === 'booking_shown').length,
    demoRequests: filteredLeads.filter(l => l.lead_type === 'demo_request' || l.lead_type === 'demo').length + 
                  filteredGHL.filter(g => g.source_campaign === 'demo_request').length,
    contactForms: filteredLeads.filter(l => l.lead_type === 'contact').length +
                  filteredGHL.filter(g => g.source_campaign === 'contact_inquiry' || g.source_campaign === 'contact_form').length,
    conversionRate: (filteredLeads.length + filteredGHL.length) > 0 
      ? Math.round((calendarGHL.filter(g => g.ghl_status === 'confirmed').length / (filteredLeads.length + filteredGHL.length)) * 100) 
      : 0,
  };

  // Conversion funnel data - now properly tracks form leads to bookings
  const funnelData = [
    { 
      name: 'Website Visitors', 
      value: (stats.totalLeads + stats.totalGHL + stats.totalBooked) * 10,
      fill: funnelColors[0],
    },
    { 
      name: 'Lead Captured', 
      value: stats.totalLeads + stats.totalGHL,
      fill: funnelColors[1],
    },
    { 
      name: 'Booking Shown', 
      value: filteredGHL.filter(g => g.ghl_status === 'booking_shown' || g.ghl_status === 'submitted').length + stats.totalBooked,
      fill: funnelColors[2],
    },
    { 
      name: 'Meeting Booked', 
      value: stats.totalBooked,
      fill: funnelColors[3],
    },
  ];

  // Daily trend data
  const daysBack = startDate && endDate 
    ? Math.min(Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1, 14)
    : 14;

  const dailyData = Array.from({ length: daysBack }, (_, i) => {
    const date = subDays(endDate || new Date(), daysBack - 1 - i);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    const dayLeads = filteredLeads.filter(l => {
      const d = new Date(l.created_at);
      return d >= dayStart && d <= dayEnd;
    }).length;
    
    const dayGHL = filteredGHL.filter(g => {
      const d = new Date(g.created_at);
      return d >= dayStart && d <= dayEnd;
    }).length;
    
    return {
      date: format(date, 'MMM d'),
      leads: dayLeads,
      ghl: dayGHL,
      total: dayLeads + dayGHL,
    };
  });

  // Source breakdown (by source_medium)
  const sourceBreakdown = [
    { 
      name: 'Chatbot', 
      value: filteredGHL.filter(g => g.source_medium.includes('chatbot')).length,
      color: COLORS.primary,
    },
    { 
      name: 'Form', 
      value: filteredGHL.filter(g => g.source_medium.includes('form')).length,
      color: COLORS.secondary,
    },
    { 
      name: 'Booking Modal', 
      value: filteredGHL.filter(g => g.source_medium === 'booking_modal').length,
      color: COLORS.success,
    },
    { 
      name: 'Other', 
      value: filteredGHL.filter(g => !g.source_medium.includes('chatbot') && !g.source_medium.includes('form') && g.source_medium !== 'booking_modal').length,
      color: COLORS.warning,
    },
  ].filter(s => s.value > 0);

  // Lead origin breakdown (by lead_source field) - form leads only
  const leadOriginBreakdown = {
    chatbot: filteredGHL.filter(g => g.lead_source === 'chatbot').length,
    calendar_widget: calendarGHL.length, // Calendar bookings from Leads Booked
    form: filteredGHL.filter(g => g.lead_source === 'form').length,
    personalization_flow: filteredGHL.filter(g => g.lead_source === 'personalization_flow').length,
    unknown: filteredGHL.filter(g => !g.lead_source || g.lead_source === 'unknown').length,
  };

  // Access control
  if (!canViewLeads) {
    return <AccessDenied message="Only admins can view analytics." requiredRole="Admin or Super Admin" />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Lead Analytics</h2>
            <p className="text-muted-foreground">
              Combined view of leads and GHL submissions
            </p>
          </div>
          {isRealtimeConnected && (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1.5">
              <Radio className="w-3 h-3 animate-pulse" />
              Live
            </Badge>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['analytics-leads'] });
            queryClient.invalidateQueries({ queryKey: ['analytics-ghl'] });
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            activePreset={activePreset}
            onPresetChange={setActivePreset}
          />
        </CardContent>
      </Card>

      {/* Stats Cards - Clickable */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card 
          className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20 cursor-pointer hover:shadow-lg hover:border-violet-500/40 transition-all group"
          onClick={() => navigate('/admin/leads')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Form Leads</p>
                  <p className="text-2xl font-bold">{stats.totalLeads + stats.totalGHL}</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border-indigo-500/20 cursor-pointer hover:shadow-lg hover:border-indigo-500/40 transition-all group"
          onClick={() => navigate('/admin/leads-booked')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Booked</p>
                  <p className="text-2xl font-bold">{stats.totalBooked}</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 cursor-pointer hover:shadow-lg hover:border-emerald-500/40 transition-all group"
          onClick={() => navigate('/admin/leads-booked?status=confirmed')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                  <p className="text-2xl font-bold">{stats.confirmed}</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20 cursor-pointer hover:shadow-lg hover:border-amber-500/40 transition-all group"
          onClick={() => navigate('/admin/ghl-submissions')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conversion</p>
                <p className="text-2xl font-bold">{stats.conversionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Origin Stats - by lead_source */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4" />
            Lead Origin
          </CardTitle>
          <CardDescription>
            Where leads originated from (tracked via lead_source)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div 
              className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/20 cursor-pointer hover:shadow-lg hover:border-violet-500/40 transition-all"
              onClick={() => navigate('/admin/ghl-submissions?lead_source=chatbot')}
            >
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-violet-600" />
                <span className="text-sm font-medium">Chatbot</span>
              </div>
              <p className="text-2xl font-bold text-violet-600">{leadOriginBreakdown.chatbot}</p>
            </div>

            <div 
              className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border border-indigo-500/20 cursor-pointer hover:shadow-lg hover:border-indigo-500/40 transition-all"
              onClick={() => navigate('/admin/leads-booked')}
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium">Calendar</span>
              </div>
              <p className="text-2xl font-bold text-indigo-600">{leadOriginBreakdown.calendar_widget}</p>
            </div>

            <div 
              className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 cursor-pointer hover:shadow-lg hover:border-blue-500/40 transition-all"
              onClick={() => navigate('/admin/ghl-submissions?lead_source=form')}
            >
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Form</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{leadOriginBreakdown.form}</p>
            </div>

            <div 
              className="p-4 rounded-xl bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/20 cursor-pointer hover:shadow-lg hover:border-pink-500/40 transition-all"
              onClick={() => navigate('/admin/ghl-submissions?lead_source=personalization_flow')}
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-pink-500" />
                <span className="text-sm font-medium">Personalization</span>
              </div>
              <p className="text-2xl font-bold text-pink-500">{leadOriginBreakdown.personalization_flow}</p>
            </div>

            <div 
              className="p-4 rounded-xl bg-gradient-to-br from-gray-500/10 to-gray-500/5 border border-gray-500/20 cursor-pointer hover:shadow-lg hover:border-gray-500/40 transition-all"
              onClick={() => navigate('/admin/ghl-submissions?lead_source=unknown')}
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Unknown</span>
              </div>
              <p className="text-2xl font-bold text-gray-600">{leadOriginBreakdown.unknown}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4" />
            Conversion Funnel
          </CardTitle>
          <CardDescription>
            Track how leads move through your pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Visual funnel steps */}
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between gap-2">
                {funnelData.map((step, index) => (
                  <div key={step.name} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full rounded-lg flex items-center justify-center text-white font-bold transition-all hover:scale-105"
                      style={{ 
                        backgroundColor: step.fill,
                        height: `${Math.max(40, 120 - index * 20)}px`,
                        opacity: 1 - index * 0.15,
                      }}
                    >
                      {step.value.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground text-center font-medium">
                      {step.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Funnel metrics */}
            <div className="lg:w-64 space-y-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Lead → Booking Rate</p>
                <p className="text-lg font-bold">
                  {funnelData[1].value > 0 
                    ? Math.round((funnelData[2].value / funnelData[1].value) * 100) 
                    : 0}%
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Booking → Confirm Rate</p>
                <p className="text-lg font-bold">
                  {funnelData[2].value > 0 
                    ? Math.round((funnelData[3].value / funnelData[2].value) * 100) 
                    : 0}%
                </p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-xs text-emerald-600 font-medium">Overall Conversion</p>
                <p className="text-lg font-bold text-emerald-600">
                  {stats.conversionRate}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Daily Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorGHL" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="leads" 
                    name="Leads" 
                    stroke={COLORS.primary} 
                    fill="url(#colorLeads)" 
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="ghl" 
                    name="GHL Submissions" 
                    stroke={COLORS.secondary} 
                    fill="url(#colorGHL)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Source Distribution - Clickable */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Lead Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {sourceBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      style={{ cursor: 'pointer' }}
                      onClick={(data) => {
                        const mediumMap: Record<string, string> = {
                          'Chatbot': 'lead_chatbot',
                          'Form': 'lead_form',
                          'Booking Modal': 'booking_modal',
                        };
                        const medium = mediumMap[data.name];
                        if (medium) {
                          navigate(`/admin/ghl-submissions?medium=${medium}`);
                        } else {
                          navigate('/admin/ghl-submissions');
                        }
                      }}
                    >
                      {sourceBreakdown.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          style={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `${value} submission${value !== 1 ? 's' : ''} (click to filter)`, 
                        name
                      ]}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend 
                      formatter={(value) => <span className="cursor-pointer hover:underline">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No source data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance - Clickable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            Campaign Performance
          </CardTitle>
          <CardDescription>
            Breakdown by campaign type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 cursor-pointer hover:shadow-lg hover:border-emerald-500/40 transition-all group"
              onClick={() => navigate('/admin/leads')}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Megaphone className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium">Demo Requests</span>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-3xl font-bold text-emerald-600">{stats.demoRequests}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalLeads + stats.totalGHL > 0 
                  ? Math.round((stats.demoRequests / (stats.totalLeads + stats.totalGHL)) * 100) 
                  : 0}% of total
              </p>
            </div>

            <div 
              className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 cursor-pointer hover:shadow-lg hover:border-blue-500/40 transition-all group"
              onClick={() => navigate('/admin/leads')}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium">Contact Forms</span>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-3xl font-bold text-blue-600">{stats.contactForms}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalLeads + stats.totalGHL > 0 
                  ? Math.round((stats.contactForms / (stats.totalLeads + stats.totalGHL)) * 100) 
                  : 0}% of total
              </p>
            </div>

            <div 
              className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/20 cursor-pointer hover:shadow-lg hover:border-violet-500/40 transition-all group"
              onClick={() => navigate('/admin/ghl-submissions')}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-violet-600" />
                  </div>
                  <span className="text-sm font-medium">AI Assistant Leads</span>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-3xl font-bold text-violet-600">
                {filteredGHL.filter(g => g.source_medium.includes('chatbot')).length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredGHL.length > 0 
                  ? Math.round((filteredGHL.filter(g => g.source_medium.includes('chatbot')).length / filteredGHL.length) * 100) 
                  : 0}% of GHL
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
