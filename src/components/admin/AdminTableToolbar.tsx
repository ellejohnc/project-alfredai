import { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  width?: string;
}

interface AdminTableToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  sortOptions?: FilterOption[];
  sortValue?: string;
  onSortChange?: (value: string) => void;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  /** Slot for column visibility toggle or other trailing actions */
  trailing?: ReactNode;
  /** Slot for bulk actions that appear when rows are selected */
  bulkActions?: ReactNode;
  selectedCount?: number;
  className?: string;
}

export function AdminTableToolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  sortOptions,
  sortValue,
  onSortChange,
  onClearFilters,
  hasActiveFilters,
  trailing,
  bulkActions,
  selectedCount = 0,
  className,
}: AdminTableToolbarProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-10 flex flex-col gap-2 bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2",
        className
      )}
    >
      {/* Bulk actions bar */}
      {selectedCount > 0 && bulkActions ? (
        <div className="flex items-center gap-3 py-1">
          <span className="text-xs font-medium text-primary">
            {selectedCount} selected
          </span>
          <div className="flex items-center gap-1.5">{bulkActions}</div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-0 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            {filters.map((filter) => (
              <Select key={filter.key} value={filter.value} onValueChange={filter.onChange}>
                <SelectTrigger className={cn("h-8 text-xs", filter.width || "w-[120px]")}>
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-xs">
                      <span className="flex items-center gap-1.5">
                        {option.icon}
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}

            {sortOptions && sortValue && onSortChange && (
              <Select value={sortValue} onValueChange={onSortChange}>
                <SelectTrigger className="h-8 w-[120px] text-xs">
                  <SlidersHorizontal className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-xs">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {hasActiveFilters && onClearFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-8 text-xs text-muted-foreground hover:text-foreground px-2"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}

            {trailing}
          </div>
        </div>
      )}
    </div>
  );
}
