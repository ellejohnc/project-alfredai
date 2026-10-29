import { useState, useRef, useCallback, useEffect } from "react";

import { ZoomIn, ZoomOut, RotateCcw, Move, Hand, MousePointer2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Table, Seat, FloorMarker, Guest, CanvasState, EditorMode } from "./types";
import { TableComponent } from "./TableComponent";
import { FloorMarkerComponent } from "./FloorMarkerComponent";

interface SeatingCanvasProps {
  tables: Table[];
  seats: Map<string, Seat[]>; // tableId -> seats
  markers: FloorMarker[];
  guests: Guest[];
  editorMode: EditorMode;
  onTableSelect?: (tableId: string | null) => void;
  onSeatSelect?: (seatId: string | null) => void;
  onMarkerSelect?: (markerId: string | null) => void;
  onAssignGuest?: (guestId: string, tableId: string, seatId: string) => void;
  onTableMove?: (tableId: string, x: number, y: number) => void;
  onMarkerMove?: (markerId: string, x: number, y: number) => void;
  onSeatContextMenu?: (e: React.MouseEvent | React.TouchEvent, seat: Seat, tableId: string) => void;
  onTableContextMenu?: (e: React.MouseEvent | React.TouchEvent, table: Table) => void;
  selectedTableId?: string | null;
  selectedMarkerId?: string | null;
  canvasWidth?: number;
  canvasHeight?: number;
}

