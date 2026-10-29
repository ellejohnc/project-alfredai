import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { GHL_PIPELINES } from "../_shared/config.ts";
import { ensureOpportunity } from "../_shared/ghlOpportunity.ts";
import { GHL_V3 } from "../_shared/ghlClient.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QualificationData {
  role?: string;
  industry?: string;
  challenge?: string;
  size?: string;
  timeline?: string;
}

interface GHLSubmissionRequest {
  lead_email: string;
  lead_name?: string;
  lead_phone?: string;
  lead_company?: string;
  source_page: string;
  source_medium: string;
  source_campaign?: string;
  lead_source?: string; // chatbot, calendar_widget, form, personalization_flow
  ghl_status?: string;
  ghl_response?: Record<string, unknown>;
  qualification_data?: QualificationData;
  submission_id?: string; // For retry/update scenarios - update existing instead of creating new
  utm_data?: Record<string, string | undefined>;
  referrer?: string; // document.referrer — "what made them click"
  source_url?: string; // full window.location.href, not just pathname
  /** Browser visitor id, shared with demo_engagement.visitor_id so a demo lead
   *  can be joined to the engagement events that visitor produced. */
  visitor_id?: string;
}

/**
 * Normalize a phone number for cross-format matching: keep digits only, drop
 * a leading country code (1 for US/CA, 61 for AU) and keep the last 10 digits
 * so "(207) 715-0187" and "+12077150187" collapse to the same key.
 */
function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length > 10 && (digits.startsWith('1') || digits.startsWith('61'))) {
    digits = digits.replace(/^(61|1)/, '');
  }
  return digits.slice(-10) || null;
}

/**
 * Persistent person-level auto-merge on write.
 *
 * Matches by EMAIL (case-insensitive) OR normalized-PHONE so the same person
 * recorded in different phone formats collapses into one row. Prefers rows
 * already linked to a GHL contact as primary and never overwrites an existing
 * GHL contact id with null.
 */
async function insertOrMergeByPerson(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  submissionData: Record<string, unknown>,
): Promise<{ data: { id: string } | null; error: { message: string } | null; merged: boolean }> {
  const email = (submissionData.lead_email as string | null) || null;
  const phone = (submissionData.lead_phone as string | null) || null;
  const phoneKey = normalizePhone(phone);

  const candidates: Array<Record<string, unknown>> = [];
  if (email) {
    const { data } = await supabase
      .from('ghl_submissions')
      .select('id, ghl_response, lead_email, lead_phone, created_at')
      .ilike('lead_email', email)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) candidates.push(...data);
  }
  if (phoneKey) {
    const { data } = await supabase
      .from('ghl_submissions')
      .select('id, ghl_response, lead_email, lead_phone, created_at')
      .ilike('lead_phone', `%${phoneKey}%`)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) candidates.push(...data);
  }

  // ghl_contact_id lives inside the ghl_response JSON blob, not as a top-level
  // column. Read it from there for both dedupe scoring and downstream merges.
  const contactIdOf = (c: Record<string, unknown>): string | null => {
    const resp = (c.ghl_response as Record<string, unknown> | null) ?? null;
    const v = resp?.ghl_contact_id;
    return typeof v === 'string' && v ? v : null;
  };

  const seen = new Set<string>();
  const emailLc = (email ?? '').toLowerCase();
  const match = candidates
    .filter((c) => {
      const id = c.id as string;
      if (seen.has(id)) return false;
      seen.add(id);
      const cEmail = ((c.lead_email as string | null) ?? '').toLowerCase();
      const cPhone = normalizePhone(c.lead_phone as string | null);
      return (!!emailLc && cEmail === emailLc) || (!!phoneKey && cPhone === phoneKey);
    })
    .sort((a, b) => {
      const ag = contactIdOf(a) ? 1 : 0;
      const bg = contactIdOf(b) ? 1 : 0;
      if (ag !== bg) return bg - ag;
      return new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime();
    })[0];


  if (match) {
    const merged: Record<string, unknown> = { ...submissionData };
    const existingResponse = (match.ghl_response as Record<string, unknown>) || {};
    const newResponse = (submissionData.ghl_response as Record<string, unknown>) || {};
    if (!newResponse.ghl_contact_id && existingResponse.ghl_contact_id) {
      merged.ghl_response = {
        ...existingResponse,
        ...newResponse,
        ghl_contact_id: existingResponse.ghl_contact_id,
      };
    }
    const result = await supabase
      .from('ghl_submissions')
      .update(merged)
      .eq('id', match.id)
      .select()
      .single();
    console.log(`Person-merge: merged into existing row ${match.id} (email or normalized-phone)`);
    return { data: result.data, error: result.error, merged: true };
  }

  const result = await supabase
    .from('ghl_submissions')
    .insert(submissionData)
    .select()
    .single();
  return { data: result.data, error: result.error, merged: false };
}

/**
 * Sanitize phone number - convert "Skipped" or invalid values to null
 */
