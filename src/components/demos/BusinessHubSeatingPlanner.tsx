import { useState, useCallback } from "react";
import { motion, Reorder } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  Sparkles, 
  User, 
  Check, 
  RotateCcw,
  GripVertical,
  Crown,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type GuestTier = 'vip' | 'sponsor' | 'standard';

interface MiniGuest {
  id: string;
  name: string;
  company: string;
  tier: GuestTier;
  tableId?: string;
  seatIndex?: number;
}

interface MiniTable {
  id: string;
  number: number;
  isVip?: boolean;
  seats: (MiniGuest | null)[];
}

const initialGuests: MiniGuest[] = [
  { id: 'g1', name: 'James Wilson', company: 'Acme Corp', tier: 'vip' },
  { id: 'g2', name: 'Jane Smith', company: 'TechStart', tier: 'sponsor' },
  { id: 'g3', name: 'Michael Brown', company: 'Global Finance', tier: 'vip' },
  { id: 'g4', name: 'Lisa Zhang', company: 'Creative Studios', tier: 'standard' },
  { id: 'g5', name: 'David Lee', company: 'Health Plus', tier: 'standard' },
  { id: 'g6', name: 'Emily Watson', company: 'Acme Corp', tier: 'sponsor' },
];

const initialTables: MiniTable[] = [
  { id: 't1', number: 1, isVip: true, seats: [null, null, null] },
  { id: 't2', number: 2, isVip: true, seats: [null, null, null] },
  { id: 't3', number: 3, seats: [null, null, null] },
  { id: 't4', number: 4, seats: [null, null, null] },
];

const tierIcons: Record<GuestTier, typeof Crown> = {
  vip: Crown,
  sponsor: Award,
  standard: User,
};

const tierColors: Record<GuestTier, string> = {
  vip: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  sponsor: 'text-violet-500 bg-violet-500/10 border-violet-500/30',
  standard: 'text-muted-foreground bg-muted/50 border-border/50',
};

