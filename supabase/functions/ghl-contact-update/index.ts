import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { ghlFetch, GHL_LOCATION_ID, GHL_V3, SupabaseClientAny } from "../_shared/ghlClient.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GHLContactUpdatePayload {
  // GHL workflow webhook format - flat structure
  contact_id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  phone?: string;
  assigned_to?: string;
  assignedTo?: string;
  
  // Nested contact object (some webhook formats)
  contact?: {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    companyName?: string;
    businessName?: string;
    phone?: string;
    assignedTo?: string;
  };
  
  // Custom data mapping from GHL workflow
  customData?: {
    contactId?: string;
    'contact.email'?: string;
    'contact.firstName'?: string;
    'contact.lastName'?: string;
    'contact.businessName'?: string;
    'contact.phone'?: string;
    'contact.assignedTo'?: string;
  };
  
  // Legacy format
  contactId?: string;
  locationId?: string;
  type?: string;
}

interface SyncResult {
  table: string;
  count: number;
  ids?: string[];
}

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };

/**
 * Retry a database operation a few times with backoff.
 *
 * We now answer GoHighLevel before doing this work, so GHL will not retry for
 * us — that is the point, it was retrying far too aggressively. Owning the
 * retry here means a transient statement timeout self-heals instead of either
 * being lost or triggering another inbound flood.
 */
async function withRetry<T>(label: string, fn: () => PromiseLike<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(`[GHL-CONTACT-UPDATE] ${label} failed (attempt ${i}/${attempts}):`, err);
      if (i < attempts) await new Promise((r) => setTimeout(r, 400 * 2 ** (i - 1)));
    }
  }
  throw lastError;
}

