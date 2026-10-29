import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Mail, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { BOOKING_CONFIG, LeadSourceData } from "@/lib/bookingConfig";
import { logGHLSubmission } from "@/hooks/useGHLLogging";
import { getLeadIdentitySync } from "@/hooks/useLeadIdentity";
import { getUTMData } from "@/lib/utmTracking";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Animated calendar skeleton shown while the GHL iframe loads.
 * After ~8s of waiting, surfaces a graceful fallback so users aren't
 * stranded behind a slow embed — they can email us with their page URL.
 */
const CalendarSkeleton = ({ height, retrying }: { height: string; retrying?: boolean }) => {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setSlow(true), 8000);
    return () => window.clearTimeout(t);
  }, []);


  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const mailto = `mailto:hello@alfredai.bot?subject=${encodeURIComponent(
    "Calendar didn't load on your booking page"
  )}&body=${encodeURIComponent(
    `Hi — the booking calendar didn't load for me.\n\nPage: ${pageUrl}\n\nPlease send me a direct booking link.`
  )}`;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading your calendar"
      className="w-full flex flex-col items-center justify-center px-4"
      style={{ height: height === "100%" ? "500px" : height, minHeight: 400 }}
    >
      <div className="w-full max-w-md">
        {/* Header chip */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary animate-pulse" aria-hidden />
          </div>
          <div className="flex-1">
            <div className="h-3.5 w-40 rounded bg-muted animate-pulse" />
            <div className="mt-2 h-2.5 w-24 rounded bg-muted/70 animate-pulse" />
          </div>
        </div>

        {/* Day strip */}
        <div className="grid grid-cols-7 gap-1.5 mb-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-10 rounded-md bg-muted animate-pulse"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>

        {/* Time slots */}
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-11 rounded-lg bg-muted animate-pulse"
              style={{ animationDelay: `${(i + 2) * 80}ms` }}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-3.5 h-3.5" aria-hidden />
          <span>{retrying ? "Still loading — retrying the calendar…" : "Loading your calendar…"}</span>
        </div>


        {slow && (
          <div className="mt-4 rounded-lg border border-border bg-card p-3 text-center">
            <p className="text-xs text-muted-foreground">
              Calendar slow to load on your network?
            </p>
            <a
              href={mailto}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4 min-h-[44px]"
            >
              <Mail className="w-3.5 h-3.5" aria-hidden />
              Email us and we'll send a direct booking link
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Shown when the embedded calendar never renders — common inside in-app
 * browsers (WhatsApp, Instagram, LinkedIn) which block third-party iframes.
 * Always gives the visitor a way forward: open the booking page directly,
 * or email us with their page URL.
 */
const CalendarFallback = ({
  bookingUrl,
  onRetry,
}: {
  bookingUrl: string;
  onRetry?: () => void;
}) => {
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const mailto = `mailto:hello@alfredai.bot?subject=${encodeURIComponent(
    "Booking calendar didn't load"
  )}&body=${encodeURIComponent(
    `Hi — the booking calendar didn't load for me.\n\nPage: ${pageUrl}\n\nPlease send me a direct booking link.`
  )}`;

  return (
    <div className="w-full px-4 py-6 text-center" style={{ minHeight: 320 }}>
      <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
        <Calendar className="w-6 h-6 text-primary" aria-hidden />
      </div>
      <h3 className="mt-3 font-semibold text-foreground">
        The calendar didn't load
      </h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
        This is usually a slow network or an in-app browser blocking embedded
        calendars. Try refreshing — or open the booking page directly.
      </p>
      <div className="mt-4 flex flex-col items-center gap-3 w-full max-w-xs mx-auto">
        <button
          type="button"
          onClick={() => onRetry?.()}
          className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium w-full"
        >
          <RefreshCw className="w-4 h-4" aria-hidden />
          Refresh calendar
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-lg border border-border bg-card text-foreground text-sm font-medium w-full"
        >
          <RefreshCw className="w-4 h-4" aria-hidden />
          Reload page
        </button>
        <button
          type="button"
          onClick={() => {
            window.location.href = bookingUrl;
          }}
          className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-lg border border-border bg-card text-foreground text-sm font-medium w-full"
        >
          <ExternalLink className="w-4 h-4" aria-hidden />
          Open booking page
        </button>
      </div>
      <a
        href={mailto}
        className="mt-3 inline-flex items-center justify-center gap-1.5 min-h-[44px] text-sm font-medium text-primary hover:underline underline-offset-4"
      >
        <Mail className="w-3.5 h-3.5" aria-hidden />
        Or email us and we'll send you times
      </a>
    </div>
  );
};



interface GHLBookingWidgetProps {
  /** Lead data to pre-fill the booking form */
  leadData?: {
    name?: string;
    email?: string;
    company?: string;
    phone?: string;
  };
  /** Source tracking data for GHL attribution */
  sourceData?: LeadSourceData;
  /** Qualification data from booking flow */
  qualificationData?: {
    role?: string;
    industry?: string;
    challenge?: string;
    size?: string;
    timeline?: string;
  };
  /** Height of the widget */
  height?: string | number;
  /** Additional class names */
  className?: string;
  /** Called when booking is complete (if detectable) */
  onComplete?: () => void;
  /** Called when the iframe load state changes */
  onLoadStateChange?: (state: { loaded: boolean; failed: boolean }) => void;
  /** Variant for different contexts */
  variant?: "inline" | "card" | "fullscreen";
}

/**
 * Reusable GoHighLevel booking widget component
 * Centralizes all GHL calendar embed instances
 * 
 * Flow: 
 * 1. Log submission via edge function → creates GHL contact with rich tags
 * 2. Wait for GHL to index the contact (3s delay)
 * 3. Load calendar widget → finds existing contact by email lookup
 * This prevents duplicate contacts while preserving rich tag data.
 */
export const GHLBookingWidget = memo(function GHLBookingWidget({
  leadData,
  sourceData,
  qualificationData,
  height = 500,
  className,
  variant = "inline",
  onLoadStateChange,
}: GHLBookingWidgetProps) {
  const [calendarReady, setCalendarReady] = useState(false);
  // Real iframe load signal — `calendarReady` only means "we started loading".
  const [frameLoaded, setFrameLoaded] = useState(false);
  // If the embed never renders (in-app browsers often block it), show a fallback.
  const [frameFailed, setFrameFailed] = useState(false);
  /**
   * Self-healing loads. IMPORTANT: previous versions guessed at "blocked"
   * embeds (empty contentDocument + a `no-cors` reachability fetch). Both
   * produced FALSE failures — GHL's embed legitimately fires an early
   * about:blank load event, and the no-cors probe rejects on redirects,
   * tracking-protection and in-app browsers even when the iframe is fine.
   * Each false failure bumped `attempt`, which changed the iframe `key` and
   * tore down a perfectly healthy in-flight load → intermittent blank panel.
   *
   * Now: trust `onLoad`, allow ONE slow-load retry, and never unmount the
   * iframe once the fallback is shown so a late load can still take over.
   */
  const MAX_AUTO_RETRIES = 1;
  const ATTEMPT_TIMEOUT_MS = 12000;
  const [attempt, setAttempt] = useState(0);

  const retryNow = useCallback(() => {
    setFrameLoaded(false);
    setFrameFailed(false);
    setAttempt((a) => a + 1);
  }, []);

  // Real network-level failure (rare, but authoritative).
  const handleFrameError = useCallback(() => {
    setFrameLoaded(false);
    setFrameFailed(true);
  }, []);

  const handleFrameLoad = useCallback(() => {
    setFrameLoaded(true);
    setFrameFailed(false);
  }, []);

  // Slow-load watchdog: one silent retry, then surface the fallback while the
  // iframe keeps trying in the background.
  useEffect(() => {
    if (!calendarReady || frameLoaded || frameFailed) return;
    const t = window.setTimeout(() => {
      if (attempt < MAX_AUTO_RETRIES) {
        console.warn(`📅 Calendar slow to load (attempt ${attempt + 1}) — retrying once`);
        setAttempt((a) => a + 1);
      } else {
        setFrameFailed(true);
      }
    }, ATTEMPT_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [calendarReady, frameLoaded, frameFailed, attempt]);


  // Recover automatically when connectivity returns while we're in the
  // failed state. (Deliberately NOT on visibilitychange — returning to the
  // tab mid-booking would reload the iframe and wipe the visitor's progress.)
  useEffect(() => {
    if (!frameFailed) return;
    const onOnline = () => retryNow();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [frameFailed, retryNow]);

  // Report load-state changes to the parent so pages like /book can surface a
  // manual refresh affordance while the widget is still loading or failed.
  useEffect(() => {
    onLoadStateChange?.({ loaded: frameLoaded, failed: frameFailed });
  }, [frameLoaded, frameFailed, onLoadStateChange]);




  // Read persisted identity on each render (localStorage can change during the session)
  const storedIdentity = useMemo(() => getLeadIdentitySync(), [
    leadData?.name,
    leadData?.email,
    leadData?.phone,
    leadData?.company,
  ]);
  
  const mergedLeadData = useMemo(() => {
    return {
      name: leadData?.name || storedIdentity.name,
      email: leadData?.email || storedIdentity.email,
      phone: leadData?.phone || storedIdentity.phone,
      company: leadData?.company || storedIdentity.company,
    };
  }, [leadData?.name, leadData?.email, leadData?.phone, leadData?.company, storedIdentity]);

  /**
   * The iframe `src` MUST be stable across re-renders.
   *
   * `getWidgetUrl()` appends a `_t=Date.now()` cache-buster, so computing it on
   * every render handed the <iframe> a brand-new URL each time the parent
   * re-rendered (chat streaming, auto-scroll, framer-motion, timers…). The
   * browser then tore down and reloaded the embed mid-flight, which is why the
   * calendar showed as a blank white panel and visitors could never finish
   * booking. Memoise on the primitive inputs only — one URL per mount/identity.
   * Retries intentionally change the URL (via `attempt`) so a stale/aborted
   * response isn't reused — but it stays stable within a single attempt.
   */
  const widgetUrl = useMemo(
    () => BOOKING_CONFIG.getWidgetUrl(mergedLeadData, sourceData),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      mergedLeadData.name,
      mergedLeadData.email,
      mergedLeadData.phone,
      mergedLeadData.company,
      sourceData?.source,
      sourceData?.medium,
      sourceData?.campaign,
      sourceData?.content,
      attempt,
    ]
  );

  // NOTE: no reachability pre-flight here on purpose. A `no-cors` probe of the
  // widget URL rejects for many benign reasons (redirects, tracking
  // protection, in-app browsers) and previously forced a retry that destroyed
  // a healthy in-flight embed — the exact cause of the intermittent blank
  // calendar. The iframe's own load/error events are the only reliable signal.





  // Stable dependency key: callers pass `qualificationData` as an object literal,
  // whose identity changes every render and would otherwise re-run the init
  // effect (re-appending the embed script and re-logging the submission).
  const qualificationKey = useMemo(
    () => JSON.stringify(qualificationData ?? {}),
    [qualificationData]
  );

  // Load GHL form embed script AFTER contact is created via API
  useEffect(() => {
    let cancelled = false;
    const script = document.createElement("script");
    script.src = BOOKING_CONFIG.ghlFormEmbedScript;
    script.type = "text/javascript";
    script.async = true;
    
    const initializeBooking = async () => {
      // Skip logging for personalized results page - lead was already captured during signup
      const isPersonalizationFlow = 
        window.location.pathname.startsWith('/results/') ||
        sourceData?.medium === 'personalization_flow';

      // Skip logging if lead was already captured via LeadCaptureChoice form
      const normalizedEmail = mergedLeadData.email?.toLowerCase().trim();
      const leadAlreadyCaptured = normalizedEmail 
        ? (() => {
            const submissionTime = localStorage.getItem(`alfred_lead_submitted_${normalizedEmail}`);
            if (!submissionTime) return false;
            return Date.now() - parseInt(submissionTime, 10) < 60 * 60 * 1000;
          })()
        : false;

      // Client-side duplicate prevention using sessionStorage
      const sessionKey = `ghl_booking_shown_${mergedLeadData.email}_${window.location.pathname}`;
      const hasLoggedThisSession = sessionStorage.getItem(sessionKey);

      let contactCreated = false;

      // Log submission FIRST (this creates the GHL contact with rich tags via our API)
      if (mergedLeadData.email && !isPersonalizationFlow && !hasLoggedThisSession && !leadAlreadyCaptured) {
        sessionStorage.setItem(sessionKey, Date.now().toString());
        console.log("📅 Logging booking_shown & creating GHL contact with rich tags...");
        
        const result = await logGHLSubmission({
          lead_email: mergedLeadData.email,
          lead_name: mergedLeadData.name,
          lead_phone: mergedLeadData.phone,
          lead_company: mergedLeadData.company,
          source_page: window.location.pathname,
          source_url: window.location.href,
          referrer: typeof document !== "undefined" ? document.referrer : "",
          source_medium: sourceData?.medium || "booking_modal",
          source_campaign: sourceData?.campaign,
          ghl_status: "booking_shown",
          qualification_data: qualificationData,
        });

        if (result.ghl_contact_id) {
          contactCreated = true;
          console.log("✅ GHL contact created with rich tags:", result.ghl_contact_id);
        }
      } else if (leadAlreadyCaptured) {
        console.log("📅 Skipping booking_shown - lead already captured via form");
        // Contact should already exist in GHL from the form submission
        contactCreated = true;
      }

      if (cancelled) return;

      // Load the calendar embed script immediately — no delay needed.
      // We no longer pre-create GHL contacts via API (that caused duplicates).
      // The calendar widget creates the contact on form submission,
      // and the webhook adds tags afterwards.
      document.body.appendChild(script);
      setCalendarReady(true);
      console.log("📅 Calendar widget loaded");
    };
    
    initializeBooking();

    return () => {
      cancelled = true;
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [mergedLeadData.email, mergedLeadData.name, mergedLeadData.phone, mergedLeadData.company, sourceData?.medium, sourceData?.campaign, qualificationKey]);

  // Track whether we've already logged a completion this mount to avoid double-firing.
  const completionLoggedRef = useRef(false);
  // Cache the contact details submitted inside the GHL iframe form-submit step,
  // so a booking completed by a visitor who had NO email in localStorage still
  // gets recorded on our side WITH attribution.
  const iframeInputsRef = useRef<{ email?: string; name?: string; phone?: string }>({});

  /**
   * Listen for the GHL LeadConnector iframe's completion event.
   *
   * The embedded booking iframe (origin https://api.leadconnectorhq.com) posts an
   * ARRAY message to the parent window:
   *   - form-submit:  event.data[2] is a JSON string with { full_name, email, phone, ... }
   *   - completion:   event.data[0] === 'msgsndr-booking-complete', data[1] = { calendarId }
   *
   * On completion we immediately log a `booking_shown` submission with full page
   * attribution. We deliberately use `booking_shown` (not a new status) because the
   * ghl-webhook confirmation matches ['submitted','booking_shown','synced'] by email
   * and UPGRADES that same row to `confirmed` — so there is NO duplicate. The
   * log-ghl-submission function also dedupes booking_shown by email within 1 hour,
   * so if an onLoad booking_shown row already exists this call is a no-op insert.
   */
  useEffect(() => {
    const GHL_ORIGIN = "https://api.leadconnectorhq.com";

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== GHL_ORIGIN) return;
      const data = event.data;
      if (!Array.isArray(data)) return;

      // 1. Cache form-submit inputs (contains the email typed into the GHL form).
      const inputJSON = data[2];
      if (typeof inputJSON === "string" && inputJSON.includes("email")) {
        try {
          const parsed = JSON.parse(inputJSON) as Record<string, string>;
          if (parsed?.email) {
            iframeInputsRef.current = {
              email: parsed.email,
              name: parsed.full_name || parsed.name,
              phone: parsed.phone,
            };
          }
        } catch {
          /* ignore malformed payloads */
        }
      }

      // 2. Booking completed inside the iframe.
      if (data[0] === "msgsndr-booking-complete") {
        if (completionLoggedRef.current) return;

        const calendarId = (data[1] && (data[1] as { calendarId?: string }).calendarId) || undefined;

        // Resolve the best email we have: iframe-typed > merged/localStorage.
        const email = (iframeInputsRef.current.email || mergedLeadData.email || "").trim();
        if (!email) {
          console.warn("📅 booking-complete received but no email available — webhook will still capture it");
          return;
        }

        completionLoggedRef.current = true;

        // Per-session guard so re-renders can't double-log the same completion.
        const completeKey = `ghl_booking_complete_${email.toLowerCase()}`;
        if (sessionStorage.getItem(completeKey)) return;
        sessionStorage.setItem(completeKey, Date.now().toString());

        const utm = getUTMData();
        console.log("📅 In-frame booking completed — logging with attribution", { email, calendarId });

        void logGHLSubmission({
          lead_email: email,
          lead_name: iframeInputsRef.current.name || mergedLeadData.name,
          lead_phone: iframeInputsRef.current.phone || mergedLeadData.phone,
          lead_company: mergedLeadData.company,
          source_page: window.location.pathname,
          source_url: window.location.href,
          referrer: typeof document !== "undefined" ? document.referrer : "",
          source_medium: sourceData?.medium || "booking_modal",
          source_campaign: sourceData?.campaign,
          lead_source: "calendar_widget",
          ghl_status: "booking_shown",
          qualification_data: qualificationData,
          utm_data: utm as Record<string, unknown>,
          ghl_response: {
            booking_completed_in_frame: true,
            calendar_id: calendarId,
            completed_at: new Date().toISOString(),
          },
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [
    mergedLeadData.email,
    mergedLeadData.name,
    mergedLeadData.phone,
    mergedLeadData.company,
    sourceData?.medium,
    sourceData?.campaign,
    qualificationKey,
  ]);



  const heightValue = typeof height === "number" ? `${height}px` : height;

  if (variant === "card") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative rounded-xl overflow-hidden border border-border bg-background shadow-lg",
          className
        )}
      >
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Book Your Call</h3>
              <p className="text-xs text-muted-foreground">
                Select a time that works for you
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 pt-3">
          {frameFailed && !frameLoaded && (
            <CalendarFallback bookingUrl={widgetUrl} onRetry={retryNow} />
          )}
          {!frameFailed && !frameLoaded && (
            <CalendarSkeleton height={heightValue} retrying={attempt > 0} />
          )}
          {/* sandbox is restored deliberately. `allow-same-origin` is REQUIRED:
              booking completion is detected by a postMessage from the widget whose
              event.origin we validate, and without it the frame's origin becomes
              null and that check fails. `allow-top-navigation-by-user-activation`
              lets a genuine post-booking redirect work while still blocking silent
              ones. This does NOT re-introduce the old blank-calendar bug — that was
              caused by the false-failure detection, which stays removed. */}
          <iframe
            key={attempt}
            src={widgetUrl}
            onLoad={handleFrameLoad}
            onError={handleFrameError}
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
            allow="payment; clipboard-write"
            style={{
              width: "100%",
              height: heightValue,
              border: "none",
              display: calendarReady && frameLoaded ? 'block' : 'none',
            }}
            title="Book a meeting"
          />
        </div>
      </motion.div>
    );
  }

  if (variant === "fullscreen") {
    return (
      <div className={cn("relative w-full h-full", className)}>
        {frameFailed && !frameLoaded && (
          <CalendarFallback bookingUrl={widgetUrl} onRetry={retryNow} />
        )}
        {!frameFailed && !frameLoaded && (
          <CalendarSkeleton height="100%" retrying={attempt > 0} />
        )}
        <iframe
          key={attempt}
          src={widgetUrl}
          onLoad={handleFrameLoad}
          onError={handleFrameError}
          sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
          allow="payment; clipboard-write"
          className="w-full h-full min-h-[500px] rounded-2xl shadow-sm border border-border/30"
          style={{
            backgroundColor: "white",
            display: calendarReady && frameLoaded ? 'block' : 'none',
            minHeight: '500px',
          }}
          title="Book a meeting"
        />
      </div>
    );
  }

  // Default inline variant
  return (
    <div className={cn("relative rounded-xl overflow-hidden border border-border bg-background", className)}>
      <div className="p-3">
        {frameFailed && !frameLoaded && (
          <CalendarFallback bookingUrl={widgetUrl} onRetry={retryNow} />
        )}
        {!frameFailed && !frameLoaded && (
          <CalendarSkeleton height={heightValue} retrying={attempt > 0} />
        )}
        <iframe
          key={attempt}
          src={widgetUrl}
          scrolling="no"
          onLoad={handleFrameLoad}
          onError={handleFrameError}
          sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
          allow="payment; clipboard-write"
          style={{
            width: "100%",
            height: heightValue,
            minHeight: "720px",
            border: "none",
            display: calendarReady && frameLoaded ? 'block' : 'none',
          }}
          title="Book a meeting"
        />
      </div>
    </div>
  );
});



interface GHLBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Lead data to pre-fill the booking form */
  leadData?: {
    name?: string;
    email?: string;
    company?: string;
    phone?: string;
  };
  /** Source tracking data for GHL attribution */
  sourceData?: LeadSourceData;
  /** Title for the modal */
  title?: string;
  /** Description for the modal */
  description?: string;
}

/**
 * Modal wrapper for the GHL booking widget
 * Use this when you need the booking widget in a dialog
 */
export function GHLBookingModal({
  isOpen,
  onClose,
  leadData,
  sourceData,
  title = "Book an Impact Conversation",
  description = "30-minute working session to explore how alfred ai can drive measurable outcomes for your organisation.",
}: GHLBookingModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] max-h-[800px] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 pb-3 shrink-0">
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pb-6">
          <GHLBookingWidget
            leadData={leadData}
            sourceData={sourceData}
            height={1000}
            variant="inline"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default GHLBookingWidget;
