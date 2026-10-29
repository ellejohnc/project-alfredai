import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { SafeAnimatePresence } from "@/components/ui/safe-animate-presence";
import sheet1 from "@/assets/hero-sheets/p1.jpg";
import sheet2 from "@/assets/hero-sheets/p2.jpg";
import sheet3 from "@/assets/hero-sheets/p3.jpg";
import sheet4 from "@/assets/hero-sheets/p4.jpg";
import sheet5 from "@/assets/hero-sheets/p5.jpg";
import sheet6 from "@/assets/hero-sheets/p6.jpg";
import sheet7 from "@/assets/hero-sheets/p7.jpg";
import sheet8 from "@/assets/hero-sheets/p8.jpg";
const SHEETS = [
  { src: sheet1, code: "A-101" },
  { src: sheet2, code: "A-601" },
  { src: sheet3, code: "A-701" },
  { src: sheet4, code: "S-201" },
  { src: sheet5, code: "C-101" },
  { src: sheet6, code: "S-101" },
  { src: sheet7, code: "S-002" },
  { src: sheet8, code: "A-301" },
];
import {
  FileUp, ScanSearch, Layers, BarChart3, CheckCircle, Clock,
  FileText, Ruler, Package, Hammer, AlertTriangle, Sparkles,
  Check, Pencil, MessageSquare, Ban, ArrowRight
} from "lucide-react";

/**
 * HeroDemoPreview — "PDF to Take-off in 3 Minutes" story.
 * 
 * Cycles through a compelling 5-phase narrative:
 *   1. Upload PDF Drawings
 *   2. AI Scanning Pages
 *   3. Extracting Quantities
 *   4. Generating Estimate
 *   5. Draft Ready — 3 mins
 *
 * Always on dark hero background → explicit white/opacity text classes.
 */

interface Phase {
  id: string;
  label: string;
  icon: React.ElementType;
  detail: string;
  accent: string; // tailwind color class for the phase highlight
}

const PHASES: Phase[] = [
  { id: "upload", label: "PDF Drawings Uploaded", icon: FileUp, detail: "12-page structural set received", accent: "text-blue-400" },
  { id: "scan", label: "AI Scanning Pages", icon: ScanSearch, detail: "Detecting dimensions, annotations, specs", accent: "text-amber-400" },
  { id: "extract", label: "Extracting Quantities", icon: Layers, detail: "142 line items across 6 trades", accent: "text-purple-400" },
  { id: "estimate", label: "Generating Estimate", icon: BarChart3, detail: "Pricing with live rate library", accent: "text-primary" },
  { id: "done", label: "Draft Estimate Ready", icon: CheckCircle, detail: "3 min 12s — ready for review", accent: "text-green-400" },
];

// Extracted line-items that appear during the "extract" phase
const EXTRACTED_ITEMS = [
  { icon: Ruler, label: "Concrete Slabs", qty: "2,340 m²", confidence: 97 },
  { icon: Package, label: "Steel Reinforcement", qty: "18.5 tonnes", confidence: 94 },
  { icon: Hammer, label: "Formwork", qty: "1,120 m²", confidence: 91 },
  { icon: FileText, label: "Waterproofing", qty: "680 m²", confidence: 88 },
];

const PHASE_DURATION = 3200; // ms per phase
const DONE_PHASE_HOLD = 11000; // final step holds longer so the verification buttons can be used
const SCAN_MIN_HOLD = 5000; // step 2 (drawing sheets) always shows at least this long, counted from load
const STEP_HOLD = 12000; // a step tapped by hand is held this long before the auto-cycle resumes
const phaseDuration = (id: string, held = false) =>
  held ? STEP_HOLD : id === "done" ? DONE_PHASE_HOLD : PHASE_DURATION;

// Human verification actions shown on the final step
const VERIFICATION_ACTIONS = [
  { label: "Accept", icon: Check, confirm: "3 flagged items accepted", className: "text-green-400/80" },
  { label: "Overwrite", icon: Pencil, confirm: "Quantity overwritten by you", className: "text-blue-400/80" },
  { label: "RFI", icon: MessageSquare, confirm: "RFI sent to the design team", className: "text-amber-400/80" },
  { label: "Exclude", icon: Ban, confirm: "Item excluded from the estimate", className: "text-red-400/70" },
];

