import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FeatureFlag {
  id: string;
  flag_key: string;
  is_enabled: boolean;
  description: string | null;
}

/**
 * Hook to fetch a single feature flag by key.
 * Returns the flag state and loading status.
 */
export const useFeatureFlag = (flagKey: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["feature-flag", flagKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("*")
        .eq("flag_key", flagKey)
        .maybeSingle();

      if (error) throw error;
      return data as FeatureFlag | null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    isEnabled: data?.is_enabled ?? true, // Default to true if flag doesn't exist
    isLoading,
    error,
    flag: data,
  };
};

/**
 * Hook to fetch all feature flags.
 * Useful for admin panels.
 */
export const useFeatureFlags = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["feature-flags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("*")
        .order("flag_key", { ascending: true });

      if (error) throw error;
      return data as FeatureFlag[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    flags: data ?? [],
    isLoading,
    error,
    refetch,
  };
};

/**
 * Update a feature flag's enabled state.
 */
export const updateFeatureFlag = async (flagKey: string, isEnabled: boolean) => {
  const { error } = await supabase
    .from("feature_flags")
    .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
    .eq("flag_key", flagKey);

  if (error) throw error;
  return true;
};

export type { FeatureFlag };
