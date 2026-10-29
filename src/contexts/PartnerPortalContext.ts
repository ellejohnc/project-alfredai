import { createContext, useContext } from "react";
import { usePartnerProfile, PartnerProfile } from "@/hooks/usePartnerProfile";
interface PartnerPortalContextValue {
  profile: PartnerProfile | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateOnboarding: (next: Record<string, boolean>) => Promise<void>;
}

export const PartnerPortalContext = createContext<PartnerPortalContextValue | undefined>(undefined);

export function usePartnerPortal() {
  const ctx = useContext(PartnerPortalContext);
  if (!ctx) throw new Error("usePartnerPortal must be used within PartnerPortalProvider");
  return ctx;
}