const HeroDemoPreview = () => {
  const [activePhase, setActivePhase] = useState(0);
  const [extractCount, setExtractCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState("0:00");
  const [verified, setVerified] = useState<string | null>(null);
  const [verifyTick, setVerifyTick] = useState(0); // bumped on a verification click to re-hold the final step
  // Once the demo reaches its final step the workflow CTA appears and stays.
  const [hasCompleted, setHasCompleted] = useState(false);
  // A step tapped on the progress bar is held until STEP_HOLD passes, then the auto-cycle resumes.
  const [held, setHeld] = useState(false);
  const [holdTick, setHoldTick] = useState(0); // bumped on a step tap to re-arm the hold
  // Visitors who ask for less motion get a plain fade instead of the pop-and-flash sequence.
  const reduceMotion = useReducedMotion();

  // Preload + decode every drawing sheet up front so the scan step never shows half-loaded tiles.
  const [sheetsReady, setSheetsReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const loads = SHEETS.map(({ src }) => new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => { (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).finally(() => resolve()); };
      img.onerror = () => resolve(); // a failed sheet must never stall the demo
      img.src = src;
    }));
    // Fallback: never wait more than 8s on a slow connection.
    const cap = new Promise<void>((r) => setTimeout(r, 8000));
    Promise.race([Promise.all(loads).then(() => undefined), cap]).then(() => { if (!cancelled) setSheetsReady(true); });
    return () => { cancelled = true; };
  }, []);

  // Cycle through phases. The elapsed flag is tied to the step it was earned on, so a
  // stale "elapsed" from the previous step can never advance the next one (that was
  // skipping step 2). The scan step's timer only starts once every sheet has loaded.
  const [elapsedFor, setElapsedFor] = useState<number | null>(null);
  useEffect(() => {
    setElapsedFor(null);
    const isScan = PHASES[activePhase].id === "scan";
    if (isScan && !sheetsReady) return; // minimum time starts counting once loaded
    const ms = isScan && !held ? Math.max(SCAN_MIN_HOLD, PHASE_DURATION) : phaseDuration(PHASES[activePhase].id, held);
    const t = setTimeout(() => setElapsedFor(activePhase), ms);
    return () => clearTimeout(t);
  }, [activePhase, verifyTick, held, holdTick, sheetsReady]);
  useEffect(() => { setVerified(null); }, [activePhase]);
  useEffect(() => {
    if (PHASES[activePhase]?.id === "done") setHasCompleted(true);
  }, [activePhase]);
  useEffect(() => {
    if (elapsedFor !== activePhase || held) return;
    const nextIsScan = PHASES[(activePhase + 1) % PHASES.length]?.id === "scan";
    if (nextIsScan && !sheetsReady) return; // wait, then advance once ready
    setActivePhase((prev) => (prev + 1) % PHASES.length);
  }, [elapsedFor, sheetsReady, activePhase, held]);

  // A hand-held step releases itself so the demo carries on.
  useEffect(() => {
    if (!held) return;
    const t = setTimeout(() => setHeld(false), STEP_HOLD);
    return () => clearTimeout(t);
  }, [held, holdTick]);

  // Tapping a step on the progress bar shows that step and holds it.
  const goToPhase = useCallback((i: number) => {
    setActivePhase(i);
    setHeld(true);
    setHoldTick((t) => t + 1);
  }, []);

  // Animate extract count when in extract phase
  useEffect(() => {
    if (PHASES[activePhase]?.id === "extract") {
      setExtractCount(0);
      let count = 0;
      const tick = setInterval(() => {
        count += Math.floor(Math.random() * 12) + 5;
        if (count > 142) count = 142;
        setExtractCount(count);
        if (count >= 142) clearInterval(tick);
      }, 200);
      return () => clearInterval(tick);
    }
  }, [activePhase]);

  // Simulate elapsed timer
  useEffect(() => {
    const times = ["0:12", "0:48", "1:36", "2:24", "3:12"];
    setElapsedTime(times[activePhase] || "0:00");
  }, [activePhase]);

  const currentPhase = PHASES[activePhase];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
      className="relative"
    >
      {/* Glow border */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/30 via-transparent to-primary/20 opacity-50 transition-opacity duration-500" />

      {/* Card */}
      <div className="relative rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl shadow-black/30">

        {/* Title bar */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex gap-1.5 flex-shrink-0" aria-hidden="true">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
            </div>
            <span className="text-[11px] text-white/70 font-mono ml-1 sm:ml-2 select-none truncate">AI Take-Off</span>
            <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-white/35 select-none flex-shrink-0 border-l border-white/10 pl-2 sm:pl-3">
              Flagship
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Clock className="w-3 h-3 text-white/25" />
            <span className="text-[11px] font-mono text-primary font-medium">{elapsedTime}</span>
          </div>
        </div>

        {/* Phase progress bar */}
        <div className="flex gap-1 px-4 pt-3 pb-1">
          {PHASES.map((phase, i) => (
            <button
              key={phase.id}
              type="button"
              onClick={() => goToPhase(i)}
              aria-label={`Show step ${i + 1}: ${phase.label}`}
              aria-current={i === activePhase ? "step" : undefined}
              className="group flex-1 min-w-0 -mt-5 -mb-6 pt-5 pb-6 flex items-center bg-transparent cursor-pointer touch-manipulation rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <span className="block w-full h-1 rounded-full bg-white/[0.08] overflow-hidden transition-colors group-hover:bg-white/20">
                {i < activePhase ? (
                  <span className="block h-full w-full bg-green-400/60 rounded-full" />
                ) : i === activePhase ? (
                  <motion.span
                    className="block h-full bg-primary rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: (currentPhase.id === "scan" && !held ? Math.max(SCAN_MIN_HOLD, PHASE_DURATION) : phaseDuration(currentPhase.id, held)) / 1000, ease: "linear" }}
                    key={`bar-${activePhase}`}
                  />
                ) : null}
              </span>
            </button>
          ))}
        </div>

        {/* Active phase header */}
        <div className="px-4 sm:px-5 pt-3 pb-2">
          <SafeAnimatePresence mode="wait">
            <motion.div
              key={currentPhase.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-3"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.08] ${currentPhase.accent}`}>
                {currentPhase.id === "scan" ? (
                  <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <currentPhase.icon className="w-4 h-4" />
                  </motion.div>
                ) : currentPhase.id === "estimate" ? (
                  <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                    <currentPhase.icon className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <currentPhase.icon className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{currentPhase.label}</p>
                <p className="text-[11px] text-white/40 truncate">{currentPhase.detail}</p>
              </div>
              {currentPhase.id === "done" && (
                <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
              )}
            </motion.div>
          </SafeAnimatePresence>
        </div>

        {/* Dynamic content area — changes per phase */}
        <div className="px-4 sm:px-5 pb-4 h-[240px] sm:h-[300px] lg:h-[340px] overflow-hidden">
          <SafeAnimatePresence mode="wait">
            {/* Upload phase — show PDF thumbnail */}
            {currentPhase.id === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]"
              >
                <div className="w-12 h-16 rounded-lg bg-white/[0.08] flex items-center justify-center flex-shrink-0 border border-white/[0.08]">
                  <FileText className="w-5 h-5 text-white/30" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-white/80 truncate">Structural_Set_Rev3.pdf</p>
                  <p className="text-[10px] text-white/35 mt-0.5">12 pages • 24.8 MB</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <motion.div
                      className="h-1 rounded-full bg-primary flex-1"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2, ease: "easeOut" }}
                    />
                    <span className="text-[9px] text-white/30">100%</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Scan phase — show page thumbnails being scanned */}
            {currentPhase.id === "scan" && (
              <motion.div
                key="scan"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="grid grid-cols-4 gap-2"
              >
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="aspect-[3/4] rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center relative overflow-hidden"
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.15 }}
                  >
                    <img
                      src={SHEETS[i].src}
                      alt=""
                      aria-hidden="true"
                      decoding="async"
                      width={768}
                      height={1024}
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                      className="absolute inset-0 w-full h-full object-cover opacity-80"
                    />
                    <span className="absolute bottom-0.5 left-1 text-[7px] text-white/80 font-mono bg-black/60 px-1 rounded-sm">{SHEETS[i].code}</span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent"
                      initial={{ y: "-100%" }}
                      animate={{ y: "100%" }}
                      transition={{ duration: 1.2, delay: i * 0.15, ease: "easeInOut" }}
                    />
                    {i < 4 && (
                      <motion.div
                        className="absolute top-1 right-1"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.15 + 0.8 }}
                      >
                        <CheckCircle className="w-2.5 h-2.5 text-green-400/80" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Extract phase — show line items appearing */}
            {currentPhase.id === "extract" && (
              <motion.div
                key="extract"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-1.5"
              >
                {EXTRACTED_ITEMS.map((item, i) => (
                  <motion.div
                    key={item.label}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.3 }}
                  >
                    <item.icon className="w-3 h-3 text-white/25 flex-shrink-0" />
                    <span className="text-[11px] text-white/60 flex-1 truncate">{item.label}</span>
                    <span className="text-[10px] font-mono text-white/80 flex-shrink-0">{item.qty}</span>
                    <span className={`text-[9px] font-mono flex-shrink-0 ${
                      item.confidence >= 95 ? "text-green-400/70" : item.confidence >= 90 ? "text-amber-400/70" : "text-orange-400/70"
                    }`}>
                      {item.confidence}%
                    </span>
                  </motion.div>
                ))}
                <div className="flex items-center justify-between pt-1 px-1">
                  <span className="text-[10px] text-white/25">{extractCount} / 142 items</span>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5 text-amber-400/50" />
                    <span className="text-[9px] text-amber-400/50">3 flagged for review</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Estimate phase — pricing summary */}
            {currentPhase.id === "estimate" && (
              <motion.div
                key="estimate"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-2"
              >
                {[
                  { trade: "Concrete & Formwork", amount: "$284,500" },
                  { trade: "Steel & Reinforcement", amount: "$167,200" },
                  { trade: "Waterproofing", amount: "$42,800" },
                ].map((row, i) => (
                  <motion.div
                    key={row.trade}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.25 }}
                  >
                    <span className="text-[11px] text-white/60 truncate">{row.trade}</span>
                    <span className="text-xs font-mono text-white/90 font-medium flex-shrink-0">{row.amount}</span>
                  </motion.div>
                ))}
                <motion.div
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/20"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <span className="text-xs font-semibold text-white/80">Draft Total</span>
                  <span className="text-sm font-mono text-primary font-bold">$494,500</span>
                </motion.div>
              </motion.div>
            )}

            {/* Done phase — success summary */}
            {currentPhase.id === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-2 space-y-2"
              >
                <motion.div
                  className="w-10 h-10 rounded-full bg-green-400/15 flex items-center justify-center mx-auto"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                >
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </motion.div>
                <div>
                  <p className="text-sm font-semibold text-white">Draft Estimate Complete</p>
                  <p className="text-[11px] text-white/40 mt-0.5">142 items • 6 trades • 3 flags</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Time", value: "3:12" },
                    { label: "Confidence", value: "94%" },
                    { label: "vs Manual", value: "47x faster" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center px-2 py-1 rounded-lg bg-white/[0.04]">
                      <p className="text-[10px] text-white/30">{stat.label}</p>
                      <p className="text-xs font-mono text-primary font-semibold">{stat.value}</p>
                    </div>
                  ))}
                </div>
                {/* Human verification — review the flagged items before the draft is locked */}
                <div className="pt-0.5">
                  <p className="text-[9px] font-mono uppercase tracking-[0.14em] text-white/30 mb-1.5">
                    Human verification — 3 flagged items
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {VERIFICATION_ACTIONS.map((action, i) => (
                      <motion.button
                        key={action.label}
                        type="button"
                        onClick={() => {
                          setVerified(action.confirm);
                          setVerifyTick((t) => t + 1); // re-hold the final step
                        }}
                        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        whileTap={{ scale: 0.94 }}
                        transition={
                          reduceMotion
                            ? { duration: 0.2, delay: i * 0.08 }
                            : { type: "spring", stiffness: 420, damping: 18, delay: 0.12 + i * 0.16 }
                        }
                        className={`relative flex flex-col items-center justify-center gap-0.5 min-h-[44px] px-1 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] active:bg-white/[0.12] touch-manipulation ${action.className}`}
                        aria-label={`${action.label} flagged items`}
                      >
                        {/* gentle flash so the visitor notices the control */}
                        {!reduceMotion && (
                          <motion.span
                            aria-hidden="true"
                            className="pointer-events-none absolute -inset-px rounded-lg ring-2 ring-primary/70 shadow-lg shadow-primary/35"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0, 1, 0] }}
                            transition={{
                              duration: 1.5,
                              times: [0, 0.12, 0.3, 0.42, 0.6],
                              delay: 0.55 + i * 0.16,
                              repeat: Infinity,
                              repeatDelay: 2.4,
                              ease: "easeOut",
                            }}
                          />
                        )}
                        <action.icon className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-medium text-white/70 leading-none">{action.label}</span>
                      </motion.button>
                    ))}
                  </div>
                  <SafeAnimatePresence mode="wait">
                    {verified && (
                      <motion.p
                        key={verified}
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-[10px] text-green-400/80 mt-1.5"
                        role="status"
                      >
                        ✓ {verified}
                      </motion.p>
                    )}
                  </SafeAnimatePresence>
                </div>
              </motion.div>
            )}
          </SafeAnimatePresence>
        </div>

        {/* CTA to the workflow page — appears once the demo reaches its final step, then stays */}
        <SafeAnimatePresence mode="wait">
          {hasCompleted && (
            <motion.div
              key="workflow-cta"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 sm:px-5 pt-1 pb-3">
                <Link
                  to="/products/use-cases"
                  className="flex items-center justify-center gap-2 w-full min-h-[44px] rounded-xl bg-primary text-primary-foreground text-sm font-semibold touch-manipulation active:scale-[0.98] transition-transform"
                >
                  Learn more
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          )}
        </SafeAnimatePresence>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-t border-white/[0.08]">
          <span className="text-[10px] text-white/25">Human + AI Workflow</span>
          <span className="text-[10px] text-white/25">PDF → Draft Estimate</span>
        </div>

      </div>

    </motion.div>
  );
};

export default HeroDemoPreview;
