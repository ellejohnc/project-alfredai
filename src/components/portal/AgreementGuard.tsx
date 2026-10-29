import { Navigate, Outlet, useLocation } from "react-router-dom";
import { usePartnerPortal } from "@/contexts/PartnerPortalContext";
import { LOCKED_UNTIL_AGREEMENT_ROUTES } from "@/lib/partnerOnboarding";

export default function AgreementGuard() {
  const { profile } = usePartnerPortal();
  const location = useLocation();

  const isAdmin = !!profile?.is_admin;
  const agreementSigned = !!profile?.onboarding?.sign_agreement;

  // Partners are blocked from onboarding pages until the Consulting Partner
  // Agreement is signed. Admin users always retain direct access.
  if (!isAdmin && !agreementSigned && LOCKED_UNTIL_AGREEMENT_ROUTES.includes(location.pathname)) {
    return <Navigate to="/partners/portal/agreement?locked=true" replace />;
  }

  return <Outlet />;
}
