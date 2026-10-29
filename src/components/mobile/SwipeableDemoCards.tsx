import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import LazyImage from "@/components/ui/lazy-image";
import { cn } from "@/lib/utils";

interface Demo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  icon: React.ComponentType<{ className?: string }>;
  duration: string;
}

interface SwipeableDemoCardsProps {
  demos: Demo[];
  onSelectDemo: (id: string) => void;
}

export default function SwipeableDemoCards({ demos, onSelectDemo }: SwipeableDemoCardsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  
  const cardWidth = 280;
  const gap = 16;
  const totalWidth = (cardWidth + gap) * demos.length - gap;

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    
    // Determine swipe direction based on velocity and offset
    let newIndex = activeIndex;
    
    if (Math.abs(velocity) >= 500) {
      // Fast swipe - move by velocity direction
      newIndex = velocity > 0 ? activeIndex - 1 : activeIndex + 1;
    } else if (Math.abs(offset) > cardWidth / 3) {
      // Slow drag past threshold
      newIndex = offset > 0 ? activeIndex - 1 : activeIndex + 1;
    }
    
    // Clamp to valid range
    newIndex = Math.max(0, Math.min(demos.length - 1, newIndex));
    setActiveIndex(newIndex);
    
    // Animate to position
    animate(x, -newIndex * (cardWidth + gap), {
      type: "spring",
      stiffness: 300,
      damping: 30,
    });
  };

  const goTo = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(demos.length - 1, index));
    setActiveIndex(clampedIndex);
    animate(x, -clampedIndex * (cardWidth + gap), {
      type: "spring",
      stiffness: 300,
      damping: 30,
    });
  };

  return (
    <div className="md:hidden overflow-hidden">
      {/* Carousel container */}
      <div 
        ref={containerRef}
        className="relative overflow-visible px-4"
      >
        <motion.div
          className="flex gap-4"
          style={{ x }}
          drag="x"
          dragConstraints={{
            left: -(demos.length - 1) * (cardWidth + gap),
            right: 0,
          }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
        >
          {demos.map((demo, index) => {
            const Icon = demo.icon;
            const isActive = index === activeIndex;
            
            return (
              <motion.div
                key={demo.id}
                className={cn(
                  "flex-shrink-0 rounded-2xl overflow-hidden bg-card border transition-all duration-300 cursor-pointer",
                  isActive ? "border-primary/50 shadow-lg" : "border-border"
                )}
                style={{ width: cardWidth }}
                onClick={() => onSelectDemo(demo.id)}
                whileTap={{ scale: 0.98 }}
              >
                <div className="aspect-video relative overflow-hidden">
                  <LazyImage 
                    src={demo.thumbnail} 
                    alt={demo.title}
                    className="w-full h-full object-cover pointer-events-none"
                    wrapperClassName="w-full h-full"
                    placeholderColor="bg-muted"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                    </div>
                  </div>
                  <Badge className="absolute top-3 left-3 bg-primary/90 text-xs">
                    Interactive
                  </Badge>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {demo.duration}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-1 line-clamp-1">
                    {demo.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {demo.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Pagination dots */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <button
          onClick={() => goTo(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="p-1.5 rounded-full bg-muted/50 disabled:opacity-30 transition-opacity"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        
        <div className="flex gap-1.5">
          {demos.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                index === activeIndex
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
        
        <button
          onClick={() => goTo(activeIndex + 1)}
          disabled={activeIndex === demos.length - 1}
          className="p-1.5 rounded-full bg-muted/50 disabled:opacity-30 transition-opacity"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Swipe hint */}
      <p className="text-center text-xs text-muted-foreground mt-2">
        Swipe to explore more demos
      </p>
    </div>
  );
}
