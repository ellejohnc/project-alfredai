import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  RefreshCw,
  Plus,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointerClick,
  Target,
  Trash2,
  ExternalLink,
  AlertCircle,
  Mail,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, subDays, parseISO } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Category = "branded" | "category" | "competitor" | "long_tail";

interface TrackedKeyword {
  id: string;
  keyword: string;
  category: Category;
  target_landing_path: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

interface Snapshot {
  keyword_id: string;
  metric_date: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number | null;
  conversions: number;
  top_landing_path: string | null;
}

const CATEGORY_LABELS: Record<Category, string> = {
  branded: "Branded",
  category: "Category",
  competitor: "Competitor",
  long_tail: "Long-tail",
};

const CATEGORY_COLORS: Record<Category, string> = {
  branded: "bg-primary text-primary-foreground",
  category: "bg-blue-500 text-white",
  competitor: "bg-amber-500 text-white",
  long_tail: "bg-purple-500 text-white",
};

function Sparkline({ values, max }: { values: number[]; max: number }) {
  if (values.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
  const w = 80;
  const h = 24;
  const step = values.length > 1 ? w / (values.length - 1) : 0;
  const points = values
    .map((v, i) => `${i * step},${h - (max > 0 ? (v / max) * h : 0)}`)
    .join(" ");
  return (
    <svg width={w} height={h} className="text-primary">
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={points} />
    </svg>
  );
}

export default function KeywordTrackingAdmin() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<"all" | Category>("all");
  const [newKeyword, setNewKeyword] = useState({
    keyword: "",
    category: "category" as Category,
    target_landing_path: "",
    notes: "",
  });

  const { data: keywords, isLoading: kwLoading } = useQuery({
    queryKey: ["tracked-keywords"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracked_keywords")
        .select("*")
        .order("category", { ascending: true })
        .order("keyword", { ascending: true });
      if (error) throw error;
      return data as TrackedKeyword[];
    },
  });

  const { data: snapshots, isLoading: snLoading } = useQuery({
    queryKey: ["keyword-snapshots-30d"],
    queryFn: async () => {
      const since = subDays(new Date(), 30).toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("keyword_metrics_snapshots")
        .select("keyword_id, metric_date, impressions, clicks, ctr, position, conversions, top_landing_path")
        .gte("metric_date", since)
        .order("metric_date", { ascending: true });
      if (error) throw error;
      return data as Snapshot[];
    },
  });

  const sync = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("sync-gsc-keywords", {
        body: { days_back: 30 },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? "Sync failed");
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Synced ${data.synced} snapshots from Google Search Console.`);
      qc.invalidateQueries({ queryKey: ["keyword-snapshots-30d"] });
    },
    onError: (e: Error) => {
      toast.error(e.message, {
        description: "Need help? Email support with this page URL.",
        action: { label: "Email", onClick: () => (window.location.href = `mailto:hello@alfredai.bot?subject=GSC Sync Failed&body=Error: ${encodeURIComponent(e.message)}%0AURL: ${encodeURIComponent(window.location.href)}`) },
      });
    },
  });

  const addKeyword = useMutation({
    mutationFn: async () => {
      if (!newKeyword.keyword.trim()) throw new Error("Keyword is required.");
      const { error } = await supabase.from("tracked_keywords").insert({
        keyword: newKeyword.keyword.trim().toLowerCase(),
        category: newKeyword.category,
        target_landing_path: newKeyword.target_landing_path.trim() || null,
        notes: newKeyword.notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Keyword added.");
      setAddOpen(false);
      setNewKeyword({ keyword: "", category: "category", target_landing_path: "", notes: "" });
      qc.invalidateQueries({ queryKey: ["tracked-keywords"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeKeyword = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tracked_keywords").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Keyword removed.");
      qc.invalidateQueries({ queryKey: ["tracked-keywords"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Group snapshots by keyword for rendering
  const byKeyword = useMemo(() => {
    const m = new Map<string, Snapshot[]>();
    (snapshots ?? []).forEach((s) => {
      const arr = m.get(s.keyword_id) ?? [];
      arr.push(s);
      m.set(s.keyword_id, arr);
    });
    return m;
  }, [snapshots]);

  const filtered = useMemo(() => {
    if (!keywords) return [];
    if (categoryFilter === "all") return keywords;
    return keywords.filter((k) => k.category === categoryFilter);
  }, [keywords, categoryFilter]);

  // Top-line totals across all keywords (30d)
  const totals = useMemo(() => {
    const all = snapshots ?? [];
    return {
      impressions: all.reduce((a, b) => a + (b.impressions || 0), 0),
      clicks: all.reduce((a, b) => a + (b.clicks || 0), 0),
      conversions: all.reduce((a, b) => a + (b.conversions || 0), 0),
    };
  }, [snapshots]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Keyword Tracking</h1>
          <p className="text-sm text-muted-foreground">
            Rankings, impressions, clicks and conversions for your target SEO terms — powered by Google Search Console.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => sync.mutate()} disabled={sync.isPending} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${sync.isPending ? "animate-spin" : ""}`} />
            Sync from GSC
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Add keyword
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Track a new keyword</DialogTitle>
                <DialogDescription>
                  Add a keyword you want to monitor in Google Search Console.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label htmlFor="kw">Keyword</Label>
                  <Input
                    id="kw"
                    value={newKeyword.keyword}
                    onChange={(e) => setNewKeyword({ ...newKeyword, keyword: e.target.value })}
                    placeholder="e.g. construction estimating software"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select
                    value={newKeyword.category}
                    onValueChange={(v) => setNewKeyword({ ...newKeyword, category: v as Category })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="branded">Branded</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                      <SelectItem value="competitor">Competitor</SelectItem>
                      <SelectItem value="long_tail">Long-tail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="path">Target landing path (optional)</Label>
                  <Input
                    id="path"
                    value={newKeyword.target_landing_path}
                    onChange={(e) =>
                      setNewKeyword({ ...newKeyword, target_landing_path: e.target.value })
                    }
                    placeholder="/solutions/construction-estimating-software"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={newKeyword.notes}
                    onChange={(e) => setNewKeyword({ ...newKeyword, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => addKeyword.mutate()} disabled={addKeyword.isPending}>
                  Add keyword
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Top-line cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5" /> Tracked keywords
            </CardDescription>
            <CardTitle className="text-2xl">{keywords?.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5" /> Impressions (30d)
            </CardDescription>
            <CardTitle className="text-2xl">{totals.impressions.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <MousePointerClick className="w-3.5 h-3.5" /> Clicks (30d)
            </CardDescription>
            <CardTitle className="text-2xl">{totals.clicks.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" /> Conversions (30d)
            </CardDescription>
            <CardTitle className="text-2xl">{totals.conversions.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>Tracked keywords</CardTitle>
              <CardDescription>30-day rollup per keyword. Click "Sync from GSC" to refresh.</CardDescription>
            </div>
            <Tabs value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as Category | "all")}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="branded">Branded</TabsTrigger>
                <TabsTrigger value="category">Category</TabsTrigger>
                <TabsTrigger value="competitor">Competitor</TabsTrigger>
                <TabsTrigger value="long_tail">Long-tail</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {kwLoading || snLoading ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              No keywords yet. Add one above to start tracking.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Position</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead>Trend (impr.)</TableHead>
                    <TableHead>Landing</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((k) => {
                    const series = byKeyword.get(k.id) ?? [];
                    const impressions = series.reduce((a, b) => a + b.impressions, 0);
                    const clicks = series.reduce((a, b) => a + b.clicks, 0);
                    const conversions = series.reduce((a, b) => a + b.conversions, 0);
                    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
                    const positions = series.filter((s) => s.position !== null).map((s) => s.position!);
                    const avgPos =
                      positions.length > 0
                        ? positions.reduce((a, b) => a + b, 0) / positions.length
                        : null;
                    const firstHalf = positions.slice(0, Math.floor(positions.length / 2));
                    const secondHalf = positions.slice(Math.floor(positions.length / 2));
                    const trendImproving =
                      firstHalf.length > 0 && secondHalf.length > 0
                        ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length <
                          firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
                        : null;
                    const sparkValues = series.map((s) => s.impressions);
                    const sparkMax = Math.max(1, ...sparkValues);
                    const landing = k.target_landing_path ?? series[series.length - 1]?.top_landing_path ?? null;

                    return (
                      <TableRow key={k.id}>
                        <TableCell>
                          <div className="font-medium text-foreground">{k.keyword}</div>
                          {k.notes && <div className="text-xs text-muted-foreground">{k.notes}</div>}
                        </TableCell>
                        <TableCell>
                          <Badge className={CATEGORY_COLORS[k.category]} variant="default">
                            {CATEGORY_LABELS[k.category]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {avgPos !== null ? (
                            <span className="inline-flex items-center gap-1">
                              {avgPos.toFixed(1)}
                              {trendImproving === true && (
                                <TrendingUp className="w-3 h-3 text-green-600" />
                              )}
                              {trendImproving === false && (
                                <TrendingDown className="w-3 h-3 text-amber-600" />
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{impressions.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{clicks.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{ctr.toFixed(2)}%</TableCell>
                        <TableCell className="text-right">{conversions}</TableCell>
                        <TableCell>
                          <Sparkline values={sparkValues} max={sparkMax} />
                        </TableCell>
                        <TableCell>
                          {landing ? (
                            <Link
                              to={landing}
                              className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
                            >
                              {landing.length > 28 ? landing.slice(0, 28) + "…" : landing}
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove "{k.keyword}"?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This deletes the keyword and all its historical snapshots. You can re-add it later.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => removeKeyword.mutate(k.id)}>
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help / fallback */}
      <Card>
        <CardContent className="pt-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <div className="font-medium text-foreground mb-1">How attribution works</div>
            Conversions are estimated by matching the keyword's top landing page in Search Console to same-day form submissions on that page. Google does not pass the search keyword through to your site, so this is best-effort. Sync runs on demand — click <strong>Sync from GSC</strong> above. Something off? <a href="mailto:hello@alfredai.bot?subject=Keyword%20Tracking%20Issue" className="text-primary underline inline-flex items-center gap-1"><Mail className="w-3 h-3" /> Email us</a> the page URL.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
