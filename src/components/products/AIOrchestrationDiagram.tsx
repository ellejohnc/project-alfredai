import { motion } from "framer-motion";
import { Users, Bot, Workflow, Database, Server, ArrowRight, Zap, Activity } from "lucide-react";

const NODES = [
  { id: "people", label: "People", icon: Users, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { id: "agents", label: "AI Agents", icon: Bot, color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  { id: "workflows", label: "Workflows", icon: Workflow, color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  { id: "systems", label: "Systems", icon: Server, color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  { id: "data", label: "Data", icon: Database, color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" },
];

const CONNECTIONS = [
  { from: "people", to: "reo" },
  { from: "agents", to: "reo" },
  { from: "workflows", to: "reo" },
  { from: "systems", to: "reo" },
  { from: "data", to: "reo" },
  { from: "reo", to: "people" },
  { from: "reo", to: "agents" },
  { from: "reo", to: "workflows" },
  { from: "reo", to: "systems" },
  { from: "reo", to: "data" },
];

export const AIOrchestrationDiagram = () => {
  return (
    <div className="relative w-full max-w-4xl mx-auto py-8">
      {/* Central hub */}
      <div className="relative flex items-center justify-center min-h-[400px] md:min-h-[480px]">
        {/* Orbital ring */}
        <motion.div
          className="absolute w-[280px] h-[280px] md:w-[380px] md:h-[380px] rounded-full border border-dashed border-border/50"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />

        {/* Second orbital ring */}
        <motion.div
          className="absolute w-[220px] h-[220px] md:w-[300px] md:h-[300px] rounded-full border border-dotted border-border/30"
          animate={{ rotate: -360 }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
        />

        {/* Connection lines from center to orbital positions */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="currentColor" className="text-muted-foreground/30" />
            </marker>
          </defs>
          {/* Lines will be drawn by the nodes below */}
        </svg>

        {/* Satellite nodes positioned around the center */}
        {NODES.map((node, i) => {
          const angle = (i * 360) / NODES.length - 90; // Start from top
          const radius = 140; // md: 190
          const rad = (angle * Math.PI) / 180;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;
          const Icon = node.icon;

          return (
            <motion.div
              key={node.id}
              className="absolute"
              style={{
                left: "50%",
                top: "50%",
                x: x,
                y: y,
                translateX: "-50%",
                translateY: "-50%",
                zIndex: 2,
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <div className={`flex flex-col items-center gap-2 rounded-2xl border ${node.color} bg-background/80 backdrop-blur-sm px-4 py-3 md:px-5 md:py-4 shadow-sm min-w-[100px] md:min-w-[120px]`}>
                <Icon className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-xs md:text-sm font-semibold whitespace-nowrap">{node.label}</span>
              </div>

              {/* Animated pulse dot pointing toward center */}
              <motion.div
                className="absolute w-2 h-2 rounded-full bg-primary/60"
                style={{
                  left: "50%",
                  top: "50%",
                  translateX: "-50%",
                  translateY: "-50%",
                }}
                animate={{
                  x: [0, -x * 0.6, 0],
                  y: [0, -y * 0.6, 0],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 3 + i * 0.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.3,
                }}
              />
            </motion.div>
          );
        })}

        {/* Center hub — Omega */}
        <motion.div
          className="relative z-10 flex flex-col items-center gap-2 rounded-3xl border-2 border-primary/30 bg-primary/5 px-6 py-5 md:px-8 md:py-6 shadow-lg backdrop-blur-sm"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="relative">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Zap className="w-6 h-6 md:w-7 md:h-7 text-primary" />
            </div>
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500"
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div className="text-center">
            <p className="text-sm md:text-base font-bold text-foreground">Omega</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">Living intelligence</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground">
            <Activity className="w-3 h-3 text-emerald-500" />
            <span>Live</span>
          </div>
        </motion.div>
      </div>

      {/* Data flow legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary/60" />
          <span>Request</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Response</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowRight className="w-3 h-3 text-muted-foreground" />
          <span>Bidirectional sync</span>
        </div>
      </div>
    </div>
  );
};
