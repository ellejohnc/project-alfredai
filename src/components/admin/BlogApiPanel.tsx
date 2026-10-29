import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Copy,
  ChevronDown,
  Plug,
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Mail,
  Filter,
  X,
  Search,
  Calendar,
  Bell,
  Send,
  Save,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { formatDistanceToNow, format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

interface BlogApiLogRow {
  id: string;
  action: string;
  slug: string | null;
  status_code: number;
  success: boolean;
  error: string | null;
  payload_preview: any;
  ip: string | null;
  created_at: string;
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/blog-api`;

const SUPPORT_EMAIL = 'support@alfredai.bot';

function copy(text: string, label = 'Copied') {
  navigator.clipboard.writeText(text).then(
    () => toast.success(label),
    () => toast.error('Copy failed'),
  );
}

function StatusBadge({ ok, code }: { ok: boolean; code: number }) {
  return (
    <Badge
      variant={ok ? 'default' : 'destructive'}
      className="font-mono text-[10px] h-5"
    >
      {ok ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
      {code}
    </Badge>
  );
}

export function BlogApiPanel() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<BlogApiLogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  // Filter states
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [slugFilter, setSlugFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_api_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    setLoading(false);
    if (error) {
      toast.error(`Could not load logs: ${error.message}`);
      return;
    }
    setLogs((data ?? []) as BlogApiLogRow[]);
  };

  useEffect(() => {
    if (open) loadLogs();
  }, [open]);

  // Realtime updates
  useEffect(() => {
    if (!open) return;
    const channel = supabase
      .channel('blog_api_log_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'blog_api_log' },
        (payload) => {
          setLogs((prev) => [payload.new as BlogApiLogRow, ...prev].slice(0, 200));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [open]);

  // Derive unique actions for the select dropdown
  const availableActions = useMemo(() => {
    const actions = new Set<string>();
    logs.forEach((l) => actions.add(l.action));
    return Array.from(actions).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((row) => {
      if (statusFilter === 'success' && !row.success) return false;
      if (statusFilter === 'error' && row.success) return false;
      if (actionFilter !== 'all' && row.action !== actionFilter) return false;
      if (slugFilter.trim() && !(row.slug ?? '').toLowerCase().includes(slugFilter.trim().toLowerCase())) return false;
      if (dateFrom || dateTo) {
        const rowDate = new Date(row.created_at);
        const from = dateFrom ? startOfDay(new Date(dateFrom)) : null;
        const to = dateTo ? endOfDay(new Date(dateTo)) : null;
        if (from && rowDate < from) return false;
        if (to && rowDate > to) return false;
      }
      return true;
    });
  }, [logs, statusFilter, actionFilter, slugFilter, dateFrom, dateTo]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (actionFilter !== 'all') count++;
    if (slugFilter.trim()) count++;
    if (dateFrom || dateTo) count++;
    return count;
  }, [statusFilter, actionFilter, slugFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setStatusFilter('all');
    setActionFilter('all');
    setSlugFilter('');
    setDateFrom('');
    setDateTo('');
  };

  const runTest = async () => {
    setTesting(true);
    try {
      const res = await fetch(`${FUNCTION_URL}/posts?limit=1`, {
        method: 'GET',
        headers: { 'x-api-key': 'test-ping-no-key' },
      });
      const json = await res.json();
      if (json?.error === 'unauthorized') {
        toast.success('Endpoint reachable & auth enforced (got "unauthorized" as expected).');
      } else if (json?.success) {
        toast.success('Endpoint reachable. Test responded successfully.');
      } else {
        toast.warning(`Endpoint responded: ${JSON.stringify(json).slice(0, 120)}`);
      }
      loadLogs();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Endpoint unreachable: ${msg}`, {
        action: {
          label: 'Email support',
          onClick: () =>
            (window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
              'Blog API endpoint unreachable',
            )}&body=${encodeURIComponent(
              `URL: ${FUNCTION_URL}\nPage: ${window.location.href}\nError: ${msg}`,
            )}`),
        },
      });
    } finally {
      setTesting(false);
    }
  };

  const curlExample = `curl -X POST '${FUNCTION_URL}/posts' \\
  -H 'x-api-key: YOUR_BLOG_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{"title":"My post","content":"<p>Hello</p>","status":"draft"}'`;

  const n8nBody = `{
  "title": "{{ $json.title }}",
  "slug": "{{ $json.slug }}",
  "excerpt": "{{ $json.excerpt }}",
  "content": "{{ $json.content }}",
  "category": "{{ $json.category }}",
  "tags": {{ JSON.stringify($json.tags) }},
  "featured_image_url": "{{ $json.image_url }}",
  "status": "draft"
}`;

  return (
    <Card className="border-primary/20">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Plug className="w-4 h-4 text-primary" />
                Blog API — settings, docs & runs
              </CardTitle>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <Tabs defaultValue="docs">
              <TabsList className="w-full grid grid-cols-4 h-auto">
                <TabsTrigger value="docs" className="text-xs sm:text-sm">Setup</TabsTrigger>
                <TabsTrigger value="runs" className="text-xs sm:text-sm">
                  <Activity className="w-3 h-3 mr-1" /> Runs
                </TabsTrigger>
                <TabsTrigger value="alerts" className="text-xs sm:text-sm">
                  <Bell className="w-3 h-3 mr-1" /> Alerts
                </TabsTrigger>
                <TabsTrigger value="test" className="text-xs sm:text-sm">Test</TabsTrigger>
              </TabsList>

              {/* DOCS */}
              <TabsContent value="docs" className="space-y-4 mt-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Endpoint URL
                  </label>
                  <div className="flex gap-2 mt-1">
                    <code className="flex-1 px-3 py-2 text-xs bg-muted rounded font-mono break-all min-h-[40px] flex items-center">
                      {FUNCTION_URL}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copy(FUNCTION_URL, 'Endpoint copied')}
                      className="min-h-[44px] min-w-[44px]"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Header (required on every call)
                  </label>
                  <code className="block mt-1 px-3 py-2 text-xs bg-muted rounded font-mono">
                    x-api-key: YOUR_BLOG_API_KEY
                  </code>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    The key is stored as a secret in Cloud. To rotate, open Cloud → Secrets → BLOG_API_KEY.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="font-semibold text-sm">Endpoints</div>
                  <div className="rounded border divide-y text-xs">
                    <div className="p-2 flex flex-col sm:flex-row sm:items-center gap-2">
                      <Badge className="font-mono w-fit">POST</Badge>
                      <code className="font-mono">/images</code>
                      <span className="text-muted-foreground">
                        Body: <code>{`{ filename, contentType, contentBase64 }`}</code> → returns <code>url</code>
                      </span>
                    </div>
                    <div className="p-2 flex flex-col sm:flex-row sm:items-center gap-2">
                      <Badge className="font-mono w-fit">POST</Badge>
                      <code className="font-mono">/posts</code>
                      <span className="text-muted-foreground">
                        Upsert by slug. Fields: title*, slug, excerpt, content, category, tags[], featured_image_url, status
                      </span>
                    </div>
                    <div className="p-2 flex flex-col sm:flex-row sm:items-center gap-2">
                      <Badge variant="secondary" className="font-mono w-fit">GET</Badge>
                      <code className="font-mono">/posts?limit=20</code>
                      <span className="text-muted-foreground">List recent posts (debug)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-muted-foreground">
                      curl example
                    </label>
                    <Button size="sm" variant="ghost" onClick={() => copy(curlExample)}>
                      <Copy className="w-3 h-3 mr-1" /> Copy
                    </Button>
                  </div>
                  <pre className="mt-1 p-3 text-[11px] bg-muted rounded font-mono overflow-x-auto whitespace-pre">
{curlExample}
                  </pre>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Integration example — HTTP Request body (for /posts)
                    </label>
                    <Button size="sm" variant="ghost" onClick={() => copy(n8nBody)}>
                      <Copy className="w-3 h-3 mr-1" /> Copy
                    </Button>
                  </div>
                  <pre className="mt-1 p-3 text-[11px] bg-muted rounded font-mono overflow-x-auto whitespace-pre">
{n8nBody}
                  </pre>
                </div>
              </TabsContent>

              {/* RUNS */}
              <TabsContent value="runs" className="mt-4 space-y-3">
                {/* Filter bar */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {filteredLogs.length} of {logs.length} calls
                    {logs.length >= 200 && ' (loaded 200 most recent)'}
                  </div>
                  <div className="flex items-center gap-2">
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant={filterOpen ? 'default' : 'outline'}
                      onClick={() => setFilterOpen((v) => !v)}
                      className="min-h-[36px] text-xs"
                    >
                      <Filter className="w-3 h-3 mr-1" />
                      Filter
                      {activeFilterCount > 0 && ` (${activeFilterCount})`}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={loadLogs}
                      disabled={loading}
                      className="min-h-[36px]"
                    >
                      <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </div>

                {/* Collapsible filters */}
                <Collapsible open={filterOpen} onOpenChange={setFilterOpen}>
                  <CollapsibleContent>
                    <div className="border rounded-lg p-3 space-y-3 bg-muted/20">
                      {/* Status + Action row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                            Status
                          </label>
                          <div className="flex gap-2">
                            {(['all', 'success', 'error'] as const).map((s) => (
                              <Button
                                key={s}
                                size="sm"
                                variant={statusFilter === s ? 'default' : 'outline'}
                                onClick={() => setStatusFilter(s)}
                                className="flex-1 text-xs capitalize min-h-[40px]"
                              >
                                {s === 'success' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                {s === 'error' && <XCircle className="w-3 h-3 mr-1" />}
                                {s}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                            Action
                          </label>
                          <Select value={actionFilter} onValueChange={setActionFilter}>
                            <SelectTrigger className="min-h-[40px] text-xs">
                              <SelectValue placeholder="All actions" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All actions</SelectItem>
                              {availableActions.map((a) => (
                                <SelectItem key={a} value={a}>
                                  {a}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Date range row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> From
                          </label>
                          <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="min-h-[40px] text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> To
                          </label>
                          <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="min-h-[40px] text-xs"
                          />
                        </div>
                      </div>

                      {/* Slug search */}
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground mb-1 block flex items-center gap-1">
                          <Search className="w-3 h-3" /> Slug contains
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="e.g. my-blog-post"
                            value={slugFilter}
                            onChange={(e) => setSlugFilter(e.target.value)}
                            className="flex-1 min-h-[40px] text-xs"
                          />
                          {slugFilter && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSlugFilter('')}
                              className="min-h-[40px] min-w-[40px] px-2"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {activeFilterCount > 0 && (
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={clearFilters}
                            className="text-xs text-muted-foreground"
                          >
                            <X className="w-3 h-3 mr-1" /> Clear all filters
                          </Button>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Log list */}
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    {logs.length === 0
                      ? 'No API calls yet. Trigger your integration to see runs appear here.'
                      : 'No runs match the current filters.'}
                  </div>
                ) : (
                  <div className="border rounded divide-y max-h-[420px] overflow-y-auto">
                    {filteredLogs.map((row) => (
                      <div key={row.id} className="p-2 text-xs space-y-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <StatusBadge ok={row.success} code={row.status_code} />
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {row.action}
                            </Badge>
                            {row.slug && (
                              <code className="text-[10px] text-muted-foreground">
                                {row.slug}
                              </code>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        {row.error && (
                          <div className="flex items-start justify-between gap-2 bg-destructive/5 text-destructive px-2 py-1 rounded">
                            <span className="break-all">{row.error}</span>
                            <a
                              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                                `Blog API error: ${row.action}`,
                              )}&body=${encodeURIComponent(
                                `Page: ${window.location.href}\nWhen: ${row.created_at}\nAction: ${row.action}\nSlug: ${row.slug ?? ''}\nStatus: ${row.status_code}\nError: ${row.error}\nPayload: ${JSON.stringify(row.payload_preview ?? {}).slice(0, 500)}`,
                              )}`}
                              className="shrink-0 inline-flex items-center gap-1 text-[10px] underline"
                            >
                              <Mail className="w-3 h-3" /> Email
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ALERTS */}
              <TabsContent value="alerts" className="mt-4">
                <BlogApiAlertsTab />
              </TabsContent>

              {/* TEST */}
              <TabsContent value="test" className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Verify that your integration can reach the endpoint. This sends a request
                  without a valid key; a healthy endpoint should respond with{' '}
                  <code className="text-xs">unauthorized</code>.
                </p>
                <Button onClick={runTest} disabled={testing} className="w-full sm:w-auto min-h-[44px]">
                  {testing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Testing…
                    </>
                  ) : (
                    <>
                      <Plug className="w-4 h-4 mr-2" /> Ping blog-api
                    </>
                  )}
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  Need help? <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Blog API help')}&body=${encodeURIComponent(`Page: ${window.location.href}`)}`} className="underline">Email support</a> — we'll include the page URL automatically.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// =============================================================================
// Alerts Tab — configurable rules + incident grouping + sent history
// =============================================================================

