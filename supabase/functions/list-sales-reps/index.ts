import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Auth-aware roster endpoint.
 *  - Authenticated admin caller → full reps (id, display_name, email, role) so
 *    the admin UI can map reps → GHL users by email.
 *  - Anyone else (e.g. the public DIY quote page) → minimal reps
 *    (id, display_name) only. No emails, no roles. Editors are still excluded.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const jsonResp = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Determine whether the caller is an authenticated admin.
    let isAdminCaller = false;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        const { data: adminFlag } = await supabase.rpc("is_admin", { _user_id: user.id });
        isAdminCaller = !!adminFlag;
      }
    }

    const { data, error } = await supabase
      .from("admin_users")
      .select("id, display_name, email, role")
      .order("display_name", { ascending: true });

    if (error) throw error;

    const filtered = (data ?? []).filter(
      (r: { role: string | null }) => (r.role ?? "").toLowerCase() !== "editor",
    );

    const reps = isAdminCaller
      ? filtered
      : filtered.map((r: { id: string; display_name: string | null }) => ({
          id: r.id,
          display_name: r.display_name,
        }));

    return jsonResp({ success: true, reps });
  } catch (e) {
    console.error("list-sales-reps error", e);
    return jsonResp({
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
      reps: [],
    });
  }
});
