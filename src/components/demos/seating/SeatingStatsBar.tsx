import { motion } from "framer-motion";
import { 
  TableProperties, 
  Users, 
  Crown, 
  Building2, 
  Waypoints,
  Circle,
  RectangleHorizontal,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SeatingStats } from "./types";

interface SeatingStatsBarProps {
  stats: SeatingStats;
  className?: string;
}

export function SeatingStatsBar({ stats, className }: SeatingStatsBarProps) {
  const seatingProgress = stats.totalSeats > 0 
    ? (stats.seatedGuests / stats.totalSeats) * 100 
    : 0;

  const statItems = [
    {
      label: 'Tables',
      value: stats.totalTables,
      subtext: `${stats.roundTables} round, ${stats.rectangularTables} rect`,
      icon: TableProperties,
      color: 'text-blue-500',
    },
    {
      label: 'Seats',
      value: stats.totalSeats,
      subtext: `${stats.seatedGuests} assigned`,
      icon: Users,
      color: 'text-green-500',
    },
    {
      label: 'VIP Tables',
      value: stats.vipTables,
      icon: Crown,
      color: 'text-amber-500',
    },
    {
      label: 'Sponsor Tables',
      value: stats.sponsorTables,
      icon: Building2,
      color: 'text-purple-500',
    },
    {
      label: 'Floor Markers',
      value: stats.floorMarkers,
      icon: Waypoints,
      color: 'text-cyan-500',
    },
  ];

  return (
    <div className={cn("bg-card rounded-xl border border-border p-4", className)}>
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-muted-foreground">Seating Progress</span>
          <span className="font-medium">
            {stats.seatedGuests}/{stats.totalSeats} seats filled
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${seatingProgress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        {seatingProgress === 100 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1 text-xs text-green-500 mt-1"
          >
            <CheckCircle2 className="w-3 h-3" />
            All seats assigned!
          </motion.div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
          >
            <div className={cn("p-1.5 rounded-md bg-background", item.color)}>
              <item.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-lg font-bold leading-none">{item.value}</p>
              <p className="text-[10px] text-muted-foreground">{item.label}</p>
              {item.subtext && (
                <p className="text-[9px] text-muted-foreground/70">{item.subtext}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
