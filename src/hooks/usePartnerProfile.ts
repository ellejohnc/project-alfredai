import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserAuth } from "@/contexts/UserAuthContext";
import type { Territory } from "@/lib/partnerCommission";

export interface PartnerProfile {
  id: string;
  user_id: string;
  full_name: string;
  company: string | null;
  territory: Territory;
  is_approved: boolean;
  is_admin: boolean;
  must_change_password: boolean;
  onboarding: Record<string, boolean>;
  avatar_url: string | null;
  phone: string | null;
  contact_email: string | null;
  updated_at?: string | null;
}

export function usePartnerProfile() {
  const { user, isLoading: authLoading } = useUserAuth();
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("partner_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;

      if (data) {
        setProfile({
          ...(data as unknown as PartnerProfile),
          onboarding: (data.onboarding as Record<string, boolean>) ?? {},
          updated_at: (data.updated_at as string | null) ?? null,
        });
        setError(null);
        return;
      }

      // No partner profile — fall back to a synthesized admin profile if the
      // user is a global site admin (admin / super_admin), so they can use
      // their existing /admin account to manage the portal.
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      const isSiteAdmin =
        roleRow?.role === "admin" || roleRow?.role === "super_admin";

      if (isSiteAdmin) {
        // Recover any locally cached progress if a previous save failed to
        // reach the server.
        let cached: Record<string, boolean> = {};
        try {
          const raw = localStorage.getItem(`partner_onboarding_${user.id}`);
          if (raw) cached = JSON.parse(raw) as Record<string, boolean>;
        } catch {
          /* ignore */
        }
        setProfile({
          id: "site-admin",
          user_id: user.id,
          full_name:
            (user.user_metadata?.full_name as string) ||
            user.email ||
            "Administrator",
          company: "alfred ai",
          territory: "ANZ",
          is_approved: true,
          is_admin: true,
          must_change_password: false,
          onboarding: cached,
          avatar_url: (user.user_metadata?.avatar_url as string) ?? null,
          phone: null,
          contact_email: user.email ?? null,
        });
      } else {
        setProfile(null);
      }
      setError(null);
    } catch (err) {
      console.error("Failed to load partner profile", err);
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) fetchProfile();
  }, [authLoading, fetchProfile]);

  const updateOnboarding = useCallback(
    async (next: Record<string, boolean>) => {
      if (!profile) return;
      // Optimistic UI update
      setProfile({ ...profile, onboarding: next });

      // Upsert so the row is created if it doesn't exist yet (e.g. a site
      // admin using their /admin account who has no partner_profiles row).
      // This guarantees each step's completion status is persisted to the
      // database and therefore survives refresh and syncs across devices.
      const { error } = await supabase
        .from("partner_profiles")
        .upsert(
          {
            user_id: profile.user_id,
            full_name: profile.full_name,
            company: profile.company,
            territory: profile.territory,
            is_approved: profile.is_approved,
            is_admin: profile.is_admin,
            onboarding: next,
          },
          { onConflict: "user_id" },
        );

      if (error) {
        console.error("Failed to save onboarding", error);
        // Fallback: keep progress locally so the user isn't blocked, and
        // re-sync from the server on next load.
        try {
          localStorage.setItem(
            `partner_onboarding_${profile.user_id}`,
            JSON.stringify(next),
          );
        } catch {
          /* ignore storage errors */
        }
        fetchProfile();
      } else {
        // Clear any stale local fallback once the server is authoritative.
        try {
          localStorage.removeItem(`partner_onboarding_${profile.user_id}`);
        } catch {
          /* ignore */
        }
      }
    },
    [profile, fetchProfile],
  );

  return {
    profile,
    isLoading: authLoading || isLoading,
    error,
    refresh: fetchProfile,
    updateOnboarding,
  };
}
