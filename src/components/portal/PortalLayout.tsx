import { useState, type ComponentType } from "react";
import { Lock } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Home,
  Rocket,
  Palette,
  Briefcase,
  BookOpen,
  GraduationCap,
  FilePlus2,
  Wallet,
  LifeBuoy,
  Heart,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  Calculator,
  UserCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import logo from "/alfred-ai-logo.png";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { usePartnerPortal } from "@/contexts/PartnerPortalContext";
import { LOCKED_UNTIL_AGREEMENT_ROUTES } from "@/lib/partnerOnboarding";


const NAV_GROUPS = [
  {
    heading: "Essential",
    items: [
      { to: "/partners/portal", label: "Home", icon: Home, end: true },
      { to: "/partners/portal/get-started", label: "Get Started", icon: Rocket },
      { to: "/partners/portal/brand", label: "Brand & Identity", icon: Palette },
      { to: "/partners/portal/follow-support", label: "Follow & Support", icon: Heart },
    ],
  },
  {
    heading: "Learn",
    items: [
      { to: "/partners/portal/sales-kit", label: "Sales Kit", icon: Briefcase },
      { to: "/partners/portal/training", label: "Product & Training", icon: GraduationCap },
    ],
  },
  {
    heading: "Practice",
    items: [
      { to: "/partners/portal/playbook", label: "Playbook", icon: BookOpen },
      { to: "/partners/portal/diy-access", label: "DIY Quote", icon: Calculator },
    ],
  },
  {
    heading: "Earn",
    items: [
      { to: "/partners/portal/register-deal", label: "Register a Deal", icon: FilePlus2 },
      { to: "/partners/portal/earnings", label: "My Earnings", icon: Wallet },
    ],
  },

  {
    heading: "Account",
    items: [{ to: "/partners/portal/profile", label: "My Profile", icon: UserCircle }],
  },

  {
    heading: "Help",
    items: [{ to: "/partners/portal/support", label: "Support", icon: LifeBuoy }],
  },
];

interface NavItemDef {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
}

const LOCKED_UNTIL_AGREEMENT = new Set(LOCKED_UNTIL_AGREEMENT_ROUTES);

const LOCKED_TOOLTIP = "Locked — sign the Consulting Partner Agreement to unlock.";

function NavItems({
  onNavigate,
  showAdmin,
  agreementSigned,
}: {
  onNavigate?: () => void;
  showAdmin?: boolean;
  agreementSigned?: boolean;
}) {
  return (
    <nav className="flex flex-col gap-6">
      {NAV_GROUPS.map((group) => (
        <div key={group.heading} className="flex flex-col gap-1">
          <span className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {group.heading}
          </span>
          {group.items.map((item) => {
            const locked = agreementSigned === false && LOCKED_UNTIL_AGREEMENT.has(item.to);
            if (locked) {
              return (
                <span
                  key={item.to}
                  title={LOCKED_TOOLTIP}
                  className="flex min-h-[44px] cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 opacity-60"
                >
                  <item.icon className="h-[18px] w-[18px]" />
                  {item.label}
                  <Lock className="ml-auto h-3.5 w-3.5" />
                </span>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-partner-pink/10 text-partner-pink"
                      : "text-partner-navy/70 hover:bg-slate-100 hover:text-partner-navy"
                  }`
                }
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      ))}
      {showAdmin && (
        <div className="flex flex-col gap-1">
          <span className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Admin</span>
          <NavLink
            to="/partners/portal/admin"
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-partner-pink/10 text-partner-pink"
                  : "text-partner-navy/70 hover:bg-slate-100 hover:text-partner-navy"
              }`
            }
          >
            <ShieldCheck className="h-[18px] w-[18px]" />
            Admin
          </NavLink>
        </div>
      )}
    </nav>
  );
}


export default function PortalLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [viewAsPartner, setViewAsPartner] = useState(false);
  const { signOut } = useUserAuth();
  const { profile } = usePartnerPortal();
  const navigate = useNavigate();

  const isAdmin = !!profile?.is_admin;
  const showAdmin = isAdmin && !viewAsPartner;
  const agreementSigned = !!profile?.onboarding?.sign_agreement;
  const lockOnboarding = !isAdmin || viewAsPartner;

  const handleSignOut = async () => {
    await signOut();
    navigate("/partners/portal/sign-in");
  };

  const territoryLabel =
    profile?.territory === "US" ? "United States" : profile?.territory === "CA" ? "Canada" : "Australia / NZ";


  return (
    <div className="min-h-screen bg-partner-bg font-portal text-partner-navy">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col overflow-y-auto border-r border-slate-200 bg-white px-4 py-6 lg:flex">
        <img src={logo} alt="alfred ai" className="mb-8 h-8 w-auto self-start" />
        <NavItems showAdmin={showAdmin} agreementSigned={lockOnboarding ? agreementSigned : true} />
        {isAdmin && (
          <button
            onClick={() => setViewAsPartner((v) => !v)}
            className="mt-4 flex min-h-[44px] items-center gap-3 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-partner-navy/70 transition-colors hover:bg-slate-50"
          >
            {viewAsPartner ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            {viewAsPartner ? "Exit partner view" : "View as partner"}
          </button>
        )}
        <button
          onClick={handleSignOut}
          className="mt-auto flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-partner-navy/60 transition-colors hover:bg-slate-100"
        >
          <LogOut className="h-[18px] w-[18px] " />
          Sign out
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-partner-navy/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col overflow-y-auto bg-white px-4 py-6">
            <div className="mb-8 flex items-center justify-between">
              <img src={logo} alt="alfred ai" className="h-8 w-auto" />
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="p-2">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavItems onNavigate={() => setMobileOpen(false)} showAdmin={showAdmin} agreementSigned={lockOnboarding ? agreementSigned : true} />
            {isAdmin && (
              <button
                onClick={() => {
                  setViewAsPartner((v) => !v);
                  setMobileOpen(false);
                }}
                className="mt-4 flex min-h-[44px] items-center gap-3 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-partner-navy/70 transition-colors hover:bg-slate-50"
              >
                {viewAsPartner ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                {viewAsPartner ? "Exit partner view" : "View as partner"}
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="mt-auto flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-partner-navy/60 hover:bg-slate-100"
            >
              <LogOut className="h-[18px] w-[18px]" />
              Sign out
            </button>
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-portal-display text-sm font-semibold text-partner-navy">
              {profile?.full_name ?? "Partner"}
            </p>
            <p className="truncate text-xs text-slate-500">
              {profile?.company ? `${profile.company} · ` : ""}
              {territoryLabel}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-partner-navy px-3 py-1 text-xs font-semibold text-white">
            {showAdmin ? "alfred ai Admin" : "Approved Partner"}

          </span>
        </header>

        {isAdmin && viewAsPartner && (
          <div className="flex flex-col items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4 shrink-0" />
              Previewing the portal as a partner sees it. Admin tools are hidden.
            </span>
            <button
              onClick={() => setViewAsPartner(false)}
              className="min-h-[36px] shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
            >
              Exit partner view
            </button>
          </div>
        )}



        <main className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
          <Outlet />
        </main>

        <footer className="border-t border-slate-200 px-4 py-6 text-center text-xs text-slate-500 lg:px-8">
          Alfred AI Agent Services Pty Ltd · ABN 62 684 936 525 · alfredai.bot · Confidential
        </footer>
      </div>
    </div>
  );
}
