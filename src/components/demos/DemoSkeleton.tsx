import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DemoSkeletonProps {
  className?: string;
  variant?: "default" | "compact" | "fullscreen";
}

const shimmerTransition = {
  repeat: Infinity,
  duration: 1.5,
  ease: "linear" as const,
};

export function DemoSkeleton({ className, variant = "default" }: DemoSkeletonProps) {
  const heights = {
    default: "min-h-[500px]",
    compact: "min-h-[300px]",
    fullscreen: "min-h-[600px]",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-card border border-border",
        heights[variant],
        className
      )}
    >
      {/* Header skeleton */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
            <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="p-6 space-y-6">
        {/* Chat-like messages */}
        <div className="flex justify-start">
          <div className="flex gap-3 max-w-[80%]">
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse flex-shrink-0" />
            <div className="space-y-2">
              <div className="h-4 w-64 bg-muted rounded animate-pulse" />
              <div className="h-4 w-48 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="space-y-2 max-w-[70%]">
            <div className="h-4 w-56 bg-primary/20 rounded animate-pulse ml-auto" />
            <div className="h-4 w-40 bg-primary/20 rounded animate-pulse ml-auto" />
          </div>
        </div>

        <div className="flex justify-start">
          <div className="flex gap-3 max-w-[80%]">
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse flex-shrink-0" />
            <div className="space-y-2">
              <div className="h-4 w-72 bg-muted rounded animate-pulse" />
              <div className="h-4 w-56 bg-muted rounded animate-pulse" />
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Action buttons skeleton */}
        <div className="flex gap-3 pt-4">
          <div className="h-10 w-32 rounded-lg bg-muted animate-pulse" />
          <div className="h-10 w-28 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>

      {/* Input area skeleton */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-12 rounded-lg bg-muted animate-pulse" />
          <div className="w-12 h-12 rounded-lg bg-primary/20 animate-pulse" />
        </div>
      </div>

      {/* Shimmer overlay */}
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={shimmerTransition}
      />

      {/* Loading indicator */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-muted" />
            <motion.div
              className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-primary"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <span className="text-sm text-muted-foreground font-medium">Loading demo...</span>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default DemoSkeleton;
