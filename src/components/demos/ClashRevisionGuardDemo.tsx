import { motion } from "framer-motion";
import {
  Layers, FileStack, GitCompareArrows, AlertTriangle, ShieldCheck, ClipboardList,
  FileWarning, CircleCheck, CircleAlert, FileText, ListChecks,
  DollarSign, Clock, CheckCircle2, AlertOctagon,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DemoStepShell, type DemoStepDef } from "@/components/demos/shared/DemoStepShell";
import { OutcomeSummaryCard, type OutcomeMetric } from "@/components/demos/shared/OutcomeSummaryCard";
import { StatusPill } from "@/components/ux";

const STEPS: DemoStepDef[] = [
  { id: "ingest", title: "Ingest documents", icon: FileStack, duration: 4000 },
  { id: "revisions", title: "Revision check", icon: GitCompareArrows, duration: 4500 },
  { id: "clashes", title: "Clash detection", icon: AlertTriangle, duration: 5000 },
  { id: "action", title: "Recommended action", icon: ShieldCheck, duration: 4500 },
  { id: "resolve", title: "Tasks executed", icon: ListChecks, duration: 5000 },
  { id: "audit", title: "Audit trail", icon: ClipboardList, duration: 4000 },
];

const DOCUMENTS = [
  { name: "A-201 Floor Plan — Level 2", rev: "Rev C", status: "current" as const },
  { name: "A-201 Floor Plan — Level 2", rev: "Rev B", status: "superseded" as const },
  { name: "S-110 Structural Slab Layout", rev: "Rev D", status: "current" as const },
  { name: "M-405 Mechanical Services", rev: "Rev A", status: "current" as const },
  { name: "Spec 03 30 00 — Cast-in-place Concrete", rev: "Rev 2", status: "current" as const },
  { name: "RFI-118 — Penetration coordination", rev: "Open", status: "open" as const },
];

const CLASHES = [
  {
    title: "Slab penetration conflict",
    detail: "M-405 duct penetration at grid C/4 clashes with S-110 post-tension band (Rev D).",
    severity: "High" as const,
    confidence: 96,
  },
  {
    title: "Superseded drawing on site pack",
    detail: "A-201 Rev B is still in the issued-for-construction pack. Rev C supersedes it.",
    severity: "High" as const,
    confidence: 99,
  },
  {
    title: "Spec vs drawing mismatch",
    detail: "Spec 03 30 00 calls for 40 MPa; A-201 schedule notes 32 MPa for the same pour.",
    severity: "Medium" as const,
    confidence: 88,
  },
];

const TASKS = [
  {
    title: "Reroute M-405 duct at grid C/4",
    action: "RFI-119 raised to design lead; revised duct route issued and clearance confirmed.",
    owner: "Mechanical sub",
    status: "Closed" as const,
  },
  {
    title: "Withdraw superseded A-201 Rev B",
    action: "Rev B removed from the issued-for-construction pack; Rev C re-issued to all crews.",
    owner: "Document control",
    status: "Closed" as const,
  },
  {
    title: "Resolve concrete grade mismatch",
    action: "Grade confirmed at 40 MPa; A-201 schedule corrected to match Spec 03 30 00.",
    owner: "Design lead",
    status: "Closed" as const,
  },
  {
    title: "Release Level 2 slab pour hold",
    action: "All clashes cleared and re-verified — hold lifted and crew cleared to proceed.",
    owner: "Site supervisor",
    status: "Closed" as const,
  },
];

const AUDIT = [
  { actor: "Platform", action: "Ingested 6 documents from project drawing register", t: "09:02" },
  { actor: "AI", action: "Flagged A-201 Rev B as superseded by Rev C", t: "09:02" },
  { actor: "AI", action: "Detected 3 clashes, 2 high severity", t: "09:03" },
  { actor: "AI", action: "Raised hold + drafted RFI link to design lead", t: "09:03" },
  { actor: "AI", action: "Executed 4 resolution tasks and tracked to closure", t: "09:04" },
  { actor: "Human", action: "Site supervisor acknowledged hold on Level 2 pour", t: "09:14" },
];

