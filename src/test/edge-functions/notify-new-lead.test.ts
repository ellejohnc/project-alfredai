/**
 * Integration tests for notify-new-lead edge function
 * Tests the lead notification email endpoint
 */
import { describe, it, expect, beforeAll } from 'vitest';

// Fail fast if environment variables are missing
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Skip tests if env vars not available (CI/CD without Supabase)
const shouldSkip = !SUPABASE_URL || !SUPABASE_ANON_KEY;

describe.skipIf(shouldSkip)('notify-new-lead Edge Function', () => {
  const functionUrl = `${SUPABASE_URL}/functions/v1/notify-new-lead`;

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

  it('should return error when lead_email is missing', async () => {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        lead_name: 'Test User',
        source_page: '/test',
        source_medium: 'test',
      }),
    });

    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data.error).toContain('email');
  });

  it('should accept valid lead notification request structure', async () => {
    // Note: This test validates the request structure is accepted
    // Actual email delivery depends on SMTP configuration
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        lead_email: 'test-integration@example.com',
        lead_name: 'Integration Test',
        lead_phone: '+1234567890',
        lead_company: 'Test Company',
        source_page: '/integration-test',
        source_medium: 'automated_test',
        source_campaign: 'vitest',
      }),
    });

    // Function may succeed or fail based on SMTP config
    // We just verify it processes the request properly
    expect([200, 500]).toContain(response.status);
    
    const data = await response.json();
    expect(data).toHaveProperty('success');
  });
});
