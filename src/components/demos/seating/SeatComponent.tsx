import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Crown, Accessibility, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Guest, GuestTier, Seat } from "./types";
import { tierColors } from "./seatingData";

interface SeatComponentProps {
  seat: Seat;
  seatNumber: number;
  angle: number; // Position angle around the table
  tableRadius: number;
  tableType: 'round' | 'rectangular';
  guest?: Guest;
  isSelected?: boolean;
  isDropTarget?: boolean;
  isAccessible?: boolean;
  onSeatClick?: () => void;
  onDrop?: (guestId: string) => void;
  onContextMenu?: (e: React.MouseEvent | React.TouchEvent, seat: Seat) => void;
}

export function SeatComponent({
  seat,
  seatNumber,
  angle,
  tableRadius,
  tableType,
  guest,
  isSelected,
  isDropTarget,
  isAccessible,
  onSeatClick,
  onDrop,
  onContextMenu,
}: SeatComponentProps) {
  // Long press detection for mobile context menu
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const seatSize = 28;
  const seatDistance = tableType === 'round' ? tableRadius + 18 : tableRadius + 12;
  
  // Calculate seat position based on table type
  const getSeatPosition = () => {
    if (tableType === 'round') {
      const rad = (angle * Math.PI) / 180;
      return {
        x: Math.cos(rad) * seatDistance,
        y: Math.sin(rad) * seatDistance,
      };
    }
    // For rectangular, angle represents position along perimeter
    return {
      x: Math.cos((angle * Math.PI) / 180) * seatDistance,
      y: Math.sin((angle * Math.PI) / 180) * (seatDistance * 0.6),
    };
  };

  const position = getSeatPosition();

  const getTierIcon = (tier: GuestTier) => {
    switch (tier) {
      case 'vip':
        return <Crown className="w-3 h-3 text-amber-900" />;
      case 'sponsor':
        return <Building2 className="w-3 h-3 text-white" />;
      default:
        return null;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const guestId = e.dataTransfer.getData('guestId');
    if (guestId && onDrop) {
      onDrop(guestId);
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu?.(e, seat);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onContextMenu?.(e, seat);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleClick = () => {
    if (!isLongPressRef.current) {
      onSeatClick?.();
    }
  };

  return (
    <motion.div
      className={cn(
        "absolute rounded-full flex items-center justify-center cursor-pointer transition-all duration-200",
        "border-2 text-xs font-medium",
        guest ? [
          guest.tier === 'vip' && "bg-amber-400 border-amber-500 text-amber-900",
          guest.tier === 'sponsor' && "bg-purple-500 border-purple-400 text-white",
          guest.tier === 'standard' && "bg-primary/20 border-primary/40 text-primary",
        ] : [
          "bg-muted/50 border-dashed border-muted-foreground/30",
          "hover:border-primary/50 hover:bg-primary/10",
        ],
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        isDropTarget && "border-primary border-solid scale-110 bg-primary/20 shadow-lg shadow-primary/30",
        isAccessible && !guest && "border-blue-400/50"
      )}
      style={{
        width: seatSize,
        height: seatSize,
        left: `calc(50% + ${position.x}px - ${seatSize / 2}px)`,
        top: `calc(50% + ${position.y}px - ${seatSize / 2}px)`,
      }}
      onClick={handleClick}
      onContextMenu={handleRightClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: seatNumber * 0.03 }}
      title={guest ? `${guest.name} (${guest.company})` : `Seat ${seatNumber}`}
    >
      {guest ? (
        <div className="flex items-center justify-center relative">
          <span className="text-[10px] font-semibold">{getInitials(guest.name)}</span>
          {guest.tier !== 'standard' && (
            <div className="absolute -top-1 -right-1">
              {getTierIcon(guest.tier)}
            </div>
          )}
        </div>
      ) : (
        <span className="text-[9px] text-muted-foreground/60">{seatNumber}</span>
      )}
      {isAccessible && !guest && (
        <Accessibility className="w-3 h-3 text-blue-400 absolute" />
      )}
    </motion.div>
  );
}
