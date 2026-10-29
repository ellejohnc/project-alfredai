import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  token_uri: string;
}

interface MatchResult {
  meetingId: string;
  meetingType: string;
  matchMethod: string;
  confidence: string;
}

// Generate JWT for service account authentication
async function generateServiceAccountToken(credentials: ServiceAccountCredentials): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/drive.readonly",
    aud: credentials.token_uri,
    exp: now + 3600,
    iat: now,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const signatureInput = `${headerB64}.${payloadB64}`;

  const pemContents = credentials.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, encoder.encode(signatureInput));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${signatureInput}.${signatureB64}`;

  const tokenResponse = await fetch(credentials.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Download file content from Google Drive
async function downloadFileContent(accessToken: string, fileId: string, mimeType: string): Promise<string> {
  let url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  
  if (mimeType === "application/vnd.google-apps.document") {
    url += "/export?mimeType=text/plain";
  } else {
    url += "?alt=media";
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to download file: ${errorText}`);
  }

  return response.text();
}

// Parse date from filename
function parseDateFromFilename(fileName: string): Date | null {
  const patterns = [
    /(\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2})(?:,?\s*(\d{4}))?/i,
    /(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2})(?:,?\s*(\d{4}))?/i,
    /(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December))(?:\s*(\d{4}))?/i,
  ];

  for (const pattern of patterns) {
    const match = fileName.match(pattern);
    if (match) {
      const dateStr = match[1];
      const year = match[2] || new Date().getFullYear().toString();
      const parsed = new Date(`${dateStr} ${year}`);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }
  return null;
}

// Extract calendar event ID
function extractCalendarEventId(url: string): string | null {
  const eidMatch = url.match(/calendar\.google\.com\/calendar\/event\?eid=([A-Za-z0-9_-]+)/);
  if (eidMatch) return eidMatch[1];
  const eidMatch2 = url.match(/google\.com\/calendar\/event\?eid=([A-Za-z0-9_-]+)/);
  if (eidMatch2) return eidMatch2[1];
  return null;
}

// Decode calendar event ID
function decodeCalendarEventId(eid: string): { meetLink?: string } | null {
  try {
    const decoded = atob(eid.replace(/-/g, '+').replace(/_/g, '/'));
    const meetMatch = decoded.match(/meet\.google\.com\/([a-z]+-[a-z]+-[a-z]+)/i);
    if (meetMatch) {
      return { meetLink: `https://meet.google.com/${meetMatch[1].toLowerCase()}` };
    }
    return {};
  } catch {
    return null;
  }
}

