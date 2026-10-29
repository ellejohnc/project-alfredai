import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { fetchFromAllowedHost, GHL_FETCH_HOSTS, timingSafeEqual } from "../_shared/requestGuards.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-ghl-signature, x-webhook-secret',
};

interface GHLAttachment {
  url?: string;
  name?: string;
  contentType?: string;
  fileName?: string;  // Alternative field name GHL uses
  fileUrl?: string;   // Alternative field name GHL uses
  mimeType?: string;  // Alternative field name GHL uses
}

interface GHLWebhookPayload {
  type?: string;
  eventType?: string;  // Some GHL events use eventType instead of type
  message?: {
    id?: string;
    type?: string;
    direction?: string;
    contentType?: string;
    body?: string;
    attachments?: GHLAttachment[];
  };
  // Direct file upload events
  file?: GHLAttachment;
  files?: GHLAttachment[];
  attachment?: GHLAttachment;
  attachments?: GHLAttachment[];
  contactId?: string;
  contact?: {
    id?: string;
    email?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    company?: string;       // Company name from GHL contact
    companyName?: string;   // Alternative field name GHL uses
    businessName?: string;  // GHL's primary company field
  };
  locationId?: string;
  // Note events can also contain files
  note?: {
    id?: string;
    body?: string;
    attachments?: GHLAttachment[];
  };
  // Make.com additional fields
  unmatched?: boolean;
  extractedName?: string;
}

