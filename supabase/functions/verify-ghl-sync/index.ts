import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { GHL_V3 } from "../_shared/ghlClient.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

interface VerifyRequest {
  submission_ids?: string[];
  verify_all_pending?: boolean;
  check_deleted?: boolean; // Check if verified contacts still exist in GHL
  check_appointment_status?: boolean; // Check appointment status from GHL
  sync_business_names?: boolean; // Fetch business names from GHL for contacts missing them
  source?: 'leads_booked' | 'leads' | 'meetings' | 'all'; // Which panel is requesting
  batch_limit?: number; // Max contacts to check per run (for scheduled jobs)
  scheduled_run?: boolean; // True if triggered by cron
  repair_deleted?: boolean; // Repair incorrectly marked deleted_from_ghl rows
}

/**
 * Search for a contact in GHL by email
 * Returns contact details including businessName for syncing to admin panel
 */
async function searchContactByEmail(
  email: string,
  apiKey: string,
  locationId: string
): Promise<{ found: boolean; contactId?: string; phone?: string; businessName?: string; firstName?: string; lastName?: string; error?: string }> {
  try {
    console.log(`Searching GHL for contact: ${email}`);
    
    const response = await fetch(
      `https://services.leadconnectorhq.com/contacts/search`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Version': GHL_V3,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationId,
          query: email,
          page: 1,
          pageLimit: 20,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GHL search failed:', response.status, errorText);
      return { found: false, error: `Search failed: ${response.status}` };
    }

    const data = await response.json();
    const contacts = data.contacts || [];
    
    // Find exact email match
    const contact = contacts.find((c: { email?: string }) =>
      c.email?.toLowerCase() === email.toLowerCase()
    );
    
    if (contact && contact.id) {
      // Extract business name from GHL contact - check multiple possible field names
      const businessName = contact.businessName || contact.companyName || contact.company || undefined;
      console.log(`Found GHL contact for ${email}: ${contact.id}, businessName: ${businessName || 'none'}`);
      return { 
        found: true, 
        contactId: contact.id,
        phone: contact.phone || undefined,
        businessName,
        firstName: contact.firstName || undefined,
        lastName: contact.lastName || undefined,
      };
    }
    
    return { found: false };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error searching GHL:', errorMessage);
    return { found: false, error: errorMessage };
  }
}

/**
 * Search for contacts in GHL by company/business name
 * Returns all matching contacts for fuzzy company name matching
 */
async function searchContactsByCompanyName(
  companyName: string,
  apiKey: string,
  locationId: string
): Promise<{ found: boolean; contacts?: Array<{ contactId: string; email?: string; phone?: string; businessName?: string; firstName?: string; lastName?: string }>; error?: string }> {
  try {
    console.log(`Searching GHL for contacts by company: ${companyName}`);
    
    const response = await fetch(
      `https://services.leadconnectorhq.com/contacts/search`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Version': GHL_V3,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationId,
          query: companyName,
          page: 1,
          pageLimit: 50,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GHL company search failed:', response.status, errorText);
      return { found: false, error: `Search failed: ${response.status}` };
    }

    const data = await response.json();
    const contacts = data.contacts || [];
    
    // Filter contacts that have matching business name
    const normalizedSearch = companyName.toLowerCase().trim();
    const matchingContacts = contacts.filter((c: { businessName?: string; companyName?: string; company?: string }) => {
      const bizName = (c.businessName || c.companyName || c.company || '').toLowerCase().trim();
      // Fuzzy match: contains the search term or vice versa
      return bizName.includes(normalizedSearch) || normalizedSearch.includes(bizName);
    }).map((c: { id: string; email?: string; phone?: string; businessName?: string; companyName?: string; company?: string; firstName?: string; lastName?: string }) => ({
      contactId: c.id,
      email: c.email,
      phone: c.phone,
      businessName: c.businessName || c.companyName || c.company,
      firstName: c.firstName,
      lastName: c.lastName,
    }));
    
    if (matchingContacts.length > 0) {
      console.log(`Found ${matchingContacts.length} GHL contacts for company "${companyName}"`);
      return { found: true, contacts: matchingContacts };
    }
    
    return { found: false };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error searching GHL by company:', errorMessage);
    return { found: false, error: errorMessage };
  }
}

