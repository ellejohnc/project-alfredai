// Partner commission rules for the alfred ai Consulting Partner Portal.

export type Territory = "US" | "CA" | "ANZ";

export interface CommissionTier {
  label: string;
  rate: number; // setup-fee commission rate
  min: number; // cumulative sales floor (exclusive above this value)
}

// Tier thresholds based on cumulative sales (local currency) so far this FY.
// The rate is chosen on the cumulative total BEFORE the current deal — the deal
// that crosses a threshold keeps the lower rate.
export const COMMISSION_TIERS: CommissionTier[] = [
  { label: "Tier 1", rate: 0.1, min: 0 },
  { label: "Tier 2", rate: 0.15, min: 100_000 },
  { label: "Tier 3", rate: 0.25, min: 250_000 },
  { label: "Tier 4", rate: 0.3, min: 500_000 },
];

export const TIER_THRESHOLDS = [100_000, 250_000, 500_000];
export const TRAILING_RATE = 0.1;
export const TRAILING_MONTHS = 12;

export function tierForCumulative(cumulativeBefore: number): CommissionTier {
  if (cumulativeBefore > 500_000) return COMMISSION_TIERS[3];
  if (cumulativeBefore > 250_000) return COMMISSION_TIERS[2];
  if (cumulativeBefore > 100_000) return COMMISSION_TIERS[1];
  return COMMISSION_TIERS[0];
}

export interface CommissionResult {
  tier: CommissionTier;
  setupRate: number;
  setupCommission: number;
  trailingCommission: number;
  totalFirstYear: number;
  dealCumulativeValue: number; // setup + first 12 months of monthly fees
}

export function calculateCommission(
  setupFee: number,
  monthlyFee: number,
  cumulativeBefore: number,
): CommissionResult {
  const tier = tierForCumulative(cumulativeBefore);
  const setupCommission = setupFee * tier.rate;
  const trailingCommission = monthlyFee * TRAILING_RATE * TRAILING_MONTHS;
  return {
    tier,
    setupRate: tier.rate,
    setupCommission,
    trailingCommission,
    totalFirstYear: setupCommission + trailingCommission,
    dealCumulativeValue: setupFee + monthlyFee * TRAILING_MONTHS,
  };
}

export function currencyForTerritory(territory: Territory): string {
  switch (territory) {
    case "US":
      return "USD";
    case "CA":
      return "CAD";
    default:
      return "AUD";
  }
}

export function formatPartnerCurrency(amount: number, territory: Territory): string {
  const currency = currencyForTerritory(territory);
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount || 0));
}

// Next threshold above the current cumulative, and progress toward it.
export function tierProgress(cumulative: number) {
  const next = TIER_THRESHOLDS.find((t) => cumulative < t) ?? null;
  const tier = tierForCumulative(cumulative);
  const remaining = next === null ? 0 : next - cumulative;
  return { tier, next, remaining };
}
