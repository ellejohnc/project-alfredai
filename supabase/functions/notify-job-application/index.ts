import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";
import { LOGO_URL, PRODUCTION_URL, SUPPORT_EMAIL } from "../_shared/config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Single recipient for new job-application alerts.
const HIRING_EMAIL = "william@alfredai.bot";
const ADMIN_URL = `${PRODUCTION_URL}/admin/job-applications`;
// Only notify for fresh applications, so an old id can't be replayed to spam.
const FRESH_MS = 15 * 60 * 1000;

const ok = (body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const esc = (s: string) =>
  (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type Attachment = { filename: string; content: Uint8Array; contentType?: string };

// nodemailer encodes long/non-ASCII subjects correctly (denomailer broke the
// headers, so Gmail showed the subject as =?utf-8?Q?... and the body as raw HTML).
async function sendEmail(to: string, subject: string, html: string, replyTo?: string, attachments: Attachment[] = []) {
  const user = Deno.env.get("GMAIL_USER");
  const pass = Deno.env.get("GMAIL_APP_PASSWORD");
  if (!user || !pass) throw new Error("Email service is not configured");
  const transport = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user, pass } });
  await transport.sendMail({
    from: { name: "alfred ai Careers", address: user },
    to,
    replyTo,
    subject,
    html,
    text: html.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    attachments: attachments.map((a) => ({ filename: a.filename, content: a.content, contentType: a.contentType })),
  });
}

function shell(title: string, inner: string) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${esc(title)}</title></head><body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:32px 16px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;"><tr><td style="background:#0f172a;border-radius:16px 16px 0 0;padding:32px;text-align:center;"><img src="${LOGO_URL}" alt="alfred ai" style="height:40px;width:auto;" /></td></tr><tr><td style="background:#ffffff;border:1px solid #e2e8f0;border-top:0;padding:32px;">${inner}</td></tr><tr><td style="background:#f1f5f9;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;font-size:13px;color:#64748b;">Questions? Contact ${SUPPORT_EMAIL}</td></tr></table></td></tr></table></body></html>`;
}

const row = (k: string, v: string) =>
  `<tr><td style="padding:4px 12px 4px 0;color:#94a3b8;vertical-align:top;width:120px;">${esc(k)}</td><td style="padding:4px 0;color:#1e293b;">${v}</td></tr>`;

const button = (href: string, label: string) =>
  `<a href="${esc(href)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;">${esc(label)}</a>`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const id = typeof body?.application_id === "string" ? body.application_id : "";
    if (!/^[0-9a-f-]{36}$/i.test(id)) return ok({ success: false, error: "A valid application id is required." });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: app, error } = await supabase
      .from("job_applications")
      .select("id, job_id, name, email, phone, linkedin_url, portfolio_url, cover_letter, resume_url, created_at, is_general_application")
      .eq("id", id)
      .maybeSingle();
    if (error || !app) return ok({ success: false, error: "No matching application found." });
    if (Date.now() - new Date(app.created_at).getTime() > FRESH_MS) {
      return ok({ success: false, error: "Application is too old to notify." });
    }

    let jobTitle = "General application";
    if (app.job_id) {
      const { data: job } = await supabase.from("job_openings").select("title").eq("id", app.job_id).maybeSingle();
      if (job?.title) jobTitle = job.title;
    }

    // CV: attached to the hiring email, plus a signed link as a fallback.
    let cvLink = "Not attached";
    const cvAttachments: Attachment[] = [];
    if (app.resume_url) {
      const path = decodeURIComponent(
        (app.resume_url.includes("/resumes/") ? app.resume_url.split("/resumes/")[1] : app.resume_url).split("?")[0],
      );
      const { data: signed } = await supabase.storage.from("resumes").createSignedUrl(path, 60 * 60 * 24 * 14, { download: true });
      const href = signed?.signedUrl || app.resume_url;
      const { data: file } = await supabase.storage.from("resumes").download(path);
      if (file && file.size <= 10 * 1024 * 1024) {
        const ext = path.split(".").pop() || "pdf";
        cvAttachments.push({
          filename: `CV - ${(app.name || "applicant").replace(/[^\w .-]/g, "").trim()}.${ext}`,
          content: new Uint8Array(await file.arrayBuffer()),
          contentType: file.type || undefined,
        });
      }
      cvLink = `${cvAttachments.length ? "Attached to this email. " : ""}<a href="${esc(href)}" style="color:#0f172a;">Download CV</a> <span style="color:#94a3b8;">(link valid 14 days)</span>`;
    }

    const appliedAt = new Date(app.created_at).toLocaleString("en-AU", {
      dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Sydney",
    });
    const link = (u?: string | null) => (u ? `<a href="${esc(u)}" style="color:#0f172a;">${esc(u)}</a>` : "Not provided");
    const notes = app.cover_letter
      ? `<h3 style="margin:24px 0 8px;font-size:15px;color:#1e293b;">Cover letter and checklist</h3><div style="white-space:pre-wrap;font-size:14px;line-height:1.6;color:#475569;background:#f8fafc;border-radius:8px;padding:16px;">${esc(app.cover_letter)}</div>`
      : "";

    const adminHtml = shell("New job application", `
      <h2 style="margin:0 0 8px;font-size:22px;color:#1e293b;">New application: ${esc(jobTitle)}</h2>
      <p style="margin:0 0 20px;color:#475569;">${esc(app.name)} has just applied.</p>
      <table role="presentation" style="font-size:14px;">
        ${row("Name", esc(app.name))}${row("Email", `<a href="mailto:${esc(app.email)}" style="color:#0f172a;">${esc(app.email)}</a>`)}
        ${row("Phone", esc(app.phone || "Not provided"))}${row("LinkedIn", link(app.linkedin_url))}
        ${row("Portfolio", link(app.portfolio_url))}${row("CV", cvLink)}${row("Applied", esc(appliedAt))}
      </table>${notes}
      <p style="margin:28px 0 0;text-align:center;">${button(ADMIN_URL, "Open job applications")}</p>`);

    const firstName = (app.name || "").trim().split(/\s+/)[0] || "there";
    const applicantHtml = shell("Application received", `
      <h2 style="margin:0 0 12px;font-size:22px;color:#1e293b;">Thanks for applying, ${esc(firstName)}</h2>
      <p style="margin:0 0 12px;color:#475569;line-height:1.6;">We've received your application for <strong>${esc(jobTitle)}</strong> at alfred ai.</p>
      <p style="margin:0 0 12px;color:#475569;line-height:1.6;">Our team will review it, and if your experience is a match we'll be in touch to arrange a conversation.</p>
      <p style="margin:0 0 24px;color:#475569;line-height:1.6;">You don't need to do anything else. If you'd like to add something, just reply to this email.</p>
      <p style="margin:0;text-align:center;">${button(`${PRODUCTION_URL}/careers`, "View careers")}</p>`);

    const results = await Promise.allSettled([
      sendEmail(HIRING_EMAIL, `New application: ${jobTitle} — ${app.name}`, adminHtml, app.email),
      sendEmail(app.email, `We've received your application — ${jobTitle}`, applicantHtml, HIRING_EMAIL),
    ]);
    const failed = results.filter((r) => r.status === "rejected").map((r) => String((r as PromiseRejectedResult).reason));
    if (failed.length) console.error("notify-job-application send failures:", failed);
    return ok({ success: failed.length === 0, admin_sent: results[0].status === "fulfilled", applicant_sent: results[1].status === "fulfilled" });
  } catch (err) {
    console.error("notify-job-application error:", err);
    return ok({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
  }
};

serve(handler);
