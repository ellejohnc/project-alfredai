import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Syncs leads from the Alpha Digital / MultiLead Open API into public.alpha_digital_leads.
// Secrets:
//   ALPHA_DIGITAL_API_URL - base URL, e.g. https://api.multilead.io/api/open-api/v1
//   ALPHA_DIGITAL_API_KEY - the raw UUID API key (sent as the Authorization header, NO Bearer prefix)

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ALPHA_API_URL = Deno.env.get('ALPHA_DIGITAL_API_URL');
const ALPHA_API_KEY = Deno.env.get('ALPHA_DIGITAL_API_KEY');

const PAGE_SIZE = 100;

// MultiLead authenticates with the raw key in the Authorization header (no "Bearer").
function authHeaders() {
  return {
    Authorization: ALPHA_API_KEY as string,
    Accept: 'application/json',
  };
}

function baseUrl(): string {
  // Tolerate a trailing slash on the configured base URL.
  return (ALPHA_API_URL as string).replace(/\/+$/, '');
}

async function apiGet(path: string): Promise<any> {
  const res = await fetch(`${baseUrl()}${path}`, { headers: authHeaders() });
  const text = await res.text();
  let json: unknown = null;
  try { json = JSON.parse(text); } catch { /* keep null */ }
  if (!res.ok) {
    throw new Error(`MultiLead API ${res.status} on ${path}: ${text.slice(0, 300)}`);
  }
  return json;
}

// Pull the first non-empty value from a record for the given keys.
function firstOf(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
  }
  return null;
}

// Normalise a MultiLead lead item into our alpha_digital_leads shape.
function normalise(raw: Record<string, any>) {
  const afd = (raw.allFieldsData ?? {}) as Record<string, any>;
  const identifiers = Array.isArray(raw.profileIdentifiers) ? raw.profileIdentifiers : [];
  // identityTypeId 4 = email identifier in MultiLead.
  const emailIdentifier = identifiers.find((i: any) => i?.identityTypeId === 4)?.identifier ?? null;

  const email = firstOf(raw.businessEmail, raw.personalEmail, afd.email, emailIdentifier);

  return {
    external_id: firstOf(raw.id, afd.uniqueLeadId),
    name: firstOf(raw.fullName, afd.fullName, afd.full_name,
      [afd.firstName ?? raw.firstName, afd.lastName ?? raw.lastName].filter(Boolean).join(' ')),
    email,
    phone: firstOf(afd.phone),
    company: firstOf(raw.company, afd.currentCompany),
    source: firstOf(raw.campaign?.id ? `campaign:${raw.campaign.id}` : null, raw.linkedinUrl, 'multilead'),
    status: firstOf(raw.leadStatusId),
    raw_data: raw,
    synced_at: new Date().toISOString(),
  };
}

// Fetch every lead for a seat, paging with limit/offset until exhausted.
async function fetchSeatLeads(userId: number | string, accountId: number | string) {
  const leads: Record<string, any>[] = [];
  let offset = 0;
  let total = 0;
  while (true) {
    const payload = await apiGet(
      `/users/${userId}/accounts/${accountId}/leads?limit=${PAGE_SIZE}&offset=${offset}`,
    );
    const result = payload?.result ?? payload ?? {};
    const items: Record<string, any>[] = Array.isArray(result.items) ? result.items : [];
    total = typeof result.count === 'number' ? result.count : total;
    leads.push(...items);
    if (items.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
    // Safety valve against runaway pagination.
    if (offset > 200000) break;
  }
  return { leads, total };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    });

  try {
    if (!ALPHA_API_URL || !ALPHA_API_KEY) {
      return json({
        success: false,
        configured: false,
        error: 'Alpha Digital is not connected yet. Add ALPHA_DIGITAL_API_URL and ALPHA_DIGITAL_API_KEY to enable syncing.',
      });
    }

    // 1) Resolve the current user.
    const me = await apiGet('/user/me');
    const userId = me?.id;
    if (!userId) {
      return json({ success: false, configured: true, error: 'Could not resolve user id from /user/me.' });
    }

    // 2) List all seats/accounts for this user.
    const accountsPayload = await apiGet('/accounts?offset=0&limit=100');
    const accounts: Record<string, any>[] = accountsPayload?.result?.items ?? [];
    if (accounts.length === 0) {
      return json({ success: true, configured: true, synced: 0, message: 'No seats/accounts found for this user.' });
    }

    // 3) Fetch leads per seat and normalise.
    const allLeads: Record<string, any>[] = [];
    let reportedTotal = 0;
    for (const acc of accounts) {
      const { leads, total } = await fetchSeatLeads(userId, acc.id);
      reportedTotal += total;
      allLeads.push(...leads.map(normalise));
    }

    const rows = allLeads.filter((l) => l.external_id || l.email);
    if (rows.length === 0) {
      return json({ success: true, configured: true, synced: 0, total: reportedTotal, message: 'No leads returned by Alpha Digital.' });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    // Upsert in batches to stay within request limits.
    let synced = 0;
    for (let i = 0; i < rows.length; i += 500) {
      const batch = rows.slice(i, i + 500);
      const { error } = await supabase
        .from('alpha_digital_leads')
        .upsert(batch, { onConflict: 'external_id', ignoreDuplicates: false });
      if (error) {
        return json({ success: false, configured: true, error: `Failed to store leads: ${error.message}`, syncedBeforeError: synced });
      }
      synced += batch.length;
    }

    return json({ success: true, configured: true, synced, total: reportedTotal, seats: accounts.length });
  } catch (e) {
    return json({ success: false, error: e instanceof Error ? e.message : 'Unexpected error during sync.' });
  }
});
