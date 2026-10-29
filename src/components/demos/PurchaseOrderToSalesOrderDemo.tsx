import { motion } from "framer-motion";
import {
  PackageCheck, Inbox, FileStack, ScanText, UserSearch, ArrowLeftRight,
  AlertTriangle, ShieldCheck, Send, ClipboardList, CircleCheck,
  Clock, CheckCircle2, AlertOctagon, DollarSign, Mail,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DemoStepShell, type DemoStepDef } from "@/components/demos/shared/DemoStepShell";
import { OutcomeSummaryCard, type OutcomeMetric } from "@/components/demos/shared/OutcomeSummaryCard";
import { StatusPill } from "@/components/ux";

const STEPS: DemoStepDef[] = [
  { id: "ingest", title: "Ingest & classify", icon: FileStack, duration: 4500 },
  { id: "extract", title: "Extract fields", icon: ScanText, duration: 4500 },
  { id: "resolve", title: "Resolve & map", icon: ArrowLeftRight, duration: 5000 },
  { id: "route", title: "Auto-approve / review", icon: AlertTriangle, duration: 5000 },
  { id: "post", title: "Post to ERP", icon: ShieldCheck, duration: 4500 },
  { id: "audit", title: "Confirm & report", icon: ClipboardList, duration: 4000 },
];

const INBOUND = [
  { name: "PO-88213.pdf", type: "PDF", status: "clean" as const },
  { name: "order_meridian.xlsx", type: "Excel", status: "clean" as const },
  { name: "scan_po_0447.jpg", type: "Scanned image", status: "clean" as const },
  { name: "email_body_order.txt", type: "Plain text", status: "exception" as const },
];

const LINES = [
  { customerCode: "MRD-STL-40", erpCode: "MAT-100440", desc: "Structural steel beam 40mm", qty: 120, match: "matched" as const },
  { customerCode: "MRD-BOLT-M16", erpCode: "MAT-200116", desc: "M16 structural bolt", qty: 4000, match: "matched" as const },
  { customerCode: "MRD-PLATE-X", erpCode: "—", desc: "Base plate (custom)", qty: 60, match: "unmatched" as const },
];

const OUTCOME_METRICS: OutcomeMetric[] = [
  { label: "Handling time", value: "90 sec", sub: "vs ~25 min manual", icon: Clock, tone: "emerald" },
  { label: "Auto-approved", value: "3 / 4", sub: "posted to ERP", icon: CheckCircle2, tone: "primary" },
  { label: "Exceptions", value: "1", sub: "routed with draft email", icon: AlertOctagon, tone: "amber" },
  { label: "Re-keying errors", value: "0", sub: "validated master data", icon: DollarSign, tone: "emerald" },
];

