/**
 * Shared helper for creating GoHighLevel opportunities.
 *
 * Used by log-ghl-submission and ghl-webhook so a synced/confirmed lead lands
 * in a reportable pipeline + stage. All failures are non-fatal: callers should
 * log and continue (edge functions must still return 200 OK).
 */

import { GHL_V3 } from './ghlClient.ts';

const GHL_BASE = 'https://services.leadconnectorhq.com';
const GHL_VERSION = GHL_V3;

export interface OpportunityTarget {
  pipelineId: string;
  pipelineName: string;
  stageId: string;
  stageName: string;
}

export interface CreateOpportunityArgs {
  apiKey: string;
  locationId: string;
  contactId: string;
  name: string;
  target: OpportunityTarget;
  monetaryValue?: number;
}

export interface OpportunityResult {
  success: boolean;
  opportunityId?: string;
  existed?: boolean;
  error?: string;
  pipeline?: OpportunityTarget;
}

/**
 * Find an existing open/won opportunity for a contact (idempotency guard).
 * Returns the opportunity id if one already exists.
 */
async function findExistingOpportunity(
  apiKey: string,
  locationId: string,
  contactId: string,
): Promise<string | null> {
  try {
    const url = `${GHL_BASE}/opportunities/search?location_id=${encodeURIComponent(
      locationId,
    )}&contact_id=${encodeURIComponent(contactId)}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Version: GHL_VERSION,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      console.warn('[ghlOpportunity] search returned', res.status);
      return null;
    }
    const data = await res.json();
    const opps = data.opportunities || [];
    if (opps.length > 0 && opps[0]?.id) {
      return opps[0].id as string;
    }
    return null;
  } catch (e) {
    console.warn('[ghlOpportunity] search failed:', String(e));
    return null;
  }
}

/**
 * Create (or reuse) a GHL opportunity for a contact in the given pipeline/stage.
 */
export async function ensureOpportunity(args: CreateOpportunityArgs): Promise<OpportunityResult> {
  const { apiKey, locationId, contactId, name, target, monetaryValue } = args;

  if (!apiKey || !locationId || !contactId) {
    return { success: false, error: 'Missing apiKey/locationId/contactId' };
  }

  // Idempotency: skip if the contact already has an opportunity.
  const existingId = await findExistingOpportunity(apiKey, locationId, contactId);
  if (existingId) {
    return { success: true, opportunityId: existingId, existed: true, pipeline: target };
  }

  try {
    const res = await fetch(`${GHL_BASE}/opportunities/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Version: GHL_VERSION,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        pipelineId: target.pipelineId,
        pipelineStageId: target.stageId,
        locationId,
        contactId,
        name,
        status: 'open',
        ...(typeof monetaryValue === 'number' ? { monetaryValue } : {}),
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      console.warn('[ghlOpportunity] create failed', res.status, text.slice(0, 500));
      return { success: false, error: `HTTP ${res.status}: ${text.slice(0, 300)}` };
    }

    let opportunityId: string | undefined;
    try {
      const data = JSON.parse(text);
      opportunityId = data?.opportunity?.id || data?.id;
    } catch {
      // ignore parse error; treat as success without id
    }

    return { success: true, opportunityId, existed: false, pipeline: target };
  } catch (e) {
    console.warn('[ghlOpportunity] create threw:', String(e));
    return { success: false, error: String(e) };
  }
}
