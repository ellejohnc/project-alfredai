import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationRequest {
  email: string;
  name: string;
}

function generateCode(): string {
  // Generate a 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-investor-verification: Request received");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: VerificationRequest = await req.json();
    console.log("send-investor-verification: Processing request for email:", email);

    if (!email) {
      console.error("send-investor-verification: Email is required");
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting: Check how many codes were sent to this email in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from("investor_verification_codes")
      .select("*", { count: "exact", head: true })
      .eq("email", normalizedEmail)
      .gte("created_at", oneHourAgo);

    if (countError) {
      console.error("send-investor-verification: Error checking rate limit:", countError);
    }

    const MAX_ATTEMPTS_PER_HOUR = 3;
    if (count !== null && count >= MAX_ATTEMPTS_PER_HOUR) {
      console.warn(`send-investor-verification: Rate limit exceeded for ${normalizedEmail}. Count: ${count}`);
      return new Response(
        JSON.stringify({ 
          error: "Too many verification attempts. Please try again in an hour.",
          rateLimited: true 
        }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate verification code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    console.log(`send-investor-verification: Generated code for ${normalizedEmail}. Attempt ${(count || 0) + 1}/${MAX_ATTEMPTS_PER_HOUR}`);

    // Delete any existing unverified codes for this email (keep count accurate)
    const { error: deleteError } = await supabase
      .from("investor_verification_codes")
      .delete()
      .eq("email", normalizedEmail)
      .is("verified_at", null);

    if (deleteError) {
      console.error("send-investor-verification: Error deleting old codes:", deleteError);
    }

    // Store the new verification code
    const { error: insertError } = await supabase
      .from("investor_verification_codes")
      .insert({
        email: normalizedEmail,
        code: code,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("send-investor-verification: Error storing code:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate verification code" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send email with code
    const firstName = name?.split(" ")[0] || "Investor";
    
    const emailResponse = await resend.emails.send({
      from: "alfred ai Investor Relations <onboarding@resend.dev>",
      to: [email],
      subject: "Your AlfredAI Investor Portal Verification Code",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <tr>
              <td>
                <!-- Header -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); border-radius: 12px 12px 0 0; padding: 32px;">
                  <tr>
                    <td align="center">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">AlfredAI</h1>
                      <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 14px;">Investor Relations</p>
                    </td>
                  </tr>
                </table>
                
                <!-- Body -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff; padding: 32px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
                  <tr>
                    <td>
                      <p style="margin: 0 0 24px 0; color: #334155; font-size: 16px; line-height: 1.6;">
                        Hello ${firstName},
                      </p>
                      <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                        Your verification code for the AlfredAI Investor Portal is:
                      </p>
                      
                      <!-- Code Box -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 24px 0;">
                        <tr>
                          <td align="center">
                            <div style="background: linear-gradient(135deg, #3b82f6 0%, #14b8a6 100%); padding: 3px; border-radius: 12px; display: inline-block;">
                              <div style="background-color: #ffffff; padding: 20px 40px; border-radius: 10px;">
                                <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1e293b; font-family: 'SF Mono', Monaco, 'Courier New', monospace;">${code}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                        This code will expire in <strong>10 minutes</strong>. Please enter it in the verification screen to continue.
                      </p>
                      
                      <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                        If you didn't request this code, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                </table>
                
                <!-- Footer -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 24px 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
                  <tr>
                    <td align="center">
                      <p style="margin: 0; color: #64748b; font-size: 12px;">
                        This is a confidential communication from AlfredAI.
                      </p>
                      <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 11px;">
                        © 2024 AlfredAI. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("send-investor-verification: Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Verification code sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("send-investor-verification: Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send verification code" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
