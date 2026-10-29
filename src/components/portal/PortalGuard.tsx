import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Clock, MailQuestion } from "lucide-react";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { usePartnerPortal } from "@/contexts/PartnerPortalContext";
import logo from "/alfred-ai-logo.png";

function PortalLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-partner-bg">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-partner-pink border-t-transparent" />
    </div>
  );
}

export default function PortalGuard() {
  const { user, isLoading: authLoading, signOut } = useUserAuth();
  const { profile, isLoading } = usePartnerPortal();
  const location = useLocation();

  if (authLoading || isLoading) return <PortalLoader />;
  if (!user) return <Navigate to="/partners/portal/sign-in" replace />;
  if (!profile) return <Navigate to="/partners/portal/sign-in" replace />;

  const onChangePassword = location.pathname.endsWith("/change-password");

  // Force first-login password change before any portal access.
  if (profile.must_change_password && !profile.is_admin && !onChangePassword) {
    return <Navigate to="/partners/portal/change-password" replace />;
  }
  // Once the password is set, keep the dedicated page out of reach.
  if (onChangePassword && !profile.must_change_password) {
    return <Navigate to="/partners/portal" replace />;
  }

  if (!profile.is_approved && !profile.is_admin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-partner-bg px-6 text-center font-portal">
        <img src={logo} alt="alfred ai" className="mb-8 h-9 w-auto" />
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-partner-pink/10">
            <Clock className="h-6 w-6 text-partner-pink" />
          </div>
          <h1 className="font-portal-display text-xl font-semibold text-partner-navy">
            Your account is awaiting approval
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Thanks for registering, {profile.full_name.split(" ")[0]}. An alfred ai team member is
            reviewing your application. You'll get full access to the partner portal once you're
            approved.
          </p>
          <a
            href="mailto:william@alfredai.bot?subject=Partner%20portal%20access"
            className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-partner-pink px-4 py-2 text-sm font-semibold text-white hover:bg-partner-pink-hover"
          >
            <MailQuestion className="h-4 w-4" />
            Chase up your approval
          </a>
          <button
            onClick={() => signOut()}
            className="mt-3 block w-full text-sm font-medium text-slate-500 hover:text-partner-navy"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
