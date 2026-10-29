import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { GHL_PIPELINES } from "../_shared/config.ts";
import { ensureOpportunity } from "../_shared/ghlOpportunity.ts";
import { GHL_V3 } from "../_shared/ghlClient.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-ghl-signature',
};

interface QualificationData {
  role?: string;
  industry?: string;
  challenge?: string;
  size?: string;
  timeline?: string;
}

/**
 * Extract meeting link from text (location/address fields)
 */
function extractMeetLinkFromText(text: string | null | undefined): string | null {
  if (!text) return null;
  const meetMatch = text.match(/https:\/\/meet\.google\.com\/[a-z\-]+/i);
  if (meetMatch) return meetMatch[0];
  const zoomMatch = text.match(/https:\/\/[a-z0-9\-]*\.?zoom\.us\/[^\s]+/i);
  if (zoomMatch) return zoomMatch[0];
  if (text.startsWith('https://')) return text;
  return null;
}

/**
 * Log meeting history for tracking all status changes
 */
async function logMeetingHistory(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  params: {
    meetingId: string;
    meetingType: 'demo' | 'investor';
    previousStatus?: string;
    newStatus: string;
    eventType: string;
    notes?: string;
    appointmentId?: string;
    webhookPayload?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    // deno-lint-ignore no-explicit-any
    const { error } = await (supabase as any)
      .from('meeting_history')
      .insert({
        meeting_id: params.meetingId,
        meeting_type: params.meetingType,
        previous_status: params.previousStatus || null,
        new_status: params.newStatus,
        event_type: params.eventType,
        notes: params.notes || null,
        appointment_id: params.appointmentId || null,
        webhook_payload: params.webhookPayload || null,
        created_by: null,
      });

    if (error) {
      console.error('Failed to log meeting history:', error);
    } else {
      console.log('Meeting history logged:', params.eventType, params.newStatus);
    }
  } catch (err) {
    console.error('Error logging meeting history:', err);
  }
}

/**
 * Find existing submission by appointment_id to prevent duplicates
 */
async function findByAppointmentId(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  appointmentId: string
): Promise<{ id: string; ghl_status: string; ghl_response: Record<string, unknown> | null } | null> {
  try {
    // deno-lint-ignore no-explicit-any
    const { data, error } = await (supabase as any)
      .from('ghl_submissions')
      .select('id, ghl_status, ghl_response')
      .filter('ghl_response->>appointment_id', 'eq', appointmentId)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error finding by appointment_id:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Exception finding by appointment_id:', err);
    return null;
  }
}

// Tags to remove when status changes
const STATUS_EXCLUSIVE_TAGS = [
  'Demo Booked',
  'Impact Conversation Booking',
  'Booking Confirmed',
  'Booking Cancelled',
  'Booking Rescheduled',
];

/**
 * Add/remove tags and update custom fields on a GHL contact
 * Handles tag transitions (e.g., removing "Demo Booked" when cancelled)
 */
