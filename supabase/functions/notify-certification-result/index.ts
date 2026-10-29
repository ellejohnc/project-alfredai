import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESULT_RECIPIENT = "william@alfredai.bot";

interface Payload {
  partnerName?: string;
  partnerEmail?: string;
  company?: string;
  territory?: string;
  score?: number;
  total?: number;
  passed?: boolean;
}

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(p: Payload): string {
  const when = new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" });
  return `<!DOCTYPE html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#475569;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:linear-gradient(135deg,#1e293b,#334155);color:#fff;padding:24px;border-radius:12px 12px 0 0;">
      <h1 style="margin:0;font-size:20px;">Partner Certification ${p.passed ? "Passed ✅" : "Attempt"}</h1>
    </div>
    <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;">
      <p style="margin:0 0 16px;">A partner has completed the AlfredAI certification assessment.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#94a3b8;">Partner</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#1e293b;">${esc(p.partnerName) || "—"}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8;">Email</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#1e293b;">${esc(p.partnerEmail) || "—"}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8;">Company</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#1e293b;">${esc(p.company) || "—"}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8;">Territory</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#1e293b;">${esc(p.territory) || "—"}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8;">Score</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#1e293b;">${esc(p.score)}/${esc(p.total)}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8;">Result</td><td style="padding:8px 0;text-align:right;font-weight:700;color:${p.passed ? "#0d9488" : "#e11d48"};">${p.passed ? "CERTIFIED" : "NOT PASSED"}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8;">Completed</td><td style="padding:8px 0;text-align:right;color:#1e293b;">${esc(when)} (AEST)</td></tr>
      </table>
    </div>
  </div></body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as Payload;

    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
    if (!gmailUser || !gmailPassword) {
      // Handled error: return 200 so the frontend can show a fallback.
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
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
        from: `alfred ai Certification <${gmailUser}>`,
        to: RESULT_RECIPIENT,
        subject: `${payload.passed ? "✅ Certified" : "Attempt"}: ${payload.partnerName || "Partner"} — ${payload.score}/${payload.total}`,
        content: "Partner certification result. Please view in an HTML-compatible client.",
        html: buildHtml(payload),
      });
    } finally {
      await client.close();
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("notify-certification-result error", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  }
});
