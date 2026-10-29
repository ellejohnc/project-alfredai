import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  checks: {
    database: { status: string; latency?: number; error?: string };
    storage: { status: string; error?: string };
    auth: { status: string; error?: string };
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const healthStatus: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    checks: {
      database: { status: "unknown" },
      storage: { status: "unknown" },
      auth: { status: "unknown" },
    },
  };

  // Check database connectivity
  try {
    const dbStart = Date.now();
    const { error } = await supabase.from("admin_users").select("id").limit(1);
    const dbLatency = Date.now() - dbStart;
    
    if (error) {
      healthStatus.checks.database = { 
        status: "unhealthy", 
        error: error.message,
        latency: dbLatency 
      };
    } else {
      healthStatus.checks.database = { 
        status: "healthy", 
        latency: dbLatency 
      };
    }
  } catch (e: unknown) {
    healthStatus.checks.database = { 
      status: "unhealthy", 
      error: e instanceof Error ? e.message : "Unknown error"
    };
  }

  // Check storage connectivity
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      healthStatus.checks.storage = { status: "unhealthy", error: error.message };
    } else {
      healthStatus.checks.storage = { status: "healthy" };
    }
  } catch (e: unknown) {
    healthStatus.checks.storage = { status: "unhealthy", error: e instanceof Error ? e.message : "Unknown error" };
  }

  // Check auth service
  try {
    const { data, error } = await supabase.auth.getSession();
    // No session is fine, we just want to verify the service responds
    healthStatus.checks.auth = { status: "healthy" };
  } catch (e: unknown) {
    healthStatus.checks.auth = { status: "unhealthy", error: e instanceof Error ? e.message : "Unknown error" };
  }

  // Determine overall status
  const checkStatuses = Object.values(healthStatus.checks).map(c => c.status);
  if (checkStatuses.some(s => s === "unhealthy")) {
    healthStatus.status = checkStatuses.every(s => s === "unhealthy") ? "unhealthy" : "degraded";
  }

  const statusCode = healthStatus.status === "healthy" ? 200 : 
                     healthStatus.status === "degraded" ? 200 : 503;

  return new Response(JSON.stringify(healthStatus, null, 2), {
    status: statusCode,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});