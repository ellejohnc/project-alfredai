// Re-sync helper for ghl_submissions rows — extracted from LeadsBookedAdmin /
// GHLSubmissionsAdmin so the shared row "…" menu can trigger the same retry
// path (invoke log-ghl-submission with sync_type: 'retry').
import { supabase } from '@/integrations/supabase/client';
import type { UnifiedLead } from '@/lib/unifiedLead';

/** Only ghl_submissions rows support "Re-sync GHL". */
export function canResyncGhl(lead: UnifiedLead): boolean {
  if (lead.source !== 'ghl_submissions') return false;
  const raw = (lead.raw ?? {}) as Record<string, unknown>;
  // Deleted-from-GHL contacts are intentionally excluded (mirrors legacy UI).
  if ((raw.ghl_status as string | undefined) === 'deleted_from_ghl') return false;
  return true;
}

export async function resyncGhlLead(lead: UnifiedLead): Promise<void> {
  const raw = (lead.raw ?? {}) as Record<string, unknown>;
  const { error } = await supabase.functions.invoke('log-ghl-submission', {
    body: {
      submission_id: lead.id,
      lead_email: lead.email ?? raw.lead_email,
      lead_name:
        raw.lead_name ||
        [raw.lead_first_name, raw.lead_last_name].filter(Boolean).join(' ').trim() ||
        lead.name,
      lead_first_name: raw.lead_first_name ?? null,
      lead_last_name: raw.lead_last_name ?? null,
      lead_phone: lead.phone ?? raw.lead_phone ?? null,
      lead_company: lead.company ?? raw.lead_company ?? null,
      source_page: raw.source_page ?? lead.source_url ?? null,
      source_medium: raw.source_medium ?? null,
      lead_source: raw.lead_source ?? null,
      ghl_status: 'submitted',
      ghl_response: { sync_type: 'retry' },
    },
  });
  if (error) throw new Error(error.message || 'Sync failed');
}
