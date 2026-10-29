import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  Brain, 
  Workflow, 
  MessageSquare, 
  Bot, 
  Layers,
  CheckCircle2,
  ArrowRight,
  Zap,
  Database,
  Users,
  Shield,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";

type Engine = {
  id: string;
  name: string;
  description: string;
  icon: typeof Brain;
  color: string;
  features: string[];
  status: "idle" | "active" | "complete";
};

const engines: Engine[] = [
  {
    id: "knowledge",
    name: "Knowledge Engine",
    description: "Intelligent document search and retrieval",
    icon: Brain,
    color: "from-blue-500 to-indigo-600",
    features: ["Document Search", "Q&A", "Citations", "Synthesis"],
    status: "idle"
  },
  {
    id: "operations",
    name: "Operations Engine",
    description: "Workflow automation and orchestration",
    icon: Workflow,
    color: "from-emerald-500 to-teal-600",
    features: ["Task Management", "Approvals", "Automation", "Reporting"],
    status: "idle"
  },
  {
    id: "cx",
    name: "CX Engine",
    description: "Customer experience and support",
    icon: MessageSquare,
    color: "from-violet-500 to-purple-600",
    features: ["Multi-channel", "Sentiment", "Personalization", "24/7 Support"],
    status: "idle"
  },
  {
    id: "butler",
    name: "Butler Engine",
    description: "Voice-first executive assistant",
    icon: Bot,
    color: "from-orange-500 to-amber-600",
    features: ["Voice AI", "Scheduling", "Reminders", "Handsfree"],
    status: "idle"
  },
];

const integrationLogos = [
  { name: "Salesforce", icon: Database },
  { name: "Slack", icon: MessageSquare },
  { name: "Google Workspace", icon: Globe },
  { name: "Microsoft 365", icon: Layers },
];

export default function PlatformOverviewDemo() {
  const [activeEngine, setActiveEngine] = useState<number>(0);
  const [enginesState, setEnginesState] = useState<Engine[]>(engines);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [showConnection, setShowConnection] = useState(false);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setActiveEngine(prev => {
        const next = (prev + 1) % engines.length;
        
        // Update engine states
        setEnginesState(current => 
          current.map((engine, idx) => ({
            ...engine,
            status: idx === next ? "active" : idx < next ? "complete" : "idle"
          }))
        );

        // Show connection animation at certain points
        if (next === 2) {
          setShowConnection(true);
          setTimeout(() => setShowConnection(false), 1500);
        }

        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30">
              <Layers className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">alfred ai Platform</h3>
              <p className="text-xs text-muted-foreground">Complete ecosystem overview</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Enterprise Ready</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* AI Engines Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {enginesState.map((engine, index) => {
            const Icon = engine.icon;
            const isActive = index === activeEngine;
            
            return (
              <motion.div
                key={engine.id}
                animate={{
                  scale: isActive ? 1.02 : 1,
                  borderColor: isActive ? "hsl(var(--primary))" : "hsl(var(--border))"
                }}
                className={cn(
                  "relative p-4 rounded-xl border-2 transition-all cursor-pointer",
                  isActive ? "bg-primary/5 shadow-lg" : "bg-muted/30"
                )}
                onClick={() => {
                  setActiveEngine(index);
                  setIsAutoPlaying(false);
                }}
              >
                {/* Status indicator */}
                <div className="absolute top-3 right-3">
                  {engine.status === "complete" && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                  {engine.status === "active" && (
                    <Zap className="w-4 h-4 text-primary animate-pulse" />
                  )}
                </div>

                <div className={cn(
                  "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center mb-3",
                  engine.color
                )}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                
                <h4 className="font-semibold text-sm text-foreground mb-1">{engine.name}</h4>
                <p className="text-xs text-muted-foreground mb-3">{engine.description}</p>
                
                {/* Features */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-wrap gap-1.5"
                    >
                      {engine.features.map((feature, i) => (
                        <motion.span
                          key={feature}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full font-medium"
                        >
                          {feature}
                        </motion.span>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Connection Animation */}
        <AnimatePresence>
          {showConnection && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20"
            >
              <div className="flex items-center justify-center gap-3 text-sm">
                <Brain className="w-5 h-5 text-primary" />
                <motion.div
                  animate={{ x: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <ArrowRight className="w-4 h-4 text-primary" />
                </motion.div>
                <MessageSquare className="w-5 h-5 text-primary" />
                <span className="text-foreground font-medium ml-2">
                  Engines communicate seamlessly
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Integrations */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-foreground">Connected Integrations</span>
            <span className="text-xs text-muted-foreground">200+ available</span>
          </div>
          <div className="flex items-center gap-3">
            {integrationLogos.map((integration, index) => (
              <motion.div
                key={integration.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex-1 p-3 rounded-lg bg-background border border-border flex items-center justify-center gap-2"
              >
                <integration.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground hidden sm:inline">{integration.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="px-6 py-4 bg-muted/30 border-t border-border grid grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-lg font-bold text-foreground tabular-nums">4</div>
          <div className="text-[10px] text-muted-foreground">AI Engines</div>
        </div>
        <div>
          <div className="text-lg font-bold text-foreground tabular-nums">200+</div>
          <div className="text-[10px] text-muted-foreground">Integrations</div>
        </div>
        <div>
          <div className="text-lg font-bold text-green-500 tabular-nums">99.9%</div>
          <div className="text-[10px] text-muted-foreground">Uptime</div>
        </div>
        <div>
          <div className="text-lg font-bold text-primary">SOC 2</div>
          <div className="text-[10px] text-muted-foreground">Certified</div>
        </div>
      </div>
    </div>
  );
}
