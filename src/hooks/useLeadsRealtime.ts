import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// NOTE: `demo_engagement` is deliberately NOT here. It is a telemetry table that
// useDemoViews writes to on every public demo view, and it is no longer a source
// in useUnifiedLeads. Subscribing to it made ordinary website traffic invalidate
// and refetch the entire admin inbox for data the inbox never reads.
// Demo-share leads reach the inbox as `ghl_submissions` rows instead.
const LEAD_TABLES = [
  'ghl_submissions','meta_leads','investor_leads','alpha_digital_leads',
  'leads','webinar_registrations',
  'lead_merges','lead_annotations','lead_notes',
];

/** Live-refresh the unified leads + overlay caches when any lead table changes. */
export function useLeadsRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    const invalidate = () => {
      if (t) clearTimeout(t);
      t = setTimeout(() => {
        qc.invalidateQueries({ queryKey: ['unified-leads'] });
        qc.invalidateQueries({ queryKey: ['lead-overlay'] });
      }, 800); // debounce bursts
    };
    const channel = supabase.channel('unified-leads-realtime');
    LEAD_TABLES.forEach((table) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, invalidate);
    });
    channel.subscribe();
    return () => { if (t) clearTimeout(t); supabase.removeChannel(channel); };
  }, [qc]);
}
