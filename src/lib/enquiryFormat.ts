// Shared formatting for the free-text "Enquiry / message" field.
//
// Some leads store the message as a JSON object (e.g. ROI/savings-calculator
// inputs like {"industry":"construction","teamSize":5,...}). Instead of dumping
// raw JSON we detect that shape and render a clean, humanized labelled list.
// If the value isn't JSON, it's shown as plain text.

import { normalizeMultilineText } from './normalizeMultilineText';

export interface EnquiryField {
  label: string;
  value: string;
}

export type ParsedEnquiry =
  | { kind: 'fields'; fields: EnquiryField[] }
  | { kind: 'text'; text: string }
  | null;

// Known keys → friendly labels (ROI/savings-calculator inputs).
const KNOWN_LABELS: Record<string, string> = {
  industry: 'Industry',
  teamSize: 'Team size',
  averageSalary: 'Average salary',
  hoursOnAdmin: 'Hours on admin',
  workflowCount: 'Workflows',
  website: 'Website',
  companySize: 'Company size',
  teamsize: 'Team size',
};

// Keys whose numeric value should be rendered as AUD currency.
const CURRENCY_KEYS = new Set([
  'averagesalary',
  'salary',
  'revenue',
  'budget',
  'annualrevenue',
  'savings',
]);

// Keys that are URLs / should stay verbatim (not Title-cased).
const VERBATIM_KEYS = new Set(['website', 'url', 'email', 'domain']);

/** Turn a camelCase / snake_case key into a friendly "Sentence case" label. */
function humanizeKey(key: string): string {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  if (!spaced) return key;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Title-case a string value ("construction" → "Construction"). */
function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

const currencyFmt = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
});

function formatValue(key: string, raw: unknown): string {
  const norm = key.toLowerCase().replace(/[_\s-]+/g, '');
  if (raw === null || raw === undefined || raw === '') return '—';
  if (typeof raw === 'boolean') return raw ? 'Yes' : 'No';
  if (typeof raw === 'number') {
    if (CURRENCY_KEYS.has(norm)) return currencyFmt.format(raw);
    return raw.toLocaleString('en-AU');
  }
  if (typeof raw === 'object') return JSON.stringify(raw);
  const s = String(raw).trim();
  if (VERBATIM_KEYS.has(norm)) return s;
  // Numeric-looking currency stored as string.
  if (CURRENCY_KEYS.has(norm) && /^\d+(\.\d+)?$/.test(s)) {
    return currencyFmt.format(Number(s));
  }
  return titleCase(s);
}

/**
 * Parse an enquiry/message value. Accepts a raw column value (string, object,
 * null). Returns a labelled field list when the value is a JSON object,
 * otherwise plain text (or null when empty).
 */
export function parseEnquiry(raw: unknown): ParsedEnquiry {
  if (raw === null || raw === undefined) return null;

  let obj: unknown = raw;

  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return null;
    // Only attempt JSON parse when it looks like an object.
    if (s.startsWith('{') && s.endsWith('}')) {
      try {
        obj = JSON.parse(s);
      } catch {
        return { kind: 'text', text: normalizeMultilineText(s) };
      }
    } else {
      return { kind: 'text', text: normalizeMultilineText(s) };
    }
  }

  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    const text = normalizeMultilineText(String(raw));
    return text ? { kind: 'text', text } : null;
  }

  const entries = Object.entries(obj as Record<string, unknown>).filter(
    ([, v]) => v !== null && v !== undefined && v !== '',
  );
  if (entries.length === 0) return null;

  const fields: EnquiryField[] = entries.map(([k, v]) => ({
    label: KNOWN_LABELS[k] ?? KNOWN_LABELS[k.toLowerCase()] ?? humanizeKey(k),
    value: formatValue(k, v),
  }));

  return { kind: 'fields', fields };
}
