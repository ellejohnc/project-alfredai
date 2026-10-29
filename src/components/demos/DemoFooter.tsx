import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { Calendar, Play, ChevronRight, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Demo {
  id: string;
  title: string;
  description: string;
  category: string;
  topics: string[];
  icon: LucideIcon;
}

interface DemoFooterProps {
  currentDemoId: string;
  demos: Demo[];
  onBookDemo: () => void;
  onSelectDemo: (demoId: string) => void;
  demoCompleted?: boolean;
}

// Get related demos based on shared categories and topics
const getRelatedDemos = (currentDemoId: string, demos: Demo[]): Demo[] => {
  const currentDemo = demos.find(d => d.id === currentDemoId);
  if (!currentDemo) return [];

  // Score each demo by relevance
  const scored = demos
    .filter(d => d.id !== currentDemoId)
    .map(demo => {
      let score = 0;
      
      // Same category = high relevance
      if (demo.category === currentDemo.category) {
        score += 10;
      }
      
      // Shared topics
      const sharedTopics = demo.topics.filter(t => currentDemo.topics.includes(t));
      score += sharedTopics.length * 3;
      
      // Category affinity mapping for cross-category recommendations
      const categoryAffinity: Record<string, string[]> = {
        "construction": ["inspection", "proposals", "contracts", "procurement"],
        "inspection": ["construction", "property"],
        "proposals": ["contracts", "sales", "finance"],
        "contracts": ["proposals", "procurement"],
        "procurement": ["contracts", "construction", "operations"],
        "property": ["construction", "inspection", "voice"],
        "recruitment": ["operations"],
        "sales": ["cx", "knowledge"],
        "finance": ["proposals", "operations"],
        "knowledge": ["operations", "cx"],
        "operations": ["knowledge", "workflow", "finance"],
        "workflow": ["operations", "knowledge"],
        "cx": ["sales", "voice", "butler"],
        "butler": ["voice", "cx"],
        "voice": ["butler", "property", "cx"],
        "healthcare": ["cx", "voice"],
        "insurance": ["finance", "contracts", "cx"],
        "marketplace": ["workflow", "operations"],
      };
      
      const relatedCategories = categoryAffinity[currentDemo.category] || [];
      if (relatedCategories.includes(demo.category)) {
        score += 5;
      }
      
      return { demo, score };
    })
    .sort((a, b) => b.score - a.score);

  // Return top 2 related demos
  return scored.slice(0, 2).map(s => s.demo);
};

export const DemoFooter = ({ 
  currentDemoId, 
  demos, 
  onBookDemo, 
  onSelectDemo,
  demoCompleted = false
}: DemoFooterProps) => {
  const relatedDemos = getRelatedDemos(currentDemoId, demos);
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-expand when demo is completed
  useEffect(() => {
    if (demoCompleted && !isExpanded) {
      setIsExpanded(true);
    }
  }, [demoCompleted]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {!isExpanded ? (
        <motion.div
          key="collapsed"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full group flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 hover:from-primary/10 hover:via-primary/15 hover:to-primary/10 border border-primary/20 hover:border-primary/30 rounded-lg transition-all"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {demoCompleted ? "Ready to see this live?" : "Book an Impact Conversation"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-primary">
              <span className="text-xs opacity-70 group-hover:opacity-100 transition-opacity">Expand</span>
              <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
            </div>
          </button>
        </motion.div>
      ) : (
        <motion.div
          key="expanded"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="pt-4 border-t border-border"
        >
          {/* Collapse button */}
          <div className="flex justify-end mb-3">
            <button
              onClick={() => setIsExpanded(false)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Collapse</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Compact Book Demo CTA */}
          <div className={cn(
            "rounded-lg p-4 text-center transition-all",
            demoCompleted 
              ? "bg-gradient-to-br from-primary/15 via-primary/10 to-transparent border border-primary/20" 
              : "bg-muted/30 border border-border/50"
          )}>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              {demoCompleted ? "Impressed? Let's talk." : "Ready for your Impact Conversation?"}
            </h3>
            <p className="text-xs text-muted-foreground mb-3 max-w-md mx-auto">
              Book an Impact Conversation for your business.
            </p>
            <Button 
              onClick={onBookDemo}
              size="sm"
              className={cn(
                "gap-2 shadow-md",
                demoCompleted && "animate-pulse shadow-primary/30"
              )}
            >
              <Calendar className="w-3.5 h-3.5" />
              Book an Impact Conversation
            </Button>
          </div>

          {/* Related Demos - more compact */}
          {relatedDemos.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5" />
                Related Demos
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {relatedDemos.map((demo) => {
                  const Icon = demo.icon;
                  return (
                    <motion.button
                      key={demo.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onSelectDemo(demo.id)}
                      className="group flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border/50 hover:border-primary/30 transition-all text-left"
                    >
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <h5 className="font-medium text-foreground text-xs truncate group-hover:text-primary transition-colors">
                            {demo.title}
                          </h5>
                          <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DemoFooter;