// Normalize attachment to standard format
function normalizeAttachment(att: GHLAttachment): { url: string; name: string; contentType: string | null } | null {
  const url = att.url || att.fileUrl;
  const name = att.name || att.fileName;
  const contentType = att.contentType || att.mimeType || null;
  
  if (!url || !name) return null;
  return { url, name, contentType };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the webhook with the shared secret BEFORE processing (fail closed),
    // matching ghl-webhook / ghl-contact-update.
    const webhookSecret = Deno.env.get('GHL_WEBHOOK_SECRET');
    const reqUrl = new URL(req.url);
    const providedSecret = req.headers.get('x-ghl-signature')
      ?? req.headers.get('x-webhook-secret')
      ?? reqUrl.searchParams.get('secret')
      ?? '';
    if (!webhookSecret) {
      // Fail closed, but make the reason unmistakable in the logs — this is a
      // deployment problem, not an attacker.
      console.error('[GHL-FILE-WEBHOOK] MISCONFIGURED: GHL_WEBHOOK_SECRET is not set — rejecting all calls until it is.');
      return new Response(
        JSON.stringify({ success: false, error: 'Webhook secret not configured on the server.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (!providedSecret || !timingSafeEqual(providedSecret, webhookSecret)) {
      console.error('[GHL-FILE-WEBHOOK] Rejected: invalid webhook secret');
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }


    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: GHLWebhookPayload = await req.json();
    
    console.log('[GHL-FILE-WEBHOOK] Received event:', JSON.stringify({
      type: payload.type,
      eventType: payload.eventType,
      messageType: payload.message?.type,
      hasMessageAttachments: !!(payload.message?.attachments?.length),
      hasDirectFile: !!(payload.file),
      hasDirectFiles: !!(payload.files?.length),
      hasAttachments: !!(payload.attachments?.length),
      hasNoteAttachments: !!(payload.note?.attachments?.length),
      contactId: payload.contactId,
    }));

    // Collect all attachments from various possible locations in the payload
    const rawAttachments: GHLAttachment[] = [];
    
    // From message.attachments (InboundMessage events)
    if (payload.message?.attachments?.length) {
      rawAttachments.push(...payload.message.attachments);
    }
    
    // From direct file/files fields (file upload events)
    if (payload.file) {
      rawAttachments.push(payload.file);
    }
    if (payload.files?.length) {
      rawAttachments.push(...payload.files);
    }
    
    // From direct attachments field
    if (payload.attachments?.length) {
      rawAttachments.push(...payload.attachments);
    }
    
    // From attachment field (singular)
    if (payload.attachment) {
      rawAttachments.push(payload.attachment);
    }
    
    // From note.attachments (note events with files)
    if (payload.note?.attachments?.length) {
      rawAttachments.push(...payload.note.attachments);
    }

    // Normalize all attachments
    const allAttachments = rawAttachments
      .map(normalizeAttachment)
      .filter((a): a is NonNullable<typeof a> => a !== null);

    if (allAttachments.length === 0) {
      console.log('[GHL-FILE-WEBHOOK] No valid attachments found in payload');
      return new Response(
        JSON.stringify({ success: true, message: 'No attachments to process' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contactId = payload.contactId || payload.contact?.id;
    const contactEmail = payload.contact?.email;
    const contactCompany = payload.contact?.businessName || payload.contact?.company || payload.contact?.companyName;
    const contactName = payload.contact?.name || 
      (payload.contact?.firstName && payload.contact?.lastName 
        ? `${payload.contact.firstName} ${payload.contact.lastName}` 
        : null);
    const isUnmatched = payload.unmatched === true;
    const extractedName = payload.extractedName;

    if (!contactId) {
      console.log('[GHL-FILE-WEBHOOK] No contact ID in payload');
      return new Response(
        JSON.stringify({ success: false, error: 'No contact ID provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use message ID or note ID or generate a unique identifier
    const eventId = payload.message?.id || payload.note?.id || `ghl-${Date.now()}`;
    const processedFiles: string[] = [];
    const errors: string[] = [];

    // Try to match contact to an existing meeting using multiple strategies
    let meetingId: string | null = null;
    let meetingType: string = 'pending_match';
    let matchMethod: string | null = null;

    // Normalize name for comparison
    const normalizeName = (name: string): string => name.toLowerCase().replace(/\s+/g, ' ').trim();
    
    // Check if two names match (fuzzy)
    const namesMatch = (name1: string, name2: string): boolean => {
      const n1 = normalizeName(name1);
      const n2 = normalizeName(name2);
      if (!n1 || !n2) return false;
      if (n1 === n2) return true;
      if (n1.includes(n2) || n2.includes(n1)) return true;
      // Check name parts
      const parts1 = n1.split(' ');
      const parts2 = n2.split(' ');
      for (const p1 of parts1) {
        for (const p2 of parts2) {
          if (p1.length >= 3 && p2.length >= 3 && (p1.includes(p2) || p2.includes(p1))) {
            return true;
          }
        }
      }
      return false;
    };

    // Strategy 1: Match by email (highest priority)
    if (contactEmail) {
      // Check GHL submissions first
      const { data: ghlSubmission } = await supabase
        .from('ghl_submissions')
        .select('id')
        .ilike('lead_email', contactEmail)
        .in('ghl_status', ['confirmed', 'rescheduled'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ghlSubmission) {
        meetingId = ghlSubmission.id;
        meetingType = 'demo';
        matchMethod = 'ghl_contact_email';
        console.log(`[GHL-FILE-WEBHOOK] Matched to demo meeting by email: ${meetingId}`);
      } else {
        // Check investor leads
        const { data: investorLead } = await supabase
          .from('investor_leads')
          .select('id')
          .ilike('email', contactEmail)
          .limit(1)
          .maybeSingle();

        if (investorLead) {
          const { data: booking } = await supabase
            .from('investor_bookings')
            .select('id')
            .eq('investor_id', investorLead.id)
            .order('start_time', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (booking) {
            meetingId = booking.id;
            meetingType = 'investor';
            matchMethod = 'investor_email';
            console.log(`[GHL-FILE-WEBHOOK] Matched to investor booking by email: ${meetingId}`);
          }
        }
      }
    }

    // Strategy 2: Match by contact name (if no email match)
    if (!meetingId && contactName) {
      console.log(`[GHL-FILE-WEBHOOK] Attempting name match for: "${contactName}"`);
      
      // Search GHL submissions by name
      const { data: ghlByName } = await supabase
        .from('ghl_submissions')
        .select('id, lead_name, lead_first_name, lead_last_name')
        .in('ghl_status', ['confirmed', 'rescheduled'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (ghlByName && ghlByName.length > 0) {
        for (const submission of ghlByName) {
          const candidateNames: string[] = [];
          if (submission.lead_name) candidateNames.push(submission.lead_name);
          if (submission.lead_first_name) candidateNames.push(submission.lead_first_name);
          if (submission.lead_first_name && submission.lead_last_name) {
            candidateNames.push(`${submission.lead_first_name} ${submission.lead_last_name}`);
          }

          for (const candidate of candidateNames) {
            if (namesMatch(contactName, candidate)) {
              meetingId = submission.id;
              meetingType = 'demo';
              matchMethod = 'ghl_contact_name';
              console.log(`[GHL-FILE-WEBHOOK] Matched to demo meeting by name: "${contactName}" ≈ "${candidate}"`);
              break;
            }
          }
          if (meetingId) break;
        }
      }

      // Check investor leads by name
      if (!meetingId) {
        const { data: investorsByName } = await supabase
          .from('investor_leads')
          .select('id, full_name')
          .limit(50);

        if (investorsByName && investorsByName.length > 0) {
          for (const investor of investorsByName) {
            if (investor.full_name && namesMatch(contactName, investor.full_name)) {
              const { data: booking } = await supabase
                .from('investor_bookings')
                .select('id')
                .eq('investor_id', investor.id)
                .order('start_time', { ascending: false })
                .limit(1)
                .maybeSingle();

              if (booking) {
                meetingId = booking.id;
                meetingType = 'investor';
                matchMethod = 'investor_name';
                console.log(`[GHL-FILE-WEBHOOK] Matched to investor by name: "${contactName}" ≈ "${investor.full_name}"`);
                break;
              }
            }
          }
        }
      }
    }

    // Strategy 3: Match by business/company name
    if (!meetingId && contactCompany) {
      console.log(`[GHL-FILE-WEBHOOK] Attempting company match for: "${contactCompany}"`);
      
      // Search GHL submissions by company
      const { data: ghlByCompany } = await supabase
        .from('ghl_submissions')
        .select('id, lead_company')
        .ilike('lead_company', `%${contactCompany}%`)
        .in('ghl_status', ['confirmed', 'rescheduled'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ghlByCompany) {
        meetingId = ghlByCompany.id;
        meetingType = 'demo';
        matchMethod = 'ghl_company_name';
        console.log(`[GHL-FILE-WEBHOOK] Matched to demo meeting by company: "${contactCompany}" ≈ "${ghlByCompany.lead_company}"`);
      } else {
        // Also check ghl_response.ghl_business_name for synced company names
        const { data: ghlByGhlCompany } = await supabase
          .from('ghl_submissions')
          .select('id, ghl_response')
          .in('ghl_status', ['confirmed', 'rescheduled'])
          .order('created_at', { ascending: false })
          .limit(50);

        if (ghlByGhlCompany && ghlByGhlCompany.length > 0) {
          const normalizedSearch = contactCompany.toLowerCase().trim();
          for (const submission of ghlByGhlCompany) {
            const response = submission.ghl_response as { ghl_business_name?: string } | null;
            const ghlBizName = response?.ghl_business_name?.toLowerCase().trim();
            if (ghlBizName && (ghlBizName.includes(normalizedSearch) || normalizedSearch.includes(ghlBizName))) {
              meetingId = submission.id;
              meetingType = 'demo';
              matchMethod = 'ghl_synced_company';
              console.log(`[GHL-FILE-WEBHOOK] Matched to demo by GHL synced company: "${contactCompany}"`);
              break;
            }
          }
        }
      }

      // Check investor leads by firm name
      if (!meetingId) {
        const { data: investorByFirm } = await supabase
          .from('investor_leads')
          .select('id')
          .ilike('firm_name', `%${contactCompany}%`)
          .limit(1)
          .maybeSingle();

        if (investorByFirm) {
          const { data: booking } = await supabase
            .from('investor_bookings')
            .select('id')
            .eq('investor_id', investorByFirm.id)
            .order('start_time', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (booking) {
            meetingId = booking.id;
            meetingType = 'investor';
            matchMethod = 'investor_firm_name';
            console.log(`[GHL-FILE-WEBHOOK] Matched to investor by firm name: "${contactCompany}"`);
          }
        }
      }
    }

    // Update ghl_submissions with company from GHL contact if available
    // Store in both lead_company field AND ghl_response JSONB for consistency
    if (contactEmail && contactCompany) {
      const syncTimestamp = new Date().toISOString();
      
      // Get existing submissions to update ghl_response properly
      const { data: existingSubmissions } = await supabase
        .from('ghl_submissions')
        .select('id, ghl_response')
        .ilike('lead_email', contactEmail);
      
      if (existingSubmissions && existingSubmissions.length > 0) {
        for (const submission of existingSubmissions) {
          const existingResponse = (submission.ghl_response as Record<string, unknown>) || {};
          const updatePayload: Record<string, unknown> = {
            ghl_response: {
              ...existingResponse,
              ghl_contact_id: contactId || existingResponse.ghl_contact_id,
              ghl_business_name: contactCompany,
              ghl_company_synced: true,
              ghl_company_synced_at: syncTimestamp,
              last_synced_at: syncTimestamp,
              synced_via: 'ghl_file_webhook',
            },
          };
          
          // Only update lead_company if it's null
          if (!existingResponse.ghl_business_name) {
            updatePayload.lead_company = contactCompany;
          }
          
          const { error: updateError } = await supabase
            .from('ghl_submissions')
            .update(updatePayload)
            .eq('id', submission.id);
          
          if (!updateError) {
            console.log(`[GHL-FILE-WEBHOOK] Updated ghl_submission ${submission.id} with company: ${contactCompany}`);
          }
        }
      }
      
      // Also update leads table
      const { data: existingLeads } = await supabase
        .from('leads')
        .select('id, ghl_response')
        .ilike('email', contactEmail);
      
      if (existingLeads && existingLeads.length > 0) {
        for (const lead of existingLeads) {
          const existingResponse = (lead.ghl_response as Record<string, unknown>) || {};
          const { error: updateError } = await supabase
            .from('leads')
            .update({
              ghl_response: {
                ...existingResponse,
                ghl_contact_id: contactId || existingResponse.ghl_contact_id,
                ghl_business_name: contactCompany,
                ghl_company_synced: true,
                ghl_company_synced_at: syncTimestamp,
                last_synced_at: syncTimestamp,
                synced_via: 'ghl_file_webhook',
              },
            })
            .eq('id', lead.id);
          
          if (!updateError) {
            console.log(`[GHL-FILE-WEBHOOK] Updated lead ${lead.id} with company: ${contactCompany}`);
          }
        }
      }
    }

    // Process each attachment
    for (const attachment of allAttachments) {
      try {
        // Check for duplicate by event ID and file name
        const { data: existingDoc } = await supabase
          .from('meeting_documents')
          .select('id')
          .eq('metadata->>ghl_event_id', eventId)
          .eq('file_name', attachment.name)
          .limit(1)
          .maybeSingle();

        if (existingDoc) {
          console.log(`[GHL-FILE-WEBHOOK] Skipping duplicate: ${attachment.name}`);
          continue;
        }

        console.log(`[GHL-FILE-WEBHOOK] Processing attachment: ${attachment.name} from ${attachment.url}`);

        let fileResponse: Response;
        try {
          // Anti-SSRF: allowlist re-checked on every redirect hop.
          fileResponse = await fetchFromAllowedHost(attachment.url, GHL_FETCH_HOSTS);
        } catch (e) {
          console.warn('[GHL-FILE-WEBHOOK] Blocked or failed attachment download:', (e as Error).message);
          continue;
        }
        if (!fileResponse.ok) {
          throw new Error(`Failed to download file: ${fileResponse.status}`);
        }


        const fileBlob = await fileResponse.blob();
        const fileBuffer = await fileBlob.arrayBuffer();
        const fileData = new Uint8Array(fileBuffer);
        const fileSizeBytes = fileData.length;

        // Generate storage path
        const timestamp = Date.now();
        const sanitizedName = attachment.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `ghl-direct/${contactId}/${timestamp}_${sanitizedName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('meeting-documents')
          .upload(storagePath, fileData, {
            contentType: attachment.contentType || 'application/octet-stream',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        // Determine document type from filename/content type
        let documentType = 'notes';
        const lowerName = attachment.name.toLowerCase();
        if (lowerName.includes('transcript')) {
          documentType = 'transcript';
        } else if (lowerName.includes('recording') || attachment.contentType?.startsWith('video/')) {
          documentType = 'recording';
        } else if (lowerName.includes('summary')) {
          documentType = 'summary';
        }

        // Insert meeting document record
        const { error: insertError } = await supabase
          .from('meeting_documents')
          .insert({
            meeting_id: meetingId,
            meeting_type: meetingType,
            document_type: documentType,
            file_name: attachment.name,
            file_url: storagePath,
            file_size_bytes: fileSizeBytes,
            mime_type: attachment.contentType || null,
            source: 'ghl_direct',
            ghl_synced: true, // Already in GHL, so it's "synced"
            ghl_synced_at: new Date().toISOString(),
            ghl_sync_response: {
              sync_type: 'ghl_direct_import',
              ghl_contact_id: contactId,
              ghl_event_id: eventId,
              imported_at: new Date().toISOString(),
            },
            metadata: {
              ghl_event_id: eventId,
              ghl_message_id: payload.message?.id || null,
              ghl_note_id: payload.note?.id || null,
              ghl_contact_id: contactId,
              ghl_contact_email: contactEmail || null,
              ghl_contact_name: contactName || null,
              ghl_contact_company: contactCompany || null,
              original_url: attachment.url,
              match_method: matchMethod,
              confidence: meetingId ? (matchMethod?.includes('email') ? 'high' : 'medium') : null,
              is_unmatched: isUnmatched || (!meetingId),
              extracted_name: extractedName || null,
            },
          });

        if (insertError) {
          throw new Error(`Database insert failed: ${insertError.message}`);
        }

        processedFiles.push(attachment.name);
        console.log(`[GHL-FILE-WEBHOOK] Successfully processed: ${attachment.name}`);

      } catch (attachmentError) {
        const errorMessage = attachmentError instanceof Error ? attachmentError.message : String(attachmentError);
        console.error(`[GHL-FILE-WEBHOOK] Error processing ${attachment.name}:`, errorMessage);
        errors.push(`${attachment.name}: ${errorMessage}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${processedFiles.length} files from GHL`,
        processed: processedFiles,
        errors: errors.length > 0 ? errors : undefined,
        matched_meeting: meetingId ? { id: meetingId, type: meetingType } : null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[GHL-FILE-WEBHOOK] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
