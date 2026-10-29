import { describe, it, expect } from "vitest";
import { calculateTakeoffRoi, DEFAULT_ROI_INPUTS } from "../takeoffRoi";

const base = { ...DEFAULT_ROI_INPUTS, implementationFee: 0 };

describe("takeoff ROI", () => {
  it("20 take-offs × 8 h at 60% saves 96 hours a month", () => {
    expect(calculateTakeoffRoi(base).hoursSaved).toBeCloseTo(96);
  });

  it("example figures start at 2 extra tenders a month", () => {
    expect(calculateTakeoffRoi(base).additionalTenders).toBeCloseTo(2);
  });

  it("96 hours at A$80 is A$7,680 of labour capacity", () => {
    expect(calculateTakeoffRoi(base).labourCapacityValue).toBeCloseTo(7680);
  });

  it("does not double-count redeployed labour", () => {
    const r = calculateTakeoffRoi({ ...base, capacityToTendersPct: 100 });
    expect(r.retainedCapacityValue).toBe(0);
    expect(r.netBenefit).toBeCloseTo(r.contribution - r.runningCosts);
  });

  it("with no tender allocation, net = capacity − A$2,500 = A$5,180", () => {
    expect(calculateTakeoffRoi({ ...base, capacityToTendersPct: 0 }).netBenefit).toBeCloseTo(5180);
  });

  it("annual view is 12× monthly", () => {
    expect(calculateTakeoffRoi(base, "year").tenderedValue).toBeCloseTo(calculateTakeoffRoi(base).tenderedValue * 12);
  });
});
