import { describe, expect, it } from "vitest";
import {
  TRADES,
  TRADE_ORDER,
  FEATURED_TRADES,
  SUPPORTING_TRADES,
} from "@/components/demos/takeoff/takeoffData";
import { TRADE_ICONS } from "@/components/demos/takeoff/TradeSymbols";

/**
 * The trade list is read from three separate arrays — the standout cards, the
 * plain cards and the demo picker. Nothing but this test stops a trade landing
 * in one and not the others, which is how a page ends up advertising a trade
 * whose card opens nothing, or hiding one the demo can already run.
 */
describe("AI Take-Off trade list", () => {
  it("has demo data and a symbol for every trade it names", () => {
    for (const id of TRADE_ORDER) {
      expect(TRADES[id]?.id, `no demo data for ${id}`).toBe(id);
      expect(TRADE_ICONS[id], `no symbol for ${id}`).toBeTruthy();
    }
  });

  it("splits the trades into standout and supporting with none missing or repeated", () => {
    expect([...FEATURED_TRADES, ...SUPPORTING_TRADES].sort()).toEqual([...TRADE_ORDER].sort());
    expect(FEATURED_TRADES.filter((t) => SUPPORTING_TRADES.includes(t))).toEqual([]);
  });

  it("keeps scaffolding a supporting trade with a plain card", () => {
    expect(TRADES.scaffolding.label).toBe("Scaffolding Contractor");
    expect(SUPPORTING_TRADES).toContain("scaffolding");
    expect(FEATURED_TRADES).not.toContain("scaffolding");
  });
});
