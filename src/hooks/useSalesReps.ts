import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SalesRep {
  id: string;
  display_name: string;
  email: string;
  role: string;
}

/**
 * The team list used for the lead owner picker. Uses the existing
 * `list-sales-reps` edge function (service-role backed) so sales reps — who
 * cannot read the admin_users table directly under RLS — still get the list.
 * Never dead-ends: on failure returns an empty list and surfaces the error.
 */
async function fetchSalesReps(): Promise<SalesRep[]> {
  const { data, error } = await supabase.functions.invoke('list-sales-reps');
  if (error) throw error;
  if (data?.success && Array.isArray(data.reps)) {
    // Editor role must NOT be selectable as Lead Owner — only admin/sales roles.
    return (data.reps as SalesRep[]).filter(
      (r) => (r.role ?? '').toLowerCase() !== 'editor',
    );
  }
  throw new Error(data?.error || 'Could not load team list');
}

export function useSalesReps() {
  return useQuery({
    queryKey: ['sales-reps'],
    queryFn: fetchSalesReps,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
