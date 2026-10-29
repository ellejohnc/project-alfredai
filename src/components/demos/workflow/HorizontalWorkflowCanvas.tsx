import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { Plus, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type WorkflowNode = {
  id: string;
  type: "trigger" | "action" | "condition";
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  status: "pending" | "active" | "complete";
};

interface HorizontalWorkflowCanvasProps {
  nodes: WorkflowNode[];
  getIconComponent: (iconName: string) => React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  workflowActive: boolean;
}

export function HorizontalWorkflowCanvas({ 
  nodes, 
  getIconComponent,
  workflowActive 
}: HorizontalWorkflowCanvasProps) {
  if (nodes.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex items-center gap-0 min-w-max px-4 py-8">
        <AnimatePresence mode="popLayout">
          {nodes.map((node, index) => {
            const IconComponent = getIconComponent(node.icon);
            const isCondition = node.type === "condition";
            
            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, x: -20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 300 }}
                className="flex items-center"
              >
                {/* Node */}
                <div className="flex flex-col items-center relative">
                  {/* Node Card */}
                  <motion.div
                    className={cn(
                      "relative flex flex-col items-center p-3 rounded-xl border-2 shadow-lg transition-all backdrop-blur-sm bg-card",
                      isCondition ? "rotate-45 w-16 h-16 sm:w-20 sm:h-20" : "w-20 h-20 sm:w-24 sm:h-24",
                      node.status === "complete" 
                        ? "border-primary/50 shadow-primary/20" 
                        : "border-border/70"
                    )}
                    whileHover={{ scale: 1.05 }}
                  >
                    {/* Icon container */}
                    <div 
                      className={cn(
                        "flex items-center justify-center rounded-lg shadow-md",
                        isCondition 
                          ? "-rotate-45 w-8 h-8 sm:w-10 sm:h-10" 
                          : "w-10 h-10 sm:w-12 sm:h-12"
                      )}
                      style={{ 
                        backgroundColor: `${node.color}15`,
                        border: `1px solid ${node.color}40`
                      }}
                    >
                      <IconComponent 
                        className={cn(
                          isCondition ? "w-4 h-4 sm:w-5 sm:h-5" : "w-5 h-5 sm:w-6 sm:h-6"
                        )} 
                        style={{ color: node.color }} 
                      />
                    </div>
                    
                    {/* Completed checkmark */}
                    {node.status === "complete" && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={cn(
                          "absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center",
                          isCondition && "-rotate-45"
                        )}
                      >
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                    
                    {/* Add button indicator */}
                    {!isCondition && (
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-muted border border-border flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                        <Plus className="w-2 h-2 text-muted-foreground" />
                      </div>
                    )}
                  </motion.div>
                  
                  {/* Label below node */}
                  <div className={cn(
                    "mt-3 text-center max-w-24 sm:max-w-28",
                    isCondition && "mt-5"
                  )}>
                    <p className="text-[10px] sm:text-xs font-semibold text-foreground truncate">
                      {node.title}
                    </p>
                    <p className="text-[8px] sm:text-[10px] text-muted-foreground truncate">
                      {node.subtitle}
                    </p>
                  </div>
                  
                  {/* Type badge */}
                  <span className={cn(
                    "absolute -top-3 text-[8px] px-1.5 py-0.5 rounded-md font-medium uppercase tracking-wide",
                    node.type === "trigger" && "bg-primary/10 text-primary border border-primary/20",
                    node.type === "action" && "bg-purple-500/10 text-purple-500 border border-purple-500/20",
                    node.type === "condition" && "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  )}>
                    {node.type}
                  </span>
                </div>
                
                {/* Connector line */}
                {index < nodes.length - 1 && (
                  <div className="flex items-center mx-2 sm:mx-4">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: index * 0.1 + 0.15, duration: 0.3 }}
                      className="relative"
                    >
                      {/* Dashed line */}
                      <svg width="40" height="20" className="sm:w-16">
                        <motion.line
                          x1="0"
                          y1="10"
                          x2="40"
                          y2="10"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          className="text-muted-foreground/50"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
                        />
                        {/* Arrow head */}
                        <motion.polygon
                          points="35,5 40,10 35,15"
                          fill="currentColor"
                          className="text-muted-foreground/50"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.1 + 0.4 }}
                        />
                      </svg>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {/* Add more placeholder */}
        {!workflowActive && nodes.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: nodes.length * 0.1 + 0.3 }}
            className="flex items-center ml-2 sm:ml-4"
          >
            {/* Connector */}
            <svg width="40" height="20" className="mr-2 sm:mr-4 sm:w-16">
              <line
                x1="0"
                y1="10"
                x2="40"
                y2="10"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="text-border"
              />
            </svg>
            
            {/* Placeholder node */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed border-border/50 bg-muted/10 flex items-center justify-center">
                <Plus className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <p className="mt-3 text-[10px] text-muted-foreground text-center max-w-20">
                Ask AI to add step
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
