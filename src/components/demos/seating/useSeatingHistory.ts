import { useState, useCallback, useEffect, useRef } from "react";
import type { Guest, Seat } from "./types";

interface SeatingState {
  seats: Map<string, Seat[]>;
  guests: Guest[];
  timestamp: number;
}

interface UseSeatingHistoryOptions {
  maxHistory?: number;
}

export function useSeatingHistory(options: UseSeatingHistoryOptions = {}) {
  const { maxHistory = 50 } = options;
  
  const [history, setHistory] = useState<SeatingState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isRestoringRef = useRef(false);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  // Save current state to history
  const saveState = useCallback((seats: Map<string, Seat[]>, guests: Guest[]) => {
    // Skip if we're in the middle of restoring
    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      return;
    }

    // Deep clone the state
    const clonedSeats = new Map<string, Seat[]>();
    seats.forEach((tableSeats, tableId) => {
      clonedSeats.set(tableId, tableSeats.map(s => ({
        ...s,
        assignedGuest: s.assignedGuest ? { ...s.assignedGuest } : undefined,
      })));
    });

    const clonedGuests = guests.map(g => ({ ...g }));

    const newState: SeatingState = {
      seats: clonedSeats,
      guests: clonedGuests,
      timestamp: Date.now(),
    };

    setHistory(prev => {
      // Remove any redo history after current index
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Add new state
      newHistory.push(newState);
      
      // Limit history size
      if (newHistory.length > maxHistory) {
        newHistory.shift();
        setCurrentIndex(current => Math.max(0, current));
        return newHistory;
      }
      
      return newHistory;
    });
    
    setCurrentIndex(prev => Math.min(prev + 1, maxHistory - 1));
  }, [currentIndex, maxHistory]);

  // Undo - go back one state
  const undo = useCallback((): SeatingState | null => {
    if (!canUndo) return null;
    
    isRestoringRef.current = true;
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    return history[newIndex];
  }, [canUndo, currentIndex, history]);

  // Redo - go forward one state
  const redo = useCallback((): SeatingState | null => {
    if (!canRedo) return null;
    
    isRestoringRef.current = true;
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    return history[newIndex];
  }, [canRedo, currentIndex, history]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        return; // Return the action to be handled by parent
      }
      
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        return; // Return the action to be handled by parent
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    historyLength: history.length,
    currentIndex,
  };
}