export function SeatingCanvas({
  tables,
  seats,
  markers,
  guests,
  editorMode,
  onTableSelect,
  onSeatSelect,
  onMarkerSelect,
  onAssignGuest,
  onTableMove,
  onMarkerMove,
  onSeatContextMenu,
  onTableContextMenu,
  selectedTableId,
  selectedMarkerId,
  canvasWidth = 600,
  canvasHeight = 700,
}: SeatingCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    panX: 0,
    panY: 0,
    isPanning: false,
    selectedTableId: null,
    selectedSeatId: null,
  });
  const [isPanMode, setIsPanMode] = useState(false);
  const [dropTargetSeatId, setDropTargetSeatId] = useState<string | null>(null);
  const lastPanPos = useRef({ x: 0, y: 0 });
  
  // Touch gesture state
  const touchStateRef = useRef<{
    initialDistance: number;
    initialZoom: number;
    initialPanX: number;
    initialPanY: number;
    initialMidpoint: { x: number; y: number };
    lastTouchCount: number;
  } | null>(null);
  // Handle zoom
  const handleZoom = useCallback((delta: number) => {
    setCanvasState(prev => ({
      ...prev,
      zoom: Math.min(2, Math.max(0.5, prev.zoom + delta)),
    }));
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      handleZoom(e.deltaY > 0 ? -0.1 : 0.1);
    } else if (isPanMode) {
      setCanvasState(prev => ({
        ...prev,
        panX: prev.panX - e.deltaX,
        panY: prev.panY - e.deltaY,
      }));
    }
  }, [handleZoom, isPanMode]);

  // Reset view
  const handleResetView = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      zoom: 1,
      panX: 0,
      panY: 0,
    }));
  }, []);

  // Track if we're currently panning with a ref to avoid stale closure issues
  const isPanningRef = useRef(false);
  
  // Handle pan start
  const handlePanStart = useCallback((e: React.MouseEvent) => {
    // Left click in pan mode, or middle click
    if ((isPanMode && e.button === 0) || e.button === 1) {
      e.preventDefault();
      e.stopPropagation();
      isPanningRef.current = true;
      setCanvasState(prev => ({ ...prev, isPanning: true }));
      lastPanPos.current = { x: e.clientX, y: e.clientY };
    }
  }, [isPanMode]);

  // Handle pan move
  const handlePanMove = useCallback((e: React.MouseEvent) => {
    if (isPanningRef.current) {
      e.preventDefault();
      const deltaX = e.clientX - lastPanPos.current.x;
      const deltaY = e.clientY - lastPanPos.current.y;
      setCanvasState(prev => ({
        ...prev,
        panX: prev.panX + deltaX,
        panY: prev.panY + deltaY,
      }));
      lastPanPos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  // Handle pan end
  const handlePanEnd = useCallback(() => {
    isPanningRef.current = false;
    setCanvasState(prev => ({ ...prev, isPanning: false }));
  }, []);

  // Calculate distance between two touch points
  const getTouchDistance = useCallback((touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Calculate midpoint between two touch points
  const getTouchMidpoint = useCallback((touches: React.TouchList): { x: number; y: number } => {
    if (touches.length < 2) {
      const touch = touches[0];
      return { x: touch?.clientX || 0, y: touch?.clientY || 0 };
    }
    const touch1 = touches[0];
    const touch2 = touches[1];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  }, []);

  // Handle touch start for pinch-to-zoom and two-finger pan
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length >= 2) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      const midpoint = getTouchMidpoint(e.touches);
      
      touchStateRef.current = {
        initialDistance: distance,
        initialZoom: canvasState.zoom,
        initialPanX: canvasState.panX,
        initialPanY: canvasState.panY,
        initialMidpoint: midpoint,
        lastTouchCount: e.touches.length,
      };
      
      setCanvasState(prev => ({ ...prev, isPanning: true }));
    } else if (e.touches.length === 1 && isPanMode) {
      // Single finger pan when in pan mode
      lastPanPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setCanvasState(prev => ({ ...prev, isPanning: true }));
    }
  }, [canvasState.zoom, canvasState.panX, canvasState.panY, getTouchDistance, getTouchMidpoint, isPanMode]);

  // Handle touch move for pinch-to-zoom and two-finger pan
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length >= 2 && touchStateRef.current) {
      e.preventDefault();
      
      const currentDistance = getTouchDistance(e.touches);
      const currentMidpoint = getTouchMidpoint(e.touches);
      
      // Calculate zoom based on pinch distance
      const scale = currentDistance / touchStateRef.current.initialDistance;
      const newZoom = Math.min(2, Math.max(0.5, touchStateRef.current.initialZoom * scale));
      
      // Calculate pan based on midpoint movement
      const deltaX = currentMidpoint.x - touchStateRef.current.initialMidpoint.x;
      const deltaY = currentMidpoint.y - touchStateRef.current.initialMidpoint.y;
      
      setCanvasState(prev => ({
        ...prev,
        zoom: newZoom,
        panX: touchStateRef.current!.initialPanX + deltaX,
        panY: touchStateRef.current!.initialPanY + deltaY,
      }));
    } else if (e.touches.length === 1 && canvasState.isPanning && isPanMode) {
      // Single finger pan when in pan mode
      const deltaX = e.touches[0].clientX - lastPanPos.current.x;
      const deltaY = e.touches[0].clientY - lastPanPos.current.y;
      setCanvasState(prev => ({
        ...prev,
        panX: prev.panX + deltaX,
        panY: prev.panY + deltaY,
      }));
      lastPanPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, [getTouchDistance, getTouchMidpoint, canvasState.isPanning, isPanMode]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      touchStateRef.current = null;
    }
    if (e.touches.length === 0) {
      setCanvasState(prev => ({ ...prev, isPanning: false }));
    }
  }, []);

  // Handle table click
  const handleTableClick = useCallback((tableId: string) => {
    if (!isPanMode) {
      onTableSelect?.(tableId === selectedTableId ? null : tableId);
    }
  }, [isPanMode, onTableSelect, selectedTableId]);

  // Handle seat click
  const handleSeatClick = useCallback((seatId: string) => {
    if (editorMode === 'assignment') {
      onSeatSelect?.(seatId);
    }
  }, [editorMode, onSeatSelect]);

  // Handle drop on seat
  const handleSeatDrop = useCallback((tableId: string, seatId: string, guestId: string) => {
    onAssignGuest?.(guestId, tableId, seatId);
    setDropTargetSeatId(null);
  }, [onAssignGuest]);

  // Handle drag over canvas
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Handle canvas drop (for finding seat under cursor)
  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDropTargetSeatId(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        setIsPanMode(true);
      } else if (e.key === '+' || e.key === '=') {
        handleZoom(0.1);
      } else if (e.key === '-') {
        handleZoom(-0.1);
      } else if (e.key === '0') {
        handleResetView();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setIsPanMode(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleZoom, handleResetView]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-900/50 rounded-xl border border-border">
      {/* Toolbar */}
      <div className="absolute top-3 left-3 z-20 flex gap-1 bg-background/80 backdrop-blur-sm rounded-lg border border-border p-1">
        <Button
          variant={isPanMode ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsPanMode(!isPanMode)}
          title="Pan mode (hold Space)"
        >
          {isPanMode ? <Hand className="h-4 w-4" /> : <MousePointer2 className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleZoom(0.1)}
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleZoom(-0.1)}
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleResetView}
          title="Reset view"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Zoom indicator */}
      <div className="absolute top-3 right-3 z-20 bg-background/80 backdrop-blur-sm rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground">
        {Math.round(canvasState.zoom * 100)}%
      </div>

      {/* Canvas container */}
      <div
        ref={containerRef}
        className={cn(
          "w-full h-full overflow-hidden touch-none",
          isPanMode ? "cursor-grab" : "cursor-default",
          canvasState.isPanning && "cursor-grabbing"
        )}
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
        onWheel={handleWheel}
        onDragOver={handleDragOver}
        onDrop={handleCanvasDrop}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Transformable canvas */}
        <div
          className="relative origin-top-left"
          style={{
            width: canvasWidth,
            height: canvasHeight,
            transform: `translate(${canvasState.panX}px, ${canvasState.panY}px) scale(${canvasState.zoom})`,
            transformOrigin: 'top left',
            marginLeft: '20px',
            marginTop: '20px',
            transition: isPanningRef.current ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          {/* Grid pattern - more visible in layout mode */}
          <div 
            className={cn(
              "absolute inset-0 pointer-events-none transition-opacity duration-200",
              editorMode === 'layout' ? "opacity-50" : "opacity-30"
            )}
            style={{
              backgroundImage: editorMode === 'layout'
                ? `linear-gradient(to right, hsl(var(--muted-foreground) / 0.15) 1px, transparent 1px),
                   linear-gradient(to bottom, hsl(var(--muted-foreground) / 0.15) 1px, transparent 1px)`
                : `radial-gradient(circle, hsl(var(--muted-foreground) / 0.3) 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
            }}
          />

          {/* Floor markers */}
          {markers.map(marker => (
            <FloorMarkerComponent
              key={marker.id}
              marker={marker}
              isSelected={selectedMarkerId === marker.id}
              editorMode={editorMode}
              zoom={canvasState.zoom}
              onMarkerClick={() => {
                onMarkerSelect?.(selectedMarkerId === marker.id ? null : marker.id);
              }}
              onMarkerMove={onMarkerMove}
            />
          ))}

          {/* Tables */}
          {tables.map(table => (
            <TableComponent
              key={table.id}
              table={table}
              seats={seats.get(table.id) || []}
              isSelected={selectedTableId === table.id}
              dropTargetSeatId={dropTargetSeatId}
              editorMode={editorMode}
              zoom={canvasState.zoom}
              onTableClick={() => handleTableClick(table.id)}
              onTableContextMenu={(e, t) => onTableContextMenu?.(e, t)}
              onSeatClick={handleSeatClick}
              onSeatDrop={(seatId, guestId) => handleSeatDrop(table.id, seatId, guestId)}
              onSeatContextMenu={(e, seat) => onSeatContextMenu?.(e, seat, table.id)}
              onTableMove={onTableMove}
            />
          ))}
        </div>
      </div>

      {/* Instructions overlay */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-background/80 backdrop-blur-sm rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground">
        <span className="hidden md:inline">
          {editorMode === 'layout' 
            ? "Right-click for options • Space + drag to pan • Scroll to zoom" 
            : "Drag guests onto seats • Right-click for options • Ctrl+scroll to zoom"}
        </span>
        <span className="md:hidden">
          {editorMode === 'layout' 
            ? "Long-press for options • Two-finger pan & pinch to zoom" 
            : "Drag guests • Long-press for options • Two-finger pan & zoom"}
        </span>
      </div>
    </div>
  );
}
