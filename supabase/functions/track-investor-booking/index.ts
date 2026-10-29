import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrackBookingRequest {
  investorId?: string;
  email: string;
  accessCode?: string;
  bookingAction: 'clicked' | 'scheduled' | 'completed';
  bookingUrl?: string;
  scheduledAt?: string;
  eventName?: string;
  location?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("track-investor-booking: Request received");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      investorId, 
      email, 
      accessCode, 
      bookingAction, 
      bookingUrl, 
      scheduledAt,
      eventName,
      location
    }: TrackBookingRequest = await req.json();
    console.log("track-investor-booking: Tracking action:", bookingAction, "for:", email);

    if (!email || !bookingAction) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the investor by email or ID
    let query = supabase.from("investor_leads").select("id, full_name, email, verification_method");
    
    if (investorId && investorId !== 'master') {
      query = query.eq("id", investorId);
    } else {
      query = query.eq("email", email.toLowerCase());
    }

    const { data: investor, error: fetchError } = await query.maybeSingle();

    if (fetchError) {
      console.error("track-investor-booking: Error finding investor:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to find investor" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update verification method and log booking
    const updates: Record<string, any> = {};
    
    if (bookingAction === 'clicked') {
      // Log the booking click to investor_bookings
      const { error: bookingError } = await supabase.from("investor_bookings").insert({
        investor_id: investor?.id || null,
        event_name: eventName || "CEO Meeting - Zoom",
        event_type: "zoom",
        status: "clicked",
        location: bookingUrl || "Zoom Scheduler",
        created_at: new Date().toISOString(),
      });
      
      if (bookingError) {
        console.error("track-investor-booking: Error logging click:", bookingError);
      }

      updates.verification_method = 'booking';
    } else if (bookingAction === 'scheduled' || bookingAction === 'completed') {
      // Create a proper booking record
      const startTime = scheduledAt ? new Date(scheduledAt) : new Date();
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // 30 min meeting

      const { error: bookingError } = await supabase.from("investor_bookings").insert({
        investor_id: investor?.id || null,
        event_name: eventName || "CEO Meeting - Zoom",
        event_type: "zoom",
        status: "scheduled",
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        location: location || bookingUrl || "Zoom",
        created_at: new Date().toISOString(),
      });

      if (bookingError) {
        console.error("track-investor-booking: Error creating booking:", bookingError);
      }

      updates.verification_method = 'booking';

      // Also log to code usage for tracking
      if (investor && !investor.verification_method?.includes('booking')) {
        await supabase.from("investor_code_usage").insert({
          investor_id: investor.id,
          access_code: accessCode || 'BOOKING',
          is_master_code: false,
          ip_address: null,
          user_agent: 'Zoom Booking',
        });
      }
    }

    // Update investor record if we found one
    if (investor && Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("investor_leads")
        .update(updates)
        .eq("id", investor.id);

      if (updateError) {
        console.error("track-investor-booking: Error updating investor:", updateError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to update investor" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    console.log("track-investor-booking: Successfully tracked booking for:", email);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("track-investor-booking: Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Failed to track booking" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
