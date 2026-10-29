import { Check, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePartnerPortal } from "@/contexts/PartnerPortalContext";
import { ONBOARDING_STEPS, onboardingProgress } from "@/lib/partnerOnboarding";

export default function GetStarted() {
  const navigate = useNavigate();
  const { profile, isLoading, updateOnboarding } = usePartnerPortal();
  const state = profile?.onboarding ?? {};
  const { complete, total } = onboardingProgress(state);

  const toggle = (id: string) => {
    updateOnboarding({ ...state, [id]: !state[id] });
  };

  const goToAction = (step: (typeof ONBOARDING_STEPS)[number]) => {
    if (step.href) {
      // Same-tab navigation to bypass popup blockers
      window.location.href = step.href;
      return;
    }
    if (step.to) navigate(step.to);
  };

  // While the persisted completion is loading from the database, show a
  // skeleton so we never flash empty (0 of N) client state before the saved
  // progress arrives.
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-portal-display text-2xl font-bold text-partner-navy">Get Started</h1>
          <p className="mt-1 text-sm text-slate-500">Loading your saved progress…</p>
        </div>
        <div className="h-14 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
        <ul className="space-y-3">
          {ONBOARDING_STEPS.map((step) => (
            <li
              key={step.id}
              className="h-20 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
            />
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-portal-display text-2xl font-bold text-partner-navy">Get Started</h1>
        <p className="mt-1 text-sm text-slate-500">
          Work through these steps to be ready to sell alfred ai. Each step links straight to the
          action — your progress is saved automatically.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <span className="text-sm font-medium text-slate-600">
          {complete} of {total} steps complete
        </span>
        <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-partner-teal transition-all"
            style={{ width: `${(complete / total) * 100}%` }}
          />
        </div>
      </div>

      <ul className="space-y-3">
        {ONBOARDING_STEPS.map((step, index) => {
          const done = !!state[step.id];
          const agreementSigned = !!state["sign_agreement"];
          const locked = index > 0 && !agreementSigned;
          return (
            <li
              key={step.id}
              className={`flex flex-col gap-3 rounded-xl border p-4 transition-colors sm:flex-row sm:items-center ${
                locked
                  ? "border-slate-200 bg-slate-50 opacity-60"
                  : done
                    ? "border-partner-teal/40 bg-partner-teal/5"
                    : "border-slate-200 bg-white"
              }`}
              aria-disabled={locked}
            >
              <button
                type="button"
                onClick={() => !locked && toggle(step.id)}
                disabled={locked}
                aria-label={done ? `Mark "${step.label}" as not done` : `Mark "${step.label}" as done`}
                className={`flex flex-1 items-start gap-4 text-left ${locked ? "cursor-not-allowed" : ""}`}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                    done ? "border-partner-teal bg-partner-teal text-white" : "border-slate-300"
                  }`}
                >
                  {done && <Check className="h-4 w-4" />}
                </span>
                <span className="space-y-0.5">
                  <span
                    className={`block text-sm ${
                      done ? "text-slate-500 line-through" : locked ? "text-slate-500" : "font-medium text-partner-navy"
                    }`}
                  >
                    {step.label}
                  </span>
                  {locked ? (
                    <span className="block text-xs text-slate-400">
                      Locked — sign the Consulting Partner Agreement to unlock.
                    </span>
                  ) : (
                    step.description && (
                      <span className="block text-xs text-slate-400">{step.description}</span>
                    )
                  )}
                </span>
              </button>

              <button
                type="button"
                onClick={() => !locked && goToAction(step)}
                disabled={locked}
                title={locked ? "Sign the agreement in step 1 to unlock this step." : undefined}
                className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors sm:w-auto ${
                  locked
                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                    : "border-partner-teal/40 bg-white text-partner-teal hover:bg-partner-teal/10"
                }`}
              >
                {step.actionLabel}
                <ArrowRight className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>

    </div>
  );
}