function sanitizePhone(phone: string | undefined | null): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (
    trimmed === '' ||
    trimmed.toLowerCase() === 'skipped' ||
    trimmed.toLowerCase() === 'n/a' ||
    trimmed.toLowerCase() === 'none' ||
    trimmed === '-'
  ) {
    return null;
  }
  return trimmed;
}

/**
 * Parse a full name into first and last name parts
 */
function parseName(fullName: string | undefined | null, email: string): { firstName: string; lastName: string } {
  // If no name provided, use email prefix as fallback
  if (!fullName || fullName.trim() === '') {
    const emailPrefix = email.split('@')[0] || 'Unknown';
    // Clean up email prefix (remove dots, underscores, numbers)
    const cleanedPrefix = emailPrefix
      .replace(/[._]/g, ' ')
      .replace(/\d+/g, '')
      .trim();
    
    if (cleanedPrefix) {
      const parts = cleanedPrefix.split(' ').filter(p => p.length > 0);
      return {
        firstName: parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Unknown',
        lastName: parts.slice(1).join(' ') || ''
      };
    }
    return { firstName: 'Unknown', lastName: '' };
  }

  const nameParts = fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || 'Unknown';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  return { firstName, lastName };
}

/**
 * Verify a contact exists in GoHighLevel by fetching it by ID.
 *
 * NOTE: GHL can be eventually consistent right after create/update.
 * We retry a few times when the returned contact fields don't yet match what we just sent.
 */
