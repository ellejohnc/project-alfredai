/** The comparison every sortable admin table sorts by. */

import { type SortDirection } from './SortableTableHeader';

// Helper to compare values for sorting
export function compareValues<T>(
  a: T,
  b: T,
  direction: SortDirection,
  getValue: (item: T) => string | number | Date | null | undefined
): number {
  if (direction === null) return 0;
  
  const aVal = getValue(a);
  const bVal = getValue(b);
  
  // Handle nulls - push them to the end
  if (aVal == null && bVal == null) return 0;
  if (aVal == null) return 1;
  if (bVal == null) return -1;
  
  let comparison = 0;
  
  if (typeof aVal === 'string' && typeof bVal === 'string') {
    comparison = aVal.localeCompare(bVal);
  } else if (aVal instanceof Date && bVal instanceof Date) {
    comparison = aVal.getTime() - bVal.getTime();
  } else if (typeof aVal === 'number' && typeof bVal === 'number') {
    comparison = aVal - bVal;
  } else {
    // Fallback to string comparison
    comparison = String(aVal).localeCompare(String(bVal));
  }
  
  return direction === 'asc' ? comparison : -comparison;
}
