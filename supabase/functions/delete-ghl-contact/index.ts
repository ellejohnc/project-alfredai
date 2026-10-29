import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { GHL_V3 } from "../_shared/ghlClient.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteRequest {
  contact_id?: string;
  email: string;
  submission_id?: string;
  lead_id?: string;
  delete_from_ghl?: boolean;
}

/**
 * Delete a contact from GoHighLevel by ID
 */
async function deleteContactFromGHL(
  contactId: string,
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Deleting GHL contact: ${contactId}`);
    
    const response = await fetch(
      `https://services.leadconnectorhq.com/contacts/${contactId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Version': GHL_V3,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GHL delete failed:', response.status, errorText);
      
      // 404 means contact already deleted or doesn't exist - treat as success
      if (response.status === 404) {
        console.log('Contact not found in GHL (already deleted or never existed)');
        return { success: true };
      }
      
      return { success: false, error: `Delete failed: ${response.status} - ${errorText}` };
    }

    console.log(`Successfully deleted GHL contact: ${contactId}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting GHL contact:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Search for a contact in GHL by email to get their ID
 */
async function findContactByEmail(
  email: string,
  apiKey: string,
  locationId: string
): Promise<{ contactId?: string; error?: string }> {
  try {
    console.log(`Searching for GHL contact by email: ${email}`);
    
    const response = await fetch(
      `https://services.leadconnectorhq.com/contacts/search`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Version': GHL_V3,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationId,
          query: email,
          page: 1,
          pageLimit: 20,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GHL search failed:', response.status, errorText);
      return { error: `Search failed: ${response.status}` };
    }

    const data = await response.json();
    const contacts = data.contacts || [];
    
    // Find exact email match
    const contact = contacts.find((c: { email?: string }) =>
      c.email?.toLowerCase() === email.toLowerCase()
    );

    if (contact) {
      console.log(`Found GHL contact: ${contact.id}`);
      return { contactId: contact.id };
    }

    console.log('No matching contact found in GHL');
    return {};
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error searching GHL:', errorMessage);
    return { error: errorMessage };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ghlApiKey = Deno.env.get('GHL_API_KEY');
    const ghlLocationId = Deno.env.get('GHL_LOCATION_ID');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user is authenticated and is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: user.id });
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: DeleteRequest = await req.json();

    if (!body.email) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Delete request:', {
      email: body.email,
      contact_id: body.contact_id,
      submission_id: body.submission_id,
      lead_id: body.lead_id,
      delete_from_ghl: body.delete_from_ghl,
    });

    let ghlDeleteResult: { success: boolean; error?: string } = { success: true };
    let contactIdToDelete = body.contact_id;

    // Delete from GHL if requested and credentials are configured
    if (body.delete_from_ghl && ghlApiKey && ghlLocationId) {
      // If no contact ID provided, search for it by email
      if (!contactIdToDelete) {
        const searchResult = await findContactByEmail(body.email, ghlApiKey, ghlLocationId);
        contactIdToDelete = searchResult.contactId;
        
        if (searchResult.error) {
          console.warn('Failed to search for contact:', searchResult.error);
        }
      }

      // Delete from GHL if we have a contact ID
      if (contactIdToDelete) {
        ghlDeleteResult = await deleteContactFromGHL(contactIdToDelete, ghlApiKey);
      } else {
        console.log('No GHL contact found to delete for email:', body.email);
      }
    }

    // Delete from local database
    const deleteResults: { table: string; success: boolean; error?: string }[] = [];

    // Delete GHL submission if ID provided
    if (body.submission_id) {
      // First delete related sync history
      const { error: historyError } = await supabase
        .from('ghl_sync_history')
        .delete()
        .eq('submission_id', body.submission_id);

      if (historyError) {
        console.warn('Failed to delete sync history:', historyError.message);
      }

      // Then delete submission
      const { error } = await supabase
        .from('ghl_submissions')
        .delete()
        .eq('id', body.submission_id);

      deleteResults.push({
        table: 'ghl_submissions',
        success: !error,
        error: error?.message,
      });
    }

    // Delete lead if ID provided
    if (body.lead_id) {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', body.lead_id);

      deleteResults.push({
        table: 'leads',
        success: !error,
        error: error?.message,
      });
    }

    // Also delete any GHL submissions with matching email (if deleting a lead)
    if (body.lead_id && !body.submission_id) {
      // Find and delete related GHL submissions
      const { data: relatedSubmissions } = await supabase
        .from('ghl_submissions')
        .select('id')
        .eq('lead_email', body.email);

      if (relatedSubmissions && relatedSubmissions.length > 0) {
        for (const sub of relatedSubmissions) {
          // Delete sync history first
          await supabase
            .from('ghl_sync_history')
            .delete()
            .eq('submission_id', sub.id);
        }

        const { error } = await supabase
          .from('ghl_submissions')
          .delete()
          .eq('lead_email', body.email);

        deleteResults.push({
          table: 'ghl_submissions (by email)',
          success: !error,
          error: error?.message,
        });
      }
    }

    // Also delete any leads with matching email (if deleting a GHL submission)
    if (body.submission_id && !body.lead_id) {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('email', body.email);

      if (!error) {
        deleteResults.push({
          table: 'leads (by email)',
          success: true,
        });
      }
    }

    const allSuccess = deleteResults.every(r => r.success) && ghlDeleteResult.success;

    console.log('Delete operation completed:', {
      ghl_deleted: ghlDeleteResult.success,
      ghl_error: ghlDeleteResult.error,
      db_results: deleteResults,
    });

    return new Response(
      JSON.stringify({
        success: allSuccess,
        ghl_deleted: ghlDeleteResult.success,
        ghl_error: ghlDeleteResult.error,
        db_results: deleteResults,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in delete-ghl-contact:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});