/**
 * UTM & Traffic Source Tracking
 * 
 * Captures UTM parameters, fbclid, gclid, and document.referrer on first page load.
 * Stores them in sessionStorage so they persist across navigation but reset per visit.
 */

const UTM_STORAGE_KEY = "alfred_utm_data";

export interface UTMData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  gclid?: string;
  referrer?: string;
  traffic_source?: string; // Computed: "Facebook", "Google", "Direct", etc.
  landing_page?: string;
}

/**
 * Detect the human-readable traffic source from UTM/referrer data
 */
function detectTrafficSource(params: URLSearchParams, referrer: string): string {
  // Check UTM source first (most explicit)
  const utmSource = params.get("utm_source")?.toLowerCase();
  if (utmSource) {
    if (utmSource.includes("facebook") || utmSource === "fb" || utmSource === "ig" || utmSource === "instagram") return "Facebook";
    if (utmSource.includes("google")) return "Google Ads";
    if (utmSource.includes("linkedin")) return "LinkedIn";
    if (utmSource.includes("twitter") || utmSource === "x") return "Twitter/X";
    if (utmSource.includes("tiktok")) return "TikTok";
    if (utmSource.includes("youtube")) return "YouTube";
    if (utmSource.includes("email") || utmSource.includes("newsletter")) return "Email";
    return utmSource.charAt(0).toUpperCase() + utmSource.slice(1);
  }

  // Check click IDs (Facebook/Google)
  if (params.get("fbclid")) return "Facebook";
  if (params.get("gclid")) return "Google Ads";

  // Check referrer
  if (referrer) {
    try {
      const refHost = new URL(referrer).hostname.toLowerCase();
      if (refHost.includes("facebook.com") || refHost.includes("fb.com") || refHost.includes("instagram.com")) return "Facebook";
      if (refHost.includes("google.com") || refHost.includes("google.co")) return "Google (Organic)";
      if (refHost.includes("linkedin.com")) return "LinkedIn";
      if (refHost.includes("twitter.com") || refHost.includes("x.com")) return "Twitter/X";
      if (refHost.includes("tiktok.com")) return "TikTok";
      if (refHost.includes("youtube.com")) return "YouTube";
      if (refHost.includes("bing.com")) return "Bing";
      // If referrer exists but doesn't match known sources
      return `Referral (${refHost})`;
    } catch {
      // Invalid URL
    }
  }

  return "Direct";
}

/**
 * Capture UTM parameters from the current URL and store in sessionStorage.
 * Should be called once on app mount. Only captures on first call per session.
 */
export function captureUTMParams(): void {
  try {
    // Only capture once per session
    if (sessionStorage.getItem(UTM_STORAGE_KEY)) return;

    const params = new URLSearchParams(window.location.search);
    const referrer = document.referrer || "";

    const utmData: UTMData = {
      utm_source: params.get("utm_source") || undefined,
      utm_medium: params.get("utm_medium") || undefined,
      utm_campaign: params.get("utm_campaign") || undefined,
      utm_content: params.get("utm_content") || undefined,
      utm_term: params.get("utm_term") || undefined,
      fbclid: params.get("fbclid") || undefined,
      gclid: params.get("gclid") || undefined,
      referrer: referrer || undefined,
      traffic_source: detectTrafficSource(params, referrer),
      landing_page: window.location.pathname,
    };

    // Remove undefined keys before storing
    const cleaned = Object.fromEntries(
      Object.entries(utmData).filter(([, v]) => v !== undefined)
    );

    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(cleaned));
  } catch (error) {
    console.error("Failed to capture UTM params:", error);
  }
}

/**
 * Get stored UTM data for the current session
 */
export function getUTMData(): UTMData {
  try {
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Silently fail
  }
  return { traffic_source: "Direct" };
}

/**
 * Get just the traffic source label (e.g., "Facebook", "Google Ads", "Direct")
 */
export function getTrafficSource(): string {
  return getUTMData().traffic_source || "Direct";
}

/**
 * Check if current session traffic originates from Facebook/Meta ads.
 * Detects via utm_source, fbclid, or referrer.
 */
export function isFromMetaAds(): boolean {
  const data = getUTMData();
  if (data.fbclid) return true;
  if (data.traffic_source === "Facebook") return true;
  const src = data.utm_source?.toLowerCase() || "";
  return src.includes("facebook") || src === "fb" || src === "ig" || src === "instagram" || src === "meta";
}
