import { describe, it, expect } from "vitest";
import { roles, industries } from "@/data/solutionsData";
import { roleIndustryEngines, roleFallbacks, isReachableRoleIndustryKey } from "@/components/solutions/solutionFinderData";
import { engineMetadata } from "@/lib/demoEngineSync";

/**
 * QA: every (role × industry) combination must resolve to a non-empty
 * engine recommendation — either via an exact mapping or a role fallback.
 * Also verifies each referenced engine exists in engineMetadata so the UI
 * can render an icon, description and demo link.
 */
function resolve(roleId: string, industryId: string) {
  const exact = roleIndustryEngines[`${roleId}-${industryId}`];
  return exact ?? roleFallbacks[roleId] ?? null;
}

describe("SolutionFinder recommendations coverage", () => {
  it("has at least one role and one industry", () => {
    expect(roles.length).toBeGreaterThan(0);
    expect(industries.length).toBeGreaterThan(0);
  });

  describe.each(roles.map((r) => [r.id, r.title]))(
    "role %s (%s)",
    (roleId) => {
      it.each(industries.map((i) => [i.id, i.title]))(
        "returns a non-empty recommendation for industry %s (%s)",
        (industryId) => {
          const rec = resolve(roleId as string, industryId as string);
          expect(rec, `missing recommendation for ${roleId}-${industryId}`).not.toBeNull();
          expect(rec!.engines.length).toBeGreaterThan(0);
          expect(rec!.outcome.trim().length).toBeGreaterThan(0);
        },
      );

      it("has a role-level fallback", () => {
        expect(
          roleFallbacks[roleId as string],
          `missing roleFallback for ${roleId}`,
        ).toBeTruthy();
      });
    },
  );

  it("every referenced engine exists in engineMetadata", () => {
    const referenced = new Set<string>();
    Object.values(roleIndustryEngines).forEach((r) =>
      r.engines.forEach((e) => referenced.add(e)),
    );
    Object.values(roleFallbacks).forEach((r) =>
      r.engines.forEach((e) => referenced.add(e)),
    );
    const missing = [...referenced].filter((e) => !engineMetadata[e]);
    expect(missing, `engines missing from engineMetadata: ${missing.join(", ")}`).toEqual([]);
  });

  it("has no stale roleIndustryEngines keys (all reachable from live selectors)", () => {
    const stale = Object.keys(roleIndustryEngines).filter(
      (k) => !isReachableRoleIndustryKey(k),
    );
    expect(stale, `stale roleIndustryEngines keys: ${stale.join(", ")}`).toEqual([]);
  });

  it("has no stale roleFallbacks keys (all present in live roles)", () => {
    const roleIds = new Set(roles.map((r) => r.id));
    const stale = Object.keys(roleFallbacks).filter((k) => !roleIds.has(k));
    expect(stale, `stale roleFallbacks keys: ${stale.join(", ")}`).toEqual([]);
  });
});
