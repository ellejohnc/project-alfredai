/**
 * One rule for every gated resource (guides, playbooks, demos):
 * first name, last name, company, mobile with country code, valid work email,
 * and a mandatory consent tick to be contacted by those methods.
 */
import { businessEmailSchema } from "@/lib/emailValidation";
import { validatePhoneForCountry, formatInternationalPhone, detectCountryFromLocale } from "@/lib/phoneUtils";
import { getLeadIdentitySync } from "@/hooks/useLeadIdentity";

export const TURNOVER_OPTIONS = [
  "Under A$1M",
  "A$1M – A$3M",
  "A$3M – A$10M",
  "A$10M – A$100M",
  "A$100M and above",
] as const;

export interface ResourceAccessValues {
  firstName: string;
  lastName: string;
  company: string;
  turnover: string;
  countryCode: string;
  mobile: string;
  email: string;
  consent: boolean;
}

export type ResourceAccessErrors = Partial<Record<keyof ResourceAccessValues, string>>;

export const RESOURCE_PRIVACY_POLICY_PATH = "/privacy";

export const RESOURCE_CONSENT_TEXT =
  "I agree that alfred ai may contact me by phone, SMS and email using the details above, " +
  "and I have read the Privacy Policy. Agreeing is required to access this resource.";

export function validateResourceAccess(v: ResourceAccessValues): ResourceAccessErrors {
  const e: ResourceAccessErrors = {};
  if (!v.firstName.trim()) e.firstName = "First name is required";
  else if (v.firstName.trim().length > 60) e.firstName = "First name is too long";
  if (!v.lastName.trim()) e.lastName = "Last name is required";
  else if (v.lastName.trim().length > 60) e.lastName = "Last name is too long";
  if (v.company.trim().length < 2) e.company = "Company name is required";
  else if (v.company.trim().length > 120) e.company = "Company name is too long";
  if (!v.turnover) e.turnover = "Please select your annual turnover";
  if (!v.mobile.trim()) e.mobile = "Mobile number is required";
  else {
    const p = validatePhoneForCountry(v.mobile, v.countryCode);
    if (!p.isValid) e.mobile = p.error || "Invalid mobile number";
  }
  if (!v.email.trim()) e.email = "Work email is required";
  else {
    const r = businessEmailSchema.safeParse(v.email);
    if (!r.success) e.email = r.error.errors[0]?.message || "Please use your work email";
  }
  if (!v.consent) e.consent = "Please tick the box to agree before accessing this resource";
  return e;
}

export function normaliseResourceAccess(v: ResourceAccessValues) {
  return {
    firstName: v.firstName.trim(),
    lastName: v.lastName.trim(),
    fullName: `${v.firstName.trim()} ${v.lastName.trim()}`.trim(),
    company: v.company.trim(),
    phone: formatInternationalPhone(v.mobile.trim(), v.countryCode),
    email: v.email.trim().toLowerCase(),
  };
}

export function initialResourceAccessValues(): ResourceAccessValues {
  const id = getLeadIdentitySync();
  const [f, ...rest] = (id.name || "").split(" ");
  let turnover = "";
  try {
    turnover = JSON.parse(localStorage.getItem("alfred_lead_identity") || "{}").turnover || "";
  } catch { /* storage unavailable */ }
  return {
    firstName: id.firstName || f || "",
    lastName: id.lastName || rest.join(" ") || "",
    company: id.company || "",
    turnover,
    countryCode: detectCountryFromLocale(),
    mobile: id.phone && !id.phone.startsWith("+") ? id.phone : "",
    email: id.email || "",
    consent: false,
  };
}

