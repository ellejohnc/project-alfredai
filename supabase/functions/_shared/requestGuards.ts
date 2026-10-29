/**
 * Shared request-hardening helpers for edge functions.
 *
 * - `isInternalCaller`  : only allow service-role / internal-secret callers.
 * - `escapeHtml`        : prevent HTML/markup injection into branded emails.
 * - `isSafeLinkUrl`     : only allow links pointing at our own domains.
 * - `isAllowedFetchHost`: outbound-fetch allowlist (anti-SSRF).
 * - `timingSafeEqual`   : constant-time-ish secret comparison.
 */

export function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * True when the request was made by our own backend:
 * either the service-role JWT in `Authorization`, or a shared internal secret.
 */
export function isInternalCaller(req: Request): boolean {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET") ?? "";

  const auth = req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (serviceKey && bearer && timingSafeEqual(bearer, serviceKey)) return true;

  const provided = req.headers.get("x-internal-secret") ?? "";
  if (internalSecret && provided && timingSafeEqual(provided, internalSecret)) return true;

  return false;
}

export function forbiddenResponse(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: "This endpoint can only be called by AlfredAI's own backend.",
    }),
    { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } },
  );
}

export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Hostnames we are willing to put behind a button in a branded email. */
const LINK_HOST_SUFFIXES = [
  "alfredai.bot",
  "alfredai.app",
  "lovable.app",
  "lovableproject.com",
  "supabase.co",
];

function hostMatches(host: string, suffixes: string[]): boolean {
  const h = host.toLowerCase();
  return suffixes.some((s) => h === s || h.endsWith(`.${s}`));
}

/** Only https links on our own domains are safe to embed in emails. */
export function isSafeLinkUrl(raw: unknown): boolean {
  if (typeof raw !== "string" || raw.trim() === "") return false;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:") return false;
    return hostMatches(url.hostname, LINK_HOST_SUFFIXES);
  } catch {
    return false;
  }
}

/**
 * Outbound fetch allowlist for webhook attachment/transcript downloads.
 * Blocks SSRF against internal addresses and arbitrary third parties.
 */
export function isAllowedFetchHost(raw: unknown, extraSuffixes: string[] = []): boolean {
  if (typeof raw !== "string" || raw.trim() === "") return false;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    // Never allow literal IPs or local names.
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false;
    if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
    return hostMatches(host, [...LINK_HOST_SUFFIXES, ...extraSuffixes]);
  } catch {
    return false;
  }
}

/**
 * Fetch that re-checks the allowlist on EVERY hop.
 *
 * `isAllowedFetchHost` only validates the URL you hand it, so a plain
 * `fetch(url, { redirect: 'follow' })` lets an allowlisted host 302 the request
 * somewhere internal and the guard never sees the destination. We follow
 * redirects by hand instead and re-validate each Location before moving.
 */
export async function fetchFromAllowedHost(
  rawUrl: string,
  extraSuffixes: string[] = [],
  maxHops = 3,
): Promise<Response> {
  let url = rawUrl;

  for (let hop = 0; hop <= maxHops; hop++) {
    if (!isAllowedFetchHost(url, extraSuffixes)) {
      throw new Error('Download URL host is not allowed');
    }

    const response = await fetch(url, { redirect: 'manual' });
    if (response.status < 300 || response.status > 399) return response;

    const location = response.headers.get('location');
    if (!location) return response;

    // A relative Location stays on the host we already approved.
    url = new URL(location, url).toString();
  }

  throw new Error('Too many redirects while downloading');
}


export const FATHOM_FETCH_HOSTS = [
  "fathom.video",
  "fathom.ai",
  "usefathom.com",
  "amazonaws.com",
  "cloudfront.net",
];

export const GHL_FETCH_HOSTS = [
  "gohighlevel.com",
  "leadconnectorhq.com",
  "msgsndr.com",
  "highlevel-backend.appspot.com",
  "googleapis.com",
  "amazonaws.com",
  "cloudfront.net",
];
