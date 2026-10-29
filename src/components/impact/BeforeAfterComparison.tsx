import { useState, useRef, useEffect, useCallback, memo } from "react";
import { motion, useInView } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  Users, Bot, Clock, TrendingUp, AlertCircle, CheckCircle2,
  Zap, ArrowRight, Sparkles, BrainCircuit, Play, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import { useChatContext } from "@/contexts/ChatContext";
import { useHaptics } from "@/hooks/useHaptics";

const CYCLE_DURATION = 5000; // 5 seconds

interface ComparisonMetric {
  label: string;
  before: { value: number; suffix: string; status: "warning" | "neutral" };
  after: { value: number; suffix: string; status: "success" };
}

const metrics: ComparisonMetric[] = [
  {
    label: "Weekly Hours on Repetitive Tasks",
    before: { value: 32, suffix: " hrs", status: "warning" },
    after: { value: 5, suffix: " hrs", status: "success" },
  },
  {
    label: "Response Time to Customers",
    before: { value: 4, suffix: " hrs", status: "warning" },
    after: { value: 12, suffix: " min", status: "success" },
  },
  {
    label: "Team Capacity for Strategic Work",
    before: { value: 35, suffix: "%", status: "neutral" },
    after: { value: 82, suffix: "%", status: "success" },
  },
  {
    label: "Data Entry Errors per Month",
    before: { value: 47, suffix: "", status: "warning" },
    after: { value: 3, suffix: "", status: "success" },
  },
];

const workflowSteps = {
  before: [
    { icon: Users, label: "Manual data entry", status: "slow" },
    { icon: Clock, label: "Wait for approval", status: "bottleneck" },
    { icon: AlertCircle, label: "Error checking", status: "error-prone" },
    { icon: Users, label: "Re-work & corrections", status: "slow" },
  ],
  after: [
    { icon: Bot, label: "AI captures data", status: "fast" },
    { icon: BrainCircuit, label: "Smart routing", status: "instant" },
    { icon: CheckCircle2, label: "AI validates", status: "accurate" },
    { icon: Sparkles, label: "Done automatically", status: "complete" },
  ],
};