const OUTCOME_METRICS: OutcomeMetric[] = [
  { label: "Rework avoided", value: "$48,500", sub: "+ GST", icon: DollarSign, tone: "emerald" },
  { label: "Clashes caught", value: "3", sub: "2 high severity", icon: AlertOctagon, tone: "amber" },
  { label: "Tasks closed", value: "4 / 4", sub: "tracked to closure", icon: CheckCircle2, tone: "primary" },
  { label: "Pour delay", value: "0 days", sub: "caught pre-pour", icon: Clock, tone: "emerald" },
];

const sevStatus = (s: "High" | "Medium"): "blocked" | "atrisk" => (s === "High" ? "blocked" : "atrisk");


export default function ClashRevisionGuardDemo() {
  const renderStep = (id: string) => {
    if (id === "ingest") {
      return (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">Alfred pulls every drawing, spec and open RFI from your register and reads them as one connected set — so nothing is checked in isolation.</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {DOCUMENTS.map((d, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.rev}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      );
    }
    if (id === "revisions") {
      return (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">Alfred reconciles revision numbers across the whole pack and flags anything superseded before a crew can build from it.</p>
          {DOCUMENTS.map((d, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
              <span className="text-sm truncate">{d.name} <span className="text-muted-foreground">· {d.rev}</span></span>
              {d.status === "current" && <StatusPill status="ontrack" label="Current" size="sm" />}
              {d.status === "superseded" && <StatusPill status="blocked" label="Superseded" size="sm" />}
              {d.status === "open" && <StatusPill status="atrisk" label="Open RFI" size="sm" />}
            </motion.div>
          ))}
        </div>
      );
    }
    if (id === "clashes") {
      return (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">Cross-referencing structural, mechanical and architectural sets, Alfred surfaces conflicts with a confidence score so your team triages the real risks first.</p>
          {CLASHES.map((c, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3 mb-1">
                <h4 className="text-sm font-semibold">{c.title}</h4>
                <StatusPill status={sevStatus(c.severity)} label={c.severity} size="sm" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">{c.detail}</p>
              <div className="flex items-center gap-2">
                <Progress value={c.confidence} className="h-1.5 flex-1" />
                <span className="text-xs font-medium text-muted-foreground w-12 text-right">{c.confidence}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      );
    }
    if (id === "action") {
      return (
        <div className="grid gap-3">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Hold placed on Level 2 slab pour</p>
                <p className="text-sm text-muted-foreground">Alfred recommends pausing the pour until the penetration clash and concrete grade mismatch are resolved. Estimated rework avoided: <span className="font-medium text-foreground">$48,500 + GST</span>.</p>
              </div>
            </CardContent>
          </Card>
          <div className="grid sm:grid-cols-3 gap-2">
            {[
              { t: "Notify", d: "Site supervisor + design lead alerted instantly" },
              { t: "Draft RFI", d: "RFI-119 pre-filled with clash references" },
              { t: "Re-issue", d: "A-201 Rev C pushed to the construction pack" },
            ].map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="rounded-lg border border-border bg-card p-3">
                <p className="text-sm font-semibold mb-1">{a.t}</p>
                <p className="text-xs text-muted-foreground">{a.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      );
    }
    if (id === "resolve") {
      return (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">Alfred turns every flagged issue into a tracked task, assigns the right owner and works it through to closure — so nothing slips before the crew restarts.</p>
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
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-sm">All 4 tasks closed — hold lifted and rework avoided before any concrete was poured.</span>
          </div>
        </div>
      );
    }
    return (
      <div className="grid gap-2">
        <p className="text-sm text-muted-foreground">Every check and decision is logged — giving you a defensible record for the principal contractor and certifier.</p>
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
      icon={Layers}
      title="Clash & Revision Guard"
      subtitle="Catch conflicts and superseded drawings before work starts"
      steps={STEPS}
      reportSubject="Clash & Revision Guard demo issue"
      renderStep={renderStep}
      outcome={
        <OutcomeSummaryCard
          title="What this run delivered"
          metrics={OUTCOME_METRICS}
          note="Three clashes caught and four tasks closed before the Level 2 pour — avoiding demolition rework and program delay."
        />
      }
    />
  );
}
