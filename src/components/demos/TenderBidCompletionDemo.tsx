import { motion } from "framer-motion";
import {
  FileCheck2, Upload, ScanText, Database, ListChecks, MessageSquare,
  FileOutput, RefreshCw, CircleCheck, CircleAlert, FileText, ShieldCheck,
  Clock, FileWarning, CheckCircle2, DollarSign,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DemoStepShell, type DemoStepDef } from "@/components/demos/shared/DemoStepShell";
import { OutcomeSummaryCard, type OutcomeMetric } from "@/components/demos/shared/OutcomeSummaryCard";

const STEPS: DemoStepDef[] = [
  { id: "upload", title: "Upload form", icon: Upload, duration: 4000 },
  { id: "extract", title: "Extract fields", icon: ScanText, duration: 5000 },
  { id: "match", title: "Match knowledge base", icon: Database, duration: 5000 },
  { id: "gaps", title: "Gap report", icon: ListChecks, duration: 4500 },
  { id: "input", title: "Your input", icon: MessageSquare, duration: 4500 },
  { id: "generate", title: "Generate document", icon: FileOutput, duration: 4500 },
];

const FIELDS = [
  { field: "Registered company name", category: "Company profile", source: "Company profile", status: "matched" as const, value: "Placeholder Constructions Pty Ltd" },
  { field: "ABN / registration number", category: "Company profile", source: "Company profile", status: "matched" as const, value: "•• ••• ••• •••" },
  { field: "Public liability insurance", category: "Insurance", source: "Insurance certificate", status: "matched" as const, value: "$20M — current to 06/2027" },
  { field: "ISO 9001 certification", category: "Credentials", source: "ISO certificate", status: "matched" as const, value: "Certified — expires 03/2027" },
  { field: "Contractor licence", category: "Credentials", source: "Licence register", status: "matched" as const, value: "Class A — active" },
  { field: "Project-specific rate card", category: "Pricing", source: "—", status: "gap" as const, value: "Not held in standard documents" },
  { field: "Nominated site supervisor", category: "Project", source: "—", status: "gap" as const, value: "Needs project-specific input" },
];

const OUTCOME_METRICS: OutcomeMetric[] = [
  { label: "Completion time", value: "14 min", sub: "vs ~6 hours manual", icon: Clock, tone: "emerald" },
  { label: "Fields auto-filled", value: "5 / 7", sub: "from knowledge base", icon: CheckCircle2, tone: "primary" },
  { label: "Gaps flagged", value: "2", sub: "surfaced instantly", icon: FileWarning, tone: "amber" },
  { label: "Rework on updates", value: "0", sub: "regenerates on change", icon: DollarSign, tone: "emerald" },
];

