import { describe, it, expect } from 'vitest';
import {
  PRODUCTION_URL,
  APP_URL,
  SUPPORT_EMAIL,
  SALES_EMAIL,
  HELLO_EMAIL,
  ENQUIRY_EMAIL,
  LOGO_URL,
  PRODUCTION_DOMAIN,
  PAGE_URLS,
  SEO_DEFAULTS,
  getShareableUrl,
  getPageUrl,
  getAppUrl,
  normalizeUrl,
} from '../siteConfig';

describe('siteConfig constants', () => {
  describe('Domain Configuration', () => {
    it('has correct production URL', () => {
      expect(PRODUCTION_URL).toBe('https://new.alfredai.bot');
    });

    it('has correct app URL', () => {
      expect(APP_URL).toBe('https://app.alfredai.bot');
    });

    it('has correct production domain without protocol', () => {
      // NOT the same host as PRODUCTION_URL, which is https://new.alfredai.bot.
      // PRODUCTION_DOMAIN is the brand domain printed on customer-facing PDFs
      // (the ROI calculator and the quote PDFs render "www.alfredai.bot"),
      // while the site itself is served from the "new." host. Whether that is
      // deliberate is logged as a finding — this test pins what the code does
      // rather than what its comment claims.
      expect(PRODUCTION_DOMAIN).toBe('alfredai.bot');
      expect(PRODUCTION_URL).not.toContain('//' + PRODUCTION_DOMAIN);
    });

    it('has logo URL based on production URL', () => {
      expect(LOGO_URL).toContain(PRODUCTION_URL);
      expect(LOGO_URL).toContain('alfred-ai-logo');
    });
  });

  describe('Email Configuration', () => {
    it('has correct email addresses', () => {
      expect(SUPPORT_EMAIL).toBe('support@alfredai.bot');
      expect(SALES_EMAIL).toBe('sales@alfredai.bot');
      expect(HELLO_EMAIL).toBe('hello@alfredai.bot');
      expect(ENQUIRY_EMAIL).toBe('enquiry@alfredai.bot');
    });

    it('all emails use alfredai.bot domain', () => {
      [SUPPORT_EMAIL, SALES_EMAIL, HELLO_EMAIL, ENQUIRY_EMAIL].forEach(email => {
        expect(email).toMatch(/@alfredai\.bot$/);
      });
    });
  });

  describe('PAGE_URLS', () => {
    it('contains required page routes', () => {
      expect(PAGE_URLS.home).toBeDefined();
      expect(PAGE_URLS.about).toBeDefined();
      expect(PAGE_URLS.contact).toBeDefined();
    });

    it('are relative paths, so getPageUrl is the one place the host is added', () => {
      // These were absolute once, which is what this asserted. They are paths
      // now — a route table, not a URL table — and getPageUrl prefixes the
      // host. Keeping them relative means a domain change is one constant.
      Object.values(PAGE_URLS).forEach(url => {
        expect(url).toMatch(/^\//);
      });
    });
  });

  describe('SEO_DEFAULTS', () => {
    it('has required SEO fields', () => {
      expect(SEO_DEFAULTS.siteName).toBeDefined();
      expect(SEO_DEFAULTS.titleTemplate).toBeDefined();
      expect(SEO_DEFAULTS.defaultTitle).toBeDefined();
      expect(SEO_DEFAULTS.defaultDescription).toBeDefined();
    });

    it('title template includes site name', () => {
      expect(SEO_DEFAULTS.titleTemplate).toContain('%s');
      expect(SEO_DEFAULTS.titleTemplate).toContain('alfred ai');
    });
  });
});

describe('siteConfig helper functions', () => {
  describe('getShareableUrl', () => {
    it('creates full URL from path', () => {
      const result = getShareableUrl('/test-page');
      expect(result).toBe('https://new.alfredai.bot/test-page');
    });

    it('handles paths without leading slash', () => {
      const result = getShareableUrl('test-page');
      expect(result).toBe('https://new.alfredai.bot/test-page');
    });

    it('handles empty path', () => {
      const result = getShareableUrl('');
      expect(result).toBe('https://new.alfredai.bot/');
    });
  });

  describe('getPageUrl', () => {
    it('returns correct URL for page key', () => {
      expect(getPageUrl('contact')).toBe(`${PRODUCTION_URL}${PAGE_URLS.contact}`);
    });

    it('returns home URL for home key', () => {
      expect(getPageUrl('home')).toBe(`${PRODUCTION_URL}${PAGE_URLS.home}`);
    });
  });

  describe('getAppUrl', () => {
    it('creates app URL with default path', () => {
      const result = getAppUrl();
      expect(result).toBe('https://app.alfredai.bot/users/sign_in');
    });

    it('creates app URL with custom path', () => {
      const result = getAppUrl('/dashboard');
      expect(result).toBe('https://app.alfredai.bot/dashboard');
    });

    it('handles paths without leading slash', () => {
      const result = getAppUrl('profile');
      expect(result).toBe('https://app.alfredai.bot/profile');
    });
  });

  describe('normalizeUrl', () => {
    it('returns empty string for empty input', () => {
      expect(normalizeUrl('')).toBe('');
    });

    it('normalizes old alfredai.app domain', () => {
      const result = normalizeUrl('https://alfredai.app/test');
      expect(result).toContain('new.alfredai.bot');
    });

    it('normalizes old alfredai.io domain', () => {
      const result = normalizeUrl('https://alfredai.io/test');
      expect(result).toContain('new.alfredai.bot');
    });

    it('normalizes localhost URLs', () => {
      const result = normalizeUrl('http://localhost:3000/test');
      expect(result).toContain('new.alfredai.bot');
    });

    it('preserves already correct URLs', () => {
      const input = 'https://new.alfredai.bot/test';
      const result = normalizeUrl(input);
      expect(result).toBe(input);
    });

    it('handles external URLs gracefully', () => {
      const input = 'https://google.com/test';
      const result = normalizeUrl(input);
      expect(result).toBe(input);
    });
  });
});
