import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Search, Eye, Edit, FileSearch, Download, Filter, RefreshCw, Shield } from 'lucide-react';
import { format } from 'date-fns';

const ACTIVITY_TYPE_CONFIG: Record<string, { label: string; icon: typeof Eye; color: string }> = {
  page_view: { label: 'Page View', icon: Eye, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  record_change: { label: 'Record Change', icon: Edit, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  search: { label: 'Search', icon: FileSearch, color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  export_request: { label: 'Export Request', icon: Download, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  filter_change: { label: 'Filter Change', icon: Filter, color: 'bg-muted text-muted-foreground border-border' },
  bulk_action: { label: 'Bulk Action', icon: Activity, color: 'bg-red-500/10 text-red-600 border-red-500/20' },
};

export default function UserActivityAdmin() {
  const { isSuperAdmin } = usePermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');

  const { data: activities, isLoading, refetch } = useQuery({
    queryKey: ['admin-page-views', activityFilter, userFilter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('admin_page_views')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (activityFilter !== 'all') {
        query = query.eq('activity_type', activityFilter);
      }
      if (userFilter !== 'all') {
        query = query.eq('user_email', userFilter);
      }
      if (searchQuery.trim()) {
        query = query.or(`page_title.ilike.%${searchQuery}%,page_path.ilike.%${searchQuery}%,user_email.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Get unique users for the filter
  const uniqueUsers = Array.from(new Set(activities?.map((a) => a.user_email) || []));

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Access Denied</h3>
          <p className="text-sm text-muted-foreground mt-1">Only Super Admins can view user activity tracking.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            User Activity Tracker
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Monitor all admin user activity across the platform</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="touch-manipulation">
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-foreground">{activities?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Total Activities</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-foreground">{uniqueUsers.length}</div>
            <div className="text-xs text-muted-foreground">Active Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-foreground">
              {activities?.filter((a) => a.activity_type === 'page_view').length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Page Views</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-foreground">
              {activities?.filter((a) => a.activity_type === 'search').length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Searches</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pages, users..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={activityFilter} onValueChange={setActivityFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Activity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activities</SelectItem>
            <SelectItem value="page_view">Page Views</SelectItem>
            <SelectItem value="record_change">Record Changes</SelectItem>
            <SelectItem value="search">Searches</SelectItem>
            <SelectItem value="export_request">Export Requests</SelectItem>
            <SelectItem value="filter_change">Filter Changes</SelectItem>
            <SelectItem value="bulk_action">Bulk Actions</SelectItem>
          </SelectContent>
        </Select>
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="All users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {uniqueUsers.map((email) => (
              <SelectItem key={email} value={email}>
                {email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Activity List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Activity Feed</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[600px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !activities?.length ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No activity recorded yet</div>
            ) : (
              <div className="divide-y divide-border">
                {activities.map((activity) => {
                  const config = ACTIVITY_TYPE_CONFIG[activity.activity_type] || ACTIVITY_TYPE_CONFIG.page_view;
                  const Icon = config.icon;
                  const details = activity.details as Record<string, unknown> | null;

                  return (
                    <div key={activity.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                      <div className={`mt-0.5 p-1.5 rounded-md border ${config.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground truncate">{activity.user_email}</span>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${config.color}`}>
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {activity.page_title || activity.page_path}
                        </p>
                        {details && Object.keys(details).length > 0 && (
                          <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">
                            {JSON.stringify(details)}
                          </p>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                        {format(new Date(activity.created_at), 'MMM d, HH:mm')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
