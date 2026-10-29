import { type ReactNode } from "react";
import { usePartnerProfile, PartnerProfile } from "@/hooks/usePartnerProfile";
import { PartnerPortalContext } from "./PartnerPortalContext";

export function PartnerPortalProvider({ children }: { children: ReactNode }) {
  const value = usePartnerProfile();
  return <PartnerPortalContext.Provider value={value}>{children}</PartnerPortalContext.Provider>;
}