async function updateGHLContactWithQualification(
  email: string,
  tagsToAdd: string[],
  tagsToRemove: string[],
  qualificationData: QualificationData | null,
  apiKey: string,
  locationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Updating GHL contact ${email} - Add tags:`, tagsToAdd, 'Remove tags:', tagsToRemove);

    // First, search for the contact by email using the correct GHL v2 endpoint
    const searchResponse = await fetch(
      `https://services.leadconnectorhq.com/contacts/?locationId=${locationId}&query=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Version': GHL_V3,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('GHL contact search failed:', searchResponse.status, errorText);
      return { success: false, error: `Contact search failed: ${searchResponse.status}` };
    }

    const searchData = await searchResponse.json();
    const contacts = searchData.contacts || [];
    
    // Find exact email match
    const contact = contacts.find((c: { email?: string }) => 
      c.email?.toLowerCase() === email.toLowerCase()
    );

    if (!contact) {
      console.log(`Contact not found in GHL for email: ${email}`);
      return { success: false, error: 'Contact not found in GHL' };
    }

    console.log(`Found GHL contact ID: ${contact.id}, existing tags:`, contact.tags);

    // Process tags: remove old status tags, then add new ones
    const existingTags: string[] = contact.tags || [];
    const tagsToRemoveNormalized = tagsToRemove.map(t => t.toLowerCase().trim());
    
    // Filter out tags to remove (case-insensitive)
    const filteredTags = existingTags.filter((tag: string) => 
      !tagsToRemoveNormalized.includes(tag.toLowerCase().trim())
    );
    
    // Add new tags
    const mergedTags = [...new Set([...filteredTags, ...tagsToAdd])];
    
    console.log('Final tags after processing:', mergedTags);

    // Build custom field mappings for qualification data
    const customFieldMappings: Record<string, string>[] = [];
    if (qualificationData?.industry) {
      customFieldMappings.push({ key: 'industry', field_value: qualificationData.industry });
    }
    if (qualificationData?.size) {
      customFieldMappings.push({ key: 'team_size', field_value: qualificationData.size });
    }
    if (qualificationData?.timeline) {
      customFieldMappings.push({ key: 'timeline', field_value: qualificationData.timeline });
    }
    if (qualificationData?.role) {
      customFieldMappings.push({ key: 'role', field_value: qualificationData.role });
    }
    if (qualificationData?.challenge) {
      customFieldMappings.push({ key: 'primary_challenge', field_value: qualificationData.challenge });
    }

    // Update the contact with new tags and custom fields
    const updatePayload: Record<string, unknown> = {
      tags: mergedTags,
    };
    
    if (customFieldMappings.length > 0) {
      updatePayload.customFields = customFieldMappings;
    }

    const updateResponse = await fetch(
      `https://services.leadconnectorhq.com/contacts/${contact.id}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Version': GHL_V3,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('GHL update failed:', updateResponse.status, errorText);
      return { success: false, error: `Update failed: ${updateResponse.status}` };
    }

    console.log(`Successfully updated contact ${contact.id} - added tags:`, tagsToAdd, 'removed tags:', tagsToRemove);
    
    // Add qualification notes if we have data (only on initial booking, not cancellations)
    if (qualificationData && !tagsToRemove.some(t => t.toLowerCase().includes('cancel'))) {
      if (qualificationData.role || qualificationData.industry || qualificationData.challenge) {
        try {
          const noteParts: string[] = [];
          if (qualificationData.role) noteParts.push(`Role: ${qualificationData.role}`);
          if (qualificationData.industry) noteParts.push(`Industry: ${qualificationData.industry}`);
          if (qualificationData.challenge) noteParts.push(`Challenge: ${qualificationData.challenge}`);
          if (qualificationData.size) noteParts.push(`Team Size: ${qualificationData.size}`);
          if (qualificationData.timeline) noteParts.push(`Timeline: ${qualificationData.timeline}`);
          
          const noteBody = `[AlfredAI Qualification - Demo Booked]\n${noteParts.join('\n')}\nBooked at: ${new Date().toISOString()}`;
          
          const notesResponse = await fetch(
            `https://services.leadconnectorhq.com/contacts/${contact.id}/notes`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Version': GHL_V3,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ body: noteBody }),
            }
          );
          
          if (notesResponse.ok) {
            console.log(`Added qualification notes to contact ${contact.id}`);
          } else {
            console.warn(`Failed to add notes:`, await notesResponse.text());
          }
        } catch (noteError) {
          console.warn('Error adding notes:', noteError);
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating GHL contact:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Handle contact deletion - mark records as deleted in our database
 */
async function handleContactDeletion(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  email: string,
  contactId: string | null,
  payload: Record<string, unknown>
): Promise<{ success: boolean; deletedCount: number; leadsUpdated: number; error?: string }> {
  try {
    console.log(`Processing contact deletion for email: ${email}, contactId: ${contactId}`);

    const normalizedEmail = email.toLowerCase().trim();
    
    // Update ghl_submissions table
    // deno-lint-ignore no-explicit-any
    const { data: submissions, error: submissionError } = await (supabase as any)
      .from('ghl_submissions')
      .update({
        ghl_status: 'deleted_from_ghl',
        ghl_response: {
          deleted_at: new Date().toISOString(),
          deleted_contact_id: contactId,
          deletion_payload: payload,
        },
      })
      .ilike('lead_email', normalizedEmail)
      .select('id');

    if (submissionError) {
      console.error('Error updating submissions for deletion:', submissionError);
      return { success: false, deletedCount: 0, leadsUpdated: 0, error: submissionError.message };
    }

    const deletedCount = submissions?.length || 0;
    console.log(`Marked ${deletedCount} submissions as deleted`);

    // Also update the leads table if records exist there
    // deno-lint-ignore no-explicit-any
    const { data: leadsUpdated, error: leadsError } = await (supabase as any)
      .from('leads')
      .update({
        lead_type: 'deleted_from_ghl',
      })
      .ilike('email', normalizedEmail)
      .select('id');

    if (leadsError) {
      console.error('Error updating leads for deletion:', leadsError);
    } else {
      console.log(`Marked ${leadsUpdated?.length || 0} leads as deleted`);
    }

    // Log history for each deleted submission
    for (const submission of (submissions || [])) {
      await logMeetingHistory(supabase, {
        meetingId: submission.id,
        meetingType: 'demo',
        previousStatus: undefined,
        newStatus: 'deleted_from_ghl',
        eventType: 'cancelled',
        notes: 'Contact deleted from GHL',
        webhookPayload: payload,
      });
    }

    // Also update ghl_sync_history
    if (contactId) {
      // deno-lint-ignore no-explicit-any
      await (supabase as any)
        .from('ghl_sync_history')
        .update({
          sync_status: 'deleted_from_ghl',
          error_message: `Contact deleted from GHL at ${new Date().toISOString()}`,
        })
        .eq('ghl_contact_id', contactId);
    }

    return { success: true, deletedCount, leadsUpdated: leadsUpdated?.length || 0 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error handling contact deletion:', errorMessage);
    return { success: false, deletedCount: 0, leadsUpdated: 0, error: errorMessage };
  }
}

/**
 * Is this failure worth GoHighLevel sending the event again?
 *
 * Deliberately a short allow-list rather than a deny-list. An unrecognised
 * error is treated as permanent, because the cost of the two mistakes is not
 * symmetric: refusing to retry a transient fault loses ONE event, while
 * retrying a permanent fault loops forever.
 */
function isTransient(message: string): boolean {
  const m = message.toLowerCase();
  return [
    'fetch failed',
    'network',
    'timeout',
    'timed out',
    'etimedout',
    'econnreset',
    'econnrefused',
    'socket hang up',
    'terminating connection',
    'connection terminated',
    'too many connections',
    'server is starting up',
    'deadlock detected',
    'service unavailable',
    '503',
    '504',
  ].some((needle) => m.includes(needle));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = Date.now();
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Lightweight logger to webhook_logs so ingestion is observable going forward.
  // status: received | processed | rejected | matched | error
  const logClient = createClient(supabaseUrl, supabaseServiceKey);
  let lastLogFailure: string | null = null;
  const logWebhook = async (
    status: string,
    httpStatus: number,
    message: string,
    extra?: { leadEmail?: string | null; errorMessage?: string | null; meta?: Record<string, unknown> },
  ) => {
    try {
      await logClient.from('webhook_logs').insert({
        function_name: 'ghl-webhook',
        request_method: req.method,
        status,
        http_status: httpStatus,
        lead_email: extra?.leadEmail ?? null,
        message,
        error_message: extra?.errorMessage ?? null,
        duration_ms: Date.now() - startedAt,
        meta: extra?.meta ?? null,
      });
    } catch (e) {
      // This swallowed the only evidence for two weeks. A delivery refused for a
      // bad signature called logWebhook and no row ever appeared, and because
      // the failure went to console and nowhere else, the app showed nothing at
      // all — not an error, not a rejection, nothing. Kept non-throwing on
      // purpose (a logging fault must not become an ingestion fault) but the
      // reason is recorded so the next look has something to read.
      lastLogFailure = e instanceof Error ? e.message : String(e);
      console.error('Failed to write webhook_logs:', lastLogFailure, '| status was:', status);
    }
  };

  try {
    const ghlApiKey = Deno.env.get('GHL_API_KEY');
    const ghlLocationId = Deno.env.get('GHL_LOCATION_ID');

    // EVERY DELIVERY IS RECORDED BEFORE IT CAN BE REFUSED.
    //
    // The signature check below rejects with 401 and calls logWebhook on its way
    // out — and that row has never once appeared. Three probes on 26 Aug and
    // another on 6 Sep against a deployment since PROVEN to be current: 401 every
    // time, not one row. webhook_logs has no rejected row since 19 Aug.
    //
    // The consequence is the whole point. If GoHighLevel's signature is ever
    // wrong — a workflow re-saved, a secret rotated — every booking is refused
    // and NOTHING anywhere says so. The submissions page stays quiet, the
    // Rejected & errors toggle stays empty, and the first sign is somebody
    // asking why nobody has booked this week.
    //
    // So arrival is recorded first, unconditionally, before any decision is made
    // about the request. Whatever is wrong with the rejection path, a delivery
    // can no longer vanish between GoHighLevel and this table.
    await logWebhook('arrived', 202, 'Delivery arrived', {
      meta: {
        stage: 'pre-auth',
        has_signature: Boolean(
          req.headers.get('x-ghl-signature') ?? req.headers.get('x-webhook-secret'),
        ),
      },
    });

    // Authenticate the webhook with a shared secret when one is configured.
    // NON-BREAKING: if GHL_WEBHOOK_SECRET is unset, we log a warning and process
    // the event anyway (GHL's outbound webhook cannot be blocked by a missing
    // secret on our side). When the secret IS set, verify it and reject mismatches.
    const webhookSecret = Deno.env.get('GHL_WEBHOOK_SECRET');
    const url = new URL(req.url);
    if (!webhookSecret) {
      console.warn('GHL_WEBHOOK_SECRET not configured - processing without signature verification');
    } else {
      const providedSecret = req.headers.get('x-ghl-signature')
        ?? req.headers.get('x-webhook-secret')
        ?? url.searchParams.get('secret');
      if (providedSecret !== webhookSecret) {
        console.error('Invalid or missing GHL webhook secret');
        await logWebhook('rejected', 401, 'Invalid or missing GHL webhook secret');
        // Only on a request we are already refusing, and only the reason the
        // LOG failed — never anything about the payload. This is the shortest
        // path to why that row goes missing, and a refused request is by
        // definition not GoHighLevel.
        return new Response(JSON.stringify({ error: 'Unauthorized', logError: lastLogFailure }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);


    // Parse the webhook payload
    const payload = await req.json();
    console.log('GHL Webhook received:', JSON.stringify(payload, null, 2));


    // WHAT ACTUALLY ARRIVES HERE — established 26 Aug from the shape log rather
    // than assumed.
    //
    // 504 of 507 deliveries logged as "unknown". They are not unknown and they
    // are not malformed: they are GoHighLevel WORKFLOW webhooks, sent by the
    // "Custom Webhook" action, which posts the contact's merge fields FLAT with
    // no envelope and no type key at all. The shape log proved it — every
    // top-level key a custom field label ("Primary Product Interest", "Meeting
    // Outcome", "Annual Turnover") — and the submissions built from them carry
    // appointment_id, calendar_name, start_time and a meet link. Appointments,
    // arriving with no word for what happened to them.
    //
    // That mattered far more than a wrong label in a log. newStatus below starts
    // at 'confirmed' and only moves if the type string says cancelled or
    // rescheduled, so with no type key EVERY one of these was written as a
    // confirmation. Five cancellations are on record and the most recent is
    // 25 June — two months, 602 confirmed bookings, not one cancellation, which
    // is not how anybody's calendar behaves.
    //
    // So the type is derived from the payload when the envelope carries none,
    // and an indeterminate event is never allowed to assert 'confirmed' over a
    // status that was recorded from something that actually said so.
    const typeFromEnvelope = payload.type || payload.event_type || payload.eventType || null;

    const contact = payload.contact || payload.data?.contact || payload.data || {};
    const appointment = payload.appointment || payload.data?.appointment || {};
    const calendar = payload.calendar || payload.data?.calendar || {};

    // A flat merge field, found by name regardless of how GoHighLevel cased or
    // spaced the label it was given in the workflow builder.
    const flatKey = (want: string): string | undefined =>
      Object.keys(payload ?? {}).find(
        (k) => k.toLowerCase().replace(/[^a-z]/g, '') === want,
      );
    const flatValue = (want: string): string | null => {
      const k = flatKey(want);
      const v = k ? payload[k] : null;
      return typeof v === 'string' && v.trim() ? v.trim() : null;
    };

    // The status this event carries, if it carries one — checked in the three
    // places GoHighLevel puts it: the appointment object, the calendar object,
    // and a flat merge field.
    const appointmentStatus =
      appointment.status ||
      appointment.appointmentStatus ||
      calendar.status ||
      calendar.appointmentStatus ||
      flatValue('appointmentstatus') ||
      null;

    // Does this payload describe an appointment at all? Key names only, which is
    // the same question the shape log was added to answer.
    const looksLikeAppointment = Boolean(
      appointment.id || appointment.startTime || appointment.start_time ||
      calendar.appointmentId || calendar.id || calendar.startTime ||
      flatKey('appointmentid') || flatKey('appointmentstarttime'),
    );

    const rawEventType =
      typeFromEnvelope ||
      (appointmentStatus ? `appointment.${String(appointmentStatus)}` : null) ||
      (looksLikeAppointment ? 'appointment.unspecified' : 'unknown');

    // True when NOTHING in the payload said what happened. Used below to stop a
    // guess overwriting a status that came from something that did.
    const eventIsIndeterminate = !typeFromEnvelope && !appointmentStatus;

    const eventType = String(rawEventType).toLowerCase();
    console.log(
      `Event type: ${rawEventType} (envelope: ${typeFromEnvelope ?? 'none'}, ` +
      `appointment status: ${appointmentStatus ?? 'none'}, indeterminate: ${eventIsIndeterminate})`,
    );

    // Record the SHAPE whenever the envelope carried no type — never the
    // payload. Top-level key names, and the key names one level into `data`.
    // Names only, no values, so this stays clear of contact details while still
    // answering the one question: what is the type field called.
    //
    // NO LONGER CAPPED AT 40. That cap is why this took six days to answer: the
    // first 40 keys were all custom field labels, and whatever followed them —
    // including any status field — was cut off unseen.
    const shapeOnUnknown = !typeFromEnvelope
      ? {
          top_level_keys: Object.keys(payload ?? {}),
          data_keys: payload?.data && typeof payload.data === 'object'
            ? Object.keys(payload.data)
            : null,
          appointment_status: appointmentStatus ?? null,
          indeterminate: eventIsIndeterminate,
        }
      : null;

    // Try multiple paths to find email
    const email = contact.email || payload.email || payload.data?.email || 
      contact.primaryEmail || payload.primaryEmail || payload.data?.primaryEmail;

    await logWebhook('received', 200, `Received ${rawEventType}`, {
      leadEmail: email ?? null,
      meta: { event_type: rawEventType, ...(shapeOnUnknown ?? {}) },
    });
    
    if (!email) {
      console.log('No email found in webhook payload');
      await logWebhook('rejected', 400, 'No email in payload', { meta: { event_type: rawEventType } });
      return new Response(
        JSON.stringify({ success: false, error: 'No email in payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${rawEventType} for email: ${email}`);


    // Handle contact deletion events
    const isDeleteEvent = 
      eventType.includes('contact.delete') || 
      eventType.includes('contactdelete') ||
      eventType.includes('contact_delete') ||
      eventType === 'delete' ||
      eventType.includes('deleted') ||
      rawEventType === 'ContactDelete' ||
      rawEventType === 'contactDeleted' ||
      rawEventType === 'contact.deleted';
      
    if (isDeleteEvent) {
      console.log(`Detected deletion event for ${email}`);
      const contactId = contact.id || payload.contactId || payload.data?.contactId || null;
      const deletionResult = await handleContactDeletion(supabase, email, contactId, payload);
      
      return new Response(
        JSON.stringify({ 
          success: deletionResult.success, 
          message: `Processed contact deletion for ${email}`,
          deletedCount: deletionResult.deletedCount,
        }),
        // Same reasoning as the catch below: a deletion we cannot apply will
        // not start applying on the third delivery, so don't ask for one.
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // WHAT GOHIGHLEVEL ACTUALLY SENDS, now that we can see it.
    //
    // Until 26 Aug this was a substring guess over a string that was always
    // 'unknown', so every branch missed and the initial 'confirmed' stood —
    // which is how two months of bookings were recorded without a single
    // cancellation. Deriving the type from the payload fixed that, and removing
    // the 40-key cap on the shape log answered the question underneath it:
    // these payloads carry 75 top-level keys and an appointment status is one
    // of them. It sat at key 41 or later. The cap WAS the six-day mystery.
    //
    // All 26 deliveries since carry status "booked", so the fix is working and
    // "no cancellations since June" is now a fact rather than a silence.
    //
    // But seeing the status exposed the next fault, which is the same one in a
    // smaller costume: includes('appointment') below matches appointment.noshow
    // and appointment.showed just as happily as appointment.booked, so a no-show
    // would have been written as a confirmation. So the status is MAPPED, and
    // the substring chain is demoted to a fallback for envelope-typed events —
    // the v3 webhook that sent appointment.scheduled once, in July.
    //
    // Tags for showed and noshow are deliberately left empty. Changing a
    // contact's status in our own records is a repair; inventing two new tags
    // in the CRM is a decision, and not mine to make unasked.
    const APPOINTMENT_STATUS_MAP: Record<string, {
      status: string; add: string[]; remove: string[]; history: string;
    }> = {
      booked:    { status: 'confirmed', add: ['Demo Booked', 'Impact Conversation Booking'], remove: ['Booking Cancelled', 'Booking Rescheduled'], history: 'confirmed' },
      new:       { status: 'confirmed', add: ['Demo Booked', 'Impact Conversation Booking'], remove: ['Booking Cancelled', 'Booking Rescheduled'], history: 'confirmed' },
      confirmed: { status: 'confirmed', add: ['Demo Booked', 'Impact Conversation Booking'], remove: ['Booking Cancelled', 'Booking Rescheduled'], history: 'confirmed' },
      cancelled: { status: 'cancelled', add: ['Booking Cancelled'], remove: ['Demo Booked', 'Impact Conversation Booking', 'Booking Confirmed', 'Booking Rescheduled'], history: 'cancelled' },
      canceled:  { status: 'cancelled', add: ['Booking Cancelled'], remove: ['Demo Booked', 'Impact Conversation Booking', 'Booking Confirmed', 'Booking Rescheduled'], history: 'cancelled' },
      rescheduled: { status: 'rescheduled', add: ['Booking Rescheduled'], remove: ['Booking Cancelled'], history: 'rescheduled' },
      // history is 'completed', NOT 'showed'. meeting_history.event_type has a
      // CHECK allowing created/confirmed/cancelled/rescheduled/no_show/
      // completed/note_added/updated — 'showed' is not in it, so every attended
      // meeting failed its history insert and went to console.error only. The
      // status column and the history column are two different vocabularies and
      // I had written the GoHighLevel word into both.
      showed:    { status: 'completed', add: [], remove: [], history: 'completed' },
      noshow:    { status: 'no_show',   add: [], remove: [], history: 'no_show' },
    };

    let newStatus = 'confirmed';
    let statusTags: string[] = [];
    let tagsToRemove: string[] = [];
    let historyEventType = 'updated';

    // GoHighLevel title-cases and spaces its labels freely, so compare on
    // letters alone — the same reason the flat-key lookup above does.
    const normalisedApptStatus = appointmentStatus
      ? String(appointmentStatus).toLowerCase().replace(/[^a-z]/g, '')
      : null;
    const mappedStatus = normalisedApptStatus
      ? APPOINTMENT_STATUS_MAP[normalisedApptStatus]
      : undefined;

    // A status we were TOLD but do not recognise is not good news by default.
    // It is treated exactly like an event that said nothing: recorded, never
    // asserted over an existing status.
    const unrecognisedApptStatus = Boolean(normalisedApptStatus && !mappedStatus);

    if (mappedStatus) {
      newStatus = mappedStatus.status;
      statusTags = mappedStatus.add;
      tagsToRemove = mappedStatus.remove;
      historyEventType = mappedStatus.history;
    } else if (unrecognisedApptStatus) {
      console.warn(
        `Unrecognised appointment status "${appointmentStatus}" — treated as indeterminate ` +
        `rather than assumed confirmed. Add it to APPOINTMENT_STATUS_MAP.`,
      );
    } else if (eventType.includes('cancelled') || eventType.includes('cancel')) {
      newStatus = 'cancelled';
      statusTags = ['Booking Cancelled'];
      // Remove booking confirmation tags when cancelled
      tagsToRemove = ['Demo Booked', 'Impact Conversation Booking', 'Booking Confirmed', 'Booking Rescheduled'];
      historyEventType = 'cancelled';
    } else if (eventType.includes('rescheduled') || eventType.includes('reschedule')) {
      newStatus = 'rescheduled';
      statusTags = ['Booking Rescheduled'];
      // Keep Demo Booked but remove Cancelled if they rebook
      tagsToRemove = ['Booking Cancelled'];
      historyEventType = 'rescheduled';
    } else if (eventType.includes('appointment') || eventType.includes('booking') || eventType.includes('create')) {
      newStatus = 'confirmed';
      statusTags = ['Demo Booked', 'Impact Conversation Booking'];
      // Remove any cancellation/reschedule tags when confirmed
      tagsToRemove = ['Booking Cancelled', 'Booking Rescheduled'];
      historyEventType = 'confirmed';
    }

    // Extract contact info from webhook
    const contactId = payload.contact_id || contact.id || payload.contactId || null;
    const contactFirstName = payload.first_name || contact.firstName || contact.first_name || null;
    const contactLastName = payload.last_name || contact.lastName || contact.last_name || null;
    const contactFullName = payload.full_name || contact.name || null;
    const contactName = contactFirstName && contactLastName 
      ? `${contactFirstName} ${contactLastName}` 
      : (contactFullName || contactFirstName || null);
    const contactCompany = contact.company || contact.companyName || payload.data?.company || null;
    const contactPhone = payload.phone || contact.phone || null;
    const contactWebsite = payload["Business Website"] || contact.website || null;
    const ghlEmail = (payload.email || contact.email || email).toLowerCase();
    
    // Extract calendar/appointment data
    const calendarData = calendar;
    const appointmentId = calendarData.appointmentId || calendarData.id || appointment.id || null;
    const startTime = calendarData.startTime || appointment.startTime || appointment.start_time || null;
    const endTime = calendarData.endTime || appointment.endTime || appointment.end_time || null;
    const calendarName = calendarData.calendarName || appointment.calendarName || appointment.calendar_name || null;
    // Extract appointment title - GHL uses 'title', 'name', or falls back to calendarName
    const appointmentTitle = calendarData.title || appointment.title || appointment.name || calendarData.calendarName || calendarName || null;
    
    // Extract meeting link from various possible fields in the webhook
    const meetLink = 
      appointment.meetingUrl ||
      appointment.meetUrl ||
      appointment.googleMeetLink ||
      appointment.google_meet_link ||
      appointment.zoomLink ||
      appointment.zoom_link ||
      appointment.conferenceUrl ||
      appointment.locationUrl ||
      appointment.address ||
      appointment.location ||
      calendarData.meetingUrl ||
      calendarData.meetLink ||
      calendarData.address ||
      payload.meetingUrl ||
      payload.meetLink ||
      extractMeetLinkFromText(appointment.address) ||
      extractMeetLinkFromText(appointment.location) ||
      null;

    // ---------------------------------------------------------------------------
    // Attribution — where the contact came from BEFORE booking.
    // GHL stores this on the contact as attributionSource (first touch) and
    // lastAttributionSource (most recent touch). We prefer the last touch since
    // that's the session in which they actually booked.
    // ---------------------------------------------------------------------------
    // deno-lint-ignore no-explicit-any
    const firstAttr: any = contact.attributionSource || payload.attributionSource || {};
    // deno-lint-ignore no-explicit-any
    const lastAttr: any = contact.lastAttributionSource || payload.lastAttributionSource || firstAttr;
    const attributionUrl =
      lastAttr?.url || lastAttr?.pageUrl || lastAttr?.landingPage ||
      firstAttr?.url || firstAttr?.pageUrl || firstAttr?.landingPage || null;
    const attributionReferrer =
      lastAttr?.referrer || lastAttr?.sessionSource || lastAttr?.utmSource ||
      firstAttr?.referrer || firstAttr?.sessionSource || firstAttr?.utmSource || null;

    console.log('Extracted data:', {
      contactId,
      contactName,
      ghlEmail,
      appointmentId,
      startTime,
      meetLink,
    });

    // Build tags for this event
    const eventTags: string[] = [...statusTags, 'AlfredAI Website'];

    // DUPLICATE PREVENTION: First try to find by appointment_id
    let existingSubmission: { id: string; ghl_status: string; ghl_response: Record<string, unknown> | null } | null = null;
    
    if (appointmentId) {
      existingSubmission = await findByAppointmentId(supabase, appointmentId);
      if (existingSubmission) {
        console.log('Found existing submission by appointment_id:', existingSubmission.id);
      }
    }

    // Next, match by GHL contact id — the most reliable person identifier and
    // resilient to abandoned/expired states. This ensures a completion merges
    // into the SAME person's earlier row (incl. booking_abandoned) instead of
    // inserting a duplicate confirmed record.
    if (!existingSubmission && contactId) {
      const { data: byContact } = await supabase
        .from('ghl_submissions')
        .select('id, ghl_status, ghl_response')
        .eq('ghl_response->>ghl_contact_id', contactId)

        .not('ghl_status', 'in', '("cancelled")')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (byContact) {
        existingSubmission = byContact;
        console.log('Found existing submission by ghl_contact_id:', existingSubmission!.id);
      }
    }

    // If not found by appointment_id/contact, try by email with open/pending statuses.
    // Include 'booking_abandoned' so a later completion upgrades the abandoned row
    // instead of creating a new duplicate. Include 'synced' because booking_modal
    // records get synced before the calendar webhook fires.
    if (!existingSubmission) {
      const { data: pendingSubmission } = await supabase
        .from('ghl_submissions')
        .select('id, ghl_status, ghl_response')
        .ilike('lead_email', email)
        .in('ghl_status', ['submitted', 'booking_shown', 'booking_abandoned', 'synced'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pendingSubmission) {
        existingSubmission = pendingSubmission;
        console.log('Found pending/abandoned/synced submission by email:', existingSubmission!.id);
      }
    }


    // If still not found, check for any recent booking_modal submission (within 10 minutes)
    // This catches cases where status was updated to something unexpected
    if (!existingSubmission) {
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: recentBookingModal } = await supabase
        .from('ghl_submissions')
        .select('id, ghl_status, ghl_response')
        .ilike('lead_email', email)
        .in('source_medium', ['booking_modal', 'lead_chatbot'])
        .gte('created_at', tenMinAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentBookingModal) {
        existingSubmission = recentBookingModal;
        console.log('Found recent booking_modal submission by email:', existingSubmission!.id);
      }
    }

    // If still not found, check for recently confirmed submissions with same email (within 30 minutes)
    if (!existingSubmission) {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: recentSubmission } = await supabase
        .from('ghl_submissions')
        .select('id, ghl_status, ghl_response')
        .ilike('lead_email', email)
        .in('ghl_status', ['confirmed', 'rescheduled'])
        .gte('created_at', thirtyMinAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentSubmission) {
        existingSubmission = recentSubmission;
        console.log('Found recent submission (preventing duplicate):', existingSubmission!.id);
      }
    }

    let submissionId: string;
    const previousStatus = existingSubmission?.ghl_status;

    // A GUESS MUST NOT OVERWRITE A FACT.
    //
    // When the payload said nothing about what happened, 'confirmed' above is
    // an assumption, not a reading. It is the right assumption for a brand-new
    // booking and it has been right hundreds of times — but applied to a row
    // that already says cancelled or completed, it silently un-cancels a
    // meeting, and the only trace is a status quietly moving backwards.
    //
    // booking_shown and booking_abandoned are deliberately NOT in this list:
    // upgrading those to confirmed is the normal path a real booking takes, and
    // blocking it would break the flow this webhook exists to drive.
    const STATUS_A_GUESS_MUST_NOT_CLOBBER = ['cancelled', 'completed'];
    if (
      (eventIsIndeterminate || unrecognisedApptStatus) &&
      previousStatus &&
      STATUS_A_GUESS_MUST_NOT_CLOBBER.includes(previousStatus) &&
      newStatus !== previousStatus
    ) {
      console.log(
        `Indeterminate event would have moved ${existingSubmission!.id} from ` +
        `${previousStatus} to ${newStatus}; keeping ${previousStatus}.`,
      );
      await logWebhook('received', 200, `Kept ${previousStatus} over an indeterminate event`, {
        leadEmail: ghlEmail,
        meta: {
          event_type: rawEventType,
          submission_id: existingSubmission!.id,
          kept_status: previousStatus,
          would_have_set: newStatus,
        },
      });
      newStatus = previousStatus;
    }

    await logWebhook(
      existingSubmission ? 'matched' : 'processed',
      200,
      existingSubmission
        ? `Matched existing submission ${existingSubmission.id} (was ${previousStatus}) -> ${newStatus}`
        : `No existing submission matched; creating new (${newStatus})`,
      { leadEmail: ghlEmail, meta: { event_type: rawEventType, appointment_id: appointmentId, matched_id: existingSubmission?.id ?? null } },
    );


    // Build qualification data for GHL sync
    let qualificationForGHL: QualificationData | null = null;
    const originalResponse = existingSubmission?.ghl_response || {};
    const originalQualificationData = (originalResponse.qualification_data as Record<string, unknown>) || {};

    if (Object.keys(originalQualificationData).length > 0) {
      qualificationForGHL = {
        role: originalQualificationData.role as string || undefined,
        industry: originalQualificationData.industry as string || undefined,
        challenge: originalQualificationData.challenge as string || undefined,
        size: originalQualificationData.size as string || undefined,
        timeline: originalQualificationData.timeline as string || undefined,
      };

      // Add industry-based tags
      if (originalQualificationData.industry) {
        eventTags.push(`Industry: ${originalQualificationData.industry}`);
      }
      if (originalQualificationData.size) {
        eventTags.push(`Team: ${originalQualificationData.size}`);
      }
    }

    // Merge pending_tags from the original submission (set by log-ghl-submission for booking_shown)
    const pendingTags = (originalResponse.pending_tags as string[]) || [];
    if (pendingTags.length > 0) {
      console.log('Merging pending tags from booking_shown submission:', pendingTags);
      for (const tag of pendingTags) {
        if (!eventTags.includes(tag)) {
          eventTags.push(tag);
        }
      }
    }

    if (existingSubmission) {
      // UPDATE existing submission
      submissionId = existingSubmission.id;

      const { error: updateError } = await supabase
        .from('ghl_submissions')
        .update({
          lead_email: ghlEmail,
          lead_name: contactName || undefined,
          lead_first_name: contactFirstName || undefined,
          lead_last_name: contactLastName || undefined,
          lead_company: contactCompany || undefined,
          lead_phone: contactPhone || undefined,
          ghl_status: newStatus,
          meet_link: meetLink || undefined,
          ghl_response: {
            // Preserve original qualification data
            qualification_data: originalQualificationData,
            // Preserve original attribution (where they came from before booking)
            source_url: (originalResponse.source_url as string) || attributionUrl || null,
            referrer: (originalResponse.referrer as string) || attributionReferrer || null,
            // Add GHL sync info
            ghl_synced: true,
            ghl_verified: true,
            ghl_contact_id: contactId,
            phone: contactPhone,
            website: contactWebsite,
            tags_applied: eventTags,
            synced_at: new Date().toISOString(),
            // Event details
            event_type: eventType,
            appointment_id: appointmentId,
            start_time: startTime,
            end_time: endTime,
            calendar_name: calendarName,
            appointment_title: appointmentTitle,
            meet_link: meetLink,
            // Business name from GHL contact
            ghl_business_name: contactCompany,
            // Track all webhook events
            last_webhook_at: new Date().toISOString(),
            webhook_event: rawEventType,
          },
        })
        .eq('id', existingSubmission.id);

      if (updateError) {
        console.error('Error updating submission:', updateError);
        throw updateError;
      }

      console.log(`Updated submission ${existingSubmission.id} with status: ${newStatus}`);

      // Log history for the update
      await logMeetingHistory(supabase, {
        meetingId: existingSubmission.id,
        meetingType: 'demo',
        previousStatus,
        newStatus,
        eventType: historyEventType,
        notes: `GHL webhook: ${rawEventType}`,
        appointmentId,
        webhookPayload: { event_type: rawEventType, contact_id: contactId },
      });

    } else {
      // CREATE new submission (direct GHL booking, not from our chatbot)
      const { data: newSubmission, error: insertError } = await supabase
        .from('ghl_submissions')
        .insert({
          lead_email: ghlEmail,
          lead_name: contactName,
          lead_first_name: contactFirstName,
          lead_last_name: contactLastName,
          lead_company: contactCompany,
          lead_phone: contactPhone,
          source_page: 'ghl_calendar_widget',
          source_medium: 'ghl_direct_booking',
          source_campaign: eventType,
          lead_source: 'calendar_widget',
          ghl_status: newStatus,
          meet_link: meetLink,
          ghl_response: {
            event_type: eventType,
            ghl_contact_id: contactId,
            appointment_id: appointmentId,
            start_time: startTime,
            end_time: endTime,
            calendar_name: calendarName,
            appointment_title: appointmentTitle,
            meet_link: meetLink,
            phone: contactPhone,
            website: contactWebsite,
            ghl_business_name: contactCompany,
            ghl_synced: true,
            ghl_verified: true,
            tags_applied: eventTags,
            received_at: new Date().toISOString(),
            // Attribution — where the contact came from before booking (from GHL)
            source_url: attributionUrl,
            referrer: attributionReferrer,
          },
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error inserting submission:', insertError);
        throw insertError;
      }

      submissionId = newSubmission.id;
      console.log(`Created new submission ${submissionId} for ${ghlEmail}`);

      // Log history for the new submission
      await logMeetingHistory(supabase, {
        meetingId: submissionId,
        meetingType: 'demo',
        previousStatus: undefined,
        newStatus,
        eventType: 'created',
        notes: `Direct GHL booking: ${rawEventType}`,
        appointmentId,
        webhookPayload: { event_type: rawEventType, contact_id: contactId },
      });

      // Also sync to leads table for unified view
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .ilike('email', ghlEmail)
        .maybeSingle();

      if (!existingLead) {
        const { data: newLead } = await supabase
          .from('leads')
          .insert({
            email: ghlEmail,
            first_name: contactFirstName || 'Unknown',
            last_name: contactLastName || '',
            phone: contactPhone,
            company: contactCompany,
            lead_type: 'demo',
            lead_source: 'calendar_widget',
            source_page: 'ghl_calendar_widget',
            source_medium: 'ghl_direct_booking',
          })
          .select('id')
          .maybeSingle();

        // Fire the sales notification once for this newly-created lead (fallback-safe).
        if (newLead) {
          let notifStatus = 'sent';
          let notifError: string | null = null;
          try {
            const { error: notifyErr } = await supabase.functions.invoke('notify-new-lead', {
              body: {
                event: 'synced',
                lead_email: ghlEmail,
                lead_name: [contactFirstName, contactLastName].filter(Boolean).join(' ').trim() || undefined,
                lead_phone: contactPhone || undefined,
                lead_company: contactCompany || undefined,
                source_page: attributionUrl || 'GHL Calendar Booking',
                source_url: attributionUrl || undefined,
                referrer: attributionReferrer || undefined,
                source_medium: 'ghl_direct_booking',
                lead_source: 'calendar_widget',
                traffic_source: 'GoHighLevel',
                tags: eventTags,
                pipeline_name: GHL_PIPELINES.booking.pipelineName,
                pipeline_stage_name: GHL_PIPELINES.booking.stageName,
                record_id: submissionId || undefined,
                record_type: 'ghl_submission',
                ghl_contact_id: contactId || undefined,
              },
            });
            if (notifyErr) {
              notifStatus = 'failed';
              notifError = notifyErr.message ?? String(notifyErr);
              console.error('notify-new-lead failed for GHL lead', ghlEmail, notifyErr);
            }
          } catch (e) {
            notifStatus = 'failed';
            notifError = e instanceof Error ? e.message : String(e);
            console.error('notify-new-lead threw for GHL lead', ghlEmail, e);
          }
          await supabase
            .from('leads')
            .update({
              notification_status: notifStatus,
              notification_sent_at: notifStatus === 'sent' ? new Date().toISOString() : null,
              notification_error: notifError,
            })
            .eq('id', newLead.id);
        }
      }
    }

    // ===========================================================================
    // Item 3 + 4: Create a GHL opportunity on confirmed/synced bookings so the
    // lead is reportable under a pipeline + stage, and notify sales on success
    // (including the failed -> synced recovery case). Non-fatal on any failure.
    // ===========================================================================
    const isConfirmedSync = ['confirmed', 'synced', 'rescheduled'].includes(newStatus);
    let oppTarget: typeof GHL_PIPELINES.booking | null = null;

    if (isConfirmedSync && contactId && ghlApiKey && ghlLocationId && submissionId) {
      try {
        const target = GHL_PIPELINES.booking;
        const oppResult = await ensureOpportunity({
          apiKey: ghlApiKey,
          locationId: ghlLocationId,
          contactId,
          name: contactName || ghlEmail,
          target,
        });
        if (oppResult.success) {
          oppTarget = target;
          console.log(`GHL opportunity ${oppResult.existed ? 'exists' : 'created'}: ${oppResult.opportunityId} in ${target.pipelineName} / ${target.stageName}`);
          await supabase
            .from('ghl_submissions')
            .update({
              ghl_opportunity_id: oppResult.opportunityId || null,
              pipeline_id: target.pipelineId,
              pipeline_name: target.pipelineName,
              pipeline_stage_id: target.stageId,
              pipeline_stage_name: target.stageName,
            })
            .eq('id', submissionId);
        } else {
          console.warn('GHL opportunity creation failed (non-fatal):', oppResult.error);
        }
      } catch (oppErr) {
        console.warn('GHL opportunity creation threw (non-fatal):', String(oppErr));
      }
    }

    // Success / recovery notification for EXISTING submissions transitioning to
    // confirmed/synced. (Brand-new direct bookings already emailed above.)
    // Dedup: only fire on a genuine transition, not repeated confirmed webhooks.
    const wasGenuineTransition =
      !!existingSubmission &&
      !['confirmed', 'synced', 'rescheduled', 'cancelled'].includes(previousStatus || '');

    if (isConfirmedSync && wasGenuineTransition) {
      const priorSyncError = originalResponse.ghl_sync_error as string | undefined;
      const recovered =
        previousStatus === 'failed' ||
        (!!priorSyncError && !priorSyncError.includes('Skipped for booking_shown'));
      try {
        await supabase.functions.invoke('notify-new-lead', {
          body: {
            event: 'synced',
            recovered,
            lead_email: ghlEmail,
            lead_name: contactName || undefined,
            lead_phone: contactPhone || undefined,
            lead_company: contactCompany || undefined,
            source_page: (originalResponse.source_url as string) || attributionUrl || (existingSubmission?.ghl_status ? 'Website booking' : 'GHL Calendar Booking'),
            source_url: (originalResponse.source_url as string) || attributionUrl || undefined,
            referrer: (originalResponse.referrer as string) || attributionReferrer || undefined,
            source_medium: 'booking_modal',
            lead_source: 'calendar_widget',
            traffic_source: 'GoHighLevel',
            tags: eventTags,
            pipeline_name: (oppTarget || GHL_PIPELINES.booking).pipelineName,
            pipeline_stage_name: (oppTarget || GHL_PIPELINES.booking).stageName,
            record_id: (existingSubmission?.id || submissionId) || undefined,
            record_type: 'ghl_submission',
            ghl_contact_id: contactId || undefined,
          },
        });
        console.log(`Sync${recovered ? '/recovery' : ''} notification sent for ${ghlEmail}`);
      } catch (e) {
        console.warn('Sync notification failed (non-fatal):', String(e));
      }
    }



    // Update GHL contact with tags if API credentials available
    let taggingResult: { success: boolean; error?: string } = { success: false, error: 'GHL API not configured' };
    if (ghlApiKey && ghlLocationId) {
      taggingResult = await updateGHLContactWithQualification(
        email,
        eventTags,
        tagsToRemove,
        qualificationForGHL,
        ghlApiKey,
        ghlLocationId
      );
    }

    // Trigger threshold check
    try {
      await supabase.functions.invoke('check-ghl-threshold');
    } catch (thresholdError) {
      console.log('Threshold check skipped:', thresholdError);
    }

    await logWebhook('processed', 200, `Processed ${rawEventType}: submission ${submissionId} -> ${newStatus}`, {
      leadEmail: ghlEmail,
      meta: { event_type: rawEventType, submission_id: submissionId, status: newStatus, appointment_id: appointmentId },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: existingSubmission ? `Updated submission ${submissionId}` : `Created submission ${submissionId}`,
        status: newStatus,
        tagging: taggingResult,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );


  } catch (error) {
    console.error('Error in ghl-webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // A 500 tells GoHighLevel to deliver this event again. That is right for a
    // blip we would survive on a second attempt, and badly wrong for anything
    // else: a payload this function cannot process will fail identically every
    // time, so a permanent fault answered with 500 turns one bad event into a
    // retry loop that amplifies itself and buries the real signal in
    // webhook_logs.
    //
    // So only genuinely transient faults ask for a retry. Everything else is
    // accepted with 200 — the event is recorded as an error either way, and it
    // is our job to fix it, not GoHighLevel's to keep resending it.
    const retryable = isTransient(errorMessage);
    const status = retryable ? 500 : 200;
    await logWebhook(
      'error',
      status,
      retryable ? 'Transient failure — retry requested' : 'Permanent failure — accepted, not retried',
      { errorMessage },
    );
    return new Response(
      JSON.stringify({
        success: false,
        error: retryable ? 'Temporary failure, please retry' : 'Event accepted but could not be processed',
        details: errorMessage,
        retryable,
      }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
