import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, ghlFetch, requireAdmin, GHL_V3 } from "../_shared/ghlClient.ts";

/**
 * The calendar half of the GHL integration, which did not exist.
 *
 * Until now appointments were only ever read *through* a contact
 * (/contacts/{id}/appointments) — there was no way to see a booking's detail,
 * ask what times are actually free, or move one. Booking stayed entirely
 * inside GoHighLevel's own widget on the website and we just received the
 * result, which meant a reschedule request could only be handled by leaving
 * the admin panel.
 *
 * Actions (POST { action, ... }):
 *   get       { event_id }                       -> the appointment
 *   slots     { calendar_id, from, to, timezone? }-> free slots in a window
 *   reschedule{ event_id, start_time, end_time? } -> move an appointment
 *   cancel    { event_id }                        -> mark it cancelled
 *
 * Read-and-write, admin-only, fails soft with 200 + { success: false }.
 * Rescheduling is a real-world action — it emails the client from GHL — so it
 * is deliberately explicit rather than folded into a generic update.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (obj: unknown) =>
    new Response(JSON.stringify(obj), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const auth = await requireAdmin(req, supabase);
    if (!auth.ok) return json({ success: false, error: auth.error });

    const apiKey = Deno.env.get("GHL_API_KEY");
    if (!apiKey) return json({ success: false, error: "GHL_API_KEY missing" });

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "").trim();

    const fail = async (res: Response, what: string) => {
      const t = await res.text();
      console.error(`[ghl-appointments] ${what} ${res.status}`, t.slice(0, 200));
      return json({ success: false, error: `GHL ${what} ${res.status}` });
    };

    if (action === "get") {
      const eventId = String(body?.event_id || "").trim();
      if (!eventId) return json({ success: false, error: "Missing event_id" });
      const res = await ghlFetch(`/calendars/events/appointments/${eventId}`, {
        apiKey,
        version: GHL_V3,
      });
      if (!res.ok) return fail(res, "GET appointment");
      const parsed: any = await res.json().catch(() => ({}));
      return json({ success: true, appointment: parsed?.event ?? parsed?.appointment ?? parsed });
    }

    if (action === "slots") {
      const calendarId = String(body?.calendar_id || "").trim();
      if (!calendarId) return json({ success: false, error: "Missing calendar_id" });
      // GHL wants epoch milliseconds. Default to the next 14 days, which is the
      // window a human actually offers when rescheduling.
      const from = Number(body?.from) || Date.now();
      const to = Number(body?.to) || from + 14 * 24 * 60 * 60 * 1000;
      const qs = new URLSearchParams({ startDate: String(from), endDate: String(to) });
      if (body?.timezone) qs.set("timezone", String(body.timezone));
      const res = await ghlFetch(`/calendars/${calendarId}/free-slots?${qs.toString()}`, {
        apiKey,
        version: GHL_V3,
      });
      if (!res.ok) return fail(res, "GET free-slots");
      const parsed: any = await res.json().catch(() => ({}));
      // The payload is keyed by date, each with a `slots` array. Flatten it so
      // the caller gets one ordered list instead of re-deriving the shape.
      const slots: string[] = [];
      for (const [key, value] of Object.entries(parsed ?? {})) {
        if (key === "traceId") continue;
        const arr = (value as any)?.slots;
        if (Array.isArray(arr)) slots.push(...arr.map(String));
      }
      slots.sort();
      return json({ success: true, slots, raw: parsed });
    }

    if (action === "reschedule") {
      const eventId = String(body?.event_id || "").trim();
      const startTime = String(body?.start_time || "").trim();
      if (!eventId || !startTime) {
        return json({ success: false, error: "Missing event_id or start_time" });
      }
      const payload: Record<string, unknown> = { startTime };
      if (body?.end_time) payload.endTime = String(body.end_time);
      const res = await ghlFetch(`/calendars/events/appointments/${eventId}`, {
        apiKey,
        method: "PUT",
        body: payload,
        version: GHL_V3,
      });
      if (!res.ok) return fail(res, "PUT appointment");
      const parsed: any = await res.json().catch(() => ({}));
      return json({ success: true, appointment: parsed?.event ?? parsed?.appointment ?? parsed });
    }

    if (action === "cancel") {
      const eventId = String(body?.event_id || "").trim();
      if (!eventId) return json({ success: false, error: "Missing event_id" });
      const res = await ghlFetch(`/calendars/events/appointments/${eventId}`, {
        apiKey,
        method: "PUT",
        body: { appointmentStatus: "cancelled" },
        version: GHL_V3,
      });
      if (!res.ok) return fail(res, "PUT appointment (cancel)");
      return json({ success: true });
    }

    return json({
      success: false,
      error: `Unknown action "${action}". Expected get, slots, reschedule or cancel.`,
    });
  } catch (err) {
    console.error("[ghl-appointments] error", err);
    return json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});
