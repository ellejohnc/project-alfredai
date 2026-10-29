import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserAuth } from "@/contexts/UserAuthContext";
import type { Territory } from "@/lib/partnerCommission";
import { TRAILING_MONTHS } from "@/lib/partnerCommission";

export interface Deal {
  id: string;
  partner_id: string;
  client_name: string;
  contact_email: string;
  description: string | null;
  setup_fee: number;
  monthly_fee: number;
  territory: Territory;
  status: "pending" | "confirmed" | "won" | "lost";
  created_at: string;
  payment_status: "pending" | "succeeded" | "failed";
  payment_cleared: boolean;
  payment_cleared_at: string | null;
  commission_status: "pending" | "eligible" | "paid";
  commission_eligible_at: string | null;
  manual_override: boolean;
  override_note: string | null;
  stripe_payment_intent_id: string | null;
  /** Admin approval gate — commission never accrues until this is "approved". */
  approval_status: "pending" | "approved" | "rejected";
  approval_note: string | null;

}

export function usePartnerDeals() {
  const { user } = useUserAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeals = useCallback(async () => {
    if (!user) {
      setDeals([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setDeals((data ?? []) as unknown as Deal[]);
      setError(null);
    } catch (err) {
      console.error("Failed to load deals", err);
      setError(err instanceof Error ? err.message : "Failed to load deals");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // Keep the partner's deal list in sync when an admin updates a deal's status.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`deals-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deals", filter: `partner_id=eq.${user.id}` },
        () => fetchDeals(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchDeals]);

  // Commission only counts once the client payment has cleared in Stripe (or an
  // admin has manually overridden). Each eligible deal contributes its setup fee
  // plus its first 12 months of monthly fees toward the tier.
  const isCommissionEligible = (d: Deal) =>
    d.commission_status === "eligible" || d.commission_status === "paid";

  const cumulativeSales = deals
    .filter(isCommissionEligible)
    .reduce((sum, d) => sum + Number(d.setup_fee) + Number(d.monthly_fee) * TRAILING_MONTHS, 0);

  // Pipeline = registered deals awaiting admin approval or payment clearance.
  const pendingSales = deals
    .filter((d) => !isCommissionEligible(d) && d.status !== "lost" && d.approval_status !== "rejected")
    .reduce((sum, d) => sum + Number(d.setup_fee) + Number(d.monthly_fee) * TRAILING_MONTHS, 0);

  const awaitingApproval = deals.filter((d) => d.approval_status === "pending").length;
  const dealsWon = deals.filter((d) => d.status === "won").length;
  const dealsCleared = deals.filter(isCommissionEligible).length;

  return {
    deals,
    isLoading,
    error,
    refresh: fetchDeals,
    cumulativeSales,
    pendingSales,
    awaitingApproval,
    dealsWon,
    dealsCleared,

  };
}
