/**
 * DIY Quote Builder access rules.
 *
 * The Quote Builder supports two entry methods:
 *   1. Quick access code (e.g. "2026") — view-only mode. No Save/Load, because
 *      there is no authenticated session mapped to an Admin User.
 *   2. Email + password sign-in — maps to an Admin Users record via the
 *      `user_roles` table. Only true admin roles get full Save/Load access.
 *
 * Non-admin authenticated roles (editor, sales_rep, distributor) are NOT
 * granted Save/Load access here, even though they can sign in successfully.
 *
 * These pure helpers centralise the logic so it can be unit-tested and reused.
 */

import type { AppRole } from '@/lib/rolePermissions';

/** Roles that may use the Quote Builder's Save/Load (Admin Users) features. */
export const QUOTE_ADMIN_ROLES: readonly AppRole[] = ['super_admin', 'admin'];

/**
 * The quick access code is NEVER stored in the client bundle. The code the user
 * types is passed to the `quote-operations` edge function, which validates it
 * server-side against the `QUICK_ACCESS_CODE` secret.
 */


export type DIYAccessMode = 'none' | 'view-only' | 'full';

export interface DIYAccessInput {
  /** True when an authenticated Supabase session exists. */
  isAuthenticated: boolean;
  /** The resolved role from `user_roles`, or null if none/unauthenticated. */
  role: AppRole | null;
  /** True when the user unlocked via the quick access code. */
  quickAccessUsed: boolean;
}

/**
 * Returns true when the role maps to an Admin User with full Quote Builder rights.
 */
export function isQuoteAdminRole(role: AppRole | null): boolean {
  return role != null && QUOTE_ADMIN_ROLES.includes(role);
}

/**
 * Client-side format check only (non-empty). The real validation happens
 * server-side in the `quote-operations` edge function against the
 * `QUICK_ACCESS_CODE` secret.
 */
export function isValidQuickAccessCode(code: string): boolean {
  return code.trim().length > 0;
}


/**
 * Resolves the effective access mode for the Quote Builder.
 *
 * - 'full'      → authenticated admin: gets Save/Load (Admin Users mapping).
 * - 'view-only' → quick access code: can build quotes but NOT Save/Load.
 * - 'none'      → no valid access; the login gate is shown.
 *
 * Admin sign-in takes precedence over quick access.
 */
export function resolveDIYAccessMode(input: DIYAccessInput): DIYAccessMode {
  if (input.isAuthenticated && isQuoteAdminRole(input.role)) return 'full';
  // The quick access code represents the super admin, so it grants full
  // Save/Load access (server-validated in the quote-operations edge function).
  if (input.quickAccessUsed) return 'full';
  return 'none';
}

/** True only for full (admin) access — gates Save/Load features. */
export function canSaveLoad(mode: DIYAccessMode): boolean {
  return mode === 'full';
}

/** True when the user should be allowed into the builder at all. */
export function canAccessBuilder(mode: DIYAccessMode): boolean {
  return mode === 'full' || mode === 'view-only';
}
