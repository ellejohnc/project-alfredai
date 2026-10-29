/**
 * Integration tests for verify-recaptcha edge function
 * Tests the reCAPTCHA verification endpoint
 */
import { describe, it, expect, beforeAll } from 'vitest';

// Fail fast if environment variables are missing
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Skip tests if env vars not available (CI/CD without Supabase)
const shouldSkip = !SUPABASE_URL || !SUPABASE_ANON_KEY;

describe.skipIf(shouldSkip)('verify-recaptcha Edge Function', () => {
  const functionUrl = `${SUPABASE_URL}/functions/v1/verify-recaptcha`;

  beforeAll(() => {
    if (!SUPABASE_URL) {
      throw new Error('VITE_SUPABASE_URL environment variable is required for tests');
    }
    if (!SUPABASE_ANON_KEY) {
      throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY environment variable is required for tests');
    }
  });

  it('should handle CORS preflight requests', async () => {
    const response = await fetch(functionUrl, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('should return error when token is missing', async () => {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Missing reCAPTCHA token');
  });

  it('should reject invalid reCAPTCHA tokens', async () => {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        token: 'invalid-token-12345',
        action: 'test_action',
      }),
    });

    const data = await response.json();
    
    // Should fail verification with invalid token
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });
});
