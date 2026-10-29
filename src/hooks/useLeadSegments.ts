import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface LeadSegmentFilters {
  source?: string;
  status?: string;
  search?: string;
  datePreset?: string;
  /** Active segment tab (Gmail-style label view). */
  segment?: string;
  /** Owner overlay filter: a user id, '__none__', 'all', or '__mine__'. */
  owner?: string;
  /** Outcome overlay filter: 'won' | 'lost' | 'open' | 'all'. */
  outcome?: string;
}

export interface LeadSegment {
  id: string;
  user_id: string;
  name: string;
  filters: LeadSegmentFilters;
  created_at: string;
  updated_at: string;
  /** Built-in presets cannot be deleted and are not persisted to localStorage. */
  isPreset?: boolean;
}

// Locked decision (2): saved segments live in localStorage, not the DB.
const STORAGE_KEY = 'admin_lead_segments';

// Built-in presets requested for Phase 1. These are always shown first and
// cannot be deleted. They map onto the same { source, status, search } filters
// the inbox already understands.
const PRESET_SEGMENTS: LeadSegment[] = [
  {
    id: 'preset:booked',
    user_id: 'preset',
    name: 'Booked',
    filters: { source: 'ghl_submissions', status: 'confirmed' },
    created_at: '',
    updated_at: '',
    isPreset: true,
  },
  {
    id: 'preset:site-leads',
    user_id: 'preset',
    name: 'Site Leads',
    filters: { source: 'leads' },
    created_at: '',
    updated_at: '',
    isPreset: true,
  },
  {
    id: 'preset:meta-ads',
    user_id: 'preset',
    name: 'Meta Ads',
    filters: { source: 'meta_leads' },
    created_at: '',
    updated_at: '',
    isPreset: true,
  },
  {
    id: 'preset:needs-follow-up',
    user_id: 'preset',
    name: 'Needs follow-up',
    filters: { status: 'booking_shown' },
    created_at: '',
    updated_at: '',
    isPreset: true,
  },
  {
    id: 'preset:investors',
    user_id: 'preset',
    name: 'Investors',
    filters: { source: 'investor_leads' },
    created_at: '',
    updated_at: '',
    isPreset: true,
  },
];

function readStored(): LeadSegment[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LeadSegment[]) : [];
  } catch {
    return [];
  }
}

function writeStored(segments: LeadSegment[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(segments));
  } catch {
    // ignore quota / serialization errors
  }
}

export function useLeadSegments() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['lead-segments'],
    queryFn: async (): Promise<LeadSegment[]> => {
      // Presets first, then user-saved (localStorage) segments.
      return [...PRESET_SEGMENTS, ...readStored()];
    },
    staleTime: 60 * 1000,
  });

  const saveSegment = useMutation({
    mutationFn: async ({ name, filters }: { name: string; filters: LeadSegmentFilters }) => {
      const now = new Date().toISOString();
      const stored = readStored();
      const segment: LeadSegment = {
        id: `seg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        user_id: 'local',
        name,
        filters,
        created_at: now,
        updated_at: now,
      };
      writeStored([...stored, segment]);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lead-segments'] }),
  });

  const deleteSegment = useMutation({
    mutationFn: async (id: string) => {
      // Presets are not deletable.
      if (id.startsWith('preset:')) return;
      writeStored(readStored().filter((s) => s.id !== id));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lead-segments'] }),
  });

  return {
    segments: query.data ?? PRESET_SEGMENTS,
    isLoading: query.isLoading,
    error: query.error,
    saveSegment,
    deleteSegment,
  };
}
