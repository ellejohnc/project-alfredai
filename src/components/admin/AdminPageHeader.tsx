import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Radio, RefreshCw, Download, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminPageHeaderProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actions?: ReactNode;
  isRealtimeConnected?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
  onAdd?: () => void;
  addLabel?: string;
  isLoading?: boolean;
  stats?: {
    label: string;
    value: number | string;
    color?: string;
  }[];
}

export function AdminPageHeader({
  title,
  description,
  icon,
  actions,
  isRealtimeConnected,
  onRefresh,
  onExport,
  onAdd,
  addLabel = 'Add New',
  isLoading,
  stats,
}: AdminPageHeaderProps) {
  return (
    <div className="space-y-2.5">
      {/* Main header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className="p-1.5 rounded-md bg-muted text-muted-foreground">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
              {isRealtimeConnected !== undefined && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "gap-1 h-5 px-1.5 text-[10px] font-normal",
                    isRealtimeConnected
                      ? "text-emerald-600 border-emerald-500/30"
                      : "text-muted-foreground"
                  )}
                >
                  <Radio className={cn("w-3 h-3", isRealtimeConnected && "animate-pulse")} />
                  {isRealtimeConnected ? "Live" : "Offline"}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="gap-1.5"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          )}
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          )}
          {onAdd && (
            <Button size="sm" onClick={onAdd} className="gap-1.5">
              <Plus className="h-4 w-4" />
              {addLabel}
            </Button>
          )}
          {actions}
        </div>
      </div>
      
      {/* Stats row */}
      {stats && stats.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/40 border border-border"
            >
              <span className="text-[11px] text-muted-foreground">{stat.label}:</span>
              <span className={cn("text-xs font-medium tabular-nums", stat.color || "text-foreground")}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
