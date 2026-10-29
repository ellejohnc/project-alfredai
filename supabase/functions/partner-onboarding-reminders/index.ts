import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { LOGO_URL, PRODUCTION_URL, SUPPORT_EMAIL } from "../_shared/config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ok = (body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

// Must stay in sync with src/lib/partnerOnboarding.ts
const ONBOARDING_STEPS: Array<{
  id: string;
  label: string;
  description: string;
  path: string;
}> = [
  { id: "sign_agreement", label: "Read and sign the Consulting Partner Agreement", description: "Review the terms and confirm your partnership.", path: "/partners/portal/agreement" },
  { id: "payment_details", label: "Set up your payment and tax details", description: "So we can pay your commission when client payments clear.", path: "/partners/portal/payment-details" },
  { id: "add_badge", label: "Add the AlfredAI Consulting Partner badge to your LinkedIn and email signature", description: "Grab the badge and brand assets.", path: "/partners/portal/brand" },
  { id: "follow_socials", label: "Follow and support AlfredAI on social media", description: "Follow our channels and help amplify AlfredAI to your network.", path: "/partners/portal/follow-support" },
  { id: "download_kit", label: "Download the sales kit", description: "Decks, one-pagers and email templates.", path: "/partners/portal/sales-kit" },
  { id: "apply_diy_quote", label: "Apply for DIY Quote Builder access", description: "Get approved to build client quotes and proposals in the AlfredAI tool.", path: "/partners/portal/diy-access" },
  { id: "watch_training", label: "Watch the product training", description: "Learn how to position and demo AlfredAI.", path: "/partners/portal/training" },
  { id: "pass_certification", label: "Pass the short certification", description: "Score 100% on the assessment to be signed off to sell AlfredAI.", path: "/partners/portal/training/certification" },
  { id: "register_account", label: "Register an account at AlfredAI", description: "After the product training, create your AlfredAI account to get started.", path: "/partners/portal" },
  { id: "use_notetaker", label: "Use AlfredAI's meeting notetaker for all online meetings", description: "Always run the AlfredAI notetaker on every online meeting so nothing is missed.", path: "/partners/portal" },
  { id: "register_deal", label: "Register your first deal", description: "Lock in your commission on a live opportunity.", path: "/partners/portal/register-deal" },
  { id: "kickoff_call", label: "Book your kickoff call with your AlfredAI contact", description: "Get aligned on your go-to-market plan.", path: "/partners/portal/support" },
];

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
      from: `alfred ai Partners <${gmailUser}>`,
      to,
      subject,
      content: "This email contains HTML content. Please view it in an HTML-compatible email client.",
      html,
    });
  } finally {
    await client.close();
  }
}

