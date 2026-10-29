import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { AdminToolbar, type ToolbarFilter } from './AdminToolbar';
import {
  getDefaultFilters,
  type AdminFilters,
  type ContentStatus,
  type DatePreset,
  type SortOrder,
} from './adminFilters';

/**
 * The content pages' filters, rendered by the SHARED toolbar.
 *
 * This replaces AdminFilterBar, which was the second of the two kits. It was
 * not a worse component — it was a NARROWER one: hardcoded to AdminFilters, so
 * it could only ever offer status, date and search. The Standard's toolbar
 * names Owner and Outcome, and AdminFilterBar had no way to express either.
 * That is why the panel converges on AdminToolbar rather than on it.
 *
 * WHAT THIS IS, precisely: an adapter, not a third toolbar. The content pages
 * hold one typed AdminFilters object; AdminToolbar takes an arbitrary filter
 * array. Mapping between them here means the six content pages change one line
 * each and the panel ends up with ONE toolbar implementation rendering every
 * list page. The alternative — teaching each page to build its own filter array
 * — is six copies of the same mapping, which is the duplication that produced
 * two kits in the first place.
 *
 * THE ORDER IS FIXED AND IT CHANGED HERE. The Standard says Search · Sort ·
 * Status · Owner · Outcome · ⋯, and AdminFilterBar rendered Search · Status ·
 * Date · Sort — with sort last. Moving to the shared toolbar puts it back in
 * the Standard's order, so the first controls no longer shift position when you
 * move between a lead page and a content page.
 *
 * The custom date range keeps its calendar popover, passed through the
 * toolbar's `actions` slot, because a date RANGE is not something a select can
 * express and dropping it would silently remove a working filter.
 */

interface AdminContentFiltersProps {
  filters: AdminFilters;
  onFiltersChange: (filters: AdminFilters) => void;
  showStatusFilter?: boolean;
  showSearch?: boolean;
  searchPlaceholder?: string;
  /** Renders e.g. "84 posts" on the right of the bar. Omit to hide. */
  resultCount?: number;
  resultNoun?: string;
}

export function AdminContentFilters({
  filters,
  onFiltersChange,
  showStatusFilter = true,
  showSearch = true,
  searchPlaceholder = 'Search by title…',
  resultCount,
  resultNoun = 'item',
}: AdminContentFiltersProps) {
  const [customDateOpen, setCustomDateOpen] = useState(false);

  const update = <K extends keyof AdminFilters>(key: K, value: AdminFilters[K]) =>
    onFiltersChange({ ...filters, [key]: value });

  const toolbarFilters: ToolbarFilter[] = [
    {
      key: 'sort',
      label: 'Sort',
      // 'desc' is the default rather than an "all" value, so it is passed as
      // allValue — otherwise the bar would show a permanent "Sort: Newest"
      // chip on every page and the chips would stop meaning "you narrowed this".
      allValue: 'desc',
      value: filters.sortOrder,
      onChange: (v) => update('sortOrder', v as SortOrder),
      options: [
        { value: 'desc', label: 'Newest first' },
        { value: 'asc', label: 'Oldest first' },
      ],
    },
  ];

  if (showStatusFilter) {
    toolbarFilters.push({
      key: 'status',
      label: 'Status',
      allValue: 'all',
      value: filters.status,
      onChange: (v) => update('status', v as ContentStatus),
      options: [
        { value: 'all', label: 'All statuses' },
        { value: 'published', label: 'Published' },
        { value: 'draft', label: 'Draft' },
        { value: 'archived', label: 'Archived' },
      ],
    });
  }

  toolbarFilters.push({
    key: 'date',
    label: 'Date',
    allValue: 'all',
    value: filters.datePreset,
    onChange: (v) => {
      if (v === 'custom') setCustomDateOpen(true);
      update('datePreset', v as DatePreset);
    },
    options: [
      { value: 'all', label: 'All time' },
      { value: 'today', label: 'Today' },
      { value: 'week', label: 'Last 7 days' },
      { value: 'month', label: 'Last 30 days' },
      { value: 'custom', label: 'Custom range' },
    ],
  });

  const customRange =
    filters.datePreset === 'custom' ? (
      <Popover open={customDateOpen} onOpenChange={setCustomDateOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Calendar className="h-3.5 w-3.5" />
            {filters.customDateStart && filters.customDateEnd ? (
              <span className="text-xs">
                {format(filters.customDateStart, 'MMM d')} – {format(filters.customDateEnd, 'MMM d')}
              </span>
            ) : (
              <span className="text-xs">Select dates</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="range"
            selected={{ from: filters.customDateStart, to: filters.customDateEnd }}
            onSelect={(range) =>
              onFiltersChange({
                ...filters,
                customDateStart: range?.from,
                customDateEnd: range?.to,
              })
            }
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    ) : null;

  return (
    <AdminToolbar
      searchQuery={showSearch ? filters.searchQuery || '' : ''}
      onSearchChange={(v) => update('searchQuery', v)}
      searchPlaceholder={searchPlaceholder}
      filters={toolbarFilters}
      onClearAll={() => onFiltersChange(getDefaultFilters())}
      actions={customRange}
      resultCount={resultCount}
      resultNoun={resultNoun}
    />
  );
}
