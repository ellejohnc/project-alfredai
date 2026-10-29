// FAQ engagement analytics — fire-and-forget tracking for FAQ open events.
//
// Writes to `public.faq_engagement` via the anon Supabase client (RLS allows
// anonymous INSERT only). Reads are restricted to admins. The companion view
// `faq_engagement_funnel` joins each open to any booking/lead submission
// sharing the same email within 30 days so admins can see which questions
// drive conversions.

import { supabase } from "@/integrations/supabase/client";

interface TrackFaqOpenInput {
  slug: string;
  group?: string;
  question: string;
}

const DEDUPE_KEY = "alfred_faq_engagement_seen";
const DEDUPE_WINDOW_MS = 30 * 60 * 1000; // 30 min — avoid double-counting toggles

function getDedupeMap(): Record<string, number> {
  try {
    const raw = sessionStorage.getItem(DEDUPE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setDedupeMap(map: Record<string, number>) {
  try {
    sessionStorage.setItem(DEDUPE_KEY, JSON.stringify(map));
  } catch {
    /* storage full / disabled — tracking still works, just no dedupe */
  }
}

function getVisitorContext(): {
  session_id: string | null;
  visitor_email: string | null;
  source: string | null;
  medium: string | null;
} {
  if (typeof window === "undefined") {
    return { session_id: null, visitor_email: null, source: null, medium: null };
  }
  try {
    const session_id = localStorage.getItem("alfred_visitor_session");
    // Identity prefill stores merged visitor identity (email, company, etc.)
    let visitor_email: string | null = null;
    const identity = localStorage.getItem("alfred_visitor_identity");
    if (identity) {
      try {
        const parsed = JSON.parse(identity);
        visitor_email = parsed?.email ?? null;
      } catch {
        /* ignore malformed identity */
      }
    }
    const params = new URLSearchParams(window.location.search);
    return {
      session_id,
      visitor_email,
      source: params.get("utm_source"),
      medium: params.get("utm_medium"),
    };
  } catch {
    return { session_id: null, visitor_email: null, source: null, medium: null };
  }
}

/**
 * Log an FAQ open event. Safe to call from event handlers — never throws,
 * never blocks, dedupes the same question for 30 min per session.
 */
export function trackFaqOpen({ slug, group, question }: TrackFaqOpenInput): void {
  if (typeof window === "undefined" || !slug) return;

  const now = Date.now();
  const path = window.location.pathname;
  const dedupeKey = `${path}::${slug}`;
  const seen = getDedupeMap();
  if (seen[dedupeKey] && now - seen[dedupeKey] < DEDUPE_WINDOW_MS) {
    return;
  }
  seen[dedupeKey] = now;
  setDedupeMap(seen);

  const ctx = getVisitorContext();

  // Fire-and-forget; swallow errors so analytics never breaks the UI.
  supabase
    .from("faq_engagement")
    .insert({
      faq_slug: slug,
      faq_group: group ?? null,
      faq_question: question,
      page_path: path,
      session_id: ctx.session_id,
      visitor_email: ctx.visitor_email,
      source: ctx.source,
      medium: ctx.medium,
      user_agent: navigator.userAgent?.slice(0, 500) ?? null,
    })
    .then(({ error }) => {
      if (error && import.meta.env.DEV) {
        console.warn("[faq-analytics] insert failed:", error.message);
      }
    });
}
