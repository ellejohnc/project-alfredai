import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface ColumnDef {
  key: string;
  label: string;
  defaultVisible?: boolean;
}

interface ColumnVisibilityToggleProps {
  columns: ColumnDef[];
  storageKey: string;
  onVisibilityChange: (visibleKeys: string[]) => void;
}

function getStoredVisibility(storageKey: string, columns: ColumnDef[]): string[] {
  try {
    const stored = localStorage.getItem(`col-vis-${storageKey}`);
    if (stored) return JSON.parse(stored);
  } catch {
    // Storage unreadable (private mode, quota, corrupt JSON) — fall back to defaults.
  }
  return columns.filter(c => c.defaultVisible !== false).map(c => c.key);
}

export function ColumnVisibilityToggle({
  columns,
  storageKey,
  onVisibilityChange,
}: ColumnVisibilityToggleProps) {
  const [visible, setVisible] = useState<string[]>(() =>
    getStoredVisibility(storageKey, columns)
  );

  useEffect(() => {
    onVisibilityChange(visible);
  }, [visible, onVisibilityChange]);

  const toggle = (key: string) => {
    setVisible(prev => {
      const next = prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key];
      localStorage.setItem(`col-vis-${storageKey}`, JSON.stringify(next));
      return next;
    });
  };

  const hiddenCount = columns.length - visible.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs min-h-[44px]">
          {hiddenCount > 0 ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          Hide{hiddenCount > 0 ? ` / ${hiddenCount}` : ''}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-2">
        <div className="space-y-0.5">
          {columns.map(col => {
            const isVisible = visible.includes(col.key);
            return (
              <button
                key={col.key}
                onClick={() => toggle(col.key)}
                className={cn(
                  "flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs transition-colors min-h-[36px]",
                  isVisible
                    ? "text-foreground hover:bg-muted"
                    : "text-muted-foreground hover:bg-muted/50"
                )}
              >
                {isVisible ? (
                  <Eye className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}
                <span className="truncate">{col.label}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
