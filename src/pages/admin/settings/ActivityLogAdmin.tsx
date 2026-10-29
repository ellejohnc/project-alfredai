import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Activity, Trash2, Edit, Plus, RefreshCw, LogIn, LogOut, Mail, Globe } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import AccessDenied from '@/components/admin/AccessDenied';
import { AdminFilterRow } from '@/components/admin/AdminFilterRow';
import { standardSortOptions } from '@/components/admin/adminFilterOptions';

interface ActivityLog {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  resource_name: string | null;
  details: Record<string, any>;
  ip_address: string | null;
  created_at: string;
}

const actionIcons: Record<string, React.ReactNode> = {
  create: <Plus className="h-4 w-4 text-green-500" />,
  update: <Edit className="h-4 w-4 text-blue-500" />,
  delete: <Trash2 className="h-4 w-4 text-red-500" />,
  invite_sent: <Mail className="h-4 w-4 text-purple-500" />,
  invite_accepted: <Mail className="h-4 w-4 text-green-500" />,
  login: <LogIn className="h-4 w-4 text-cyan-500" />,
  logout: <LogOut className="h-4 w-4 text-orange-500" />,
  password_changed: <Edit className="h-4 w-4 text-yellow-500" />,
};

const actionLabels: Record<string, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  invite_sent: 'Sent invitation to',
  invite_accepted: 'Accepted invitation',
  login: 'Logged in',
  logout: 'Logged out',
  password_changed: 'Changed password',
};

const resourceTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'session', label: 'Sessions (Login/Logout)' },
  { value: 'blog_post', label: 'Blog Posts' },
  { value: 'webinar', label: 'Webinars & Events' },
  { value: 'guide', label: 'Guides' },
  { value: 'testimonial', label: 'Testimonials' },
  { value: 'faq', label: 'FAQs' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'invitation', label: 'Invitations' },
  { value: 'user', label: 'Users' },
];

const actionTypes = [
  { value: 'all', label: 'All Actions' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'create', label: 'Created' },
  { value: 'update', label: 'Updated' },
  { value: 'delete', label: 'Deleted' },
  { value: 'invite_sent', label: 'Invite Sent' },
  { value: 'password_changed', label: 'Password Changed' },
];

const dateRanges = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
];

export default function ActivityLogAdmin() {
  const { canViewActivityLogs } = usePermissions();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters - must be declared before any early returns
  const [searchQuery, setSearchQuery] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');

  useEffect(() => {
    if (canViewActivityLogs) {
      fetchLogs();
    }
  }, [canViewActivityLogs]);

  useEffect(() => {
    applyFilters();
  }, [logs, searchQuery, resourceTypeFilter, actionFilter, dateRangeFilter]);

  // Build filter options
  const resourceTypeOptions = useMemo(() => resourceTypes.map(t => ({ value: t.value, label: t.label })), []);
  const actionTypeOptions = useMemo(() => actionTypes.map(t => ({ value: t.value, label: t.label })), []);
  const dateRangeOptions = useMemo(() => dateRanges.map(r => ({ value: r.value, label: r.label })), []);

  // Access control check - after all hooks
  if (!canViewActivityLogs) {
    return <AccessDenied message="Only admins can view activity logs." requiredRole="Admin or Super Admin" />;
  }

  const fetchLogs = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (data) {
      setLogs(data as ActivityLog[]);
    }
    setIsLoading(false);
  };

  const applyFilters = () => {
    let result = [...logs];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(log =>
        log.user_email.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.resource_type.toLowerCase().includes(q) ||
        (log.resource_name && log.resource_name.toLowerCase().includes(q))
      );
    }

    // Resource type filter
    if (resourceTypeFilter !== 'all') {
      result = result.filter(log => log.resource_type === resourceTypeFilter);
    }

    // Action filter
    if (actionFilter !== 'all') {
      result = result.filter(log => log.action === actionFilter);
    }

    // Date range filter
    if (dateRangeFilter !== 'all') {
      const now = new Date();
      let startDate: Date;
      switch (dateRangeFilter) {
        case 'today':
          startDate = startOfDay(now);
          break;
        case '7days':
          startDate = subDays(now, 7);
          break;
        case '30days':
          startDate = subDays(now, 30);
          break;
        default:
          startDate = new Date(0);
      }
      
      result = result.filter(log => new Date(log.created_at) >= startDate);
    }

    setFilteredLogs(result);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setResourceTypeFilter('all');
    setActionFilter('all');
    setDateRangeFilter('all');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasActiveFilters = !!(searchQuery || resourceTypeFilter !== 'all' || actionFilter !== 'all' || dateRangeFilter !== 'all');

  return (
    <div className="space-y-6">
      {/* Header - Unified Design */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10">
            <Activity className="h-5 w-5 text-cyan-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Activity Log</h1>
            <p className="text-sm text-muted-foreground">
              {filteredLogs.length} of {logs.length} entries
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} className="gap-1.5">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Unified Filter Row */}
      <AdminFilterRow
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by user, resource..."
        filters={[
          {
            key: 'resourceType',
            label: 'Resource Type',
            options: resourceTypeOptions,
            value: resourceTypeFilter,
            onChange: setResourceTypeFilter,
            width: 'w-[160px]',
          },
          {
            key: 'action',
            label: 'Action',
            options: actionTypeOptions,
            value: actionFilter,
            onChange: setActionFilter,
          },
          {
            key: 'dateRange',
            label: 'Date Range',
            options: dateRangeOptions,
            value: dateRangeFilter,
            onChange: setDateRangeFilter,
          },
        ]}
        sortOptions={undefined}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />

      {/* Logs List */}
      <div className="space-y-3">
        {filteredLogs.map((log) => (
          <Card key={log.id}>
            <CardContent className="flex items-start gap-4 p-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                {actionIcons[log.action] || <Activity className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">{log.user_email}</span>
                  <span className="text-muted-foreground">
                    {actionLabels[log.action] || log.action}
                  </span>
                  {log.resource_name && (
                    <Badge variant="secondary">{log.resource_name}</Badge>
                  )}
                  <Badge variant="outline">{log.resource_type}</Badge>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                  <span>
                    {format(new Date(log.created_at), 'MMM d, yyyy')} at {format(new Date(log.created_at), 'h:mm:ss a')}
                  </span>
                  {log.ip_address && (
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {log.ip_address}
                    </span>
                  )}
                </div>
                {/* Show additional details for login/logout */}
                {(log.action === 'login' || log.action === 'logout') && log.details?.user_agent && (
                  <p className="text-xs text-muted-foreground mt-1 truncate max-w-xl" title={log.details.user_agent}>
                    {log.details.user_agent}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {logs.length === 0 ? 'No activity recorded yet' : 'No matching activity found'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
