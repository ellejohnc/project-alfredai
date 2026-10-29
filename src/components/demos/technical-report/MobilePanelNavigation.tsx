import { useState, useRef, ReactNode, useCallback } from "react";
import { motion, PanInfo } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";
import { Database, FileText } from "lucide-react";

type PanelType = 'inputs' | 'report';

interface MobilePanelNavigationProps {
  activePanel: PanelType;
  onPanelChange: (panel: PanelType) => void;
  children: {
    inputs: ReactNode;
    report: ReactNode;
  };
}

const PANELS: { id: PanelType; label: string; icon: typeof Database }[] = [
  { id: 'inputs', label: 'Input & Actions', icon: Database },
  { id: 'report', label: 'Report Preview', icon: FileText },
];

const SWIPE_THRESHOLD = 50;

export function MobilePanelNavigation({ 
  activePanel, 
  onPanelChange, 
  children 
}: MobilePanelNavigationProps) {
  const { trigger: haptic } = useHaptics();
  const containerRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState(0);

  const currentIndex = PANELS.findIndex(p => p.id === activePanel);

  const handlePanelChange = useCallback((newPanel: PanelType) => {
    const newIndex = PANELS.findIndex(p => p.id === newPanel);
    setDirection(newIndex > currentIndex ? 1 : -1);
    haptic('light');
    onPanelChange(newPanel);
  }, [currentIndex, haptic, onPanelChange]);

  const handleDragEnd = useCallback((e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    
    if (Math.abs(offset.x) > SWIPE_THRESHOLD || Math.abs(velocity.x) > 500) {
      if (offset.x > 0 && currentIndex > 0) {
        handlePanelChange(PANELS[currentIndex - 1].id);
      } else if (offset.x < 0 && currentIndex < PANELS.length - 1) {
        handlePanelChange(PANELS[currentIndex + 1].id);
      }
    }
  }, [currentIndex, handlePanelChange]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar - 2 panels only */}
      <div className="flex items-center bg-muted/50 rounded-lg p-1 mb-3 relative">
        {/* Active Indicator */}
        <motion.div
          className="absolute h-[calc(100%-8px)] bg-background rounded-md shadow-sm"
          initial={false}
          animate={{
            x: `calc(${currentIndex * 100}% + ${currentIndex * 4}px)`,
            width: `calc(${100 / PANELS.length}% - 4px)`,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          style={{ left: 4, top: 4 }}
        />
        
        {PANELS.map((panel) => {
          const Icon = panel.icon;
          const isActive = activePanel === panel.id;
          
          return (
            <button
              key={panel.id}
              onClick={() => handlePanelChange(panel.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-colors relative z-10 min-h-[44px]",
                isActive 
                  ? "text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{panel.label}</span>
            </button>
          );
        })}
      </div>

      {/* Panel Content with Swipe */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden touch-pan-y"
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={activePanel}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 overflow-y-auto"
          >
            {children[activePanel]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Swipe indicator dots */}
      <div className="flex items-center justify-center gap-2 py-3">
        {PANELS.map((panel, i) => (
          <button
            key={panel.id}
            onClick={() => handlePanelChange(panel.id)}
            className={cn(
              "w-2 h-2 rounded-full transition-all min-h-[8px] min-w-[8px]",
              activePanel === panel.id
                ? "bg-primary scale-110"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            aria-label={`Go to ${panel.label}`}
          />
        ))}
      </div>
    </div>
  );
}
