/**
 * The filter defaults and the predicate every admin list applies. Shared
 * logic, so it lives apart from the bar that sets it.
 */

import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export type ContentStatus = 'all' | 'draft' | 'published' | 'archived';

export type DatePreset = 'all' | 'today' | 'week' | 'month' | 'custom';

export type SortOrder = 'asc' | 'desc';

export interface AdminFilters {
  status: ContentStatus;
  datePreset: DatePreset;
  customDateStart?: Date;
  customDateEnd?: Date;
  sortOrder: SortOrder;
  searchQuery?: string;
}

export const defaultFilters: AdminFilters = {
  status: 'all',
  datePreset: 'all',
  sortOrder: 'desc',
  searchQuery: '',
};

export function getDefaultFilters(): AdminFilters {
  return { ...defaultFilters };
}

// Utility function to filter items based on filters
// searchKeys names the text fields the search box looks in. It defaults to
// title, which FAQs and Testimonials do not have: until 25 Oct their search
// boxes matched nothing at all, whatever was typed.
export function filterItems<T extends { status?: string; created_at: string; updated_at: string }>(
  items: T[],
  filters: AdminFilters,
  searchKeys: string[] = ['title'],
): T[] {
  let filtered = [...items];

  // Filter by search query
  if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(item =>
      searchKeys.some(k => {
        const v = (item as Record<string, unknown>)[k];
        return typeof v === 'string' && v.toLowerCase().includes(query);
      })
    );
  }

  // Filter by status
  if (filters.status !== 'all') {
    filtered = filtered.filter(item => item.status === filters.status);
  }

  // Filter by date (always use created_at)
  if (filters.datePreset !== 'all') {
    const now = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    switch (filters.datePreset) {
      case 'today':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'week':
        startDate = startOfDay(subDays(now, 7));
        endDate = endOfDay(now);
        break;
      case 'month':
        startDate = startOfDay(subDays(now, 30));
        endDate = endOfDay(now);
        break;
      case 'custom':
        startDate = filters.customDateStart ? startOfDay(filters.customDateStart) : undefined;
        endDate = filters.customDateEnd ? endOfDay(filters.customDateEnd) : undefined;
        break;
    }

    if (startDate || endDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.created_at);
        if (startDate && itemDate < startDate) return false;
        if (endDate && itemDate > endDate) return false;
        return true;
      });
    }
  }

  // Sort by created_at
  filtered.sort((a, b) => {
    const aDate = new Date(a.created_at).getTime();
    const bDate = new Date(b.created_at).getTime();
    return filters.sortOrder === 'desc' ? bDate - aDate : aDate - bDate;
  });

  return filtered;
}
