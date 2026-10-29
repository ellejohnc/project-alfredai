/**
 * Integration tests for log-ghl-submission edge function
 * Tests the GHL submission logging endpoint
 */
import { describe, it, expect, beforeAll } from 'vitest';

// Fail fast if environment variables are missing
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Skip tests if env vars not available (CI/CD without Supabase)
const shouldSkip = !SUPABASE_URL || !SUPABASE_ANON_KEY;

describe.skipIf(shouldSkip)('log-ghl-submission Edge Function', () => {
  const functionUrl = `${SUPABASE_URL}/functions/v1/log-ghl-submission`;

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

  it('should require lead_email field', async () => {
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
    
    // Should fail without email
    expect(response.status).toBe(400);
    expect(data.error).toContain('email');
  });

  it('should accept valid submission data', async () => {
    const testEmail = `test-${Date.now()}@example-integration.com`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        lead_email: testEmail,
        lead_name: 'Integration Test User',
        lead_first_name: 'Integration',
        lead_last_name: 'Test User',
        lead_phone: '+61412345678',
        lead_company: 'Test Integration Corp',
        source_page: '/integration-test',
        source_medium: 'vitest_integration',
        source_campaign: 'automated_testing',
        lead_source: 'unit_test',
      }),
    });

    // Should succeed in logging the submission
    expect([200, 201]).toContain(response.status);
    
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('should handle duplicate submissions gracefully', async () => {
    const duplicateEmail = 'duplicate-test@example.com';
    
    // First submission
    await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        lead_email: duplicateEmail,
        source_page: '/test-duplicate',
        source_medium: 'test',
      }),
    });

    // Second submission with same email
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        lead_email: duplicateEmail,
        source_page: '/test-duplicate-2',
        source_medium: 'test',
      }),
    });

    // Should handle duplicate gracefully (either success or specific error)
    expect([200, 201, 409]).toContain(response.status);
  });
});
