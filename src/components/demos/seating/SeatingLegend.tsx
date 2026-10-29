import { cn } from "@/lib/utils";

interface SeatingLegendProps {
  className?: string;
}

export function SeatingLegend({ className }: SeatingLegendProps) {
  const items = [
    { label: 'Empty Seat', color: 'bg-muted/50 border-dashed border-muted-foreground/30', border: true },
    { label: 'Assigned', color: 'bg-primary/20 border-primary/40', border: true },
    { label: 'VIP', color: 'bg-amber-400', border: false },
    { label: 'Sponsor', color: 'bg-purple-500', border: false },
    { label: 'VIP Table', color: 'border-2 border-amber-500 bg-amber-500/20', border: false },
    { label: 'Sponsor Table', color: 'border-2 border-purple-500 bg-purple-500/20', border: false },
  ];

  return (
    <div className={cn("flex flex-wrap gap-x-4 gap-y-1 text-xs", className)}>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div 
            className={cn(
              "w-3 h-3 rounded-full",
              item.color,
              item.border && "border"
            )}
          />
          <span className="text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
