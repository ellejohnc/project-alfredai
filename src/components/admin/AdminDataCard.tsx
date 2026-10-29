import { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AdminDataCardProps {
  title: string;
  subtitle?: string;
  badges?: {
    label: string;
    color?: string;
    icon?: ReactNode;
  }[];
  metadata?: {
    label: string;
    value: string | ReactNode;
    icon?: ReactNode;
  }[];
  actions?: ReactNode;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
  children?: ReactNode;
}

export function AdminDataCard({
  title,
  subtitle,
  badges = [],
  metadata = [],
  actions,
  onClick,
  isSelected,
  className,
  children,
}: AdminDataCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card border border-border rounded-lg p-3 transition-colors",
        onClick && "cursor-pointer hover:border-primary/30 hover:bg-muted/30",
        isSelected && "border-primary/60 bg-muted/40",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground truncate">{title}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>
      
      {/* Badges */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {badges.map((badge, index) => (
            <Badge
              key={index}
              variant="outline"
              className={cn("gap-1 h-5 px-1.5 text-[10px] font-normal", badge.color)}
            >
              {badge.icon}
              {badge.label}
            </Badge>
          ))}
        </div>
      )}
      
      {/* Metadata grid */}
      {metadata.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          {metadata.map((item, index) => (
            <div key={index} className="flex items-center gap-1.5 text-muted-foreground">
              {item.icon}
              <span className="truncate">
                {typeof item.value === 'string' ? (
                  <>
                    <span className="text-muted-foreground">{item.label}: </span>
                    <span className="text-foreground">{item.value}</span>
                  </>
                ) : (
                  item.value
                )}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {/* Custom content */}
      {children}
    </div>
  );
}
