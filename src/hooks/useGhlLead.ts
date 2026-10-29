/**
 * React Query hooks for the GHL tabs (Conversation, Opportunities, Notes) on
 * the lead record. Centralised so every tab benefits from caching, parallel
 * fetching, and prefetching from the lead detail page.
 */
import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { GhlDndSettings, GhlMessage, GhlOpportunity } from '@/components/admin/leads/LeadGhlTabs';

/** GHL v3 attribution payload (first touch = attributionSource, last touch = lastAttributionSource). */
export interface GhlAttributionSource {
  sessionSource?: string | null;
  campaign?: string | null;
  campaignId?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmContent?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
  medium?: string | null;
  mediumId?: string | null;
  adId?: string | null;
  adSetId?: string | null;
  adName?: string | null;
  formId?: string | null;
  formName?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  url?: string | null;
  [key: string]: unknown;
}

export interface GhlNote {
  id: string;
  body: string;
  createdAt: string | null;
  author: string | null;
}

export interface GhlContactCustomField {
  id: string;
  name: string;
  key: string | null;
  value: unknown;
}

export interface GhlLinkedCompany {
  id: string;
  name: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  industry: string | null;
  employees: string | number | null;
  address: string | null;
  description: string | null;
}

export interface GhlContact {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  companyName: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  companyId: string | null;
  company: GhlLinkedCompany | null;
  email: string | null;
  workEmail: string | null;
  secondaryEmail: string | null;
  additionalEmails: string[];
  phone: string | null;
  mobilePhone: string | null;
  linkedinUrl: string | null;
  title: string | null;
  contactType: string | null;
  tags: string[];
  ownerId: string | null;
  ownerName: string | null;
  seniority: string | null;
  department: string | null;
  dateAdded: string | null;
  customFields: GhlContactCustomField[];
  /** v3 additions */
  dnd?: boolean | null;
  dndSettings?: GhlDndSettings | null;
  attributionSource?: GhlAttributionSource | null;
  lastAttributionSource?: GhlAttributionSource | null;
}

const STALE = 60 * 1000; // 1 min — fast enough perceived, cheap enough for GHL

// --- Keys ------------------------------------------------------------------
export const ghlKeys = {
  conversation: (contactId: string) => ['ghl', 'conversation', contactId] as const,
  opportunities: (contactId: string) => ['ghl', 'opportunities', contactId] as const,
  notes: (contactId: string) => ['ghl', 'notes', contactId] as const,
  contact: (contactId: string) => ['ghl', 'contact', contactId] as const,
  pipelines: () => ['ghl', 'pipelines'] as const,
};

export interface GhlPipeline {
  id: string;
  name: string;
  stages: { id: string; name: string; position: number }[];
}

async function fetchPipelines(): Promise<GhlPipeline[]> {
  const { data, error } = await supabase.functions.invoke('ghl-list-pipelines', { body: {} });
  if (error) throw error;
  if (data?.success === false) throw new Error(data.error || 'Failed to load pipelines');
  return (data?.pipelines ?? []) as GhlPipeline[];
}

export function useGhlPipelines(enabled: boolean) {
  return useQuery({
    queryKey: ghlKeys.pipelines(),
    queryFn: fetchPipelines,
    enabled,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}


// --- Fetchers --------------------------------------------------------------
async function fetchConversation(contactId: string): Promise<GhlMessage[]> {
  const { data, error } = await supabase.functions.invoke('ghl-get-conversation', {
    body: { contact_id: contactId },
  });
  if (error) throw error;
  if (data?.success === false) throw new Error(data.error || 'Failed to load conversation');
  return (data?.messages ?? []) as GhlMessage[];
}

async function fetchOpportunities(contactId: string): Promise<GhlOpportunity[]> {
  const { data, error } = await supabase.functions.invoke('ghl-get-opportunities', {
    body: { contact_id: contactId },
  });
  if (error) throw error;
  if (data?.success === false) throw new Error(data.error || 'Failed to load opportunities');
  return (data?.opportunities ?? []) as GhlOpportunity[];
}

async function fetchNotes(contactId: string): Promise<GhlNote[]> {
  const { data, error } = await supabase.functions.invoke('ghl-get-notes', {
    body: { contact_id: contactId },
  });
  if (error) throw error;
  if (data?.success === false) return [];
  return (data?.notes ?? []) as GhlNote[];
}

async function fetchContact(contactId: string): Promise<GhlContact | null> {
  const { data, error } = await supabase.functions.invoke('ghl-get-contact', {
    body: { contact_id: contactId },
  });
  if (error) throw error;
  if (data?.success === false) return null;
  return (data?.contact ?? null) as GhlContact | null;
}


// --- Hooks -----------------------------------------------------------------
export function useGhlConversation(contactId: string | null | undefined) {
  return useQuery({
    queryKey: ghlKeys.conversation(contactId || ''),
    queryFn: () => fetchConversation(contactId!),
    enabled: !!contactId,
    // Conversations must feel live: poll while the tab is visible, refetch on
    // focus/mount. Background polling is off so a parked tab doesn't burn GHL
    // rate limit (that's what caused the 429 storms).
    staleTime: 0,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    placeholderData: (prev) => prev,
  });
}


export function useGhlOpportunities(contactId: string | null | undefined) {
  return useQuery({
    queryKey: ghlKeys.opportunities(contactId || ''),
    queryFn: () => fetchOpportunities(contactId!),
    enabled: !!contactId,
    // Opportunity stage/status changes in GHL must reflect immediately — no
    // cache pinning. Refetch on tab focus/mount so an admin never sees stale.
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    placeholderData: (prev) => prev,
  });
}

export function useGhlNotes(contactId: string | null | undefined) {
  return useQuery({
    queryKey: ghlKeys.notes(contactId || ''),
    queryFn: () => fetchNotes(contactId!),
    enabled: !!contactId,
    staleTime: STALE,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    placeholderData: (prev) => prev,
  });
}


export function useGhlContact(contactId: string | null | undefined) {
  return useQuery({
    queryKey: ghlKeys.contact(contactId || ''),
    queryFn: () => fetchContact(contactId!),
    enabled: !!contactId,
    staleTime: STALE,
    placeholderData: (prev) => prev,
  });
}

/**
 * Debounced hover prefetch. Warms ONLY the contact query — conversation,
 * opportunities and notes are fetched when the record actually opens. Warming
 * all four meant one mouse sweep down a list fired 4 calls per row and
 * rate-limited GHL (429 bursts).
 */
export function usePrefetchGhlLead() {
  const qc = useQueryClient();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => cancel, [cancel]);

  const prefetch = useCallback(
    (contactId: string) => {
      if (!contactId) return;
      cancel();
      timer.current = setTimeout(() => {
        timer.current = null;
        void qc.prefetchQuery({
          queryKey: ghlKeys.contact(contactId),
          queryFn: () => fetchContact(contactId),
          staleTime: STALE,
        });
      }, 350);
    },
    [qc, cancel],
  );

  return { prefetch, cancel };
}

