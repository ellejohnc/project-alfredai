// Shared pipeline vocabulary for the unified Leads Inbox CRM overlay.
// Kept in one place so the inbox row, the record page and any filters use the
// same stage list and presentation.

export const LEAD_STAGES = [
  'New',
  'Contacted',
  'Qualified',
  'Proposal',
  'Negotiation',
] as const;

export type LeadStage = (typeof LEAD_STAGES)[number];

export type LeadOutcome = 'won' | 'lost';

export const OUTCOME_LABEL: Record<LeadOutcome, string> = {
  won: 'Won',
  lost: 'Lost',
};

/** Initials for an owner name/email, e.g. "William Zhang" -> "WZ". */
export function ownerInitials(nameOrEmail?: string | null): string {
  if (!nameOrEmail) return '?';
  const base = nameOrEmail.includes('@') ? nameOrEmail.split('@')[0] : nameOrEmail;
  const parts = base.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
