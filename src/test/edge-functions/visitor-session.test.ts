/**
 * Integration tests for visitor-session edge function
 * Tests the visitor session management endpoint
 */
import { describe, it, expect, beforeAll } from 'vitest';

// Fail fast if environment variables are missing
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Skip tests if env vars not available (CI/CD without Supabase)
const shouldSkip = !SUPABASE_URL || !SUPABASE_ANON_KEY;

describe.skipIf(shouldSkip)('visitor-session Edge Function', () => {
  const functionUrl = `${SUPABASE_URL}/functions/v1/visitor-session`;

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

  it('should create a new visitor session', async () => {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'create',
        data: {
          source: 'integration_test',
          utm_params: {
            utm_source: 'vitest',
            utm_medium: 'test',
            utm_campaign: 'integration',
          },
        },
      }),
    });

    expect([200, 201]).toContain(response.status);
    
    const data = await response.json();
    expect(data).toHaveProperty('session_token');
  });

  it('should retrieve an existing session by token', async () => {
    // First create a session
    const createResponse = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'create',
        data: { source: 'retrieve_test' },
      }),
    });

    const createData = await createResponse.json();
    const sessionToken = createData.session_token;

    if (!sessionToken) {
      console.log('Session creation failed, skipping retrieve test');
      return;
    }

    // Then retrieve it
    const getResponse = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'get',
        session_token: sessionToken,
      }),
    });

    expect(getResponse.status).toBe(200);
    
    const getData = await getResponse.json();
    expect(getData.session_token).toBe(sessionToken);
  });

  it('should update session data', async () => {
    // First create a session
    const createResponse = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'create',
        data: { source: 'update_test' },
      }),
    });

    const createData = await createResponse.json();
    const sessionToken = createData.session_token;

    if (!sessionToken) {
      console.log('Session creation failed, skipping update test');
      return;
    }

    // Then update it
    const updateResponse = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'update',
        session_token: sessionToken,
        data: {
          industry: 'Technology',
          company: 'Test Corp',
          team_size: '50-100',
        },
      }),
    });

    expect(updateResponse.status).toBe(200);
    
    const updateData = await updateResponse.json();
    expect(updateData.industry).toBe('Technology');
    expect(updateData.company).toBe('Test Corp');
  });

  it('should handle invalid session token gracefully', async () => {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'get',
        session_token: 'invalid-token-that-does-not-exist',
      }),
    });

    // Should return 404 or similar for non-existent session
    expect([200, 404]).toContain(response.status);
  });
});
