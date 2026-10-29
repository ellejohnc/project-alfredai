import { describe, expect, it } from "vitest";
import { RUN_DEPTHS, RUN_TIME_BASIS } from "@/components/demos/takeoff/takeoffData";

/**
 * The take-off demo's depth picker quotes a run time per option. Those figures
 * are only honest next to the set size they were measured against — a bare
 * "≈ 20–30 min" reads as a promise about any drawing set.
 */
describe("AI Take-Off demo run depths", () => {
  it("quotes the run time I set for each depth", () => {
    expect(RUN_DEPTHS.map((d) => [d.id, d.time])).toEqual([
      ["quick", "≈ 20–30 min"],
      ["standard", "≈ 40–60 min"],
      ["thorough", "≈ 90–120 min"],
    ]);
  });

  it("states the set size the times are based on", () => {
    expect(RUN_TIME_BASIS).toBe(500);
  });
});
