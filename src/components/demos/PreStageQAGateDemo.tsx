import { motion } from "framer-motion";
import {
  ClipboardCheck, HardHat, Camera, ScanLine, Lock, Unlock, CircleCheck, CircleAlert,
  FileSignature, ShieldCheck, ListChecks,
  Clock, CheckCircle2, DollarSign, AlertOctagon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DemoStepShell, type DemoStepDef } from "@/components/demos/shared/DemoStepShell";
import { OutcomeSummaryCard, type OutcomeMetric } from "@/components/demos/shared/OutcomeSummaryCard";
import { StatusPill } from "@/components/ux";

const STEPS: DemoStepDef[] = [
  { id: "stage", title: "Select stage", icon: HardHat, duration: 3500 },
  { id: "checklist", title: "AI checklist", icon: ClipboardCheck, duration: 5000 },
  { id: "photos", title: "Photo verification", icon: Camera, duration: 5500 },
  { id: "gate", title: "Pass / hold", icon: Lock, duration: 4500 },
  { id: "resolve", title: "Tasks executed", icon: ListChecks, duration: 5000 },
  { id: "audit", title: "Sign-off", icon: FileSignature, duration: 4000 },
];

const CHECKLIST = [
  { item: "Reinforcement spacing matches S-110 Rev D", result: "pass" as const },
  { item: "Cover blocks installed to spec (40mm)", result: "pass" as const },
  { item: "Penetrations & cast-in items located", result: "pass" as const },
  { item: "Edge formwork braced and level", result: "flag" as const },
  { item: "Concrete grade ticket = 40 MPa", result: "pass" as const },
];

const PHOTOS = [
  { label: "Rebar mat — grid C/4", verdict: "Confirmed", ok: true, note: "Spacing 200mm c/c — within tolerance" },
  { label: "Edge formwork — east face", verdict: "Defect flagged", ok: false, note: "Brace missing at 3.2m span" },
  { label: "Cast-in plate — column C4", verdict: "Confirmed", ok: true, note: "Position matches setout" },
];

const TASKS = [
  {
    title: "Rectify missing formwork brace",
    action: "Work order issued to carpenter; brace installed at 3.2m span and re-photographed.",
    owner: "Carpenter",
    status: "Closed" as const,
  },
  {
    title: "Re-verify corrected formwork",
    action: "New photo passed Alfred's vision check against spec — edge formwork now compliant.",
    owner: "AI vision",
    status: "Closed" as const,
  },
  {
    title: "Release pre-pour gate",
    action: "All 5 checklist items confirmed; stage gate unlocked and pour cleared to proceed.",
    owner: "Site engineer",
    status: "Closed" as const,
  },
];

const AUDIT = [
  { actor: "Human", action: "Foreman opened pre-pour QA gate for Level 2", t: "07:40" },
  { actor: "AI", action: "Generated 5-point checklist from S-110 Rev D + spec", t: "07:40" },
  { actor: "AI", action: "Verified 2 of 3 photos, flagged 1 formwork defect", t: "07:52" },
  { actor: "AI", action: "Held pour — 1 critical item outstanding", t: "07:52" },
  { actor: "AI", action: "Executed 3 rectification tasks and tracked to closure", t: "08:18" },
  { actor: "Human", action: "Defect rectified, photo re-submitted & passed", t: "08:18" },
  { actor: "Human", action: "Engineer signed off — pour released", t: "08:25" },
];

const OUTCOME_METRICS: OutcomeMetric[] = [
  { label: "Defective pour avoided", value: "$72,000", sub: "+ GST demolition rework", icon: DollarSign, tone: "emerald" },
  { label: "Defects caught", value: "1", sub: "before it was covered up", icon: AlertOctagon, tone: "amber" },
  { label: "Tasks closed", value: "3 / 3", sub: "tracked to closure", icon: CheckCircle2, tone: "emerald" },
  { label: "Gate cleared in", value: "45 min", sub: "flag to sign-off", icon: Clock, tone: "primary" },
];

