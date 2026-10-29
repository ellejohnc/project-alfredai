import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import {
  Mail, CheckCircle, XCircle, Clock, Eye,
  ChevronLeft, ChevronRight, AlertTriangle, MailOpen,
  BarChart3, MousePointer, Ban, Activity,
  Calendar, Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import AccessDenied from '@/components/admin/AccessDenied';
import EmailSuppressionsManager from '@/components/admin/EmailSuppressionsManager';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminMetricsStrip } from '@/components/admin/AdminMetricsStrip';
import { AdminToolbar } from '@/components/admin/AdminToolbar';
import { fetchAllRows } from '@/lib/supabasePaging';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface EmailLog {
  id: string;
  template_key: string;
  recipient_email: string;
  subject: string;
  status: 'sent' | 'failed';
  delivery_status: 'pending' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
  error_message: string | null;
  metadata: Record<string, unknown>;
  sent_at: string;
  sent_by: string | null;
  function_name: string | null;
  opened_at: string | null;
  opened_count: number;
  clicked_at: string | null;
  click_count: number;
  bounced_at: string | null;
  bounce_type: string | null;
  bounce_reason: string | null;
}

interface DeliveryStats {
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  total_failed: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
}

interface DailyStats {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  bounced: number;
  failed: number;
}

interface TemplateStats {
  template_key: string;
  total_sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
}

const PAGE_SIZE = 25;

