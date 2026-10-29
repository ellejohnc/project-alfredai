/**
 * Text formatting utilities for consistent display across admin panels
 */

// Special case prefixes/suffixes that should be lowercase (unless at start)
const LOWERCASE_PARTICLES = new Set([
  'van', 'von', 'de', 'del', 'della', 'der', 'den', 'di', 'la', 'le', 'du', 'des', 'da', 'das', 'do', 'dos'
]);

// Prefixes that should trigger capitalization of the next character
const SPECIAL_PREFIXES = ['mc', 'mac', "o'", "d'"];

/**
 * Remove emoji / pictographic characters (and their modifiers) from a string.
 * Names should never contain emojis, so we strip them at display time (via
 * formatName) AND on edit, which also cleans the stored value the next time an
 * admin saves. Whitespace is preserved so it's safe to call on every keystroke.
 */
export const stripEmojis = (value: string | null | undefined): string => {
  if (!value) return '';
  return value
    // A run of emoji (or their modifiers) collapses to a single space so an
    // emoji used as a separator — "😎MaNivas😍Nivi😎" — becomes "MaNivas Nivi".
    // The class is deliberately per-code-point AND quantified with `+`, so a
    // whole emoji cluster (base + variation selector + ZWJ + base) is consumed
    // by one run rather than split. Matching whole graphemes is exactly what we
    // do NOT want here: the modifiers must be eaten too.
    // eslint-disable-next-line no-misleading-character-class
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}]+/gu, ' ')
    .replace(/\s{2,}/g, ' ');
};

/**
 * Smart name capitalization that handles edge cases:
 * - McDonald, MacArthur, O'Brien, D'Angelo
 * - van der Berg, de la Cruz (lowercase particles)
 * - ALL CAPS -> Proper Case
 * - already Proper Case -> unchanged
 * 
 * @param name The name to format
 * @returns Properly capitalized name
 */
export const formatName = (name: string | null | undefined): string => {
  if (!name) return '';
  
  // Strip emojis first (names never legitimately contain them), then trim and
  // normalize whitespace so cleaned names render consistently everywhere.
  const trimmed = stripEmojis(name).trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  
  // Split into words
  const words = trimmed.split(' ');
  
  return words.map((word, index) => {
    // Skip empty words
    if (!word) return '';
    
    const lowerWord = word.toLowerCase();
    
    // Handle particles (van, de, etc.) - lowercase unless first word
    if (index > 0 && LOWERCASE_PARTICLES.has(lowerWord)) {
      return lowerWord;
    }
    
    // Handle special prefixes like Mc, Mac, O', D'
    for (const prefix of SPECIAL_PREFIXES) {
      if (lowerWord.startsWith(prefix) && lowerWord.length > prefix.length) {
        const afterPrefix = lowerWord.slice(prefix.length);
        const capitalizedPrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1);
        const capitalizedRest = afterPrefix.charAt(0).toUpperCase() + afterPrefix.slice(1).toLowerCase();
        return capitalizedPrefix + capitalizedRest;
      }
    }
    
    // Handle hyphenated names (e.g., "Anne-Marie")
    if (word.includes('-')) {
      return word.split('-').map((part, partIndex) => {
        if (!part) return '';
        const lowerPart = part.toLowerCase();
        // Check for particles in hyphenated names
        if (partIndex > 0 && LOWERCASE_PARTICLES.has(lowerPart)) {
          return lowerPart;
        }
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      }).join('-');
    }
    
    // Standard capitalization
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
};

/**
 * Format a display name from first/last name parts with smart capitalization
 */
export const formatDisplayName = (
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  fallback?: string
): string => {
  const parts = [firstName, lastName].filter(Boolean).map(formatName);
  if (parts.length === 0) {
    return fallback ? formatName(fallback) : '';
  }
  return parts.join(' ');
};

/**
 * Capitalizes a string, handling underscores and snake_case
 * e.g., "lead_chatbot" -> "Lead Chatbot", "submitted" -> "Submitted"
 */
export const capitalizeText = (text: string | null | undefined): string => {
  if (!text) return '';
  
  // Handle snake_case and kebab-case
  if (text.includes('_') || text.includes('-')) {
    return text
      .split(/[_-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  // Handle camelCase
  if (/[a-z][A-Z]/.test(text)) {
    return text
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Formats a source/medium string for display
 * e.g., "lead_chatbot" -> "Chatbot", "lead_form" -> "Form"
 */
export const formatSource = (source: string | null | undefined): string => {
  if (!source) return '';
  
  // Remove common prefixes
  const cleaned = source
    .replace(/^lead_/, '')
    .replace(/^source_/, '');
  
  return capitalizeText(cleaned);
};

/**
 * Formats a campaign string for display
 * e.g., "demo_request" -> "Demo Request", "contact_inquiry" -> "Contact Inquiry"
 */
export const formatCampaign = (campaign: string | null | undefined): string => {
  if (!campaign) return '';
  return capitalizeText(campaign);
};

/**
 * Formats a status string for display
 * e.g., "booking_shown" -> "Booking Shown", "confirmed" -> "Confirmed"
 */
export const formatStatus = (status: string | null | undefined): string => {
  if (!status) return '';
  return capitalizeText(status);
};

/**
 * Formats a tag string for display
 * e.g., "ghl_calendar_widget" -> "Calendar Widget", "demo_booked" -> "Demo Booked"
 */
export const formatTag = (tag: string | null | undefined): string => {
  if (!tag) return '';
  
  // Common tag mappings for cleaner display (all keys lowercase for matching)
  const tagMappings: Record<string, string> = {
    'ghl_calendar_widget': 'Calendar Widget',
    'ghl_direct_booking': 'Direct Booking',
    'calendar_widget': 'Calendar Widget',
    'demo_booked': 'Demo Booked',
    'demo booked': 'Demo Booked',
    'impact_conversation': 'Impact Conversation',
    'impact_conversation_booking': 'Impact Booking',
    'impact conversation booking': 'Impact Booking',
    'source: chatbot': 'Source: AI Assistant',
    'source: calendar_widget': 'Source: Calendar',
    'source: form': 'Source: Form',
    'source: personalization_flow': 'Source: Hero CTA',
    'hero cta': 'Hero CTA',
    'interactive qualification': 'Interactive Qualification',
    'personalized results': 'Personalized Results',
    'alfred ai website': 'alfred ai Website',
  };
  
  const lowerTag = tag.toLowerCase().trim();
  if (tagMappings[lowerTag]) {
    return tagMappings[lowerTag];
  }
  
  // Check for partial matches (e.g., "Industry: Construction")
  if (lowerTag.startsWith('industry:') || lowerTag.startsWith('team size:') || 
      lowerTag.startsWith('challenge:') || lowerTag.startsWith('page:') ||
      lowerTag.startsWith('source:')) {
    return capitalizeText(tag);
  }
  
  // Fall back to capitalizing
  return capitalizeText(tag);
};
