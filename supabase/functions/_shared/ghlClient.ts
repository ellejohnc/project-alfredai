/**
 * Shared GHL fetch helper for edge functions. Presents a browser UA so the
 * Cloudflare front-door doesn't block the request, adds Authorization + Version
 * headers, and implements a single retry with backoff on 429.
 */
import { createClient } from "npm:@supabase/supabase-js@2";

// The no-generic overload of createClient() resolves to a very restrictive
// client type (tables/rows = never, rpc args = undefined). Edge functions do
// not ship the generated Database type, so use an explicitly `any`-database
// client type for shared helpers.
export type SupabaseClientAny = ReturnType<typeof createClient<any>>;

export const GHL_BASE = "https://services.leadconnectorhq.com";


/**
 * Legacy date-based API version. HighLevel moved to NAMED versions from v3 on,
 * and its current docs mark `Version` as required with `v3` the only accepted
 * value on the documented surface. Date headers still work, but a superseded
 * version enters maintenance and is eventually retired, after which requests
 * carrying it are refused.
 *
 * This stays the default so untouched functions keep behaving exactly as they
 * did. Migrate ONE endpoint at a time by passing `version: GHL_V3` — the header
 * is per-request, and each resource has its own response DTO, so flipping the
 * shared default would change every function at once with no way to tell which
 * one broke.
 */
export const GHL_VERSION = "2021-07-28";

/** Current named version. See GHL_VERSION above for the migration rule. */
export const GHL_V3 = "v3";
export const GHL_LOCATION_ID =
  Deno.env.get("GHL_LOCATION_ID") || "0Mihjpq27y2HyrXxdfH3";
export const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export interface GhlFetchOpts {
  apiKey: string;
  method?: string;
  body?: unknown;
  accept?: string;
  /** Per-call API version. Defaults to GHL_VERSION; pass GHL_V3 to migrate. */
  version?: string;
}

export async function ghlFetch(path: string, opts: GhlFetchOpts): Promise<Response> {
  const url = path.startsWith("http") ? path : `${GHL_BASE}${path}`;
  const doFetch = () =>
    fetch(url, {
      method: opts.method ?? "GET",
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        Version: opts.version ?? GHL_VERSION,
        Accept: opts.accept ?? "application/json",

        "User-Agent": BROWSER_UA,
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });

  const version = opts.version ?? GHL_VERSION;
  let res = await doFetch();
  if (res.status === 429) {
    const retry = Number(res.headers.get("retry-after")) || 1;
    await new Promise((r) => setTimeout(r, Math.min(retry * 1000, 3000)));
    res = await doFetch();
  }

  // GoHighLevel answers 401 {"statusCode":401,"message":"Command timed out"}
  // when ITS OWN backend times out serving a request. The status code says
  // "your key is wrong" and the body says "we were slow", and only the body is
  // true — nothing about the key changed between a run that worked and one that
  // did not.
  //
  // That combination killed sync-meta-leads on every scheduled run: 401 is not
  // retried, searchContacts throws on any non-2xx, and one slow page aborted the
  // whole job, so new Meta leads simply stopped arriving. Twice on 25 Aug, at
  // 04:00 and 16:00, matching the schedule exactly.
  //
  // Matched on the BODY, not the status, so a genuine auth failure still fails
  // immediately and loudly rather than being retried three times and blamed on
  // the network. Cloned because the caller still needs to read the response.
  for (let attempt = 0; attempt < 2 && res.status === 401; attempt++) {
    const peek = await res.clone().text().catch(() => "");
    if (!/command timed out/i.test(peek)) break;
    const wait = 1000 * (attempt + 1) * 2;
    console.warn(
      `[ghlClient] ${opts.method ?? "GET"} ${path} -> 401 "Command timed out" ` +
      `(GoHighLevel-side, not the key) — retrying in ${wait}ms`,
    );
    await new Promise((r) => setTimeout(r, wait));
    res = await doFetch();
  }

  // Log the version on failure. Callers report "GHL API error (400)" without it,
  // and a version the endpoint has stopped accepting looks identical to a bad
  // payload from the outside — which is precisely the failure this integration
  // is now exposed to, having just moved every call from a 2021 date header to
  // v3. 4xx only: a 5xx is GoHighLevel's own problem, not our header.
  if (!res.ok && res.status >= 400 && res.status < 500 && res.status !== 429) {
    console.warn(
      `[ghlClient] ${opts.method ?? "GET"} ${path} -> ${res.status} (Version: ${version})`,
    );
  }
  return res;
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

/**
 * Reusable admin-auth guard mirroring the pattern from ghl-add-note.
 *
 * `allowServiceRole` is OPT-IN, per call site, on purpose. Every one of these
 * functions gates on a logged-in browser session (auth.getUser then is_admin),
 * which nothing unattended can satisfy — that is why the nightly deletion check
 * failed on every run for a week. Rather than accept the service key everywhere
 * silently, each function that genuinely needs a server-side caller says so at
 * its own call site, so the blast radius is visible in the diff.
 *
 * Accepting the key is not a widening where it IS enabled: anything holding it
 * can already read and write every table without going near these functions.
 * It is compared with === rather than parsed, and never logged.
 */
export async function requireAdmin(
  req: Request,
  supabase: SupabaseClientAny,
  opts: { allowServiceRole?: boolean } = {},
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return { ok: false, error: "Missing authorization header" };
  const token = authHeader.replace("Bearer ", "");

  if (opts.allowServiceRole) {
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (serviceKey && token === serviceKey) {
      return { ok: true, userId: "service_role" };
    }
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return { ok: false, error: "Invalid token" };
  const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: user.id });
  if (!isAdmin) return { ok: false, error: "Unauthorized: Admin access required" };
  return { ok: true, userId: user.id };
}

/** Simple in-memory user-id → display-name map for a location. Rebuilt per cold start. */
let userMapCache: { at: number; map: Record<string, string> } | null = null;
export async function fetchUserMap(apiKey: string): Promise<Record<string, string>> {
  if (userMapCache && Date.now() - userMapCache.at < 5 * 60 * 1000) return userMapCache.map;
  const map: Record<string, string> = {};
  try {
    // v3: SearchUserSuccessfulResponseDto is `{ users: [...] }` with id / name /
    // firstName / lastName / email — exactly what the parse below reads.
    const res = await ghlFetch(`/users/?locationId=${GHL_LOCATION_ID}`, { apiKey, version: GHL_V3 });
    if (!res.ok) {
      // Cache the empty map on failure too (401/403/429): re-asking on every
      // request just multiplies GHL traffic and log noise for a soft feature
      // (author display names). Retried after the same 5-min window.
      console.warn(`[ghlClient] users lookup failed ${res.status} — caching empty author map`);
      userMapCache = { at: Date.now(), map };
      return map;
    }
    const parsed: any = await res.json().catch(() => null);
    const users: any[] = Array.isArray(parsed?.users) ? parsed.users : Array.isArray(parsed) ? parsed : [];
    for (const u of users) {
      const id = u.id || u._id;
      if (!id) continue;
      const name =
        (u.name && String(u.name).trim()) ||
        [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
        (u.email && String(u.email).trim()) ||
        "";
      if (name) map[id] = name;
    }
    userMapCache = { at: Date.now(), map };
  } catch { /* fall through */ }
  return map;
}
