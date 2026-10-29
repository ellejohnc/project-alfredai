/** The option lists every admin filter row offers. */


import { ReactNode } from 'react';

// Standard sort options used across all admin panels
export const standardSortOptions: FilterOption[] = [
  { value: 'date_desc', label: 'Newest First' },
  { value: 'date_asc', label: 'Oldest First' },
  { value: 'name_asc', label: 'Name A-Z' },
  { value: 'name_desc', label: 'Name Z-A' },
];

// Common filter presets for reuse

// Common filter presets for reuse
export const viewModeOptions: FilterOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
];

export interface FilterOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

export const dateRangePresets: FilterOption[] = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
];