export default function PreStageQAGateDemo() {
  const renderStep = (id: string) => {
    if (id === "stage") {
      return (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">Pick the construction stage. Alfred locks the next stage until quality is verified — so defects are caught before they get covered up.</p>
          <div className="grid sm:grid-cols-3 gap-2">
            {[
              { t: "Pre-pour", d: "Level 2 suspended slab", active: true },
              { t: "Pre-install", d: "Façade panels", active: false },
              { t: "Pre-cover", d: "In-wall services", active: false },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className={`rounded-lg border p-4 ${s.active ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <HardHat className={`w-4 h-4 ${s.active ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="text-sm font-semibold">{s.t}</p>
                  {s.active && <Badge className="ml-auto bg-primary text-primary-foreground text-[10px]">Selected</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      );
    }
    if (id === "checklist") {
      return (
        <div className="grid gap-2">
          <p className="text-sm text-muted-foreground">Alfred builds the checklist straight from your current drawings and specs — no generic template, no manual data entry.</p>
          {CHECKLIST.map((c, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              {c.result === "pass"
                ? <CircleCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                : <CircleAlert className="w-4 h-4 text-amber-600 shrink-0" />}
              <span className="text-sm flex-1">{c.item}</span>
              <StatusPill status={c.result === "pass" ? "ontrack" : "atrisk"} label={c.result === "pass" ? "Ready" : "Needs photo"} size="sm" />
            </motion.div>
          ))}
        </div>
      );
    }
    if (id === "photos") {
      return (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">Crews snap site photos. Alfred's vision check confirms each item against spec or flags a defect on the spot.</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {PHOTOS.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }}
                className="rounded-lg border border-border bg-card overflow-hidden">
                <div className={`aspect-video flex items-center justify-center relative ${p.ok ? "bg-emerald-500/10" : "bg-destructive/10"}`}>
                  <Camera className="w-7 h-7 text-muted-foreground/50" />
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary/40">
                    <motion.div className="h-full bg-primary" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1.2, delay: i * 0.12 }} />
                  </div>
                  <ScanLine className="absolute top-2 right-2 w-4 h-4 text-primary" />
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium mb-1 truncate">{p.label}</p>
                  <StatusPill status={p.ok ? "ontrack" : "blocked"} label={p.verdict} size="sm" className="mb-1" />
                  <p className="text-[11px] text-muted-foreground">{p.note}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      );
    }
    if (id === "gate") {
      return (
        <div className="grid gap-3">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 flex items-start gap-3">
              <Lock className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Pour held — 1 critical item outstanding</p>
                <p className="text-sm text-muted-foreground">The stage gate stays locked until the formwork brace is rectified and re-verified. This single catch avoids a defective pour and demolition rework.</p>
              </div>
            </CardContent>
          </Card>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardContent className="p-4 flex items-start gap-3">
                <Unlock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Defect rectified — gate released</p>
                  <p className="text-sm text-muted-foreground">Once the corrected photo passes, Alfred unlocks the pour automatically and notifies the engineer for sign-off.</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      );
    }
    if (id === "resolve") {
      return (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">Every flagged defect becomes a tracked task with an owner. Alfred drives each one to closure and re-checks the evidence before the gate can open.</p>
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
            <Unlock className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-sm">All tasks closed — defect fixed and re-verified before any concrete was poured.</span>
          </div>
        </div>
      );
    }
    return (
      <div className="grid gap-2">
        <p className="text-sm text-muted-foreground">A complete, time-stamped quality record — ready for the certifier, client and your own defect liability cover.</p>
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
      icon={ShieldCheck}
      title="Pre-Stage QA Gate"
      subtitle="Verify quality with photos before a stage can proceed"
      steps={STEPS}
      reportSubject="Pre-Stage QA Gate demo issue"
      renderStep={renderStep}
      outcome={
        <OutcomeSummaryCard
          title="What this run delivered"
          metrics={OUTCOME_METRICS}
          note="One formwork defect caught and rectified before the pour — avoiding a defective slab, demolition and program slippage."
        />
      }
    />
  );
}
