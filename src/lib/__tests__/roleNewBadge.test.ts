import { describe, it, expect } from "vitest";
import { ROLE_NEW_SLUGS, roleIsNew } from "@/components/careers/RoleNewBadge";

// The Senior Full-Stack AI Engineer role carries this slug in job_openings.
const SENIOR_DEV_SLUG = "senior-full-stack-ai-engineer";

describe("RoleNewBadge", () => {
  it("marks the Senior Full-Stack AI Engineer role as new", () => {
    expect(ROLE_NEW_SLUGS).toContain(SENIOR_DEV_SLUG);
  });

  it("matches on the role slug and nothing else", () => {
    expect(roleIsNew(SENIOR_DEV_SLUG)).toBe(true);
    expect(roleIsNew("technical-sales-executive")).toBe(false);
    expect(roleIsNew(null)).toBe(false);
  });
});
