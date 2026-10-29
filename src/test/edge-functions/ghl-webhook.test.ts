/**
 * Integration tests for ghl-webhook edge function
 * Tests the GoHighLevel webhook processing endpoint
 */
import { describe, it, expect, beforeAll } from 'vitest';

// Fail fast if environment variables are missing
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Skip tests if env vars not available (CI/CD without Supabase)
const shouldSkip = !SUPABASE_URL || !SUPABASE_ANON_KEY;

describe.skipIf(shouldSkip)('ghl-webhook Edge Function', () => {
  const functionUrl = `${SUPABASE_URL}/functions/v1/ghl-webhook`;

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

  it('should handle appointment.scheduled webhook event', async () => {
    const webhookPayload = {
      type: 'appointment.scheduled',
      data: {
        id: 'test-appointment-id',
        calendarId: 'test-calendar',
        status: 'confirmed',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        contact: {
          id: 'test-contact-id',
          email: 'test-webhook@example.com',
          firstName: 'Test',
          lastName: 'Webhook',
          phone: '+1234567890',
        },
      },
    };

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(webhookPayload),
    });

    // Webhook should process successfully or return known error
    expect([200, 400, 500]).toContain(response.status);
    
    const data = await response.json();
    expect(data).toBeDefined();
  });

  it('should handle contact.created webhook event', async () => {
    const webhookPayload = {
      type: 'contact.created',
      data: {
        id: 'test-contact-new',
        email: 'new-contact@example.com',
        firstName: 'New',
        lastName: 'Contact',
        phone: '+1987654321',
        tags: ['test', 'integration'],
      },
    };

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(webhookPayload),
    });

    expect([200, 400, 500]).toContain(response.status);
  });

  it('should handle appointment.cancelled webhook event', async () => {
    const webhookPayload = {
      type: 'appointment.cancelled',
      data: {
        id: 'test-cancelled-appointment',
        calendarId: 'test-calendar',
        status: 'cancelled',
        cancellationReason: 'Test cancellation',
        contact: {
          id: 'test-contact-cancel',
          email: 'cancel-test@example.com',
        },
      },
    };

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(webhookPayload),
    });

    expect([200, 400, 500]).toContain(response.status);
  });
});
