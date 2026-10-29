import { motion } from "framer-motion";
import {
  ClipboardCheck, Upload, Database, ScanText, GitCompareArrows, Gauge,
  ListChecks, ThumbsUp, RefreshCw, CircleCheck, CircleAlert, CircleX,
  Clock, CheckCircle2, AlertOctagon, Target,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DemoStepShell, type DemoStepDef } from "@/components/demos/shared/DemoStepShell";
import { OutcomeSummaryCard, type OutcomeMetric } from "@/components/demos/shared/OutcomeSummaryCard";

const STEPS: DemoStepDef[] = [
  { id: "upload", title: "Upload requirements", icon: Upload, duration: 4000 },
  { id: "parse", title: "Parse requirements", icon: ScanText, duration: 4500 },
  { id: "match", title: "Match capabilities", icon: GitCompareArrows, duration: 5000 },
  { id: "score", title: "Compliance score", icon: Gauge, duration: 5000 },
  { id: "recommend", title: "Go / No-Go", icon: ThumbsUp, duration: 4500 },
  { id: "recalc", title: "Recalculate", icon: RefreshCw, duration: 4500 },
];

type Req = { req: string; cat: string; status: "met" | "partial" | "not"; note: string };

const REQUIREMENTS: Req[] = [
  { req: "99.9% uptime SLA with credits", cat: "Operations", status: "met", note: "Enterprise SLA doc — 99.95% guaranteed" },
  { req: "SOC 2 Type II attestation", cat: "Security", status: "met", note: "Current attestation on file" },
  { req: "On-prem deployment option", cat: "Infrastructure", status: "partial", note: "Hybrid supported; full on-prem in roadmap" },
  { req: "ISO 27001 certification", cat: "Security", status: "met", note: "Certified — expires 2027" },
  { req: "24/7 local (AU) support desk", cat: "Operations", status: "met", note: "AU-based support documented" },
  { req: "FedRAMP authorisation", cat: "Compliance", status: "not", note: "Not held — no evidence in knowledge base" },
  { req: "Native SAP S/4HANA connector", cat: "Integrations", status: "partial", note: "API integration available; no native connector" },
];

const statusMeta = {
  met: { label: "Met", cls: "border-emerald-500/30 text-emerald-600 bg-emerald-500/10", Icon: CircleCheck },
  partial: { label: "Partial", cls: "border-amber-500/30 text-amber-600 bg-amber-500/10", Icon: CircleAlert },
  not: { label: "Not met", cls: "border-destructive/30 text-destructive bg-destructive/10", Icon: CircleX },
};

const OUTCOME_METRICS: OutcomeMetric[] = [
  { label: "Compliance", value: "82%", sub: "after evidence added", icon: Target, tone: "emerald" },
  { label: "Review time", value: "22 min", sub: "vs ~2 days manual", icon: Clock, tone: "emerald" },
  { label: "Gaps found", value: "2", sub: "1 critical, 1 partial", icon: AlertOctagon, tone: "amber" },
  { label: "Decision", value: "Go", sub: "conditional bid", icon: CheckCircle2, tone: "primary" },
];