async function verifyContactInGHL(
  contactId: string,
  apiKey: string,
  expected?: { firstName?: string; lastName?: string; phone?: string | null }
): Promise<{ exists: boolean; contact?: Record<string, unknown>; error?: string }> {
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const normalize = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

  const maxAttempts = expected ? 4 : 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Verifying GHL contact exists: ${contactId} (attempt ${attempt}/${maxAttempts})`);

      const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Version': GHL_V3,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('GHL verification failed:', response.status, errorText);
        return { exists: false, error: `Verification failed: ${response.status}` };
      }

      const data = await response.json();
      const contact = data.contact as Record<string, unknown> | undefined;

      if (!contact || !contact.id) {
        return { exists: false, error: 'Contact not found in response' };
      }

      // If we don't have expectations, we're done.
      if (!expected) {
        console.log(`GHL contact verified: ${contact.id}, email: ${contact.email}`);
        return { exists: true, contact };
      }

      const ghlFirst = normalize(contact.firstName ?? contact.first_name);
      const ghlLast = normalize(contact.lastName ?? contact.last_name);
      const ghlPhone = normalize(contact.phone);

      const expFirst = normalize(expected.firstName);
      const expLast = normalize(expected.lastName);
      const expPhone = normalize(expected.phone);

      const nameOk = (!expFirst || ghlFirst.toLowerCase() === expFirst.toLowerCase()) &&
        (!expLast || ghlLast.toLowerCase() === expLast.toLowerCase());

      // We only compare phone when a phone was provided (skipped/null shouldn't block).
      const phoneOk = !expected.phone || ghlPhone === expPhone;

      if (nameOk && phoneOk) {
        console.log(`GHL contact verified (matched expected fields): ${contact.id}`);
        return { exists: true, contact };
      }

      console.log('GHL contact verified but not yet updated (will retry):', {
        expected: { firstName: expFirst || undefined, lastName: expLast || undefined, phone: expected.phone },
        got: { firstName: ghlFirst || undefined, lastName: ghlLast || undefined, phone: ghlPhone || undefined },
      });

      if (attempt < maxAttempts) {
        // Small backoff for eventual consistency
        await sleep(250 * attempt);
        continue;
      }

      // Return the contact anyway (exists), even if fields haven't caught up yet.
      return { exists: true, contact };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error verifying GHL contact:', errorMessage);
      return { exists: false, error: errorMessage };
    }
  }

  return { exists: false, error: 'Verification failed' };
}

/**
 * Add tags to an existing GHL contact using the dedicated tags endpoint
 */
async function addTagsToContact(
  contactId: string,
  tags: string[],
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Adding tags to GHL contact ${contactId}:`, tags);
    
    const response = await fetch(
      `https://services.leadconnectorhq.com/contacts/${contactId}/tags`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Version': GHL_V3,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tags }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GHL add tags failed:', response.status, errorText);
      return { success: false, error: `Add tags failed: ${response.status} - ${errorText}` };
    }

    console.log(`Successfully added tags to contact ${contactId}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error adding tags to GHL contact:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Create or update a contact in GoHighLevel and add tags
 * Returns the contact's name from GHL (which may differ from what was passed in)
 */
async function syncContactToGHL(
  email: string,
  name: string | undefined,
  phone: string | undefined,
  company: string | undefined,
  tags: string[],
  apiKey: string,
  locationId: string,
  qualificationData?: QualificationData
): Promise<{ 
  success: boolean; 
  verified: boolean; 
  contactId?: string; 
  created?: boolean; 
  error?: string;
  ghlFirstName?: string;
  ghlLastName?: string;
  ghlEmail?: string;
  ghlPhone?: string;
  ghlBusinessName?: string;
}> {
  try {
    console.log(`Syncing contact to GHL: ${email} with phone: ${phone}, tags:`, tags, 'qualification:', qualificationData);

    // First, search for the contact by email (POST /contacts/search)
    const searchResponse = await fetch(
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

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('GHL search failed:', searchResponse.status, errorText);
      return { success: false, verified: false, error: `Search failed: ${searchResponse.status} - ${errorText}` };
    }

    const searchData = await searchResponse.json();
    const contacts = searchData.contacts || [];

    // Find exact email match
    let contact = contacts.find((c: { email?: string }) =>
      c.email?.toLowerCase() === email.toLowerCase()
    );

    let created = false;
    let contactId: string | undefined;

    // Parse name with fallback
    const { firstName, lastName } = parseName(name, email);

    // Build qualification notes if data exists
    let qualificationNotes = '';
    if (qualificationData) {
      const parts: string[] = [];
      if (qualificationData.role) parts.push(`Role: ${qualificationData.role}`);
      if (qualificationData.industry) parts.push(`Industry: ${qualificationData.industry}`);
      if (qualificationData.challenge) parts.push(`Challenge: ${qualificationData.challenge}`);
      if (qualificationData.size) parts.push(`Team Size: ${qualificationData.size}`);
      if (qualificationData.timeline) parts.push(`Timeline: ${qualificationData.timeline}`);
      if (parts.length > 0) {
        qualificationNotes = `[AlfredAI Qualification]\n${parts.join('\n')}`;
      }
    }

    // If contact doesn't exist, create it
    if (!contact) {
      console.log(`Contact not found, creating new contact for: ${email}`);

      // Build custom field mappings for qualification data
      // These map to GHL custom fields if they exist in the location
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

      const createPayload: Record<string, unknown> = {
        locationId: locationId,
        email: email,
        firstName: firstName,
        lastName: lastName,
        phone: phone || undefined,
        companyName: company || undefined,
        tags: tags,
        source: 'AlfredAI Website',
        // Add custom fields if we have qualification data
        ...(customFieldMappings.length > 0 && { customFields: customFieldMappings }),
      };

      const createResponse = await fetch(
        `https://services.leadconnectorhq.com/contacts/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Version': GHL_V3,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createPayload),
        }
      );

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('GHL create contact failed:', createResponse.status, errorText);
        return { success: false, verified: false, error: `Create failed: ${createResponse.status} - ${errorText}` };
      }

      const createData = await createResponse.json();
      contact = createData.contact;
      contactId = contact?.id;
      created = true;
      console.log(`Created new GHL contact: ${contactId}`);
      
      // Add qualification notes for new contacts via notes API (must be done after creation)
      if (qualificationNotes && contactId) {
        try {
          const notesResponse = await fetch(
            `https://services.leadconnectorhq.com/contacts/${contactId}/notes`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Version': GHL_V3,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                body: qualificationNotes,
              }),
            }
          );
          
          if (notesResponse.ok) {
            console.log(`Added qualification notes to new contact ${contactId}`);
          } else {
            console.warn(`Failed to add notes to new contact ${contactId}:`, await notesResponse.text());
          }
        } catch (noteError) {
          console.warn('Error adding notes to new contact:', noteError);
        }
      }
    } else {
      // Contact exists - use dedicated tags endpoint to add tags
      contactId = contact.id as string;
      console.log(`Found existing GHL contact: ${contactId}`);
      
      // Build custom field mappings for qualification data updates
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
      
      // Use the dedicated tags endpoint for more reliable tag addition
      const addTagsResult = await addTagsToContact(contactId, tags, apiKey);
      
      if (!addTagsResult.success) {
        console.warn(`Failed to add tags via dedicated endpoint: ${addTagsResult.error}`);
      }
      
      // Update contact with tags and custom fields
      const existingTags = contact.tags || [];
      const mergedTags = [...new Set([...existingTags, ...tags])];

      const updatePayload: Record<string, unknown> = {
        tags: mergedTags,

        // IMPORTANT: keep booking widget prefill consistent.
        // If the contact already exists, GHL will prefer stored contact values over URL params.
        // So we update core fields here when provided by the lead.
        ...(name && name.trim() !== ''
          ? {
              firstName,
              lastName,
            }
          : {}),
        ...(phone && phone.trim() !== '' ? { phone } : {}),
        ...(company && company.trim() !== '' ? { companyName: company } : {}),

        // Add custom fields if we have qualification data
        ...(customFieldMappings.length > 0 && { customFields: customFieldMappings }),
      };

      const updateResponse = await fetch(
        `https://services.leadconnectorhq.com/contacts/${contactId}`,
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
        // Don't fail completely - tags via dedicated endpoint may have succeeded
        console.warn(`GHL contact update failed but continuing: ${updateResponse.status}`);
      } else {
        console.log(`Updated GHL contact ${contactId} with tags and custom fields`);
      }
      
      // Add qualification notes for existing contacts via notes API if we have data
      if (qualificationNotes && contactId) {
        try {
          const notesResponse = await fetch(
            `https://services.leadconnectorhq.com/contacts/${contactId}/notes`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Version': GHL_V3,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                body: qualificationNotes,
              }),
            }
          );
          
          if (notesResponse.ok) {
            console.log(`Added qualification notes to existing contact ${contactId}`);
          } else {
            console.warn(`Failed to add notes to contact ${contactId}:`, await notesResponse.text());
          }
        } catch (noteError) {
          console.warn('Error adding notes to contact:', noteError);
        }
      }
    }

    // VERIFICATION STEP: Confirm the contact actually exists in GHL
    if (!contactId) {
      console.error('No contact ID returned from GHL');
      return { success: false, verified: false, error: 'No contact ID returned from GHL' };
    }

    const verification = await verifyContactInGHL(contactId, apiKey, {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      phone: phone ? phone : null,
    });

    if (!verification.exists) {
      console.error(`GHL contact verification failed for ID: ${contactId}`);
      return {
        success: false,
        verified: false,
        contactId,
        created,
        error: `Contact created/updated but verification failed: ${verification.error}`
      };
    }

    // Extract first/last name, phone, and business name from GHL contact data
    const ghlContact = verification.contact as Record<string, unknown> | undefined;
    const ghlFirstName = (ghlContact?.firstName as string) || (ghlContact?.first_name as string) || undefined;
    const ghlLastName = (ghlContact?.lastName as string) || (ghlContact?.last_name as string) || undefined;
    const ghlEmail = (ghlContact?.email as string) || undefined;
    const ghlPhone = (ghlContact?.phone as string) || undefined;
    // GHL uses businessName as the primary company field
    const ghlBusinessName = (ghlContact?.businessName as string) || (ghlContact?.companyName as string) || (ghlContact?.company as string) || undefined;

    console.log(
      `GHL sync verified successfully for contact: ${contactId}, name: ${ghlFirstName} ${ghlLastName}, email: ${ghlEmail}, phone: ${ghlPhone}, businessName: ${ghlBusinessName}`
    );
    return { success: true, verified: true, contactId, created, ghlFirstName, ghlLastName, ghlEmail, ghlPhone, ghlBusinessName };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error syncing to GHL:', errorMessage);
    return { success: false, verified: false, error: errorMessage };
  }
}