// Extract meeting info from content
function extractMeetingInfo(fileName: string, content: string): { 
  meetLink?: string; 
  attachmentMeetLink?: string;
  email?: string;
  attendeeEmails?: string[];
  companyName?: string;
  meetingDate?: Date;
  attendeeNames?: string[];
} {
  const result: { 
    meetLink?: string; 
    attachmentMeetLink?: string;
    email?: string; 
    attendeeEmails?: string[];
    companyName?: string; 
    meetingDate?: Date;
    attendeeNames?: string[];
  } = {};

  result.meetingDate = parseDateFromFilename(fileName) || undefined;

  // Extract Meet links from Attachments section
  const attachmentsSection = content.match(/Attachments[:\s]*\n?([\s\S]*?)(?:\n\n|\n[A-Z]|$)/i);
  if (attachmentsSection) {
    const attachmentMeetLinks = attachmentsSection[1].match(/https:\/\/meet\.google\.com\/[a-z]+-[a-z]+-[a-z]+/gi);
    if (attachmentMeetLinks && attachmentMeetLinks.length > 0) {
      result.attachmentMeetLink = attachmentMeetLinks[0].toLowerCase();
    }
    
    // Look for any URLs with Meet links
    const allAttachmentUrls = attachmentsSection[1].match(/https?:\/\/[^\s\n<>"]+/gi);
    if (allAttachmentUrls && !result.attachmentMeetLink) {
      for (const url of allAttachmentUrls) {
        const meetInUrl = url.match(/meet\.google\.com\/([a-z]+-[a-z]+-[a-z]+)/i);
        if (meetInUrl) {
          result.attachmentMeetLink = `https://meet.google.com/${meetInUrl[1].toLowerCase()}`;
          break;
        }
      }
    }
  }

  // Look for Calendar links
  const allCalendarLinks = content.match(/https:\/\/(?:www\.)?(?:calendar\.)?google\.com\/calendar\/event\?eid=[A-Za-z0-9_-]+/gi);
  if (allCalendarLinks) {
    for (const calLink of allCalendarLinks) {
      const eid = extractCalendarEventId(calLink);
      if (eid) {
        const decoded = decodeCalendarEventId(eid);
        if (decoded?.meetLink) {
          if (!result.attachmentMeetLink) {
            result.attachmentMeetLink = decoded.meetLink;
          }
          result.meetLink = decoded.meetLink;
          break;
        }
      }
    }
  }

  // Direct meet link
  if (!result.meetLink) {
    const meetLinkMatch = content.match(/https:\/\/meet\.google\.com\/[a-z]+-[a-z]+-[a-z]+/gi);
    if (meetLinkMatch) {
      result.meetLink = meetLinkMatch[0].toLowerCase();
    }
  }
  
  // Use attachment meet link as fallback
  if (!result.meetLink && result.attachmentMeetLink) {
    result.meetLink = result.attachmentMeetLink;
  }

  // Extract attendee names from "Invited:" section in transcript
  const attendeeNames: string[] = [];
  const invitedPatterns = [
    /Invited[:\s]+([^\n]+)/i,
    /Attendees[:\s]+([^\n]+)/i,
    /Participants[:\s]+([^\n]+)/i,
  ];
  
  for (const pattern of invitedPatterns) {
    const match = content.match(pattern);
    if (match) {
      const names = match[1].split(/[,&]/).map(n => n.trim()).filter(n => 
        n && 
        n.length > 2 && 
        !n.includes('@') && 
        !n.match(/^(and|or|with)$/i)
      );
      for (const name of names) {
        if (!attendeeNames.includes(name)) {
          attendeeNames.push(name);
        }
      }
    }
  }

  // Extract name from filename pattern
  const fileNamePatterns = [
    /Alfred\s*Ai?\s*&\s*([^–\-\d]+?)(?:\s*[–\-]|\s*\d)/i,
    /Meeting\s+with\s+([^–\-\d]+?)(?:\s*[–\-]|\s*\d)/i,
    /Call\s+with\s+([^–\-\d]+?)(?:\s*[–\-]|\s*\d)/i,
  ];
  
  for (const pattern of fileNamePatterns) {
    const match = fileName.match(pattern);
    if (match) {
      const extracted = match[1].trim().replace(/\s+/g, ' ');
      if (extracted && !extracted.match(/^(Notes|Transcript|Recording|by\s+Gemini|AEDT|AEST)$/i)) {
        if (!attendeeNames.includes(extracted)) {
          attendeeNames.push(extracted);
        }
      }
    }
  }

  if (attendeeNames.length > 0) {
    result.attendeeNames = attendeeNames;
  }

  // Company name from filename
  const companyPatterns = [
    /(?:Alfred\s*Ai?\s*&\s*)([^–\-\d]+?)(?:\s*[–\-]|\s*\d)/i,
    /(?:Discovery\s+Meeting[:\s]+)([^–\-]+?)(?:\s*[–\-])/i,
  ];
  
  for (const pattern of companyPatterns) {
    const match = fileName.match(pattern);
    if (match) {
      const extracted = match[1].trim().replace(/\s+/g, ' ');
      if (extracted && !extracted.match(/^(Notes|Transcript|Recording|by\s+Gemini|AEDT|AEST)$/i)) {
        result.companyName = extracted;
        break;
      }
    }
  }

  // Collect attendee emails
  const emailMatches = content.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g) || [];
  const attendeeEmails: string[] = [];
  
  for (const email of emailMatches) {
    const lower = email.toLowerCase();
    if (!lower.includes('alfredai') && 
        !lower.includes('google') && 
        !lower.includes('noreply') &&
        !lower.includes('calendar')) {
      if (!attendeeEmails.includes(lower)) {
        attendeeEmails.push(lower);
      }
      if (!result.email) {
        result.email = lower;
      }
    }
  }
  
  if (attendeeEmails.length > 0) {
    result.attendeeEmails = attendeeEmails;
  }

  return result;
}

// Normalize name for comparison
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

// Check if two names match (fuzzy)
function namesMatch(name1: string, name2: string): boolean {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);
  
  if (n1 === n2) return true;
  if (n1.includes(n2) || n2.includes(n1)) return true;
  
  const parts1 = n1.split(' ');
  const parts2 = n2.split(' ');
  
  for (const p1 of parts1) {
    for (const p2 of parts2) {
      if (p1.length >= 3 && p2.length >= 3 && (p1.includes(p2) || p2.includes(p1))) {
        return true;
      }
    }
  }
  
  return false;
}

