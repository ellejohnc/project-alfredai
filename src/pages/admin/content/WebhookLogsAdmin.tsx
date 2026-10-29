import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, Search, RefreshCw, ScrollText, AlertCircle } from "lucide-react";

interface WebhookLog {
  id: string;
  function_name: string | null;
  request_method: string | null;
  status: string | null;
  http_status: number | null;
  lead_email: string | null;
  leadgen_id: string | null;
  message: string | null;
  error_message: string | null;
  duration_ms: number | null;
  meta: unknown;
  created_at: string;
}

const SUPPORT_EMAIL = "hello@alfredai.bot";
const ROW_LIMIT = 200;

const FUNCTIONS = ["meta-leads-webhook", "ghl-meta-sync"] as const;
const STATUSES = [
  "success",
  "received",
  "deduped",
  "skipped",
  "failed",
  "unauthorized",
  "partial",
  "invalid",
] as const;

function statusClasses(status: string | null): {
  variant: "default" | "secondary" | "destructive" | "outline";
  className?: string;
} {
  switch ((status || "").toLowerCase()) {
    case "success":
    case "received":
      return {
        variant: "default",
        className: "bg-emerald-600 hover:bg-emerald-600 text-white",
      };
    case "partial":
      return {
        variant: "default",
        className: "bg-amber-500 hover:bg-amber-500 text-white",
      };
    case "failed":
    case "unauthorized":
    case "invalid":
      return { variant: "destructive" };
    case "deduped":
    case "skipped":
    case "ignored":
    default:
      return { variant: "secondary" };
  }
}

function StatusBadge({ status }: { status: string | null }) {
  const { variant, className } = statusClasses(status);
  return (
    <Badge variant={variant} className={`capitalize ${className || ""}`}>
      {status || "—"}
    </Badge>
  );
}

export default function WebhookLogsAdmin() {
  const { canViewLeads } = usePermissions();
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [functionFilter, setFunctionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<WebhookLog | null>(null);

  const fetchLogs = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from("webhook_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(ROW_LIMIT);
      if (error) throw error;
      setLogs((data as WebhookLog[]) || []);
      setLoadError(null);
    } catch (err) {
      console.error("Error loading webhook logs:", err);
      setLoadError(
        "We could not load webhook logs. Please refresh, or email us if it persists.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return logs.filter((l) => {
      const matchesSearch =
        !q ||
        [l.lead_email, l.leadgen_id, l.message]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(q));
      const matchesFn =
        functionFilter === "all" || l.function_name === functionFilter;
      const matchesStatus = statusFilter === "all" || l.status === statusFilter;
      return matchesSearch && matchesFn && matchesStatus;
    });
  }, [logs, searchQuery, functionFilter, statusFilter]);

  const counts = useMemo(() => {
    let failed = 0;
    let deduped = 0;
    for (const l of logs) {
      const s = (l.status || "").toLowerCase();
      if (["failed", "unauthorized", "invalid"].includes(s)) failed++;
      if (s === "deduped") deduped++;
    }
    return { total: logs.length, failed, deduped };
  }, [logs]);

  if (!canViewLeads) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            You do not have permission to view webhook logs.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ScrollText className="h-6 w-6 text-primary" /> Webhook Logs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lead-delivery attempts from the Meta &amp; GHL webhook functions.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchLogs(true)}
          disabled={refreshing}
          className="min-h-11"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-semibold">{counts.total}</div>
            <div className="text-xs text-muted-foreground mt-1">Total events</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-semibold text-destructive">
              {counts.failed}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Failed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-semibold text-muted-foreground">
              {counts.deduped}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Deduped</div>
          </CardContent>
        </Card>
      </div>

      {loadError && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">{loadError}</p>
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                  "Webhook logs error",
                )}&body=${encodeURIComponent(
                  `Page: ${window.location.href}\n\nPlease describe what happened and attach a screenshot.`,
                )}`}
                className="text-primary underline mt-1 inline-block"
              >
                Email us about this error
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3 space-y-3">
          <CardTitle className="text-base">
            {filtered.length} event{filtered.length === 1 ? "" : "s"}
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search email, leadgen id, message…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={functionFilter} onValueChange={setFunctionFilter}>
              <SelectTrigger className="w-full sm:w-[190px]">
                <SelectValue placeholder="Function" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All functions</SelectItem>
                {FUNCTIONS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No webhook events found. Incoming lead-delivery attempts will appear
              here automatically.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead className="hidden md:table-cell">Function</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">HTTP</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Leadgen ID</TableHead>
                    <TableHead className="hidden lg:table-cell">Message</TableHead>
                    <TableHead className="hidden md:table-cell">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((log) => (
                    <TableRow
                      key={log.id}
                      className="cursor-pointer"
                      onClick={() => setSelected(log)}
                    >
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.created_at), "d MMM HH:mm:ss")}
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs">
                        {log.function_name || "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={log.status} />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {log.http_status ?? "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {log.lead_email || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground max-w-[160px] truncate">
                        {log.leadgen_id || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground max-w-[220px] truncate">
                        {log.message || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {log.duration_ms != null ? `${log.duration_ms} ms` : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <StatusBadge status={selected.status} />
                </SheetTitle>
                <SheetDescription>
                  Webhook event details.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5 text-sm">
                <DetailRow label="Function" value={selected.function_name} mono />
                <DetailRow label="Method" value={selected.request_method} />
                <DetailRow
                  label="HTTP status"
                  value={selected.http_status != null ? String(selected.http_status) : null}
                />
                <DetailRow label="Email" value={selected.lead_email} isEmail />
                <DetailRow label="Leadgen ID" value={selected.leadgen_id} mono />
                <DetailRow label="Message" value={selected.message} />
                <DetailRow
                  label="Duration"
                  value={selected.duration_ms != null ? `${selected.duration_ms} ms` : null}
                />
                <DetailRow
                  label="Received"
                  value={format(new Date(selected.created_at), "d MMM yyyy, HH:mm:ss")}
                />

                {selected.error_message && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
                    <span className="text-xs font-medium text-destructive">
                      Error
                    </span>
                    <p className="text-xs text-destructive break-words mt-1">
                      {selected.error_message}
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    Meta (raw)
                  </span>
                  <pre className="rounded-lg border bg-muted/40 p-3 text-xs overflow-x-auto whitespace-pre-wrap break-words">
                    {selected.meta
                      ? JSON.stringify(selected.meta, null, 2)
                      : "—"}
                  </pre>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailRow({
  label,
  value,
  isEmail,
  mono,
}: {
  label: string;
  value: string | null;
  isEmail?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {value ? (
        isEmail ? (
          <a href={`mailto:${value}`} className="text-primary underline break-all">
            {value}
          </a>
        ) : (
          <span className={mono ? "font-mono text-xs break-all" : "break-words"}>
            {value}
          </span>
        )
      ) : (
        <span className="text-muted-foreground">—</span>
      )}
    </div>
  );
}
