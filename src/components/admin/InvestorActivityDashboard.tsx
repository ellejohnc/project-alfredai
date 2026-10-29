import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  Clock, 
  Globe, 
  Mail, 
  Phone, 
  Video, 
  XCircle,
  CheckCircle2,
  AlertCircle,
  User,
  Loader2,
  RefreshCw,
  ExternalLink,
  MapPin,
  Eye,
  MousePointerClick,
  FileText
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface InvestorBooking {
  id: string;
  calendly_event_id: string | null;
  event_type: string | null;
  event_name: string | null;
  start_time: string | null;
  end_time: string | null;
  status: string;
  location: string | null;
  cancellation_reason: string | null;
  created_at: string;
}

interface CodeUsageLog {
  id: string;
  access_code: string;
  is_master_code: boolean;
  ip_address: string | null;
  user_agent: string | null;
  accessed_at: string;
}

interface PageViewLog {
  id: string;
  session_id: string | null;
  page_path: string;
  page_title: string | null;
  activity_type: string;
  user_agent: string | null;
  referrer: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}


interface ActivityEvent {
  id: string;
  type: 'booking' | 'access' | 'page_view' | 'interaction' | 'profile_update' | 'verification';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

interface InvestorActivityDashboardProps {
  investorId: string;
  investorName: string;
  investorEmail: string;
}

export default function InvestorActivityDashboard({ 
  investorId, 
  investorName,
  investorEmail 
}: InvestorActivityDashboardProps) {
  const [bookings, setBookings] = useState<InvestorBooking[]>([]);
  const [accessLogs, setAccessLogs] = useState<CodeUsageLog[]>([]);
  const [pageViews, setPageViews] = useState<PageViewLog[]>([]);
  const [activityTimeline, setActivityTimeline] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline');

  useEffect(() => {
    fetchActivityData();
  }, [investorId]);

  const fetchActivityData = async () => {
    setIsLoading(true);
    try {
      // Fetch bookings, access logs, and page views in parallel
      const [bookingsRes, logsRes, pageViewsRes] = await Promise.all([
        supabase
          .from('investor_bookings')
          .select('*')
          .eq('investor_id', investorId)
          .order('created_at', { ascending: false }),
        supabase
          .from('investor_code_usage')
          .select('*')
          .eq('investor_id', investorId)
          .order('accessed_at', { ascending: false })
          .limit(50),
        supabase
          .from('investor_page_views')
          .select('*')
          .eq('investor_id', investorId)
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

      const bookingsData = bookingsRes.data || [];
      const logsData = logsRes.data || [];
      const pageViewsData = pageViewsRes.data || [];

      setBookings(bookingsData);
      setAccessLogs(logsData);
      setPageViews(pageViewsData as unknown as PageViewLog[]);

      // Build unified activity timeline
      const activities: ActivityEvent[] = [];

      // Add bookings to timeline
      bookingsData.forEach(booking => {
        activities.push({
          id: `booking-${booking.id}`,
          type: 'booking',
          title: booking.event_name || 'Meeting Scheduled',
          description: booking.status === 'scheduled' 
            ? `Scheduled for ${booking.start_time ? format(new Date(booking.start_time), 'MMM d, yyyy h:mm a') : 'TBD'}`
            : booking.status === 'canceled'
            ? `Canceled: ${booking.cancellation_reason || 'No reason provided'}`
            : `Status: ${booking.status}`,
          timestamp: booking.created_at,
          status: booking.status,
          metadata: {
            location: booking.location,
            startTime: booking.start_time,
            endTime: booking.end_time,
          }
        });
      });

      // Add access logs to timeline
      logsData.forEach(log => {
        const isCalendlyEvent = log.access_code.startsWith('calendly_');
        const eventType = isCalendlyEvent 
          ? log.access_code.replace('calendly_', '').replace('invitee.', '').replace('_', ' ')
          : 'page access';
        
        activities.push({
          id: `access-${log.id}`,
          type: isCalendlyEvent ? 'booking' : 'access',
          title: isCalendlyEvent ? `Calendly: ${eventType}` : 'Code Access',
          description: log.ip_address || 'Unknown location',
          timestamp: log.accessed_at,
          metadata: {
            userAgent: log.user_agent,
            isMasterCode: log.is_master_code,
          }
        });
      });

      // Add page views to timeline
      pageViewsData.forEach(pv => {
        const isPageView = pv.activity_type === 'page_view';
        activities.push({
          id: `pv-${pv.id}`,
          type: isPageView ? 'page_view' : 'interaction',
          title: isPageView 
            ? `Viewed: ${pv.page_title || pv.page_path}` 
            : `${pv.activity_type.replace('_', ' ')}: ${pv.page_title || pv.page_path}`,
          description: pv.referrer ? `From: ${pv.referrer}` : pv.page_path,
          timestamp: pv.created_at,
          metadata: pv.metadata as Record<string, unknown> || {},
        });
      });

      // Sort by timestamp descending
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivityTimeline(activities);

    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Scheduled
          </Badge>
        );
      case 'canceled':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Canceled
          </Badge>
        );
      case 'no_show':
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            No Show
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            {status}
          </Badge>
        );
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'access':
        return <Globe className="h-4 w-4 text-green-500" />;
      case 'page_view':
        return <Eye className="h-4 w-4 text-indigo-500" />;
      case 'interaction':
        return <MousePointerClick className="h-4 w-4 text-orange-500" />;
      case 'profile_update':
        return <User className="h-4 w-4 text-purple-500" />;
      case 'verification':
        return <CheckCircle2 className="h-4 w-4 text-teal-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">{investorName}</h3>
          <p className="text-sm text-muted-foreground">{investorEmail}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchActivityData}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-500">{bookings.length}</p>
            <p className="text-xs text-muted-foreground">Bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-500">{accessLogs.length}</p>
            <p className="text-xs text-muted-foreground">Code Uses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-indigo-500">
              {pageViews.filter(pv => pv.activity_type === 'page_view').length}
            </p>
            <p className="text-xs text-muted-foreground">Page Views</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-orange-500">
              {pageViews.filter(pv => pv.activity_type !== 'page_view').length}
            </p>
            <p className="text-xs text-muted-foreground">Interactions</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="access">Access</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {activityTimeline.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No activity recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activityTimeline.map((activity, index) => (
                      <div key={activity.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="p-2 rounded-full bg-muted">
                            {getActivityIcon(activity.type)}
                          </div>
                          {index < activityTimeline.length - 1 && (
                            <div className="w-px h-full bg-border flex-1 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">{activity.title}</p>
                            {activity.status && getBookingStatusBadge(activity.status)}
                            {activity.metadata?.isMasterCode && (
                              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500">
                                Master
                              </Badge>
                            )}
                            {activity.metadata?.is_master && (
                              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500">
                                Master
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {activity.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')} · {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Page Views & Interactions</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {pageViews.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No page views recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pageViews.map((pv) => (
                      <div 
                        key={pv.id} 
                        className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {pv.activity_type === 'page_view' ? (
                                <Eye className="h-4 w-4 text-indigo-500" />
                              ) : pv.activity_type === 'button_click' ? (
                                <MousePointerClick className="h-4 w-4 text-orange-500" />
                              ) : pv.activity_type === 'document_view' ? (
                                <FileText className="h-4 w-4 text-blue-500" />
                              ) : (
                                <Globe className="h-4 w-4 text-muted-foreground" />
                              )}
                              <p className="font-medium text-sm">
                                {pv.page_title || pv.page_path}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {pv.activity_type.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {pv.page_path}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(new Date(pv.created_at), 'MMM d, yyyy h:mm a')} · {formatDistanceToNow(new Date(pv.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Booking History</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {bookings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No bookings found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((booking) => (
                      <div 
                        key={booking.id} 
                        className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm">
                                {booking.event_name || 'Meeting'}
                              </p>
                              {getBookingStatusBadge(booking.status)}
                            </div>
                            {booking.start_time && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {format(new Date(booking.start_time), 'MMM d, yyyy h:mm a')}
                              </div>
                            )}
                            {booking.location && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {booking.location.includes('http') ? (
                                  <a 
                                    href={booking.location} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline flex items-center gap-1"
                                  >
                                    Join Link <ExternalLink className="h-3 w-3" />
                                  </a>
                                ) : (
                                  booking.location
                                )}
                              </div>
                            )}
                            {booking.cancellation_reason && (
                              <p className="text-xs text-red-500 mt-1">
                                Reason: {booking.cancellation_reason}
                              </p>
                            )}
                          </div>
                          <Video className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Access Code Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {accessLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No access logs found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {accessLogs.map((log) => {
                      const isCalendlyEvent = log.access_code.startsWith('calendly_');
                      return (
                        <div 
                          key={log.id} 
                          className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {isCalendlyEvent ? (
                                  <Calendar className="h-4 w-4 text-blue-500" />
                                ) : (
                                  <Globe className="h-4 w-4 text-green-500" />
                                )}
                                <p className="font-medium text-sm">
                                  {isCalendlyEvent 
                                    ? log.access_code.replace('calendly_', '').replace('invitee.', '')
                                    : 'Portal Access'
                                  }
                                </p>
                                {log.is_master_code && (
                                  <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500">
                                    Master
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {log.ip_address || 'Unknown IP'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {format(new Date(log.accessed_at), 'MMM d, yyyy h:mm a')} · {formatDistanceToNow(new Date(log.accessed_at), { addSuffix: true })}
                              </p>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
