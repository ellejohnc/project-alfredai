import { motion } from "framer-motion";
import { ArrowLeftRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Guest, Seat } from "./types";

interface SwapModeOverlayProps {
  isActive: boolean;
  sourceGuest: Guest | null;
  onCancel: () => void;
}

export function SwapModeOverlay({
  isActive,
  sourceGuest,
  onCancel,
}: SwapModeOverlayProps) {
  if (!isActive || !sourceGuest) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-3"
    >
      <ArrowLeftRight className="w-4 h-4 animate-pulse" />
      <span className="text-sm font-medium">
        Select seat to swap with <strong>{sourceGuest.name}</strong>
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/20"
        onClick={onCancel}
      >
        <X className="w-4 h-4" />
      </Button>
    </motion.div>
  );
}
