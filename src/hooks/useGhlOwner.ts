import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GhlOwner {
  ghl_user_id: string | null;
  email: string | null;
  name: string | null;
}

export const ghlOwnerKey = (contactId: string | null | undefined) =>
  ['ghl-owner', contactId] as const;

export function useGhlOwner(contactId: string | null | undefined) {
  return useQuery<GhlOwner>({
    queryKey: ghlOwnerKey(contactId),
    enabled: !!contactId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('ghl-get-owner', {
        body: { contact_id: contactId },
      });
      if (error || data?.success === false) {
        throw new Error(error?.message || data?.error || 'Failed to load GHL owner');
      }
      return {
        ghl_user_id: data.ghl_user_id ?? null,
        email: data.email ?? null,
        name: data.name ?? null,
      };
    },
  });
}
