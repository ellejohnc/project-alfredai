import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { fetchFromAllowedHost, FATHOM_FETCH_HOSTS, timingSafeEqual } from "../_shared/requestGuards.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-fathom-signature',
};

interface FathomWebhookPayload {
  event_type: string;
  meeting_id?: string;
  title?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  // Meeting location/link from the calendar event
  meeting_url?: string;
  meeting_link?: string;
  location?: string;
  join_url?: string;
  // Calendar event ID from Google/Outlook
  calendar_event_id?: string;
  external_id?: string;
  attendees?: Array<{
    email?: string;
    name?: string;
    is_organizer?: boolean;
  }>;
  transcript?: {
    url?: string;
    text?: string;
  };
  recording?: {
    url?: string;
  };
  summary?: string;
  action_items?: string[];
}

interface MatchResult {
  id: string;
  type: 'demo' | 'investor';
  email: string;
  match_method: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Extract Google Meet ID from URL
 * e.g., "https://meet.google.com/abc-defg-hij" -> "abc-defg-hij"
 */
function extractMeetId(url: string | undefined | null): string | null {
  if (!url) return null;
  const match = url.match(/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Extract Zoom meeting ID from URL
 * e.g., "https://zoom.us/j/123456789" -> "123456789"
 */
function extractZoomId(url: string | undefined | null): string | null {
  if (!url) return null;
  const match = url.match(/zoom\.us\/j\/(\d+)/i);
  return match ? match[1] : null;
}

/**
 * Match webhook meeting to existing meetings using multiple strategies:
 * 1. Meeting URL match (highest confidence)
 * 2. Email + time match (high confidence)
 * 3. Email only match (medium confidence)
 * 4. Time proximity match (low confidence)
 */
async function findMatchingMeeting(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  payload: FathomWebhookPayload
): Promise<MatchResult | null> {
  
  // Extract meeting URL from various possible fields
  const meetingUrl = payload.meeting_url || payload.meeting_link || payload.location || payload.join_url;
  const googleMeetId = extractMeetId(meetingUrl);
  const zoomId = extractZoomId(meetingUrl);
  
  // Normalize attendee emails (exclude organizers who are likely staff)
  const attendeeEmails = payload.attendees
    ?.filter(a => a.email && !a.is_organizer)
    .map(a => a.email!.toLowerCase().trim())
    .filter(Boolean) || [];
  
  // Get all attendee emails including organizers as fallback
  const allEmails = payload.attendees
    ?.map(a => a.email?.toLowerCase().trim())
    .filter(Boolean) as string[] || [];

  console.log('Matching criteria:', {
    meetingUrl,
    googleMeetId,
    zoomId,
    attendeeEmails,
    startTime: payload.start_time,
    calendarEventId: payload.calendar_event_id || payload.external_id,
  });

  // STRATEGY 1: Match by Google Meet URL (highest confidence)
  if (googleMeetId) {
    // Search in ghl_submissions where meet_link contains this ID
    const { data: meetingByUrl } = await supabase
      .from('ghl_submissions')
      .select('id, lead_email, meet_link, ghl_response')
      .ilike('meet_link', `%${googleMeetId}%`)
      .limit(1)
      .maybeSingle();

    if (meetingByUrl) {
      console.log(`✅ MATCH by Google Meet URL: ${googleMeetId}`);
      return {
        id: meetingByUrl.id,
        type: 'demo',
        email: meetingByUrl.lead_email,
        match_method: 'google_meet_url',
        confidence: 'high',
      };
    }

    // Also search in ghl_response jsonb for meet_link
    const { data: meetingByJsonUrl } = await supabase
      .from('ghl_submissions')
      .select('id, lead_email, ghl_response')
      .filter('ghl_response->meet_link', 'ilike', `%${googleMeetId}%`)
      .limit(1)
      .maybeSingle();

    if (meetingByJsonUrl) {
      console.log(`✅ MATCH by GHL response meet_link: ${googleMeetId}`);
      return {
        id: meetingByJsonUrl.id,
        type: 'demo',
        email: meetingByJsonUrl.lead_email,
        match_method: 'ghl_response_meet_link',
        confidence: 'high',
      };
    }
  }

  // STRATEGY 2: Match by email + time proximity (high confidence)
  if (payload.start_time && (attendeeEmails.length > 0 || allEmails.length > 0)) {
    const meetingTime = new Date(payload.start_time);
    const emailsToCheck = attendeeEmails.length > 0 ? attendeeEmails : allEmails;

    for (const email of emailsToCheck) {
      // Check ghl_submissions with start_time in ghl_response
      const { data: submissions } = await supabase
        .from('ghl_submissions')
        .select('id, lead_email, ghl_response')
        .ilike('lead_email', email);

      if (submissions && submissions.length > 0) {
        for (const sub of submissions) {
          const ghlResponse = sub.ghl_response;
          if (ghlResponse?.start_time) {
            const submissionTime = new Date(ghlResponse.start_time);
            const timeDiff = Math.abs(meetingTime.getTime() - submissionTime.getTime());
            
            // Within 30 minutes = high confidence match
            if (timeDiff <= 30 * 60 * 1000) {
              console.log(`✅ MATCH by email + time (${email}, diff: ${timeDiff / 1000}s)`);
              return {
                id: sub.id,
                type: 'demo',
                email: sub.lead_email,
                match_method: 'email_time_match',
                confidence: 'high',
              };
            }
          }
        }
      }

      // Check investor_leads/bookings
      const { data: investor } = await supabase
        .from('investor_leads')
        .select('id, email')
        .ilike('email', email)
        .maybeSingle();

      if (investor) {
        const { data: booking } = await supabase
          .from('investor_bookings')
          .select('id, start_time')
          .eq('investor_id', investor.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (booking?.start_time) {
          const bookingTime = new Date(booking.start_time);
          const timeDiff = Math.abs(meetingTime.getTime() - bookingTime.getTime());
          
          if (timeDiff <= 30 * 60 * 1000) {
            console.log(`✅ MATCH investor by email + time (${email})`);
            return {
              id: booking.id,
              type: 'investor',
              email: investor.email,
              match_method: 'investor_email_time_match',
              confidence: 'high',
            };
          }
        }
      }
    }
  }

  // STRATEGY 3: Match by email only (medium confidence - most recent meeting)
  const emailsToCheck = attendeeEmails.length > 0 ? attendeeEmails : allEmails;
  
  for (const email of emailsToCheck) {
    // Check ghl_submissions - most recent with meeting status
    const { data: demoMeeting } = await supabase
      .from('ghl_submissions')
      .select('id, lead_email, ghl_response, created_at')
      .ilike('lead_email', email)
      .in('ghl_status', ['confirmed', 'rescheduled'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (demoMeeting) {
      console.log(`⚠️ MATCH by email only (medium confidence): ${email}`);
      return {
        id: demoMeeting.id,
        type: 'demo',
        email: demoMeeting.lead_email,
        match_method: 'email_only',
        confidence: 'medium',
      };
    }

    // Check investor bookings
    const { data: investor } = await supabase
      .from('investor_leads')
      .select('id, email')
      .ilike('email', email)
      .maybeSingle();

    if (investor) {
      const { data: booking } = await supabase
        .from('investor_bookings')
        .select('id')
        .eq('investor_id', investor.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (booking) {
        console.log(`⚠️ MATCH investor by email only: ${email}`);
        return {
          id: booking.id,
          type: 'investor',
          email: investor.email,
          match_method: 'investor_email_only',
          confidence: 'medium',
        };
      }
    }
  }

  // STRATEGY 4: Time-based fallback (low confidence)
  if (payload.start_time) {
    const meetingTime = new Date(payload.start_time);
    const timeLower = new Date(meetingTime.getTime() - 15 * 60 * 1000).toISOString();
    const timeUpper = new Date(meetingTime.getTime() + 15 * 60 * 1000).toISOString();

    // Find meetings scheduled around this time
    const { data: timeMatch } = await supabase
      .from('ghl_submissions')
      .select('id, lead_email, ghl_response')
      .in('ghl_status', ['confirmed', 'rescheduled'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (timeMatch) {
      for (const sub of timeMatch) {
        const ghlResponse = sub.ghl_response;
        if (ghlResponse?.start_time) {
          const subTime = new Date(ghlResponse.start_time);
          if (subTime >= new Date(timeLower) && subTime <= new Date(timeUpper)) {
            console.log(`⚠️ MATCH by time proximity only (low confidence)`);
            return {
              id: sub.id,
              type: 'demo',
              email: sub.lead_email,
              match_method: 'time_proximity',
              confidence: 'low',
            };
          }
        }
      }
    }
  }

  console.log('❌ No matching meeting found');
  return null;
}

/**
 * Download content from URL and store in Supabase
 */
async function downloadAndStore(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  url: string,
  meetingId: string,
  documentType: 'transcript' | 'recording' | 'summary',
  fileName: string
): Promise<{ success: boolean; path?: string; size?: number; error?: string }> {
  try {
    let response: Response;
    try {
      // Anti-SSRF: the allowlist is re-checked on every redirect hop, not just
      // the URL we were handed.
      response = await fetchFromAllowedHost(url, FATHOM_FETCH_HOSTS);
    } catch (e) {
      console.warn('[FATHOM-WEBHOOK] Blocked or failed download:', (e as Error).message);
      return { success: false, error: (e as Error).message };
    }
    if (!response.ok) {
      return { success: false, error: `Failed to fetch: ${response.status}` };
    }


    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);

    const timestamp = Date.now();
    const storagePath = `${meetingId}/${documentType}/${timestamp}_${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('meeting-documents')
      .upload(storagePath, fileData, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    return { success: true, path: storagePath, size: fileData.length };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the webhook BEFORE touching the payload (fail closed).
    const webhookSecret = Deno.env.get('FATHOM_WEBHOOK_SECRET');
    const reqUrl = new URL(req.url);
    const providedSecret = req.headers.get('x-fathom-signature')
      ?? req.headers.get('x-webhook-secret')
      ?? reqUrl.searchParams.get('secret')
      ?? '';
    if (!webhookSecret) {
      // Fail closed, but make the reason unmistakable in the logs — this is a
      // deployment problem, not an attacker.
      console.error('[FATHOM-WEBHOOK] MISCONFIGURED: FATHOM_WEBHOOK_SECRET is not set — rejecting all calls until it is.');
      return new Response(
        JSON.stringify({ success: false, error: 'Webhook secret not configured on the server.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (!providedSecret || !timingSafeEqual(providedSecret, webhookSecret)) {
      console.error('[FATHOM-WEBHOOK] Rejected: invalid webhook secret');
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }


    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: FathomWebhookPayload = await req.json();
    console.log('Fathom webhook received:', JSON.stringify(payload, null, 2));

    const eventType = payload.event_type?.toLowerCase() || '';
    
    // Only process meeting.completed or similar events
    if (!eventType.includes('complete') && !eventType.includes('end') && !eventType.includes('finish')) {
      console.log(`Ignoring event type: ${eventType}`);
      return new Response(
        JSON.stringify({ success: true, message: 'Event type ignored' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find matching meeting using enhanced matching
    const matchedMeeting = await findMatchingMeeting(supabase, payload);
    
    if (!matchedMeeting) {
      console.log('No matching meeting found for Fathom webhook');
      
      // Store unmatched webhook for manual review
      await supabase.from('meeting_history').insert({
        meeting_id: 'unmatched',
        meeting_type: 'demo',
        event_type: 'fathom_unmatched',
        new_status: 'pending_match',
        notes: `Unmatched Fathom webhook - emails: ${payload.attendees?.map(a => a.email).join(', ')}`,
        webhook_payload: payload,
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No matching meeting found',
          attendees: payload.attendees?.map(a => a.email),
          meeting_url: payload.meeting_url || payload.meeting_link || payload.location,
          start_time: payload.start_time,
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Matched meeting: ${matchedMeeting.id} (${matchedMeeting.match_method}, ${matchedMeeting.confidence} confidence)`);

    const documentsCreated: string[] = [];
    const errors: string[] = [];

    // Process transcript
    if (payload.transcript?.url || payload.transcript?.text) {
      try {
        let storagePath: string | undefined;
        let fileSize = 0;

        if (payload.transcript.url) {
          const result = await downloadAndStore(
            supabase,
            payload.transcript.url,
            matchedMeeting.id,
            'transcript',
            'fathom_transcript.txt'
          );
          if (result.success) {
            storagePath = result.path;
            fileSize = result.size || 0;
          } else {
            errors.push(`Transcript download failed: ${result.error}`);
          }
        } else if (payload.transcript.text) {
          const textData = new TextEncoder().encode(payload.transcript.text);
          fileSize = textData.length;
          const timestamp = Date.now();
          storagePath = `${matchedMeeting.id}/transcript/${timestamp}_fathom_transcript.txt`;
          
          const { error } = await supabase.storage
            .from('meeting-documents')
            .upload(storagePath, textData, {
              contentType: 'text/plain',
              upsert: false,
            });
          
          if (error) {
            errors.push(`Transcript upload failed: ${error.message}`);
            storagePath = undefined;
          }
        }

        if (storagePath) {
          const { error: dbError } = await supabase
            .from('meeting_documents')
            .insert({
              meeting_id: matchedMeeting.id,
              meeting_type: matchedMeeting.type,
              document_type: 'transcript',
              file_name: 'fathom_transcript.txt',
              file_url: storagePath,
              file_size_bytes: fileSize || null,
              mime_type: 'text/plain',
              source: 'fathom',
              metadata: {
                fathom_meeting_id: payload.meeting_id,
                duration_minutes: payload.duration_minutes,
                start_time: payload.start_time,
                match_method: matchedMeeting.match_method,
                match_confidence: matchedMeeting.confidence,
                meeting_url: payload.meeting_url || payload.meeting_link,
              },
            });

          if (dbError) {
            errors.push(`Transcript DB insert failed: ${dbError.message}`);
          } else {
            documentsCreated.push('transcript');
          }
        }
      } catch (error) {
        errors.push(`Transcript processing error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }

    // Process recording
    if (payload.recording?.url) {
      try {
        const result = await downloadAndStore(
          supabase,
          payload.recording.url,
          matchedMeeting.id,
          'recording',
          'fathom_recording.mp4'
        );

        if (result.success && result.path) {
          const { error: dbError } = await supabase
            .from('meeting_documents')
            .insert({
              meeting_id: matchedMeeting.id,
              meeting_type: matchedMeeting.type,
              document_type: 'recording',
              file_name: 'fathom_recording.mp4',
              file_url: result.path,
              file_size_bytes: result.size || null,
              mime_type: 'video/mp4',
              source: 'fathom',
              metadata: {
                fathom_meeting_id: payload.meeting_id,
                duration_minutes: payload.duration_minutes,
                match_method: matchedMeeting.match_method,
                match_confidence: matchedMeeting.confidence,
              },
            });

          if (dbError) {
            errors.push(`Recording DB insert failed: ${dbError.message}`);
          } else {
            documentsCreated.push('recording');
          }
        } else {
          errors.push(`Recording download failed: ${result.error}`);
        }
      } catch (error) {
        errors.push(`Recording processing error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }

    // Process summary
    if (payload.summary) {
      try {
        const summaryText = `Meeting Summary\n\n${payload.summary}${
          payload.action_items?.length 
            ? `\n\nAction Items:\n${payload.action_items.map((item, i) => `${i + 1}. ${item}`).join('\n')}`
            : ''
        }`;
        
        const textData = new TextEncoder().encode(summaryText);
        const timestamp = Date.now();
        const storagePath = `${matchedMeeting.id}/summary/${timestamp}_fathom_summary.txt`;
        
        const { error: uploadError } = await supabase.storage
          .from('meeting-documents')
          .upload(storagePath, textData, {
            contentType: 'text/plain',
            upsert: false,
          });

        if (!uploadError) {
          const { error: dbError } = await supabase
            .from('meeting_documents')
            .insert({
              meeting_id: matchedMeeting.id,
              meeting_type: matchedMeeting.type,
              document_type: 'summary',
              file_name: 'fathom_summary.txt',
              file_url: storagePath,
              file_size_bytes: textData.length,
              mime_type: 'text/plain',
              source: 'fathom',
              metadata: {
                fathom_meeting_id: payload.meeting_id,
                action_items_count: payload.action_items?.length || 0,
                match_method: matchedMeeting.match_method,
                match_confidence: matchedMeeting.confidence,
              },
            });

          if (dbError) {
            errors.push(`Summary DB insert failed: ${dbError.message}`);
          } else {
            documentsCreated.push('summary');
          }
        } else {
          errors.push(`Summary upload failed: ${uploadError.message}`);
        }
      } catch (error) {
        errors.push(`Summary processing error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }

    // Log the match in meeting_history
    if (documentsCreated.length > 0) {
      await supabase.from('meeting_history').insert({
        meeting_id: matchedMeeting.id,
        meeting_type: matchedMeeting.type,
        event_type: 'fathom_documents_uploaded',
        new_status: 'documents_attached',
        notes: `Auto-matched via ${matchedMeeting.match_method} (${matchedMeeting.confidence}). Docs: ${documentsCreated.join(', ')}`,
        webhook_payload: { 
          fathom_meeting_id: payload.meeting_id,
          documents: documentsCreated,
          match_confidence: matchedMeeting.confidence,
        },
      });
    }

    console.log(`Fathom webhook processed: ${documentsCreated.length} documents created, ${errors.length} errors`);

    return new Response(
      JSON.stringify({ 
        success: documentsCreated.length > 0,
        matched_meeting: matchedMeeting.id,
        match_method: matchedMeeting.match_method,
        match_confidence: matchedMeeting.confidence,
        documents_created: documentsCreated,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Fathom webhook error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
