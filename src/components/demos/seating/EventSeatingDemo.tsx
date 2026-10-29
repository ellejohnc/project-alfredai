import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { 
  Users, 
  Bot, 
  ChevronLeft,
  Sparkles,
  Layout,
  Undo2,
  Redo2,
  MousePointer2,
  Move,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import confetti from "canvas-confetti";

import { SeatingCanvas } from "./SeatingCanvas";
import { GuestListPanel } from "./GuestListPanel";
import { AISeatingAssistant } from "./AISeatingAssistant";
import { LayoutPresetSelector } from "./LayoutPresetSelector";
import { SeatingStatsBar } from "./SeatingStatsBar";
import { SeatingLegend } from "./SeatingLegend";
import { SeatContextMenu } from "./SeatContextMenu";
import { TableContextMenu } from "./TableContextMenu";
import { SwapModeOverlay } from "./SwapModeOverlay";
import { ExportMenu } from "./ExportMenu";
import { TableToolbar } from "./TableToolbar";
import { MarkerToolbar } from "./MarkerToolbar";
import { useSeatingHaptics } from "./useSeatingHaptics";
import { useSeatingHistory } from "./useSeatingHistory";
import { useSeatingExport } from "./useSeatingExport";

import type { 
  Table, 
  Seat, 
  Guest, 
  FloorMarker, 
  LayoutPreset, 
  EditorMode, 
  AutoAssignStrategy,
  SeatingStats,
  TableType,
  FloorMarkerType,
} from "./types";
import { mockGuests } from "./seatingData";

export function EventSeatingDemo() {
  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Haptic feedback hook
  const { vibrateOnAssign, vibrateOnError, vibrateOnSuccess, vibrateOnUnassign } = useSeatingHaptics();
  
  // History hook for undo/redo
  const { saveState, undo, redo, canUndo, canRedo } = useSeatingHistory();
  
  // Export hook
  const { exportAsPDF, exportAsImage, exportAsCSV } = useSeatingExport();
  
  // Layout state
  const [selectedPreset, setSelectedPreset] = useState<LayoutPreset | null>(null);
  const [showPresetSelector, setShowPresetSelector] = useState(true);
  
  // Tables and markers from preset
  const [tables, setTables] = useState<Table[]>([]);
  const [markers, setMarkers] = useState<FloorMarker[]>([]);
  
  // Seats per table (generated from tables)
  const [seats, setSeats] = useState<Map<string, Seat[]>>(new Map());
  
  // Guests
  const [guests, setGuests] = useState<Guest[]>(mockGuests.map(g => ({ ...g, isSeated: false })));
  
  // UI state
  const [activeTab, setActiveTab] = useState<'canvas' | 'ai' | 'guests'>('canvas');
  const [editorMode, setEditorMode] = useState<EditorMode>('assignment');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);

  // Swap mode state
  const [swapMode, setSwapMode] = useState<{
    isActive: boolean;
    sourceSeatId: string | null;
    sourceGuest: Guest | null;
  }>({ isActive: false, sourceSeatId: null, sourceGuest: null });

  // Context menu state
  const [seatContextMenu, setSeatContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    seat: Seat | null;
    tableId: string | null;
  }>({ isOpen: false, position: { x: 0, y: 0 }, seat: null, tableId: null });
  
  const [tableContextMenu, setTableContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    table: Table | null;
  }>({ isOpen: false, position: { x: 0, y: 0 }, table: null });

  // Generate seats when tables change
  useEffect(() => {
    const newSeats = new Map<string, Seat[]>();
    
    tables.forEach(table => {
      const tableSeats: Seat[] = [];
      for (let i = 1; i <= table.seats; i++) {
        tableSeats.push({
          id: `${table.id}-seat-${i}`,
          tableId: table.id,
          seatNumber: i,
          assignedGuest: undefined,
        });
      }
      newSeats.set(table.id, tableSeats);
    });
    
    setSeats(newSeats);
  }, [tables]);

  // Calculate stats
  const stats = useMemo<SeatingStats>(() => {
    const seatedGuests = guests.filter(g => g.isSeated).length;
    const totalSeats = tables.reduce((sum, t) => sum + t.seats, 0);
    
    return {
      totalTables: tables.length,
      roundTables: tables.filter(t => t.type === 'round').length,
      rectangularTables: tables.filter(t => t.type === 'rectangular').length,
      totalSeats,
      seatedGuests,
      unseatedGuests: guests.length - seatedGuests,
      vipTables: tables.filter(t => t.isVip).length,
      sponsorTables: tables.filter(t => t.isSponsor).length,
      floorMarkers: markers.length,
    };
  }, [tables, guests, markers]);

  // Handle preset selection
  const handlePresetSelect = useCallback((preset: LayoutPreset) => {
    setSelectedPreset(preset);
    setTables(preset.layout.tables);
    setMarkers(preset.layout.markers);
    setShowPresetSelector(false);
    
    // Reset guest assignments
    setGuests(mockGuests.map(g => ({ ...g, isSeated: false, assignedSeatId: undefined, assignedTableId: undefined })));
    
    toast.success(`Loaded "${preset.name}" layout`, {
      description: `${preset.tableCount} tables with ${preset.capacity} seats ready`,
    });
  }, []);

  // Save state after assignments change
  const saveCurrentState = useCallback(() => {
    saveState(seats, guests);
  }, [saveState, seats, guests]);

  // Handle undo
  const handleUndo = useCallback(() => {
    const previousState = undo();
    if (previousState) {
      setSeats(previousState.seats);
      setGuests(previousState.guests);
      toast.info("Undone", { duration: 1500 });
    }
  }, [undo]);

  // Handle redo
  const handleRedo = useCallback(() => {
    const nextState = redo();
    if (nextState) {
      setSeats(nextState.seats);
      setGuests(nextState.guests);
      toast.info("Redone", { duration: 1500 });
    }
  }, [redo]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Assign guest to seat
  const handleAssignGuest = useCallback((guestId: string, tableId: string, seatId: string) => {
    // Find the guest
    const guest = guests.find(g => g.id === guestId);
    if (!guest) return;

    // Check if seat is already taken
    const tableSeats = seats.get(tableId);
    const targetSeat = tableSeats?.find(s => s.id === seatId);
    if (targetSeat?.assignedGuest) {
      vibrateOnError();
      toast.error("Seat already taken", {
        description: `${targetSeat.assignedGuest.name} is already seated here`,
      });
      return;
    }

    // Save state before change for undo
    saveCurrentState();

    // Haptic feedback for successful assignment
    vibrateOnAssign();

    // Update seats
    setSeats(prev => {
      const newSeats = new Map(prev);
      
      // Remove guest from previous seat if any
      if (guest.assignedTableId && guest.assignedSeatId) {
        const prevTableSeats = newSeats.get(guest.assignedTableId);
        if (prevTableSeats) {
          newSeats.set(guest.assignedTableId, prevTableSeats.map(s => 
            s.id === guest.assignedSeatId ? { ...s, assignedGuest: undefined } : s
          ));
        }
      }
      
      // Assign to new seat
      const newTableSeats = newSeats.get(tableId);
      if (newTableSeats) {
        newSeats.set(tableId, newTableSeats.map(s => 
          s.id === seatId ? { ...s, assignedGuest: guest } : s
        ));
      }
      
      return newSeats;
    });

    // Update guest
    setGuests(prev => prev.map(g => 
      g.id === guestId 
        ? { ...g, isSeated: true, assignedSeatId: seatId, assignedTableId: tableId }
        : g
    ));

    toast.success(`Seated ${guest.name}`, {
      description: `Table ${tables.find(t => t.id === tableId)?.tableNumber}`,
    });
  }, [guests, seats, tables, vibrateOnAssign, vibrateOnError, saveCurrentState]);

  // Swap two guests between seats
  const handleSwapGuests = useCallback((seatId1: string, seatId2: string) => {
    // Find both seats and their guests
    let seat1: Seat | undefined;
    let seat2: Seat | undefined;
    let tableId1: string | undefined;
    let tableId2: string | undefined;

    seats.forEach((tableSeats, tableId) => {
      const s1 = tableSeats.find(s => s.id === seatId1);
      const s2 = tableSeats.find(s => s.id === seatId2);
      if (s1) { seat1 = s1; tableId1 = tableId; }
      if (s2) { seat2 = s2; tableId2 = tableId; }
    });

    if (!seat1 || !seat2 || !tableId1 || !tableId2) {
      toast.error("Could not find seats to swap");
      return;
    }

    const guest1 = seat1.assignedGuest;
    const guest2 = seat2.assignedGuest;

    if (!guest1 && !guest2) {
      toast.error("Both seats are empty");
      return;
    }

    // Save state before change for undo
    saveCurrentState();
    vibrateOnAssign();

    // Update seats - swap the guests
    setSeats(prev => {
      const newSeats = new Map(prev);
      
      // Update seat1
      const tableSeats1 = newSeats.get(tableId1!);
      if (tableSeats1) {
        newSeats.set(tableId1!, tableSeats1.map(s => 
          s.id === seatId1 ? { ...s, assignedGuest: guest2 } : s
        ));
      }
      
      // Update seat2
      const tableSeats2 = newSeats.get(tableId2!);
      if (tableSeats2) {
        newSeats.set(tableId2!, tableSeats2.map(s => 
          s.id === seatId2 ? { ...s, assignedGuest: guest1 } : s
        ));
      }
      
      return newSeats;
    });

    // Update guests
    setGuests(prev => prev.map(g => {
      if (guest1 && g.id === guest1.id) {
        return { ...g, assignedSeatId: seatId2, assignedTableId: tableId2 };
      }
      if (guest2 && g.id === guest2.id) {
        return { ...g, assignedSeatId: seatId1, assignedTableId: tableId1 };
      }
      return g;
    }));

    const name1 = guest1?.name || "Empty seat";
    const name2 = guest2?.name || "Empty seat";
    toast.success(`Swapped ${name1} ↔ ${name2}`);
  }, [seats, vibrateOnAssign, saveCurrentState]);

  // Enter swap mode
  const handleEnterSwapMode = useCallback((seatId: string) => {
    // Find the guest in this seat
    let foundGuest: Guest | undefined;
    seats.forEach((tableSeats) => {
      const seat = tableSeats.find(s => s.id === seatId);
      if (seat?.assignedGuest) {
        foundGuest = seat.assignedGuest;
      }
    });

    if (!foundGuest) {
      toast.error("Select a seated guest to swap");
      return;
    }

    setSwapMode({
      isActive: true,
      sourceSeatId: seatId,
      sourceGuest: foundGuest,
    });

    toast.info("Click another seat to swap", { duration: 3000 });
  }, [seats]);

  // Handle seat click during swap mode
  const handleSeatClickForSwap = useCallback((seatId: string) => {
    if (!swapMode.isActive || !swapMode.sourceSeatId) return;

    if (seatId === swapMode.sourceSeatId) {
      // Cancel swap mode if clicking same seat
      setSwapMode({ isActive: false, sourceSeatId: null, sourceGuest: null });
      return;
    }

    handleSwapGuests(swapMode.sourceSeatId, seatId);
    setSwapMode({ isActive: false, sourceSeatId: null, sourceGuest: null });
  }, [swapMode, handleSwapGuests]);

  // Cancel swap mode
  const handleCancelSwapMode = useCallback(() => {
    setSwapMode({ isActive: false, sourceSeatId: null, sourceGuest: null });
  }, []);

  // Auto-assign guests based on strategy
  const handleAutoAssign = useCallback((strategy: AutoAssignStrategy) => {
    const unseatedGuests = guests.filter(g => !g.isSeated);
    if (unseatedGuests.length === 0) {
      toast.info("All guests are already seated!");
      return;
    }

    // Save state before change for undo
    saveCurrentState();

    let guestsToAssign = [...unseatedGuests];
    
    // Sort based on strategy
    switch (strategy) {
      case 'by-tier':
        guestsToAssign.sort((a, b) => {
          const tierOrder = { vip: 0, sponsor: 1, standard: 2 };
          return tierOrder[a.tier] - tierOrder[b.tier];
        });
        break;
      case 'by-company':
        guestsToAssign.sort((a, b) => a.company.localeCompare(b.company));
        break;
      case 'random':
        guestsToAssign = guestsToAssign.sort(() => Math.random() - 0.5);
        break;
      case 'smart-mix':
        guestsToAssign.sort((a, b) => {
          if (a.tier !== b.tier) {
            const tierOrder = { vip: 0, sponsor: 1, standard: 2 };
            return tierOrder[a.tier] - tierOrder[b.tier];
          }
          return a.company.localeCompare(b.company);
        });
        break;
    }

    // Get available seats
    const availableSeats: { tableId: string; seatId: string; table: Table }[] = [];
    seats.forEach((tableSeats, tableId) => {
      const table = tables.find(t => t.id === tableId);
      if (!table) return;
      
      tableSeats.forEach(seat => {
        if (!seat.assignedGuest) {
          availableSeats.push({ tableId, seatId: seat.id, table });
        }
      });
    });

    // Sort seats by table priority
    if (strategy === 'by-tier' || strategy === 'smart-mix') {
      availableSeats.sort((a, b) => {
        if (a.table.isVip && !b.table.isVip) return -1;
        if (!a.table.isVip && b.table.isVip) return 1;
        if (a.table.isSponsor && !b.table.isSponsor) return -1;
        if (!a.table.isSponsor && b.table.isSponsor) return 1;
        return a.table.tableNumber - b.table.tableNumber;
      });
    }

    // Assign guests to seats
    const newSeats = new Map(seats);
    const newGuests = [...guests];
    let assignedCount = 0;

    guestsToAssign.forEach((guest, index) => {
      if (index >= availableSeats.length) return;
      
      const { tableId, seatId } = availableSeats[index];
      
      const tableSeats = newSeats.get(tableId);
      if (tableSeats) {
        newSeats.set(tableId, tableSeats.map(s => 
          s.id === seatId ? { ...s, assignedGuest: guest } : s
        ));
      }
      
      const guestIndex = newGuests.findIndex(g => g.id === guest.id);
      if (guestIndex !== -1) {
        newGuests[guestIndex] = {
          ...newGuests[guestIndex],
          isSeated: true,
          assignedSeatId: seatId,
          assignedTableId: tableId,
        };
      }
      
      assignedCount++;
    });

    setSeats(newSeats);
    setGuests(newGuests);

    toast.success(`Assigned ${assignedCount} guests!`, {
      description: `Strategy: ${strategy.replace('-', ' ')}`,
    });

    if (newGuests.every(g => g.isSeated)) {
      vibrateOnSuccess();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [guests, seats, tables, saveCurrentState, vibrateOnSuccess]);

  // Clear all assignments
  const handleClearAssignments = useCallback(() => {
    // Save state before change for undo
    saveCurrentState();

    setSeats(prev => {
      const newSeats = new Map<string, Seat[]>();
      prev.forEach((tableSeats, tableId) => {
        newSeats.set(tableId, tableSeats.map(s => ({ ...s, assignedGuest: undefined })));
      });
      return newSeats;
    });
    
    setGuests(prev => prev.map(g => ({ 
      ...g, 
      isSeated: false, 
      assignedSeatId: undefined, 
      assignedTableId: undefined 
    })));
    
    toast.info("All assignments cleared");
  }, [saveCurrentState]);

  // Unassign a guest from their seat
  const handleUnassignGuest = useCallback((guestId: string) => {
    const guest = guests.find(g => g.id === guestId);
    if (!guest || !guest.assignedTableId || !guest.assignedSeatId) return;

    // Save state before change for undo
    saveCurrentState();
    vibrateOnUnassign();

    setSeats(prev => {
      const newSeats = new Map(prev);
      const tableSeats = newSeats.get(guest.assignedTableId!);
      if (tableSeats) {
        newSeats.set(guest.assignedTableId!, tableSeats.map(s =>
          s.id === guest.assignedSeatId ? { ...s, assignedGuest: undefined } : s
        ));
      }
      return newSeats;
    });

    setGuests(prev => prev.map(g =>
      g.id === guestId
        ? { ...g, isSeated: false, assignedSeatId: undefined, assignedTableId: undefined }
        : g
    ));

    toast.success(`Unassigned ${guest.name}`);
  }, [guests, vibrateOnUnassign, saveCurrentState]);

  // Unassign by seat
  const handleUnassignSeat = useCallback((seatId: string) => {
    let foundGuest: Guest | undefined;
    seats.forEach((tableSeats) => {
      const seat = tableSeats.find(s => s.id === seatId);
      if (seat?.assignedGuest) {
        foundGuest = seat.assignedGuest;
      }
    });
    if (foundGuest) {
      handleUnassignGuest(foundGuest.id);
    }
  }, [seats, handleUnassignGuest]);

  // Clear all seats at a table
  const handleClearTable = useCallback((tableId: string) => {
    const tableSeats = seats.get(tableId);
    if (!tableSeats) return;

    // Save state before change for undo
    saveCurrentState();

    const guestsToUnassign = tableSeats
      .filter(s => s.assignedGuest)
      .map(s => s.assignedGuest!.id);

    // Batch unassign without saving state for each
    setSeats(prev => {
      const newSeats = new Map(prev);
      const currentTableSeats = newSeats.get(tableId);
      if (currentTableSeats) {
        newSeats.set(tableId, currentTableSeats.map(s => ({ ...s, assignedGuest: undefined })));
      }
      return newSeats;
    });

    setGuests(prev => prev.map(g =>
      guestsToUnassign.includes(g.id)
        ? { ...g, isSeated: false, assignedSeatId: undefined, assignedTableId: undefined }
        : g
    ));

    toast.info(`Cleared Table ${tables.find(t => t.id === tableId)?.tableNumber}`);
  }, [seats, tables, saveCurrentState]);

  // Toggle table VIP status
  const handleToggleVip = useCallback((tableId: string) => {
    setTables(prev => prev.map(t =>
      t.id === tableId ? { ...t, isVip: !t.isVip } : t
    ));
  }, []);

  // Toggle table lock
  const handleToggleLock = useCallback((tableId: string) => {
    setTables(prev => prev.map(t =>
      t.id === tableId ? { ...t, isLocked: !t.isLocked } : t
    ));
  }, []);

  // Rotate table
  const handleRotateTable = useCallback((tableId: string) => {
    setTables(prev => prev.map(t =>
      t.id === tableId ? { ...t, rotation: ((t.rotation || 0) + 45) % 360 } : t
    ));
  }, []);

  // Move table (for drag-and-drop in layout mode)
  const handleTableMove = useCallback((tableId: string, x: number, y: number) => {
    setTables(prev => prev.map(t =>
      t.id === tableId ? { ...t, x, y } : t
    ));
  }, []);

  // Move floor marker (for drag-and-drop in layout mode)
  const handleMarkerMove = useCallback((markerId: string, x: number, y: number) => {
    setMarkers(prev => prev.map(m =>
      m.id === markerId ? { ...m, x, y } : m
    ));
  }, []);

  // Add a new table
  const handleAddTable = useCallback((type: TableType, seats: number) => {
    const newTableNumber = Math.max(...tables.map(t => t.tableNumber), 0) + 1;
    const newTableId = `t${Date.now()}`;
    
    // Position new table in visible area (grid-snapped)
    const gridSize = 20;
    const canvasWidth = selectedPreset?.layout.canvasWidth || 600;
    const canvasHeight = selectedPreset?.layout.canvasHeight || 700;
    const x = Math.round((canvasWidth / 2) / gridSize) * gridSize;
    const y = Math.round((canvasHeight / 2) / gridSize) * gridSize;

    const newTable: Table = {
      id: newTableId,
      type,
      tableNumber: newTableNumber,
      seats,
      x,
      y,
    };

    setTables(prev => [...prev, newTable]);
    setSelectedTableId(newTableId);

    toast.success(`Added Table ${newTableNumber}`, {
      description: `${type === 'round' ? 'Round' : 'Rectangular'} table with ${seats} seats`,
    });
  }, [tables, selectedPreset]);

  // Remove a table
  const handleRemoveTable = useCallback((tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    if (table.isLocked) {
      toast.error("Cannot remove locked table");
      return;
    }

    // Check if table has guests
    const tableSeats = seats.get(tableId);
    const hasGuests = tableSeats?.some(s => s.assignedGuest);
    
    if (hasGuests) {
      // Unassign guests first
      handleClearTable(tableId);
    }

    setTables(prev => prev.filter(t => t.id !== tableId));
    setSeats(prev => {
      const newSeats = new Map(prev);
      newSeats.delete(tableId);
      return newSeats;
    });

    if (selectedTableId === tableId) {
      setSelectedTableId(null);
    }

    toast.success(`Removed Table ${table.tableNumber}`);
  }, [tables, seats, selectedTableId, handleClearTable]);

  // Remove selected table
  const handleRemoveSelectedTable = useCallback(() => {
    if (selectedTableId) {
      handleRemoveTable(selectedTableId);
    }
  }, [selectedTableId, handleRemoveTable]);

  // Add a new floor marker
  const handleAddMarker = useCallback((type: FloorMarkerType) => {
    const newMarkerId = `marker-${Date.now()}`;
    
    // Default sizes based on type
    const sizeMap: Record<FloorMarkerType, { width: number; height: number }> = {
      'stage': { width: 200, height: 80 },
      'screen': { width: 120, height: 20 },
      'dance-floor': { width: 150, height: 150 },
      'bar': { width: 100, height: 40 },
      'entrance': { width: 60, height: 30 },
      'exit': { width: 60, height: 30 },
      'podium': { width: 50, height: 50 },
      'dj-booth': { width: 80, height: 50 },
      'vip-zone': { width: 120, height: 100 },
    };
    
    const size = sizeMap[type] || { width: 100, height: 60 };
    
    // Position new marker in visible area (grid-snapped)
    const gridSize = 20;
    const canvasWidth = selectedPreset?.layout.canvasWidth || 600;
    const canvasHeight = selectedPreset?.layout.canvasHeight || 700;
    const x = Math.round((canvasWidth / 2 - size.width / 2) / gridSize) * gridSize;
    const y = Math.round((canvasHeight / 2 - size.height / 2) / gridSize) * gridSize;

    const newMarker: FloorMarker = {
      id: newMarkerId,
      type,
      x,
      y,
      width: size.width,
      height: size.height,
      label: type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' '),
    };

    setMarkers(prev => [...prev, newMarker]);
    setSelectedMarkerId(newMarkerId);

    toast.success(`Added ${newMarker.label}`, {
      description: "Drag to reposition in layout mode",
    });
  }, [selectedPreset]);

  // Remove a floor marker
  const handleRemoveMarker = useCallback((markerId: string) => {
    const marker = markers.find(m => m.id === markerId);
    if (!marker) return;

    setMarkers(prev => prev.filter(m => m.id !== markerId));
    
    if (selectedMarkerId === markerId) {
      setSelectedMarkerId(null);
    }

    toast.success(`Removed ${marker.label || marker.type}`);
  }, [markers, selectedMarkerId]);

  // Remove selected marker
  const handleRemoveSelectedMarker = useCallback(() => {
    if (selectedMarkerId) {
      handleRemoveMarker(selectedMarkerId);
    }
  }, [selectedMarkerId, handleRemoveMarker]);

  // Handle seat context menu
  const handleSeatContextMenu = useCallback((e: React.MouseEvent | React.TouchEvent, seat: Seat, tableId: string) => {
    const position = 'clientX' in e 
      ? { x: e.clientX, y: e.clientY }
      : { x: e.touches?.[0]?.clientX || 0, y: e.touches?.[0]?.clientY || 0 };
    
    setSeatContextMenu({
      isOpen: true,
      position,
      seat,
      tableId,
    });
  }, []);

  // Handle table context menu
  const handleTableContextMenu = useCallback((e: React.MouseEvent | React.TouchEvent, table: Table) => {
    const position = 'clientX' in e 
      ? { x: e.clientX, y: e.clientY }
      : { x: e.touches?.[0]?.clientX || 0, y: e.touches?.[0]?.clientY || 0 };
    
    setTableContextMenu({
      isOpen: true,
      position,
      table,
    });
  }, []);

  // Handle guest selection from list
  const handleGuestSelect = useCallback((guest: Guest) => {
    setSelectedGuestId(guest.id === selectedGuestId ? null : guest.id);
    
    if (guest.assignedTableId) {
      setSelectedTableId(guest.assignedTableId);
    }
  }, [selectedGuestId]);

  // Export handlers
  const handleExportPDF = useCallback(() => {
    exportAsPDF({
      tables,
      seats,
      guests,
      markers,
      canvasElement: canvasRef.current,
      layoutName: selectedPreset?.name || "Event Seating Chart",
    }, selectedPreset?.name?.replace(/\s+/g, '-').toLowerCase() || "seating-chart");
  }, [exportAsPDF, tables, seats, guests, markers, selectedPreset]);

  const handleExportImage = useCallback(() => {
    const canvasElement = canvasRef.current;
    exportAsImage(canvasElement, selectedPreset?.name?.replace(/\s+/g, '-').toLowerCase() || "seating-chart");
  }, [exportAsImage, selectedPreset]);

  const handleExportCSV = useCallback(() => {
    exportAsCSV({
      tables,
      seats,
      guests,
      markers,
      layoutName: selectedPreset?.name,
    }, selectedPreset?.name?.replace(/\s+/g, '-').toLowerCase() || "seating-assignments");
  }, [exportAsCSV, tables, seats, guests, markers, selectedPreset]);

  // Preset selector view
  if (showPresetSelector) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-br from-slate-900/50 via-background to-background p-3 md:p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-3 md:mb-4 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base md:text-lg font-bold truncate">Event Seating Planner</h1>
              <p className="text-xs text-muted-foreground truncate">AI-powered seat assignment</p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1 flex-shrink-0 text-xs">
            <Sparkles className="w-3 h-3" />
            <span className="hidden sm:inline">AI-Assisted</span>
          </Badge>
        </div>

        <div className="flex-1 overflow-auto min-h-0">
          <LayoutPresetSelector
            onSelect={handlePresetSelect}
            selectedPresetId={selectedPreset?.id}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900/50 via-background to-background overflow-hidden">
      {/* Header */}
      <div className="p-2 md:p-3 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center justify-between gap-2 mb-2 md:mb-3">
          <div className="flex items-center gap-1 md:gap-2 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 md:h-8 md:w-8 flex-shrink-0"
              onClick={() => setShowPresetSelector(true)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xs md:text-sm font-bold flex items-center gap-1 md:gap-2 flex-wrap">
                <span className="truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">{selectedPreset?.name || 'Event Seating'}</span>
                <Badge variant="secondary" className="text-[10px] md:text-xs flex-shrink-0">
                  {stats.seatedGuests}/{guests.length}
                </Badge>
              </h1>
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                {editorMode === 'layout' 
                  ? "Drag to reposition • Click to select"
                  : "Drag guests onto seats"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Table toolbar (layout mode only on desktop) */}
            {editorMode === 'layout' && (
              <div className="hidden lg:block border-r border-border pr-2 mr-1">
                <TableToolbar
                  onAddTable={handleAddTable}
                  onRemoveSelected={handleRemoveSelectedTable}
                  selectedTableId={selectedTableId}
                  tableCount={tables.length}
                />
              </div>
            )}
            {/* Marker toolbar (layout mode only on desktop) */}
            {editorMode === 'layout' && (
              <div className="hidden lg:block border-r border-border pr-2 mr-1">
                <MarkerToolbar
                  onAddMarker={handleAddMarker}
                  onRemoveSelected={handleRemoveSelectedMarker}
                  selectedMarkerId={selectedMarkerId}
                  markerCount={markers.length}
                />
              </div>
            )}
            {/* Editor mode toggle */}
            <div className="hidden md:flex items-center gap-1 border-r border-border pr-2 mr-1">
              <Button
                variant={editorMode === 'assignment' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={() => setEditorMode('assignment')}
                title="Assignment mode - assign guests to seats"
              >
                <MousePointer2 className="h-3 w-3" />
                Assign
              </Button>
              <Button
                variant={editorMode === 'layout' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={() => setEditorMode('layout')}
                title="Layout mode - drag tables to reposition"
              >
                <Move className="h-3 w-3" />
                Layout
              </Button>
            </div>

            {/* Undo/Redo buttons */}
            <div className="hidden md:flex items-center gap-1 border-r border-border pr-2 mr-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleUndo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRedo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Export menu */}
            <div className="hidden md:block">
              <ExportMenu
                onExportPDF={handleExportPDF}
                onExportImage={handleExportImage}
                onExportCSV={handleExportCSV}
              />
            </div>
          </div>
        </div>

        {/* Stats bar (desktop) */}
        <div className="hidden md:block">
          <SeatingStatsBar stats={stats} className="bg-transparent border-0 p-0" />
        </div>

        {/* Mobile stats and mode toggle */}
        <div className="md:hidden flex items-center justify-between gap-2 text-xs text-muted-foreground px-1">
          <div className="flex items-center gap-1.5">
            <Button
              variant={editorMode === 'assignment' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-6 px-1.5 text-[10px]"
              onClick={() => setEditorMode('assignment')}
            >
              <MousePointer2 className="h-3 w-3" />
              <span className="hidden xs:inline ml-1">Assign</span>
            </Button>
            <Button
              variant={editorMode === 'layout' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-6 px-1.5 text-[10px]"
              onClick={() => setEditorMode('layout')}
            >
              <Move className="h-3 w-3" />
              <span className="hidden xs:inline ml-1">Layout</span>
            </Button>
          </div>
          <span className="text-[10px] whitespace-nowrap">{stats.seatedGuests}/{guests.length} seated</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop: Side-by-side layout */}
        <div className="hidden md:flex flex-1">
          {/* Canvas */}
          <div ref={canvasRef} className="flex-1 p-4 relative">
            <SeatingCanvas
              tables={tables}
              seats={seats}
              markers={markers}
              guests={guests}
              editorMode={editorMode}
              selectedTableId={selectedTableId}
              selectedMarkerId={selectedMarkerId}
              onTableSelect={setSelectedTableId}
              onMarkerSelect={setSelectedMarkerId}
              onSeatSelect={(seatId) => {
                if (swapMode.isActive && seatId) {
                  handleSeatClickForSwap(seatId);
                }
              }}
              onAssignGuest={handleAssignGuest}
              onTableMove={handleTableMove}
              onMarkerMove={handleMarkerMove}
              onSeatContextMenu={handleSeatContextMenu}
              onTableContextMenu={handleTableContextMenu}
              canvasWidth={selectedPreset?.layout.canvasWidth || 600}
              canvasHeight={selectedPreset?.layout.canvasHeight || 700}
            />
            
            {/* Swap mode overlay */}
            <SwapModeOverlay
              isActive={swapMode.isActive}
              sourceGuest={swapMode.sourceGuest}
              onCancel={handleCancelSwapMode}
            />
          </div>

          {/* Side panel */}
          <div className="w-80 border-l border-border flex flex-col">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
              <TabsList className="mx-3 mt-3 grid grid-cols-2">
                <TabsTrigger value="guests" className="text-xs gap-1">
                  <Users className="w-3 h-3" />
                  Guests
                </TabsTrigger>
                <TabsTrigger value="ai" className="text-xs gap-1">
                  <Bot className="w-3 h-3" />
                  AI Assist
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="guests" className="flex-1 m-0 p-3">
                <GuestListPanel
                  guests={guests}
                  onGuestSelect={handleGuestSelect}
                  onUnassignGuest={handleUnassignGuest}
                  selectedGuestId={selectedGuestId}
                />
              </TabsContent>
              
              <TabsContent value="ai" className="flex-1 m-0 p-3">
                <AISeatingAssistant
                  guests={guests}
                  tables={tables}
                  seats={seats}
                  onAutoAssign={handleAutoAssign}
                  onClearAssignments={handleClearAssignments}
                  onAssignGuest={handleAssignGuest}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Mobile: Tabs layout */}
        <div className="md:hidden flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
            <TabsList className="mx-3 mt-3 grid grid-cols-3">
              <TabsTrigger value="canvas" className="text-xs gap-1">
                <Layout className="w-3 h-3" />
                Floor Plan
              </TabsTrigger>
              <TabsTrigger value="guests" className="text-xs gap-1">
                <Users className="w-3 h-3" />
                Guests
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-xs gap-1">
                <Bot className="w-3 h-3" />
                AI
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="canvas" className="flex-1 m-0 p-3 relative">
              <SeatingCanvas
                tables={tables}
                seats={seats}
                markers={markers}
                guests={guests}
                editorMode={editorMode}
                selectedTableId={selectedTableId}
                selectedMarkerId={selectedMarkerId}
                onTableSelect={setSelectedTableId}
                onMarkerSelect={setSelectedMarkerId}
                onSeatSelect={(seatId) => {
                  if (swapMode.isActive && seatId) {
                    handleSeatClickForSwap(seatId);
                  }
                }}
                onAssignGuest={handleAssignGuest}
                onTableMove={handleTableMove}
                onMarkerMove={handleMarkerMove}
                onSeatContextMenu={handleSeatContextMenu}
                onTableContextMenu={handleTableContextMenu}
                canvasWidth={selectedPreset?.layout.canvasWidth || 600}
                canvasHeight={selectedPreset?.layout.canvasHeight || 700}
              />
              
              {/* Swap mode overlay */}
              <SwapModeOverlay
                isActive={swapMode.isActive}
                sourceGuest={swapMode.sourceGuest}
                onCancel={handleCancelSwapMode}
              />
            </TabsContent>
            
            <TabsContent value="guests" className="flex-1 m-0 p-3">
              <GuestListPanel
                guests={guests}
                onGuestSelect={handleGuestSelect}
                onUnassignGuest={handleUnassignGuest}
                selectedGuestId={selectedGuestId}
              />
            </TabsContent>
            
            <TabsContent value="ai" className="flex-1 m-0 p-3">
              <AISeatingAssistant
                guests={guests}
                tables={tables}
                seats={seats}
                onAutoAssign={handleAutoAssign}
                onClearAssignments={handleClearAssignments}
                onAssignGuest={handleAssignGuest}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Legend (desktop) */}
      <div className="hidden md:block p-3 border-t border-border bg-card/50">
        <SeatingLegend />
      </div>

      {/* Context Menus */}
      <SeatContextMenu
        isOpen={seatContextMenu.isOpen}
        position={seatContextMenu.position}
        seat={seatContextMenu.seat}
        guest={seatContextMenu.seat?.assignedGuest || null}
        onClose={() => setSeatContextMenu(prev => ({ ...prev, isOpen: false }))}
        onUnassign={(seatId) => handleUnassignSeat(seatId)}
        onSwap={(seatId) => handleEnterSwapMode(seatId)}
      />
      <TableContextMenu
        isOpen={tableContextMenu.isOpen}
        position={tableContextMenu.position}
        table={tableContextMenu.table}
        onClose={() => setTableContextMenu(prev => ({ ...prev, isOpen: false }))}
        onToggleLock={(tableId) => handleToggleLock(tableId)}
        onToggleVip={(tableId) => handleToggleVip(tableId)}
        onClearTable={(tableId) => handleClearTable(tableId)}
        onRotateTable={(tableId) => handleRotateTable(tableId)}
        onRemoveTable={(tableId) => handleRemoveTable(tableId)}
      />
    </div>
  );
}
