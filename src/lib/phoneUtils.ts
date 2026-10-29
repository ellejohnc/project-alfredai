/**
 * Phone number utilities with country code detection and formatting
 */

const COUNTRY_CODE_STORAGE_KEY = "alfred_phone_country_code";

export interface CountryCode {
  code: string;
  dialCode: string;
  name: string;
  minLength: number;
  maxLength: number;
  placeholder: string;
}

// Common country codes with their dial codes and formats
export const COUNTRY_CODES: CountryCode[] = [
  { code: "AU", dialCode: "+61", name: "Australia", minLength: 9, maxLength: 10, placeholder: "0400 000 000" },
  { code: "US", dialCode: "+1", name: "United States", minLength: 10, maxLength: 10, placeholder: "(555) 123-4567" },
  { code: "CA", dialCode: "+1", name: "Canada", minLength: 10, maxLength: 10, placeholder: "(555) 123-4567" },
  { code: "GB", dialCode: "+44", name: "United Kingdom", minLength: 10, maxLength: 11, placeholder: "07911 123456" },
  { code: "NZ", dialCode: "+64", name: "New Zealand", minLength: 8, maxLength: 10, placeholder: "021 123 4567" },
  { code: "SG", dialCode: "+65", name: "Singapore", minLength: 8, maxLength: 8, placeholder: "9123 4567" },
  { code: "AE", dialCode: "+971", name: "UAE", minLength: 9, maxLength: 9, placeholder: "50 123 4567" },
  { code: "SA", dialCode: "+966", name: "Saudi Arabia", minLength: 9, maxLength: 9, placeholder: "50 123 4567" },
  { code: "MY", dialCode: "+60", name: "Malaysia", minLength: 9, maxLength: 10, placeholder: "12 345 6789" },
  { code: "ID", dialCode: "+62", name: "Indonesia", minLength: 9, maxLength: 12, placeholder: "812 345 6789" },
  { code: "PH", dialCode: "+63", name: "Philippines", minLength: 10, maxLength: 10, placeholder: "917 123 4567" },
  { code: "IN", dialCode: "+91", name: "India", minLength: 10, maxLength: 10, placeholder: "98765 43210" },
  { code: "DE", dialCode: "+49", name: "Germany", minLength: 10, maxLength: 12, placeholder: "151 12345678" },
  { code: "FR", dialCode: "+33", name: "France", minLength: 9, maxLength: 9, placeholder: "6 12 34 56 78" },
];

/**
 * Get saved country code from localStorage
 */
export function getSavedCountryCode(): string | null {
  try {
    return localStorage.getItem(COUNTRY_CODE_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Save country code to localStorage
 */
export function saveCountryCode(code: string): void {
  try {
    localStorage.setItem(COUNTRY_CODE_STORAGE_KEY, code);
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

/**
 * Detect user's country from browser locale or saved preference
 * Priority: 1. Saved preference, 2. Browser locale, 3. Default (AU)
 */
export function detectCountryFromLocale(): string {
  // First check for saved preference
  const saved = getSavedCountryCode();
  if (saved && COUNTRY_CODES.find(c => c.code === saved)) {
    return saved;
  }
  
  // Fall back to browser locale detection
  try {
    const locale = navigator.language || "en-AU";
    const countryFromLocale = locale.split("-")[1]?.toUpperCase();
    const found = COUNTRY_CODES.find(c => c.code === countryFromLocale);
    return found ? found.code : "AU"; // Default to AU
  } catch {
    return "AU";
  }
}

/**
 * Get country info by code
 */
export function getCountryByCode(code: string): CountryCode | undefined {
  return COUNTRY_CODES.find(c => c.code === code);
}

/**
 * Format phone number for display based on country
 */
export function formatPhoneDisplay(value: string, countryCode: string): string {
  const digits = value.replace(/\D/g, "");
  const country = getCountryByCode(countryCode);

  if (!country) return digits;

  // Format based on country
  if (countryCode === "AU") {
    // Australian format: 0XXX XXX XXX
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
  }

  if (countryCode === "US" || countryCode === "CA") {
    // US/Canada format: (XXX) XXX-XXXX
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  if (countryCode === "GB") {
    // UK format: XXXXX XXXXXX
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5, 11)}`;
  }

  // Default format: add space every 3-4 digits
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

/**
 * Validate phone number for a specific country
 */
export function validatePhoneForCountry(
  phone: string,
  countryCode: string
): { isValid: boolean; error?: string } {
  const digits = phone.replace(/\D/g, "");
  const country = getCountryByCode(countryCode);

  if (!country) {
    // Fallback validation
    if (digits.length < 7) {
      return { isValid: false, error: "Phone number is too short" };
    }
    if (digits.length > 15) {
      return { isValid: false, error: "Phone number is too long" };
    }
    return { isValid: true };
  }

  if (digits.length < country.minLength) {
    return { isValid: false, error: `Phone number needs at least ${country.minLength} digits` };
  }

  if (digits.length > country.maxLength) {
    return { isValid: false, error: `Phone number is too long (max ${country.maxLength} digits)` };
  }

  return { isValid: true };
}

/**
 * Format phone with full international format (dial code + number)
 * Handles cases where phone may already have dial code
 */
export function formatInternationalPhone(phone: string, countryCode: string): string {
  if (!phone) return phone;
  
  const country = getCountryByCode(countryCode);
  if (!country) return phone;
  
  // If phone already starts with + and the dial code, it's already international
  if (phone.startsWith(country.dialCode)) {
    return phone;
  }
  
  // If phone starts with any +, it likely already has a dial code - return as-is
  if (phone.startsWith("+")) {
    return phone;
  }
  
  const digits = phone.replace(/\D/g, "");
  if (!digits) return phone;
  
  // Remove leading 0 if present (common in AU, UK, etc.)
  const normalizedDigits = digits.startsWith("0") ? digits.slice(1) : digits;
  
  return `${country.dialCode}${normalizedDigits}`;
}