export default function TenderBidCompletionDemo() {
  const renderStep = (id: string) => {
    if (id === "upload") {
      return (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">You upload the empty tender or bid form and ask Alfred to complete it from your governed knowledge base — no copy-paste hunting across documents.</p>
          <Card className="border-dashed border-primary/40 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">Tender_Request_Form.docx</p>
                <p className="text-xs text-muted-foreground">42 required fields · uploaded just now</p>
              </div>
              <Badge variant="outline" className="ml-auto border-emerald-500/30 text-emerald-600 bg-emerald-500/10">Received</Badge>
            </CardContent>
          </Card>
          <div className="grid sm:grid-cols-3 gap-2">
            {["Company profile", "ISO & licences", "Insurance & rates"].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="rounded-lg border border-border bg-card p-3 flex items-center gap-2">
                <Database className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs">{s} connected</span>
              </motion.div>
            ))}
          </div>
        </div>
      );
    }
    if (id === "extract") {
      return (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">Alfred parses the document, identifies every required field and maps each to a standard category — so nothing is missed.</p>
          {FIELDS.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
              <span className="text-sm truncate">{f.field}</span>
              <Badge variant="outline" className="shrink-0">{f.category}</Badge>
            </motion.div>
          ))}
        </div>
      );
    }
    if (id === "match") {
      return (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">Each field is matched against your knowledge base — company profile, certificates, insurance and rate cards — and filled where Alfred can confidently verify it.</p>
          {FIELDS.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center justify-between gap-3 mb-1">
                <span className="text-sm font-medium truncate">{f.field}</span>
                {f.status === "matched"
                  ? <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10 shrink-0"><CircleCheck className="w-3 h-3 mr-1" />Verified</Badge>
                  : <Badge variant="outline" className="border-amber-500/30 text-amber-600 bg-amber-500/10 shrink-0"><CircleAlert className="w-3 h-3 mr-1" />Gap</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">{f.value}{f.status === "matched" && <span className="text-muted-foreground/70"> · from {f.source}</span>}</p>
            </motion.div>
          ))}
        </div>
      );
    }
    if (id === "gaps") {
      return (
        <div className="grid gap-3">
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4 flex items-start gap-3">
              <ListChecks className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Gap report</p>
                <p className="text-sm text-muted-foreground">5 fields matched and verified. 2 fields need project-specific input that isn&apos;t held in standard documents.</p>
              </div>
            </CardContent>
          </Card>
          {FIELDS.filter(f => f.status === "gap").map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="rounded-lg border border-amber-500/30 bg-card p-3">
              <p className="text-sm font-semibold flex items-center gap-2"><FileWarning className="w-4 h-4 text-amber-600 shrink-0" />{f.field}</p>
              <p className="text-xs text-muted-foreground mt-1">{f.value}</p>
            </motion.div>
          ))}
        </div>
      );
    }
    if (id === "input") {
      return (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">You supply anything missing in plain language. Alfred merges it with knowledge-base data and validates that every required field now has a value.</p>
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground mb-1">You</p>
            <p className="text-sm">&ldquo;Use the Riverside project rate card and put James Carter as site supervisor.&rdquo;</p>
          </div>
          {[
            { t: "Project-specific rate card", d: "Riverside rate card applied — 42 line items priced." },
            { t: "Nominated site supervisor", d: "James Carter added with licence reference verified." },
          ].map((a, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }}
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
              <p className="text-sm font-semibold flex items-center gap-2"><CircleCheck className="w-4 h-4 text-emerald-600 shrink-0" />{a.t}</p>
              <p className="text-xs text-muted-foreground mt-1">{a.d}</p>
            </motion.div>
          ))}
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-sm">Validation passed — all 42 required fields now complete.</span>
          </div>
        </div>
      );
    }
    return (
      <div className="grid gap-3">
        <p className="text-sm text-muted-foreground">Alfred produces the completed, submission-ready tender document. Need a change later? Give the instruction and it regenerates instantly.</p>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <FileOutput className="w-6 h-6 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">Tender_Request_Form_COMPLETED.docx</p>
              <p className="text-xs text-muted-foreground">All fields populated · knowledge-base sources logged</p>
            </div>
            <Badge variant="outline" className="ml-auto border-emerald-500/30 text-emerald-600 bg-emerald-500/10 shrink-0">Ready</Badge>
          </CardContent>
        </Card>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
          <RefreshCw className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm">Update insurance, a rate or any detail and the document refreshes in seconds — no re-keying.</span>
        </div>
      </div>
    );
  };

  return (
    <DemoStepShell
      icon={FileCheck2}
      title="Automated Tender & Bid Completion"
      subtitle="Turn empty tender forms into submission-ready documents from your knowledge base"
      steps={STEPS}
      reportSubject="Tender & Bid Completion demo issue"
      renderStep={renderStep}
      outcome={
        <OutcomeSummaryCard
          title="What this run delivered"
          metrics={OUTCOME_METRICS}
          note="A 42-field tender completed in minutes from a governed knowledge base, with a clear gap report for the two project-specific fields."
        />
      }
    />
  );
}
