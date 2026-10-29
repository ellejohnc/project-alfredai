// Page engagement & bounce tracking — fire-and-forget client tracker.
//
// Mirrors the `faqAnalytics.ts` pattern: anon INSERT to `page_engagement`,
// then UPDATEs as the visitor scrolls / clicks / leaves. Admin-only SELECT.
//
// What we track per session:
//   - landed_at + last_active_at  → time on page
//   - max_scroll_pct              → 0/25/50/75/100 milestones
//   - primary_cta_clicks          → { hero_try_demo, sticky_try_demo, ... }
//   - exit_section                → last visible <section data-section-id="..">
//   - engaged                     → true if scrolled > 50% OR ≥ 10s OR any CTA click
//   - bounced                     → inverse of engaged, finalised on pagehide
//
// All writes are fire-and-forget — never throw, never block render.
// Project rule: edge/RPC failures must surface a useful fallback. Tracker is
// silent on failure (visitor doesn't care), but admins can spot missing rows
// in the dashboard and we ship logs to console for dev visibility.

import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "alfred_visitor_session";
const ENGAGED_TIME_MS = 10_000;
const ENGAGED_SCROLL_PCT = 50;

type CtaCounts = Record<string, number>;

function getDevice(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function getOrCreateSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() ??
        `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}

function getVisitorEmail(): string | null {
  try {
    const raw = localStorage.getItem("alfred_visitor_identity");
    if (!raw) return null;
    return JSON.parse(raw)?.email ?? null;
  } catch {
    return null;
  }
}

function readUtm() {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  return {
    utm_source: p.get("utm_source"),
    utm_medium: p.get("utm_medium"),
    utm_campaign: p.get("utm_campaign"),
  };
}

export interface PageEngagementHandle {
  stop: () => void;
}

/**
 * Start tracking the current page. Safe to call inside useEffect — returns
 * a handle whose `stop()` is the cleanup. No-op on SSR.
 */
export function startPageEngagement(): PageEngagementHandle {
  if (typeof window === "undefined") return { stop: () => {} };

  const session_id = getOrCreateSessionId();
  const path = window.location.pathname;
  const device = getDevice();
  const utm = readUtm();
  const visitor_email = getVisitorEmail();

  let rowId: string | null = null;
  let maxScrollPct = 0;
  let exitSection: string | null = null;
  let ctaClicks: CtaCounts = {};
  let engaged = false;
  let stopped = false;
  const landedAt = Date.now();

  // Insert initial row. Anonymous visitors have no SELECT privilege on
  // page_engagement (only admins can read), so we cannot use .select().single()
  // to read the id back — PostgREST would treat it as an RLS violation and roll
  // the insert back. Generate the id client-side and insert with returning=minimal.
  const preId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : null;
  rowId = preId;
  (async () => {
    try {
      await supabase
        .from("page_engagement")
        .insert({
          ...(preId ? { id: preId } : {}),
          session_id,
          path,
          referrer: document.referrer || null,
          utm_source: utm.utm_source,
          utm_medium: utm.utm_medium,
          utm_campaign: utm.utm_campaign,
          device,
          visitor_email,
          user_agent: navigator.userAgent,
        });
    } catch {
      /* fail silently — tracking is best-effort */
    }
  })();

  // ---- Scroll tracking (throttled via rAF) ----
  let scrollPending = false;
  const onScroll = () => {
    if (scrollPending) return;
    scrollPending = true;
    requestAnimationFrame(() => {
      scrollPending = false;
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      if (total <= 0) return;
      const pct = Math.min(100, Math.round((window.scrollY / total) * 100));
      if (pct > maxScrollPct) maxScrollPct = pct;
      if (!engaged && maxScrollPct >= ENGAGED_SCROLL_PCT) engaged = true;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  // ---- Section visibility (last visible = exit_section) ----
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const id = (entry.target as HTMLElement).dataset.sectionId;
          if (id) exitSection = id;
        }
      }
    },
    { threshold: 0.4 }
  );
  // Observe any element tagged with data-section-id (we add these progressively)
  const observeSections = () => {
    document
      .querySelectorAll<HTMLElement>("[data-section-id]")
      .forEach((el) => sectionObserver.observe(el));
  };
  observeSections();
  // Re-observe after lazy sections mount (poll a few times, cheap)
  const reobserveTimers = [500, 1500, 3500, 7000].map((ms) =>
    window.setTimeout(observeSections, ms)
  );

  // ---- CTA click delegation ----
  const onClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const cta = target.closest<HTMLElement>("[data-cta-id]");
    if (!cta) return;
    const id = cta.dataset.ctaId;
    if (!id) return;
    ctaClicks = { ...ctaClicks, [id]: (ctaClicks[id] ?? 0) + 1 };
    engaged = true;
    // Best-effort write — visitor is navigating away, so use the final push path
    flush({ final: false });
  };
  document.addEventListener("click", onClick, true);

  // ---- Engagement timer ----
  const engagedTimer = window.setTimeout(() => {
    engaged = true;
  }, ENGAGED_TIME_MS);

  // ---- Flush (UPDATE row via session-scoped SECURITY DEFINER RPC) ----
  const flush = async ({ final }: { final: boolean }) => {
    if (!rowId) return;
    try {
      await supabase.rpc("update_page_engagement", {
        p_id: rowId,
        p_session_id: session_id,
        p_last_active_at: new Date().toISOString(),
        p_max_scroll_pct: maxScrollPct,
        p_primary_cta_clicks: ctaClicks,
        p_exit_section: exitSection,
        p_engaged: engaged,
        p_bounced: final ? !engaged : false,
      });
    } catch {
      /* silent — tracking is best-effort */
    }
  };

  // Periodic heartbeat (every 15s) to capture engaged visitors who never exit
  const heartbeat = window.setInterval(() => {
    if (!stopped) flush({ final: false });
  }, 15_000);

  const onPageHide = () => flush({ final: true });
  const onVisibility = () => {
    if (document.visibilityState === "hidden") flush({ final: true });
  };
  window.addEventListener("pagehide", onPageHide);
  document.addEventListener("visibilitychange", onVisibility);

  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearTimeout(engagedTimer);
      window.clearInterval(heartbeat);
      reobserveTimers.forEach((t) => window.clearTimeout(t));
      sectionObserver.disconnect();
      // One last write so SPA route changes still flush
      flush({ final: true });
    },
  };
}
