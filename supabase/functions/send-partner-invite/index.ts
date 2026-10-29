import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { LOGO_URL, APP_URL, SUPPORT_EMAIL } from "../_shared/config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ok = (body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

interface InviteRequest {
  email?: string;
  fullName?: string;
  company?: string;
  territory?: string;
}

const VALID_TERRITORIES = ["US", "CA", "ANZ"];

async function sendEmail(to: string, subject: string, html: string) {
  const gmailUser = Deno.env.get("GMAIL_USER");
  const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
  if (!gmailUser || !gmailPassword) {
    throw new Error("Email service is not configured");
  }

  const client = new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: { username: gmailUser, password: gmailPassword },
    },
  });

  try {
    await client.send({
      from: `alfred ai <${gmailUser}>`,
      to,
      subject,
      content: "This email contains HTML content. Please view it in an HTML-compatible email client.",
      html,
    });
  } finally {
    await client.close();
  }
}

function buildInviteEmail(firstName: string, inviteLink: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Your AlfredAI Partner invitation</title></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f8fafc;"><tr><td style="padding:48px 24px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;margin:0 auto;"><tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);border-radius:16px 16px 0 0;padding:40px;text-align:center;"><img src="${LOGO_URL}" alt="AlfredAI" style="display:block;margin:0 auto 16px auto;height:44px;width:auto;max-width:180px;" /><p style="margin:0;font-size:13px;color:#ffffff;opacity:0.8;text-transform:uppercase;letter-spacing:2px;font-weight:500;">Consulting Partner Portal</p></td></tr><tr><td style="background-color:#ffffff;padding:40px;"><h2 style="margin:0 0 20px 0;font-size:24px;font-weight:600;color:#1e293b;">You're invited to partner with AlfredAI</h2><p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#475569;">Hi ${firstName}, you've been invited to join the AlfredAI Consulting Partner Portal. Accept your invitation below to set your password and get started.</p><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td style="text-align:center;padding:8px 0 32px 0;"><a href="${inviteLink}" style="display:inline-block;background:linear-gradient(135deg,#ff4d8d 0%,#e63b78 100%);color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:8px;font-size:16px;font-weight:600;">Accept invitation</a></td></tr></table><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:8px;"><tr><td style="border-top:1px solid #e2e8f0;padding-top:24px;"><p style="margin:0 0 8px 0;font-size:13px;color:#64748b;">If the button doesn't work, copy and paste this link:</p><p style="margin:0;font-size:13px;color:#e63b78;word-break:break-all;">${inviteLink}</p></td></tr></table></td></tr><tr><td style="background-color:#f1f5f9;padding:20px 40px;text-align:center;"><p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">Need help? Contact us at ${SUPPORT_EMAIL}<br>This invitation link expires in 7 days.</p></td></tr><tr><td style="background-color:#f8fafc;border-radius:0 0 16px 16px;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;"><p style="margin:0 0 4px 0;font-size:14px;font-weight:600;color:#1e293b;">AlfredAI</p><p style="margin:0;font-size:12px;color:#94a3b8;">Customised AI &amp; software for construction</p></td></tr></table></td></tr></table></body></html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return ok({ success: false, error: "You must be signed in." });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) return ok({ success: false, error: "Your session has expired. Please sign in again." });

    // Authorise: partner admin OR site admin / super admin.
    const { data: partnerRow } = await supabase
      .from("partner_profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .maybeSingle();
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    const isAdmin =
      partnerRow?.is_admin === true ||
      roleRow?.role === "admin" ||
      roleRow?.role === "super_admin";
    if (!isAdmin) return ok({ success: false, error: "Only portal admins can invite partners." });

    const body = (await req.json().catch(() => ({}))) as InviteRequest;
    const email = body.email?.trim().toLowerCase();
    const fullName = body.fullName?.trim();
    const company = body.company?.trim() || null;
    const territory = (body.territory || "ANZ").toUpperCase();

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return ok({ success: false, error: "Enter a valid email address." });
    }
    if (!fullName || fullName.length < 2) {
      return ok({ success: false, error: "Enter the partner's full name." });
    }
    if (!VALID_TERRITORIES.includes(territory)) {
      return ok({ success: false, error: "Choose a valid territory." });
    }

    // Generate an invite link (also creates the auth user if new).
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        data: { partner_signup: "true", full_name: fullName, company, territory },
        redirectTo: `${APP_URL}/partners/portal/sign-in`,
      },
    });

    if (linkError || !linkData?.user) {
      const msg = (linkError?.message || "").toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        return ok({ success: false, error: "An account with this email already exists." });
      }
      return ok({ success: false, error: linkError?.message || "Could not create the invitation." });
    }

    const invitedUserId = linkData.user.id;
    const actionLink = linkData.properties?.action_link;

    // Pre-approve the partner profile (admin-invited partners skip the review queue).
    await supabase.from("partner_profiles").upsert(
      {
        user_id: invitedUserId,
        full_name: fullName,
        company,
        territory,
        is_approved: true,
        is_admin: false,
      },
      { onConflict: "user_id" },
    );

    // Send the branded invitation email.
    if (actionLink) {
      await sendEmail(
        email,
        "You're invited to the AlfredAI Partner Portal",
        buildInviteEmail(fullName.split(" ")[0] || "there", actionLink),
      );
    }

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      user_email: user.email,
      action: "partner_invite_sent",
      resource_type: "partner",
      resource_id: invitedUserId,
      resource_name: email,
      details: { full_name: fullName, company, territory },
    });

    return ok({ success: true, email });
  } catch (error) {
    console.error("send-partner-invite error:", error);
    return ok({
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong sending the invitation.",
    });
  }
};

serve(handler);
