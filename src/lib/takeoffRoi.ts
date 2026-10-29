// AI Take-Off ROI calculator — pure, transparent formulas (all AUD, monthly base).
// Labour saved is capacity value, not cash. Hours redirected to extra tenders are
// valued ONLY through the contribution of won work — never also as labour (no double count).

export interface RoiInputs {
  takeoffsPerMonth: number;
  hoursPerTakeoff: number;
  timeSavedPct: number; // 0-100
  labourRate: number; // A$/hr fully loaded
  avgTenderValue: number; // A$
  capacityToTendersPct: number; // 0-100
  winRatePct: number; // 0-100
  marginPct: number; // 0-100
  monthlySubscription: number;
  implementationFee: number; // one-off
  monthlyAiCharges: number;
  monthlyOtherCosts: number;
  /** Optional: total hours to prepare one tender (take-off + pricing + review). Defaults to take-off hours. */
  tenderPrepHours?: number | null;
}

// Example figures start at 2 extra tenders a month: 20 take-offs × 8 h at 60% = 96 h
// saved; half of that (48 h) goes into extra tenders at 24 h each = exactly 2.
export const DEFAULT_ROI_INPUTS: RoiInputs = {
  takeoffsPerMonth: 20,
  hoursPerTakeoff: 8,
  timeSavedPct: 60,
  labourRate: 80,
  avgTenderValue: 1_500_000,
  capacityToTendersPct: 50,
  winRatePct: 20,
  marginPct: 10,
  monthlySubscription: 2_500,
  implementationFee: 5_000,
  monthlyAiCharges: 0,
  monthlyOtherCosts: 0,
  tenderPrepHours: 24,
};

export interface RoiResults {
  hoursSaved: number;
  labourCapacityValue: number;
  additionalTenders: number;
  tenderedValue: number;
  wonValue: number;
  contribution: number;
  retainedCapacityValue: number;
  runningCosts: number;
  implementationCost: number;
  netBenefit: number;
}

const clamp = (n: number, min = 0, max = Infinity) => (Number.isFinite(n) ? Math.min(Math.max(n, min), max) : 0);

export function calculateTakeoffRoi(raw: RoiInputs, period: "month" | "year" = "month"): RoiResults {
  const i = {
    ...raw,
    timeSavedPct: clamp(raw.timeSavedPct, 0, 100),
    capacityToTendersPct: clamp(raw.capacityToTendersPct, 0, 100),
    winRatePct: clamp(raw.winRatePct, 0, 100),
    marginPct: clamp(raw.marginPct, 0, 100),
  };
  const m = period === "year" ? 12 : 1;
  const hoursSaved = clamp(i.takeoffsPerMonth) * clamp(i.hoursPerTakeoff) * (i.timeSavedPct / 100);
  const prep = clamp(i.tenderPrepHours ?? i.hoursPerTakeoff);
  const alloc = i.capacityToTendersPct / 100;
  const additionalTenders = prep > 0 ? (hoursSaved * alloc) / prep : 0;
  const tenderedValue = additionalTenders * clamp(i.avgTenderValue);
  const wonValue = tenderedValue * (i.winRatePct / 100);
  const contribution = wonValue * (i.marginPct / 100);
  const labourCapacityValue = hoursSaved * clamp(i.labourRate);
  const retainedCapacityValue = labourCapacityValue * (1 - alloc);
  const runningCosts = clamp(i.monthlySubscription) + clamp(i.monthlyAiCharges) + clamp(i.monthlyOtherCosts);
  // Implementation is spread over the first 12 months.
  const implementationCost = clamp(i.implementationFee) / 12;
  const netBenefit = contribution + retainedCapacityValue - runningCosts - implementationCost;
  return {
    hoursSaved: hoursSaved * m,
    labourCapacityValue: labourCapacityValue * m,
    additionalTenders: additionalTenders * m,
    tenderedValue: tenderedValue * m,
    wonValue: wonValue * m,
    contribution: contribution * m,
    retainedCapacityValue: retainedCapacityValue * m,
    runningCosts: runningCosts * m,
    implementationCost: implementationCost * m,
    netBenefit: netBenefit * m,
  };
}

export const formatAud = (n: number) =>
  `${n < 0 ? "-" : ""}A$${Math.round(Math.abs(n)).toLocaleString("en-AU")}`;
