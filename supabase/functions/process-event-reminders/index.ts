import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { SUPPORT_EMAIL } from "../_shared/config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendEmail(to: string, subject: string, html: string) {
  const gmailUser = Deno.env.get("GMAIL_USER");
  const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");

  if (!gmailUser || !gmailPassword) {
    throw new Error("Gmail credentials not configured");
  }

  const client = new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: {
        username: gmailUser,
        password: gmailPassword,
      },
    },
  });

  try {
    await client.send({
      from: `alfred ai <${gmailUser}>`,
      to: to,
      subject: subject,
      html: html,
    });
    console.log(`Email sent successfully to ${to}`);
  } finally {
    await client.close();
  }

  return { success: true };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GMAIL_USER = Deno.env.get("GMAIL_USER");
    const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      console.error("Gmail credentials not configured");
      return new Response(
        JSON.stringify({ error: "Gmail credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Supabase credentials not configured");
      return new Response(
        JSON.stringify({ error: "Supabase credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find events happening in the next 24-25 hours (1-hour window for cron timing)
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    console.log(`[${now.toISOString()}] Checking for events between ${in24Hours.toISOString()} and ${in25Hours.toISOString()}`);

    // Get upcoming events with their registrations that haven't received reminders
    const { data: upcomingEvents, error: eventsError } = await supabase
      .from("webinars_events")
      .select(`
        id,
        title,
        description,
        event_date,
        event_type,
        join_url,
        event_registrations!inner (
          id,
          email,
          name,
          reminder_sent_at
        )
      `)
      .gte("event_date", in24Hours.toISOString())
      .lte("event_date", in25Hours.toISOString())
      .eq("status", "published")
      .is("event_registrations.reminder_sent_at", null);

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch events", details: eventsError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!upcomingEvents || upcomingEvents.length === 0) {
      console.log("No upcoming events requiring reminders");
      return new Response(
        JSON.stringify({ success: true, message: "No reminders to send", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${upcomingEvents.length} events with pending reminders`);

    let sentCount = 0;
    const errors: string[] = [];

    for (const event of upcomingEvents) {
      const formattedDate = new Date(event.event_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });

      const eventTypeLabel = event.event_type 
        ? event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1).replace('_', ' ')
        : 'Event';

      for (const registration of event.event_registrations) {
        try {
          console.log(`Sending reminder to ${registration.email} for event: ${event.title}`);

          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 40px 40px 30px;">
                          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">⏰ Starting Tomorrow!</h1>
                          <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Don't miss your upcoming event</p>
                        </td>
                      </tr>
                      
                      <!-- Content -->
                      <tr>
                        <td style="padding: 40px;">
                          <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                            Hi${registration.name ? ` ${registration.name}` : ''},
                          </p>
                          <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                            This is a friendly reminder that your event is <strong>tomorrow</strong>!
                          </p>
                          
                          <!-- Event Card -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d;">
                            <tr>
                              <td style="padding: 24px;">
                                <p style="margin: 0 0 8px; color: #92400e; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">${eventTypeLabel}</p>
                                <h2 style="margin: 0 0 16px; color: #111827; font-size: 20px; font-weight: 600;">${event.title}</h2>
                                <table cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td style="padding-right: 8px;">
                                      <span style="color: #f59e0b;">📅</span>
                                    </td>
                                    <td>
                                      <p style="margin: 0; color: #374151; font-size: 14px; font-weight: 500;">${formattedDate}</p>
                                    </td>
                                  </tr>
                                </table>
                                ${event.description ? `<p style="margin: 16px 0 0; color: #6b7280; font-size: 14px;">${event.description}</p>` : ''}
                              </td>
                            </tr>
                          </table>
                          
                          ${event.join_url ? `
                          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                            <tr>
                              <td align="center">
                                <a href="${event.join_url}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Join Event</a>
                              </td>
                            </tr>
                          </table>
                          ` : ''}
                          
                          <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                            Make sure to add it to your calendar so you don't miss it. We look forward to seeing you there!
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
                          <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                            Questions? Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color: #3b82f6; text-decoration: none;">${SUPPORT_EMAIL}</a>
                          </p>
                          <p style="margin: 12px 0 0; color: #9ca3af; font-size: 12px; text-align: center;">
                            © ${new Date().getFullYear()} AlfredAI. All rights reserved.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `;

          await sendEmail(
            registration.email,
            `⏰ Tomorrow: ${event.title}`,
            emailHtml
          );

          // Mark reminder as sent
          const { error: updateError } = await supabase
            .from("event_registrations")
            .update({ reminder_sent_at: new Date().toISOString() })
            .eq("id", registration.id);

          if (updateError) {
            console.error(`Failed to update reminder status for ${registration.email}:`, updateError);
            errors.push(`Update failed for ${registration.email}: ${updateError.message}`);
          } else {
            sentCount++;
            console.log(`Reminder sent successfully to ${registration.email}`);
          }
        } catch (emailError: any) {
          console.error(`Failed to send reminder to ${registration.email}:`, emailError);
          errors.push(`Email failed for ${registration.email}: ${emailError.message}`);
        }
      }
    }

    console.log(`Reminder processing complete. Sent: ${sentCount}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${upcomingEvents.length} events`, 
        sent: sentCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error processing reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
