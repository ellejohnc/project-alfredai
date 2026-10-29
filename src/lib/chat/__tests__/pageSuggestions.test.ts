import { describe, it, expect } from "vitest";
import { getPageSuggestions } from "../pageSuggestions";

describe("chat page suggestions", () => {
  it("AI Take-Off asks about trades and the 500-sheet set", () => {
    expect(getPageSuggestions("/solutions/ai-takeoff").suggestions).toContain("How long does a 500-sheet set take?");
  });
  it("AI Employees asks about the accounts team", () => {
    expect(getPageSuggestions("/solutions/ai-for-construction/operations").suggestions).toContain("Which role fits my accounts team?");
  });
  it("Email Pre-send asks what it checks", () => {
    expect(getPageSuggestions("/solutions/email-presend-intelligence").suggestions).toContain("What does it check before I send?");
  });
  it("no page offers 'What is alfred ai?'", () => {
    for (const p of ["/", "/products", "/pricing", "/solutions/ai-takeoff"]) {
      expect(getPageSuggestions(p).suggestions).not.toContain("What is alfred ai?");
    }
  });
});
