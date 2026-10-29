import { useState } from "react";
import { motion } from "framer-motion";
import { SafeAnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  Brain, Workflow, Database, Plug, Lock,
  Monitor, ChevronDown, ArrowDown, Cloud, Server, Zap
} from "lucide-react";

interface Layer {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
  components: string[];
  metrics?: { label: string; value: string }[];
  details?: string;
}

const layers: Layer[] = [
  {
    id: "presentation",
    name: "Presentation Layer",
    icon: Monitor,
    color: "from-blue-500/20 to-blue-600/20",
    description: "User interfaces across all touchpoints",
    components: ["Web Dashboard", "Mobile Apps", "Browser Extensions", "API Portal"],
    metrics: [
      { label: "Platforms", value: "5+" },
      { label: "Response", value: "<50ms" },
    ],
    details: "Our presentation layer delivers consistent experiences across web, mobile, and API interfaces. Built with React and React Native for optimal performance, it features real-time updates, offline support, and accessibility compliance (WCAG 2.1 AA).",
  },
  {
    id: "ai-engines",
    name: "AI Engine Layer",
    icon: Brain,
    color: "from-purple-500/20 to-purple-600/20",
    description: "Four specialised AI engines working in concert",
    components: ["Knowledge Intelligence", "Business Operations", "Customer Experience", "Butler Assistant"],
    metrics: [
      { label: "Models", value: "12+" },
      { label: "Accuracy", value: "99.2%" },
    ],
    details: "Our AI engines combine proprietary models with fine-tuned open-source foundations. Each engine specialises in different domains—from document understanding to workflow optimisation—while sharing context through our orchestration layer.",
  },
  {
    id: "orchestration",
    name: "Orchestration Layer",
    icon: Workflow,
    color: "from-amber-500/20 to-amber-600/20",
    description: "Workflow engine and event processing",
    components: ["Task Scheduler", "Event Bus", "Queue Manager", "State Machine"],
    metrics: [
      { label: "Throughput", value: "10K/s" },
      { label: "Latency", value: "<10ms" },
    ],
    details: "The orchestration layer coordinates all AI operations using an event-driven architecture. It manages complex multi-step workflows, handles retries and error recovery, and ensures tasks are processed in the optimal order.",
  },
  {
    id: "data",
    name: "Data Layer",
    icon: Database,
    color: "from-green-500/20 to-green-600/20",
    description: "Secure storage and real-time sync",
    components: ["Vector DB", "Document Store", "Cache Layer", "Search Index"],
    metrics: [
      { label: "Storage", value: "Unlimited" },
      { label: "Sync", value: "Real-time" },
    ],
    details: "Our data layer combines vector databases for semantic search, document stores for structured data, and distributed caching for performance. Real-time sync ensures all connected systems stay up-to-date within milliseconds.",
  },
  {
    id: "integration",
    name: "Integration Layer",
    icon: Plug,
    color: "from-cyan-500/20 to-cyan-600/20",
    description: "Connect to any business system",
    components: ["REST APIs", "GraphQL", "Webhooks", "OAuth 2.0"],
    metrics: [
      { label: "Connectors", value: "100+" },
      { label: "Uptime", value: "99.9%" },
    ],
    details: "Pre-built connectors for popular business tools plus a flexible API for custom integrations. Supports bidirectional sync, webhook notifications, and OAuth 2.0 authentication with major identity providers.",
  },
  {
    id: "security",
    name: "Security Layer",
    icon: Lock,
    color: "from-red-500/20 to-red-600/20",
    description: "End-to-end protection across all layers",
    components: ["Encryption", "Identity Management", "Audit Logs", "Compliance"],
    metrics: [
      { label: "Encryption", value: "AES-256" },
      { label: "Certified", value: "SOC 2" },
    ],
    details: "Enterprise-grade security with end-to-end encryption, role-based access control, and comprehensive audit logging. Compliant with SOC 2 Type II, GDPR, and industry-specific regulations.",
  },
];

