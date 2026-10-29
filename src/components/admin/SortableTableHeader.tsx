import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortDirection = 'asc' | 'desc' | null;

export interface ColumnSortState {
  column: string;
  direction: SortDirection;
}

interface SortableTableHeaderProps {
  label: string;
  column: string;
  currentSort: ColumnSortState;
  onSort: (column: string, direction: SortDirection) => void;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

export function SortableTableHeader({
  label,
  column,
  currentSort,
  onSort,
  className,
  align = 'left',
}: SortableTableHeaderProps) {
  const isActive = currentSort.column === column;
  const direction = isActive ? currentSort.direction : null;

  const handleClick = () => {
    if (!isActive) {
      // First click: sort descending (most common default)
      onSort(column, 'desc');
    } else if (direction === 'desc') {
      // Second click: sort ascending
      onSort(column, 'asc');
    } else {
      // Third click: clear sort (reset to default)
      onSort(column, null);
    }
  };

  const Icon = direction === 'asc' ? ArrowUp : direction === 'desc' ? ArrowDown : ArrowUpDown;

  return (
    <th
      className={cn(
        "px-3 py-2 font-medium text-xs cursor-pointer select-none hover:bg-muted/70 transition-colors group",
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className
      )}
      onClick={handleClick}
    >
      <div className={cn(
        "flex items-center gap-1.5",
        align === 'right' && 'justify-end',
        align === 'center' && 'justify-center'
      )}>
        <span>{label}</span>
        <Icon 
          className={cn(
            "w-3.5 h-3.5 transition-colors",
            isActive ? "text-primary" : "text-muted-foreground/50 group-hover:text-muted-foreground"
          )} 
        />
      </div>
    </th>
  );
}
