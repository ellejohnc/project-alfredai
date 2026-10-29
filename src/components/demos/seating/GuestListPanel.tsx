import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { Search, User, Users, Check, X, Building2, Crown, Filter, UserMinus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Guest } from "./types";
import { companyColors, tierColors } from "./seatingData";

interface GuestListPanelProps {
  guests: Guest[];
  onGuestSelect?: (guest: Guest) => void;
  onUnassignGuest?: (guestId: string) => void;
  selectedGuestId?: string | null;
}

type FilterType = 'all' | 'seated' | 'unseated';

export function GuestListPanel({
  guests,
  onGuestSelect,
  onUnassignGuest,
  selectedGuestId,
}: GuestListPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Filter and search guests
  const filteredGuests = useMemo(() => {
    let result = [...guests];

    // Apply filter
    if (filterType === 'seated') {
      result = result.filter(g => g.isSeated);
    } else if (filterType === 'unseated') {
      result = result.filter(g => !g.isSeated);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(g => 
        g.name.toLowerCase().includes(query) ||
        g.company.toLowerCase().includes(query) ||
        g.email.toLowerCase().includes(query)
      );
    }

    return result;
  }, [guests, filterType, searchQuery]);

  // Stats
  const seatedCount = guests.filter(g => g.isSeated).length;
  const unseatedCount = guests.length - seatedCount;

  const handleDragStart = (e: React.DragEvent, guest: Guest) => {
    e.dataTransfer.setData('guestId', guest.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const getTierIcon = (tier: Guest['tier']) => {
    switch (tier) {
      case 'vip':
        return <Crown className="w-3 h-3" />;
      case 'sponsor':
        return <Building2 className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Guest List
          </h3>
          <Badge variant="secondary" className="text-xs">
            {seatedCount}/{guests.length}
          </Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search guests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filter tabs */}
        <Tabs value={filterType} onValueChange={(v) => setFilterType(v as FilterType)} className="mt-2">
          <TabsList className="h-7 w-full">
            <TabsTrigger value="all" className="text-xs flex-1 h-6">
              All ({guests.length})
            </TabsTrigger>
            <TabsTrigger value="unseated" className="text-xs flex-1 h-6">
              Unseated ({unseatedCount})
            </TabsTrigger>
            <TabsTrigger value="seated" className="text-xs flex-1 h-6">
              Seated ({seatedCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Guest list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <AnimatePresence mode="popLayout">
            {filteredGuests.map((guest, index) => (
              <motion.div
                key={guest.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.02 }}
                draggable={!guest.isSeated}
                onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, guest)}
                onClick={() => onGuestSelect?.(guest)}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200",
                  "border border-transparent hover:border-border hover:bg-muted/50",
                  guest.isSeated && "opacity-60",
                  !guest.isSeated && "hover:shadow-md cursor-grab active:cursor-grabbing",
                  selectedGuestId === guest.id && "border-primary bg-primary/10",
                )}
              >
                {/* Avatar */}
                <div 
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                    guest.tier === 'vip' && "bg-amber-400/20 text-amber-600 border border-amber-400/30",
                    guest.tier === 'sponsor' && "bg-purple-400/20 text-purple-600 border border-purple-400/30",
                    guest.tier === 'standard' && "bg-muted text-muted-foreground border border-border",
                  )}
                >
                  {getInitials(guest.name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium truncate">{guest.name}</span>
                    {guest.tier !== 'standard' && (
                      <span className={cn(
                        "flex items-center justify-center w-4 h-4 rounded",
                        guest.tier === 'vip' && "text-amber-500",
                        guest.tier === 'sponsor' && "text-purple-500",
                      )}>
                        {getTierIcon(guest.tier)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span 
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: companyColors[guest.company] || 'hsl(var(--muted-foreground))' }}
                    />
                    <span className="truncate">{guest.company}</span>
                  </div>
                </div>

                {/* Status / Unassign */}
                {guest.isSeated && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnassignGuest?.(guest.id);
                    }}
                    title="Unassign guest"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </Button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty state */}
          {filteredGuests.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No guests found</p>
              {searchQuery && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="mt-1"
                >
                  Clear search
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer hint */}
      <div className="p-2 border-t border-border bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          Drag guests onto seats to assign
        </p>
      </div>
    </div>
  );
}
