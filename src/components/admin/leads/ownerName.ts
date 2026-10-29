/** Resolves an owner id to the rep name shown across the leads pages. */

/** Resolve an owner id to a display name using the reps list. */
import type { SalesRep } from '@/hooks/useSalesReps';

export function ownerName(ownerId: string | null | undefined, reps: SalesRep[]): string | null {
  if (!ownerId) return null;
  const rep = reps.find((r) => r.id === ownerId);
  return rep ? rep.display_name || rep.email : null;
}

/** Small avatar-initials + name pill for the current owner. */
