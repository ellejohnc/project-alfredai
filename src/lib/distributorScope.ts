/**
 * Distributor "View As" scoping helpers.
 *
 * These pure functions centralise the ownership rules used by the Leads,
 * Meetings and Quotes admin pages so that a distributor (or an admin
 * previewing a distributor via "View As") only ever sees records that
 * belong to them: records they are assigned to, created, or collaborate on.
 *
 * Keeping the logic here (instead of inline in each page) means the rules
 * are consistent across pages and can be unit-tested in isolation.
 */

export interface ScopeContext {
  /** True when the effective viewer is a distributor (real login or View As preview). */
  isDistributor: boolean;
  /** The user id whose records should be visible (the previewed distributor's id, or current user). */
  scopedUserId: string | null;
  /** Optional lowercased email used as a fallback ownership match (quotes only). */
  scopedUserEmail?: string | null;
  /** Set of record ids the scoped user collaborates on (from record_collaborators). */
  collaboratorIds?: Set<string>;
}

export interface OwnableRecord {
  id: string;
  assigned_distributor_id?: string | null;
  created_by_user_id?: string | null;
  /** Email of the creator (quotes use `created_by`). */
  created_by?: string | null;
}

/**
 * Returns true when the given record should be visible to the scoped viewer.
 *
 * When the viewer is NOT a distributor (e.g. an admin viewing normally) or
 * there is no scoped user id, everything is visible (returns true).
 */
export function recordOwnedByDistributor(
  record: OwnableRecord,
  ctx: ScopeContext,
): boolean {
  // Non-distributor viewers (admins) see all records.
  if (!ctx.isDistributor || !ctx.scopedUserId) return true;

  if (record.assigned_distributor_id === ctx.scopedUserId) return true;
  if (record.created_by_user_id === ctx.scopedUserId) return true;
  if (ctx.collaboratorIds?.has(record.id)) return true;

  // Fallback: match on creator email when available (used by quotes).
  if (ctx.scopedUserEmail) {
    const createdByEmail = (record.created_by || '').trim().toLowerCase();
    if (createdByEmail && createdByEmail === ctx.scopedUserEmail) return true;
  }

  return false;
}

/**
 * Filters a list of records down to those visible to the scoped viewer.
 */
export function scopeRecordsToDistributor<T extends OwnableRecord>(
  records: T[],
  ctx: ScopeContext,
): T[] {
  if (!ctx.isDistributor || !ctx.scopedUserId) return records;
  return records.filter((r) => recordOwnedByDistributor(r, ctx));
}

/**
 * Company-wide records (e.g. investor bookings) must be hidden entirely from
 * distributors, since they represent data not tied to a single distributor.
 */
export function shouldHideCompanyWideRecords(ctx: ScopeContext): boolean {
  return ctx.isDistributor && !!ctx.scopedUserId;
}
