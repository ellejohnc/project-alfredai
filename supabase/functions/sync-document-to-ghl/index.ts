import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { GHL_V3 } from "../_shared/ghlClient.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  document_id: string;
  contact_email?: string;
  contact_id?: string;
}

// GHL file size limit is 5MB
const GHL_MAX_FILE_SIZE = 5 * 1024 * 1024;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ghlApiKey = Deno.env.get('GHL_API_KEY');
    const ghlLocationId = Deno.env.get('GHL_LOCATION_ID');
    
    if (!ghlApiKey || !ghlLocationId) {
      return new Response(
        JSON.stringify({ success: false, error: 'GHL credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: user.id });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: SyncRequest = await req.json();
    const { document_id, contact_email, contact_id } = body;

    if (!document_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Document ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch document record
    const { data: doc, error: docError } = await supabase
      .from('meeting_documents')
      .select('*')
      .eq('id', document_id)
      .single();

    if (docError || !doc) {
      return new Response(
        JSON.stringify({ success: false, error: 'Document not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get contact email from meeting if not provided
    let targetEmail = contact_email;
    let targetContactId = contact_id;

    if (!targetEmail && !targetContactId) {
      // Fetch from meeting record
      if (doc.meeting_type === 'demo') {
        const { data: meeting } = await supabase
          .from('ghl_submissions')
          .select('lead_email, ghl_response')
          .eq('id', doc.meeting_id)
          .single();
        
        if (meeting) {
          targetEmail = meeting.lead_email;
          targetContactId = (meeting.ghl_response as Record<string, unknown>)?.ghl_contact_id as string;
        }
      } else {
        const { data: booking } = await supabase
          .from('investor_bookings')
          .select('investor_id')
          .eq('id', doc.meeting_id)
          .single();
        
        if (booking?.investor_id) {
          const { data: investor } = await supabase
            .from('investor_leads')
            .select('email')
            .eq('id', booking.investor_id)
            .single();
          targetEmail = investor?.email;
        }
      }
    }

    if (!targetEmail && !targetContactId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Could not determine contact email for GHL sync' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find GHL contact ID if we don't have it
    if (!targetContactId && targetEmail) {
      const searchResponse = await fetch(
        `https://services.leadconnectorhq.com/contacts/?locationId=${ghlLocationId}&query=${encodeURIComponent(targetEmail)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${ghlApiKey}`,
            'Version': GHL_V3,
            'Content-Type': 'application/json',
          },
        }
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        const contact = searchData.contacts?.find((c: { email?: string }) => 
          c.email?.toLowerCase() === targetEmail!.toLowerCase()
        );
        targetContactId = contact?.id;
      }
    }

    if (!targetContactId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Contact not found in GHL' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine sync method based on source
    const isGoogleDriveDoc = doc.source === 'google_drive' || 
      doc.file_url?.includes('drive.google.com') || 
      doc.file_url?.includes('docs.google.com');

    let syncSuccess = false;
    let ghlResponse: Record<string, unknown> = {};

    if (isGoogleDriveDoc) {
      // For Google Drive documents, add a note with the link
      const documentTypeLabel = doc.document_type === 'transcript' ? 'Meeting Transcript' 
        : doc.document_type === 'recording' ? 'Meeting Recording'
        : doc.document_type === 'summary' ? 'Meeting Summary'
        : 'Meeting Notes';
      
      const noteBody = `[AlfredAI] ${documentTypeLabel} imported from Google Drive\n\nFile: ${doc.file_name}\nLink: ${doc.file_url}\nSource: ${doc.source}\nSynced: ${new Date().toISOString()}`;

      const noteResponse = await fetch(
        `https://services.leadconnectorhq.com/contacts/${targetContactId}/notes`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ghlApiKey}`,
            'Version': GHL_V3,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ body: noteBody }),
        }
      );

      const noteResponseText = await noteResponse.text();
      try {
        ghlResponse = JSON.parse(noteResponseText);
      } catch {
        ghlResponse = { raw: noteResponseText };
      }

      syncSuccess = noteResponse.ok;
      
      if (!syncSuccess) {
        console.error('GHL note creation failed:', ghlResponse);
        
        await supabase
          .from('meeting_documents')
          .update({
            ghl_synced: false,
            ghl_sync_response: { 
              error: ghlResponse, 
              attempted_at: new Date().toISOString(),
              contact_id: targetContactId,
              sync_type: 'note_with_link',
            },
          })
          .eq('id', document_id);

        return new Response(
          JSON.stringify({ success: false, error: 'GHL note creation failed', details: ghlResponse }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // For storage-based documents, download and upload to GHL
      
      // Check file size first
      if (doc.file_size_bytes && doc.file_size_bytes > GHL_MAX_FILE_SIZE) {
        // File too large - add as note instead
        const documentTypeLabel = doc.document_type === 'transcript' ? 'Meeting Transcript' 
          : doc.document_type === 'recording' ? 'Meeting Recording'
          : doc.document_type === 'summary' ? 'Meeting Summary'
          : 'Meeting Notes';
        
        // Generate a signed URL for the file
        const { data: signedUrlData } = await supabase.storage
          .from('meeting-documents')
          .createSignedUrl(doc.file_url, 60 * 60 * 24 * 30); // 30 day expiry

        const fileLink = signedUrlData?.signedUrl || doc.file_url;
        
        const noteBody = `[AlfredAI] ${documentTypeLabel} (file too large to attach)\n\nFile: ${doc.file_name}\nSize: ${(doc.file_size_bytes / (1024 * 1024)).toFixed(2)}MB\nLink: ${fileLink}\nSynced: ${new Date().toISOString()}`;

        const noteResponse = await fetch(
          `https://services.leadconnectorhq.com/contacts/${targetContactId}/notes`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${ghlApiKey}`,
              'Version': GHL_V3,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ body: noteBody }),
          }
        );

        syncSuccess = noteResponse.ok;
        const noteResponseText = await noteResponse.text();
        try {
          ghlResponse = JSON.parse(noteResponseText);
        } catch {
          ghlResponse = { raw: noteResponseText };
        }
      } else {
        // Download file from Supabase Storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('meeting-documents')
          .download(doc.file_url);

        if (downloadError || !fileData) {
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to download file from storage' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Prepare form data for GHL upload
        const formData = new FormData();
        formData.append('files', fileData, doc.file_name);
        formData.append('conversationId', targetContactId);

        // Upload to GHL via conversations/messages/upload endpoint
        const ghlUploadResponse = await fetch(
          `https://services.leadconnectorhq.com/conversations/messages/upload`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${ghlApiKey}`,
              'Version': GHL_V3,
            },
            body: formData,
          }
        );

        const ghlResponseText = await ghlUploadResponse.text();
        try {
          ghlResponse = JSON.parse(ghlResponseText);
        } catch {
          ghlResponse = { raw: ghlResponseText };
        }

        syncSuccess = ghlUploadResponse.ok;

        if (!syncSuccess) {
          console.error('GHL upload failed:', ghlResponse);
          
          await supabase
            .from('meeting_documents')
            .update({
              ghl_synced: false,
              ghl_sync_response: { 
                error: ghlResponse, 
                attempted_at: new Date().toISOString(),
                contact_id: targetContactId,
              },
            })
            .eq('id', document_id);

          return new Response(
            JSON.stringify({ success: false, error: 'GHL upload failed', details: ghlResponse }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Add a note about the document
        const documentTypeLabel = doc.document_type === 'transcript' ? 'Meeting Transcript' 
          : doc.document_type === 'recording' ? 'Meeting Recording'
          : doc.document_type === 'summary' ? 'Meeting Summary'
          : 'Meeting Notes';
        
        const noteBody = `[AlfredAI] ${documentTypeLabel} uploaded\nFile: ${doc.file_name}\nSource: ${doc.source}\nUploaded: ${new Date().toISOString()}`;

        await fetch(
          `https://services.leadconnectorhq.com/contacts/${targetContactId}/notes`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${ghlApiKey}`,
              'Version': GHL_V3,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ body: noteBody }),
          }
        );
      }
    }

    // Update document record with sync success
    const { error: updateError } = await supabase
      .from('meeting_documents')
      .update({
        ghl_synced: true,
        ghl_synced_at: new Date().toISOString(),
        ghl_sync_response: {
          success: true,
          synced_at: new Date().toISOString(),
          contact_id: targetContactId,
          sync_type: isGoogleDriveDoc ? 'note_with_link' : 'file_upload',
          ghl_response: ghlResponse,
        },
      })
      .eq('id', document_id);

    if (updateError) {
      console.error('Failed to update document sync status:', updateError);
    }

    console.log(`Document ${document_id} synced to GHL contact ${targetContactId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Document synced to GHL successfully',
        contact_id: targetContactId,
        sync_type: isGoogleDriveDoc ? 'note_with_link' : 'file_upload',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
