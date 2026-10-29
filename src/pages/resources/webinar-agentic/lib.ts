// Lightweight analytics + calendar helpers for the webinar landing page.

export type WebinarEvent =
  | "page_view"
  | "hero_cta_click"
  | "agenda_cta_click"
  | "form_start"
  | "form_submit"
  | "add_to_calendar_click"
  | "opportunity_review_click";

export function trackWebinar(event: WebinarEvent, payload: Record<string, unknown> = {}) {
  try {
    const data = { event: `webinar_${event}`, ...payload };
    // GTM / dataLayer (no-op safe)
    (window as unknown as { dataLayer?: unknown[] }).dataLayer?.push?.(data);
    if (import.meta.env.DEV) console.debug("[webinar-analytics]", data);
  } catch {
    /* analytics must never break the page */
  }
}

export function smoothScrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function toICSDate(iso: string): string {
  // Convert ISO to UTC basic format YYYYMMDDTHHMMSSZ
  const d = new Date(iso);
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function downloadICS(opts: {
  title: string;
  description: string;
  startISO: string;
  endISO: string;
  url: string;
}) {
  const uid = `webinar-${Date.now()}@alfredai.bot`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//alfred ai//Webinar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toICSDate(new Date().toISOString())}`,
    `DTSTART:${toICSDate(opts.startISO)}`,
    `DTEND:${toICSDate(opts.endISO)}`,
    `SUMMARY:${escapeICS(opts.title)}`,
    `DESCRIPTION:${escapeICS(opts.description)}`,
    `URL:${opts.url}`,
    `LOCATION:${escapeICS(opts.url)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = "ai-for-smes-webinar.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
}

function escapeICS(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