/**
 * Fetch a contact in GHL by contactId.
 * Returns:
 * - exists=true when 200 (with contact data including businessName)
 * - exists=false when 404
 * - error on any other non-2xx
 */
async function fetchContactById(
  contactId: string,
  apiKey: string
): Promise<{ exists: boolean; email?: string; phone?: string; businessName?: string; firstName?: string; lastName?: string; error?: string; status?: number }> {
  try {
    const res = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Version': GHL_V3,
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 404) {
      return { exists: false, status: 404 };
    }

    if (!res.ok) {
      const txt = await res.text();
      return { exists: true, error: `Contact fetch failed: ${res.status} ${txt}`, status: res.status };
    }

    const data = await res.json();
    const c = data?.contact ?? data;
    // Extract business name from GHL contact - check multiple possible field names
    const businessName = c?.businessName || c?.companyName || c?.company || undefined;
    return {
      exists: true,
      email: c?.email,
      phone: c?.phone,
      businessName,
      firstName: c?.firstName,
      lastName: c?.lastName,
      status: 200,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return { exists: true, error: msg };
  }
}

/**
 * Fetch an appointment in GHL by appointmentId.
 * Returns:
 * - exists=true when 200
 * - exists=false when 404
 * - error on any other non-2xx
 */
async function fetchAppointmentById(
  appointmentId: string,
  apiKey: string
): Promise<{ exists: boolean; error?: string; status?: number; appointmentData?: Record<string, unknown>; title?: string; calendarName?: string }> {
  try {
    const res = await fetch(
      `https://services.leadconnectorhq.com/calendars/events/appointments/${appointmentId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Version': GHL_V3,
          'Content-Type': 'application/json',
        },
      }
    );

    if (res.status === 404) {
      return { exists: false, status: 404 };
    }

    if (!res.ok) {
      const txt = await res.text();
      return { exists: true, error: `Appointment fetch failed: ${res.status} ${txt}`, status: res.status };
    }

    const data = await res.json();
    const appointment = data?.appointment ?? data;
    // Extract appointment title/name - GHL uses 'title' or 'name' or 'calendarName'
    const title = appointment?.title || appointment?.name || appointment?.calendarName || undefined;
    const calendarName = appointment?.calendarName || appointment?.calendar_name || undefined;
    
    return { exists: true, status: 200, appointmentData: data, title, calendarName };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return { exists: true, error: msg };
  }
}

/**
 * Check if a submission still exists in GHL by checking BOTH contact AND appointment.
 * Returns deletion reason if either is deleted.
 */
async function checkExistsInGHL(
  submission: { lead_email: string; ghl_response: Record<string, unknown> | null },
  ghlApiKey: string,
  ghlLocationId: string
): Promise<{ exists: boolean | null; reason?: string; error?: string; status?: number }> {
  const response = submission.ghl_response || {};
  const contactId = (response.ghl_contact_id as string | undefined) || undefined;
  const appointmentId = (response.appointment_id as string | undefined) || undefined;

  // If no identifiers at all, cannot determine deletion → skip
  if (!contactId && !appointmentId) {
    return { exists: null, reason: 'no_identifier' };
  }

  // Check 1: Contact exists?
  if (contactId) {
    const contactCheck = await fetchContactById(contactId, ghlApiKey);
    if (contactCheck.status === 404) {
      return { exists: false, reason: 'contact_deleted', status: 404 };
    }
    if (contactCheck.error) {
      return { exists: null, error: contactCheck.error, status: contactCheck.status };
    }
  }

  // Check 2: Appointment exists? (for booked leads with appointment_id)
  if (appointmentId) {
    const appointmentCheck = await fetchAppointmentById(appointmentId, ghlApiKey);
    if (appointmentCheck.status === 404) {
      return { exists: false, reason: 'appointment_deleted', status: 404 };
    }
    // API errors → don't mark deleted
    if (appointmentCheck.error) {
      return { exists: null, error: appointmentCheck.error, status: appointmentCheck.status };
    }
  }

  // If neither contact nor appointment → fallback to email search
  if (!contactId && !appointmentId) {
    const byEmail = await searchContactByEmail(submission.lead_email, ghlApiKey, ghlLocationId);
    if (!byEmail.found && !byEmail.error) {
      return { exists: false, reason: 'email_not_found' };
    }
    if (byEmail.error) {
      return { exists: null, error: byEmail.error };
    }
    return { exists: true };
  }

  return { exists: true };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ghlApiKey = Deno.env.get('GHL_API_KEY');
    const ghlLocationId = Deno.env.get('GHL_LOCATION_ID');

    if (!ghlApiKey || !ghlLocationId) {
      console.error('Missing GHL credentials');
      return new Response(
        JSON.stringify({ error: 'GHL integration not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Admin-only: this function returns lead emails/phones and performs writes.
    //
    // A cron shared-secret is accepted first. The comment below used to claim
    // the nightly job calls this with the service role key — it does not, it
    // sends the ANON key, which is not a user JWT and is not the service key
    // either, so auth.getUser rejected it and every scheduled run returned
    // 401 "Invalid token". That failed silently for a week because the health
    // panel only knew whether the SQL statement ran, not what the call
    // answered. Same env var sync-meta-leads already uses, so no new config.
    const cronSecret = Deno.env.get('CRON_SECRET') || Deno.env.get('META_SYNC_CRON_SECRET');
    const isCron = !!cronSecret && req.headers.get('x-cron-secret') === cronSecret;

    const authHeader = req.headers.get('Authorization');
    if (!isCron && !authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const token = (authHeader ?? '').replace('Bearer ', '');

    // The service key is also accepted, for anything server-side that holds it.
    // Not a widening: anything holding it can already read and write every
    // table directly, so gating this function against it protects nothing.
    // Compared with === rather than parsed, and never logged.
    const isServiceCall = isCron || (!!token && token === supabaseServiceKey);

    const { data: { user }, error: authError } = isServiceCall
      ? { data: { user: null }, error: null }
      : await supabase.auth.getUser(token);

    if (!isServiceCall && (authError || !user)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const { data: isAdminOk } = isServiceCall
      ? { data: true }
      : await supabase.rpc('is_admin', { _user_id: user!.id });
    if (!isAdminOk) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    
    const body: VerifyRequest = await req.json();
    const { 
      submission_ids, 
      verify_all_pending, 
      check_deleted,
      check_appointment_status,
      sync_business_names = false,
      source = 'all',
      batch_limit = 50, // Default limit for scheduled runs
      scheduled_run = false,
      repair_deleted = false
    } = body;

    console.log('Verify GHL sync request:', { 
      submission_ids, 
      verify_all_pending, 
      check_deleted,
      check_appointment_status,
      sync_business_names,
      source, 
      batch_limit, 
      scheduled_run,
      repair_deleted,
    });

    // Build query for submissions to verify
    let query = supabase
      .from('ghl_submissions')
      .select('id, lead_email, lead_phone, lead_company, ghl_status, ghl_response, lead_source, source_medium')
      .is('archived_at', null);

    if (submission_ids && submission_ids.length > 0) {
      query = query.in('id', submission_ids);
    } else if (verify_all_pending || sync_business_names) {
      // Filter based on source
      if (source === 'leads_booked' || source === 'meetings') {
        // Only calendar-originated leads (meetings)
        query = query.or('lead_source.eq.calendar_widget,source_medium.eq.ghl_direct_booking,ghl_status.in.(confirmed,cancelled,rescheduled)');
      } else if (source === 'leads') {
        // Exclude calendar-originated leads (those are in Leads Booked)
        query = query.neq('lead_source', 'calendar_widget').neq('source_medium', 'ghl_direct_booking');
      }
      // If source === 'all', no additional filter needed
    } else if (!submission_ids?.length) {
      return new Response(
        JSON.stringify({ error: 'Must provide submission_ids, verify_all_pending, or sync_business_names' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Bound the scan so a growing table doesn't full-scan past the statement
    // timeout (was returning 504 + exhausting the connection pool). For the broad
    // (non-id) modes, fetch at most batch_limit rows per call.
    if (!submission_ids || submission_ids.length === 0) {
      query = query.order('created_at', { ascending: true }).limit(batch_limit);
    }

    const { data: submissions, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching submissions:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch submissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!submissions || submissions.length === 0) {
      console.log('No submissions to verify');
      return new Response(
        JSON.stringify({ verified: 0, updated: 0, message: 'No submissions to verify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${submissions.length} submissions to verify`);

    // Determine what needs processing based on mode
    let needsVerification: typeof submissions = [];
    let needsDeletionCheck: typeof submissions = [];

    // Repair mode: verify "deleted_from_ghl" rows and restore those that still exist.
    if (repair_deleted) {
      needsDeletionCheck = submissions.filter((s) => {
        const response = s.ghl_response as Record<string, unknown> | null;
        const contactId = (response?.ghl_contact_id as string | undefined) || undefined;
        return s.ghl_status === 'deleted_from_ghl' && !!contactId;
      });

      if (scheduled_run && needsDeletionCheck.length > batch_limit) {
        needsDeletionCheck = needsDeletionCheck.slice(0, batch_limit);
      }

      console.log(`${needsDeletionCheck.length} deleted submissions need repair check`);
    } else if (check_deleted) {
      // Check if already-verified contacts still exist in GHL.
      // IMPORTANT: some older records may look "Verified" in the UI via legacy rules
      // (e.g., ghl_status === 'synced' + ghl_contact_id) without ghl_verified=true.
      // We still want to audit those for deletions.
      needsDeletionCheck = submissions.filter((s) => {
        if (!s.lead_email) return false;
        if (s.ghl_status === 'deleted_from_ghl') return false;

        const response = s.ghl_response as Record<string, unknown> | null;
        const status = (s.ghl_status || '').toLowerCase();

        // If it’s a booking status we care about, we audit even if ghl_contact_id is missing
        // (fallback to email search).
        const isBookedStatus = ['confirmed', 'cancelled', 'canceled', 'rescheduled', 'synced'].includes(status);

        const hasContactId = !!(response?.ghl_contact_id as string | undefined);
        const isClearlySyncedByFlags = response?.ghl_verified === true || response?.ghl_synced === true;

        return isBookedStatus || hasContactId || isClearlySyncedByFlags;
      });
      // Apply batch limit for scheduled runs
      if (scheduled_run && needsDeletionCheck.length > batch_limit) {
        console.log(`Limiting deletion check to ${batch_limit} contacts (scheduled run)`);
        needsDeletionCheck = needsDeletionCheck.slice(0, batch_limit);
      }
      console.log(`${needsDeletionCheck.length} verified submissions need deletion check`);
    } else {
      // Normal verification of unverified contacts
      needsVerification = submissions.filter(s => {
        const response = s.ghl_response as Record<string, unknown> | null;
        // Skip if already verified or marked as deleted
        if (response?.ghl_verified === true && response?.ghl_contact_id) {
          return false;
        }
        if (s.ghl_status === 'deleted_from_ghl') {
          return false;
        }
        return true;
      });
      console.log(`${needsVerification.length} submissions need verification`);
    }

    let verified = 0;
    let updated = 0;
    let markedDeleted = 0;
    const results: Array<{ id: string; email: string; status: string; phone?: string; appointment_status?: string; start_time?: string; error?: string }> = [];

    // Handle check_appointment_status mode
    if (check_appointment_status && submission_ids && submission_ids.length > 0) {
      for (const submission of submissions) {
        const response = submission.ghl_response as Record<string, unknown> | null;
        const appointmentId = (response?.appointment_id as string | undefined) || undefined;

        if (!appointmentId) {
          results.push({ id: submission.id, email: submission.lead_email, status: 'no_appointment_id', error: 'No appointment ID found' });
          continue;
        }

        const appointmentResult = await fetchAppointmentById(appointmentId, ghlApiKey);
        
        if (!appointmentResult.exists) {
          // Appointment was deleted
          const existingResponse = response || {};
          const updatedResponse = {
            ...existingResponse,
            deleted_at: new Date().toISOString(),
            deleted_reason: 'appointment_deleted',
            deleted_check_at: new Date().toISOString(),
            deleted_check_result: 'deleted',
          };

          await supabase
            .from('ghl_submissions')
            .update({ ghl_status: 'deleted_from_ghl', ghl_response: updatedResponse })
            .eq('id', submission.id);

          results.push({ 
            id: submission.id, 
            email: submission.lead_email, 
            status: 'deleted', 
            appointment_status: 'deleted' 
          });
          markedDeleted++;
          continue;
        }

        if (appointmentResult.error) {
          results.push({ 
            id: submission.id, 
            email: submission.lead_email, 
            status: 'check_failed', 
            error: appointmentResult.error 
          });
          continue;
        }

        // Extract appointment status from response
        // GHL API returns { appointment: { appointmentStatus, startTime, ... } }
        const appointmentData = appointmentResult.appointmentData;
        const appointment = (appointmentData?.appointment as Record<string, unknown>) || appointmentData;
        const apptStatus = (appointment?.appointmentStatus || appointment?.status || appointmentData?.appointmentStatus || appointmentData?.status || 'unknown') as string;
        const startTime = (appointment?.startTime || appointment?.start_time || appointmentData?.startTime || appointmentData?.start_time) as string | undefined;
        const endTime = (appointment?.endTime || appointment?.end_time) as string | undefined;
        const meetLink = (appointment?.address as string) || undefined; // GHL puts meet link in address field
        
        // Extract appointment title from response
        const appointmentTitle = appointmentResult.title || (appointment?.title || appointment?.name || appointment?.calendarName) as string | undefined;
        const calendarName = appointmentResult.calendarName || (appointment?.calendarName || appointment?.calendar_name) as string | undefined;

        // Update local status if it differs
        const currentStatus = submission.ghl_status || 'confirmed';
        let newStatus = currentStatus;

        if (apptStatus === 'cancelled' || apptStatus === 'canceled') {
          newStatus = 'cancelled';
        } else if (apptStatus === 'confirmed') {
          newStatus = 'confirmed';
        } else if (apptStatus === 'rescheduled') {
          newStatus = 'rescheduled';
        }

        // Also fetch contact details to sync business name
        const contactId = (response?.ghl_contact_id as string | undefined) || undefined;
        let businessName: string | undefined;
        if (contactId) {
          const contactResult = await fetchContactById(contactId, ghlApiKey);
          if (contactResult.exists && contactResult.businessName) {
            businessName = contactResult.businessName;
          }
        }

        // Always update the record with latest data from GHL (start_time, meet_link, appointment_title, business_name, etc.)
        const existingResponse = response || {};
        const updatedResponse = {
          ...existingResponse,
          appointment_status_checked_at: new Date().toISOString(),
          appointment_status_from_ghl: apptStatus,
          start_time: startTime || existingResponse.start_time,
          end_time: endTime || existingResponse.end_time,
          // Store appointment title for meeting categorization
          appointment_title: appointmentTitle || existingResponse.appointment_title,
          calendar_name: calendarName || existingResponse.calendar_name,
          // Update meet_link if we got one from GHL (stored in address field)
          ...(meetLink && meetLink.includes('meet.google.com') ? { meet_link: meetLink } : {}),
          // Sync business name if available
          ...(businessName ? { 
            ghl_business_name: businessName,
            ghl_company_synced: true,
            ghl_company_synced_at: new Date().toISOString(),
          } : {}),
        };

        const statusChanged = newStatus !== currentStatus;
        const dataUpdated = startTime || endTime || meetLink || appointmentTitle || businessName;

        const updatePayload: Record<string, unknown> = { ghl_response: updatedResponse };
        
        if (statusChanged || dataUpdated) {
          if (statusChanged) {
            updatePayload.ghl_status = newStatus;
          }
          // Also update the top-level meet_link field if we have a new one
          if (meetLink && meetLink.includes('meet.google.com')) {
            updatePayload.meet_link = meetLink;
          }
          // Update lead_company if business name was synced and not already set
          if (businessName && !(submission as Record<string, unknown>).lead_company) {
            updatePayload.lead_company = businessName;
          }

          await supabase
            .from('ghl_submissions')
            .update(updatePayload)
            .eq('id', submission.id);

          updated++;
        }

        results.push({ 
          id: submission.id, 
          email: submission.lead_email, 
          status: statusChanged ? 'updated' : 'checked', 
          appointment_status: apptStatus,
          start_time: startTime,
        });

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 120));
      }

      return new Response(
        JSON.stringify({ 
          checked: results.length,
          updated,
          markedDeleted,
          results,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle sync_business_names mode - fetch business names from GHL for contacts missing them
    if (sync_business_names) {
      // Filter to contacts that have ghl_contact_id but missing business name
      const needsBusinessName = submissions.filter((s) => {
        const response = s.ghl_response as Record<string, unknown> | null;
        const hasContactId = !!(response?.ghl_contact_id as string | undefined);
        const hasBusinessName = !!(response?.ghl_business_name || (s as Record<string, unknown>).lead_company);
        // Only process if we have a contact ID but no business name
        return hasContactId && !hasBusinessName && s.ghl_status !== 'deleted_from_ghl';
      });

      console.log(`${needsBusinessName.length} contacts need business name sync`);

      let businessNamesSynced = 0;
      for (const submission of needsBusinessName) {
        const response = submission.ghl_response as Record<string, unknown> | null;
        const contactId = response?.ghl_contact_id as string;

        // Fetch full contact details from GHL
        const contactResult = await fetchContactById(contactId, ghlApiKey);
        
        if (contactResult.exists && contactResult.businessName) {
          // Update the submission with business name from GHL
          const existingResponse = response || {};
          const updatedResponse = {
            ...existingResponse,
            ghl_business_name: contactResult.businessName,
            ghl_company_synced: true,
            ghl_company_synced_at: new Date().toISOString(),
          };

          const updatePayload: Record<string, unknown> = {
            ghl_response: updatedResponse,
          };

          // Also update lead_company if not already set
          if (!(submission as Record<string, unknown>).lead_company) {
            updatePayload.lead_company = contactResult.businessName;
          }

          const { error: updateError } = await supabase
            .from('ghl_submissions')
            .update(updatePayload)
            .eq('id', submission.id);

          if (!updateError) {
            businessNamesSynced++;
            results.push({ 
              id: submission.id, 
              email: submission.lead_email, 
              status: 'business_name_synced',
            });
            console.log(`Synced business name "${contactResult.businessName}" for ${submission.lead_email}`);
          } else {
            results.push({ 
              id: submission.id, 
              email: submission.lead_email, 
              status: 'update_failed',
              error: updateError.message,
            });
          }
        } else if (!contactResult.exists) {
          results.push({ 
            id: submission.id, 
            email: submission.lead_email, 
            status: 'contact_not_found',
          });
        } else {
          results.push({ 
            id: submission.id, 
            email: submission.lead_email, 
            status: 'no_business_name_in_ghl',
          });
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 120));
      }

      return new Response(
        JSON.stringify({ 
          checked: needsBusinessName.length,
          synced: businessNamesSynced,
          results,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process deletion checks / repair checks first
    for (const submission of needsDeletionCheck) {
      const response = submission.ghl_response as Record<string, unknown> | null;

      // Use the unified dual-check function
      const checkResult = await checkExistsInGHL(
        { lead_email: submission.lead_email, ghl_response: response },
        ghlApiKey,
        ghlLocationId
      );

      // If we had an API error (rate limit/auth/etc), do NOT mark deleted.
      if (checkResult.error) {
        const existingResponse = (submission.ghl_response as Record<string, unknown>) || {};
        const updatedResponse = {
          ...existingResponse,
          deleted_check_error: checkResult.error,
          deleted_check_error_at: new Date().toISOString(),
          deleted_check_status: checkResult.status,
          deleted_check_at: new Date().toISOString(),
          deleted_check_result: 'error',
        };
        await supabase
          .from('ghl_submissions')
          .update({ ghl_response: updatedResponse })
          .eq('id', submission.id);

        results.push({ id: submission.id, email: submission.lead_email, status: 'check_failed' });
        await new Promise(resolve => setTimeout(resolve, 120));
        continue;
      }

      // If no identifier available, skip but record the check
      if (checkResult.exists === null && checkResult.reason === 'no_identifier') {
        const existingResponse = (submission.ghl_response as Record<string, unknown>) || {};
        const updatedResponse = {
          ...existingResponse,
          deleted_check_at: new Date().toISOString(),
          deleted_check_result: 'no_identifier',
        };
        await supabase
          .from('ghl_submissions')
          .update({ ghl_response: updatedResponse })
          .eq('id', submission.id);

        results.push({ id: submission.id, email: submission.lead_email, status: 'no_identifier' });
        await new Promise(resolve => setTimeout(resolve, 120));
        continue;
      }

      // In repair mode, restore if it still exists.
      if (repair_deleted && checkResult.exists === true) {
        // Find the last recorded previous_status from meeting_history
        const { data: hist } = await supabase
          .from('meeting_history')
          .select('previous_status, created_at')
          .eq('meeting_id', submission.id)
          .eq('event_type', 'contact_deleted')
          .order('created_at', { ascending: false })
          .limit(1);

        const previousStatus = hist?.[0]?.previous_status || 'confirmed';
        const existingResponse = (submission.ghl_response as Record<string, unknown>) || {};
        const repairedResponse = {
          ...existingResponse,
          repaired_at: new Date().toISOString(),
          repaired_reason: 'contact_exists_in_ghl',
          deleted_at: undefined,
          deleted_reason: undefined,
          deleted_check_type: undefined,
          deleted_check_error: undefined,
          deleted_check_error_at: undefined,
          deleted_check_status: undefined,
          deleted_check_at: new Date().toISOString(),
          deleted_check_result: 'exists',
        };

        const { error: repairErr } = await supabase
          .from('ghl_submissions')
          .update({ ghl_status: previousStatus, ghl_response: repairedResponse })
          .eq('id', submission.id);

        if (repairErr) {
          results.push({ id: submission.id, email: submission.lead_email, status: 'repair_failed' });
        } else {
          results.push({ id: submission.id, email: submission.lead_email, status: 'repaired' });
        }

        await new Promise(resolve => setTimeout(resolve, 120));
        continue;
      }

      // Normal delete-audit: only mark deleted when we are definitively sure it does not exist.
      if (!repair_deleted && checkResult.exists === false) {
        // Contact/appointment no longer exists in GHL - mark as deleted
        const existingResponse = (submission.ghl_response as Record<string, unknown>) || {};
        const updatedResponse = {
          ...existingResponse,
          deleted_at: new Date().toISOString(),
          deleted_reason: checkResult.reason, // 'contact_deleted' or 'appointment_deleted' or 'email_not_found'
          deleted_check_type: scheduled_run ? 'scheduled_audit' : 'manual_verification',
          deleted_check_at: new Date().toISOString(),
          deleted_check_result: 'deleted',
          previous_contact_id: existingResponse.ghl_contact_id,
          previous_appointment_id: existingResponse.appointment_id,
        };

        const { error: updateError } = await supabase
          .from('ghl_submissions')
          .update({
            ghl_status: 'deleted_from_ghl',
            ghl_response: updatedResponse,
          })
          .eq('id', submission.id);

        const deletionNotes = checkResult.reason === 'appointment_deleted'
          ? 'Appointment no longer exists in GHL (detected via verification check)'
          : 'Contact no longer exists in GHL (detected via verification check)';

        if (updateError) {
          console.error(`Error marking submission ${submission.id} as deleted:`, updateError);
          results.push({ id: submission.id, email: submission.lead_email, status: 'update_failed' });
        } else {
          markedDeleted++;
          results.push({ 
            id: submission.id, 
            email: submission.lead_email, 
            status: 'marked_deleted',
          });
          console.log(`Marked submission ${submission.id} as deleted from GHL (reason: ${checkResult.reason})`);

          // Log to meeting history
          await supabase.from('meeting_history').insert({
            meeting_id: submission.id,
            meeting_type: 'demo',
            event_type: 'contact_deleted',
            previous_status: submission.ghl_status,
            new_status: 'deleted_from_ghl',
            notes: deletionNotes,
          });
        }
      } else if (checkResult.exists === true) {
        // Contact/appointment still exists - update check timestamp
        const existingResponse = (submission.ghl_response as Record<string, unknown>) || {};
        const updatedResponse = {
          ...existingResponse,
          deleted_check_at: new Date().toISOString(),
          deleted_check_result: 'exists',
        };
        await supabase
          .from('ghl_submissions')
          .update({ ghl_response: updatedResponse })
          .eq('id', submission.id);

        results.push({ id: submission.id, email: submission.lead_email, status: 'still_exists' });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 120));
    }

    // Process regular verifications
    for (const submission of needsVerification) {
      const searchResult = await searchContactByEmail(
        submission.lead_email,
        ghlApiKey,
        ghlLocationId
      );

      if (searchResult.found && searchResult.contactId) {
        verified++;
        
        // Build updated ghl_response - including business name from GHL
        const existingResponse = (submission.ghl_response as Record<string, unknown>) || {};
        const updatedResponse = {
          ...existingResponse,
          ghl_synced: true,
          ghl_verified: true,
          ghl_contact_id: searchResult.contactId,
          verified_at: new Date().toISOString(),
          verification_type: 'auto_check',
          // Store business name from GHL for display in admin panel
          ...(searchResult.businessName && {
            ghl_business_name: searchResult.businessName,
            ghl_company_synced: true,
            ghl_company_synced_at: new Date().toISOString(),
          }),
        };

        // Update phone if we got it from GHL and don't have it locally
        const updateData: Record<string, unknown> = {
          ghl_response: updatedResponse,
          ghl_status: submission.ghl_status === 'submitted' ? 'synced' : submission.ghl_status,
        };

        // Update phone from GHL if available and not already set
        if (searchResult.phone && !submission.lead_phone) {
          updateData.lead_phone = searchResult.phone;
        }

        // Update lead_company from GHL business name if not already set
        if (searchResult.businessName && !(submission as Record<string, unknown>).lead_company) {
          updateData.lead_company = searchResult.businessName;
        }

        const { error: updateError } = await supabase
          .from('ghl_submissions')
          .update(updateData)
          .eq('id', submission.id);

        if (updateError) {
          console.error(`Error updating submission ${submission.id}:`, updateError);
          results.push({ id: submission.id, email: submission.lead_email, status: 'update_failed' });
        } else {
          updated++;
          results.push({ 
            id: submission.id, 
            email: submission.lead_email, 
            status: 'verified',
            phone: searchResult.phone,
          });
          console.log(`Updated submission ${submission.id} as verified in GHL (businessName: ${searchResult.businessName || 'none'})`);
        }
      } else {
        results.push({ id: submission.id, email: submission.lead_email, status: 'not_found' });
        console.log(`Contact not found in GHL for ${submission.lead_email}`);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const totalChecked = needsVerification.length + needsDeletionCheck.length;
    console.log(`Verification complete: ${verified} found, ${updated} updated, ${markedDeleted} marked deleted`);

    return new Response(
      JSON.stringify({
        checked: totalChecked,
        verified,
        updated,
        markedDeleted,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in verify-ghl-sync:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
