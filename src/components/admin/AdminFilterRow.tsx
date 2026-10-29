import { type FilterOption } from './adminFilterOptions';

import { standardSortOptions } from './adminFilterOptions';

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

interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  width?: string;
}

interface AdminFilterRowProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  sortOptions?: FilterOption[];
  sortValue?: string;
  onSortChange?: (value: string) => void;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  actions?: ReactNode;
  className?: string;
  /** Compact mode reduces padding and uses smaller text */
  compact?: boolean;
}

export function AdminFilterRow({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  sortOptions = standardSortOptions,
  sortValue = 'date_desc',
  onSortChange,
  onClearFilters,
  hasActiveFilters,
  actions,
  className,
  compact = false,
}: AdminFilterRowProps) {
  const inputHeight = compact ? 'h-8' : 'h-9';
  const textSize = compact ? 'text-xs' : 'text-xs';
  const selectWidth = compact ? 'w-[120px]' : 'w-[140px]';

  return (
    <div className={cn("flex flex-col sm:flex-row gap-3", className)}>
      {/* Search input */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn("pl-9", inputHeight)}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => (
          <Select
            key={filter.key}
            value={filter.value}
            onValueChange={filter.onChange}
          >
            <SelectTrigger className={cn(inputHeight, filter.width || selectWidth, textSize)}>
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value} className={textSize}>
                  <span className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        
        {/* Sort */}
        {sortOptions && sortValue && onSortChange && (
          <Select value={sortValue} onValueChange={onSortChange}>
            <SelectTrigger className={cn(inputHeight, "w-[130px]", textSize)}>
              <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className={textSize}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {/* Clear filters */}
        {hasActiveFilters && onClearFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className={cn(inputHeight, textSize, "text-muted-foreground hover:text-foreground px-2")}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}
        
        {actions}
      </div>
    </div>
  );
}