export default function PurchaseOrderToSalesOrderDemo() {
  const renderStep = (id: string) => {
    if (id === "ingest") {
      return (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">Purchase orders arrive by email in mixed formats. You forward them to Alfred, which ingests each attachment, classifies it, and routes it for processing.</p>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
            <Inbox className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm">4 attachments received from <span className="font-medium text-foreground">orders@meridian.example</span></span>
          </div>
          {INBOUND.map((d, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
              <span className="text-sm truncate">{d.name}</span>
              <Badge variant="outline" className="shrink-0">{d.type}</Badge>
            </motion.div>
          ))}
        </div>
      );
    }
    if (id === "extract") {
      return (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">Alfred extracts header and line-item fields from every format — even the scanned image and the plain-text email body.</p>
          <Card className="border-border bg-card">
            <CardContent className="p-4 grid sm:grid-cols-2 gap-3">
              {[
                { l: "Customer", v: "Meridian Group Pty Ltd" },
                { l: "PO number", v: "PO-88213" },
                { l: "Delivery date", v: "18 Aug 2026" },
                { l: "Line items", v: "3 extracted" },
              ].map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}>
                  <p className="text-xs text-muted-foreground">{f.l}</p>
                  <p className="text-sm font-medium">{f.v}</p>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>
      );
    }
    if (id === "resolve") {
      return (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">Alfred resolves the correct customer by cross-checking IDs against address data, then maps each customer item code to your ERP material code.</p>
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
            <UserSearch className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-sm">Customer resolved: <span className="font-medium">Meridian Group</span> (ID confirmed against delivery address).</span>
          </div>
          {LINES.map((l, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center justify-between gap-3 mb-1">
                <span className="text-sm font-medium truncate">{l.desc}</span>
                {l.match === "matched"
                  ? <StatusPill status="ontrack" size="sm" label="Mapped" className="shrink-0" />
                  : <StatusPill status="atrisk" size="sm" label="No match" className="shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground">{l.customerCode} → {l.erpCode} · qty <span className="tabular-nums">{l.qty.toLocaleString()}</span></p>
            </motion.div>
          ))}
        </div>
      );
    }
    if (id === "route") {
      return (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">Clean orders are approved automatically. Only documents with missing or inconsistent data are flagged for a human — with a ready-to-send clarification email.</p>
          <div className="grid sm:grid-cols-2 gap-2">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
              <p className="text-sm font-semibold flex items-center gap-2 text-emerald-700"><CheckCircle2 className="w-4 h-4 shrink-0" />Auto-approved (3)</p>
              <p className="text-xs text-muted-foreground mt-1">All fields validated against ERP master data and contract pricing.</p>
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="text-sm font-semibold flex items-center gap-2 text-amber-700"><AlertTriangle className="w-4 h-4 shrink-0" />Review queue (1)</p>
              <p className="text-xs text-muted-foreground mt-1">Unmapped custom base plate + ambiguous quantity on the plain-text order.</p>
            </div>
          </div>
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />Draft clarification email — ready to send</p>
              <p className="text-sm">&ldquo;Hi Meridian team, we&apos;re processing PO-88213. Could you confirm the ERP code and quantity for the custom base plate line? We&apos;ll post the order the moment it&apos;s confirmed.&rdquo;</p>
            </CardContent>
          </Card>
        </div>
      );
    }
    if (id === "post") {
      return (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">Clean orders are drafted as sales orders and posted to the ERP via API — with a full audit trail.</p>
          {[
            { t: "SO-40219 · Meridian Group", d: "Posted to ERP · 3 line items · contract pricing confirmed" },
            { t: "SO-40220 · Northbridge Ltd", d: "Posted to ERP · 5 line items · confirmed" },
            { t: "SO-40221 · Delta Fabrication", d: "Posted to ERP · 2 line items · confirmed" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
              <p className="text-sm font-semibold flex items-center gap-2"><CircleCheck className="w-4 h-4 text-emerald-600 shrink-0" />{s.t}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.d}</p>
            </motion.div>
          ))}
        </div>
      );
    }
    return (
      <div className="grid gap-3">
        <p className="text-sm text-muted-foreground">Alfred confirms each posting, updates the sender, and logs everything for a defensible audit trail.</p>
        {[
          { actor: "Platform", action: "Ingested 4 attachments and classified formats", t: "10:01" },
          { actor: "AI", action: "Resolved customer + mapped codes against ERP master data", t: "10:01" },
          { actor: "AI", action: "Auto-approved 3 clean orders, posted via ERP API", t: "10:02" },
          { actor: "AI", action: "Routed 1 exception to review with draft clarification email", t: "10:02" },
          { actor: "Human", action: "Order specialist confirmed custom line — 4th order posted", t: "10:19" },
        ].map((a, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
            <Badge variant="outline" className="shrink-0 w-20 justify-center">{a.actor}</Badge>
            <span className="text-sm flex-1">{a.action}</span>
            <span className="text-xs text-muted-foreground shrink-0">{a.t}</span>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <DemoStepShell
      icon={PackageCheck}
      title="Purchase Order to ERP Sales Order"
      subtitle="Ingest any PO format, validate against ERP master data, and post clean orders automatically"
      steps={STEPS}
      reportSubject="Purchase Order to Sales Order demo issue"
      renderStep={renderStep}
      outcome={
        <OutcomeSummaryCard
          title="What this run delivered"
          metrics={OUTCOME_METRICS}
          note="Mixed-format POs validated and posted to the ERP in seconds, with the single exception routed to a human alongside a ready-to-send clarification email."
        />
      }
    />
  );
}