async function processContactUpdate(
  supabase: SupabaseClientAny,
  contact: {
    contactEmail?: string;
    contactCompany?: string;
    contactFirstName?: string;
    contactLastName?: string;
    contactPhone?: string;
    contactId?: string;
    contactAssignedTo?: string;
  },
  payload: GHLContactUpdatePayload,
): Promise<void> {
  const { contactEmail, contactCompany, contactFirstName, contactLastName, contactPhone, contactId, contactAssignedTo } = contact;
    const emailLower = contactEmail ? contactEmail.toLowerCase() : null;
    const updates: SyncResult[] = [];
    const errors: string[] = [];
    const syncTimestamp = new Date().toISOString();

    // Build a PostgREST .or() filter matching by email OR ghl_contact_id.
    const buildOrFilter = (emailCol: string): string | null => {
      const parts: string[] = [];
      if (emailLower) parts.push(`${emailCol}.ilike.${emailLower}`);
      if (contactId) parts.push(`ghl_response->>ghl_contact_id.eq.${contactId}`);
      return parts.length ? parts.join(',') : null;
    };

    // Belt and braces. The handler already rejects a payload with neither an
    // email nor a contact id, so this should be unreachable — but if that check
    // is ever loosened, `buildOrFilter` would return null, the `.or()` would be
    // skipped, and the query below would run UNFILTERED across the table,
    // detoasting a jsonb column for every row. That is a bad enough failure to
    // be worth a guard that costs nothing.
    if (!emailLower && !contactId) {
      console.warn('[GHL-CONTACT-UPDATE] No email or contact id in payload — skipping sync');
      return;
    }

    // Safety cap: a match set this large means the filter is wrong, not that
    // thousands of records legitimately need the same update.
    const MATCH_LIMIT = 200;

    // ===== SYNC TO GHL_SUBMISSIONS (includes Meetings) =====
    // This covers both form submissions and calendar bookings
    try {
      const orFilter = buildOrFilter('lead_email');
      let query = supabase.from('ghl_submissions').select('id, ghl_response').limit(MATCH_LIMIT);
      if (orFilter) query = query.or(orFilter);
      const { data: rawSubs, error: ghlFetchError } = await withRetry('read ghl_submissions', () => query);

      // Dedupe by id in case both clauses hit the same row.
      const ghlSubmissions = rawSubs
        ? Array.from(new Map(rawSubs.map((r) => [r.id, r])).values())
        : [];

      // The cap is a safety net, not a paging mechanism — there is no ORDER BY,
      // so hitting it means an arbitrary subset got updated. Real worst case in
      // this data is 12 rows for one contact, so this should never fire; if it
      // does, the filter is wrong and we want to know rather than guess later.
      if ((rawSubs?.length ?? 0) >= MATCH_LIMIT) {
        console.warn(`[GHL-CONTACT-UPDATE] ghl_submissions match hit the ${MATCH_LIMIT}-row cap — filter is probably too broad`);
      }


      if (ghlFetchError) {
        console.error('[GHL-CONTACT-UPDATE] Error fetching ghl_submissions:', ghlFetchError);
        errors.push(`ghl_submissions fetch: ${ghlFetchError.message}`);
      } else if (ghlSubmissions && ghlSubmissions.length > 0) {
        const updatedIds: string[] = [];
        
        for (const submission of ghlSubmissions) {
          const existingResponse = (submission.ghl_response as Record<string, unknown>) || {};
          
          // Determine if business name was explicitly provided (even if empty/null for deletion)
          const hasBusinessNameField = payload.customData?.['contact.businessName'] !== undefined ||
            payload.company_name !== undefined ||
            payload.contact?.businessName !== undefined ||
            payload.contact?.company !== undefined ||
            payload.contact?.companyName !== undefined;
          
          // If business name field was provided, use it (allows clearing/deletion)
          // Otherwise preserve existing value
          const businessNameValue = hasBusinessNameField 
            ? (contactCompany || null)  // null for deletion
            : existingResponse.ghl_business_name;
          
          const updateData: Record<string, unknown> = {
            ghl_response: {
              ...existingResponse,
              ghl_contact_id: contactId || existingResponse.ghl_contact_id,
              ghl_business_name: businessNameValue,
              ghl_company_synced: hasBusinessNameField ? true : existingResponse.ghl_company_synced,
              ghl_company_synced_at: hasBusinessNameField ? syncTimestamp : existingResponse.ghl_company_synced_at,
              ghl_first_name: contactFirstName || existingResponse.ghl_first_name,
              ghl_last_name: contactLastName || existingResponse.ghl_last_name,
              ghl_phone: contactPhone || existingResponse.ghl_phone,
              last_synced_at: syncTimestamp,
            },
          };
          
          // Also update lead_company if business name was updated
          if (hasBusinessNameField) {
            updateData.lead_company = contactCompany || null;
          }
          
          // Also update name/phone fields directly if provided
          if (contactFirstName) updateData.lead_first_name = contactFirstName;
          if (contactLastName) updateData.lead_last_name = contactLastName;
          if (contactPhone) updateData.lead_phone = contactPhone;
          
          const { error: updateError } = await withRetry('update ghl_submissions', () => supabase
            .from('ghl_submissions')
            .update(updateData)
            .eq('id', submission.id));

          if (updateError) {
            console.error(`[GHL-CONTACT-UPDATE] Error updating ghl_submission ${submission.id}:`, updateError);
            errors.push(`ghl_submission ${submission.id}: ${updateError.message}`);
          } else {
            updatedIds.push(submission.id);
          }
        }
        
        if (updatedIds.length > 0) {
          updates.push({ table: 'ghl_submissions', count: updatedIds.length, ids: updatedIds });
          console.log(`[GHL-CONTACT-UPDATE] Updated ${updatedIds.length} ghl_submissions records`);
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('[GHL-CONTACT-UPDATE] ghl_submissions sync error:', errMsg);
      errors.push(`ghl_submissions: ${errMsg}`);
    }

    // ===== SYNC TO LEADS TABLE =====
    // Store GHL data in ghl_response JSONB, update name/phone fields
    try {
      const orFilter = buildOrFilter('email');
      let query = supabase.from('leads').select('id, ghl_response').limit(MATCH_LIMIT);
      if (orFilter) query = query.or(orFilter);
      const { data: rawLeads, error: leadsFetchError } = await withRetry('read leads', () => query);
      const existingLeads = rawLeads
        ? Array.from(new Map(rawLeads.map((r) => [r.id, r])).values())
        : [];

      if ((rawLeads?.length ?? 0) >= MATCH_LIMIT) {
        console.warn(`[GHL-CONTACT-UPDATE] leads match hit the ${MATCH_LIMIT}-row cap — filter is probably too broad`);
      }

      
      if (leadsFetchError) {
        console.error('[GHL-CONTACT-UPDATE] Error fetching leads:', leadsFetchError);
        errors.push(`leads fetch: ${leadsFetchError.message}`);
      } else if (existingLeads && existingLeads.length > 0) {
        const updatedIds: string[] = [];
        
        for (const lead of existingLeads) {
          const existingResponse = (lead.ghl_response as Record<string, unknown>) || {};
          
          // Determine if business name was explicitly provided (even if empty/null for deletion)
          const hasBusinessNameField = payload.customData?.['contact.businessName'] !== undefined ||
            payload.company_name !== undefined ||
            payload.contact?.businessName !== undefined ||
            payload.contact?.company !== undefined ||
            payload.contact?.companyName !== undefined;
          
          // If business name field was provided, use it (allows clearing/deletion)
          // Otherwise preserve existing value
          const businessNameValue = hasBusinessNameField 
            ? (contactCompany || null)  // null for deletion
            : existingResponse.ghl_business_name;
          
          const updateData: Record<string, unknown> = {
            ghl_response: {
              ...existingResponse,
              ghl_contact_id: contactId || existingResponse.ghl_contact_id,
              ghl_business_name: businessNameValue,
              ghl_company_synced: hasBusinessNameField ? true : existingResponse.ghl_company_synced,
              ghl_company_synced_at: hasBusinessNameField ? syncTimestamp : existingResponse.ghl_company_synced_at,
              ghl_first_name: contactFirstName || existingResponse.ghl_first_name,
              ghl_last_name: contactLastName || existingResponse.ghl_last_name,
              ghl_phone: contactPhone || existingResponse.ghl_phone,
              last_synced_at: syncTimestamp,
            },
          };
          
          // Also update company field if business name was updated
          if (hasBusinessNameField) {
            updateData.company = contactCompany || null;
          }
          
          // Also update name/phone fields directly if provided
          if (contactFirstName) updateData.first_name = contactFirstName;
          if (contactLastName) updateData.last_name = contactLastName;
          if (contactPhone) updateData.phone = contactPhone;
          
          const { error: updateError } = await withRetry('update leads', () => supabase
            .from('leads')
            .update(updateData)
            .eq('id', lead.id));
          
          if (updateError) {
            console.error(`[GHL-CONTACT-UPDATE] Error updating lead ${lead.id}:`, updateError);
            errors.push(`lead ${lead.id}: ${updateError.message}`);
          } else {
            updatedIds.push(lead.id);
          }
        }
        
        if (updatedIds.length > 0) {
          updates.push({ table: 'leads', count: updatedIds.length, ids: updatedIds });
          console.log(`[GHL-CONTACT-UPDATE] Updated ${updatedIds.length} leads records`);
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('[GHL-CONTACT-UPDATE] leads sync error:', errMsg);
      errors.push(`leads: ${errMsg}`);
    }

    // ===== OWNER SYNC (GHL → us) =====
    // Only runs when the payload actually carried an assignedTo, so a plain
    // contact edit does not pay for the extra /users call.
    if (contactAssignedTo) {
      try {
        const apiKey = Deno.env.get('GHL_API_KEY');
        if (!apiKey) {
          console.warn('[GHL-CONTACT-UPDATE] GHL_API_KEY missing — owner not synced');
        } else {
          const res = await ghlFetch(`/users/?locationId=${GHL_LOCATION_ID}`, { apiKey, version: GHL_V3 });
          if (!res.ok) {
            console.warn(`[GHL-CONTACT-UPDATE] GHL /users ${res.status} — owner not synced`);
          } else {
            const parsed: any = await res.json().catch(() => null);
            const ghlUsers: any[] = Array.isArray(parsed?.users) ? parsed.users : Array.isArray(parsed) ? parsed : [];
            const match = ghlUsers.find((u) => String(u?.id || u?._id || '') === contactAssignedTo);
            const ownerEmail = String(match?.email || '').trim().toLowerCase();

            if (!ownerEmail) {
              // Unknown owner is not the same as no owner — leave it alone.
              console.warn(`[GHL-CONTACT-UPDATE] GHL user ${contactAssignedTo} has no email — owner left unchanged`);
            } else {
              const { data: adminRow } = await supabase
                .from('admin_users')
                .select('id')
                .ilike('email', ownerEmail)
                .maybeSingle();
              const ownerId = (adminRow as { id?: string } | null)?.id ?? null;

              if (!ownerId) {
                console.warn(`[GHL-CONTACT-UPDATE] GHL user ${contactAssignedTo} (${ownerEmail}) is not an admin_user — owner left unchanged`);
              } else {
                // Reuse the rows this function already matched — no second lookup.
                const refs = updates.flatMap((u) => (u.ids ?? []).map((id) => ({ source: u.table, id })));
                if (refs.length === 0) {
                  console.log('[GHL-CONTACT-UPDATE] No matched leads for owner sync');
                } else {
                  const { data: existingAnns } = await supabase
                    .from('lead_annotations')
                    .select('lead_source, lead_id, owner_source')
                    .in('lead_id', refs.map((r) => r.id));
                  const manual = new Set(
                    ((existingAnns ?? []) as { lead_source: string; lead_id: string; owner_source: string | null }[])
                      .filter((a) => a.owner_source === 'manual')
                      .map((a) => `${a.lead_source}::${a.lead_id}`),
                  );

                  const rows = refs.filter((r) => {
                    if (manual.has(`${r.source}::${r.id}`)) {
                      console.log(`[GHL-CONTACT-UPDATE] Skipping ${r.source}/${r.id} — owner set manually`);
                      return false;
                    }
                    return true;
                  }).map((r) => ({
                    lead_source: r.source,
                    lead_id: r.id,
                    owner_id: ownerId,
                    owner_source: 'ghl',
                    updated_at: syncTimestamp,
                  }));

                  if (rows.length) {
                    const { error: ownerErr } = await withRetry('upsert lead_annotations owner', () =>
                      supabase.from('lead_annotations').upsert(rows, { onConflict: 'lead_source,lead_id' }));
                    if (ownerErr) {
                      console.error('[GHL-CONTACT-UPDATE] owner upsert failed:', ownerErr);
                      errors.push(`owner sync: ${ownerErr.message}`);
                    } else {
                      console.log(`[GHL-CONTACT-UPDATE] Owner synced from GHL for ${rows.length} lead(s) → ${ownerEmail}`);
                    }
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error('[GHL-CONTACT-UPDATE] owner sync error:', errMsg);
        errors.push(`owner sync: ${errMsg}`);
      }
    }


    // ===== LOG TO GHL_SYNC_HISTORY =====
    // Record this sync event for audit trail
    try {
      const totalUpdates = updates.reduce((sum, u) => sum + u.count, 0);
      
      await withRetry('insert ghl_sync_history', () => supabase
        .from('ghl_sync_history')
        .insert({
          lead_email: emailLower,
          ghl_contact_id: contactId || null,
          sync_status: totalUpdates > 0 ? 'success' : 'no_match',
          sync_type: 'contact_update',
          ghl_response: {
            updates,
            errors: errors.length > 0 ? errors : undefined,
            business_name: contactCompany || null,
            first_name: contactFirstName || null,
            last_name: contactLastName || null,
            phone: contactPhone || null,
            synced_at: syncTimestamp,
          },
          error_message: errors.length > 0 ? errors.join('; ') : null,
        }));
      
      console.log('[GHL-CONTACT-UPDATE] Logged sync to ghl_sync_history');
    } catch (historyError) {
      console.warn('[GHL-CONTACT-UPDATE] Failed to log to ghl_sync_history:', historyError);
    }

    const totalUpdates = updates.reduce((sum, u) => sum + u.count, 0);

    console.log('[GHL-CONTACT-UPDATE] Sync complete:', JSON.stringify({ updates, totalUpdates, errors }));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Mirror ghl-webhook: verify a shared secret when configured, so anonymous
    // callers cannot overwrite lead records by knowing an email. Non-breaking:
    // if GHL_WEBHOOK_SECRET is unset we log a warning and proceed (existing
    // behaviour). Once the secret is set, only signed requests are accepted.
    const webhookSecret = Deno.env.get('GHL_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.warn('[GHL-CONTACT-UPDATE] GHL_WEBHOOK_SECRET not configured - processing without signature verification');
    } else {
      const url = new URL(req.url);
      const providedSecret = req.headers.get('x-ghl-signature')
        ?? req.headers.get('x-webhook-secret')
        ?? url.searchParams.get('secret');
      if (providedSecret !== webhookSecret) {
        console.error('[GHL-CONTACT-UPDATE] Invalid or missing GHL webhook secret');
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Log raw body first to debug GHL payload structure
    const rawBody = await req.text();
    console.log('[GHL-CONTACT-UPDATE] Raw request body:', rawBody);

    let payload: GHLContactUpdatePayload;
    try {
      payload = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('[GHL-CONTACT-UPDATE] Failed to parse JSON:', parseError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    
    // Extract data with multiple fallback paths for different GHL webhook formats
    // Priority: customData (mapped fields) > flat root fields > nested contact object
    const contactEmail = 
      payload.customData?.['contact.email'] || 
      payload.email || 
      payload.contact?.email;
    
    const contactCompany = 
      payload.customData?.['contact.businessName'] || 
      payload.company_name || 
      payload.contact?.businessName || 
      payload.contact?.company || 
      payload.contact?.companyName;
    
    const contactFirstName = 
      payload.customData?.['contact.firstName'] || 
      payload.first_name || 
      payload.contact?.firstName;
    
    const contactLastName = 
      payload.customData?.['contact.lastName'] || 
      payload.last_name || 
      payload.contact?.lastName;
    
    const contactPhone = 
      payload.customData?.['contact.phone'] || 
      payload.phone || 
      payload.contact?.phone;
    
    const contactId = 
      payload.customData?.contactId || 
      payload.contact_id || 
      payload.contactId;

    // Owner (GHL → us). Read as tolerantly as the fields above; when absent we
    // say so plainly so real traffic tells us whether GHL sends it at all.
    const contactAssignedTo = String(
      payload.customData?.['contact.assignedTo'] ||
      payload.assignedTo ||
      payload.contact?.assignedTo ||
      payload.assigned_to ||
      '',
    ).trim() || undefined;

    if (!contactAssignedTo) {
      console.log(
        '[GHL-CONTACT-UPDATE] payload carries no assignedTo — owner not synced',
        JSON.stringify(Object.keys(payload)),
      );
    }
    
    console.log('[GHL-CONTACT-UPDATE] Extracted data:', JSON.stringify({
      contactId,
      email: contactEmail,
      businessName: contactCompany,
      firstName: contactFirstName,
      lastName: contactLastName,
      phone: contactPhone,
    }));

    if (!contactEmail && !contactId) {
      console.log('[GHL-CONTACT-UPDATE] No email or contact id in payload, cannot match records');
      return new Response(
        JSON.stringify({ success: false, error: 'No contact email or id provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Answer GoHighLevel immediately and finish the work in the background.
    //
    // Previously we did all the database work first, so a slow query became a
    // 503 to GHL, GHL retried, and a burst turned into a storm — while the
    // update it was carrying was lost. 202 tells GHL "received"; the retries
    // that matter now happen inside processContactUpdate, under our control.
    EdgeRuntime.waitUntil(
      processContactUpdate(supabase, {
        contactEmail, contactCompany, contactFirstName, contactLastName, contactPhone, contactId, contactAssignedTo,
      }, payload).catch((err) => {
        console.error('[GHL-CONTACT-UPDATE] Background sync failed after retries:', err);
      }),
    );

    return new Response(
      JSON.stringify({ success: true, accepted: true, contactId: contactId ?? null }),
      { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );


  } catch (error) {
    console.error('[GHL-CONTACT-UPDATE] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
