import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SafeAnimatePresence } from "@/components/ui/safe-animate-presence";
import {
  FileText,
  Mail,
  FolderOpen,
  Table2,
  StickyNote,
  Upload,
  Link2,
  Cloud,
  Lock,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Engine6 } from "@/components/icons/Engine6";

/**
 * Looping hero demo for the Axiom product page.
 * Walks through an engineered four-stage pipeline:
 *   1. Ingest    – scattered sources from files, cloud drives, URLs and uploads
 *   2. Structure – snapped into a clean intelligence grid
 *   3. Secure    – locked into an encrypted knowledge vault
 *   4. Answer    – AI responds with the business's own context
 * Pure presentation, no data.
 */

const SOURCES = [
  { icon: FileText, label: "Tender.pdf", via: "Upload" },
  { icon: Cloud, label: "Drawings", via: "Cloud drive" },
  { icon: Mail, label: "Client emails", via: "Inbox" },
  { icon: Link2, label: "Spec URL", via: "Web link" },
  { icon: Table2, label: "Pricing sheet", via: "Cloud drive" },
  { icon: StickyNote, label: "Meeting notes", via: "Upload" },
  { icon: FolderOpen, label: "Project folder", via: "Drive sync" },
  { icon: FileText, label: "Contract.docx", via: "Upload" },
];

const STAGES = [
  { key: "ingest", label: "Ingest", caption: "Capturing from drives, uploads, inboxes & URLs", icon: Upload },
  { key: "structure", label: "Structure", caption: "Structuring into an intelligence layer", icon: Engine6 },
  { key: "secure", label: "Secure", caption: "Locking into your encrypted knowledge vault", icon: Lock },
  { key: "answer", label: "Answer", caption: "Responding with your business context", icon: ShieldCheck },
] as const;

const ANSWER_LINES = [
  "Risk — Liquidated damages clause exceeds your usual threshold.",
  "Margin — Priced at 14%, below your 18% benchmark.",
  "Action — Flag for commercial review before submission.",
];

const SOURCE_CHANNELS = [
  { icon: Upload, label: "Uploads" },
  { icon: Cloud, label: "Cloud drives" },
  { icon: Mail, label: "Inboxes" },
  { icon: Link2, label: "URLs" },
];

export default function AxiomHeroDemo() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const durations = [3000, 2600, 2600, 3600];
    const t = setTimeout(() => setStage((s) => (s + 1) % STAGES.length), durations[stage]);
    return () => clearTimeout(t);
  }, [stage]);

  const StageIcon = STAGES[stage].icon;

  return (
    <div className="relative w-full rounded-2xl border border-border bg-card/90 backdrop-blur-md shadow-2xl overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-muted/40">
        <Engine6 className="w-5 h-5 text-foreground" />
        <span className="text-sm font-semibold text-foreground">Axiom machine learning engine</span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Live
        </span>
      </div>

      {/* Stage stepper */}
      <div className="grid grid-cols-4 gap-1 px-3 sm:px-4 pt-3.5">
        {STAGES.map((s, i) => {
          const Icon = s.icon;
          const active = i === stage;
          const done = i < stage;
          return (
            <div key={s.key} className="flex flex-col items-center gap-1.5">
              <div className="flex items-center w-full">
                <span className={`h-px flex-1 ${i === 0 ? "opacity-0" : done || active ? "bg-primary/50" : "bg-border"}`} />
                <motion.div
                  animate={{ scale: active ? 1.12 : 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className={`flex items-center justify-center w-7 h-7 rounded-full border shrink-0 ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : done
                        ? "border-primary/40 bg-primary/5 text-primary/70"
                        : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                </motion.div>
                <span className={`h-px flex-1 ${i === STAGES.length - 1 ? "opacity-0" : done ? "bg-primary/50" : "bg-border"}`} />
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${active ? "text-foreground" : "text-muted-foreground/70"}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Caption */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
        <StageIcon className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="truncate">{STAGES[stage].caption}</span>
      </div>

      {/* Stage canvas */}
      <div className="relative px-4 pb-4 pt-1 min-h-[270px]">
        <SafeAnimatePresence mode="wait">
          {/* INGEST */}
          {stage === 0 && (
            <motion.div
              key="ingest"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="flex flex-wrap gap-1.5">
                {SOURCE_CHANNELS.map((c) => {
                  const Icon = c.icon;
                  return (
                    <span key={c.label} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                      <Icon className="w-3 h-3 text-primary" />
                      {c.label}
                    </span>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SOURCES.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, x: i % 2 === 0 ? -14 : 14, y: 6 }}
                      animate={{ opacity: 1, x: 0, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.08 }}
                      className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2"
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground truncate">{s.label}</span>
                      <span className="ml-auto text-[9px] font-medium uppercase tracking-wide text-muted-foreground/60 shrink-0">{s.via}</span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STRUCTURE */}
          {stage === 1 && (
            <motion.div
              key="structure"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2.5"
            >
              <div className="grid grid-cols-4 gap-1.5">
                {SOURCES.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20, delay: i * 0.05 }}
                      className="flex flex-col items-center gap-1 rounded-lg border border-primary/30 bg-primary/5 px-1.5 py-2"
                    >
                      <Icon className="w-3.5 h-3.5 text-primary" />
                    </motion.div>
                  );
                })}
              </div>
              <div className="rounded-xl border border-border bg-background p-3 space-y-2">
                {[
                  "Terminology & entities mapped",
                  "Risks, rules & pricing logic linked",
                  "Workflows & approvals modelled",
                ].map((line, r) => (
                  <motion.div
                    key={line}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + r * 0.25 }}
                    className="flex items-center gap-2 text-xs text-foreground/80"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {line}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* SECURE */}
          {stage === 2 && (
            <motion.div
              key="secure"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-4 py-6"
            >
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 16 }}
                className="relative flex items-center justify-center w-20 h-20 rounded-2xl border border-primary/40 bg-primary/5"
              >
                <motion.span
                  className="absolute inset-0 rounded-2xl border border-primary/30"
                  animate={{ scale: [1, 1.25], opacity: [0.6, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                />
                <Lock className="w-8 h-8 text-primary" />
              </motion.div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-foreground">Encrypted knowledge vault</p>
                <p className="text-[11px] text-muted-foreground">Access-controlled · audit-logged · your data stays yours</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {["Role-based access", "Encrypted at rest", "Fully auditable"].map((t, i) => (
                  <motion.span
                    key={t}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.2 }}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-medium text-foreground/70"
                  >
                    <ShieldCheck className="w-3 h-3 text-primary" />
                    {t}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}

          {/* ANSWER */}
          {stage === 3 && (
            <motion.div
              key="answer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs font-semibold text-foreground">“Is this tender worth bidding on?”</p>
              </div>
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-2.5">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  <Engine6 className="w-3.5 h-3.5" />
                  Axiom answer
                </div>
                {ANSWER_LINES.map((line, i) => (
                  <motion.div
                    key={line}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.4 }}
                    className="flex items-start gap-2 text-xs text-foreground/85 leading-relaxed"
                  >
                    <Check className="mt-0.5 w-3.5 h-3.5 text-primary shrink-0" />
                    {line}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </SafeAnimatePresence>
      </div>
    </div>
  );
}