const BeforeAfterComparison = memo(() => {
  const [showAfter, setShowAfter] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const cycleTimeout = useRef<NodeJS.Timeout | null>(null);
  const { openBooking } = useChatContext();
  const { vibrate } = useHaptics();

  const handleBookClick = () => {
    vibrate('medium');
    openBooking("page_cta");
  };

  const clearTimers = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    if (cycleTimeout.current) {
      clearTimeout(cycleTimeout.current);
      cycleTimeout.current = null;
    }
  }, []);

  const startAutoPlay = useCallback(() => {
    clearTimers();
    setProgress(0);
    
    // Update progress every 50ms for smooth animation
    const updateInterval = 50;
    let elapsed = 0;
    
    progressInterval.current = setInterval(() => {
      elapsed += updateInterval;
      const newProgress = (elapsed / CYCLE_DURATION) * 100;
      setProgress(Math.min(newProgress, 100));
    }, updateInterval);

    // Toggle state after CYCLE_DURATION
    cycleTimeout.current = setTimeout(() => {
      setShowAfter(prev => !prev);
      startAutoPlay(); // Restart the cycle
    }, CYCLE_DURATION);
  }, [clearTimers]);

  // Handle auto-play
  useEffect(() => {
    if (isAutoPlaying && isInView) {
      startAutoPlay();
    } else {
      clearTimers();
      setProgress(0);
    }
    
    return clearTimers;
  }, [isAutoPlaying, isInView, startAutoPlay, clearTimers]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keys when component is in view
      if (!isInView) return;
      
      // Check if focus is on an input or textarea
      const activeElement = document.activeElement;
      if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handleManualToggle(false);
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleManualToggle(true);
          break;
        case ' ':
          e.preventDefault();
          toggleAutoPlay();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInView, isAutoPlaying, startAutoPlay]);

  // Manual toggle should restart the auto-play cycle
  const handleManualToggle = useCallback((newState: boolean) => {
    setShowAfter(newState);
    if (isAutoPlaying) {
      startAutoPlay(); // Reset the timer when manually toggled
    }
  }, [isAutoPlaying, startAutoPlay]);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying(prev => !prev);
  }, []);

  // Announce state changes for screen readers
  const stateAnnouncement = showAfter 
    ? "Now showing: With AI Agents state" 
    : "Now showing: Before AI Agents state";

  return (
    <div 
      ref={ref} 
      className="relative"
      role="region"
      aria-label="Before and after AI agent deployment comparison"
    >
      {/* Toggle Header */}
      <div className="flex flex-col items-center mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-primary uppercase tracking-wider">
            Interactive Comparison
          </span>
        </div>
        <h3 className="text-2xl md:text-3xl font-semibold text-foreground text-center mb-6">
          See the Transformation
        </h3>
        
        {/* Toggle Switch - no external progress ring */}
        <div className="relative">
          <div className="relative bg-muted rounded-full p-1 flex items-center">
            <motion.div
              className="absolute h-[calc(100%-8px)] bg-gradient-to-r from-primary to-secondary rounded-full shadow-lg"
              initial={false}
              animate={{
                x: showAfter ? "100%" : "0%",
                width: "50%",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ left: 4 }}
            />
            <button
              onClick={() => handleManualToggle(false)}
              className={`relative z-10 px-6 py-3 rounded-full font-medium transition-colors ${
                !showAfter ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Before AI Agents
              </span>
            </button>
            <button
              onClick={() => handleManualToggle(true)}
              className={`relative z-10 px-6 py-3 rounded-full font-medium transition-colors ${
                showAfter ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                With AI Agents
              </span>
            </button>
          </div>
          
          {/* Auto-play control with inline progress */}
          <div className="flex items-center justify-center mt-4 gap-2">
            <button
              onClick={toggleAutoPlay}
              className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isAutoPlaying 
                  ? "bg-primary/10 text-primary hover:bg-primary/20" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {isAutoPlaying ? (
                <>
                  {/* Small circular progress indicator */}
                  <div className="relative w-3 h-3">
                    <svg className="w-3 h-3 -rotate-90" viewBox="0 0 16 16">
                      <circle
                        cx="8"
                        cy="8"
                        r="6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        opacity="0.3"
                      />
                      <circle
                        cx="8"
                        cy="8"
                        r="6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={2 * Math.PI * 6}
                        strokeDashoffset={(2 * Math.PI * 6) - (progress / 100) * (2 * Math.PI * 6)}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  Auto-playing
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  Auto-play
                </>
              )}
            </button>
            {isAutoPlaying && (
              <motion.span 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs text-muted-foreground"
              >
                {Math.ceil((CYCLE_DURATION - (progress / 100) * CYCLE_DURATION) / 1000)}s
              </motion.span>
            )}
            <span className="text-xs text-muted-foreground/60 hidden sm:inline">
              ← → to toggle • Space to {isAutoPlaying ? 'pause' : 'play'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Comparison Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Workflow Visualization */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border p-6 relative overflow-hidden"
        >
          <h4 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Workflow Pipeline
          </h4>
          
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={showAfter ? "after" : "before"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {(showAfter ? workflowSteps.after : workflowSteps.before).map((step, index) => (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center ${
                      showAfter 
                        ? "bg-gradient-to-br from-secondary/20 to-primary/20" 
                        : "bg-muted"
                    }`}>
                      <step.icon className={`w-6 h-6 ${
                        showAfter ? "text-secondary" : "text-muted-foreground"
                      }`} />
                      {showAfter && (
                        <motion.div
                          className="absolute inset-0 rounded-xl bg-gradient-to-br from-secondary/30 to-primary/30"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                        />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">{step.label}</div>
                      <div className={`text-xs ${
                        showAfter 
                          ? "text-secondary" 
                          : step.status === "bottleneck" 
                            ? "text-amber-500" 
                            : step.status === "error-prone" 
                              ? "text-destructive" 
                              : "text-muted-foreground"
                      }`}>
                        {showAfter 
                          ? step.status === "fast" ? "⚡ Instant" 
                            : step.status === "instant" ? "🧠 AI-powered" 
                            : step.status === "accurate" ? "✓ 99.9% accurate"
                            : "✨ Autonomous"
                          : step.status === "bottleneck" ? "⏳ Delays common"
                            : step.status === "error-prone" ? "⚠️ Error-prone"
                            : "👤 Manual effort"
                        }
                      </div>
                    </div>
                    
                    {index < 3 && (
                      <ArrowRight className={`w-4 h-4 ${
                        showAfter ? "text-secondary" : "text-muted-foreground/50"
                      }`} />
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Status indicator */}
          <div className={`mt-6 p-4 rounded-xl ${
            showAfter 
              ? "bg-gradient-to-r from-secondary/10 to-primary/10 border border-secondary/20" 
              : "bg-muted/50 border border-border"
          }`}>
            <div className="flex items-center gap-2">
              {showAfter ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-secondary" />
                  <span className="text-sm font-medium text-secondary">AI Agents handle 80% autonomously</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-medium text-amber-500">High manual effort required</span>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Metrics Comparison */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <h4 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Key Metrics
          </h4>
          
          <div className="space-y-6">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <div className="text-sm text-muted-foreground mb-2">{metric.label}</div>
                <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={showAfter ? "after" : "before"}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className={`absolute inset-0 flex items-center justify-between px-4 ${
                        showAfter 
                          ? "bg-gradient-to-r from-secondary/20 to-primary/20" 
                          : metric.before.status === "warning" 
                            ? "bg-amber-500/10" 
                            : "bg-muted"
                      }`}
                    >
                      <span className={`text-2xl font-bold ${
                        showAfter ? "text-secondary" : "text-foreground"
                      }`}>
                        {isInView && (
                          <AnimatedNumber 
                            value={showAfter ? metric.after.value : metric.before.value}
                            suffix={showAfter ? metric.after.suffix : metric.before.suffix}
                            duration={800}
                          />
                        )}
                      </span>
                      
                      {showAfter && (
                        <motion.span
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-xs font-medium text-secondary bg-secondary/20 px-2 py-1 rounded-full"
                        >
                          {metric.label.includes("Error") 
                            ? `${Math.round((1 - metric.after.value / metric.before.value) * 100)}% fewer`
                            : metric.label.includes("Capacity")
                              ? `+${metric.after.value - metric.before.value}%`
                              : metric.label.includes("Response")
                                ? "20x faster"
                                : `${Math.round((1 - metric.after.value / metric.before.value) * 100)}% reduction`
                          }
                        </motion.span>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.6 }}
        className="mt-10 text-center"
      >
        <p className="text-muted-foreground mb-4">
          Ready to see these results in your organization?
        </p>
        <Button
          onClick={handleBookClick}
          className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium glow-pulse min-h-[48px] px-6"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Book an Impact Conversation
        </Button>
      </motion.div>
      {/* Screen reader announcement */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {stateAnnouncement}
      </div>
    </div>
  );
});

BeforeAfterComparison.displayName = 'BeforeAfterComparison';

export default BeforeAfterComparison;
