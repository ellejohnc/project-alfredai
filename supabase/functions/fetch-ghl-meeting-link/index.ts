import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { GHL_V3 } from "../_shared/ghlClient.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ghlApiKey = Deno.env.get('GHL_API_KEY');
    const ghlLocationId = Deno.env.get('GHL_LOCATION_ID');

    if (!ghlApiKey || !ghlLocationId) {
      return new Response(
        JSON.stringify({ success: false, error: 'GHL API key or Location ID not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { submissionId, email, contactId } = await req.json();
    console.log('Fetching meeting link for:', { submissionId, email, contactId });

    let ghlContactId = contactId;

    // If no contactId provided, search for the contact by email
    if (!ghlContactId && email) {
      console.log('Searching for contact by email:', email);
      const searchResponse = await fetch(
        `https://services.leadconnectorhq.com/contacts/?locationId=${ghlLocationId}&query=${encodeURIComponent(email)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${ghlApiKey}`,
            'Version': GHL_V3,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error('GHL contact search failed:', searchResponse.status, errorText);
        return new Response(
          JSON.stringify({ success: false, error: 'Contact search failed', meetLink: null }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const searchData = await searchResponse.json();
      const contacts = searchData.contacts || [];
      const contact = contacts.find((c: { email?: string }) => 
        c.email?.toLowerCase() === email.toLowerCase()
      );

      if (!contact) {
        return new Response(
          JSON.stringify({ success: false, error: 'Contact not found in GHL', meetLink: null }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      ghlContactId = contact.id;
      console.log('Found contact ID:', ghlContactId);
    }

    if (!ghlContactId) {
      return new Response(
        JSON.stringify({ success: false, error: 'No contact ID or email provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch appointments for this contact
    console.log('Fetching appointments for contact:', ghlContactId);
    const appointmentsResponse = await fetch(
      `https://services.leadconnectorhq.com/contacts/${ghlContactId}/appointments`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ghlApiKey}`,
          'Version': GHL_V3,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!appointmentsResponse.ok) {
      const errorText = await appointmentsResponse.text();
      console.error('GHL appointments fetch failed:', appointmentsResponse.status, errorText);
      // Return 200 with success:false so the client doesn't treat it as a fatal error
      return new Response(
        JSON.stringify({ success: false, error: 'Contact not found or appointments unavailable', meetLink: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const appointmentsData = await appointmentsResponse.json();
    const appointments = appointmentsData.events || appointmentsData.appointments || [];
    console.log('Found appointments:', appointments.length);

    if (appointments.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No appointments found for this contact', meetLink: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the most recent confirmed appointment (prefer confirmed over cancelled)
    const sortedAppointments = appointments.sort((a: { startTime?: string; appointmentStatus?: string }, b: { startTime?: string; appointmentStatus?: string }) => {
      // Prioritize confirmed appointments
      const aConfirmed = a.appointmentStatus === 'confirmed' ? 1 : 0;
      const bConfirmed = b.appointmentStatus === 'confirmed' ? 1 : 0;
      if (bConfirmed !== aConfirmed) return bConfirmed - aConfirmed;
      
      // Then sort by date (most recent first)
      const dateA = new Date(a.startTime || 0).getTime();
      const dateB = new Date(b.startTime || 0).getTime();
      return dateB - dateA;
    });

    const latestAppointment = sortedAppointments[0];
    console.log('Latest appointment:', JSON.stringify(latestAppointment, null, 2));

    // First try to extract from the contact appointments response
    let meetLink = 
      latestAppointment.meetingUrl ||
      latestAppointment.meetUrl ||
      latestAppointment.googleMeetLink ||
      latestAppointment.google_meet_link ||
      latestAppointment.zoomLink ||
      latestAppointment.zoom_link ||
      latestAppointment.conferenceUrl ||
      latestAppointment.locationUrl ||
      extractMeetLinkFromLocation(latestAppointment.address || latestAppointment.location);

    // If no link found, try the Calendar Events API for more complete data
    if (!meetLink && latestAppointment.id) {
      console.log('No link in appointments response, trying Calendar Events API for appointment:', latestAppointment.id);
      
      try {
        const eventResponse = await fetch(
          `https://services.leadconnectorhq.com/calendars/events/appointments/${latestAppointment.id}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${ghlApiKey}`,
              'Version': '2021-04-15',
              'Content-Type': 'application/json',
            },
          }
        );

        if (eventResponse.ok) {
          const eventData = await eventResponse.json();
          console.log('Calendar event data:', JSON.stringify(eventData, null, 2));
          
          // Try to extract from calendar event response
          meetLink = 
            eventData.meetingUrl ||
            eventData.meetUrl ||
            eventData.googleMeetLink ||
            eventData.google_meet_link ||
            eventData.zoomLink ||
            eventData.zoom_link ||
            eventData.conferenceUrl ||
            eventData.locationUrl ||
            eventData.meetingLocation ||
            extractMeetLinkFromLocation(eventData.address || eventData.location || eventData.meetingLocation);
        } else {
          console.log('Calendar Events API returned:', eventResponse.status);
        }
      } catch (calendarError) {
        console.log('Calendar Events API error (non-fatal):', calendarError);
      }
    }

    // If still no link, try fetching the calendar slot/booking details
    if (!meetLink && latestAppointment.calendarId) {
      console.log('Trying calendar slot API for calendar:', latestAppointment.calendarId);
      
      try {
        // Try to get calendar details which might have the default meeting link
        const calendarResponse = await fetch(
          `https://services.leadconnectorhq.com/calendars/${latestAppointment.calendarId}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${ghlApiKey}`,
              'Version': '2021-04-15',
              'Content-Type': 'application/json',
            },
          }
        );

        if (calendarResponse.ok) {
          const calendarData = await calendarResponse.json();
          console.log('Calendar data:', JSON.stringify(calendarData?.calendar || calendarData, null, 2));
          
          const calendar = calendarData.calendar || calendarData;
          meetLink = 
            calendar.meetingUrl ||
            calendar.googleMeetLink ||
            calendar.zoomLink ||
            calendar.meetLink ||
            extractMeetLinkFromLocation(calendar.meetingLocation);
        }
      } catch (calError) {
        console.log('Calendar API error (non-fatal):', calError);
      }
    }

    console.log('Final extracted meet link:', meetLink);

    // Get existing ghl_response to preserve data
    let existingResponse: Record<string, unknown> = {};
    if (submissionId) {
      const { data } = await supabase
        .from('ghl_submissions')
        .select('ghl_response')
        .eq('id', submissionId)
        .single();
      
      if (data?.ghl_response && typeof data.ghl_response === 'object') {
        existingResponse = data.ghl_response as Record<string, unknown>;
      }
    }

    // Update the submission with the meeting link if found
    if (meetLink && submissionId) {
      const { error: updateError } = await supabase
        .from('ghl_submissions')
        .update({ 
          meet_link: meetLink,
          ghl_response: {
            ...existingResponse,
            meet_link: meetLink,
            ghl_contact_id: ghlContactId,
            appointment_id: latestAppointment.id,
            start_time: latestAppointment.startTime,
            end_time: latestAppointment.endTime,
            calendar_name: latestAppointment.calendarName || latestAppointment.title,
          }
        })
        .eq('id', submissionId);

      if (updateError) {
        console.error('Error updating submission:', updateError);
      } else {
        console.log('Updated submission with meeting link');
      }
    }

    // Sync link to other submissions with same contact ID
    if (meetLink && ghlContactId) {
      const { data: otherSubmissions, error: findError } = await supabase
        .from('ghl_submissions')
        .select('id, ghl_response')
        .neq('id', submissionId || '')
        .is('meet_link', null)
        .in('ghl_status', ['confirmed', 'rescheduled']);

      if (!findError && otherSubmissions) {
        // Filter to those with matching contact ID
        const matchingSubmissions = otherSubmissions.filter((s: { ghl_response: unknown }) => {
          const resp = s.ghl_response as Record<string, unknown> | null;
          return resp?.ghl_contact_id === ghlContactId;
        });

        if (matchingSubmissions.length > 0) {
          console.log(`Syncing link to ${matchingSubmissions.length} other submissions with same contact ID`);
          
          for (const sub of matchingSubmissions) {
            const subResp = (sub.ghl_response as Record<string, unknown>) || {};
            await supabase
              .from('ghl_submissions')
              .update({ 
                meet_link: meetLink,
                ghl_response: {
                  ...subResp,
                  meet_link: meetLink,
                  ghl_contact_id: ghlContactId,
                  synced_from_contact: true,
                }
              })
              .eq('id', sub.id);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        meetLink,
        appointment: {
          id: latestAppointment.id,
          startTime: latestAppointment.startTime,
          endTime: latestAppointment.endTime,
          title: latestAppointment.title || latestAppointment.calendarName,
          status: latestAppointment.appointmentStatus || latestAppointment.status,
        },
        contactId: ghlContactId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching meeting link:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractMeetLinkFromLocation(location: string | null | undefined): string | null {
  if (!location) return null;
  const meetMatch = location.match(/https:\/\/meet\.google\.com\/[a-z\-]+/i);
  if (meetMatch) return meetMatch[0];
  const zoomMatch = location.match(/https:\/\/[a-z0-9\-]*\.?zoom\.us\/[^\s]+/i);
  if (zoomMatch) return zoomMatch[0];
  if (location.startsWith('https://')) return location;
  return null;
}
