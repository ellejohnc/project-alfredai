/**
 * Who may see COMPANY-WIDE sales figures.
 *
 * EITHER condition grants access: the super-admin role, or the owner's address.
 * The role is the normal path, so adding a super admin is a deliberate act of
 * granting it. The email is a safety net — the owner keeps access to his own
 * revenue figures even if his role is ever changed or mis-provisioned.
 *
 * Distributors are handled separately and are NOT covered by this — their view
 * only ever shows their own scoped data, never the company totals.
 */
export const SALES_FIGURES_OWNER_EMAIL = 'william@alfredai.bot';

export function canViewCompanySalesFigures(
  email: string | null | undefined,
  isSuperAdmin: boolean,
): boolean {
  if (isSuperAdmin) return true;
  return (email ?? '').trim().toLowerCase() === SALES_FIGURES_OWNER_EMAIL;
}
