import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = { maxRequests: 10, windowMs: 60 * 60 * 1000 }; // 10 requests per hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);
  
  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return true;
  }
  
  if (limit.count >= RATE_LIMIT.maxRequests) {
    return false;
  }
  
  limit.count++;
  return true;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting check
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) {
    console.log(`Rate limit exceeded for IP: ${ip.substring(0, 8)}...`);
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { email, action } = await req.json();

    // Validate email format
    if (!email || typeof email !== "string") {
      console.error("Invalid email provided");
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 255) {
      console.error("Invalid email format:", email.substring(0, 50));
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate action
    if (!action || !["unsubscribe", "resubscribe"].includes(action)) {
      console.error("Invalid action provided:", action);
      return new Response(
        JSON.stringify({ error: "Invalid action. Must be 'unsubscribe' or 'resubscribe'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for secure database access
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const normalizedEmail = email.trim().toLowerCase();
    const newIsActive = action === "resubscribe";

    console.log(`Processing ${action} request for email: ${normalizedEmail.substring(0, 3)}***`);

    // Build update object with timestamp tracking
    const updates: Record<string, unknown> = {
      is_active: newIsActive,
    };

    // Track status change timestamps
    if (action === "unsubscribe") {
      updates.unsubscribed_at = new Date().toISOString();
    } else {
      updates.resubscribed_at = new Date().toISOString();
    }

    // Capture IP and user agent if available
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const userAgent = req.headers.get("user-agent");
    if (clientIp) updates.ip_address = clientIp;
    if (userAgent) updates.user_agent = userAgent.substring(0, 500); // Limit length

    // Update the subscription status
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .update(updates)
      .eq("email", normalizedEmail)
      .select("id");

    if (error) {
      console.error("Database error:", error.message);
      return new Response(
        JSON.stringify({ error: "Failed to update subscription" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if any rows were updated
    if (!data || data.length === 0) {
      console.log("Email not found in subscribers list");
      return new Response(
        JSON.stringify({ success: false, found: false, message: "Email not found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully processed ${action} for subscriber`);
    return new Response(
      JSON.stringify({ 
        success: true, 
        found: true, 
        action,
        message: action === "unsubscribe" 
          ? "Successfully unsubscribed" 
          : "Successfully resubscribed"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Newsletter manage error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
