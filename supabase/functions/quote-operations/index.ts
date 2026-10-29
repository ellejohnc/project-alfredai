import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { action, quickAccessCode, ...params } = await req.json();

    // Public, client-facing actions (proposal/agreement viewing).
    const PUBLIC_ACTIONS = new Set(["load"]);

    // Read-only actions that a valid quick-access code may also perform
    // (view-only Quote Builder users — no admin session required).
    const QUICK_ACCESS_ACTIONS = new Set(["list_recent", "search", "load", "similar_quotes", "verify_access"]);

    // The quick-access code that unlocks view-only mode. Stored as an Edge
    // Function secret so it is NEVER shipped in the client JS bundle.
    const DIY_QUICK_ACCESS_CODE = Deno.env.get("QUICK_ACCESS_CODE") ?? "";
    const hasQuickAccess =
      DIY_QUICK_ACCESS_CODE.length > 0 &&
      typeof quickAccessCode === "string" &&
      quickAccessCode.trim() === DIY_QUICK_ACCESS_CODE;

    // Quick-access is READ-ONLY view mode — it NEVER grants admin privileges.
    // Admin is only resolved from an authenticated admin session below.
    let isAdmin = false;
    // Approved partners get SCOPED access: they may build, save and load only
    // their own quotes (created_by = their email). Resolved below.
    let isPartner = false;
    let partnerUserId: string | undefined;
    let partnerEmail: string | undefined;

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (token && token !== anonKey) {
      const authClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      // Use getClaims (verifies asymmetric signing keys) with a getUser fallback.
      let userId: string | undefined;
      let userEmail: string | undefined;
      const { data: claimsData } = await authClient.auth.getClaims(token);
      userId = claimsData?.claims?.sub as string | undefined;
      userEmail = claimsData?.claims?.email as string | undefined;
      if (!userId) {
        const { data: userData } = await authClient.auth.getUser();
        userId = userData?.user?.id;
        userEmail = userData?.user?.email ?? userEmail;
      }
      if (userId) {
        const { data: adminCheck } = await supabase.rpc("is_admin", { _user_id: userId });
        isAdmin = isAdmin || !!adminCheck;

        // Not an admin? Check for an approved DIY access request (scoped partner).
        if (!isAdmin) {
          const { data: req } = await supabase
            .from("diy_access_requests")
            .select("status, email")
            .eq("user_id", userId)
            .eq("status", "approved")
            .maybeSingle();
          if (req) {
            isPartner = true;
            partnerUserId = userId;
            partnerEmail = (req.email || userEmail || "").trim();
          }
        }
      }
    }

    // Actions a scoped partner may perform (own data only).
    const PARTNER_ACTIONS = new Set([
      "list_recent", "search", "load", "get_by_id", "get_current_quote",
      "get_version_count", "similar_quotes", "save_after_insert",
      "create_quote", "update_quote", "update_final_fees", "insert_version",
    ]);

    // Authorisation: admins can do everything; public actions are always allowed;
    // quick-access read actions are allowed only with a valid quick-access code;
    // approved partners can run their scoped action set.
    const isAuthorised =
      isAdmin ||
      PUBLIC_ACTIONS.has(action) ||
      (hasQuickAccess && QUICK_ACCESS_ACTIONS.has(action)) ||
      (isPartner && PARTNER_ACTIONS.has(action));

    if (!isAuthorised) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized", data: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Helper: confirm a quote (by db id) belongs to the scoped partner.
    const partnerOwnsQuote = async (quoteDbId: string): Promise<boolean> => {
      if (!quoteDbId) return false;
      const { data } = await supabase
        .from("quotes")
        .select("created_by_user_id, created_by")
        .eq("id", quoteDbId)
        .maybeSingle();
      if (!data) return false;
      return (
        data.created_by_user_id === partnerUserId ||
        (!!partnerEmail && (data.created_by || "").toLowerCase() === partnerEmail.toLowerCase())
      );
    };


    switch (action) {
      // Lightweight gate check: reaching here means the caller is authorised
      // (valid quick-access code, admin session, or scoped partner).
      case "verify_access": {
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list_recent": {
        const { salesRep } = params;
        let query = supabase
          .from("quotes")
          .select("id, quote_id, company_name, contact_name, industry, status, created_at, updated_at, created_by")
          .order("updated_at", { ascending: false })
          .limit(10);

        // Scope recent quotes to a specific sales rep / partner when provided.
        // Approved partners are ALWAYS scoped to their own quotes.
        const listScope = isPartner ? partnerEmail : (typeof salesRep === "string" ? salesRep.trim() : "");
        if (listScope) {
          query = query.ilike("created_by", listScope);
        }


        const { data, error } = await query;

        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "search": {
        const { query: searchQuery, salesRep } = params;
        if (!searchQuery?.trim()) {
          return new Response(JSON.stringify({ data: [] }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const searchTerm = `%${searchQuery}%`;
        let q = supabase
          .from("quotes")
          .select("id, quote_id, company_name, contact_name, industry, status, created_at, updated_at, created_by")
          .or(`quote_id.ilike.${searchTerm},company_name.ilike.${searchTerm},contact_name.ilike.${searchTerm}`)
          .order("updated_at", { ascending: false })
          .limit(20);

        // Scope search results to a specific sales rep / partner when provided.
        // Approved partners are ALWAYS scoped to their own quotes.
        const searchScope = isPartner ? partnerEmail : (typeof salesRep === "string" ? salesRep.trim() : "");
        if (searchScope) {
          q = q.ilike("created_by", searchScope);
        }


        const { data, error } = await q;

        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }


      case "load": {
        const { quoteId } = params;
        if (!quoteId) throw new Error("quoteId is required");

        const { data, error } = await supabase
          .from("quotes")
          .select("*")
          .eq("quote_id", quoteId)
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error("Quote not found");

        // Partners get full access only to their own quotes; public viewers
        // get a stripped payload.
        const partnerOwns = isPartner && (
          data.created_by_user_id === partnerUserId ||
          (!!partnerEmail && (data.created_by || "").toLowerCase() === partnerEmail.toLowerCase())
        );
        const fullAccess = isAdmin || partnerOwns;

        let history: unknown[] = [];
        if (fullAccess) {
          const { data: historyData } = await supabase
            .from("quote_versions")
            .select("version_number, created_at, created_by, change_summary, transcript_summary, meeting_transcript, notes")
            .eq("quote_id", data.id)
            .order("version_number", { ascending: false });
          history = historyData || [];
        } else {
          // Strip sensitive internal fields from public payload.
          delete (data as Record<string, unknown>).access_code;
          delete (data as Record<string, unknown>).signature_ip_hash;
          delete (data as Record<string, unknown>).meeting_transcript;
          delete (data as Record<string, unknown>).transcript_summary;
          delete (data as Record<string, unknown>).sentiment_analysis;
          delete (data as Record<string, unknown>).notes;
          delete (data as Record<string, unknown>).handover_notes;
        }


        return new Response(JSON.stringify({ data, history }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_by_id": {
        const { id, fields } = params;
        if (!id) throw new Error("id is required");

        const selectFields = fields || "id, quote_id";
        const { data, error } = await supabase
          .from("quotes")
          .select(selectFields)
          .eq("id", id)
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_version_count": {
        const { quoteDbId } = params;
        if (!quoteDbId) throw new Error("quoteDbId is required");

        const { data, error } = await supabase
          .from("quote_versions")
          .select("version_number")
          .eq("quote_id", quoteDbId)
          .order("version_number", { ascending: false })
          .limit(1);

        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_current_quote": {
        const { id } = params;
        if (!id) throw new Error("id is required");

        const { data, error } = await supabase
          .from("quotes")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "save_after_insert": {
        // After a public insert, return the inserted row data
        const { quoteId } = params;
        if (!quoteId) throw new Error("quoteId is required");

        const { data, error } = await supabase
          .from("quotes")
          .select("id, quote_id, access_code")
          .eq("quote_id", quoteId)
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "similar_quotes": {
        const { industry, teamSize, challenges, workflows, excludeQuoteId } = params;
        
        let query = supabase
          .from("quotes")
          .select("id, company_name, industry, team_size, setup_fee_min, setup_fee_final, monthly_retainer_min, monthly_retainer_final, roi_likely, status, outcome, workflows, challenges, created_at")
          .not("company_name", "is", null)
          .order("created_at", { ascending: false });

        if (excludeQuoteId) {
          query = query.neq("id", excludeQuoteId);
        }

        // Don't filter by industry — fetch broadly, then score
        const { data: candidates, error } = await query.limit(100);
        if (error) throw error;

        const inputChallenges: string[] = (challenges || []).filter(Boolean).map((c: string) => c.toLowerCase());
        const inputWorkflows: string[] = (workflows || []).filter(Boolean).map((w: string) => w.toLowerCase());

        const scored = (candidates || []).map((q: any) => {
          let score = 0;

          // Industry match (strong signal)
          if (industry && industry !== "general" && q.industry === industry) score += 5;

          // Team size proximity
          if (teamSize && q.team_size) {
            const ratio = Math.min(q.team_size, teamSize) / Math.max(q.team_size, teamSize);
            score += ratio * 3; // up to 3 points
          }

          // Challenges overlap
          if (inputChallenges.length > 0 && Array.isArray(q.challenges)) {
            const qChallenges = q.challenges.map((c: string) => c.toLowerCase());
            const overlap = inputChallenges.filter((c: string) => qChallenges.includes(c)).length;
            score += Math.min(overlap * 2, 6); // up to 6 points
          }

          // Workflows overlap (compare by name)
          if (inputWorkflows.length > 0 && Array.isArray(q.workflows)) {
            const qWorkflowNames = q.workflows.map((w: any) => 
              (typeof w === 'string' ? w : w?.name || w?.label || '').toLowerCase()
            ).filter(Boolean);
            const overlap = inputWorkflows.filter((w: string) => 
              qWorkflowNames.some((qw: string) => qw.includes(w) || w.includes(qw))
            ).length;
            score += Math.min(overlap * 2, 6); // up to 6 points
          }

          // Prefer quotes with outcomes
          if (q.outcome === "won") score += 1.5;
          if (q.outcome === "lost") score += 1;
          if (q.status === "signed") score += 1;
          if (q.status === "sent") score += 0.5;

          return { ...q, _score: score };
        });

        // Filter out very low matches, sort by score, take top 8
        const MIN_SCORE = 3;
        const filtered = scored.filter((q: any) => q._score >= MIN_SCORE);
        filtered.sort((a: any, b: any) => b._score - a._score);
        const results = filtered.slice(0, 8).map(({ _score, ...q }: any) => q);

        return new Response(JSON.stringify({ data: results }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_final_fees": {
        const { quoteDbId, setupFee, monthlyRetainer } = params;
        if (!quoteDbId) throw new Error("quoteDbId is required");
        if (isPartner && !isAdmin && !(await partnerOwnsQuote(quoteDbId))) {
          return new Response(JSON.stringify({ success: false, error: "Unauthorized", data: [] }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { error } = await supabase
          .from("quotes")
          .update({
            setup_fee_final: setupFee,
            monthly_retainer_final: monthlyRetainer,
            updated_at: new Date().toISOString(),
          })
          .eq("id", quoteDbId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ----- Admin / quick-access write actions (service role) -----
      case "create_quote": {
        const { quote } = params;
        if (!quote || typeof quote !== "object") throw new Error("quote payload is required");
        // Stamp ownership for scoped partners so their quotes stay theirs.
        const quotePayload = (isPartner && !isAdmin)
          ? { ...quote, created_by: partnerEmail, created_by_user_id: partnerUserId }
          : quote;
        const { data, error } = await supabase
          .from("quotes")
          .insert(quotePayload)
          .select("id, quote_id, access_code")
          .single();
        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_quote": {
        const { id, quote } = params;
        if (!id) throw new Error("id is required");
        if (!quote || typeof quote !== "object") throw new Error("quote payload is required");
        if (isPartner && !isAdmin && !(await partnerOwnsQuote(id))) {
          return new Response(JSON.stringify({ success: false, error: "Unauthorized", data: [] }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Partners cannot reassign ownership of a quote.
        const updatePayload = (isPartner && !isAdmin)
          ? (() => { const { created_by, created_by_user_id, ...rest } = quote as Record<string, unknown>; return rest; })()
          : quote;
        const { error } = await supabase
          .from("quotes")
          .update({ ...updatePayload, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "insert_version": {
        const { version } = params;
        if (!version || typeof version !== "object") throw new Error("version payload is required");
        if (isPartner && !isAdmin) {
          const targetQuote = (version as Record<string, unknown>).quote_id as string;
          if (!targetQuote || !(await partnerOwnsQuote(targetQuote))) {
            return new Response(JSON.stringify({ success: false, error: "Unauthorized", data: [] }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
        const { error } = await supabase
          .from("quote_versions")
          .insert(version);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }


      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[quote-operations] Error:", message);
    return new Response(JSON.stringify({ success: false, error: message, data: [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
