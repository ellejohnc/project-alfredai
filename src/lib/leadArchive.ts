// Per-source Archive / Delete config for the shared row "…" menu.
// Mirrors the exact table + column each legacy admin page already writes to,
// so behaviour is identical whether the user acts from the legacy page's
// dialog or the shared LeadRowActions menu.
import { supabase } from '@/integrations/supabase/client';
import type { LeadSource, UnifiedLead } from '@/lib/unifiedLead';

type ArchiveConfig = {
  /** Table to update. */
  table:
    | 'ghl_submissions'
    | 'leads'
    | 'alpha_digital_leads';
  /** Column that stores the archived timestamp. Always `archived_at` today. */
  column: 'archived_at';
};

const ARCHIVE_BY_SOURCE: Partial<Record<LeadSource, ArchiveConfig>> = {
  ghl_submissions: { table: 'ghl_submissions', column: 'archived_at' },
  leads: { table: 'leads', column: 'archived_at' },
  alpha_digital_leads: { table: 'alpha_digital_leads', column: 'archived_at' },
};

/** Deletable source → its own table (raw row is removed). */
const DELETE_BY_SOURCE: Record<LeadSource, string> = {
  ghl_submissions: 'ghl_submissions',
  leads: 'leads',
  alpha_digital_leads: 'alpha_digital_leads',
  investor_leads: 'investor_leads',
  meta_leads: 'meta_leads',
  webinar_registrations: 'webinar_registrations',
};

export function canArchive(lead: UnifiedLead): boolean {
  return !!ARCHIVE_BY_SOURCE[lead.source];
}

export function isArchived(lead: UnifiedLead): boolean {
  const raw = (lead.raw ?? {}) as Record<string, unknown>;
  return !!raw.archived_at;
}

export function canDelete(lead: UnifiedLead): boolean {
  return !!DELETE_BY_SOURCE[lead.source];
}

export async function archiveLead(lead: UnifiedLead): Promise<void> {
  const cfg = ARCHIVE_BY_SOURCE[lead.source];
  if (!cfg) throw new Error('This lead source does not support archiving');
  const { error } = await supabase
    .from(cfg.table)
    .update({ [cfg.column]: new Date().toISOString() })
    .eq('id', lead.id);
  if (error) throw error;
}

export async function restoreLead(lead: UnifiedLead): Promise<void> {
  const cfg = ARCHIVE_BY_SOURCE[lead.source];
  if (!cfg) throw new Error('This lead source does not support restore');
  const { error } = await supabase
    .from(cfg.table)
    .update({ [cfg.column]: null })
    .eq('id', lead.id);
  if (error) throw error;
}

export async function deleteLead(lead: UnifiedLead): Promise<void> {
  const table = DELETE_BY_SOURCE[lead.source];
  if (!table) throw new Error('This lead source does not support delete');
  const { error } = await supabase
    .from(table as 'leads')
    .delete()
    .eq('id', lead.id);
  if (error) throw error;
}

/** Query keys legacy admin pages use — invalidated after archive/restore/delete. */
export const LEGACY_LIST_KEYS: string[] = [
  'ghl-submissions',
  'demo-leads',
  'webinar-leads',
  'investor-leads',
  'meta-leads',
  'alpha-digital-leads',
  'b2b-matchmaking-leads',
  'leads-booked',
  'leads-admin',
];
