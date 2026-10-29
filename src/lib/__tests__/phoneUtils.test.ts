import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  COUNTRY_CODES,
  detectCountryFromLocale,
  formatInternationalPhone,
  validatePhoneForCountry,
  getCountryByCode,
} from '../phoneUtils';

describe('phoneUtils', () => {
  describe('COUNTRY_CODES', () => {
    it('contains expected countries', () => {
      expect(COUNTRY_CODES.length).toBeGreaterThan(0);
      
      const countryCodes = COUNTRY_CODES.map(c => c.code);
      expect(countryCodes).toContain('AU');
      expect(countryCodes).toContain('US');
      expect(countryCodes).toContain('GB');
    });

    it('each country has required properties', () => {
      COUNTRY_CODES.forEach(country => {
        expect(country).toHaveProperty('code');
        expect(country).toHaveProperty('name');
        expect(country).toHaveProperty('dialCode');
        // No `flag` — CountryCode carries code/dialCode/name/minLength/
        // maxLength/placeholder. The test asserted a property the type has
        // never had, which `toHaveProperty` is untyped enough to allow.
        expect(country).toHaveProperty('placeholder');
      });
    });

    it('dial codes start with +', () => {
      COUNTRY_CODES.forEach(country => {
        expect(country.dialCode).toMatch(/^\+\d+/);
      });
    });
  });

  describe('detectCountryFromLocale', () => {
    beforeEach(() => {
      vi.stubGlobal('navigator', {
        language: 'en-AU',
        languages: ['en-AU', 'en'],
      });
    });

    it('returns a valid country code', () => {
      const result = detectCountryFromLocale();
      expect(typeof result).toBe('string');
      expect(result.length).toBe(2);
    });
  });

  describe('getCountryByCode', () => {
    it('returns country for valid code', () => {
      const australia = getCountryByCode('AU');
      expect(australia).toBeDefined();
      expect(australia?.name).toBe('Australia');
      expect(australia?.dialCode).toBe('+61');
    });

    it('returns undefined for invalid code', () => {
      const invalid = getCountryByCode('XX');
      expect(invalid).toBeUndefined();
    });
  });

  describe('formatInternationalPhone', () => {
    it('adds country code prefix to local number', () => {
      const result = formatInternationalPhone('0412345678', 'AU');
      expect(result).toMatch(/^\+61/);
    });

    it('does not double-prefix already international numbers', () => {
      const result = formatInternationalPhone('+61412345678', 'AU');
      expect(result).toBe('+61412345678');
    });

    it('handles numbers starting with dial code without +', () => {
      const result = formatInternationalPhone('61412345678', 'AU');
      // Should recognize it already has the dial code
      expect(result).toMatch(/^\+?61/);
    });

    it('returns original for unknown country code', () => {
      const result = formatInternationalPhone('12345', 'XX');
      expect(result).toBe('12345');
    });
  });

  describe('validatePhoneForCountry', () => {
    it('validates Australian phone numbers', () => {
      const validResult = validatePhoneForCountry('0412345678', 'AU');
      expect(validResult.isValid).toBe(true);
    });

    it('validates US phone numbers', () => {
      const validResult = validatePhoneForCountry('5551234567', 'US');
      expect(validResult.isValid).toBe(true);
    });

    it('rejects an empty phone — every caller treats it as required', () => {
      // This asserted the opposite, on the assumption that phone is optional.
      // It is not: ContactCaptureForm, the three demo portals, the demo modal
      // and PricingLeadCapture all check for empty themselves and report
      // "Mobile number is required" before ever calling this. A validator that
      // called "" valid would make each of those guards the only thing standing
      // between a blank field and a submitted form.
      const result = validatePhoneForCountry('', 'AU');
      expect(result.isValid).toBe(false);
    });

    it('rejects too short numbers', () => {
      const result = validatePhoneForCountry('123', 'AU');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