function humanizeTemplateKey(key: string): string {
  return key
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

const CHART_COLORS = {
  sent: 'hsl(var(--primary))',
  delivered: '#10b981',
  opened: '#3b82f6',
  bounced: '#f59e0b',
  failed: '#ef4444',
};

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280'];

export default function EmailDeliveryDashboard() {
  const { canManageEmailTemplates } = usePermissions();
  const [activeTab, setActiveTab] = useState('overview');
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deliveryFilter, setDeliveryFilter] = useState<string>('all');
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [templateKeys, setTemplateKeys] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState('30');

  // Stats
  const [overviewStats, setOverviewStats] = useState<DeliveryStats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [templateStats, setTemplateStats] = useState<TemplateStats[]>([]);
  const [recentBounces, setRecentBounces] = useState<EmailLog[]>([]);
  // Exact delivery status of every email in the period. The tiles count from
  // this, not from the overview RPC, because the RPC's totals are cumulative
  // (opened includes clicked, delivered includes both) while the logs filter
  // matches one status exactly. A tile's number must be the rows it opens.
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchOverviewStats();
    fetchDailyStats();
    fetchTemplateStats();
    fetchRecentBounces();
    fetchTemplateKeys();
    fetchStatusCounts();
  }, [dateRange]);

  useEffect(() => {
    fetchLogs();
  }, [page, statusFilter, deliveryFilter, templateFilter, searchQuery, dateRange]);

  // Guard AFTER the hooks — a return above a useEffect makes that effect run on
  // some renders and not others, and React throws when the permission resolves.
  if (!canManageEmailTemplates) {
    return <AccessDenied message="Only admins can view email delivery analytics." requiredRole="Admin or Super Admin" />;
  }

  const fetchOverviewStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_email_delivery_overview', { 
        days_back: parseInt(dateRange) 
      });
      if (error) throw error;
      if (data && data.length > 0) {
        setOverviewStats(data[0] as DeliveryStats);
      }
    } catch (error) {
      console.error('Failed to fetch overview stats:', error);
    }
  };

  const fetchDailyStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_daily_email_stats', { 
        days_back: parseInt(dateRange) 
      });
      if (error) throw error;
      setDailyStats((data || []).map((d: any) => ({
        ...d,
        date: format(new Date(d.date), 'MMM d'),
      })));
    } catch (error) {
      console.error('Failed to fetch daily stats:', error);
    }
  };

  const fetchTemplateStats = async () => {
    try {
      const { data, error } = await supabase
        .from('email_delivery_stats')
        .select('*')
        .order('total_sent', { ascending: false });
      if (error) throw error;
      setTemplateStats((data || []) as TemplateStats[]);
    } catch (error) {
      console.error('Failed to fetch template stats:', error);
    }
  };

  const fetchRecentBounces = async () => {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .eq('delivery_status', 'bounced')
        .order('bounced_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      setRecentBounces((data || []) as EmailLog[]);
    } catch (error) {
      console.error('Failed to fetch recent bounces:', error);
    }
  };

  // The period chosen in the header now applies to the logs too; they used
  // to show all time while every figure above them covered the period.
  const periodStart = () => subDays(new Date(), parseInt(dateRange)).toISOString();

  const fetchStatusCounts = async () => {
    try {
      const rows = await fetchAllRows<{ delivery_status: string | null }>(
        'email_logs',
        (q) => q.gte('sent_at', periodStart()),
        'delivery_status',
        'sent_at',
      );
      const counts: Record<string, number> = {};
      rows.forEach((r) => { const k = r.delivery_status || 'pending'; counts[k] = (counts[k] || 0) + 1; });
      setStatusCounts(counts);
    } catch (error) {
      console.error('Failed to fetch status counts:', error);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('email_logs')
        .select('*', { count: 'exact' })
        .gte('sent_at', periodStart())
        .order('sent_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (deliveryFilter !== 'all') {
        query = query.eq('delivery_status', deliveryFilter);
      }

      if (templateFilter !== 'all') {
        query = query.eq('template_key', templateFilter);
      }

      if (searchQuery) {
        query = query.or(`recipient_email.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setLogs((data || []) as EmailLog[]);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Failed to fetch email logs:', error);
      toast.error('Failed to load email logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplateKeys = async () => {
    try {
      // Paged: a plain select stops at 1,000 rows, and the log is past 900.
      const data = await fetchAllRows<{ template_key: string }>('email_logs', (q) => q, 'template_key', 'sent_at');
      const uniqueKeys = [...new Set(data.map(d => d.template_key))].sort();
      setTemplateKeys(uniqueKeys);
    } catch (error) {
      console.error('Failed to fetch template keys:', error);
    }
  };

  const handleRefresh = () => {
    setPage(0);
    fetchOverviewStats();
    fetchDailyStats();
    fetchTemplateStats();
    fetchRecentBounces();
    fetchStatusCounts();
    fetchLogs();
    toast.success('Dashboard refreshed');
  };

  const getDeliveryStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><CheckCircle className="h-3 w-3 mr-1" />Delivered</Badge>;
      case 'opened':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20"><MailOpen className="h-3 w-3 mr-1" />Opened</Badge>;
      case 'clicked':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20"><MousePointer className="h-3 w-3 mr-1" />Clicked</Badge>;
      case 'bounced':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20"><Ban className="h-3 w-3 mr-1" />Bounced</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline" className="bg-muted text-muted-foreground"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const pieData = overviewStats ? [
    { name: 'Delivered', value: overviewStats.total_delivered - overviewStats.total_opened },
    { name: 'Opened', value: overviewStats.total_opened - overviewStats.total_clicked },
    { name: 'Clicked', value: overviewStats.total_clicked },
    { name: 'Bounced', value: overviewStats.total_bounced },
    { name: 'Failed', value: overviewStats.total_failed },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-6">
      {/* Band 1 — title. The period applies to the whole page. */}
      <AdminPageHeader
        title="Email Delivery Dashboard"
        description="Monitor delivery status, open rates and bounce tracking"
        icon={<Mail className="h-4 w-4" />}
        onRefresh={handleRefresh}
        isLoading={loading}
        actions={
          <Select value={dateRange} onValueChange={(v) => { setDateRange(v); setPage(0); }}>
            <SelectTrigger className="h-9 w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Band 2 — tiles. Each opens All Logs filtered to that exact status.
          The rates live in the Overview tab's charts; a percentage cannot be
          clicked through to rows. */}
      <AdminMetricsStrip
        metrics={[
          { key: 'all', label: 'All sent' },
          { key: 'pending', label: 'Pending, no delivery event' },
          { key: 'delivered', label: 'Delivered' },
          { key: 'opened', label: 'Opened' },
          { key: 'clicked', label: 'Clicked' },
          { key: 'bounced', label: 'Bounced' },
          { key: 'failed', label: 'Failed' },
        ].map(({ key, label }) => {
          const value = key === 'all' ? Object.values(statusCounts).reduce((a, b) => a + b, 0) : (statusCounts[key] || 0);
          return {
            label,
            value,
            tone: (key === 'bounced' || key === 'failed' || key === 'pending') && value > 0 ? 'warn' as const : 'default' as const,
            active: activeTab === 'logs' && deliveryFilter === key,
            onClick: () => { setDeliveryFilter(key); setPage(0); setActiveTab('logs'); },
          };
        })}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">
            <Activity className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="templates">
            <BarChart3 className="h-4 w-4 mr-2" />
            By Template
          </TabsTrigger>
          <TabsTrigger value="bounces">
            <Ban className="h-4 w-4 mr-2" />
            Bounces
          </TabsTrigger>
          <TabsTrigger value="suppressions">
            <Shield className="h-4 w-4 mr-2" />
            Suppressions
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Mail className="h-4 w-4 mr-2" />
            All Logs
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Trend Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Email Volume Trend</CardTitle>
                <CardDescription>Daily email delivery performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Area type="monotone" dataKey="sent" stackId="1" stroke={CHART_COLORS.sent} fill={CHART_COLORS.sent} fillOpacity={0.3} name="Sent" />
                      <Area type="monotone" dataKey="delivered" stackId="2" stroke={CHART_COLORS.delivered} fill={CHART_COLORS.delivered} fillOpacity={0.3} name="Delivered" />
                      <Area type="monotone" dataKey="opened" stackId="3" stroke={CHART_COLORS.opened} fill={CHART_COLORS.opened} fillOpacity={0.3} name="Opened" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Delivery Distribution</CardTitle>
                <CardDescription>Email status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance by Template</CardTitle>
              <CardDescription>Delivery metrics for each email template</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template</TableHead>
                      <TableHead className="text-right">Sent</TableHead>
                      <TableHead className="text-right">Delivered</TableHead>
                      <TableHead className="text-right">Opened</TableHead>
                      <TableHead className="text-right">Clicked</TableHead>
                      <TableHead className="text-right">Bounced</TableHead>
                      <TableHead className="text-right">Delivery %</TableHead>
                      <TableHead className="text-right">Open %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templateStats.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                          No template data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      templateStats.map((stat) => (
                        <TableRow key={stat.template_key}>
                          <TableCell>
                            <Badge variant="secondary">{humanizeTemplateKey(stat.template_key)}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{stat.total_sent}</TableCell>
                          <TableCell className="text-right text-emerald-600">{stat.delivered}</TableCell>
                          <TableCell className="text-right text-blue-600">{stat.opened}</TableCell>
                          <TableCell className="text-right text-purple-600">{stat.clicked}</TableCell>
                          <TableCell className="text-right text-amber-600">{stat.bounced}</TableCell>
                          <TableCell className="text-right">
                            <span className={stat.delivery_rate >= 95 ? 'text-emerald-600' : stat.delivery_rate >= 80 ? 'text-amber-600' : 'text-destructive'}>
                              {stat.delivery_rate}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={stat.open_rate >= 30 ? 'text-emerald-600' : stat.open_rate >= 15 ? 'text-amber-600' : 'text-muted-foreground'}>
                              {stat.open_rate}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bounces Tab */}
        <TabsContent value="bounces" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Ban className="h-5 w-5 text-amber-500" />
                Recent Bounces
              </CardTitle>
              <CardDescription>Track bounced emails and identify issues</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Bounce Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentBounces.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <CheckCircle className="h-8 w-8 text-emerald-500" />
                            <p>No bounced emails - great job!</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentBounces.map((bounce) => (
                        <TableRow key={bounce.id}>
                          <TableCell className="font-medium">{bounce.recipient_email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{humanizeTemplateKey(bounce.template_key)}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={bounce.bounce_type === 'hard' ? 'destructive' : 'outline'}>
                              {bounce.bounce_type || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">
                            {bounce.bounce_reason || 'No reason provided'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {bounce.bounced_at ? format(new Date(bounce.bounced_at), 'MMM d, h:mm a') : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suppressions Tab. The trigger was there and the manager was imported,
            but no content was ever rendered for it, so the tab opened blank. */}
        <TabsContent value="suppressions" className="space-y-6">
          <EmailSuppressionsManager />
        </TabsContent>

        {/* All Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          {/* Band 3 — the shared toolbar: Search · Status, then Template. */}
          <AdminToolbar
            searchQuery={searchQuery}
            onSearchChange={(v) => { setSearchQuery(v); setPage(0); }}
            searchPlaceholder="Search by email or subject..."
            resultCount={totalCount}
            resultNoun="emails"
            filters={[
              {
                key: 'delivery',
                label: 'Status',
                value: deliveryFilter,
                onChange: (v) => { setDeliveryFilter(v); setPage(0); },
                options: [
                  { value: 'all', label: 'All statuses' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'delivered', label: 'Delivered' },
                  { value: 'opened', label: 'Opened' },
                  { value: 'clicked', label: 'Clicked' },
                  { value: 'bounced', label: 'Bounced' },
                  { value: 'failed', label: 'Failed' },
                ],
              },
              {
                key: 'template',
                label: 'Template',
                value: templateFilter,
                onChange: (v) => { setTemplateFilter(v); setPage(0); },
                options: [
                  { value: 'all', label: 'All templates' },
                  ...templateKeys.map((key) => ({ value: key, label: humanizeTemplateKey(key) })),
                ],
              },
            ]}
            onClearAll={() => { setSearchQuery(''); setDeliveryFilter('all'); setTemplateFilter('all'); setPage(0); }}
          />

          {/* Logs Table */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Opens</TableHead>
                      <TableHead>Sent At</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                      ))
                    ) : logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <MailOpen className="h-8 w-8" />
                            <p>No email logs found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedLog(log)}>
                          <TableCell>{getDeliveryStatusBadge(log.delivery_status)}</TableCell>
                          <TableCell className="font-medium">{log.recipient_email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-normal">
                              {humanizeTemplateKey(log.template_key)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{log.subject}</TableCell>
                          <TableCell>
                            {log.opened_count > 0 ? (
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
                                {log.opened_count}x
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(log.sent_at), 'MMM d, yyyy h:mm a')}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t p-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {page + 1} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && getDeliveryStatusBadge(selectedLog.delivery_status)}
              Email Details
            </DialogTitle>
            <DialogDescription>
              {selectedLog && format(new Date(selectedLog.sent_at), 'PPpp')}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Recipient</p>
                  <p className="font-medium">{selectedLog.recipient_email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Template</p>
                  <Badge variant="secondary">{humanizeTemplateKey(selectedLog.template_key)}</Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Subject</p>
                <p className="font-medium">{selectedLog.subject}</p>
              </div>
              
              {/* Engagement Stats */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Opens</p>
                  <p className="font-medium">{selectedLog.opened_count || 0} times</p>
                  {selectedLog.opened_at && (
                    <p className="text-xs text-muted-foreground">First: {format(new Date(selectedLog.opened_at), 'MMM d, h:mm a')}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Clicks</p>
                  <p className="font-medium">{selectedLog.click_count || 0} times</p>
                  {selectedLog.clicked_at && (
                    <p className="text-xs text-muted-foreground">First: {format(new Date(selectedLog.clicked_at), 'MMM d, h:mm a')}</p>
                  )}
                </div>
              </div>

              {selectedLog.function_name && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Function</p>
                  <code className="text-sm bg-muted px-2 py-1 rounded">{selectedLog.function_name}</code>
                </div>
              )}
              
              {selectedLog.bounce_type && (
                <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <div className="flex items-center gap-2 text-amber-600 mb-1">
                    <Ban className="h-4 w-4" />
                    <p className="text-sm font-medium">Bounce - {selectedLog.bounce_type}</p>
                  </div>
                  <p className="text-sm text-amber-600/80">{selectedLog.bounce_reason || 'No reason provided'}</p>
                </div>
              )}

              {selectedLog.error_message && (
                <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <div className="flex items-center gap-2 text-destructive mb-1">
                    <AlertTriangle className="h-4 w-4" />
                    <p className="text-sm font-medium">Error</p>
                  </div>
                  <p className="text-sm text-destructive/80">{selectedLog.error_message}</p>
                </div>
              )}
              
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Metadata</p>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-[200px]">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
