/** Turns a date-range selection into concrete query bounds. */

import { format, subDays, startOfMonth, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";

// Helper to get filtered date bounds
export function getDateFilterBounds(startDate: Date | undefined, endDate: Date | undefined) {
  return {
    start: startDate ? startOfDay(startDate) : undefined,
    end: endDate ? endOfDay(endDate) : undefined,
    isValid: !startDate || !endDate || !isAfter(startOfDay(startDate), endOfDay(endDate)),
  };
}
