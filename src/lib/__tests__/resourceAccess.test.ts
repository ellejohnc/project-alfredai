import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import {
  RESOURCE_CONSENT_TEXT,
  RESOURCE_PRIVACY_POLICY_PATH,
  TURNOVER_OPTIONS,
  validateResourceAccess,
  type ResourceAccessValues,
} from "@/lib/resourceAccess";

const ok: ResourceAccessValues = {
  firstName: "Sam", lastName: "Lee", company: "Acme Builders", turnover: "A$1M – A$3M",
  countryCode: "AU", mobile: "0412 345 678", email: "sam@acmebuilders.com.au", consent: true,
};

describe("resource access rule", () => {
  it("accepts a complete entry", () => expect(validateResourceAccess(ok)).toEqual({}));
  it("requires first name", () => expect(validateResourceAccess({ ...ok, firstName: " " }).firstName).toBeTruthy());
  it("requires last name", () => expect(validateResourceAccess({ ...ok, lastName: "" }).lastName).toBeTruthy());
  it("requires company", () => expect(validateResourceAccess({ ...ok, company: "" }).company).toBeTruthy());
  it("requires an annual turnover choice", () => expect(validateResourceAccess({ ...ok, turnover: "" }).turnover).toBeTruthy());
  it("only accepts the offered turnover ranges", () => {
    for (const bad of ["<$1m", "5 million", "$1M-$3M"]) {
      expect(TURNOVER_OPTIONS).not.toContain(bad as never);
    }
  });
  it("requires a valid mobile", () => expect(validateResourceAccess({ ...ok, mobile: "123" }).mobile).toBeTruthy());
  it("rejects personal email", () => expect(validateResourceAccess({ ...ok, email: "sam@gmail.com" }).email).toBeTruthy());
  it("rejects invalid email", () => expect(validateResourceAccess({ ...ok, email: "sam@" }).email).toBeTruthy());
  it("requires the consent tick", () => expect(validateResourceAccess({ ...ok, consent: false }).consent).toBeTruthy());

  // The consent line points at the Privacy Policy. A path is only a string, so
  // nothing else checks that it is a page the router can actually serve.
  it("mentions the privacy policy", () => expect(RESOURCE_CONSENT_TEXT).toContain("Privacy Policy"));
  it("links to a real privacy policy route", () => {
    const src = readFileSync(resolve(__dirname, "../../App.tsx"), "utf8");
    const paths = [...src.matchAll(/<Route\s+[^>]*path="([^"]+)"/g)].map((m) => m[1]);
    expect(paths).toContain(RESOURCE_PRIVACY_POLICY_PATH);
  });
});
