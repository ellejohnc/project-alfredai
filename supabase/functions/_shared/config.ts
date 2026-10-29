/**
 * Centralized Configuration for AlfredAI Edge Functions
 * All domain references should use these constants for consistency
 * 
 * IMPORTANT: This file is the single source of truth for URLs in edge functions.
 * When domains change, update only this file.
 */

// =============================================================================
// DOMAIN CONFIGURATION
// =============================================================================

/** Main production website domain */
export const PRODUCTION_URL = 'https://new.alfredai.bot';

/** App domain for login/sign-up functionality */
export const APP_URL = 'https://app.alfredai.bot';

/** Logo URL for emails (white version for dark headers) */
export const LOGO_URL = `${PRODUCTION_URL}/alfred-ai-white-mid.png`;

// =============================================================================
// EMAIL ADDRESSES
// =============================================================================

/** Support email address */
export const SUPPORT_EMAIL = 'support@alfredai.bot';

/** Sales email address */
export const SALES_EMAIL = 'sales@alfredai.bot';

/**
 * Recipients for lead alerts (new lead, sync success, sync failure).
 * Add more addresses here — it's a one-line edit and every alert path uses it.
 */
export const LEAD_ALERT_RECIPIENTS: string[] = [SALES_EMAIL];

/** General contact email */
export const HELLO_EMAIL = 'hello@alfredai.bot';

/** Payments email sender */
export const PAYMENTS_EMAIL = 'payments@alfredai.bot';

// =============================================================================
// PAGE URLS - Common routes used in emails and notifications
// =============================================================================

export const PAGE_URLS = {
  // Admin routes
  admin: `${PRODUCTION_URL}/admin`,
  adminQuotes: `${PRODUCTION_URL}/admin/quotes`,
  adminGhlSubmissions: `${PRODUCTION_URL}/admin/ghl-submissions`,
  adminInvestors: `${PRODUCTION_URL}/admin/investor-leads`,
  
  // Resources
  roiCalculator: `${PRODUCTION_URL}/roi-calculator`,
  caseStudies: `${PRODUCTION_URL}/impact-studies/case-studies`,
  guides: `${PRODUCTION_URL}/resources/guides`,
  blog: `${PRODUCTION_URL}/resources/blog`,
  demos: `${PRODUCTION_URL}/resources/demos`,
  
  // Main pages
  home: PRODUCTION_URL,
  investors: `${PRODUCTION_URL}/investors`,
  contact: `${PRODUCTION_URL}/contact`,
  book: `${PRODUCTION_URL}/book`,
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generates a full URL using the production domain
 * @param path - The path to append (e.g., '/resources/demos/invoice-processing')
 * @returns Full URL with production domain
 */
export function getFullUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${PRODUCTION_URL}${cleanPath}`;
}

/**
 * Generates app URL for login/auth pages
 * @param path - The path to append (e.g., '/users/sign_in')
 * @returns Full URL with app domain
 */
export function getAppUrl(path: string = '/users/sign_in'): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${APP_URL}${cleanPath}`;
}

/**
 * Generates an unsubscribe URL for newsletter emails
 * @param email - The subscriber email to prefill
 * @returns Full unsubscribe URL with email parameter
 */
export function getUnsubscribeUrl(email: string): string {
  return `${PRODUCTION_URL}/unsubscribe?email=${encodeURIComponent(email.toLowerCase())}`;
}

/**
 * Builds a standardized email footer with unsubscribe link
 * @param email - The recipient email address
 * @param footerText - Optional custom footer text
 * @returns HTML string for email footer with unsubscribe link
 */
export function buildEmailFooterWithUnsubscribe(
  email: string,
  footerText: string = "You're receiving this email because you subscribed to our newsletter."
): string {
  const unsubscribeUrl = getUnsubscribeUrl(email);
  return `
    <tr>
      <td style="background-color:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="margin:0 0 12px 0;font-size:13px;color:#64748b;line-height:1.5;">${footerText}</p>
        <a href="${unsubscribeUrl}" style="font-size:12px;color:#94a3b8;text-decoration:underline;">Unsubscribe from our emails</a>
      </td>
    </tr>
  `;
}

// =============================================================================
// GOHIGHLEVEL PIPELINE CONFIGURATION
// =============================================================================
// Default pipelines/stages where website-generated leads are placed as
// opportunities. IDs fetched live from the GHL API (location 0Mihjpq27y2HyrXxdfH3).
// Change these constants to re-route leads — no other code edits needed.

export const GHL_PIPELINES = {
  /** Generic website inbound leads (forms, CTAs, chatbot). */
  inbound: {
    pipelineId: 'opCR5kUQGesk8ASNoAeQ',
    pipelineName: 'AU MQ Leads',
    stageId: '4b93c65b-af54-48a5-8ec7-2d613eec0550',
    stageName: 'New Inbound Lead',
  },
  /** Leads who reach / book the calendar widget. */
  booking: {
    pipelineId: 'AP3m7DhUZcbVpF4PK4I3',
    pipelineName: 'Sales',
    stageId: '1e412a22-3c88-47b5-ac33-ccbd31de48da',
    stageName: 'Discovery Call Booked',
  },
} as const;

export type GHLPipelineKey = keyof typeof GHL_PIPELINES;

// GoHighLevel location (sub-account) ID — used to deep-link into contact records.
export const GHL_LOCATION_ID = '0Mihjpq27y2HyrXxdfH3';

/** Build a direct link to a contact record inside GoHighLevel. */
export function ghlContactUrl(contactId: string, locationId: string = GHL_LOCATION_ID): string {
  return `https://app.gohighlevel.com/v2/location/${locationId}/contacts/detail/${contactId}`;
}