function buildEmail(params: {
  firstName: string;
  nextStep: { label: string; description: string; path: string };
  complete: number;
  total: number;
  remaining: Array<{ label: string }>;
}): string {
  const { firstName, nextStep, complete, total, remaining } = params;
  const pct = Math.round((complete / total) * 100);
  const nextUrl = `${PRODUCTION_URL}${nextStep.path}`;
  const dashboardUrl = `${PRODUCTION_URL}/partners/portal`;
  const remainingList = remaining
    .slice(0, 5)
    .map((s) => `<li style="margin:0 0 6px 0;font-size:14px;color:#475569;line-height:1.5;">${s.label}</li>`)
    .join("");
  const moreCount = Math.max(0, remaining.length - 5);

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Your next step to sell AlfredAI</title></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f8fafc;"><tr><td style="padding:48px 24px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;margin:0 auto;">
<tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);border-radius:16px 16px 0 0;padding:40px;text-align:center;">
<img src="${LOGO_URL}" alt="AlfredAI" style="display:block;margin:0 auto 16px auto;height:44px;width:auto;max-width:180px;" />
<p style="margin:0;font-size:13px;color:#ffffff;opacity:0.8;text-transform:uppercase;letter-spacing:2px;font-weight:500;">Consulting Partner Portal</p>
</td></tr>
<tr><td style="background-color:#ffffff;padding:40px;">
<h2 style="margin:0 0 12px 0;font-size:22px;font-weight:600;color:#1e293b;">Hi ${firstName}, one more step towards selling AlfredAI</h2>
<p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#475569;">You've completed <strong>${complete} of ${total}</strong> Get Started steps. Here's your next one:</p>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:0 0 24px 0;">
<p style="margin:0 0 6px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Next step</p>
<p style="margin:0 0 8px 0;font-size:17px;font-weight:600;color:#0f172a;">${nextStep.label}</p>
<p style="margin:0;font-size:14px;color:#64748b;line-height:1.5;">${nextStep.description}</p>
</div>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td style="text-align:center;padding:0 0 24px 0;">
<a href="${nextUrl}" style="display:inline-block;background:linear-gradient(135deg,#ff4d8d 0%,#e63b78 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:600;">Complete this step</a>
</td></tr></table>
<div style="background:#f1f5f9;border-radius:8px;padding:12px 16px;margin:0 0 24px 0;">
<p style="margin:0 0 6px 0;font-size:13px;color:#475569;"><strong>${pct}% complete</strong> — ${total - complete} step${total - complete === 1 ? "" : "s"} to go</p>
<div style="height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden;"><div style="width:${pct}%;height:100%;background:#14b8a6;"></div></div>
</div>
${remainingList ? `<p style="margin:0 0 8px 0;font-size:13px;font-weight:600;color:#0f172a;">Still to do:</p><ul style="margin:0 0 16px 20px;padding:0;">${remainingList}</ul>${moreCount ? `<p style="margin:0 0 16px 0;font-size:13px;color:#94a3b8;">+ ${moreCount} more</p>` : ""}` : ""}
<p style="margin:0;font-size:13px;color:#94a3b8;">See your full checklist any time in the <a href="${dashboardUrl}" style="color:#e63b78;text-decoration:none;">Partner Portal</a>.</p>
</td></tr>
<tr><td style="background-color:#f1f5f9;padding:18px 40px;text-align:center;">
<p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">You're getting this weekly nudge until your Get Started checklist is finished. Questions? <a href="mailto:${SUPPORT_EMAIL}" style="color:#e63b78;text-decoration:none;">${SUPPORT_EMAIL}</a></p>
</td></tr>
<tr><td style="background-color:#f8fafc;border-radius:0 0 16px 16px;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
<p style="margin:0 0 4px 0;font-size:14px;font-weight:600;color:#1e293b;">AlfredAI</p>
<p style="margin:0;font-size:12px;color:#94a3b8;">Customised AI &amp; software for construction</p>
</td></tr></table></td></tr></table></body></html>`;
}

interface PartnerRow {
  user_id: string;
  full_name: string;
  contact_email: string | null;
  is_approved: boolean;
  is_admin: boolean;
  onboarding: Record<string, boolean> | null;
  created_at: string;
  last_onboarding_reminder_at: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = (await req.json().catch(() => ({}))) as {
      dryRun?: boolean;
      forceUserId?: string;
    };
    const dryRun = body.dryRun === true;

    let query = supabase
      .from("partner_profiles")
      .select("user_id, full_name, contact_email, is_approved, is_admin, onboarding, created_at, last_onboarding_reminder_at");

    if (body.forceUserId) query = query.eq("user_id", body.forceUserId);

    const { data, error } = await query;
    if (error) return ok({ success: false, error: error.message });

    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const partners = (data ?? []) as PartnerRow[];

    const results: Array<{ email: string; status: string; step?: string; error?: string }> = [];

    for (const p of partners) {
      if (!body.forceUserId) {
        if (p.is_admin || !p.is_approved) continue;
        // Only remind partners who have been in the portal for at least 7 days.
        const created = new Date(p.created_at).getTime();
        if (isNaN(created) || now - created < SEVEN_DAYS) continue;
        if (p.last_onboarding_reminder_at) {
          const last = new Date(p.last_onboarding_reminder_at).getTime();
          if (!isNaN(last) && now - last < SEVEN_DAYS) continue;
        }
      }

      const state = p.onboarding ?? {};
      const remaining = ONBOARDING_STEPS.filter((s) => !state[s.id]);
      if (remaining.length === 0) continue;

      // Resolve recipient email. contact_email is optional; fall back to auth.users.
      let recipient = p.contact_email?.trim() || "";
      if (!recipient) {
        const { data: authUser } = await supabase.auth.admin.getUserById(p.user_id);
        recipient = authUser?.user?.email ?? "";
      }
      if (!recipient) {
        results.push({ email: p.user_id, status: "skipped_no_email" });
        continue;
      }

      const complete = ONBOARDING_STEPS.length - remaining.length;
      const nextStep = remaining[0];
      const firstName = (p.full_name || "").split(" ")[0] || "there";
      const html = buildEmail({
        firstName,
        nextStep,
        complete,
        total: ONBOARDING_STEPS.length,
        remaining,
      });

      if (dryRun) {
        results.push({ email: recipient, status: "would_send", step: nextStep.id });
        continue;
      }

      try {
        await sendEmail(
          recipient,
          `Your next AlfredAI Partner step: ${nextStep.label}`,
          html,
        );
        await supabase
          .from("partner_profiles")
          .update({ last_onboarding_reminder_at: new Date().toISOString() })
          .eq("user_id", p.user_id);
        await supabase.from("partner_activity_log").insert({
          action: "onboarding_reminder_sent",
          actor_name: "System",
          resource_type: "partner",
          resource_id: p.user_id,
          resource_name: p.full_name,
          details: { next_step: nextStep.id, complete, total: ONBOARDING_STEPS.length },
        });
        results.push({ email: recipient, status: "sent", step: nextStep.id });
      } catch (err) {
        console.error("reminder send failed", recipient, err);
        results.push({
          email: recipient,
          status: "failed",
          step: nextStep.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return ok({ success: true, processed: results.length, results });
  } catch (error) {
    console.error("partner-onboarding-reminders error:", error);
    return ok({
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error",
    });
  }
};

serve(handler);
