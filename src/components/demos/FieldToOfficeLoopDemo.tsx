import { motion } from "framer-motion";
import {
  RefreshCw, Camera, Link2, FileSignature, Send, Smartphone,
  MapPin, FileText, CircleCheck, ListChecks,
  Clock, CheckCircle2, FileWarning, DollarSign,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DemoStepShell, type DemoStepDef } from "@/components/demos/shared/DemoStepShell";
import { OutcomeSummaryCard, type OutcomeMetric } from "@/components/demos/shared/OutcomeSummaryCard";
import { StatusPill } from "@/components/ux";

const STEPS: DemoStepDef[] = [
  { id: "capture", title: "Capture issue", icon: Camera, duration: 4000 },
  { id: "link", title: "Link to drawing", icon: Link2, duration: 4500 },
  { id: "draft", title: "Draft RFI", icon: FileSignature, duration: 5000 },
  { id: "route", title: "Route for approval", icon: Send, duration: 4500 },
  { id: "resolve", title: "Tasks executed", icon: ListChecks, duration: 5000 },
  { id: "sync", title: "Sync to site", icon: Smartphone, duration: 4500 },
  { id: "audit", title: "Audit trail", icon: FileText, duration: 4000 },
];

const TASKS = [
  {
    title: "Issue revised A-204 Rev C",
    action: "Design response actioned; bulkhead set-down revised and new drawing published.",
    owner: "Design lead",
    status: "Closed" as const,
  },
  {
    title: "Withdraw superseded A-204 Rev B",
    action: "Rev B retired from the site pack so no crew can build from outdated information.",
    owner: "Document control",
    status: "Closed" as const,
  },
  {
    title: "Update install sequence",
    action: "Ceiling grid install task rescheduled around the revised set-down; crew re-briefed.",
    owner: "Site manager",
    status: "Closed" as const,
  },
  {
    title: "Close out RFI-204",
    action: "RFI marked resolved in the project register with full response history attached.",
    owner: "Project register",
    status: "Closed" as const,
  },
];

const AUDIT = [
  { actor: "Human", action: "Carpenter logged clash photo at grid B/3", t: "10:12" },
  { actor: "AI", action: "Matched location to A-204 Rev B + duct M-405", t: "10:12" },
  { actor: "AI", action: "Drafted RFI-204 with photo, location & query", t: "10:13" },
  { actor: "Human", action: "Site manager approved & sent to design lead", t: "10:21" },
  { actor: "AI", action: "Executed 4 resolution tasks and tracked to closure", t: "14:48" },
  { actor: "AI", action: "Design response logged, A-204 Rev C issued", t: "14:48" },
  { actor: "AI", action: "Pushed updated drawing & status to site crew", t: "14:48" },
];

const OUTCOME_METRICS: OutcomeMetric[] = [
  { label: "Loop closed in", value: "4h 36m", sub: "vs days of back-and-forth", icon: Clock, tone: "primary" },
  { label: "Delay avoided", value: "2 days", sub: "ceiling grid install", icon: FileWarning, tone: "amber" },
  { label: "Tasks closed", value: "4 / 4", sub: "tracked to closure", icon: CheckCircle2, tone: "emerald" },
  { label: "Wrong-rev builds", value: "0", sub: "Rev B retired on site", icon: DollarSign, tone: "emerald" },
];