interface BlogApiAlertRow {
  id: string;
  sent_at: string;
  recipient: string;
  error_count: number;
  window_minutes: number;
  threshold: number;
  status: string;
  error_message: string | null;
}

interface AlertConfig {
  recipient: string;
  threshold: number;
  window_minutes: number;
  cooldown_minutes: number;
  enabled: boolean;
}

interface LogErrorRow {
  id: string;
  action: string;
  slug: string | null;
  error: string | null;
  status_code: number;
  created_at: string;
}

interface Incident {
  id: string;
  start: string;
  end: string;
  count: number;
  samples: LogErrorRow[];
  actions: string[];
}

const DEFAULT_CONFIG: AlertConfig = {
  recipient: 'elle.c@alfredai.bot',
  threshold: 5,
  window_minutes: 10,
  cooldown_minutes: 60,
  enabled: true,
};

function BlogApiAlertsTab() {
  const [alerts, setAlerts] = useState<BlogApiAlertRow[]>([]);
  const [errors, setErrors] = useState<LogErrorRow[]>([]);
  const [config, setConfig] = useState<AlertConfig>(DEFAULT_CONFIG);
  const [draft, setDraft] = useState<AlertConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingForce, setSendingForce] = useState(false);

  const loadConfig = async () => {
    const { data, error } = await supabase
      .from('blog_api_alert_config')
      .select('recipient, threshold, window_minutes, cooldown_minutes, enabled')
      .eq('id', 1)
      .maybeSingle();
    if (error) {
      toast.error(`Could not load alert config: ${error.message}`);
      return;
    }
    const cfg = (data ?? DEFAULT_CONFIG) as AlertConfig;
    setConfig(cfg);
    setDraft(cfg);
  };

  const loadAlerts = async () => {
    const { data, error } = await supabase
      .from('blog_api_alerts')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(50);
    if (error) {
      toast.error(`Could not load alerts: ${error.message}`);
      return;
    }
    setAlerts((data ?? []) as BlogApiAlertRow[]);
  };

  const loadErrors = async () => {
    const { data, error } = await supabase
      .from('blog_api_log')
      .select('id, action, slug, error, status_code, created_at')
      .eq('success', false)
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) {
      toast.error(`Could not load errors: ${error.message}`);
      return;
    }
    setErrors((data ?? []) as LogErrorRow[]);
  };

  const refresh = async () => {
    setLoading(true);
    await Promise.all([loadConfig(), loadAlerts(), loadErrors()]);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // Realtime updates for new errors/alerts
    const ch = supabase
      .channel('blog-api-alerts-tab')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'blog_api_log' }, () => loadErrors())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'blog_api_alerts' }, () => loadAlerts())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Group errors into incidents: consecutive failures with gaps <= window_minutes
  const incidents = useMemo<Incident[]>(() => {
    if (errors.length === 0) return [];
    const gapMs = config.window_minutes * 60 * 1000;
    // errors are DESC; iterate ASC for easier grouping
    const asc = [...errors].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    const groups: LogErrorRow[][] = [];
    let current: LogErrorRow[] = [];
    let lastTs = 0;
    for (const row of asc) {
      const ts = new Date(row.created_at).getTime();
      if (current.length === 0 || ts - lastTs <= gapMs) {
        current.push(row);
      } else {
        groups.push(current);
        current = [row];
      }
      lastTs = ts;
    }
    if (current.length) groups.push(current);
    // Only surface groups that crossed the threshold
    return groups
      .filter((g) => g.length >= config.threshold)
      .map<Incident>((g) => ({
        id: g[0].id,
        start: g[0].created_at,
        end: g[g.length - 1].created_at,
        count: g.length,
        samples: g.slice(0, 5),
        actions: Array.from(new Set(g.map((r) => r.action))),
      }))
      .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
  }, [errors, config.window_minutes, config.threshold]);

  const dirty =
    draft.recipient !== config.recipient ||
    draft.threshold !== config.threshold ||
    draft.window_minutes !== config.window_minutes ||
    draft.cooldown_minutes !== config.cooldown_minutes ||
    draft.enabled !== config.enabled;

  const saveConfig = async () => {
    if (!/.+@.+\..+/.test(draft.recipient)) {
      toast.error('Please enter a valid recipient email.');
      return;
    }
    if (draft.threshold < 1 || draft.window_minutes < 1 || draft.cooldown_minutes < 0) {
      toast.error('Threshold and window must be ≥ 1; cooldown ≥ 0.');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('blog_api_alert_config')
      .update({
        recipient: draft.recipient.trim(),
        threshold: draft.threshold,
        window_minutes: draft.window_minutes,
        cooldown_minutes: draft.cooldown_minutes,
        enabled: draft.enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);
    setSaving(false);
    if (error) {
      toast.error(`Could not save: ${error.message}`, {
        action: {
          label: 'Email support',
          onClick: () =>
            (window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
              'Blog API alert config save failed',
            )}&body=${encodeURIComponent(
              `Page: ${window.location.href}\nError: ${error.message}`,
            )}`),
        },
      });
      return;
    }
    toast.success('Alert rule saved.');
    setConfig(draft);
  };

  const invoke = async (body: Record<string, unknown>): Promise<any> => {
    const { data, error } = await supabase.functions.invoke('blog-api-alert', { body });
    if (error) throw error;
    return data;
  };

  const sendTest = async () => {
    setSendingTest(true);
    try {
      const data = await invoke({ test: true });
      if (data?.success && data?.sent) {
        toast.success(`Test alert sent to ${data.recipient}`);
        loadAlerts();
      } else {
        toast.error(data?.error || 'Test send failed');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Test send failed: ${msg}`);
    } finally {
      setSendingTest(false);
    }
  };

  const sendForce = async () => {
    setSendingForce(true);
    try {
      const data = await invoke({ force: true });
      if (data?.success && data?.sent) {
        toast.success(`Alert sent to ${data.recipient} (${data.error_count} errors).`);
        loadAlerts();
      } else if (data?.success && !data?.sent) {
        toast.info('No recent failures to alert on.');
      } else {
        toast.error(data?.error || 'Could not send alert');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Send failed: ${msg}`);
    } finally {
      setSendingForce(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Configurable rule */}
      <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Settings className="w-4 h-4 text-primary" /> Alert rule
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="alert-enabled" className="text-xs text-muted-foreground">
              {draft.enabled ? 'Enabled' : 'Disabled'}
            </Label>
            <Switch
              id="alert-enabled"
              checked={draft.enabled}
              onCheckedChange={(v) => setDraft((d) => ({ ...d, enabled: v }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="alert-recipient" className="text-xs">
              Recipient email
            </Label>
            <Input
              id="alert-recipient"
              type="email"
              value={draft.recipient}
              onChange={(e) => setDraft((d) => ({ ...d, recipient: e.target.value }))}
              className="min-h-[44px] text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="alert-threshold" className="text-xs">
              Error threshold (failures)
            </Label>
            <Input
              id="alert-threshold"
              type="number"
              min={1}
              value={draft.threshold}
              onChange={(e) =>
                setDraft((d) => ({ ...d, threshold: Math.max(1, Number(e.target.value) || 1) }))
              }
              className="min-h-[44px] text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="alert-window" className="text-xs">
              Time window (minutes)
            </Label>
            <Input
              id="alert-window"
              type="number"
              min={1}
              value={draft.window_minutes}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  window_minutes: Math.max(1, Number(e.target.value) || 1),
                }))
              }
              className="min-h-[44px] text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="alert-cooldown" className="text-xs">
              Cooldown (minutes)
            </Label>
            <Input
              id="alert-cooldown"
              type="number"
              min={0}
              value={draft.cooldown_minutes}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  cooldown_minutes: Math.max(0, Number(e.target.value) || 0),
                }))
              }
              className="min-h-[44px] text-sm"
            />
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Email <code className="text-foreground">{draft.recipient || '—'}</code> when{' '}
          <strong className="text-foreground">{draft.threshold}+ failures</strong> occur within{' '}
          <strong className="text-foreground">{draft.window_minutes} min</strong>. Max one alert per{' '}
          <strong className="text-foreground">{draft.cooldown_minutes} min</strong>.
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            size="sm"
            onClick={saveConfig}
            disabled={!dirty || saving}
            className="min-h-[40px] text-xs"
          >
            {saving ? (
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Save className="w-3 h-3 mr-1" />
            )}
            Save rule
          </Button>
          {dirty && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDraft(config)}
              className="min-h-[40px] text-xs"
            >
              <X className="w-3 h-3 mr-1" /> Discard
            </Button>
          )}
          <div className="grow" />
          <Button
            size="sm"
            variant="outline"
            onClick={sendTest}
            disabled={sendingTest}
            className="min-h-[40px] text-xs"
          >
            {sendingTest ? (
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Send className="w-3 h-3 mr-1" />
            )}
            Send test email
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={sendForce}
            disabled={sendingForce}
            className="min-h-[40px] text-xs"
          >
            {sendingForce ? (
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Mail className="w-3 h-3 mr-1" />
            )}
            Send now (bypass cooldown)
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={refresh}
            disabled={loading}
            className="min-h-[40px] text-xs"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Incidents */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Incidents
            <span className="text-muted-foreground/70">
              ({incidents.length} matching current rule)
            </span>
          </div>
        </div>
        {incidents.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground border rounded">
            No grouped incidents meet the {config.threshold}+ failures / {config.window_minutes} min rule.
          </div>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {incidents.map((inc) => {
              const durationMin = Math.max(
                1,
                Math.round(
                  (new Date(inc.end).getTime() - new Date(inc.start).getTime()) / 60000,
                ),
              );
              return (
                <div key={inc.id} className="border rounded p-3 space-y-2 bg-card">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="destructive" className="text-[10px] h-5">
                        <XCircle className="w-3 h-3 mr-1" />
                        {inc.count} errors
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        over {durationMin} min
                      </span>
                      {inc.actions.map((a) => (
                        <Badge key={a} variant="outline" className="text-[10px] h-5">
                          {a}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-[10px] text-muted-foreground text-right">
                      <div>Started {format(new Date(inc.start), 'MMM d, HH:mm:ss')}</div>
                      <div>Ended {format(new Date(inc.end), 'MMM d, HH:mm:ss')}</div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {inc.samples.map((s) => (
                      <div
                        key={s.id}
                        className="text-[11px] flex items-start gap-2 bg-destructive/5 text-destructive px-2 py-1 rounded"
                      >
                        <span className="font-mono shrink-0">{s.action}</span>
                        {s.slug && (
                          <span className="font-mono text-muted-foreground shrink-0">
                            /{s.slug}
                          </span>
                        )}
                        <span className="break-all">{s.error || '(no message)'}</span>
                      </div>
                    ))}
                    {inc.count > inc.samples.length && (
                      <div className="text-[10px] text-muted-foreground italic">
                        + {inc.count - inc.samples.length} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sent history */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
          <Bell className="w-3 h-3" /> Sent alert history (last 50)
        </div>
        {alerts.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground border rounded">
            No alerts have been sent yet.
          </div>
        ) : (
          <div className="border rounded divide-y max-h-[280px] overflow-y-auto">
            {alerts.map((a) => (
              <div key={a.id} className="p-2 text-xs space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={a.status === 'sent' ? 'default' : 'destructive'}
                      className="text-[10px] h-5"
                    >
                      {a.status === 'sent' ? (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      ) : (
                        <XCircle className="w-3 h-3 mr-1" />
                      )}
                      {a.status}
                    </Badge>
                    <span className="text-foreground font-medium">
                      {a.error_count} error{a.error_count === 1 ? '' : 's'}
                    </span>
                    <span className="text-muted-foreground">
                      in {a.window_minutes}m → {a.recipient}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(a.sent_at), { addSuffix: true })}
                  </span>
                </div>
                {a.error_message && (
                  <div className="bg-destructive/5 text-destructive px-2 py-1 rounded break-all">
                    {a.error_message}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

