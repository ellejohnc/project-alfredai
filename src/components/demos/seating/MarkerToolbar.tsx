import { Plus, Trash2, Square, Music2, DoorOpen, DoorClosed, GlassWater, PartyPopper, Monitor, Mic2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { FloorMarkerType } from "./types";

interface MarkerToolbarProps {
  onAddMarker: (type: FloorMarkerType) => void;
  onRemoveSelected: () => void;
  selectedMarkerId: string | null;
  markerCount: number;
}

const markerConfig: { type: FloorMarkerType; label: string; icon: React.ReactNode; category: string }[] = [
  { type: 'stage', label: 'Stage', icon: <Square className="h-3.5 w-3.5" />, category: 'Performance' },
  { type: 'podium', label: 'Podium', icon: <Mic2 className="h-3.5 w-3.5" />, category: 'Performance' },
  { type: 'dj-booth', label: 'DJ Booth', icon: <Music2 className="h-3.5 w-3.5" />, category: 'Performance' },
  { type: 'screen', label: 'Screen', icon: <Monitor className="h-3.5 w-3.5" />, category: 'Performance' },
  { type: 'dance-floor', label: 'Dance Floor', icon: <PartyPopper className="h-3.5 w-3.5" />, category: 'Area' },
  { type: 'vip-zone', label: 'VIP Zone', icon: <Crown className="h-3.5 w-3.5" />, category: 'Area' },
  { type: 'bar', label: 'Bar', icon: <GlassWater className="h-3.5 w-3.5" />, category: 'Amenity' },
  { type: 'entrance', label: 'Entrance', icon: <DoorOpen className="h-3.5 w-3.5" />, category: 'Access' },
  { type: 'exit', label: 'Exit', icon: <DoorClosed className="h-3.5 w-3.5" />, category: 'Access' },
];

export function MarkerToolbar({
  onAddMarker,
  onRemoveSelected,
  selectedMarkerId,
  markerCount,
}: MarkerToolbarProps) {
  const categories = Array.from(new Set(markerConfig.map(m => m.category)));

  return (
    <div className="flex items-center gap-2">
      {/* Add marker dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Add Marker
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {categories.map((category, idx) => (
            <div key={category}>
              {idx > 0 && <DropdownMenuSeparator />}
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                {category}
              </div>
              {markerConfig
                .filter(m => m.category === category)
                .map(marker => (
                  <DropdownMenuItem 
                    key={marker.type} 
                    onClick={() => onAddMarker(marker.type)} 
                    className="gap-2"
                  >
                    {marker.icon}
                    <span>{marker.label}</span>
                  </DropdownMenuItem>
                ))}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Remove selected marker */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive"
        onClick={onRemoveSelected}
        disabled={!selectedMarkerId}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Remove
      </Button>

      {/* Marker count badge */}
      <Badge variant="secondary" className="h-6 text-xs">
        {markerCount} markers
      </Badge>
    </div>
  );
}
