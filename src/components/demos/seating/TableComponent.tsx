import React, { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Lock, Crown, Building2, Accessibility, Move } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Table, Guest, Seat, EditorMode } from "./types";
import { SeatComponent } from "./SeatComponent";

interface TableComponentProps {
  table: Table;
  seats: Seat[];
  isSelected?: boolean;
  isDragging?: boolean;
  dropTargetSeatId?: string | null;
  editorMode?: EditorMode;
  zoom?: number;
  onTableClick?: () => void;
  onTableContextMenu?: (e: React.MouseEvent | React.TouchEvent, table: Table) => void;
  onSeatClick?: (seatId: string) => void;
  onSeatDrop?: (seatId: string, guestId: string) => void;
  onSeatContextMenu?: (e: React.MouseEvent | React.TouchEvent, seat: Seat) => void;
  onTableMove?: (tableId: string, x: number, y: number) => void;
}

export function TableComponent({
  table,
  seats,
  isSelected,
  isDragging: externalIsDragging,
  dropTargetSeatId,
  editorMode = 'assignment',
  zoom = 1,
  onTableClick,
  onTableContextMenu,
  onSeatClick,
  onSeatDrop,
  onSeatContextMenu,
  onTableMove,
}: TableComponentProps) {
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const tableSize = table.type === 'round' ? 80 : 120;
  const tableHeight = table.type === 'round' ? 80 : 50;
  const tableRadius = table.type === 'round' ? 35 : 50;

  // Drag state for layout mode
  const [isDraggingTable, setIsDraggingTable] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; tableX: number; tableY: number } | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Handle drag start for table movement in layout mode
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (editorMode !== 'layout' || table.isLocked) return;
    
    e.stopPropagation();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      tableX: table.x,
      tableY: table.y,
    };
    setIsDraggingTable(true);
  }, [editorMode, table.isLocked, table.x, table.y]);

  // Handle drag move with grid snapping
  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDraggingTable || !dragStartRef.current) return;
    
    e.preventDefault();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Calculate delta accounting for zoom level
    const deltaX = (clientX - dragStartRef.current.x) / zoom;
    const deltaY = (clientY - dragStartRef.current.y) / zoom;
    
    let newX = dragStartRef.current.tableX + deltaX;
    let newY = dragStartRef.current.tableY + deltaY;
    
    // Grid snapping (20px grid)
    const gridSize = 20;
    newX = Math.round(newX / gridSize) * gridSize;
    newY = Math.round(newY / gridSize) * gridSize;
    
    // Ensure minimum position
    newX = Math.max(50, newX);
    newY = Math.max(50, newY);
    
    onTableMove?.(table.id, newX, newY);
  }, [isDraggingTable, zoom, table.id, onTableMove]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDraggingTable(false);
    dragStartRef.current = null;
  }, []);

  // Add/remove global event listeners for dragging
  React.useEffect(() => {
    if (isDraggingTable) {
      const handleMouseMove = (e: MouseEvent) => handleDragMove(e);
      const handleTouchMove = (e: TouchEvent) => handleDragMove(e);
      const handleMouseUp = () => handleDragEnd();
      const handleTouchEnd = () => handleDragEnd();

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleTouchEnd);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDraggingTable, handleDragMove, handleDragEnd]);

  // Generate seat angles based on table type and seat count
  const getSeatAngles = (): number[] => {
    const angles: number[] = [];
    const seatCount = table.seats;
    
    if (table.type === 'round') {
      // Evenly distributed around the circle
      for (let i = 0; i < seatCount; i++) {
        angles.push((360 / seatCount) * i - 90); // Start from top
      }
    } else {
      // Rectangular: seats along long edges
      const seatsPerSide = Math.ceil(seatCount / 2);
      for (let i = 0; i < seatsPerSide; i++) {
        // Top edge
        const topAngle = -90 + ((180 / (seatsPerSide + 1)) * (i + 1) - 90);
        angles.push(-90);
      }
      for (let i = 0; i < seatCount - seatsPerSide; i++) {
        angles.push(90);
      }
      // Simplified: just distribute evenly
      for (let i = 0; i < seatCount; i++) {
        angles[i] = (360 / seatCount) * i - 90;
      }
    }
    
    return angles;
  };

  const seatAngles = getSeatAngles();

  const getTableStyles = () => {
    let baseColor = 'hsl(var(--muted))';
    let borderColor = 'hsl(var(--border))';
    
    if (table.isVip) {
      baseColor = 'hsl(45, 80%, 35%)';
      borderColor = 'hsl(45, 90%, 50%)';
    } else if (table.isSponsor) {
      baseColor = 'hsl(270, 50%, 35%)';
      borderColor = 'hsl(270, 60%, 55%)';
    }
    
    return { backgroundColor: baseColor, borderColor };
  };

  const styles = getTableStyles();

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onTableContextMenu?.(e, table);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onTableContextMenu?.(e, table);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isLongPressRef.current && !isDraggingTable) {
      onTableClick?.();
    }
  };

  // Handle mouse down for both click and drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (editorMode === 'layout' && !table.isLocked) {
      handleDragStart(e);
    }
  };

  // Handle touch start for both long-press context menu and drag
  const handleTouchStartCombined = (e: React.TouchEvent) => {
    if (editorMode === 'layout' && !table.isLocked) {
      // In layout mode, initiate drag after a short delay
      handleDragStart(e);
    }
    
    // Also handle long press for context menu
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setIsDraggingTable(false);
      dragStartRef.current = null;
      onTableContextMenu?.(e, table);
    }, 500);
  };

  const handleTouchEndCombined = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    handleDragEnd();
  };

  const isCurrentlyDragging = isDraggingTable || externalIsDragging;

  return (
    <motion.div
      ref={tableRef}
      className={cn(
        "absolute transition-shadow duration-200",
        editorMode === 'layout' && !table.isLocked ? "cursor-move" : "cursor-pointer",
        isSelected && "z-10",
        isCurrentlyDragging && "opacity-80 z-50",
        isDraggingTable && "shadow-2xl"
      )}
      style={{
        left: table.x,
        top: table.y,
        width: tableSize + 60,
        height: tableSize + 60,
        transform: `translate(-50%, -50%) rotate(${table.rotation || 0}deg)`,
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onContextMenu={handleRightClick}
      onTouchStart={handleTouchStartCombined}
      onTouchEnd={handleTouchEndCombined}
      onTouchCancel={handleTouchEndCombined}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: isDraggingTable ? 1.05 : 1,
        boxShadow: isDraggingTable ? '0 20px 40px rgba(0,0,0,0.3)' : 'none'
      }}
      whileHover={{ scale: table.isLocked ? 1 : 1.02 }}
    >
      {/* Layout mode drag indicator */}
      {editorMode === 'layout' && !table.isLocked && (
        <div className="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full bg-primary/80 flex items-center justify-center shadow-md">
          <Move className="w-3 h-3 text-primary-foreground" />
        </div>
      )}

      {/* Table surface */}
      <div
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          "flex items-center justify-center",
          "border-2 shadow-lg transition-all duration-200",
          table.type === 'round' ? "rounded-full" : "rounded-lg",
          isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-xl",
          isDraggingTable && "ring-2 ring-primary/50"
        )}
        style={{
          width: tableSize,
          height: tableHeight,
          backgroundColor: styles.backgroundColor,
          borderColor: styles.borderColor,
        }}
      >
        {/* Table number and badges */}
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs font-bold text-foreground/80">
            {table.tableNumber}
          </span>
          <div className="flex gap-1">
            {table.isLocked && <Lock className="w-3 h-3 text-muted-foreground/60" />}
            {table.isVip && <Crown className="w-3 h-3 text-amber-300" />}
            {table.isSponsor && <Building2 className="w-3 h-3 text-purple-300" />}
            {table.isAccessible && <Accessibility className="w-3 h-3 text-blue-300" />}
          </div>
          {table.companyName && (
            <span className="text-[8px] text-foreground/60 max-w-[60px] truncate">
              {table.companyName}
            </span>
          )}
        </div>
      </div>

      {/* Seats around the table */}
      {seats.map((seat, index) => (
        <SeatComponent
          key={seat.id}
          seat={seat}
          seatNumber={seat.seatNumber}
          angle={seatAngles[index] || 0}
          tableRadius={tableRadius}
          tableType={table.type}
          guest={seat.assignedGuest}
          isSelected={false}
          isDropTarget={dropTargetSeatId === seat.id}
          isAccessible={seat.isAccessible}
          onSeatClick={() => onSeatClick?.(seat.id)}
          onDrop={(guestId) => onSeatDrop?.(seat.id, guestId)}
          onContextMenu={(e, s) => onSeatContextMenu?.(e, s)}
        />
      ))}
    </motion.div>
  );
}
