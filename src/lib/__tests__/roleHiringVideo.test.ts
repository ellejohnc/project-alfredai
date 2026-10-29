import { describe, it, expect } from "vitest";
import { ROLE_HIRING_VIDEO_SLUGS, roleHasHiringVideo } from "@/components/careers/RoleHiringVideo";
import videoAsset from "@/assets/careers/au-cto-hiring-video.mp4.asset.json";
import posterAsset from "@/assets/careers/au-cto-hiring-video-poster.jpg.asset.json";

// The Senior Full-Stack AI Engineer role carries this slug in job_openings.
const SENIOR_DEV_SLUG = "senior-full-stack-ai-engineer";

describe("RoleHiringVideo", () => {
  it("targets the Senior Full-Stack AI Engineer role", () => {
    expect(ROLE_HIRING_VIDEO_SLUGS).toContain(SENIOR_DEV_SLUG);
  });

  it("matches on the role slug and nothing else", () => {
    expect(roleHasHiringVideo(SENIOR_DEV_SLUG)).toBe(true);
    expect(roleHasHiringVideo("technical-sales-executive")).toBe(false);
    expect(roleHasHiringVideo(null)).toBe(false);
  });

  it("has a CDN-hosted video and poster", () => {
    expect(videoAsset.url).toMatch(/^\/__l5e\/assets-v1\/.+\.mp4$/);
    expect(posterAsset.url).toMatch(/^\/__l5e\/assets-v1\/.+\.jpg$/);
  });
});
