import { ReactNode } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface ToolbarOption {
  value: string;
  label: string;
}

export interface ToolbarFilter {
  key: string;
  /** Shown as the placeholder and in the active-filter chip. */
  label: string;
  options: ToolbarOption[];
  value: string;
  onChange: (value: string) => void;
  /** The value meaning "no filter applied". Defaults to 'all'. */
  allValue?: string;
  width?: string;
}

interface AdminToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ToolbarFilter[];
  onClearAll?: () => void;
  /** Page-specific controls (export, sync, date range, view toggle…). */
  actions?: ReactNode;
  /** Renders e.g. "128 leads". Omit to hide. */
  resultCount?: number;
  resultNoun?: string;
  className?: string;
}

/**
 * The ONE search + filters bar for every lead surface.
 *
 * Built once here (Stage B) so Inbox · Booked · Demo · Meta · Alpha · Investor
 * · B2B all search and filter identically — same layout, same behaviour, same
 * look. Pass filter options built from the real rows (see optionsFromData) so a
 * page can never show a dead option that matches nothing.
 *
 * Responsive by construction: the row wraps, the search box can shrink
 * (min-w-0), and nothing clips on zoom.
 */
export function AdminToolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search name, email, company, phone…',
  filters = [],
  onClearAll,
  actions,
  resultCount,
  resultNoun = 'lead',
  className,
}: AdminToolbarProps) {
  const activeFilters = filters.filter((f) => f.value !== (f.allValue ?? 'all'));
  const hasQuery = !!searchQuery.trim();
  const showChips = hasQuery || activeFilters.length > 0;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Search leads"
            className="h-8 pl-9 pr-8 text-xs"
          />
          {hasQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filters + page actions */}
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {filters.map((filter) => (
            <Select key={filter.key} value={filter.value} onValueChange={filter.onChange}>
              <SelectTrigger
                aria-label={filter.label}
                className={cn("h-8 text-xs", filter.width ?? 'w-[150px]')}
              >
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
          {actions}
        </div>

        {typeof resultCount === 'number' && (
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground sm:ml-auto">
            {resultCount} {resultCount === 1 ? resultNoun : `${resultNoun}s`}
          </span>
        )}
      </div>

      {/* Active filters — always show WHAT is narrowing the list, each removable */}
      {showChips && (
        <div className="flex flex-wrap items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {hasQuery && (
            <ToolbarChip
              label={`"${searchQuery.trim()}"`}
              onClear={() => onSearchChange('')}
            />
          )}
          {activeFilters.map((filter) => (
            <ToolbarChip
              key={filter.key}
              label={`${filter.label}: ${
                filter.options.find((o) => o.value === filter.value)?.label ?? filter.value
              }`}
              onClear={() => filter.onChange(filter.allValue ?? 'all')}
            />
          ))}
          {onClearAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function ToolbarChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <Badge variant="secondary" className="h-6 gap-1 pl-2 pr-1 text-[11px] font-normal">
      <span className="max-w-[180px] truncate">{label}</span>
      <button
        type="button"
        onClick={onClear}
        aria-label={`Remove filter ${label}`}
        className="rounded-sm p-0.5 opacity-60 transition-opacity hover:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}
