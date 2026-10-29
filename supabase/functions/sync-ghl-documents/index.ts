import { createClient } from "npm:@supabase/supabase-js@2";
import { GHL_V3 } from "../_shared/ghlClient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GHLConversation {
  id: string;
  contactId: string;
  lastMessageDate?: string;
}

interface GHLMessage {
  id: string;
  body?: string;
  attachments?: Array<{
    url: string;
    name?: string;
    contentType?: string;
  }>;
  dateAdded: string;
  direction: string;
  messageType?: string;
}

interface SyncResult {
  contactId: string;
  email: string;
  documentsFound: number;
  documentsImported: number;
  errors: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ghlApiKey = Deno.env.get("GHL_API_KEY");
    const ghlLocationId = Deno.env.get("GHL_LOCATION_ID");

    if (!ghlApiKey || !ghlLocationId) {
      return new Response(
        JSON.stringify({ success: false, error: "GHL credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for options
    let options = { limit: 50, checkHours: 24 };
    try {
      const body = await req.json();
      options = { ...options, ...body };
    } catch {
      // Use defaults if no body
    }

    console.log(`Starting GHL document sync (limit: ${options.limit}, checkHours: ${options.checkHours})`);

    // Get recent meetings with GHL contact IDs
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - options.checkHours);

    // Fetch meetings that have GHL contact IDs
    const { data: meetings, error: meetingsError } = await supabase
      .from("ghl_submissions")
      .select("id, lead_email, ghl_response")
      .not("ghl_response->ghl_contact_id", "is", null)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(options.limit);

    if (meetingsError) {
      throw new Error(`Failed to fetch meetings: ${meetingsError.message}`);
    }

    console.log(`Found ${meetings?.length || 0} meetings with GHL contact IDs`);

    const results: SyncResult[] = [];
    let totalImported = 0;

    for (const meeting of meetings || []) {
      const ghlResponse = meeting.ghl_response as { ghl_contact_id?: string } | null;
      const contactId = ghlResponse?.ghl_contact_id;

      if (!contactId) continue;

      const result: SyncResult = {
        contactId,
        email: meeting.lead_email,
        documentsFound: 0,
        documentsImported: 0,
        errors: [],
      };

      try {
        // Get conversations for this contact
        const conversationsResponse = await fetch(
          `https://services.leadconnectorhq.com/conversations/search?locationId=${ghlLocationId}&contactId=${contactId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${ghlApiKey}`,
              Version: GHL_V3,
              "Content-Type": "application/json",
            },
          }
        );

        if (!conversationsResponse.ok) {
          const errorText = await conversationsResponse.text();
          result.errors.push(`Failed to fetch conversations: ${errorText}`);
          results.push(result);
          continue;
        }

        const conversationsData = await conversationsResponse.json();
        const conversations: GHLConversation[] = conversationsData.conversations || [];

        // For each conversation, fetch messages with attachments
        for (const conversation of conversations) {
          try {
            const messagesResponse = await fetch(
              `https://services.leadconnectorhq.com/conversations/${conversation.id}/messages`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${ghlApiKey}`,
                  Version: GHL_V3,
                  "Content-Type": "application/json",
                },
              }
            );

            if (!messagesResponse.ok) {
              const errorText = await messagesResponse.text();
              result.errors.push(`Failed to fetch messages: ${errorText}`);
              continue;
            }

            const messagesData = await messagesResponse.json();
            // On v3 the list is one level down: the body is
            // { messages: { lastMessageId, nextPage, messages: [...] } }
            // (GetMessagesByConversationResponseDto, wrapped). Reading
            // `messagesData.messages` as the array threw "messages.filter is
            // not a function" on every contact, every hour, from the v3 switch
            // until 15 Oct — while the job reported success and imported
            // nothing. Accept both shapes so a version change cannot do that
            // silently again.
            const rawMessages = messagesData?.messages;
            const messages: GHLMessage[] = Array.isArray(rawMessages)
              ? rawMessages
              : Array.isArray(rawMessages?.messages)
                ? rawMessages.messages
                : [];

            // Filter messages with attachments
            const messagesWithAttachments = messages.filter(
              (m) => m.attachments && m.attachments.length > 0
            );

            for (const message of messagesWithAttachments) {
              for (const attachment of message.attachments || []) {
                result.documentsFound++;

                // Check if we already have this document
                const { data: existing } = await supabase
                  .from("meeting_documents")
                  .select("id")
                  .eq("metadata->>ghl_message_id", message.id)
                  .eq("file_url", attachment.url)
                  .limit(1);

                if (existing && existing.length > 0) {
                  continue; // Already imported
                }

                // Determine document type from content type
                let documentType = "notes";
                const contentType = attachment.contentType || "";
                const fileName = attachment.name || "Unknown";

                if (
                  contentType.includes("audio") ||
                  fileName.toLowerCase().includes("recording")
                ) {
                  documentType = "recording";
                } else if (
                  fileName.toLowerCase().includes("transcript") ||
                  contentType.includes("text")
                ) {
                  documentType = "transcript";
                } else if (fileName.toLowerCase().includes("summary")) {
                  documentType = "summary";
                }

                // Insert the document
                const { error: insertError } = await supabase
                  .from("meeting_documents")
                  .insert({
                    meeting_id: meeting.id,
                    meeting_type: "ghl_submission",
                    document_type: documentType,
                    file_name: fileName,
                    file_url: attachment.url,
                    source: "ghl_import",
                    ghl_synced: true,
                    ghl_synced_at: new Date().toISOString(),
                    metadata: {
                      ghl_message_id: message.id,
                      ghl_conversation_id: conversation.id,
                      ghl_contact_id: contactId,
                      content_type: contentType,
                      message_direction: message.direction,
                      message_date: message.dateAdded,
                      imported_at: new Date().toISOString(),
                    },
                  });

                if (insertError) {
                  result.errors.push(`Failed to insert document: ${insertError.message}`);
                } else {
                  result.documentsImported++;
                  totalImported++;
                  console.log(`Imported document: ${fileName} for ${meeting.lead_email}`);
                }
              }
            }
          } catch (convError) {
            result.errors.push(
              `Conversation error: ${convError instanceof Error ? convError.message : String(convError)}`
            );
          }
        }
      } catch (contactError) {
        result.errors.push(
          `Contact error: ${contactError instanceof Error ? contactError.message : String(contactError)}`
        );
      }

      if (result.documentsFound > 0 || result.errors.length > 0) {
        results.push(result);
      }

      // Rate limiting - GHL has rate limits
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    console.log(`Sync complete: ${totalImported} documents imported`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${totalImported} documents from GHL`,
        totalContactsChecked: meetings?.length || 0,
        totalDocumentsImported: totalImported,
        results: results.filter((r) => r.documentsImported > 0 || r.errors.length > 0),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("GHL document sync error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