// Match to meeting - same logic as google-drive-webhook
async function matchToMeeting(
  supabaseUrl: string,
  supabaseKey: string,
  fileName: string,
  content: string,
  fileCreatedTime: string
): Promise<MatchResult | null> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const info = extractMeetingInfo(fileName, content);
  const fileDate = new Date(fileCreatedTime);
  const meetingDate = info.meetingDate || fileDate;

  // Strategy 1: Match by meet link
  if (info.meetLink) {
    const { data: investorBookings } = await supabase
      .from("investor_bookings")
      .select("id")
      .ilike("location", `%${info.meetLink}%`)
      .limit(1);

    if (investorBookings && investorBookings.length > 0) {
      return {
        meetingId: (investorBookings[0] as { id: string }).id,
        meetingType: "investor",
        matchMethod: "meet_link",
        confidence: "high",
      };
    }

    const { data: ghlSubmissions } = await supabase
      .from("ghl_submissions")
      .select("id")
      .ilike("meet_link", `%${info.meetLink}%`)
      .limit(1);

    if (ghlSubmissions && ghlSubmissions.length > 0) {
      return {
        meetingId: (ghlSubmissions[0] as { id: string }).id,
        meetingType: "demo",
        matchMethod: "meet_link",
        confidence: "high",
      };
    }
  }

  // Strategy 2: Match by attendee email + date
  if (info.attendeeEmails && info.attendeeEmails.length > 0) {
    const dayStart = new Date(meetingDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(meetingDate);
    dayEnd.setHours(23, 59, 59, 999);

    for (const email of info.attendeeEmails) {
      const { data: ghlSubmissions } = await supabase
        .from("ghl_submissions")
        .select("id, ghl_response")
        .eq("lead_email", email)
        .in("ghl_status", ["confirmed", "rescheduled"])
        .order("created_at", { ascending: false })
        .limit(5);

      if (ghlSubmissions && ghlSubmissions.length > 0) {
        for (const submission of ghlSubmissions) {
          const sub = submission as { id: string; ghl_response: { start_time?: string } | null };
          const response = sub.ghl_response;
          if (response?.start_time) {
            const startTime = new Date(response.start_time);
            if (startTime >= dayStart && startTime <= dayEnd) {
              return {
                meetingId: sub.id,
                meetingType: "demo",
                matchMethod: "email_date",
                confidence: "high",
              };
            }
          }
        }
      }

      const { data: investorLeads } = await supabase
        .from("investor_leads")
        .select("id")
        .eq("email", email)
        .limit(1);

      if (investorLeads && investorLeads.length > 0) {
        const lead = investorLeads[0] as { id: string };
        const { data: bookings } = await supabase
          .from("investor_bookings")
          .select("id")
          .eq("investor_id", lead.id)
          .gte("start_time", dayStart.toISOString())
          .lte("start_time", dayEnd.toISOString())
          .limit(1);

        if (bookings && bookings.length > 0) {
          return {
            meetingId: (bookings[0] as { id: string }).id,
            meetingType: "investor",
            matchMethod: "email_date",
            confidence: "high",
          };
        }
      }
    }
  }

  // Strategy 3: Match by attachment Meet link + attendee name (NEW)
  if (info.attachmentMeetLink && info.attendeeNames && info.attendeeNames.length > 0) {
    // Try to find the meeting by Meet link
    const { data: ghlByMeetLink } = await supabase
      .from("ghl_submissions")
      .select("id, lead_name, lead_first_name, lead_last_name, lead_company")
      .or(`meet_link.ilike.%${info.attachmentMeetLink}%`)
      .limit(10);

    if (ghlByMeetLink && ghlByMeetLink.length > 0) {
      for (const submission of ghlByMeetLink) {
        const sub = submission as { 
          id: string; 
          lead_name: string | null;
          lead_first_name: string | null;
          lead_last_name: string | null;
          lead_company: string | null;
        };
        const candidateNames: string[] = [];
        if (sub.lead_name) candidateNames.push(sub.lead_name);
        if (sub.lead_first_name) candidateNames.push(sub.lead_first_name);
        if (sub.lead_first_name && sub.lead_last_name) {
          candidateNames.push(`${sub.lead_first_name} ${sub.lead_last_name}`);
        }
        if (sub.lead_company) candidateNames.push(sub.lead_company);

        for (const attendeeName of info.attendeeNames) {
          for (const candidateName of candidateNames) {
            if (namesMatch(attendeeName, candidateName)) {
              return {
                meetingId: sub.id,
                meetingType: "demo",
                matchMethod: "attachment_link_name",
                confidence: "high",
              };
            }
          }
        }
      }
    }

    // Check investor bookings
    const { data: investorByMeetLink } = await supabase
      .from("investor_bookings")
      .select("id, investor_id")
      .ilike("location", `%${info.attachmentMeetLink}%`)
      .limit(10);

    if (investorByMeetLink && investorByMeetLink.length > 0) {
      for (const booking of investorByMeetLink) {
        const bk = booking as { id: string; investor_id: string | null };
        if (bk.investor_id) {
          const { data: investor } = await supabase
            .from("investor_leads")
            .select("full_name, firm_name")
            .eq("id", bk.investor_id)
            .single();

          if (investor) {
            const inv = investor as { full_name: string | null; firm_name: string | null };
            for (const attendeeName of info.attendeeNames) {
              if (
                (inv.full_name && namesMatch(attendeeName, inv.full_name)) ||
                (inv.firm_name && namesMatch(attendeeName, inv.firm_name))
              ) {
                return {
                  meetingId: bk.id,
                  meetingType: "investor",
                  matchMethod: "attachment_link_name",
                  confidence: "high",
                };
              }
            }
          }
        }
      }
    }
  }

  // Strategy 4: Match by attendee name + date
  if (info.attendeeNames && info.attendeeNames.length > 0 && info.meetingDate) {
    const dayStart = new Date(info.meetingDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(info.meetingDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Get all GHL submissions and filter by date
    const { data: ghlByDate } = await supabase
      .from("ghl_submissions")
      .select("id, lead_name, lead_first_name, lead_last_name, lead_company, ghl_response")
      .in("ghl_status", ["confirmed", "rescheduled"])
      .order("created_at", { ascending: false })
      .limit(50);

    if (ghlByDate && ghlByDate.length > 0) {
      for (const submission of ghlByDate) {
        const sub = submission as { 
          id: string; 
          lead_name: string | null;
          lead_first_name: string | null;
          lead_last_name: string | null;
          lead_company: string | null;
          ghl_response: { start_time?: string } | null 
        };
        const response = sub.ghl_response;
        if (response?.start_time) {
          const startTime = new Date(response.start_time);
          if (startTime >= dayStart && startTime <= dayEnd) {
            // Build candidate names
            const candidateNames: string[] = [];
            if (sub.lead_name) candidateNames.push(sub.lead_name);
            if (sub.lead_first_name) candidateNames.push(sub.lead_first_name);
            if (sub.lead_first_name && sub.lead_last_name) {
              candidateNames.push(`${sub.lead_first_name} ${sub.lead_last_name}`);
            }
            if (sub.lead_company) candidateNames.push(sub.lead_company);

            for (const attendeeName of info.attendeeNames) {
              for (const candidateName of candidateNames) {
                if (namesMatch(attendeeName, candidateName)) {
                  return {
                    meetingId: sub.id,
                    meetingType: "demo",
                    matchMethod: "attendee_name_date",
                    confidence: "high",
                  };
                }
              }
            }
          }
        }
      }
    }

    // Check investor leads by name + date
    const { data: investorsByDate } = await supabase
      .from("investor_leads")
      .select("id, full_name, firm_name")
      .limit(50);

    if (investorsByDate && investorsByDate.length > 0) {
      for (const investor of investorsByDate) {
        const inv = investor as { id: string; full_name: string | null; firm_name: string | null };
        for (const attendeeName of info.attendeeNames) {
          if (
            (inv.full_name && namesMatch(attendeeName, inv.full_name)) ||
            (inv.firm_name && namesMatch(attendeeName, inv.firm_name))
          ) {
            const { data: bookings } = await supabase
              .from("investor_bookings")
              .select("id")
              .eq("investor_id", inv.id)
              .gte("start_time", dayStart.toISOString())
              .lte("start_time", dayEnd.toISOString())
              .limit(1);

            if (bookings && bookings.length > 0) {
              return {
                meetingId: (bookings[0] as { id: string }).id,
                meetingType: "investor",
                matchMethod: "attendee_name_date",
                confidence: "high",
              };
            }
          }
        }
      }
    }
  }

  // Strategy 4: Match by company name + date
  if (info.companyName && info.meetingDate) {
    const dayStart = new Date(info.meetingDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(info.meetingDate);
    dayEnd.setHours(23, 59, 59, 999);

    const { data: ghlByCompany } = await supabase
      .from("ghl_submissions")
      .select("id, ghl_response")
      .ilike("lead_company", `%${info.companyName}%`)
      .in("ghl_status", ["confirmed", "rescheduled"])
      .limit(10);

    if (ghlByCompany && ghlByCompany.length > 0) {
      for (const submission of ghlByCompany) {
        const sub = submission as { id: string; ghl_response: { start_time?: string } | null };
        const response = sub.ghl_response;
        if (response?.start_time) {
          const startTime = new Date(response.start_time);
          if (startTime >= dayStart && startTime <= dayEnd) {
            return {
              meetingId: sub.id,
              meetingType: "demo",
              matchMethod: "company_date",
              confidence: "high",
            };
          }
        }
      }
    }
  }

  // Strategy 5: Company name only (with duplicate detection)
  if (info.companyName) {
    // Fetch multiple to detect duplicates
    const { data: ghlByCompany } = await supabase
      .from("ghl_submissions")
      .select("id, lead_email, lead_name, lead_first_name, lead_last_name, ghl_response")
      .ilike("lead_company", `%${info.companyName}%`)
      .in("ghl_status", ["confirmed", "rescheduled"])
      .order("created_at", { ascending: false })
      .limit(10);

    if (ghlByCompany && ghlByCompany.length > 0) {
      // If only one match, use it directly
      if (ghlByCompany.length === 1) {
        return {
          meetingId: (ghlByCompany[0] as { id: string }).id,
          meetingType: "demo",
          matchMethod: "company_name",
          confidence: "medium",
        };
      }
      
      // Multiple matches - try to narrow down using meeting date if available
      if (info.meetingDate) {
        const dayStart = new Date(info.meetingDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(info.meetingDate);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dateMatches = ghlByCompany.filter((sub) => {
          const s = sub as { ghl_response: { start_time?: string } | null };
          if (s.ghl_response?.start_time) {
            const startTime = new Date(s.ghl_response.start_time);
            return startTime >= dayStart && startTime <= dayEnd;
          }
          return false;
        });
        
        // If exactly one date match, use it
        if (dateMatches.length === 1) {
          return {
            meetingId: (dateMatches[0] as { id: string }).id,
            meetingType: "demo",
            matchMethod: "company_name_date",
            confidence: "high",
          };
        }
      }
      
      // Multiple matches without date resolution - try attendee name matching
      if (info.attendeeNames && info.attendeeNames.length > 0) {
        for (const sub of ghlByCompany) {
          const s = sub as { 
            id: string; 
            lead_name: string | null;
            lead_first_name: string | null;
            lead_last_name: string | null;
          };
          const candidateNames: string[] = [];
          if (s.lead_name) candidateNames.push(s.lead_name);
          if (s.lead_first_name) candidateNames.push(s.lead_first_name);
          if (s.lead_first_name && s.lead_last_name) {
            candidateNames.push(`${s.lead_first_name} ${s.lead_last_name}`);
          }
          
          for (const attendeeName of info.attendeeNames) {
            for (const candidateName of candidateNames) {
              if (namesMatch(attendeeName, candidateName)) {
                return {
                  meetingId: s.id,
                  meetingType: "demo",
                  matchMethod: "company_name_attendee",
                  confidence: "high",
                };
              }
            }
          }
        }
      }
      
      // Still multiple matches with no way to resolve - log and skip auto-match
      console.log(`[DUPLICATE] Multiple GHL contacts (${ghlByCompany.length}) match company "${info.companyName}". Skipping auto-match.`);
      // Don't return a match - let it stay unmatched for manual resolution
    }
  }

  // Strategy 5: Email only
  if (info.email) {
    const { data: ghlByEmail } = await supabase
      .from("ghl_submissions")
      .select("id")
      .eq("lead_email", info.email)
      .in("ghl_status", ["confirmed", "rescheduled"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (ghlByEmail && ghlByEmail.length > 0) {
      return {
        meetingId: (ghlByEmail[0] as { id: string }).id,
        meetingType: "demo",
        matchMethod: "recent_confirmed_email",
        confidence: "medium",
      };
    }
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all pending_match documents
    const { data: pendingDocs, error: fetchError } = await supabase
      .from("meeting_documents")
      .select("*")
      .eq("meeting_type", "pending_match")
      .order("created_at", { ascending: false });

    if (fetchError) {
      throw new Error(`Failed to fetch pending documents: ${fetchError.message}`);
    }

    if (!pendingDocs || pendingDocs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No pending documents to process", matched: 0, total: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${pendingDocs.length} pending documents...`);

    let accessToken: string | null = null;
    if (serviceAccountJson) {
      try {
        const credentials = JSON.parse(serviceAccountJson);
        accessToken = await generateServiceAccountToken(credentials);
      } catch (e) {
        console.warn("Could not authenticate with Google Drive:", e);
      }
    }

    let matchedCount = 0;
    const results: { fileName: string; matched: boolean; matchMethod?: string }[] = [];

    for (const doc of pendingDocs) {
      try {
        const docRecord = doc as { 
          id: string; 
          file_name: string; 
          created_at: string;
          metadata: { google_drive_file_id?: string; mime_type?: string; created_time?: string } | null 
        };
        const metadata = docRecord.metadata;
        const fileId = metadata?.google_drive_file_id;
        const mimeType = metadata?.mime_type || "text/plain";
        const createdTime = metadata?.created_time || docRecord.created_at;

        let content = "";

        // Try to fetch content from Google Drive if we have credentials and file ID
        if (accessToken && fileId && mimeType !== "application/pdf") {
          try {
            content = await downloadFileContent(accessToken, fileId, mimeType);
          } catch (e) {
            console.warn(`Could not download content for ${docRecord.file_name}:`, e);
          }
        }

        // Run matching algorithm
        const match = await matchToMeeting(supabaseUrl, supabaseServiceKey, docRecord.file_name, content, createdTime);

        if (match) {
          // Update the document with the match
          const { error: updateError } = await supabase
            .from("meeting_documents")
            .update({
              meeting_id: match.meetingId,
              meeting_type: match.meetingType,
              metadata: {
                ...metadata,
                match_method: match.matchMethod,
                match_confidence: match.confidence,
                reprocessed_at: new Date().toISOString(),
              },
            })
            .eq("id", docRecord.id);

          if (updateError) {
            console.error(`Failed to update ${docRecord.file_name}:`, updateError);
            results.push({ fileName: docRecord.file_name, matched: false });
          } else {
            matchedCount++;
            results.push({ fileName: docRecord.file_name, matched: true, matchMethod: match.matchMethod });
            console.log(`Matched: ${docRecord.file_name} -> ${match.matchMethod}`);
          }
        } else {
          results.push({ fileName: docRecord.file_name, matched: false });
        }
      } catch (docError) {
        const docRecord = doc as { file_name?: string };
        console.error(`Error processing ${docRecord.file_name || 'unknown'}:`, docError);
        results.push({ fileName: docRecord.file_name || 'unknown', matched: false });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Matched ${matchedCount} of ${pendingDocs.length} documents`,
        matched: matchedCount,
        total: pendingDocs.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Reprocess error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
