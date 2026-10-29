import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = { maxRequests: 30, windowMs: 60 * 60 * 1000 }; // 30 requests per hour

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

interface SessionRequest {
  action: "create" | "get" | "update";
  sessionId?: string;
  sessionToken?: string;
  data?: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight
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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { action, sessionId, sessionToken, data }: SessionRequest = await req.json();
    console.log(`[visitor-session] Action: ${action}, SessionId: ${sessionId?.substring(0, 8)}...`);

    if (action === "create") {
      // Create a new session with a secure token
      const newToken = crypto.randomUUID() + "-" + crypto.randomUUID();
      
      const { data: session, error } = await supabase
        .from("visitor_sessions")
        .insert({
          session_token: newToken,
          ...data,
        })
        .select("id, session_token")
        .single();

      if (error) {
        console.error("[visitor-session] Create error:", error);
        throw error;
      }

      console.log(`[visitor-session] Created session: ${session.id.substring(0, 8)}...`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          sessionId: session.id, 
          sessionToken: session.session_token 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get") {
      if (!sessionId || !sessionToken) {
        return new Response(
          JSON.stringify({ error: "Session ID and token required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify token matches before returning data
      const { data: session, error } = await supabase
        .from("visitor_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("session_token", sessionToken)
        .maybeSingle();

      if (error) {
        console.error("[visitor-session] Get error:", error);
        throw error;
      }

      if (!session) {
        console.log("[visitor-session] Session not found or token mismatch");
        return new Response(
          JSON.stringify({ error: "Session not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Remove sensitive token from response
      const { session_token: _, ...safeSession } = session;
      
      return new Response(
        JSON.stringify({ success: true, session: safeSession }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "update") {
      if (!sessionId || !sessionToken) {
        return new Response(
          JSON.stringify({ error: "Session ID and token required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // First verify the token matches
      const { data: existing } = await supabase
        .from("visitor_sessions")
        .select("id")
        .eq("id", sessionId)
        .eq("session_token", sessionToken)
        .maybeSingle();

      if (!existing) {
        console.log("[visitor-session] Update denied - token mismatch");
        return new Response(
          JSON.stringify({ error: "Session not found or unauthorized" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Prevent updating the token itself
      const { session_token: _, id: __, ...safeData } = data as Record<string, unknown>;

      const { data: updated, error } = await supabase
        .from("visitor_sessions")
        .update(safeData)
        .eq("id", sessionId)
        .select("*")
        .single();

      if (error) {
        console.error("[visitor-session] Update error:", error);
        throw error;
      }

      // Remove sensitive token from response
      const { session_token: ___, ...safeSession } = updated;

      console.log(`[visitor-session] Updated session: ${sessionId.substring(0, 8)}...`);
      return new Response(
        JSON.stringify({ success: true, session: safeSession }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[visitor-session] Error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
