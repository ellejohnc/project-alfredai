/**
 * Admin dashboards must reflect the database as it is *now* — the global
 * QueryClient defaults (5 min staleTime, no refetch on focus) are tuned for
 * marketing pages and made newly-created records invisible for minutes.
 *
 * Spread these options into any admin useQuery that reads live business data.
 *
 * DO NOT apply this to the leads surfaces (useUnifiedLeads, the lead pages, or
 * useLeadOverlay). `refetchOnWindowFocus` there caused a refetch storm every
 * time an admin returned to the tab, and `refetchOnMount: 'always'` made every
 * switch between lead pages show a loading spinner. Both were fixed
 * deliberately — the leads inbox uses its own shorter staleTime plus an
 * in-memory page cache instead.
 */
export const ADMIN_LIVE_QUERY_OPTIONS = {
  staleTime: 15_000,
  refetchOnMount: 'always',
  refetchOnWindowFocus: true,
} as const;