/**
 * Generate tags based on source information and qualification data
 */
function generateSourceTags(
  sourcePage: string,
  sourceMedium: string,
  sourceCampaign?: string,
  qualificationData?: QualificationData,
  isBookingShown?: boolean
): string[] {
  const tags: string[] = [];

  // Add primary source identifier based on medium
  if (sourceMedium === 'header_cta') {
    // Header CTA - leads from the navigation header button
    tags.push('Header CTA');
    tags.push('Impact Conversation Booking');
  } else if (sourceMedium === 'signup_page') {
    // Get Started Page - leads from the /signup qualification flow
    tags.push('Get Started Page');
    tags.push('Interactive Qualification');
  } else if (sourceMedium === 'page_cta') {
    // Page CTA - leads from CTA buttons on various pages
    const pageName = sourcePage === '/' || sourcePage === '' ? 'Homepage' : sourcePage.replace(/^\//, '').replace(/\//g, ' ').trim();
    tags.push('Page CTA');
    tags.push(`Page: ${pageName}`);
  } else if (sourceMedium === 'lead_chatbot' || sourceMedium === 'chatbot') {
    // Chatbot sources get clear identification
    const pageName = sourcePage === '/' || sourcePage === '' ? 'Homepage' : sourcePage.replace(/^\//, '').replace(/\//g, ' ').trim();
    tags.push('Chatbot Lead');
    tags.push(`Chatbot - ${pageName}`);
  } else if (sourceMedium === 'booking_modal') {
    // Booking modal gets Impact Conversation tag
    tags.push('Impact Conversation Booking');
  } else if (sourceMedium === 'personalization_flow') {
    // Legacy: Hero CTA - leads from hero section qualification flow (kept for backwards compatibility)
    tags.push('Hero CTA');
    tags.push('Interactive Qualification');
  } else if (sourceMedium === 'lead_form' || sourceMedium === 'form') {
    tags.push('Contact Form Lead');
  } else if (sourceMedium === 'demo_share_link') {
    // Demo share leads - users who accessed demos via shared links
    tags.push('Demo Lead');
    tags.push('Demo Share Access');
  }

  // Add form type tag based on campaign
  if (sourceCampaign === 'demo_request') {
    tags.push('Demo Request');
  } else if (sourceCampaign === 'contact_inquiry' || sourceCampaign === 'contact_form') {
    tags.push('Contact Inquiry');
  } else if (sourceCampaign === 'support_request') {
    tags.push('Support Request');
  } else if (sourceCampaign === 'newsletter') {
    tags.push('Newsletter Subscriber');
  } else if (sourceCampaign === 'partnership_inquiry') {
    tags.push('Partnership Inquiry');
  } else if (sourceCampaign === 'signup_qualification') {
    tags.push('Get Started Qualification');
  } else if (sourceCampaign === 'personalized_results') {
    tags.push('Personalized Results');
  } else if (sourceCampaign?.startsWith('demo_')) {
    // Demo access leads - extract the demo name from campaign
    const demoId = sourceCampaign.replace('demo_', '');
    const demoName = demoId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    tags.push('Demo Access');
    tags.push(`Demo: ${demoName}`);
  }
  // Add page source for attribution
  if (sourcePage) {
    const pageTag = sourcePage === '/' || sourcePage === '' 
      ? 'page:homepage' 
      : `page:${sourcePage.replace(/^\//, '').replace(/\//g, '-').toLowerCase()}`;
    tags.push(pageTag);
  }

  // Add qualification tags for CRM segmentation (human-readable)
  if (qualificationData) {
    if (qualificationData.role) {
      tags.push(`Role: ${qualificationData.role}`);
    }
    if (qualificationData.industry) {
      tags.push(`Industry: ${qualificationData.industry}`);
    }
    if (qualificationData.size) {
      tags.push(`Team Size: ${qualificationData.size}`);
    }
    if (qualificationData.timeline) {
      tags.push(`Timeline: ${qualificationData.timeline}`);
    }
    if (qualificationData.challenge) {
      tags.push(`Challenge: ${qualificationData.challenge}`);
    }
  }

  // Add AlfredAI source tag
  tags.push('AlfredAI Website');

  return tags;
}

/**
 * Map source campaign to lead type
 */
function getLeadType(sourceCampaign?: string): string {
  const campaignToTypeMap: Record<string, string> = {
    demo_request: 'demo',
    contact_inquiry: 'contact',
    contact_form: 'contact',
    support_request: 'support',
    newsletter: 'newsletter',
    partnership_inquiry: 'partnership',
  };
  
  return sourceCampaign ? (campaignToTypeMap[sourceCampaign] || 'contact') : 'contact';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ghlApiKey = Deno.env.get('GHL_API_KEY');
    const ghlLocationId = Deno.env.get('GHL_LOCATION_ID');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: GHLSubmissionRequest = await req.json();

    // Validate required fields
    if (!body.lead_email || !body.source_page || !body.source_medium) {
      console.error('Missing required fields:', { 
        lead_email: !!body.lead_email, 
        source_page: !!body.source_page, 
        source_medium: !!body.source_medium 
      });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: lead_email, source_page, source_medium' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse name with proper handling
    const { firstName, lastName } = parseName(body.lead_name, body.lead_email);

    // Sanitize phone - convert "Skipped" or invalid values to null
    const sanitizedPhone = sanitizePhone(body.lead_phone);

    // Determine lead source from request or infer from medium
    const leadSource = body.lead_source || 
      (body.source_medium === 'lead_chatbot' ? 'chatbot' : 
       body.source_medium === 'personalization_flow' ? 'personalization_flow' :
       body.source_medium === 'demo_share_link' ? 'demo_share' :
       body.source_medium === 'contact_form' ? 'form' : 'unknown');

    console.log('Logging GHL submission:', {
      email: body.lead_email,
      name: body.lead_name,
      parsedFirstName: firstName,
      parsedLastName: lastName,
      rawPhone: body.lead_phone,
      sanitizedPhone: sanitizedPhone,
      company: body.lead_company,
      source_page: body.source_page,
      source_medium: body.source_medium,
      source_campaign: body.source_campaign,
      lead_source: leadSource,
      status: body.ghl_status || 'submitted',
      submission_id: body.submission_id || 'new',
    });

    // Generate tags including qualification data for CRM segmentation
    // Add lead source as a tag for GHL segmentation
    const tags = generateSourceTags(
      body.source_page,
      body.source_medium,
      body.source_campaign,
      body.qualification_data,
      false // No longer skipping tags for booking_shown
    );
    
    // Add source identifier tag
    const sourceTag = `Source: ${leadSource.charAt(0).toUpperCase() + leadSource.slice(1).replace(/_/g, ' ')}`;
    tags.push(sourceTag);

    // Sync to GHL if API credentials are configured
    // NOW syncing ALL submissions including chatbot - using lead_source to differentiate
    let syncResult: { 
      success: boolean; 
      verified: boolean; 
      contactId?: string; 
      created?: boolean; 
      error?: string;
      ghlFirstName?: string;
      ghlLastName?: string;
      ghlEmail?: string;
      ghlPhone?: string;
      ghlBusinessName?: string;
    } = { 
      success: false, 
      verified: false,
      error: 'GHL API not configured' 
    };
    
    // IMPORTANT: Do NOT create GHL contacts via API when booking_shown.
    // The calendar widget will create the contact when the user submits the booking form.
    // Pre-creating via API causes DUPLICATE contacts in GHL because the calendar widget
    // always creates a new contact on form submission (no email dedup).
    // Tags will be applied later via the ghl-webhook when the booking event fires.
    const isBookingShown = (body.ghl_status === 'booking_shown');
    
    if (isBookingShown) {
      console.log('Skipping GHL API sync for booking_shown — calendar widget will create the contact');
      // Store tags in ghl_response so the webhook can apply them later
      syncResult = { success: false, verified: false, error: 'Skipped for booking_shown — calendar widget handles contact creation' };
    } else if (ghlApiKey && ghlLocationId) {
      // Sync non-booking submissions to GHL (forms, chatbot leads, etc.)
      console.log(`Syncing ${leadSource} submission to GHL...`);
      syncResult = await syncContactToGHL(
        body.lead_email,
        body.lead_name,
        sanitizedPhone || undefined,
        body.lead_company,
        tags,
        ghlApiKey,
        ghlLocationId,
        body.qualification_data
      );
    } else {
      console.log('GHL API credentials not configured, skipping sync');
    }

    // Only mark as synced if both success AND verified are true
    const isVerifiedSync = syncResult.success && syncResult.verified;

    // Use GHL's data if available (from the verified contact), otherwise fall back to parsed/provided values
    const finalFirstName = syncResult.ghlFirstName || firstName || null;
    const finalLastName = syncResult.ghlLastName || lastName || null;
    const finalFullName = [finalFirstName, finalLastName].filter(Boolean).join(' ') || body.lead_name || null;
    const finalEmail = syncResult.ghlEmail || body.lead_email;
    const finalPhone = syncResult.ghlPhone || sanitizedPhone || null;

    console.log('Data resolution from GHL:', {
      ghlFirstName: syncResult.ghlFirstName,
      ghlLastName: syncResult.ghlLastName,
      ghlEmail: syncResult.ghlEmail,
      ghlPhone: syncResult.ghlPhone,
      ghlBusinessName: syncResult.ghlBusinessName,
      parsedFirstName: firstName,
      parsedLastName: lastName,
      providedEmail: body.lead_email,
      providedPhone: body.lead_phone,
      finalFirstName,
      finalLastName,
      finalFullName,
      finalEmail,
      finalPhone,
    });

    // Prepare ghl_response with sync status, qualification data, and business name from GHL
    const ghlResponse = {
      ...body.ghl_response,
      ghl_synced: isVerifiedSync,
      ghl_verified: syncResult.verified,
      ghl_contact_id: syncResult.contactId || null,
      ghl_contact_created: syncResult.created || false,
      ghl_sync_error: syncResult.error || null,
      tags_applied: isVerifiedSync ? tags : [],
      // Always store pending tags so the webhook can apply them when the booking fires
      pending_tags: !isVerifiedSync ? tags : [],
      synced_at: isVerifiedSync ? new Date().toISOString() : null,
      qualification_data: body.qualification_data || null,
      // Store business name from GHL (separate from site-entered lead_company)
      ghl_business_name: syncResult.ghlBusinessName || null,
      // Attribution — "what made them click"
      referrer: body.referrer || (body.ghl_response?.referrer as string | undefined) || null,
      source_url: body.source_url || (body.ghl_response?.source_url as string | undefined) || null,
    };

    // Determine sync type (initial vs retry based on whether we're updating an existing record)
    const isRetry = !!body.submission_id;
    const syncType = isRetry ? 'retry' : 'initial';

    // Prepare the submission data
    const submissionData = {
      lead_email: finalEmail,
      lead_name: finalFullName,
      lead_first_name: finalFirstName,
      lead_last_name: finalLastName,
      lead_phone: finalPhone,
      lead_company: body.lead_company || null,
      source_page: body.source_page,
      source_medium: body.source_medium,
      source_campaign: body.source_campaign || null,
      lead_source: leadSource,
      ghl_status: isVerifiedSync ? 'synced' : (body.ghl_status || 'submitted'),
      ghl_response: ghlResponse,
      // The Demo page reads this table rather than `leads`, so the engagement
      // join has to land here too or its tiles have nothing to count.
      visitor_id: body.visitor_id || null,
    };

    let data: { id: string } | null = null;
    let error: { message: string } | null = null;
    let wasConsolidated = false; // Track if we updated an existing record vs creating new
    let wasSkipped = false; // Track if we completely skipped (duplicate booking_shown)

    // If submission_id is provided, UPDATE existing record (retry scenario)
    if (isRetry && body.submission_id) {
      console.log(`Retry sync - updating existing submission: ${body.submission_id}`);
      const result = await supabase
        .from('ghl_submissions')
        .update(submissionData)
        .eq('id', body.submission_id)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    } else {
      // ENHANCED CONSOLIDATION: Check for recent submissions from the same email
      // Uses multiple strategies to prevent duplicates:
      // 1. Same email within 15-minute window (regardless of page) - prevents cross-page duplicates
      // 2. Same email + same status (booking_shown) within 1 hour - prevents widget re-renders
      // 3. Same email + same page within 5 minutes - preserves original behavior for quick edits
      
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      // Strategy 1: For "booking_shown" status, use 1-hour window to prevent widget re-render duplicates
      // This prevents the same lead being logged multiple times when navigating/closing modals
      if (submissionData.ghl_status === 'booking_shown') {
        const { data: recentBookingShown } = await supabase
          .from('ghl_submissions')
          .select('id, ghl_status, source_page')
          .eq('lead_email', body.lead_email)
          .eq('ghl_status', 'booking_shown')
          .gte('created_at', oneHourAgo)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (recentBookingShown) {
          console.log(`Skipping duplicate booking_shown - recent entry exists: ${recentBookingShown.id} (within 1 hour)`);
          // Return the existing record without creating a duplicate
          data = { id: recentBookingShown.id };
          error = null;
          wasSkipped = true;
        } else {
          // Check if there's a recent "submitted" or "synced" entry we should update instead of creating new
          // Use 1-hour window (same as booking_shown duplicate check) to consolidate booking widget views
          // with their original form submissions, even if user navigates away and comes back later
          const { data: recentSubmission } = await supabase
            .from('ghl_submissions')
            .select('id, ghl_status, source_page')
            .eq('lead_email', body.lead_email)
            .in('ghl_status', ['submitted', 'synced', 'pending'])
            .gte('created_at', oneHourAgo)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (recentSubmission) {
            // Update existing submission to booking_shown instead of creating duplicate
            console.log(`Consolidating booking_shown into existing submission: ${recentSubmission.id}`);
            const result = await supabase
              .from('ghl_submissions')
              .update({
                ...submissionData,
                ghl_status: 'booking_shown',
              })
              .eq('id', recentSubmission.id)
              .select()
              .single();
            
            data = result.data;
            error = result.error;
            wasConsolidated = true;
          } else {
            // Insert, or merge into an existing person's row (email+phone match)
            const result = await insertOrMergeByPerson(supabase, submissionData);
            data = result.data;
            error = result.error;
            if (result.merged) wasConsolidated = true;
          }
        }
      } else {
        // Strategy 2: For submitted/synced status, check for any recent submission from same email
        // Use 15-minute window regardless of page to catch cross-page duplicates
        const { data: recentSubmission } = await supabase
          .from('ghl_submissions')
          .select('id, ghl_status, source_page, source_medium')
          .eq('lead_email', body.lead_email)
          .in('ghl_status', ['submitted', 'synced', 'pending'])
          .gte('created_at', fifteenMinutesAgo)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (recentSubmission) {
          // Update existing submission instead of creating a duplicate
          console.log(`Consolidating submission - updating recent entry: ${recentSubmission.id} (was ${recentSubmission.ghl_status} from ${recentSubmission.source_page}, now ${submissionData.ghl_status} from ${body.source_page})`);
          
          // Merge source info if different page/medium (track the journey)
          const mergedSourcePage = recentSubmission.source_page !== body.source_page
            ? `${recentSubmission.source_page} → ${body.source_page}`
            : body.source_page;
          
          const result = await supabase
            .from('ghl_submissions')
            .update({
              ...submissionData,
              source_page: mergedSourcePage.slice(0, 255), // Ensure we don't exceed column limit
            })
            .eq('id', recentSubmission.id)
            .select()
            .single();
          
          data = result.data;
          error = result.error;
          wasConsolidated = true;
        } else {
          // Strategy 3: Fallback - check same page within 5 minutes (original logic)
          const { data: samePageSubmission } = await supabase
            .from('ghl_submissions')
            .select('id, ghl_status')
            .eq('lead_email', body.lead_email)
            .eq('source_page', body.source_page)
            .gte('created_at', fiveMinutesAgo)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (samePageSubmission) {
            console.log(`Consolidating same-page submission: ${samePageSubmission.id}`);
            const result = await supabase
              .from('ghl_submissions')
              .update(submissionData)
              .eq('id', samePageSubmission.id)
              .select()
              .single();
            
            data = result.data;
            error = result.error;
            wasConsolidated = true;
          } else {
            // No recent submission found - insert, or merge into an existing
            // person's row (email+phone match) so duplicates aren't created.
            const result = await insertOrMergeByPerson(supabase, submissionData);
            data = result.data;
            error = result.error;
            if (result.merged) wasConsolidated = true;
          }
        }
      }
    }

    if (error) {
      console.error(`Error ${isRetry ? 'updating' : 'inserting'} GHL submission:`, error);
      
      // Log failed sync attempt to history
      await supabase.from('ghl_sync_history').insert({
        lead_email: finalEmail,
        sync_type: syncType,
        sync_status: 'db_error',
        ghl_contact_id: syncResult.contactId || null,
        ghl_response: ghlResponse,
        error_message: error.message,
        submission_id: body.submission_id || null,
      });

      return new Response(
        JSON.stringify({ error: `Failed to ${isRetry ? 'update' : 'log'} GHL submission`, details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log sync attempt to history ONLY when:
    // 1. This is an explicit retry (user clicked retry button)
    // 2. A new GHL contact was created (syncResult.created is true)
    // 3. This is a genuinely new submission (not consolidated/skipped)
    const syncStatus = isVerifiedSync ? 'success' : (syncResult.error ? 'failed' : 'pending');
    const submissionId = data?.id || body.submission_id;
    const shouldLogSyncHistory = submissionId && !wasConsolidated && !wasSkipped && (isRetry || syncResult.created || !syncResult.contactId);
    
    if (shouldLogSyncHistory) {
      console.log(`Logging sync history: ${syncType} - ${syncStatus} (contactCreated: ${syncResult.created})`);
      await supabase.from('ghl_sync_history').insert({
        submission_id: submissionId,
        lead_email: finalEmail,
        sync_type: syncType,
        sync_status: syncStatus,
        ghl_contact_id: syncResult.contactId || null,
        ghl_response: { ...ghlResponse, lead_source: leadSource },
        error_message: syncResult.error || null,
      });
    } else if (wasConsolidated || wasSkipped) {
      console.log(`Skipping sync history log - ${wasSkipped ? 'duplicate skipped' : 'consolidated into existing entry'}`);
    }

    // CREATE A GHL OPPORTUNITY so the lead is reportable under a pipeline + stage.
    // Only for verified non-booking syncs (booking_shown is handled by ghl-webhook
    // once the calendar contact is created). Non-fatal on failure.
    if (isVerifiedSync && syncResult.contactId && !isBookingShown && ghlApiKey && ghlLocationId && submissionId) {
      try {
        const target = GHL_PIPELINES.inbound;
        const oppResult = await ensureOpportunity({
          apiKey: ghlApiKey,
          locationId: ghlLocationId,
          contactId: syncResult.contactId,
          name: finalFullName || finalEmail,
          target,
        });
        if (oppResult.success) {
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


    // SYNC TO LEADS TABLE - Check for duplicate by email first
    const leadType = getLeadType(body.source_campaign);
    
    // Check if lead already exists (check both original and GHL email)
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .or(`email.eq.${body.lead_email},email.eq.${finalEmail}`)
      .maybeSingle();

    if (!existingLead) {
      // Insert new lead record - use GHL data (name, email, phone) if available
      const { error: leadInsertError } = await supabase
        .from('leads')
        .insert({
          email: finalEmail,
          first_name: finalFirstName || 'Unknown',
          last_name: finalLastName || '',
          phone: finalPhone,
          company: body.lead_company || null,
          lead_type: leadType,
          lead_source: leadSource,
          source_page: body.source_page,
          source_medium: body.source_medium,
          source_campaign: body.source_campaign || null,
          // Ties this lead to the demo_engagement events the same browser
          // produced. Without it the Demo page's Started / Engaged / Completed
          // tiles have nothing to count — events knew a visitor, leads did not.
          visitor_id: body.visitor_id || null,
        });

      if (leadInsertError) {
        console.warn('Failed to sync to leads table:', leadInsertError.message);
        // Don't fail the whole request - this is a supplementary sync
      } else {
        console.log('Successfully synced lead to leads table:', body.lead_email);
      }
    } else {
      console.log('Lead already exists in leads table, skipping duplicate insert:', body.lead_email);
    }

    console.log('GHL submission logged successfully:', {
      id: submissionId,
      synced: isVerifiedSync,
      verified: syncResult.verified,
      contactId: syncResult.contactId,
    });

    // Determine if this is a GENUINE sync failure (exclude the benign booking skip).
    const isBenignSkip = !!syncResult.error && syncResult.error.includes('Skipped for booking_shown');
    const isGenuineFailure = !!syncResult.error && !isBenignSkip && !isVerifiedSync;

    // Send lead notification email to sales team (fire-and-forget, don't block response)
    try {
      const notifyResponse = await fetch(`${supabaseUrl}/functions/v1/notify-new-lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          event: isGenuineFailure ? 'sync_failed' : 'new_lead',
          lead_email: finalEmail,
          lead_name: finalFullName,
          lead_phone: finalPhone,
          lead_company: body.lead_company || null,
          source_page: body.source_page,
          source_url: body.source_url || null,
          referrer: body.referrer || null,
          source_medium: body.source_medium,
          source_campaign: body.source_campaign || null,
          lead_source: leadSource,
          traffic_source: body.utm_data?.traffic_source || null,
          utm_data: body.utm_data || null,
          tags: tags,
          sync_error: isGenuineFailure ? syncResult.error : null,
          record_id: submissionId || undefined,
          record_type: 'ghl_submission',
          ghl_contact_id: syncResult.contactId || undefined,
        }),
      });
      
      if (notifyResponse.ok) {
        console.log('Lead notification sent successfully');
      } else {
        console.warn('Failed to send lead notification:', await notifyResponse.text());
      }
    } catch (notifyError) {
      console.warn('Error sending lead notification:', notifyError);
      // Don't fail the whole request - notification is supplementary
    }


    return new Response(
      JSON.stringify({ 
        success: true, 
        id: submissionId,
        ghl_synced: isVerifiedSync,
        ghl_verified: syncResult.verified,
        ghl_contact_id: syncResult.contactId,
        tags_applied: isVerifiedSync ? tags : [],
        error: syncResult.error,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in log-ghl-submission:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});