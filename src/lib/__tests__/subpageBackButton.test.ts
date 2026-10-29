import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parentPath, showsBackButton } from "@/components/navigation/SubpageBackButton";

const SRC = resolve(__dirname, "../../components/navigation/SubpageBackButton.tsx");
const CSS = resolve(__dirname, "../../index.css");

describe("subpage back button", () => {
  it("is hidden on the homepage and admin", () => {
    expect(showsBackButton("/")).toBe(false);
    expect(showsBackButton("/admin/leads")).toBe(false);
    // /book has its own Back in its header — no second one.
    expect(showsBackButton("/book")).toBe(false);
  });
  it("shows on subpages", () => {
    expect(showsBackButton("/products/use-cases")).toBe(true);
  });
  it("falls back to the parent page with no history", () => {
    expect(parentPath("/products/use-cases")).toBe("/products");
    expect(parentPath("/pricing")).toBe("/");
  });
  it("is anchored to the page, not to the screen", () => {
    // A `fixed` row floats over the page while you read — the rule is that it
    // belongs to the page and scrolls away with it. Checked on the class strings
    // only, so a comment mentioning the word can't trip the guard.
    const src = readFileSync(SRC, "utf8");
    const classes = (src.match(/className="([^"]*)"/g) ?? []).join(" ");
    expect(classes).not.toMatch(/\bfixed\b/);
    expect(classes).toMatch(/\babsolute\b/);
    // Room for the row is reserved by the page, so it can't land on the
    // page's own eyebrow label.
    const css = readFileSync(CSS, "utf8");
    expect(css).toMatch(/html\[data-back-row="on"\]\s+body\s*\{[^}]*padding-top/);
    expect(src).toMatch(/dataset\.backRow\s*=\s*"on"/);
  });

});

