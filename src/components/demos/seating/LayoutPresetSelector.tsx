import { motion } from "framer-motion";
import { Check, Users, Crown, TableProperties, Circle, RectangleHorizontal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LayoutPreset, Table, FloorMarker } from "./types";
import { layoutPresets } from "./seatingData";

interface LayoutPresetSelectorProps {
  onSelect: (preset: LayoutPreset) => void;
  selectedPresetId?: string | null;
}

// Render a mini table in the preview
function MiniTable({ table, canvasWidth, canvasHeight }: { 
  table: Table; 
  canvasWidth: number; 
  canvasHeight: number;
}) {
  const xPercent = (table.x / canvasWidth) * 100;
  const yPercent = (table.y / canvasHeight) * 100;
  
  // Scale sizes based on table type
  const isRound = table.type === 'round';
  const baseSize = isRound ? 12 : 20;
  const height = isRound ? baseSize : 8;
  
  return (
    <div
      className={cn(
        "absolute border transition-all",
        isRound ? "rounded-full" : "rounded-sm",
        table.isVip && "border-amber-400 bg-amber-400/30",
        table.isSponsor && "border-purple-400 bg-purple-400/20",
        !table.isVip && !table.isSponsor && "border-slate-400/50 bg-slate-500/30"
      )}
      style={{
        width: baseSize,
        height: height,
        left: `${xPercent}%`,
        top: `${yPercent}%`,
        transform: `translate(-50%, -50%) ${table.rotation ? `rotate(${table.rotation}deg)` : ''}`,
      }}
    />
  );
}

// Render a mini marker in the preview
function MiniMarker({ marker, canvasWidth, canvasHeight }: { 
  marker: FloorMarker; 
  canvasWidth: number; 
  canvasHeight: number;
}) {
  const xPercent = (marker.x / canvasWidth) * 100;
  const yPercent = (marker.y / canvasHeight) * 100;
  
  // Scale marker sizes for preview
  const widthScale = 0.12;
  const heightScale = 0.12;
  const width = Math.max(marker.width * widthScale, 20);
  const height = Math.max(marker.height * heightScale, 8);
  
  if (marker.type === 'stage') {
    return (
      <div
        className="absolute bg-slate-600 rounded-sm flex items-center justify-center"
        style={{
          width: width * 1.2,
          height: height,
          left: `${xPercent}%`,
          top: `${yPercent}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <span className="text-[5px] text-slate-300 font-medium uppercase tracking-wide">Stage</span>
      </div>
    );
  }
  
  if (marker.type === 'dance-floor') {
    return (
      <div
        className="absolute border border-dashed border-purple-400/50 bg-purple-400/10 rounded-sm"
        style={{
          width: Math.max(marker.width * widthScale, 24),
          height: Math.max(marker.height * heightScale, 24),
          left: `${xPercent}%`,
          top: `${yPercent}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />
    );
  }
  
  if (marker.type === 'bar') {
    return (
      <div
        className="absolute bg-orange-500/40 border border-orange-400/60 rounded-sm flex items-center justify-center"
        style={{
          width: width * 0.8,
          height: height,
          left: `${xPercent}%`,
          top: `${yPercent}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <span className="text-[5px] text-orange-200 font-medium">Bar</span>
      </div>
    );
  }
  
  if (marker.type === 'screen') {
    return (
      <div
        className="absolute bg-slate-700 rounded-sm"
        style={{
          width: width,
          height: 4,
          left: `${xPercent}%`,
          top: `${yPercent}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />
    );
  }
  
  // Entrance or other markers - small indicator
  return null;
}

// Layout-specific preview renderers
function LayoutPreview({ preset }: { preset: LayoutPreset }) {
  const { layout } = preset;
  const canvasWidth = layout.canvasWidth || 600;
  const canvasHeight = layout.canvasHeight || 600;
  
  return (
    <div className="relative w-full h-full">
      {/* Render markers first (behind tables) */}
      {layout.markers.map((marker) => (
        <MiniMarker
          key={marker.id}
          marker={marker}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
        />
      ))}
      
      {/* Render all tables */}
      {layout.tables.map((table) => (
        <MiniTable
          key={table.id}
          table={table}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
        />
      ))}
    </div>
  );
}

export function LayoutPresetSelector({
  onSelect,
  selectedPresetId,
}: LayoutPresetSelectorProps) {
  return (
    <div className="space-y-4 max-w-full overflow-hidden">
      <div className="text-center mb-4 md:mb-6 px-2">
        <h2 className="text-lg md:text-xl font-bold mb-1 md:mb-2">Choose a Layout Preset</h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          Select a venue configuration to get started quickly
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 px-1">
        {layoutPresets.map((preset, index) => (
          <motion.div
            key={preset.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50",
                selectedPresetId === preset.id && "border-primary ring-2 ring-primary/20"
              )}
              onClick={() => onSelect(preset)}
            >
              <CardHeader className="p-3 md:pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm md:text-base flex items-center gap-2 truncate">
                      <span className="truncate">{preset.name}</span>
                      {selectedPresetId === preset.id && (
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1 line-clamp-2">
                      {preset.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 md:p-4 md:pt-0">
                {/* Mini preview - accurate layout representation */}
                <div className="relative h-20 md:h-24 bg-gradient-to-b from-slate-800/80 to-slate-900/80 rounded-lg border border-slate-700/50 mb-2 md:mb-3 overflow-hidden">
                  <LayoutPreview preset={preset} />
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-wrap">
                    <span className="flex items-center gap-1 text-muted-foreground whitespace-nowrap">
                      <TableProperties className="w-3 h-3 flex-shrink-0" />
                      {preset.tableCount} tables
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground whitespace-nowrap">
                      <Users className="w-3 h-3 flex-shrink-0" />
                      {preset.capacity} seats
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {preset.layout.tables.some(t => t.type === 'round') && (
                      <Circle className="w-3 h-3 text-muted-foreground" />
                    )}
                    {preset.layout.tables.some(t => t.type === 'rectangular') && (
                      <RectangleHorizontal className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex gap-1 mt-2 flex-wrap">
                  {preset.layout.tables.some(t => t.isVip) && (
                    <Badge variant="outline" className="text-[10px] h-5 bg-amber-500/10 text-amber-600 border-amber-500/30 whitespace-nowrap">
                      <Crown className="w-2 h-2 mr-1 flex-shrink-0" />
                      VIP Tables
                    </Badge>
                  )}
                  {preset.layout.markers.some(m => m.type === 'dance-floor') && (
                    <Badge variant="outline" className="text-[10px] h-5 bg-purple-500/10 text-purple-600 border-purple-500/30 whitespace-nowrap">
                      Dance Floor
                    </Badge>
                  )}
                  {preset.layout.markers.some(m => m.type === 'bar') && (
                    <Badge variant="outline" className="text-[10px] h-5 bg-orange-500/10 text-orange-600 border-orange-500/30 whitespace-nowrap">
                      Bar
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
