import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail, Video, FileText, DollarSign, TrendingUp, CheckCircle2,
  ListTodo, AlertTriangle, RefreshCw, Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SUPPORT_EMAIL } from '@/lib/siteConfig';
import { roleLabels } from '@/lib/rolePermissions';

const DISTRIBUTOR_LABEL = roleLabels.distributor;

interface DistributorStats {
  assigned_leads: number;
  active_opportunities: number;
  closed_deals: number;
  personal_revenue: number;
  pipeline_value: number;
  follow_up_tasks: number;
  conversion_rate: number;
}

interface PreviewQuoteRow {
  setup_fee_final?: number | null;
  setup_fee_min?: number | null;
  setup_fee_max?: number | null;
  monthly_retainer_final?: number | null;
  monthly_retainer_min?: number | null;
  monthly_retainer_max?: number | null;
}

const EMPTY_STATS: DistributorStats = {
  assigned_leads: 0,
  active_opportunities: 0,
  closed_deals: 0,
  personal_revenue: 0,
  pipeline_value: 0,
  follow_up_tasks: 0,
  conversion_rate: 0,
};

const currency = (n: number) =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(n || 0);

export function DistributorDashboard() {
  const { user } = useAdminAuth();
  const { isViewingAs, viewAsProfile } = usePermissions();
  const [stats, setStats] = useState<DistributorStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const scopedUserId = viewAsProfile?.userId ?? user?.id ?? null;
  const scopedUserEmail = (viewAsProfile?.email ?? user?.email ?? '').trim().toLowerCase();

  const loadPreviewStats = useCallback(async () => {
    if (!scopedUserId) {
      setStats(EMPTY_STATS);
      return;
    }

    const [collabRes, leadsRes, ghlRes, quotesRes] = await Promise.all([
      supabase
        .from('record_collaborators')
        .select('entity_type, entity_id')
        .eq('user_id', scopedUserId)
        .in('entity_type', ['lead', 'ghl_submission', 'quote']),
      supabase
        .from('leads')
        .select('id, assigned_distributor_id, created_by_user_id, archived_at'),
      supabase
        .from('ghl_submissions')
        .select('id, assigned_distributor_id, created_by_user_id, ghl_status, archived_at'),
      supabase.rpc('get_distributor_quotes'),
    ]);

    if (collabRes.error) throw collabRes.error;
    if (leadsRes.error) throw leadsRes.error;
    if (ghlRes.error) throw ghlRes.error;
    if (quotesRes.error) throw quotesRes.error;

    const collaboratorIds = (entityType: string) => new Set(
      (collabRes.data || [])
        .filter((row) => row.entity_type === entityType)
        .map((row) => row.entity_id),
    );
    const leadCollaborators = collaboratorIds('lead');
    const ghlCollaborators = collaboratorIds('ghl_submission');
    const quoteCollaborators = collaboratorIds('quote');

    const isOwned = (row: { id: string; assigned_distributor_id?: string | null; created_by_user_id?: string | null; created_by?: string | null }, collabs: Set<string>) => {
      const createdBy = (row.created_by || '').trim().toLowerCase();
      return row.assigned_distributor_id === scopedUserId
        || row.created_by_user_id === scopedUserId
        || collabs.has(row.id)
        || createdBy === scopedUserId.toLowerCase()
        || (!!scopedUserEmail && createdBy === scopedUserEmail);
    };

    const ownedLeads = (leadsRes.data || []).filter((row) => !row.archived_at && isOwned(row, leadCollaborators));
    const ownedGhl = (ghlRes.data || []).filter((row) => !row.archived_at && isOwned(row, ghlCollaborators));
    const ownedQuotes = (quotesRes.data || []).filter((row) => isOwned(row, quoteCollaborators));

    const closedStatuses = new Set(['signed', 'accepted', 'won', 'paid', 'closed_won']);
    const lostStatuses = new Set(['lost', 'closed_lost', 'archived']);
    const activeQuotes = ownedQuotes.filter((q) => !closedStatuses.has((q.status || '').toLowerCase()) && !lostStatuses.has((q.status || '').toLowerCase()));
    const closedQuotes = ownedQuotes.filter((q) => closedStatuses.has((q.status || '').toLowerCase()));
    const quoteValue = (q: PreviewQuoteRow) => Number(q.setup_fee_final ?? q.setup_fee_max ?? q.setup_fee_min ?? 0) + Number(q.monthly_retainer_final ?? q.monthly_retainer_max ?? q.monthly_retainer_min ?? 0);
    const totalOpportunities = Math.max(ownedQuotes.length, 1);

    setStats({
      assigned_leads: ownedLeads.length + ownedGhl.length,
      active_opportunities: activeQuotes.length,
      closed_deals: closedQuotes.length,
      personal_revenue: closedQuotes.reduce((sum, q) => sum + quoteValue(q), 0),
      pipeline_value: activeQuotes.reduce((sum, q) => sum + quoteValue(q), 0),
      follow_up_tasks: ownedGhl.filter((g) => ['submitted', 'synced', 'booking_shown'].includes((g.ghl_status || '').toLowerCase())).length + activeQuotes.length,
      conversion_rate: ownedQuotes.length ? (closedQuotes.length / totalOpportunities) * 100 : 0,
    });
  }, [scopedUserEmail, scopedUserId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      if (isViewingAs) {
        await loadPreviewStats();
      } else {
        const { data, error: rpcError } = await supabase.rpc('get_distributor_dashboard_stats');
        if (rpcError) throw rpcError;
        const row = Array.isArray(data) ? data[0] : data;
        setStats({ ...EMPTY_STATS, ...(row || {}) });
      }
    } catch (err) {
      console.error('Failed to load distributor dashboard stats:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [isViewingAs, loadPreviewStats]);

  useEffect(() => {
    load();
  }, [load]);

  const metricCards = [
    { label: 'My Leads', value: stats.assigned_leads, icon: Mail, color: 'text-rose-500', bg: 'bg-rose-500/10', path: '/admin/leads' },
    { label: 'Active Deals', value: stats.active_opportunities, icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-500/10', path: '/admin/quotes' },
    { label: 'Closed Deals', value: stats.closed_deals, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', path: '/admin/quotes' },
    { label: 'Follow-ups', value: stats.follow_up_tasks, icon: ListTodo, color: 'text-amber-500', bg: 'bg-amber-500/10', path: '/admin/leads' },
  ];

  const moneyCards = [
    { label: 'My Revenue', value: currency(stats.personal_revenue), icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Pipeline Value', value: currency(stats.pipeline_value), icon: TrendingUp, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { label: 'Conversion', value: `${Math.round(stats.conversion_rate)}%`, icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ];

  if (error) {
    const subject = encodeURIComponent(`${DISTRIBUTOR_LABEL} Dashboard Error`);
    const body = encodeURIComponent(
      `My ${DISTRIBUTOR_LABEL} dashboard failed to load.\n\nPage: ${window.location.href}\n\n(Please attach a screenshot of this page.)`
    );
    return (
      <div className="p-6 bg-destructive/10 rounded-lg border border-destructive/30 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
        <h3 className="font-semibold text-destructive">We couldn't load your dashboard</h3>
        <p className="text-sm text-muted-foreground">
          Your data is safe — this is just a temporary loading issue. You can retry, head to your leads, or report the problem.
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          <Button onClick={load} variant="outline" size="sm" className="gap-2 min-h-[44px]">
            <RefreshCw className="w-4 h-4" /> Retry
          </Button>
          <Link to="/admin/leads">
            <Button variant="secondary" size="sm" className="gap-2 min-h-[44px]">
              <Mail className="w-4 h-4" /> Go to My Leads
            </Button>
          </Link>
          <a href={`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`}>
            <Button variant="ghost" size="sm" className="gap-2 min-h-[44px]">
              <Mail className="w-4 h-4" /> Report Issue
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Mail className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">My Pipeline</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={load}
            disabled={loading}
            className="ml-auto h-9 min-h-[44px] gap-1.5"
            aria-label="Refresh dashboard"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          </Button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {metricCards.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className="bg-card border border-border rounded-lg p-3 sm:p-4 hover:border-primary/30 hover:shadow-md transition-all group active:scale-95"
            >
              <div className={cn("p-1.5 rounded-md w-fit mb-1.5", item.bg)}>
                <item.icon className={cn("h-3.5 w-3.5", item.color)} />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-foreground">
                {loading ? '—' : item.value}
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground group-hover:text-primary transition-colors mt-0.5">
                {item.label}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <div className="p-1.5 rounded-md bg-primary/10">
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">My Performance</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          {moneyCards.map((item) => (
            <div key={item.label} className="bg-card border border-border rounded-lg p-4">
              <div className={cn("p-1.5 rounded-md w-fit mb-2", item.bg)}>
                <item.icon className={cn("h-4 w-4", item.color)} />
              </div>
              <div className="text-2xl font-bold text-foreground">{loading ? '—' : item.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link to="/admin/leads" className="flex items-center gap-3 bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-all active:scale-95 min-h-[44px]">
          <Mail className="h-5 w-5 text-primary shrink-0" />
          <span className="text-sm font-medium text-foreground">My Leads</span>
        </Link>
        <Link to="/admin/meetings" className="flex items-center gap-3 bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-all active:scale-95 min-h-[44px]">
          <Video className="h-5 w-5 text-primary shrink-0" />
          <span className="text-sm font-medium text-foreground">My Meetings</span>
        </Link>
        <Link to="/admin/quotes" className="flex items-center gap-3 bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-all active:scale-95 min-h-[44px]">
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <span className="text-sm font-medium text-foreground">My Quotes</span>
        </Link>
      </section>
    </div>
  );
}
