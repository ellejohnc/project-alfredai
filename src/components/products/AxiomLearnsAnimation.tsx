import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SafeAnimatePresence } from "@/components/ui/safe-animate-presence";
import {
  Mail,
  FolderOpen,
  Table2,
  HardDrive,
  Boxes,
  Lock,
  ShieldCheck,
  Database,
  ArrowRight,
  Check,
  Cloud,
  UploadCloud,
  Link2,
  FolderSync,
} from "lucide-react";
import { Engine6 } from "@/components/icons/Engine6";

/**
 * Three-phase looping animation for the "What Axiom learns" section.
 * Phase 0 — Ingest: scattered sources stream into the engine.
 * Phase 1 — Structure: raw inputs are organised into clean, labelled records.
 * Phase 2 — Secure store: structured data is locked into an encrypted vault.
 *
 * Pure presentation, no data. Mobile-first responsive layout.
 */

const SOURCES = [
  { icon: Cloud, label: "Google Drive", sub: "Cloud sync" },
  { icon: FolderSync, label: "SharePoint", sub: "Cloud sync" },
  { icon: UploadCloud, label: "Direct upload", sub: "PDF · DOCX · XLSX" },
  { icon: Link2, label: "Website / URL", sub: "Web import" },
  { icon: Mail, label: "Client emails", sub: "Inbox" },
  { icon: FolderOpen, label: "Project folder", sub: "Local files" },
  { icon: Table2, label: "Pricing sheet", sub: "Spreadsheet" },
  { icon: HardDrive, label: "Drawings & specs", sub: "CAD · PDF" },
];

const STRUCTURED = [
  { label: "Commercial rules", tag: "Pricing" },
  { label: "Risk register", tag: "Risk" },
  { label: "Delivery workflow", tag: "Ops" },
  { label: "Compliance log", tag: "Safety" },
];

const PHASES = [
  { key: "ingest", title: "Capturing your knowledge", caption: "Pulling in scattered documents, emails & records" },
  { key: "structure", title: "Structuring into logic", caption: "Mapping rules, risks & decisions into clean records" },
  { key: "secure", title: "Stored securely", caption: "Encrypted, access-controlled & ready for your AI" },
] as const;

export default function AxiomLearnsAnimation() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const durations = [3200, 3400, 3600];
    const t = setTimeout(() => setPhase((p) => (p + 1) % PHASES.length), durations[phase]);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div className="relative w-full rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-xl overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
        <Engine6 className="w-5 h-5 text-foreground shrink-0" />
        <span className="text-sm font-semibold text-foreground">Axiom learning pipeline</span>
        <span className="ml-auto hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          {PHASES[phase].title}
        </span>
      </div>

      {/* Phase rail */}
      <div className="grid grid-cols-3 border-b border-border">
        {PHASES.map((p, i) => {
          const Icon = [Boxes, Database, ShieldCheck][i];
          const active = i === phase;
          const done = i < phase;
          return (
            <div
              key={p.key}
              className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold transition-colors ${
                i < 2 ? "border-r border-border" : ""
              } ${active ? "bg-primary/5 text-foreground" : done ? "text-foreground/70" : "text-muted-foreground"}`}
            >
              <span
                className={`flex items-center justify-center w-6 h-6 rounded-full border shrink-0 transition-colors ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : done
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              </span>
              <span className="hidden sm:inline truncate">
                {["Ingest", "Structure", "Secure"][i]}
              </span>
            </div>
          );
        })}
      </div>

      <div className="relative p-4 sm:p-5 min-h-[280px]">
        <SafeAnimatePresence mode="wait">
          {/* PHASE 0 — INGEST */}
          {phase === 0 && (
            <motion.div
              key="ingest"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5"
            >
              {SOURCES.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 16, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-2.5 py-2.5"
                  >
                    <span className="flex items-center justify-center w-8 h-8 shrink-0 rounded-md border border-border bg-muted/50">
                      <Icon className="w-4 h-4 text-primary" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-foreground truncate">{s.label}</span>
                      <span className="block text-[10px] text-muted-foreground truncate">{s.sub}</span>
                    </span>
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.12 }}
                      className="ml-auto w-1.5 h-1.5 shrink-0 rounded-full bg-primary"
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* PHASE 1 — STRUCTURE */}
          {phase === 1 && (
            <motion.div
              key="structure"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2.5"
            >
              {STRUCTURED.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5"
                >
                  <Database className="w-4 h-4 shrink-0 text-primary" />
                  <span className="text-xs font-medium text-foreground flex-1 truncate">{s.label}</span>
                  <motion.span
                    initial={{ width: "30%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.5, delay: i * 0.18 + 0.1 }}
                    className="hidden sm:block h-1.5 max-w-[120px] rounded-full bg-primary/20 overflow-hidden"
                  >
                    <motion.span
                      initial={{ x: "-100%" }}
                      animate={{ x: "0%" }}
                      transition={{ duration: 0.6, delay: i * 0.18 + 0.1 }}
                      className="block h-full w-full rounded-full bg-primary/60"
                    />
                  </motion.span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary shrink-0">
                    {s.tag}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* PHASE 2 — SECURE STORE */}
          {phase === 2 && (
            <motion.div
              key="secure"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center text-center py-4"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex items-center justify-center w-24 h-24 rounded-2xl border border-primary/40 bg-primary/5"
              >
                <motion.span
                  animate={{ opacity: [0.4, 0.9, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-2xl ring-2 ring-primary/30"
                />
                <Lock className="w-9 h-9 text-primary" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 flex flex-wrap items-center justify-center gap-2"
              >
                {["Encrypted", "Access-controlled", "Your data only"].map((b, i) => (
                  <motion.span
                    key={b}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.15 }}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-medium text-foreground"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    {b}
                  </motion.span>
                ))}
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="mt-4 text-xs text-muted-foreground max-w-sm"
              >
                Your structured knowledge is stored in a secure, private vault — ready to power your AI.
              </motion.p>
            </motion.div>
          )}
        </SafeAnimatePresence>

        {/* Flow indicator */}
        <div className="flex items-center justify-center gap-2 pt-4 text-[11px] font-semibold uppercase tracking-wider text-primary">
          {phase === 0 && (
            <>
              <Boxes className="w-3.5 h-3.5" /> Ingesting <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
          {phase === 1 && (
            <>
              <Database className="w-3.5 h-3.5" /> Structuring <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
          {phase === 2 && (
            <>
              <ShieldCheck className="w-3.5 h-3.5" /> Secured
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground pt-2">{PHASES[phase].caption}</p>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 pt-3">
          {PHASES.map((p, i) => (
            <span
              key={p.key}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === phase ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
