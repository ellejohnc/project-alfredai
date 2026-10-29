import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Sparkline } from './Sparkline';

interface StatItem {
  label: string;
  value: number | string;
  icon?: ReactNode;
  color?: string;
  bgColor?: string;
  onClick?: () => void;
  isActive?: boolean;
  /** Optional 7-day trend data for sparkline */
  trend?: number[];
}

interface AdminStatsGridProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export function AdminStatsGrid({ stats, columns = 4, className }: AdminStatsGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  };

  return (
    <div className={cn("grid gap-2", gridCols[columns], className)}>
      {stats.map((stat, index) => (
        <button
          key={index}
          onClick={stat.onClick}
          disabled={!stat.onClick}
          className={cn(
            "flex items-center gap-2.5 p-2.5 rounded-lg border transition-colors text-left",
            "bg-card hover:bg-muted/40",
            stat.onClick && "cursor-pointer hover:border-primary/30",
            !stat.onClick && "cursor-default",
            stat.isActive && "border-primary/60 bg-muted/50"
          )}
        >
          {stat.icon && (
            <div className={cn("p-1.5 rounded-md text-muted-foreground", stat.bgColor || "bg-muted")}>
              {stat.icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className={cn("text-lg font-semibold tabular-nums leading-tight min-w-0", stat.color || "text-foreground")}>
                {stat.value}
              </div>
              {stat.trend && <Sparkline data={stat.trend} />}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">{stat.label}</div>

          </div>
        </button>
      ))}
    </div>
  );
}
