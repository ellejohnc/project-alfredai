import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface ComparisonItem {
  label: string;
  before: string;
  after: string;
  improvement?: string;
}

interface BeforeAfterCompareProps {
  items: ComparisonItem[];
  title?: string;
  showAnimation?: boolean;
}

export function BeforeAfterCompare({ 
  items, 
  title,
  showAnimation = true 
}: BeforeAfterCompareProps) {
  return (
    <div className="space-y-4">
      {title && (
        <h4 className="text-sm font-medium text-muted-foreground text-center uppercase tracking-wide">
          {title}
        </h4>
      )}
      
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3">
        {/* Headers */}
        <div className="text-center p-3 rounded border border-border bg-muted/30">
          <span className="text-sm font-medium text-muted-foreground">Manual Review</span>
        </div>
        <div className="w-8" />
        <div className="text-center p-3 rounded border border-primary/30 bg-primary/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_ease-in-out_infinite]" />
          <span className="text-sm font-medium text-primary relative z-10">Assisted by alfred ai</span>
        </div>

        {/* Rows */}
        {items.map((item, index) => (
          <motion.div
            key={item.label}
            initial={showAnimation ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="contents"
          >
            {/* Before */}
            <div className="flex flex-col p-4 rounded border border-border">
              <span className="text-xs text-muted-foreground mb-1">{item.label}</span>
              <span className="text-lg font-semibold text-muted-foreground line-through">{item.before}</span>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.1 }}
              >
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </div>

            {/* After */}
            <div className="flex flex-col p-4 rounded border border-primary/30 bg-primary/5">
              <span className="text-xs text-muted-foreground mb-1">{item.label}</span>
              <span className="text-lg font-semibold text-foreground">{item.after}</span>
              {item.improvement && (
                <span className="text-xs text-primary mt-1">{item.improvement}</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}