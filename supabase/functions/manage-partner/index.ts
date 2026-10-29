import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { LOGO_URL, PRODUCTION_URL, SUPPORT_EMAIL } from "../_shared/config.ts";

// The no-generic overload of createClient() resolves to a restrictive client
// type (tables/rows = never, rpc args = undefined). Use an any-database alias
// so partner creation can read/write tables without shipping generated types.
type SupabaseClientAny = ReturnType<typeof createClient<any>>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ok = (body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const VALID_TERRITORIES = ["US", "CA", "ANZ"];
const LOGIN_URL = `${PRODUCTION_URL}/partners/portal/sign-in`;

function generateTempPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%&*";
  const all = upper + lower + digits + symbols;
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)];
  let pwd = pick(upper) + pick(lower) + pick(digits) + pick(symbols);
  for (let i = 0; i < 8; i++) pwd += pick(all);
  return pwd
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

async function sendEmail(to: string, subject: string, html: string) {
  const gmailUser = Deno.env.get("GMAIL_USER");
  const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
  if (!gmailUser || !gmailPassword) throw new Error("Email service is not configured");
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

function buildCredentialsEmail(firstName: string, email: string, password: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Your AlfredAI Partner account is live</title></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f8fafc;"><tr><td style="padding:48px 24px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;margin:0 auto;"><tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);border-radius:16px 16px 0 0;padding:40px;text-align:center;"><img src="${LOGO_URL}" alt="AlfredAI" style="display:block;margin:0 auto 16px auto;height:44px;width:auto;max-width:180px;" /><p style="margin:0;font-size:13px;color:#ffffff;opacity:0.8;text-transform:uppercase;letter-spacing:2px;font-weight:500;">Consulting Partner Portal</p></td></tr><tr><td style="background-color:#ffffff;padding:40px;"><h2 style="margin:0 0 20px 0;font-size:24px;font-weight:600;color:#1e293b;">Welcome aboard, ${firstName}!</h2><p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#475569;">Your AlfredAI partner account has been approved and is now live. Sign in with the temporary credentials below — you'll be asked to set your own password the first time you log in.</p><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px 0;"><tr><td style="background-color:#f1f5f9;border:1px solid #e2e8f0;border-radius:12px;padding:8px 24px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td style="padding:16px 0;border-bottom:1px solid #e2e8f0;"><p style="margin:0 0 4px 0;font-size:11px;color:#64748b;text-transform:uppercase;">Email</p><p style="margin:0;font-size:16px;font-weight:600;color:#1e293b;">${email}</p></td></tr><tr><td style="padding:16px 0;"><p style="margin:0 0 4px 0;font-size:11px;color:#64748b;text-transform:uppercase;">Temporary password</p><p style="margin:0;font-size:16px;font-weight:600;color:#1e293b;font-family:monospace;background-color:#fef3c7;padding:8px 12px;border-radius:6px;display:inline-block;">${password}</p></td></tr></table></td></tr></table><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td style="text-align:center;padding:8px 0 24px 0;"><a href="${LOGIN_URL}" style="display:inline-block;background:linear-gradient(135deg,#ff4d8d 0%,#e63b78 100%);color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:8px;font-size:16px;font-weight:600;">Sign in to the portal</a></td></tr></table><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td style="background-color:#fef2f2;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:16px 20px;"><p style="margin:0;font-size:14px;color:#991b1b;line-height:1.5;"><strong>Security notice:</strong> For your protection you must change this temporary password on your first login.</p></td></tr></table></td></tr><tr><td style="background-color:#f1f5f9;padding:20px 40px;text-align:center;"><p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">Need help? Contact us at ${SUPPORT_EMAIL}</p></td></tr><tr><td style="background-color:#f8fafc;border-radius:0 0 16px 16px;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;"><p style="margin:0 0 4px 0;font-size:14px;font-weight:600;color:#1e293b;">AlfredAI</p><p style="margin:0;font-size:12px;color:#94a3b8;">Customised AI &amp; software for construction</p></td></tr></table></td></tr></table></body></html>`;
}

async function createLivePartner(
  supabase: SupabaseClientAny,
  details: { email: string; fullName: string; company: string | null; territory: string },
): Promise<{ success: boolean; error?: string; tempPassword?: string }> {
  const tempPassword = generateTempPassword();

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email: details.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      partner_signup: "true",
      full_name: details.fullName,
      company: details.company,
      territory: details.territory,
    },
  });

  if (createErr || !created?.user) {
    const msg = (createErr?.message || "").toLowerCase();
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
      return { success: false, error: "An account with this email already exists." };
    }
    return { success: false, error: createErr?.message || "Could not create the partner account." };
  }

  const userId = created.user.id;

  const { error: profileErr } = await supabase.from("partner_profiles").upsert(
    {
      user_id: userId,
      full_name: details.fullName,
      company: details.company,
      territory: details.territory,
      is_approved: true,
      is_admin: false,
      must_change_password: true,
    },
    { onConflict: "user_id" },
  );

  if (profileErr) {
    await supabase.auth.admin.deleteUser(userId);
    return { success: false, error: profileErr.message };
  }

  // Grant the distributor role so the approved partner appears as a
  // distributor account in the /Admin page. Non-fatal if it fails.
  const { error: roleErr } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role: "distributor" }, { onConflict: "user_id,role" });
  if (roleErr) {
    console.error("Failed to assign distributor role:", roleErr);
  }


  try {
    await sendEmail(
      details.email,
      "Your AlfredAI Partner account is live",
      buildCredentialsEmail(details.fullName.split(" ")[0] || "there", details.email, tempPassword),
    );
  } catch (e) {
    console.error("Failed to send credentials email:", e);
  }

  return { success: true, tempPassword };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return ok({ success: false, error: "You must be signed in." });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) {
      return ok({ success: false, error: "Your session has expired. Please sign in again." });
    }

    // Authorise: partner admin OR site admin / super admin.
    const [{ data: partnerRow }, { data: roleRow }] = await Promise.all([
      supabase.from("partner_profiles").select("is_admin").eq("user_id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
    ]);
    const isAdmin =
      partnerRow?.is_admin === true ||
      roleRow?.role === "admin" ||
      roleRow?.role === "super_admin";
    if (!isAdmin) return ok({ success: false, error: "You don't have permission to do this." });

    const body = await req.json();
    const action = body.action as string;

    if (action === "create_partner") {
      const email = body.email?.trim().toLowerCase();
      const fullName = body.fullName?.trim();
      const company = body.company?.trim() || null;
      const territory = (body.territory || "ANZ").toUpperCase();
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
        return ok({ success: false, error: "Enter a valid email address." });
      if (!fullName || fullName.length < 2)
        return ok({ success: false, error: "Enter the partner's full name." });
      if (!VALID_TERRITORIES.includes(territory))
        return ok({ success: false, error: "Choose a valid territory." });

      const result = await createLivePartner(supabase, { email, fullName, company, territory });
      if (!result.success) return ok(result);

      await supabase.from("activity_logs").insert({
        user_id: user.id,
        user_email: user.email,
        action: "partner_created",
        resource_type: "partner",
        resource_name: email,
        details: { full_name: fullName, company, territory },
      });
      return ok({ success: true, email });
    }

    if (action === "approve_application") {
      const applicationId = body.applicationId as string;
      if (!applicationId) return ok({ success: false, error: "Missing application id." });
      const { data: app, error: appErr } = await supabase
        .from("partner_applications")
        .select("*")
        .eq("id", applicationId)
        .maybeSingle();
      if (appErr || !app) return ok({ success: false, error: "Application not found." });
      if (app.status === "approved")
        return ok({ success: false, error: "This application is already approved." });

      const result = await createLivePartner(supabase, {
        email: (app.email as string).toLowerCase(),
        fullName: app.full_name as string,
        company: (app.company as string) || null,
        territory: app.territory as string,
      });
      if (!result.success) return ok(result);

      await supabase
        .from("partner_applications")
        .update({ status: "approved", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
        .eq("id", applicationId);

      await supabase.from("activity_logs").insert({
        user_id: user.id,
        user_email: user.email,
        action: "partner_application_approved",
        resource_type: "partner",
        resource_id: applicationId,
        resource_name: app.email,
      });
      return ok({ success: true, email: app.email });
    }

    if (action === "reject_application") {
      const applicationId = body.applicationId as string;
      if (!applicationId) return ok({ success: false, error: "Missing application id." });
      const { error } = await supabase
        .from("partner_applications")
        .update({ status: "rejected", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
        .eq("id", applicationId);
      if (error) return ok({ success: false, error: error.message });
      return ok({ success: true });
    }

    if (action === "delete_partner") {
      const userId = body.userId as string;
      if (!userId) return ok({ success: false, error: "Missing partner id." });
      const { data: target } = await supabase
        .from("partner_profiles")
        .select("is_admin")
        .eq("user_id", userId)
        .maybeSingle();
      if (target?.is_admin)
        return ok({ success: false, error: "Admin partners cannot be deleted here." });
      // Deleting the auth user cascades to partner_profiles.
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) return ok({ success: false, error: error.message });

      await supabase.from("activity_logs").insert({
        user_id: user.id,
        user_email: user.email,
        action: "partner_deleted",
        resource_type: "partner",
        resource_id: userId,
      });
      return ok({ success: true });
    }

    if (action === "reset_password") {
      const userId = body.userId as string;
      if (!userId) return ok({ success: false, error: "Missing partner id." });
      const { data: target } = await supabase
        .from("partner_profiles")
        .select("full_name")
        .eq("user_id", userId)
        .maybeSingle();
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      const email = authUser?.user?.email;
      if (!email) return ok({ success: false, error: "Partner account not found." });

      const tempPassword = generateTempPassword();
      const { error: updErr } = await supabase.auth.admin.updateUserById(userId, {
        password: tempPassword,
      });
      if (updErr) return ok({ success: false, error: updErr.message });

      await supabase
        .from("partner_profiles")
        .update({ must_change_password: true })
        .eq("user_id", userId);

      try {
        await sendEmail(
          email,
          "Your AlfredAI Partner password has been reset",
          buildCredentialsEmail(
            ((target?.full_name as string) || "there").split(" ")[0],
            email,
            tempPassword,
          ),
        );
      } catch (e) {
        console.error("Failed to send reset email:", e);
      }
      return ok({ success: true });
    }

    return ok({ success: false, error: "Unknown action." });
  } catch (error) {
    console.error("manage-partner error:", error);
    return ok({
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong.",
    });
  }
};

serve(handler);