export default function FieldToOfficeLoopDemo() {
  const renderStep = (id: string) => {
    if (id === "capture") {
      return (
        <div className="grid gap-3 sm:grid-cols-[280px_1fr] sm:items-start">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="aspect-[4/3] rounded-lg bg-muted flex items-center justify-center mb-3 relative">
                <Camera className="w-8 h-8 text-muted-foreground/50" />
                <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px]">Issue</Badge>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 text-primary" /> Grid B/3 · Level 3 · 10:12
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-2">
            <p className="text-sm text-muted-foreground">A crew member snaps a photo of an on-site clash from their phone — no paperwork, no waiting for the next site walk.</p>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-sm font-medium mb-1">Reported note</p>
              <p className="text-sm text-muted-foreground">"Bulkhead height won't clear the new duct run above the corridor ceiling."</p>
            </div>
          </div>
        </div>
      );
    }
    if (id === "link") {
      return (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">Alfred recognises the location and automatically links the issue to the exact current drawings and specs — so the office sees it in context.</p>
          {[
            { n: "A-204 Reflected Ceiling Plan — Level 3", r: "Rev B (current)" },
            { n: "M-405 Mechanical Services", r: "Rev A (current)" },
            { n: "Spec 09 51 00 — Acoustic Ceilings", r: "Rev 1" },
          ].map((d, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <Link2 className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm flex-1 truncate">{d.n}</span>
              <StatusPill status="ontrack" label={d.r} size="sm" className="shrink-0" />
            </motion.div>
          ))}
        </div>
      );
    }
    if (id === "draft") {
      return (
        <Card className="border-border bg-card">
          <CardContent className="p-4 grid gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">RFI-204 (draft)</p>
              <Badge className="bg-primary/10 text-primary border border-primary/30">AI drafted</Badge>
            </div>
            {[
              ["Subject", "Corridor bulkhead clash with duct run — Level 3"],
              ["Location", "Grid B/3, Level 3"],
              ["Reference", "A-204 Rev B · M-405 Rev A"],
              ["Query", "Confirm revised bulkhead set-down or reroute of M-405 duct to maintain 2400mm ceiling height."],
              ["Cost/time impact", "Potential 2-day delay if unresolved before ceiling grid install"],
            ].map(([k, v], i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="grid sm:grid-cols-[140px_1fr] gap-1 sm:gap-3 border-b border-border/60 pb-2 last:border-0">
                <span className="text-xs font-medium text-muted-foreground">{k}</span>
                <span className="text-sm">{v}</span>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      );
    }
    if (id === "route") {
      return (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">The RFI routes through the right people automatically, with reminders so it never stalls in someone's inbox.</p>
          {[
            { who: "Site manager", role: "Review & approve", state: "Approved", done: true },
            { who: "Design lead", role: "Provide response", state: "Responded · A-204 Rev C", done: true },
            { who: "Project register", role: "Log & close out", state: "Updated", done: true },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <CircleCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{s.who}</p>
                <p className="text-xs text-muted-foreground">{s.role}</p>
              </div>
              <StatusPill status="ontrack" label={s.state} size="sm" className="shrink-0" />
            </motion.div>
          ))}
        </div>
      );
    }
    if (id === "resolve") {
      return (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">The approved response becomes a set of tracked tasks. Alfred executes each one and drives it to closure before pushing the result back to site.</p>
          {TASKS.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3 mb-1">
                <h4 className="text-sm font-semibold flex items-center gap-2"><CircleCheck className="w-4 h-4 text-emerald-600 shrink-0" />{t.title}</h4>
                <StatusPill status="ontrack" label={t.status} size="sm" className="shrink-0" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">{t.action}</p>
              <p className="text-xs text-muted-foreground">Owner: <span className="font-medium text-foreground">{t.owner}</span></p>
            </motion.div>
          ))}
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
            <RefreshCw className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-sm">All 4 tasks closed — issue fully resolved before it reached the crew.</span>
          </div>
        </div>
      );
    }
    if (id === "sync") {
      return (
        <div className="grid gap-3 sm:grid-cols-[280px_1fr] sm:items-start">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 grid gap-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold">Site crew notified</p>
              </div>
              <div className="rounded-md bg-card border border-border p-2.5">
                <p className="text-xs font-medium">A-204 Rev C is now current</p>
                <p className="text-[11px] text-muted-foreground">Bulkhead set-down revised. Rev B is superseded — do not build from it.</p>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-2">
            <p className="text-sm text-muted-foreground">The resolved change is pushed straight back to the crew's device and the old revision is retired — closing the loop so no one builds from outdated information.</p>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
              <RefreshCw className="w-4 h-4 text-primary" />
              <span className="text-sm">Loop closed in <span className="font-semibold">4h 36m</span> — vs days of back-and-forth.</span>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="grid gap-2">
        <p className="text-sm text-muted-foreground">Every step from the field photo to the re-issued drawing is recorded — a single source of truth for the whole project team.</p>
        {AUDIT.map((a, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
            <Badge variant="outline" className="shrink-0 w-20 justify-center">{a.actor}</Badge>
            <span className="text-sm flex-1">{a.action}</span>
            <span className="text-xs text-muted-foreground">{a.t}</span>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <DemoStepShell
      icon={RefreshCw}
      title="Field-to-Office Change Loop"
      subtitle="Turn site issues into resolved, re-issued drawings — fast"
      steps={STEPS}
      reportSubject="Field-to-Office Loop demo issue"
      renderStep={renderStep}
      outcome={
        <OutcomeSummaryCard
          title="What this run delivered"
          metrics={OUTCOME_METRICS}
          note="A field photo became a resolved, re-issued drawing in under half a day — closing the loop before the crew built from the wrong revision."
        />
      }
    />
  );
}