// Connection line between layers with animated data flow
const ConnectionLine = ({ index }: { index: number }) => (
  <div className="flex justify-center py-1">
    <motion.div
      initial={{ height: 0 }}
      animate={{ height: 24 }}
      transition={{ delay: index * 0.15 + 0.2, duration: 0.3 }}
      className="w-0.5 bg-gradient-to-b from-primary/40 to-primary/20 relative overflow-hidden"
    >
      <motion.div
        animate={{ y: ["-100%", "200%"] }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity, 
          ease: "linear",
          delay: index * 0.3
        }}
        className="absolute left-0 right-0 h-3 bg-gradient-to-b from-transparent via-primary to-transparent"
      />
    </motion.div>
  </div>
);

export const LayeredArchitectureDiagram = () => {
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);

  const toggleLayer = (layerId: string) => {
    setExpandedLayer(expandedLayer === layerId ? null : layerId);
  };

  return (
    <div className="relative">
      {/* Main diagram */}
      <div className="space-y-0">
        {layers.map((layer, index) => {
          const Icon = layer.icon;
          const isExpanded = expandedLayer === layer.id;
          
          return (
            <div key={layer.id}>
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                className="relative cursor-pointer group"
                onClick={() => toggleLayer(layer.id)}
              >
                {/* Layer card */}
                <motion.div
                  layout
                  animate={{ 
                    scale: isExpanded ? 1.02 : 1,
                    zIndex: isExpanded ? 10 : 1 
                  }}
                  transition={{ duration: 0.2 }}
                  className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${
                    isExpanded 
                      ? "border-primary shadow-lg shadow-primary/10" 
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${layer.color} opacity-50`} />

                  <div className="relative p-4 md:p-6">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <motion.div 
                        animate={{ rotate: isExpanded ? 360 : 0 }}
                        transition={{ duration: 0.5 }}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isExpanded ? "bg-primary text-primary-foreground" : "bg-background/80 text-primary"
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </motion.div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{layer.name}</h3>
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ChevronDown className="w-4 h-4 text-primary" />
                          </motion.div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{layer.description}</p>

                        {/* Components grid */}
                        <div className="flex flex-wrap gap-2">
                          {layer.components.map((component, cIndex) => (
                            <motion.span
                              key={component}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 + cIndex * 0.05 + 0.3 }}
                              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                                isExpanded 
                                  ? "bg-primary/20 text-primary" 
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {component}
                            </motion.span>
                          ))}
                        </div>
                      </div>

                      {/* Metrics */}
                      {layer.metrics && (
                        <div className="hidden md:flex gap-4 shrink-0">
                          {layer.metrics.map((metric) => (
                            <div key={metric.label} className="text-center">
                              <div className={`text-lg font-bold ${isExpanded ? "text-primary" : "text-foreground"}`}>
                                {metric.value}
                              </div>
                              <div className="text-xs text-muted-foreground">{metric.label}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Expanded details */}
                    <SafeAnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 mt-4 border-t border-border/50">
                            {/* Mobile metrics */}
                            <div className="flex gap-4 mb-4 md:hidden">
                              {layer.metrics?.map((metric) => (
                                <div key={metric.label} className="text-center">
                                  <div className="text-lg font-bold text-primary">{metric.value}</div>
                                  <div className="text-xs text-muted-foreground">{metric.label}</div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Details text */}
                            {layer.details && (
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {layer.details}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </SafeAnimatePresence>
                  </div>
                </motion.div>
              </motion.div>

              {/* Connection line between layers */}
              {index < layers.length - 1 && (
                <ConnectionLine index={index} />
              )}
            </div>
          );
        })}
      </div>

      {/* Side gradient indicator */}
      <div className="absolute -left-4 top-0 bottom-0 w-1 hidden lg:block">
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="h-full w-full bg-gradient-to-b from-blue-500/30 via-purple-500/30 via-amber-500/30 via-green-500/30 via-cyan-500/30 to-red-500/30 rounded-full origin-top"
        />
      </div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="mt-8 p-4 bg-muted/30 rounded-xl border border-border"
      >
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-primary"
            />
            <span className="text-muted-foreground">Data Flow</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowDown className="w-4 h-4 text-primary/60" />
            <span className="text-muted-foreground">Request Path</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              <Cloud className="w-4 h-4 text-blue-500/60" />
              <Server className="w-4 h-4 text-green-500/60" />
              <Zap className="w-4 h-4 text-amber-500/60" />
            </div>
            <span className="text-muted-foreground">Click to explore</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LayeredArchitectureDiagram;