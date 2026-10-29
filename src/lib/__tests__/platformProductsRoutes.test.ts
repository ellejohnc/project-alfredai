import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { platformProducts, platformProductHref, getPlatformProduct } from "@/data/platformProducts";

const app = readFileSync(resolve(__dirname, "../../App.tsx"), "utf8");
const routes = [...app.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
const matches = (path: string) =>
  routes.some((r) => {
    const a = r.split("/"), b = path.split("/");
    return a.length === b.length && a.every((s, i) => s.startsWith(":") ? b[i] !== "" : s === b[i]);
  });

describe("Products line-up", () => {
  it("lists the ten products asked for", () => {
    expect(platformProducts.map((p) => p.name)).toEqual([
      "AI Take-Off", "Accountable", "alfred Assist", "BOTO", "alfredBID",
      "alfredHUB", "Portal Strata", "alfred MCP", "Vibe-coding Studio", "Voice Agent",
    ]);
  });
  it("every product link opens a real page", () => {
    for (const p of platformProducts) {
      const href = platformProductHref(p);
      expect(matches(href), href).toBe(true);
      if (!p.href) expect(getPlatformProduct(p.slug)).toBeTruthy();
    }
  });
});