export default function BusinessHubSeatingPlanner() {
  const [guests, setGuests] = useState<MiniGuest[]>(initialGuests);
  const [tables, setTables] = useState<MiniTable[]>(initialTables);
  const [draggedGuest, setDraggedGuest] = useState<MiniGuest | null>(null);
  const [hoveredSeat, setHoveredSeat] = useState<{ tableId: string; seatIndex: number } | null>(null);

  const unseatedGuests = guests.filter(g => !g.tableId);
  const seatedCount = guests.filter(g => g.tableId).length;

  const handleDragStart = useCallback((guest: MiniGuest) => {
    setDraggedGuest(guest);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (draggedGuest && hoveredSeat) {
      assignGuestToSeat(draggedGuest, hoveredSeat.tableId, hoveredSeat.seatIndex);
    }
    setDraggedGuest(null);
    setHoveredSeat(null);
  }, [draggedGuest, hoveredSeat]);

  const assignGuestToSeat = useCallback((guest: MiniGuest, tableId: string, seatIndex: number) => {
    // Check if seat is occupied
    const table = tables.find(t => t.id === tableId);
    if (table?.seats[seatIndex]) {
      toast.error("Seat already taken");
      return;
    }

    // Remove from previous seat if any
    setTables(prev => prev.map(t => ({
      ...t,
      seats: t.seats.map((s, i) => 
        s?.id === guest.id ? null : s
      )
    })));

    // Assign to new seat
    setTables(prev => prev.map(t => 
      t.id === tableId
        ? { ...t, seats: t.seats.map((s, i) => i === seatIndex ? guest : s) }
        : t
    ));

    // Update guest
    setGuests(prev => prev.map(g => 
      g.id === guest.id
        ? { ...g, tableId, seatIndex }
        : g
    ));

    toast.success(`${guest.name} seated at Table ${table?.number}`);
  }, [tables]);

  const removeSeatAssignment = useCallback((tableId: string, seatIndex: number) => {
    const table = tables.find(t => t.id === tableId);
    const guest = table?.seats[seatIndex];
    if (!guest) return;

    setTables(prev => prev.map(t => 
      t.id === tableId
        ? { ...t, seats: t.seats.map((s, i) => i === seatIndex ? null : s) }
        : t
    ));

    setGuests(prev => prev.map(g => 
      g.id === guest.id
        ? { ...g, tableId: undefined, seatIndex: undefined }
        : g
    ));
  }, [tables]);

  const autoAssign = useCallback(() => {
    const unassigned = guests.filter(g => !g.tableId);
    if (unassigned.length === 0) {
      toast.info("All guests already seated!");
      return;
    }

    // Sort VIPs first, then sponsors, then standard
    const sortedGuests = [...unassigned].sort((a, b) => {
      const order = { vip: 0, sponsor: 1, standard: 2 };
      return order[a.tier] - order[b.tier];
    });

    // Deep copy tables with seats
    const newTables: MiniTable[] = tables.map(t => ({
      ...t,
      seats: [...t.seats]
    }));
    
    const newGuests = [...guests];
    let assigned = 0;

    // Assign each guest one by one with animation delay
    const assignWithDelay = (index: number) => {
      if (index >= sortedGuests.length) {
        if (assigned > 0) {
          toast.success(`AI assigned ${assigned} guest${assigned > 1 ? 's' : ''}!`);
        }
        return;
      }

      const guest = sortedGuests[index];
      
      // Prioritize VIP tables for VIPs
      const tableOrder = guest.tier === 'vip' 
        ? [...newTables.filter(t => t.isVip), ...newTables.filter(t => !t.isVip)]
        : newTables;

      for (const table of tableOrder) {
        const tableIndex = newTables.findIndex(t => t.id === table.id);
        const seatIndex = newTables[tableIndex].seats.findIndex(s => s === null);
        
        if (seatIndex !== -1) {
          // Update the guest with seat info
          const updatedGuest = { ...guest, tableId: table.id, seatIndex };
          
          // Assign guest to seat in newTables
          newTables[tableIndex].seats[seatIndex] = updatedGuest;
          
          // Update guest in newGuests array
          const guestIndex = newGuests.findIndex(g => g.id === guest.id);
          if (guestIndex !== -1) {
            newGuests[guestIndex] = updatedGuest;
          }
          
          assigned++;
          break;
        }
      }

      // Update state after each assignment for animation effect
      setTables([...newTables.map(t => ({ ...t, seats: [...t.seats] }))]);
      setGuests([...newGuests]);
      
      // Continue to next guest with delay
      setTimeout(() => assignWithDelay(index + 1), 200);
    };

    assignWithDelay(0);
  }, [guests, tables]);

  const resetAll = useCallback(() => {
    setGuests(initialGuests);
    setTables(initialTables);
    toast.info("Seating plan reset");
  }, []);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-foreground">Seating Plan</h4>
          <Badge variant="outline" className="text-[10px]">
            {seatedCount}/{guests.length} seated
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetAll}
            className="h-6 px-2 text-[10px]"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={autoAssign}
            className="h-6 px-2 text-[10px] bg-violet-500/10 text-violet-600 border-violet-500/30 hover:bg-violet-500/20"
            disabled={unseatedGuests.length === 0}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            AI Assign
          </Button>
        </div>
      </div>

      {/* Canvas with Tables */}
      <div className="relative bg-muted/30 rounded-lg p-3 border border-border/50 min-h-[140px]">
        {/* Stage */}
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary/20 text-primary text-[10px] font-medium rounded-full">
          STAGE
        </div>
        
        {/* Tables Grid */}
        <div className="grid grid-cols-4 gap-2 mt-7">
          {tables.map((table) => (
            <div key={table.id} className="flex flex-col items-center gap-1">
              {/* Table Circle */}
              <div
                className={cn(
                  "relative w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all",
                  table.isVip 
                    ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/40" 
                    : "bg-primary/10 text-primary border-primary/30"
                )}
              >
                T{table.number}
              </div>
              
              {/* Seats */}
              <div className="flex gap-0.5">
                {table.seats.map((seat, seatIndex) => {
                  const isHovered = hoveredSeat?.tableId === table.id && hoveredSeat?.seatIndex === seatIndex;
                  const TierIcon = seat ? tierIcons[seat.tier] : User;
                  
                  return (
                    <motion.button
                      key={`${table.id}-seat-${seatIndex}`}
                      onMouseEnter={() => setHoveredSeat({ tableId: table.id, seatIndex })}
                      onMouseLeave={() => setHoveredSeat(null)}
                      onClick={() => {
                        if (seat) {
                          removeSeatAssignment(table.id, seatIndex);
                        } else if (draggedGuest) {
                          assignGuestToSeat(draggedGuest, table.id, seatIndex);
                          setDraggedGuest(null);
                        }
                      }}
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center transition-all border",
                        seat 
                          ? tierColors[seat.tier]
                          : isHovered && draggedGuest
                            ? "bg-emerald-500/30 border-emerald-500 scale-110"
                            : "bg-muted/50 border-border/50 hover:border-primary/50"
                      )}
                      title={seat ? `${seat.name} (${seat.tier}) - Click to remove` : "Empty seat"}
                      whileHover={{ scale: seat ? 1 : 1.15 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {seat ? (
                        <TierIcon className="w-2.5 h-2.5" />
                      ) : (
                        <span className="w-1 h-1 rounded-full bg-border" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-3 mt-3 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> VIP Table
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary" /> Standard
          </span>
        </div>
      </div>

      {/* Unseated Guests */}
      {unseatedGuests.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground font-medium">
            Drag to assign ({unseatedGuests.length} waiting)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {unseatedGuests.map((guest) => {
              const TierIcon = tierIcons[guest.tier];
              const isDragging = draggedGuest?.id === guest.id;
              
              return (
                <motion.button
                  key={guest.id}
                  draggable
                  onDragStart={() => handleDragStart(guest)}
                  onDragEnd={handleDragEnd}
                  onClick={() => {
                    if (draggedGuest?.id === guest.id) {
                      setDraggedGuest(null);
                    } else {
                      setDraggedGuest(guest);
                      toast.info(`Select a seat for ${guest.name}`, { duration: 2000 });
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border cursor-grab active:cursor-grabbing transition-all",
                    tierColors[guest.tier],
                    isDragging && "ring-2 ring-primary ring-offset-1 opacity-70"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <GripVertical className="w-2.5 h-2.5 opacity-50" />
                  <TierIcon className="w-2.5 h-2.5" />
                  <span className="truncate max-w-[60px]">{guest.name.split(' ')[0]}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* All Seated Message */}
      {unseatedGuests.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 py-2 text-xs text-emerald-600 bg-emerald-500/10 rounded-lg"
        >
          <Check className="w-3.5 h-3.5" />
          All guests are seated!
        </motion.div>
      )}
    </div>
  );
}