export default function RfpComplianceScoringDemo() {
  const renderStep = (id: string) => {
    if (id === "upload") {
      return (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">You upload the RFP&apos;s mandatory requirements and ask Alfred to assess compliance and advise whether to bid — no manual line-by-line review.</p>
          <Card className="border-dashed border-primary/40 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <ClipboardCheck className="w-6 h-6 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">RFP_Mandatory_Requirements.xlsx</p>
                <p className="text-xs text-muted-foreground">148 requirements · uploaded just now</p>
              </div>
              <Badge variant="outline" className="ml-auto border-emerald-500/30 text-emerald-600 bg-emerald-500/10 shrink-0">Received</Badge>
            </CardContent>
          </Card>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
            <Database className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm">Knowledge base connected — technical docs, solution architecture and ways of working.</span>
          </div>
        </div>
      );
    }
    if (id === "parse") {
      return (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">Alfred extracts every individual requirement and categorises it — infrastructure, security, integrations, operations and compliance.</p>
          {REQUIREMENTS.map((r, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
              <span className="text-sm truncate">{r.req}</span>
              <Badge variant="outline" className="shrink-0">{r.cat}</Badge>
            </motion.div>
          ))}
        </div>
      );
    }
    if (id === "match") {
      return (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">Each requirement is cross-referenced to supporting evidence in your documentation and scored met, partially met, or not met — with a plain-English reason.</p>
          {REQUIREMENTS.map((r, i) => {
            const m = statusMeta[r.status];
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-sm font-medium truncate">{r.req}</span>
                  <Badge variant="outline" className={`${m.cls} shrink-0`}><m.Icon className="w-3 h-3 mr-1" />{m.label}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{r.note}</p>
              </motion.div>
            );
          })}
        </div>
      );
    }
    if (id === "score") {
      return (
        <div className="grid gap-3">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Overall compliance</span>
                <span className="text-2xl font-bold text-primary tabular-nums">74%</span>
              </div>
              <Progress value={74} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">Weighted across 148 requirements, before you supply any additional evidence.</p>
            </CardContent>
          </Card>
          <div className="grid grid-cols-3 gap-2">
            {[
              { l: "Met", v: "121", cls: "text-emerald-600" },
              { l: "Partial", v: "19", cls: "text-amber-600" },
              { l: "Not met", v: "8", cls: "text-destructive" },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                className="rounded-lg border border-border bg-card p-3 text-center">
                <p className={`text-xl font-bold tabular-nums ${s.cls}`}>{s.v}</p>
                <p className="text-xs text-muted-foreground">{s.l}</p>
              </motion.div>
            ))}
          </div>
        </div>
      );
    }
    if (id === "recommend") {
      return (
        <div className="grid gap-3">
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4 flex items-start gap-3">
              <ThumbsUp className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Recommendation: Conditional Go</p>
                <p className="text-sm text-muted-foreground">Compliance is strong (74%) but one critical requirement (FedRAMP) is unmet. Bid is viable if the client accepts an equivalence statement — otherwise no-bid.</p>
              </div>
            </CardContent>
          </Card>
          {[
            { t: "Critical gap — FedRAMP", d: "No evidence held. Blocks eligibility unless waived.", tone: "border-destructive/30" },
            { t: "Address before submission", d: "SAP native connector and full on-prem option are partial — clarify scope.", tone: "border-amber-500/30" },
          ].map((a, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={`rounded-lg border ${a.tone} bg-card p-3`}>
              <p className="text-sm font-semibold flex items-center gap-2"><ListChecks className="w-4 h-4 text-primary shrink-0" />{a.t}</p>
              <p className="text-xs text-muted-foreground mt-1">{a.d}</p>
            </motion.div>
          ))}
        </div>
      );
    }
    return (
      <div className="grid gap-3">
        <p className="text-sm text-muted-foreground">You supply missing evidence and Alfred re-analyses in real time — updating the score, the gaps and the recommendation.</p>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground mb-1">You</p>
          <p className="text-sm">&ldquo;We&apos;ve added the SAP S/4HANA connector and an approved on-prem deployment guide.&rdquo;</p>
        </div>
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Updated compliance</span>
              <span className="text-2xl font-bold text-status-ontrack tabular-nums">82%</span>
            </div>
            <Progress value={82} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">Two partial items now met. FedRAMP remains the only critical gap — decision: <span className="font-medium text-foreground">Go, conditional on waiver</span>.</p>
          </CardContent>
        </Card>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
          <CircleCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-sm">Updated compliance report generated with all supporting references, ready to circulate.</span>
        </div>
      </div>
    );
  };

  return (
    <DemoStepShell
      icon={ClipboardCheck}
      title="RFP Compliance Scoring & Go/No-Go"
      subtitle="Score every RFP requirement against your real capabilities and get a clear bid decision"
      steps={STEPS}
      reportSubject="RFP Compliance Scoring demo issue"
      renderStep={renderStep}
      outcome={
        <OutcomeSummaryCard
          title="What this run delivered"
          metrics={OUTCOME_METRICS}
          note="148 requirements scored in minutes with an objective 82% compliance figure and a defensible conditional-go recommendation."
        />
      }
    />
  );
}
