import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = { maxRequests: 20, windowMs: 60000 }; // 20 requests per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    return false;
  }
  
  if (record.count >= RATE_LIMIT.maxRequests) {
    return true;
  }
  
  record.count++;
  return false;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    
    // Check rate limit
    if (isRateLimited(clientIp)) {
      console.log(`[verify-recaptcha] Rate limited: ${clientIp}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { token, action } = await req.json();

    if (!token) {
      console.log('[verify-recaptcha] Missing token');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing reCAPTCHA token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const secretKey = Deno.env.get('RECAPTCHA_SECRET_KEY');
    if (!secretKey) {
      console.error('[verify-recaptcha] Missing RECAPTCHA_SECRET_KEY');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify with Google reCAPTCHA API
    const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`
    });

    const data = await response.json();
    
    console.log('[verify-recaptcha] Google response:', {
      success: data.success,
      score: data.score,
      action: data.action,
      expectedAction: action,
      hostname: data.hostname
    });

    // Check if verification succeeded
    if (!data.success) {
      console.log('[verify-recaptcha] Verification failed:', data['error-codes']);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'reCAPTCHA verification failed',
          errorCodes: data['error-codes']
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check action matches (if provided)
    if (action && data.action !== action) {
      console.log(`[verify-recaptcha] Action mismatch: expected ${action}, got ${data.action}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Action mismatch' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check score (reCAPTCHA v3 returns 0.0 - 1.0, higher is more likely human)
    const score = data.score || 0;
    const threshold = 0.5; // Adjust threshold as needed (0.5 is standard)
    
    if (score < threshold) {
      console.log(`[verify-recaptcha] Low score: ${score} < ${threshold}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Verification score too low. Please try again.',
          score 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[verify-recaptcha] Success - score: ${score}`);
    return new Response(
      JSON.stringify({ 
        success: true, 
        score,
        action: data.action 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[verify-recaptcha] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
