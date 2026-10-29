import { z } from "zod";

/**
 * Common disposable/temporary email domains to block
 * These are used to prevent low-quality lead submissions
 */
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  // Popular disposable email services
  "mailinator.com", "guerrillamail.com", "guerrillamail.net", "guerrillamail.org",
  "tempmail.com", "temp-mail.org", "tempmail.net", "10minutemail.com", "10minutemail.net",
  "throwaway.email", "throwawaymail.com", "fakeinbox.com", "fakemailgenerator.com",
  "getnada.com", "getairmail.com", "mohmal.com", "emailondeck.com", "tempr.email",
  "dispostable.com", "mailnesia.com", "maildrop.cc", "mailcatch.com", "yopmail.com",
  "yopmail.fr", "yopmail.net", "trashmail.com", "trashmail.net", "trashmail.org",
  "sharklasers.com", "spam4.me", "spamgourmet.com", "spambox.us", "spamfree24.org",
  "mailslurp.com", "mailsac.com", "mintemail.com", "mytemp.email", "mt2015.com",
  "wegwerfmail.de", "wegwerfmail.net", "tempail.com", "burnermail.io", "emailfake.com",
  "fakemail.net", "mailnator.com", "tempinbox.com", "tmpmail.org", "tmpmail.net",
  "disposablemail.com", "inboxkitten.com", "33mail.com", "anonaddy.com", "spamex.com",
  "spamsphere.com", "tempomail.fr", "jetable.org", "mail-temp.com", "crazymailing.com",
  "discard.email", "discardmail.com", "emkei.cz", "fakeinbox.net", "getonemail.com",
  "guerrillamailblock.com", "harakirimail.com", "hmamail.com", "imgof.com",
  "mailexpire.com", "mailforspam.com", "mailfreeonline.com", "mailhub.pro",
  "mailimate.com", "mailmetrash.com", "mailzilla.com", "nomail.xl.cx",
  "objectmail.com", "otherinbox.com", "proxymail.eu", "rcpt.at", "rmqkr.net",
  "safe-mail.net", "sofort-mail.de", "spam.la", "spambog.com", "spambog.de",
  "spamobox.com", "spamspot.com", "tempemail.biz", "tempemail.com", "tempmailaddress.com",
  "tempmailer.com", "tempmailo.com", "thankyou2010.com", "thisisnotmyrealemail.com",
  "trash2009.com", "trashdevil.com", "trashymail.com", "trbvm.com", "trickmail.net",
  "mailnesia.com", "guerrillamail.biz", "guerrillamail.de", "guerrillamail.info",
  "mailinator.net", "mailinator.org", "mailinator2.com", "sogetthis.com", "mailinater.com",
  "mailinator.us", "reallymymail.com", "reconmail.com", "sendspamhere.com", "safetypost.de",
]);

/**
 * Personal/free email domains that should be blocked for B2B lead capture
 * These indicate non-business email addresses
 */
export const PERSONAL_EMAIL_DOMAINS = new Set([
  // Google
  "gmail.com", "googlemail.com",
  // Microsoft
  "outlook.com", "hotmail.com", "hotmail.co.uk", "hotmail.fr", "hotmail.de",
  "live.com", "live.co.uk", "msn.com",
  // Yahoo
  "yahoo.com", "yahoo.co.uk", "yahoo.com.au", "yahoo.fr", "yahoo.de", "yahoo.in",
  "ymail.com", "rocketmail.com",
  // Apple
  "icloud.com", "me.com", "mac.com",
  // Other major free providers
  "aol.com", "aim.com", "protonmail.com", "proton.me", "zoho.com",
  "mail.com", "email.com", "usa.com", "consultant.com", "europe.com",
  "gmx.com", "gmx.net", "gmx.de", "web.de", "t-online.de",
  // Regional free providers
  "bigpond.com", "bigpond.net.au", "optusnet.com.au", "ozemail.com.au",
  "fastmail.com", "fastmail.fm", "tutanota.com", "tutanota.de", "tutamail.com",
  // Other
  "inbox.com", "hushmail.com", "rediffmail.com", "163.com", "qq.com",
]);

/**
 * Check if an email domain is a known disposable/temporary email provider
 */
export const isDisposableEmail = (email: string): boolean => {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? DISPOSABLE_EMAIL_DOMAINS.has(domain) : false;
};

/**
 * Check if an email domain is a personal/free email provider
 */
export const isPersonalEmail = (email: string): boolean => {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? PERSONAL_EMAIL_DOMAINS.has(domain) : false;
};

/**
 * Basic email validation schema (format only)
 * Use this for less critical forms like unsubscribe
 */
export const basicEmailSchema = z
  .string()
  .trim()
  .min(5, "Email too short")
  .max(255, "Email too long")
  .email("Please enter a valid email address");

/**
 * Strict email validation schema with:
 * - Format validation
 * - Domain structure validation (must have proper TLD)
 * - Disposable email blocking
 * 
 * Use this for lead capture forms (booking, signup, newsletter)
 */
export const strictEmailSchema = z
  .string()
  .trim()
  .min(5, "Email too short")
  .max(255, "Email too long")
  .email("Please enter a valid email address")
  .refine(
    (email) => {
      // Must have a proper domain with at least one dot after @
      const parts = email.split("@");
      if (parts.length !== 2) return false;
      const domain = parts[1];
      return domain.includes(".") && !domain.startsWith(".") && !domain.endsWith(".");
    },
    { message: "Please enter a valid work email" }
  )
  .refine(
    (email) => !isDisposableEmail(email),
    { message: "Please use a work email (temporary emails not accepted)" }
  );

/**
 * Business email validation schema with:
 * - All strict validations
 * - Personal email blocking (Gmail, Yahoo, Outlook, etc.)
 * 
 * Use this for high-value B2B lead capture (pricing, demo requests)
 */
export const businessEmailSchema = z
  .string()
  .trim()
  .min(5, "Email too short")
  .max(255, "Email too long")
  .email("Please enter a valid email address")
  .refine(
    (email) => {
      // Must have a proper domain with at least one dot after @
      const parts = email.split("@");
      if (parts.length !== 2) return false;
      const domain = parts[1];
      return domain.includes(".") && !domain.startsWith(".") && !domain.endsWith(".");
    },
    { message: "Please enter a valid business email" }
  )
  .refine(
    (email) => !isDisposableEmail(email),
    { message: "Please use a work email (temporary emails not accepted)" }
  )
  .refine(
    (email) => !isPersonalEmail(email),
    { message: "Please use your work email (e.g. you@company.com)" }
  );

/**
 * Validate email and return result with parsed value or error message
 */
export const validateEmail = (
  email: string,
  strict = true
): { success: true; email: string } | { success: false; error: string } => {
  const schema = strict ? strictEmailSchema : basicEmailSchema;
  const result = schema.safeParse(email);
  
  if (result.success) {
    return { success: true, email: result.data };
  }
  
  return { 
    success: false, 
    error: result.error.errors[0]?.message || "Invalid email address" 
  };
};
