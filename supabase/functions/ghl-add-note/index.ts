import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { GHL_V3 } from "../_shared/ghlClient.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AddNoteRequest {
  contact_id?: string;
  body?: string;
  author_name?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ghlApiKey = Deno.env.get('GHL_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the caller is an authenticated admin.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: user.id });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Admin access required' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ghlApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'GHL_API_KEY is not configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: AddNoteRequest = await req.json();
    const contactId = (payload.contact_id || '').trim();
    const noteBody = (payload.body || '').trim();

    if (!contactId || !noteBody) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: contact_id and body' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Push the note body exactly as typed — no attribution header. GHL shows the
    // note under the integration user; author/time are tracked on our side.
    const attributedBody = noteBody;




    // Push note to GHL: POST /contacts/{contactId}/notes
    const ghlRes = await fetch(
      `https://services.leadconnectorhq.com/contacts/${contactId}/notes`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ghlApiKey}`,
          'Version': GHL_V3,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ body: attributedBody }),
      }
    );

    const ghlText = await ghlRes.text();
    if (!ghlRes.ok) {
      console.error('[GHL-ADD-NOTE] GHL API error', ghlRes.status, ghlText);
      return new Response(
        JSON.stringify({ success: false, error: `GHL API error (${ghlRes.status})`, detail: ghlText }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let ghlData: unknown = null;
    try { ghlData = JSON.parse(ghlText); } catch { /* ignore */ }

    return new Response(
      JSON.stringify({ success: true, ghl: ghlData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[GHL-ADD-NOTE] Unexpected error', err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
