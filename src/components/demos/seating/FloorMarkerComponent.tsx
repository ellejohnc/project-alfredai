import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Disc, 
  LogIn, 
  LogOut, 
  Wine, 
  Music2, 
  MonitorPlay,
  Mic2,
  Headphones,
  Star,
  Move
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FloorMarker, FloorMarkerType, EditorMode } from "./types";

interface FloorMarkerComponentProps {
  marker: FloorMarker;
  isSelected?: boolean;
  editorMode?: EditorMode;
  zoom?: number;
  onMarkerClick?: () => void;
  onMarkerMove?: (markerId: string, x: number, y: number) => void;
}

const markerIcons: Record<FloorMarkerType, React.ElementType> = {
  'stage': Mic2,
  'entrance': LogIn,
  'exit': LogOut,
  'bar': Wine,
  'dance-floor': Music2,
  'screen': MonitorPlay,
  'podium': Mic2,
  'dj-booth': Headphones,
  'vip-zone': Star,
};

const defaultMarkerColors: Record<FloorMarkerType, string> = {
  'stage': 'hsl(220, 15%, 25%)',
  'entrance': 'hsl(140, 60%, 35%)',
  'exit': 'hsl(0, 60%, 45%)',
  'bar': 'hsl(25, 70%, 40%)',
  'dance-floor': 'hsl(280, 50%, 35%)',
  'screen': 'hsl(220, 10%, 25%)',
  'podium': 'hsl(210, 50%, 35%)',
  'dj-booth': 'hsl(330, 60%, 40%)',
  'vip-zone': 'hsl(45, 80%, 40%)',
};

const GRID_SIZE = 20;

export function FloorMarkerComponent({
  marker,
  isSelected,
  editorMode = 'assignment',
  zoom = 1,
  onMarkerClick,
  onMarkerMove,
}: FloorMarkerComponentProps) {
  const Icon = markerIcons[marker.type] || Disc;
  const bgColor = marker.color || defaultMarkerColors[marker.type];

  const isLargeMarker = marker.type === 'dance-floor' || marker.type === 'vip-zone';
  const isLayoutMode = editorMode === 'layout';

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; markerX: number; markerY: number } | null>(null);

  // Snap to grid
  const snapToGrid = useCallback((value: number) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isLayoutMode || !onMarkerMove) return;
    
    e.stopPropagation();
    e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragStartRef.current = {
      x: clientX,
      y: clientY,
      markerX: marker.x,
      markerY: marker.y,
    };
    setIsDragging(true);
  }, [isLayoutMode, onMarkerMove, marker.x, marker.y]);

  // Handle drag move
  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !dragStartRef.current || !onMarkerMove) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const deltaX = (clientX - dragStartRef.current.x) / zoom;
    const deltaY = (clientY - dragStartRef.current.y) / zoom;

    const newX = snapToGrid(dragStartRef.current.markerX + deltaX);
    const newY = snapToGrid(dragStartRef.current.markerY + deltaY);

    onMarkerMove(marker.id, newX, newY);
  }, [isDragging, zoom, onMarkerMove, marker.id, snapToGrid]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  // Add/remove global event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchend', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  return (
    <motion.div
      className={cn(
        "absolute flex flex-col items-center justify-center",
        "border border-white/20 shadow-md transition-all duration-200",
        isLargeMarker ? "rounded-xl" : "rounded-lg",
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        isLayoutMode ? "cursor-move" : "cursor-pointer",
        isDragging && "ring-2 ring-primary shadow-lg z-50"
      )}
      style={{
        left: marker.x,
        top: marker.y,
        width: marker.width,
        height: marker.height,
        backgroundColor: bgColor,
        transform: `translate(-50%, -50%) rotate(${marker.rotation || 0}deg)`,
      }}
      onClick={(e) => {
        if (!isDragging) {
          onMarkerClick?.();
        }
      }}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!isDragging ? { scale: 1.02, boxShadow: '0 8px 30px rgba(0,0,0,0.3)' } : undefined}
    >
      {/* Layout mode move indicator */}
      {isLayoutMode && !isDragging && (
        <div className="absolute -top-2 -right-2 bg-primary rounded-full p-0.5 shadow-md">
          <Move className="h-2.5 w-2.5 text-primary-foreground" />
        </div>
      )}

      <Icon className={cn(
        "text-white/80",
        isLargeMarker ? "w-8 h-8" : "w-4 h-4"
      )} />
      {marker.label && (
        <span className={cn(
          "text-white/90 font-medium tracking-wide",
          isLargeMarker ? "text-xs mt-1" : "text-[8px] mt-0.5"
        )}>
          {marker.label}
        </span>
      )}
      
      {/* Decorative elements for dance floor */}
      {marker.type === 'dance-floor' && (
        <div className="absolute inset-2 border border-white/10 rounded-lg pointer-events-none" />
      )}
    </motion.div>
  );
}
