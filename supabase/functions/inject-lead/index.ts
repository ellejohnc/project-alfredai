import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Standard handled-error response (always 200 OK so callers don't crash)
function reply(success: boolean, payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify({ success, ...payload }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function sanitizePhone(phone: unknown): string | null {
  if (typeof phone !== 'string') return null;
  const trimmed = phone.trim();
  if (!trimmed || ['skipped', 'n/a', 'none', '-'].includes(trimmed.toLowerCase())) return null;
  return trimmed.slice(0, 50);
}

function parseName(fullName: unknown, email: string): { firstName: string; lastName: string } {
  if (typeof fullName === 'string' && fullName.trim()) {
    const parts = fullName.trim().split(/\s+/);
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' ') || '',
    };
  }
  const prefix = (email.split('@')[0] || 'Unknown').replace(/[._\d]+/g, ' ').trim();
  return { firstName: prefix || 'Unknown', lastName: '' };
}

function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && email.length <= 254;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // --- Authenticate the external system via shared API key ---
    const expectedKey = Deno.env.get('LEADS_WEBHOOK_API_KEY');
    if (!expectedKey) {
      return reply(false, { error: 'Webhook is not configured. Contact the administrator.' });
    }

    const providedKey =
      req.headers.get('x-api-key') ||
      (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');

    if (providedKey !== expectedKey) {
      return reply(false, { error: 'Unauthorized: invalid or missing API key.' }, 401);
    }

    // --- Parse body ---
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return reply(false, { error: 'Invalid JSON body.' });
    }

    // Accept a single lead object OR { leads: [...] } for batch inserts
    const rawLeads = Array.isArray((body as { leads?: unknown }).leads)
      ? ((body as { leads: unknown[] }).leads)
      : [body];

    if (rawLeads.length === 0) {
      return reply(false, { error: 'No lead data provided.' });
    }
    if (rawLeads.length > 100) {
      return reply(false, { error: 'Too many leads in one request (max 100).' });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const rows: Record<string, unknown>[] = [];
    const errors: { index: number; error: string }[] = [];

    rawLeads.forEach((item, index) => {
      const lead = (item || {}) as Record<string, unknown>;
      const email = typeof lead.email === 'string' ? lead.email.trim().toLowerCase() : '';

      if (!email || !isValidEmail(email)) {
        errors.push({ index, error: 'Missing or invalid email.' });
        return;
      }

      const { firstName, lastName } = parseName(
        lead.name ?? lead.full_name,
        email,
      );

      rows.push({
        email,
        first_name: (typeof lead.first_name === 'string' && lead.first_name.trim()) || firstName,
        last_name: (typeof lead.last_name === 'string' && lead.last_name.trim()) || lastName,
        phone: sanitizePhone(lead.phone),
        company: typeof lead.company === 'string' ? lead.company.trim().slice(0, 200) : null,
        job_title: typeof lead.job_title === 'string' ? lead.job_title.trim().slice(0, 200) : null,
        message: typeof lead.message === 'string' ? lead.message.slice(0, 2000) : null,
        lead_type: typeof lead.lead_type === 'string' ? lead.lead_type.slice(0, 50) : 'contact',
        lead_source: 'webhook',
        source_medium: 'webhook',
        source_page: typeof lead.source_page === 'string' ? lead.source_page.slice(0, 200) : 'external_system',
        source_campaign: typeof lead.source_campaign === 'string' ? lead.source_campaign.slice(0, 200) : null,
        ghl_response: { external_source: typeof lead.external_source === 'string' ? lead.external_source : 'custom_system', received_at: new Date().toISOString() },
      });
    });

    if (rows.length === 0) {
      return reply(false, { error: 'No valid leads to insert.', details: errors });
    }

    const { data, error } = await supabase
      .from('leads')
      .insert(rows)
      .select('id, email, first_name, last_name, phone, company, source_page, source_campaign');

    if (error) {
      console.error('inject-lead insert error:', error);
      return reply(false, { error: 'Failed to save leads.', details: error.message });
    }

    // Fire a sales notification once per newly-created lead (fallback-safe;
    // a notification failure never prevents the lead from being saved).
    for (const lead of data ?? []) {
      let notifStatus = 'sent';
      let notifError: string | null = null;
      try {
        const { error: notifyErr } = await supabase.functions.invoke('notify-new-lead', {
          body: {
            lead_email: lead.email,
            lead_name: [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim() || undefined,
            lead_phone: lead.phone ?? undefined,
            lead_company: lead.company ?? undefined,
            source_page: lead.source_page ?? 'External System',
            source_medium: 'webhook',
            lead_source: 'webhook',
            traffic_source: 'Webhook',
            source_campaign: lead.source_campaign ?? undefined,
            record_id: lead.id || undefined,
            record_type: 'lead',
          },
        });
        if (notifyErr) {
          notifStatus = 'failed';
          notifError = notifyErr.message ?? String(notifyErr);
          console.error('notify-new-lead failed for injected lead', lead.email, notifyErr);
        }
      } catch (e) {
        notifStatus = 'failed';
        notifError = e instanceof Error ? e.message : String(e);
        console.error('notify-new-lead threw for injected lead', lead.email, e);
      }
      await supabase
        .from('leads')
        .update({
          notification_status: notifStatus,
          notification_sent_at: notifStatus === 'sent' ? new Date().toISOString() : null,
          notification_error: notifError,
        })
        .eq('id', lead.id);
    }


    return reply(true, {
      inserted: data?.length ?? 0,
      skipped: errors.length,
      skipped_details: errors,
      leads: data,
    });
  } catch (err) {
    console.error('inject-lead unexpected error:', err);
    return reply(false, { error: 'Unexpected server error.' });
  }
});
