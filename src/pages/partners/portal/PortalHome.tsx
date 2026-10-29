import { Link } from "react-router-dom";
import { FilePlus2, Briefcase, BookOpen, TrendingUp, Award, Trophy, Calculator } from "lucide-react";
import { Card } from "@/components/ui/card";
import { usePartnerPortal } from "@/contexts/PartnerPortalContext";
import { usePartnerDeals } from "@/hooks/usePartnerDeals";
import { onboardingProgress } from "@/lib/partnerOnboarding";
import { tierForCumulative, formatPartnerCurrency } from "@/lib/partnerCommission";

export default function PortalHome() {
  const { profile } = usePartnerPortal();
  const { deals, cumulativeSales, dealsWon } = usePartnerDeals();
  const territory = profile?.territory ?? "ANZ";
  const tier = tierForCumulative(cumulativeSales);
  const { complete, total } = onboardingProgress(profile?.onboarding ?? {});
  const pct = Math.round((complete / total) * 100);
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="overflow-hidden rounded-2xl bg-partner-navy px-6 py-8 text-white sm:px-8">
        <p className="text-sm font-medium text-partner-teal">Expert in Agentic AI for Project Execution</p>
        <h1 className="mt-2 font-portal-display text-2xl font-bold text-white sm:text-3xl">
          Welcome back, {firstName} — everything you need to sell alfred ai is here.
        </h1>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Award}
          label="Current tier"
          value={`${tier.label} · ${Math.round(tier.rate * 100)}%`}
          sub={formatPartnerCurrency(cumulativeSales, territory) + " cumulative"}
        />
        <StatCard icon={TrendingUp} label="Deals registered" value={String(deals.length)} />
        <StatCard icon={Trophy} label="Deals won" value={String(dealsWon)} />
      </div>

      {/* Onboarding progress */}
      <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-portal-display text-base font-semibold text-partner-navy">
            Onboarding progress
          </h2>
          <span className="text-sm font-medium text-slate-500">
            {complete} of {total} steps complete
          </span>
        </div>
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-partner-teal transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <Link
          to="/partners/portal/get-started"
          className="mt-4 inline-block text-sm font-semibold text-partner-pink hover:underline"
        >
          Continue onboarding →
        </Link>
      </Card>

      {/* Quick links */}
      <div>
        <h2 className="mb-3 font-portal-display text-base font-semibold text-partner-navy">
          Quick links
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink to="/explained/pricing/diy-quote" icon={Calculator} label="DIY Quote Builder" />
          <QuickLink to="/partners/portal/register-deal" icon={FilePlus2} label="Register a Deal" />
          <QuickLink to="/partners/portal/sales-kit" icon={Briefcase} label="Sales Kit" />
          <QuickLink to="/partners/portal/playbook" icon={BookOpen} label="Playbook" />
        </div>

      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4 text-partner-pink" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="mt-2 font-portal-display text-2xl font-bold text-partner-navy">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </Card>
  );
}

function QuickLink({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex min-h-[44px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-partner-pink/10">
        <Icon className="h-5 w-5 text-partner-pink" />
      </span>
      <span className="font-medium text-partner-navy">{label}</span>
    </Link>
  );
}
