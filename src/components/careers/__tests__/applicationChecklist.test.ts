import { describe, it, expect } from "vitest";
import {
  getApplicationChecklist,
  checklistComplete,
  SENIOR_DEV_SLUG,
  TECHNICAL_SALES_SLUG,
} from "../applicationChecklist";

describe("senior dev application checklist", () => {
  const list = getApplicationChecklist(SENIOR_DEV_SLUG);
  it("has mandatory items for the senior dev role", () => expect(list.length).toBeGreaterThan(5));
  it("blocks submit until every item is ticked", () => {
    expect(checklistComplete(list.map((_, i) => i < list.length - 1), list.length)).toBe(false);
    expect(checklistComplete(list.map(() => true), list.length)).toBe(true);
  });
  it("other roles have no checklist", () => expect(getApplicationChecklist("other")).toEqual([]));
  it("requires construction tech experience", () =>
    expect(list.some((item) => /construction tech/i.test(item))).toBe(true));
  it("requires the AU CTO reporting line", () =>
    expect(list.some((item) => /AU CTO reports to the CEO and the Global CTO only/i.test(item))).toBe(true));
});

describe("technical sales executive application checklist", () => {
  const list = getApplicationChecklist(TECHNICAL_SALES_SLUG);
  it("has mandatory items for the role", () => expect(list.length).toBeGreaterThan(5));
  it("blocks submit until every item is ticked", () => {
    expect(checklistComplete(list.map((_, i) => i < list.length - 1), list.length)).toBe(false);
    expect(checklistComplete(list.map(() => true), list.length)).toBe(true);
  });
  it("requires construction tech or construction-client sales experience", () =>
    expect(list.some((item) => /construction/i.test(item))).toBe(true));
  it("requires full sales cycle ownership", () =>
    expect(list.some((item) => /full sales cycle/i.test(item))).toBe(true));
  it("requires the VP of Sales reporting line", () =>
    expect(list.some((item) => /VP of Sales reports to the CEO and the Global CTO only/i.test(item))).toBe(true));
  it("does not name the Global CEO as the reporting line", () =>
    expect(list.some((item) => /Global CEO/i.test(item))).toBe(false));
  it("requires Australian work rights", () =>
    expect(list.some((item) => /working rights in Australia/i.test(item))).toBe(true));
  it("other roles still have no checklist", () => expect(getApplicationChecklist("other")).toEqual([]));
});
