import { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { usePartnerPortal } from "@/contexts/PartnerPortalContext";
import { usePartnerDeals } from "@/hooks/usePartnerDeals";
import {
  calculateCommission,
  formatPartnerCurrency,
  tierProgress,
  TIER_THRESHOLDS,
  currencyForTerritory,
  Territory,
} from "@/lib/partnerCommission";

export default function MyEarnings() {
  const { profile } = usePartnerPortal();
  const { cumulativeSales, pendingSales, awaitingApproval, deals, isLoading } = usePartnerDeals();
  const territory: Territory = profile?.territory ?? "ANZ";
  const currency = currencyForTerritory(territory);

  const [setupFee, setSetupFee] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("");
  const [cumulative, setCumulative] = useState("0");

  // Prefill cumulative from the partner's confirmed/won deals once loaded.
  useEffect(() => {
    if (cumulativeSales > 0) setCumulative(String(Math.round(cumulativeSales)));
  }, [cumulativeSales]);

  const cumulativeNum = Number(cumulative) || 0;
  const result = useMemo(
    () => calculateCommission(Number(setupFee) || 0, Number(monthlyFee) || 0, cumulativeNum),
    [setupFee, monthlyFee, cumulativeNum],
  );

  const { next, remaining } = tierProgress(cumulativeNum);
  const maxThreshold = TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];
  const progressPct = Math.min(100, (cumulativeNum / maxThreshold) * 100);
  const fmt = (n: number) => formatPartnerCurrency(n, territory);

  const wonDeals = useMemo(() => deals.filter((d) => d.status === "won"), [deals]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-portal-display text-2xl font-bold text-partner-navy">My Earnings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Estimate what a deal pays you. All amounts in {currency}.
        </p>
      </div>

      {/* Tier progress */}
      <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-portal-display text-base font-semibold text-partner-navy">
            Your tier progress this financial year
          </h2>
          <span className="text-sm font-medium text-slate-500">{fmt(cumulativeNum)}</span>
        </div>
        <div className="relative mt-6">
          {/* Scale markers with labels at each tier threshold */}
          <div className="relative mb-1 h-2.5 w-full">
            {/* Track background */}
            <div className="absolute inset-0 h-full w-full overflow-hidden rounded-full bg-slate-100" />
            {/* Progress fill */}
            <div
              className="absolute h-full rounded-full bg-partner-pink transition-all"
              style={{ width: `${progressPct}%` }}
            />
            {/* Threshold ticks and labels */}
            {[0, ...TIER_THRESHOLDS].map((t) => {
              const leftPct = Math.min(100, (t / maxThreshold) * 100);
              return (
                <div
                  key={t}
                  className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                  style={{ left: `${leftPct}%` }}
                >
                  <span className="h-3.5 w-0.5 rounded-full bg-slate-400" />
                  <span className="mt-1 text-[10px] font-medium text-slate-500">
                    {fmt(t)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          {next === null ? (
            <>You're in the top tier — every new deal earns the highest setup rate.</>
          ) : (
            <>
              {fmt(remaining)} more in cumulative sales to reach the next tier at {fmt(next)}.
            </>
          )}
        </p>
        <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Deals only count toward your tier and payout once alfred ai has{" "}
          <strong>approved the registration</strong> and the client payment has{" "}
          <strong>cleared in Stripe</strong>.
          {pendingSales > 0 && (
            <> {fmt(pendingSales)} is in your pipeline awaiting approval or payment clearance.</>
          )}
          {awaitingApproval > 0 && (
            <>
              {" "}
              {awaitingApproval} deal{awaitingApproval === 1 ? "" : "s"} awaiting admin approval.
            </>
          )}
        </p>
      </Card>


      <div className="grid gap-6 lg:grid-cols-2">
        {/* Inputs */}
        <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-portal-display text-base font-semibold text-partner-navy">
            Calculator
          </h2>
          <div className="space-y-4">
            <Field label="This deal's setup fee">
              <input type="number" min="0" value={setupFee} onChange={(e) => setSetupFee(e.target.value)} className="portal-input" placeholder="0" />
            </Field>
            <Field label="This deal's monthly fee">
              <input type="number" min="0" value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} className="portal-input" placeholder="0" />
            </Field>
            <Field label="My cumulative sales so far this financial year">
              <input type="number" min="0" value={cumulative} onChange={(e) => setCumulative(e.target.value)} className="portal-input" placeholder="0" />
            </Field>
          </div>
        </Card>

        {/* Outputs */}
        <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-portal-display text-base font-semibold text-partner-navy">
            Your estimated earnings
          </h2>
          <div className="space-y-3 text-sm">
            <Row
              label="Applicable tier"
              value={`${result.tier.label} · ${Math.round(result.setupRate * 100)}% setup`}
            />
            <Row
              label="Setup-fee commission"
              value={fmt(result.setupCommission)}
              hint={`${fmt(Number(setupFee) || 0)} × ${Math.round(result.setupRate * 100)}%`}
            />
            <Row
              label="Trailing commission"
              value={fmt(result.trailingCommission)}
              hint={`${fmt(Number(monthlyFee) || 0)} × 10% × 12 months`}
            />
            <div className="my-3 h-px bg-slate-100" />
            <div className="flex items-end justify-between">
              <span className="font-medium text-partner-navy">Total first-year earnings</span>
              <span className="font-portal-display text-2xl font-bold text-partner-pink">
                {fmt(result.totalFirstYear)}
              </span>
            </div>
            <p className="pt-2 text-xs text-slate-400">
              The setup rate is set by your cumulative sales before this deal. Trailing commission is
              10% of the monthly fee for the first 12 months of each deal, then it stops.
            </p>
          </div>
        </Card>
      </div>

      {/* Won deals */}
      <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-portal-display text-base font-semibold text-partner-navy">
              Your won deals
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              All deals you've registered that are currently won, with their numbers.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-partner-navy">
            {wonDeals.length} deal{wonDeals.length === 1 ? "" : "s"} won
          </span>
        </div>

        {isLoading ? (
          <p className="mt-4 text-sm text-slate-500">Loading deals…</p>
        ) : wonDeals.length === 0 ? (
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-500">
            No won deals yet. When you close a client, it will appear here.
          </p>
        ) : (
          <div className="mt-4 -mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
            <div className="min-w-[32rem] sm:min-w-0">
              <div className="grid grid-cols-[1fr_90px_90px_110px_100px] gap-3 border-b border-slate-100 pb-2 text-xs font-medium text-slate-500 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
                <span>Client</span>
                <span className="text-right">Setup fee</span>
                <span className="text-right">Monthly fee</span>
                <span className="text-right">First-year value</span>
                <span className="text-right">Status</span>
              </div>
              <ul className="divide-y divide-slate-100">
                {wonDeals.map((deal) => (
                  <li
                    key={deal.id}
                    className="grid grid-cols-[1fr_90px_90px_110px_100px] gap-3 py-3 text-sm sm:grid-cols-[2fr_1fr_1fr_1fr_1fr]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-partner-navy">{deal.client_name}</p>
                      <p className="truncate text-xs text-slate-400">{deal.contact_email}</p>
                    </div>
                    <span className="self-center text-right text-slate-600">
                      {fmt(Number(deal.setup_fee))}
                    </span>
                    <span className="self-center text-right text-slate-600">
                      {fmt(Number(deal.monthly_fee))}
                    </span>
                    <span className="self-center text-right font-semibold text-partner-navy">
                      {fmt(Number(deal.setup_fee) + Number(deal.monthly_fee) * 12)}
                    </span>
                    <span className="self-center text-right">
                      {deal.payment_cleared ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                          Cleared
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
                          Awaiting payment
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          First-year value = setup fee + (monthly fee × 12). Only cleared deals count toward your
          tier and payout.
        </p>
      </Card>

      {/* How you get paid */}
      <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-portal-display text-base font-semibold text-partner-navy">
          How a deal gets paid
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          From won to funds in your account — every step before commission is released.
        </p>

        <ol className="mt-6 space-y-0">
          {PAYOUT_STEPS.map((step, i) => (
            <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
              {i < PAYOUT_STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-[15px] top-9 h-[calc(100%-1.5rem)] w-px bg-slate-200"
                />
              )}
              <span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-partner-navy text-xs font-bold text-white">
                {i + 1}
              </span>
              <div className="pt-0.5">
                <p className="text-sm font-semibold text-partner-navy">{step.title}</p>
                <p className="mt-1 text-sm text-slate-600">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Commission is only released once the client payment has{" "}
          <strong>cleared in Stripe</strong> and the deal is approved. Trailing commission is paid
          monthly for the first 12 months of each deal.
        </p>
      </Card>
    </div>
  );
}

const PAYOUT_STEPS = [
  {
    title: "Deal won",
    body:
      "You close the client and the deal is logged in your portal. It sits in your pipeline as awaiting payment — it does not count toward your tier yet.",
  },
  {
    title: "Client pays",
    body:
      "The client is invoiced and pays the setup fee (and first monthly fee) through Stripe. Payment in local currency, plus tax where it applies.",
  },
  {
    title: "Payment clears",
    body:
      "Once funds settle and clear in Stripe, the deal moves from pending to confirmed and starts counting toward your cumulative sales and tier.",
  },
  {
    title: "Deal approved",
    body:
      "alfred ai reviews the cleared deal to confirm scope and commission rate. Approval locks in your applicable tier for that deal.",
  },
  {
    title: "Funds released",
    body:
      "Your setup-fee commission is released in the next payout run. Trailing commission follows monthly for 12 months as each client payment clears.",
  },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-partner-navy">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-slate-600">{label}</p>
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
      <span className="shrink-0 font-semibold text-partner-navy">{value}</span>
    </div>
  );
}
