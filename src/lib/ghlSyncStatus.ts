/**
 * Shared GHL sync-status classification.
 *
 * Single source of truth so LeadsAdmin and GHLSubmissionsAdmin can't drift.
 *
 * IMPORTANT: the booking-modal flow intentionally DEFERS GHL contact creation
 * to the calendar widget and stores
 *   ghl_response.ghl_sync_error = "Skipped for booking_shown — calendar widget handles contact creation"
 * while in status 'booking_shown'. That is a benign, in-progress state — NOT a
 * failure — so it must read as "Awaiting Booking" (amber), never red "Sync Failed".
 */

export const BOOKING_SKIP_MARKER = 'Skipped for booking_shown';

export type GHLSyncIcon = 'synced' | 'pending' | 'awaiting' | 'error';

export interface GHLSyncStatus {
  label: string;
  color: string;
  icon: GHLSyncIcon;
  synced: boolean;
}

interface SyncStatusInput {
  ghl_status?: string | null;
  ghl_response?: Record<string, unknown> | null;
  /** Some GHL-backed sources (e.g. Meta leads from GHL) store the id top-level. */
  ghl_contact_id?: string | null;
}

const COLORS = {
  green: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30',
  amber: 'bg-amber-500/20 text-amber-700 border-amber-500/30',
  red: 'bg-red-500/20 text-red-700 border-red-500/30',
  slate: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
} as const;

/** True when the contact is confirmed/verified in GHL. */
export function isGHLSynced(input: SyncStatusInput | null | undefined): boolean {
  if (!input) return false;
  // A top-level contact id (Meta leads imported from GHL) means the record
  // already lives in GoHighLevel — treat it as synced.
  if (input.ghl_contact_id) return true;
  const response = input.ghl_response as Record<string, unknown> | null;
  if (response?.ghl_synced === true && response?.ghl_verified === true) {
    return true;
  }
  if (input.ghl_status === 'synced' && response?.ghl_contact_id) {
    return true;
  }
  if (['confirmed', 'cancelled', 'rescheduled', 'synced'].includes(input.ghl_status || '')) {
    return true;
  }
  return false;
}

/** Is this the benign "deferred to calendar widget" state, not a real failure? */
export function isBenignBookingSkip(input: SyncStatusInput | null | undefined): boolean {
  if (!input) return false;
  const response = input.ghl_response as Record<string, unknown> | null;
  const syncError = response?.ghl_sync_error as string | undefined;
  if (input.ghl_status === 'booking_shown') return true;
  if (syncError && syncError.includes(BOOKING_SKIP_MARKER)) return true;
  return false;
}

/** True when there is a GENUINE sync error (excludes the benign booking skip). */
export function hasGenuineSyncError(input: SyncStatusInput | null | undefined): boolean {
  if (!input) return false;
  if (isBenignBookingSkip(input)) return false;
  const response = input.ghl_response as Record<string, unknown> | null;
  const syncError = response?.ghl_sync_error as string | undefined;
  if (syncError && !syncError.includes(BOOKING_SKIP_MARKER)) return true;
  if (response?.ghl_synced === true && response?.ghl_verified === false) return true;
  return false;
}

/**
 * Ordered classification used for badges in the admin lead views.
 * Order matters: Synced → Awaiting Booking → genuine failure → Pending.
 */
export function getGHLSyncStatus(input: SyncStatusInput | null | undefined): GHLSyncStatus {
  if (!input) {
    return { label: 'Not synced', color: COLORS.slate, icon: 'pending', synced: false };
  }

  // 1. Verified / synced in GHL
  if (isGHLSynced(input)) {
    return { label: 'Synced', color: COLORS.green, icon: 'synced', synced: true };
  }

  // 2. Benign deferral — calendar widget handles contact creation
  if (isBenignBookingSkip(input)) {
    return { label: 'Awaiting Booking', color: COLORS.amber, icon: 'awaiting', synced: false };
  }

  // 3. Genuine error
  if (hasGenuineSyncError(input)) {
    return { label: 'Sync Failed', color: COLORS.red, icon: 'error', synced: false };
  }

  // 4. Otherwise amber, but state WHY — never a bare "Pending".
  const response = input.ghl_response as Record<string, unknown> | null;
  // Contact created but not yet verified in GHL.
  if (response?.ghl_synced === true && response?.ghl_verified !== true) {
    return { label: 'Verifying in GHL', color: COLORS.amber, icon: 'pending', synced: false };
  }
  // No contact id yet and no error — queued, not yet pushed to GHL.
  if (!response?.ghl_contact_id) {
    return { label: 'Queued for sync', color: COLORS.amber, icon: 'pending', synced: false };
  }
  // Clear generic fallback.
  return { label: 'Sync in progress', color: COLORS.amber, icon: 'pending', synced: false };
}
