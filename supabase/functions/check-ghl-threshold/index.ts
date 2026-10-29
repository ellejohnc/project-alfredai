import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration
const DAILY_THRESHOLD = 10; // Alert when this many submissions in a day
const ADMIN_EMAIL = Deno.env.get('GMAIL_USER') || 'admin@alfredhq.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count today's submissions
    const { count, error: countError } = await supabase
      .from('ghl_submissions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    if (countError) {
      console.error('Error counting submissions:', countError);
      throw countError;
    }

    const todayCount = count || 0;
    console.log(`Today's GHL submissions: ${todayCount}, Threshold: ${DAILY_THRESHOLD}`);

    // Check if we've already sent an alert today
    const { data: lastAlert } = await supabase
      .from('activity_logs')
      .select('created_at')
      .eq('action', 'ghl_threshold_alert')
      .gte('created_at', today.toISOString())
      .limit(1);

    const alreadyAlerted = lastAlert && lastAlert.length > 0;

    if (todayCount >= DAILY_THRESHOLD && !alreadyAlerted) {
      console.log('Threshold reached, sending email notification...');

      // Get breakdown by source
      const { data: breakdown } = await supabase
        .from('ghl_submissions')
        .select('source_medium, source_campaign')
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      const sourceSummary = (breakdown || []).reduce((acc: Record<string, number>, row) => {
        const key = `${row.source_medium} - ${row.source_campaign || 'N/A'}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      const breakdownHtml = Object.entries(sourceSummary)
        .map(([source, count]) => `<li>${source}: ${count}</li>`)
        .join('');

      // Get email template or use default
      const { data: template } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_key', 'ghl_threshold_alert')
        .single();

      const subject = template?.subject || `🔔 GHL Submissions Alert: ${todayCount} leads today`;
      const bodyHtml = template?.body_text || `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e293b;">Daily GHL Submission Threshold Reached</h2>
          <p style="color: #475569;">Your site has received <strong>${todayCount}</strong> GHL form submissions today, exceeding the threshold of ${DAILY_THRESHOLD}.</p>
          
          <h3 style="color: #1e293b; margin-top: 24px;">Breakdown by Source:</h3>
          <ul style="color: #475569;">
            ${breakdownHtml}
          </ul>
          
          <p style="margin-top: 24px;">
            <a href="${supabaseUrl.replace('.supabase.co', '.lovable.app')}/admin/ghl-submissions" 
               style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
              View All Submissions
            </a>
          </p>
          
          <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">
            This is an automated alert from AlfredAI.
          </p>
        </div>
      `;

      // Send email using Resend
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (resendApiKey) {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'alfred ai <notifications@alfredhq.com>',
            to: [ADMIN_EMAIL],
            subject: subject,
            html: bodyHtml,
          }),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error('Failed to send email:', errorText);
        } else {
          console.log('Threshold alert email sent successfully');
        }
      } else {
        console.log('RESEND_API_KEY not configured, skipping email');
      }

      // Log the alert to prevent duplicate sends
      await supabase.from('activity_logs').insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        user_email: 'system',
        action: 'ghl_threshold_alert',
        resource_type: 'ghl_submissions',
        resource_name: `Daily threshold of ${DAILY_THRESHOLD} reached`,
        details: { count: todayCount, threshold: DAILY_THRESHOLD, sources: sourceSummary },
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Threshold alert sent',
          count: todayCount,
          threshold: DAILY_THRESHOLD 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: alreadyAlerted ? 'Already alerted today' : 'Below threshold',
        count: todayCount,
        threshold: DAILY_THRESHOLD 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-ghl-threshold:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
