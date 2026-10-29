/**
 * Centralized Site Configuration for alfred ai
 * All domain references should use these constants for consistency
 */

// =============================================================================
// DOMAIN CONFIGURATION
// =============================================================================

/** Main production website domain */
export const PRODUCTION_URL = 'https://new.alfredai.bot';

/** App domain for login/sign-up functionality */
export const APP_URL = 'https://app.alfredai.bot';

/** Support email address */
export const SUPPORT_EMAIL = 'support@alfredai.bot';

/** Sales email address */
export const SALES_EMAIL = 'sales@alfredai.bot';

/** General hello email address */
export const HELLO_EMAIL = 'hello@alfredai.bot';

/** General enquiry email address */
export const ENQUIRY_EMAIL = 'enquiry@alfredai.bot';

/** Logo URL for emails and external use */
export const LOGO_URL = `${PRODUCTION_URL}/alfred-ai-logo.png`;

/**
 * The brand domain, printed on customer-facing output — the ROI calculator PDF
 * renders `www.alfredai.bot` and the quote PDFs render it in the footer.
 *
 * NOT simply PRODUCTION_URL without its scheme, which is what this comment used
 * to say: PRODUCTION_URL is the `new.` host. Both serve the site, so printing
 * this one is deliberate and correct. Confirmed 21 Aug — worth stating, because
 * the mismatch reads like a bug every time someone finds it.
 */
export const PRODUCTION_DOMAIN = 'alfredai.bot';

// =============================================================================
// PAGE URLS - Centralized route references
// =============================================================================

export const PAGE_URLS = {
  // Main pages
  home: '/',
  about: '/company/about',
  contact: '/contact',
  book: '/book',
  
  // Resources
  resources: '/resources',
  blog: '/resources/blog',
  guides: '/resources/guides',
  demos: '/resources/demos',
  documentation: '/resources/documentation',
  
  // Impact & ROI
  roiCalculator: '/roi-calculator',
  caseStudies: '/impact-studies/case-studies',
  impactStudies: '/impact-studies',
  
  // Products
  products: '/products',
  solutions: '/solutions',
  
  // Admin
  admin: '/admin',
  diyQuote: '/explained/diy-quote',
  
  // Investor
  investors: '/investors',
  
  // Partners
  partners: '/partners',
} as const;

// =============================================================================
// SEO DEFAULTS
// =============================================================================

export const SEO_DEFAULTS = {
  siteName: "alfred ai",
  titleTemplate: "%s | alfred ai",
  defaultTitle: "alfred ai — Agentic AI for Construction",
  defaultDescription: "The agentic AI execution layer for construction. Agents orchestrate project workflows end-to-end — from request to delivery, 10x faster.",
  defaultImage: "/alfred-ai-logo.png",
  locale: "en_US",
};

// =============================================================================
// URL HELPER FUNCTIONS
// =============================================================================

/**
 * Generates a shareable URL using the production domain
 * @param path - The path to append (e.g., '/resources/demos/invoice-processing')
 * @returns Full URL with production domain
 */
export const getShareableUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${PRODUCTION_URL}${cleanPath}`;
};

/**
 * Generates a full URL for a specific page using PAGE_URLS
 * @param pageKey - Key from PAGE_URLS
 * @returns Full production URL
 */
export const getPageUrl = (pageKey: keyof typeof PAGE_URLS): string => {
  return `${PRODUCTION_URL}${PAGE_URLS[pageKey]}`;
};

/**
 * Generates app URL for login/auth pages
 * @param path - The path to append (e.g., '/users/sign_in')
 * @returns Full URL with app domain
 */
export const getAppUrl = (path: string = '/users/sign_in'): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${APP_URL}${cleanPath}`;
};

/**
 * Validates and normalizes a URL to use the correct production domain
 * @param url - URL to validate
 * @returns Corrected URL with production domain
 */
export const normalizeUrl = (url: string): string => {
  // Replace old domains with production domain
  const oldDomains = [
    'https://alfredai.app',
    'https://alfredai.io',
    'https://alfredai.bot',
    'http://localhost:3000',
    'http://localhost:5173',
  ];
  
  let normalizedUrl = url;
  
  // Handle Lovable preview/project URLs
  if (normalizedUrl.includes('.lovableproject.com') || normalizedUrl.includes('.lovable.app')) {
    try {
      const pathname = new URL(normalizedUrl).pathname;
      return `${PRODUCTION_URL}${pathname}`;
    } catch {
      // If URL parsing fails, just return production URL
      return PRODUCTION_URL;
    }
  }
  
  for (const oldDomain of oldDomains) {
    if (normalizedUrl.startsWith(oldDomain)) {
      normalizedUrl = normalizedUrl.replace(oldDomain, PRODUCTION_URL);
      break;
    }
  }
  
  return normalizedUrl;
};
