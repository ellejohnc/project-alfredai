/**
 * Every admin page Spotlight can navigate to, in one list.
 *
 * It lives here rather than inside the palette because a destination that does
 * not resolve is a 404 in someone's face: `Users & Roles` pointed at
 * `/admin/users`, which has never existed — the page is at
 * `/admin/settings/users`. `adminSpotlightRoutes.test.ts` reads the real
 * `<Route>` table out of `App.tsx` and fails if any path below cannot be
 * reached, so the next wrong guess is caught before it ships.
 *
 * The list is also the reason the palette deserves the word "global": it used
 * to carry thirteen pages, so most of the admin was unreachable from search.
 */

/** Which permission flag decides whether a row is rendered at all. */
export type SpotlightGate =
  | 'leads'
  | 'content'
  | 'users'
  | 'activity'
  | 'jobs'
  | 'admin'
  | 'superadmin'
  | 'anyone';

/** The section chip shown on the right of the row, and its icon. */
export type SpotlightSection = 'Leads' | 'Content' | 'Insights' | 'Settings';

export interface SpotlightPage {
  title: string;
  path: string;
  section: SpotlightSection;
  /** Extra words that should find this page but do not appear in its title. */
  keywords?: string;
  gate: SpotlightGate;
}

export const SPOTLIGHT_PAGES: readonly SpotlightPage[] = [
  // ── Leads ────────────────────────────────────────────────────────────────
  { title: 'Leads Inbox', path: '/admin/leads', section: 'Leads', keywords: 'all sources unified', gate: 'leads' },
  { title: 'Booked Leads', path: '/admin/leads-booked', section: 'Leads', keywords: 'meetings bookings appointments', gate: 'leads' },
  { title: 'Demo Leads', path: '/admin/demo-leads', section: 'Leads', keywords: 'demos', gate: 'leads' },
  { title: 'Meta Lead Ads', path: '/admin/meta-leads', section: 'Leads', keywords: 'facebook ads campaigns', gate: 'leads' },
  { title: 'Alpha Digital', path: '/admin/alpha-digital-leads', section: 'Leads', keywords: 'linkedin outbound', gate: 'leads' },
  { title: 'Investor Leads', path: '/admin/investor-leads', section: 'Leads', keywords: 'investors access requests', gate: 'leads' },
  { title: 'Webinar Leads', path: '/admin/webinar-leads', section: 'Leads', keywords: 'registrations signups', gate: 'leads' },
  { title: 'B2B Matchmaking', path: '/admin/b2b-matchmaking-leads', section: 'Leads', keywords: 'partners matching', gate: 'leads' },
  { title: 'Archived Leads', path: '/admin/archived-leads', section: 'Leads', keywords: 'archive restore', gate: 'leads' },
  { title: 'Contacts', path: '/admin/contacts', section: 'Leads', keywords: 'people directory person', gate: 'leads' },

  // ── Content ──────────────────────────────────────────────────────────────
  { title: 'Blog', path: '/admin/blog', section: 'Content', keywords: 'posts articles', gate: 'content' },
  { title: 'Guides', path: '/admin/guides', section: 'Content', keywords: 'resources', gate: 'content' },
  { title: 'Documentation', path: '/admin/docs', section: 'Content', keywords: 'docs help', gate: 'content' },
  { title: 'Webinars', path: '/admin/webinars', section: 'Content', keywords: 'events', gate: 'content' },
  { title: 'FAQs', path: '/admin/faqs', section: 'Content', keywords: 'questions answers', gate: 'content' },
  { title: 'Testimonials', path: '/admin/testimonials', section: 'Content', keywords: 'reviews quotes social proof', gate: 'content' },
  { title: 'Jobs', path: '/admin/jobs', section: 'Content', keywords: 'careers vacancies', gate: 'content' },
  { title: 'Job Applications', path: '/admin/job-applications', section: 'Content', keywords: 'applicants careers', gate: 'content' },
  { title: 'Documents', path: '/admin/documents', section: 'Content', keywords: 'files uploads', gate: 'content' },

  // ── Work ─────────────────────────────────────────────────────────────────
  { title: 'Quotes', path: '/admin/quotes', section: 'Insights', keywords: 'proposals pricing revenue', gate: 'admin' },
  { title: 'Handover Queue', path: '/admin/handover-queue', section: 'Insights', keywords: 'delivery sales handoff', gate: 'admin' },
  { title: 'Meetings', path: '/admin/meetings', section: 'Insights', keywords: 'calendar appointments', gate: 'leads' },
  { title: 'Discovery Meetings', path: '/admin/discovery-meetings', section: 'Insights', keywords: 'calendar', gate: 'leads' },
  { title: 'Solution Meetings', path: '/admin/solution-meetings', section: 'Insights', keywords: 'calendar', gate: 'leads' },
  { title: 'Personal Calendars', path: '/admin/personal-meetings', section: 'Insights', keywords: 'calendar', gate: 'leads' },

  // ── Insights ─────────────────────────────────────────────────────────────
  { title: 'Analytics', path: '/admin/analytics', section: 'Insights', keywords: 'traffic dashboard', gate: 'admin' },
  { title: 'Bounce Dashboard', path: '/admin/bounce', section: 'Insights', keywords: 'exits drop off', gate: 'admin' },
  { title: 'Sales Figures', path: '/admin/sales-figures', section: 'Insights', keywords: 'revenue ltv money', gate: 'superadmin' },
  { title: 'Search Analytics', path: '/admin/settings/search-analytics', section: 'Insights', keywords: 'queries site search', gate: 'admin' },
  { title: 'Keyword Tracking', path: '/admin/seo/keyword-tracking', section: 'Insights', keywords: 'seo rankings', gate: 'admin' },

  // ── Integrations & health ────────────────────────────────────────────────
  { title: 'System Health', path: '/admin/system-health', section: 'Settings', keywords: 'crons scheduled jobs findings api version content stale broken', gate: 'admin' },
  { title: 'GHL Sync', path: '/admin/ghl-sync', section: 'Settings', keywords: 'gohighlevel sources reached synced', gate: 'admin' },
  { title: 'GHL Submissions', path: '/admin/ghl-submissions', section: 'Settings', keywords: 'gohighlevel forms retry', gate: 'admin' },
  { title: 'Webhook Logs', path: '/admin/webhook-logs', section: 'Settings', keywords: 'integrations debug payloads', gate: 'admin' },
  { title: 'Connectors', path: '/admin/connectors', section: 'Settings', keywords: 'integrations sources', gate: 'admin' },
  { title: 'Scheduled Jobs', path: '/admin/settings/jobs', section: 'Settings', keywords: 'crons schedule', gate: 'jobs' },

  // ── Settings & access ────────────────────────────────────────────────────
  { title: 'Users & Roles', path: '/admin/settings/users', section: 'Settings', keywords: 'permissions team staff invite', gate: 'users' },
  { title: 'Activity Log', path: '/admin/settings/activity', section: 'Settings', keywords: 'audit history', gate: 'activity' },
  { title: 'Emails', path: '/admin/settings/emails', section: 'Settings', keywords: 'templates delivery logs', gate: 'admin' },
  { title: 'Newsletter Subscribers', path: '/admin/settings/newsletter', section: 'Settings', keywords: 'mailing list', gate: 'admin' },
  { title: 'System Settings', path: '/admin/settings/system', section: 'Settings', keywords: 'feature flags sitemap', gate: 'admin' },
  { title: 'Export Requests', path: '/admin/settings/export-requests', section: 'Settings', keywords: 'gdpr data', gate: 'admin' },
  { title: 'Blog API', path: '/admin/settings/blog-api', section: 'Settings', keywords: 'tokens integration', gate: 'admin' },
  { title: 'Theme', path: '/admin/settings/theme', section: 'Settings', keywords: 'appearance dark light', gate: 'admin' },
  { title: 'Data Tidy-Up', path: '/admin/tidy-up', section: 'Settings', keywords: 'cleanup duplicates', gate: 'admin' },
  { title: 'My Account', path: '/admin/settings/account', section: 'Settings', keywords: 'profile password me', gate: 'anyone' },
];

/** The flags a caller has to supply for {@link isPageAllowed} to resolve a gate. */
export interface SpotlightPermissions {
  canViewLeads: boolean;
  canManageContent: boolean;
  canViewUsers: boolean;
  canViewActivityLogs: boolean;
  canManageScheduledJobs: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

/**
 * A row the role cannot open is not rendered at all — never disabled. A greyed
 * row still tells a sales rep the page exists, which is the thing the gate is
 * there to avoid.
 */
export function isPageAllowed(gate: SpotlightGate, p: SpotlightPermissions): boolean {
  switch (gate) {
    case 'anyone': return true;
    case 'leads': return p.canViewLeads;
    case 'content': return p.canManageContent || p.isAdmin;
    case 'users': return p.canViewUsers || p.isSuperAdmin;
    case 'activity': return p.canViewActivityLogs || p.isAdmin;
    case 'jobs': return p.canManageScheduledJobs || p.isAdmin;
    case 'admin': return p.isAdmin;
    case 'superadmin': return p.isSuperAdmin;
  }
}
