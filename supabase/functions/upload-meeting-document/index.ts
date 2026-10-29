import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UploadRequest {
  meeting_id: string;
  meeting_type: 'demo' | 'investor';
  meeting_category?: 'discovery' | 'solution';
  document_type: 'transcript' | 'recording' | 'summary' | 'notes';
  source: 'google_meet' | 'fathom' | 'otter' | 'fireflies' | 'manual_upload';
  file_name: string;
  file_base64: string;
  mime_type: string;
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
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

    const body: UploadRequest = await req.json();
    const { 
      meeting_id, 
      meeting_type,
      meeting_category,
      document_type, 
      source, 
      file_name, 
      file_base64, 
      mime_type,
      metadata = {}
    } = body;

    // Validate required fields
    if (!meeting_id || !meeting_type || !document_type || !source || !file_name || !file_base64 || !mime_type) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decode base64 file
    const fileData = Uint8Array.from(atob(file_base64), c => c.charCodeAt(0));
    const fileSize = fileData.length;

    // Generate unique file path with category-based organization
    const timestamp = Date.now();
    const sanitizedFileName = file_name.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Include meeting category in storage path if provided
    const categoryPath = meeting_category ? `${meeting_category}/` : '';
    const storagePath = `${categoryPath}${meeting_id}/${document_type}/${timestamp}_${sanitizedFileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('meeting-documents')
      .upload(storagePath, fileData, {
        contentType: mime_type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(
        JSON.stringify({ success: false, error: `Upload failed: ${uploadError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the file URL
    const { data: { publicUrl } } = supabase.storage
      .from('meeting-documents')
      .getPublicUrl(storagePath);

    // For private bucket, use signed URL instead
    const { data: signedUrlData } = await supabase.storage
      .from('meeting-documents')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365); // 1 year expiry

    const fileUrl = signedUrlData?.signedUrl || publicUrl;

    // Insert record into meeting_documents table
    const { data: docRecord, error: dbError } = await supabase
      .from('meeting_documents')
      .insert({
        meeting_id,
        meeting_type,
        meeting_category: meeting_category || null,
        document_type,
        file_name: sanitizedFileName,
        file_url: storagePath, // Store path, generate signed URL on read
        file_size_bytes: fileSize,
        mime_type,
        source,
        metadata: {
          ...metadata,
          meeting_category: meeting_category || null,
        },
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      // Try to clean up the uploaded file
      await supabase.storage.from('meeting-documents').remove([storagePath]);
      
      return new Response(
        JSON.stringify({ success: false, error: `Database error: ${dbError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Document uploaded successfully: ${storagePath}`);

    // Auto-sync to GHL in background (don't block the response)
    let ghlSyncResult = { attempted: false, success: false, error: null as string | null };
    
    try {
      // Get contact email from meeting record
      let contactEmail: string | null = null;
      
      if (meeting_type === 'demo') {
        const { data: meeting } = await supabase
          .from('ghl_submissions')
          .select('lead_email')
          .eq('id', meeting_id)
          .single();
        contactEmail = meeting?.lead_email || null;
      } else if (meeting_type === 'investor') {
        const { data: booking } = await supabase
          .from('investor_bookings')
          .select('investor_id')
          .eq('id', meeting_id)
          .single();
        
        if (booking?.investor_id) {
          const { data: investor } = await supabase
            .from('investor_leads')
            .select('email')
            .eq('id', booking.investor_id)
            .single();
          contactEmail = investor?.email || null;
        }
      }

      if (contactEmail) {
        ghlSyncResult.attempted = true;
        
        // Call sync-document-to-ghl function
        const syncResponse = await fetch(
          `${supabaseUrl}/functions/v1/sync-document-to-ghl`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${req.headers.get('Authorization')?.replace('Bearer ', '')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              document_id: docRecord.id,
              contact_email: contactEmail,
            }),
          }
        );

        const syncData = await syncResponse.json();
        ghlSyncResult.success = syncData.success === true;
        ghlSyncResult.error = syncData.error || null;
        
        console.log(`GHL auto-sync result for ${docRecord.id}:`, ghlSyncResult);
      } else {
        console.log('No contact email found, skipping GHL sync');
      }
    } catch (syncError) {
      console.error('GHL auto-sync error:', syncError);
      ghlSyncResult.error = syncError instanceof Error ? syncError.message : 'Unknown sync error';
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        document: {
          id: docRecord.id,
          file_name: docRecord.file_name,
          file_url: fileUrl,
          document_type: docRecord.document_type,
          file_size_bytes: docRecord.file_size_bytes,
        },
        ghl_sync: ghlSyncResult,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
