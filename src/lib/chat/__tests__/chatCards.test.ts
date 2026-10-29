import { describe, it, expect } from "vitest";
import { extractCards, stripQualification, TRADE_CARDS } from "../chatCards";

describe("chat cards", () => {
  it("makes a card for a linked workflow", () => {
    expect(extractCards("See [AI Take-Off](/solutions/ai-takeoff).")[0].href).toBe("/solutions/ai-takeoff");
  });
  it("ignores links to pages that are not in the site lists", () => {
    expect(extractCards("[Made up](/nope)")).toHaveLength(0);
  });
  it("shows the three featured trade demos with 'See the demo'", () => {
    expect(TRADE_CARDS.map((t) => t.cta)).toEqual(["See the demo", "See the demo", "See the demo"]);
    expect(extractCards("Take-off covers General Contractor, Windows and Steelwork.").length).toBe(3);
  });
  it("hides the qualification tag and reads its answers", () => {
    const r = stripQualification('Great.<!--q {"trade":"Steelwork","size":"50"}-->');
    expect(r.text).toBe("Great.");
    expect(r.qualification).toEqual({ trade: "Steelwork", size: "50" });
  });
});
