import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
import { GHL_V3 } from "../_shared/ghlClient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  token_uri: string;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
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

  // Import the private key for signing
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

  // Exchange JWT for access token
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

// List files in the shared folder
async function listFolderFiles(accessToken: string, folderId: string): Promise<DriveFile[]> {
  const query = `'${folderId}' in parents and trashed = false`;
  const fields = "files(id,name,mimeType,createdTime,modifiedTime,webViewLink)";
  
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&orderBy=createdTime desc&pageSize=50`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to list files: ${errorText}`);
  }

  const data = await response.json();
  return data.files || [];
}

// Download file content
async function downloadFileContent(accessToken: string, fileId: string, mimeType: string): Promise<string> {
  let url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  
  // For Google Docs, export as plain text
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

// Extract Google Calendar event ID from various URL formats
function extractCalendarEventId(url: string): string | null {
  // Format: https://calendar.google.com/calendar/event?eid=BASE64_EVENT_ID
  const eidMatch = url.match(/calendar\.google\.com\/calendar\/event\?eid=([A-Za-z0-9_-]+)/);
  if (eidMatch) return eidMatch[1];
  
  // Format: https://www.google.com/calendar/event?eid=BASE64_EVENT_ID
  const eidMatch2 = url.match(/google\.com\/calendar\/event\?eid=([A-Za-z0-9_-]+)/);
  if (eidMatch2) return eidMatch2[1];
  
  return null;
}

// Decode base64 calendar event ID to extract meet link or event details
function decodeCalendarEventId(eid: string): { meetLink?: string; calendarId?: string } | null {
  try {
    // Calendar EIDs are base64 encoded, sometimes with URL-safe characters
    const decoded = atob(eid.replace(/-/g, '+').replace(/_/g, '/'));
    const result: { meetLink?: string; calendarId?: string } = {};
    
    // Look for meet link in decoded content
    const meetMatch = decoded.match(/meet\.google\.com\/([a-z]+-[a-z]+-[a-z]+)/i);
    if (meetMatch) {
      result.meetLink = `https://meet.google.com/${meetMatch[1].toLowerCase()}`;
    }
    
    // The decoded string often contains the calendar ID and event ID separated by space
    // Format is typically: "eventId calendarId"
    const parts = decoded.split(' ');
    if (parts.length >= 1) {
      result.calendarId = parts[0];
    }
    
    return result;
  } catch {
    return null;
  }
}

// Parse date from filename (e.g., "Thursday, January 22" or "Jan 22, 2025")
function parseDateFromFilename(fileName: string): Date | null {
  // Pattern: "Month Day, Year" or "Month Day"
  const patterns = [
    // "January 22, 2025" or "January 22"
    /(\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2})(?:,?\s*(\d{4}))?/i,
    // "Jan 22, 2025" or "Jan 22"
    /(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2})(?:,?\s*(\d{4}))?/i,
    // "22 January 2025"
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

// Extract meeting identifiers from file content or name
function extractMeetingInfo(fileName: string, content: string): { 
  meetLink?: string; 
  attachmentMeetLink?: string;
  contactId?: string; 
  email?: string;
  attendeeEmails?: string[];
  companyName?: string;
  calendarEventId?: string;
  meetingDate?: Date;
  meetingTime?: string; // Time extracted from transcript (e.g., "10:30 AM")
  attendeeNames?: string[];
} {
  const result: { 
    meetLink?: string; 
    attachmentMeetLink?: string;
    contactId?: string; 
    email?: string; 
    attendeeEmails?: string[];
    companyName?: string; 
    calendarEventId?: string;
    meetingDate?: Date;
    meetingTime?: string;
    attendeeNames?: string[];
  } = {};

  // Parse meeting date from filename
  result.meetingDate = parseDateFromFilename(fileName) || undefined;
  if (result.meetingDate) {
    console.log(`Extracted meeting date from filename: ${result.meetingDate.toISOString()}`);
  }

  // Extract Meet links from Attachments section
  // Attachments often contain Calendar event links that have the Meet link
  const attachmentsSection = content.match(/Attachments[:\s]*\n?([\s\S]*?)(?:\n\n|\n[A-Z]|$)/i);
  if (attachmentsSection) {
    // Look for direct Meet links in attachments
    const attachmentMeetLinks = attachmentsSection[1].match(/https:\/\/meet\.google\.com\/[a-z]+-[a-z]+-[a-z]+/gi);
    if (attachmentMeetLinks && attachmentMeetLinks.length > 0) {
      result.attachmentMeetLink = attachmentMeetLinks[0].toLowerCase();
      console.log(`Extracted meet link from Attachments section: ${result.attachmentMeetLink}`);
    }
    
    // Look for Calendar event links that might contain Meet link
    const calendarLinks = attachmentsSection[1].match(/https:\/\/(?:www\.)?(?:calendar\.)?google\.com\/calendar\/event\?eid=[A-Za-z0-9_-]+/gi);
    if (calendarLinks && calendarLinks.length > 0) {
      for (const calLink of calendarLinks) {
        const eid = extractCalendarEventId(calLink);
        if (eid) {
          result.calendarEventId = eid;
          const decoded = decodeCalendarEventId(eid);
          if (decoded?.meetLink) {
            if (!result.attachmentMeetLink) {
              result.attachmentMeetLink = decoded.meetLink;
            }
            result.meetLink = decoded.meetLink;
            console.log(`Extracted meet link from Calendar attachment: ${result.meetLink}`);
            break;
          }
        }
      }
    }
    
    // Look for any URLs in attachments that might redirect to Meet
    // Format: links like https://calendar.google.com/calendar/r/... or shortened URLs
    const allAttachmentUrls = attachmentsSection[1].match(/https?:\/\/[^\s\n<>"]+/gi);
    if (allAttachmentUrls && !result.attachmentMeetLink) {
      for (const url of allAttachmentUrls) {
        // Check for Meet link in URL
        const meetInUrl = url.match(/meet\.google\.com\/([a-z]+-[a-z]+-[a-z]+)/i);
        if (meetInUrl) {
          result.attachmentMeetLink = `https://meet.google.com/${meetInUrl[1].toLowerCase()}`;
          console.log(`Extracted meet link from attachment URL: ${result.attachmentMeetLink}`);
          break;
        }
      }
    }
  }

  // Also check full content for calendar links if not found in attachments
  if (!result.meetLink) {
    const allCalendarLinks = content.match(/https:\/\/(?:www\.)?(?:calendar\.)?google\.com\/calendar\/event\?eid=[A-Za-z0-9_-]+/gi);
    if (allCalendarLinks) {
      for (const calLink of allCalendarLinks) {
        const eid = extractCalendarEventId(calLink);
        if (eid) {
          result.calendarEventId = eid;
          const decoded = decodeCalendarEventId(eid);
          if (decoded?.meetLink) {
            result.meetLink = decoded.meetLink;
            console.log(`Extracted meet link from Calendar link in content: ${result.meetLink}`);
            break;
          }
        }
      }
    }
  }

  // Try to find Google Meet link directly in content (more reliable when available)
  if (!result.meetLink) {
    const meetLinkContentMatch = content.match(/https:\/\/meet\.google\.com\/[a-z]+-[a-z]+-[a-z]+/gi);
    if (meetLinkContentMatch && meetLinkContentMatch.length > 0) {
      result.meetLink = meetLinkContentMatch[0].toLowerCase();
    }
  }
  
  // Use attachment meet link as fallback if no direct meet link found
  if (!result.meetLink && result.attachmentMeetLink) {
    result.meetLink = result.attachmentMeetLink;
    console.log(`Using attachment meet link as primary: ${result.meetLink}`);
  }

  // Fallback to filename
  if (!result.meetLink) {
    const meetLinkFileMatch = fileName.match(/https:\/\/meet\.google\.com\/[a-z]+-[a-z]+-[a-z]+/i);
    if (meetLinkFileMatch) {
      result.meetLink = meetLinkFileMatch[0].toLowerCase();
    }
  }

  // Try to find Zoom meeting ID
  const zoomMatch = content.match(/zoom\.us\/j\/(\d+)/i);
  if (zoomMatch) {
    result.meetLink = `zoom:${zoomMatch[1]}`;
  }

  // Extract attendee names from "Invited:" section in transcript
  // Format: "Invited: Name1, Name2" or "Invited:\nName1\nName2"
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

  // Extract name from filename pattern like "Discovery Meeting: AlfredAI & Fenn Projects"
  // The name after "&" before the date is usually the attendee/company
  const fileNamePatterns = [
    // "AlfredAI & Name/Company – Date" pattern
    /Alfred\s*Ai?\s*&\s*([^–\-\d]+?)(?:\s*[–\-]|\s*\d)/i,
    // "Meeting with Name" pattern
    /Meeting\s+with\s+([^–\-\d]+?)(?:\s*[–\-]|\s*\d)/i,
    // "Call with Name" pattern
    /Call\s+with\s+([^–\-\d]+?)(?:\s*[–\-]|\s*\d)/i,
  ];
  
  for (const pattern of fileNamePatterns) {
    const match = fileName.match(pattern);
    if (match) {
      const extracted = match[1].trim().replace(/\s+/g, ' ');
      // Filter out common non-name matches
      if (extracted && !extracted.match(/^(Notes|Transcript|Recording|by\s+Gemini|AEDT|AEST)$/i)) {
        // This could be a name or company - add it
        if (!attendeeNames.includes(extracted)) {
          attendeeNames.push(extracted);
        }
      }
    }
  }

  if (attendeeNames.length > 0) {
    result.attendeeNames = attendeeNames;
    console.log(`Extracted attendee names: ${attendeeNames.join(', ')}`);
  }

  // Extract company name from filename patterns like:
  // "Discovery Meeting: Alfred Ai & COMPANY_NAME – DATE"
  // "Solution with COMPANY_NAME – DATE"
  const companyPatterns = [
    /(?:Alfred\s*Ai?\s*&\s*)([^–\-\d]+?)(?:\s*[–\-]|\s*\d)/i,
    /(?:Discovery\s+Meeting[:\s]+)([^–\-]+?)(?:\s*[–\-])/i,
    /(?:Solution\s+with\s+)([^–\-]+?)(?:\s*[–\-])/i,
    /(?:Meeting[:\s]+)([^–\-]+?)(?:\s*[–\-])/i,
  ];
  
  for (const pattern of companyPatterns) {
    const match = fileName.match(pattern);
    if (match) {
      const extracted = match[1].trim().replace(/\s+/g, ' ');
      // Filter out common non-company matches
      if (extracted && !extracted.match(/^(Notes|Transcript|Recording|by\s+Gemini|AEDT|AEST)$/i)) {
        result.companyName = extracted;
        break;
      }
    }
  }

  // Collect all email addresses from content
  const emailMatches = content.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g) || [];
  const attendeeEmails: string[] = [];
  
  for (const email of emailMatches) {
    const lower = email.toLowerCase();
    // Skip common service/internal emails
    if (!lower.includes('alfredai') && 
        !lower.includes('google') && 
        !lower.includes('noreply') &&
        !lower.includes('no-reply') &&
        !lower.includes('calendar') &&
        !lower.includes('meet.google.com')) {
      if (!attendeeEmails.includes(lower)) {
        attendeeEmails.push(lower);
      }
      // Keep first external email as primary
      if (!result.email) {
        result.email = lower;
      }
    }
  }
  
  if (attendeeEmails.length > 0) {
    result.attendeeEmails = attendeeEmails;
    console.log(`Found ${attendeeEmails.length} attendee emails: ${attendeeEmails.join(', ')}`);
  }

  // Try to find GHL Contact ID pattern
  const contactIdMatch = content.match(/contact[_\s-]?id[:\s]+([a-zA-Z0-9]+)/i) ||
    fileName.match(/contact[_\s-]?id[_\s-]?([a-zA-Z0-9]+)/i);
  if (contactIdMatch) {
    result.contactId = contactIdMatch[1];
    console.log(`Extracted contact ID: ${result.contactId}`);
  }

  // Extract meeting time from content
  // Look for patterns like "10:30 AM", "2:00 PM AEDT", "Started: 9:00"
  const timePatterns = [
    /(?:started|start(?:ing)?|time|at)[:\s]+(\d{1,2}:\d{2}\s*(?:AM|PM)?(?:\s*[A-Z]{2,4})?)/i,
    /(?:meeting\s+)?(?:on\s+)?(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\s+)?(\d{1,2}:\d{2}\s*(?:AM|PM))/i,
    /(\d{1,2}:\d{2}\s*(?:AM|PM))\s*(?:AEDT|AEST|UTC|GMT|EST|PST)/i,
  ];
  
  for (const pattern of timePatterns) {
    const match = content.match(pattern);
    if (match) {
      result.meetingTime = match[1].trim();
      console.log(`Extracted meeting time: ${result.meetingTime}`);
      break;
    }
  }

  // Also try to extract time from filename
  if (!result.meetingTime) {
    const fileTimeMatch = fileName.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
    if (fileTimeMatch) {
      result.meetingTime = fileTimeMatch[1].trim();
      console.log(`Extracted meeting time from filename: ${result.meetingTime}`);
    }
  }

  return result;
}

// Normalize name for comparison (lowercase, remove extra spaces)
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

// Check if two names match (fuzzy match)
function namesMatch(name1: string, name2: string): boolean {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);
  
  // Exact match
  if (n1 === n2) return true;
  
  // One contains the other (for partial names like "Lach" matching "Lachlan")
  if (n1.includes(n2) || n2.includes(n1)) return true;
  
  // Check if first/last names match
  const parts1 = n1.split(' ');
  const parts2 = n2.split(' ');
  
  // If either name has parts that match
  for (const p1 of parts1) {
    for (const p2 of parts2) {
      // Match if parts are similar (at least 3 chars and one contains the other)
      if (p1.length >= 3 && p2.length >= 3 && (p1.includes(p2) || p2.includes(p1))) {
        return true;
      }
    }
  }
  
  return false;
}

// Search GHL for contacts by company/business name
async function searchGHLByCompanyName(
  companyName: string,
  ghlApiKey: string,
  ghlLocationId: string
): Promise<{ found: boolean; contacts?: Array<{ contactId: string; email?: string; businessName?: string }>; error?: string }> {
  try {
    console.log(`Searching GHL for contacts by company: "${companyName}"`);
    
    const response = await fetch(
      `https://services.leadconnectorhq.com/contacts/search`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ghlApiKey}`,
          'Version': GHL_V3,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationId: ghlLocationId,
          query: companyName,
          page: 1,
          pageLimit: 50,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GHL company search failed:', response.status, errorText);
      return { found: false, error: `Search failed: ${response.status}` };
    }

    const data = await response.json();
    const contacts = data.contacts || [];
    
    // Filter contacts that have matching business name
    const normalizedSearch = companyName.toLowerCase().trim();
    const matchingContacts = contacts.filter((c: { businessName?: string; companyName?: string; company?: string }) => {
      const bizName = (c.businessName || c.companyName || c.company || '').toLowerCase().trim();
      // Fuzzy match: contains the search term or vice versa
      return bizName && (bizName.includes(normalizedSearch) || normalizedSearch.includes(bizName));
    }).map((c: { id: string; email?: string; businessName?: string; companyName?: string; company?: string }) => ({
      contactId: c.id,
      email: c.email,
      businessName: c.businessName || c.companyName || c.company,
    }));
    
    if (matchingContacts.length > 0) {
      console.log(`Found ${matchingContacts.length} GHL contacts for company "${companyName}"`);
      return { found: true, contacts: matchingContacts };
    }
    
    return { found: false };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error searching GHL by company:', errorMessage);
    return { found: false, error: errorMessage };
  }
}

// Fetch GHL contact by ID
async function fetchGHLContactById(
  contactId: string,
  ghlApiKey: string
): Promise<{ found: boolean; contact?: { id: string; email?: string; businessName?: string; firstName?: string; lastName?: string }; error?: string }> {
  try {
    console.log(`Fetching GHL contact by ID: ${contactId}`);
    
    const response = await fetch(
      `https://services.leadconnectorhq.com/contacts/${contactId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ghlApiKey}`,
          'Version': GHL_V3,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 404) {
      return { found: false };
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GHL contact fetch failed:', response.status, errorText);
      return { found: false, error: `Fetch failed: ${response.status}` };
    }

    const data = await response.json();
    const c = data?.contact ?? data;
    
    if (c && c.id) {
      console.log(`Found GHL contact: ${c.id}, email: ${c.email || 'none'}`);
      return {
        found: true,
        contact: {
          id: c.id,
          email: c.email,
          businessName: c.businessName || c.companyName || c.company,
          firstName: c.firstName,
          lastName: c.lastName,
        },
      };
    }
    
    return { found: false };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching GHL contact:', errorMessage);
    return { found: false, error: errorMessage };
  }
}

// Search GHL for contact by email
async function searchGHLByEmail(
  email: string,
  ghlApiKey: string,
  ghlLocationId: string
): Promise<{ found: boolean; contact?: { id: string; email?: string; businessName?: string; firstName?: string; lastName?: string }; error?: string }> {
  try {
    console.log(`Searching GHL for contact by email: ${email}`);
    
    const response = await fetch(
      `https://services.leadconnectorhq.com/contacts/search`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ghlApiKey}`,
          'Version': GHL_V3,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationId: ghlLocationId,
          query: email,
          page: 1,
          pageLimit: 10,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GHL email search failed:', response.status, errorText);
      return { found: false, error: `Search failed: ${response.status}` };
    }

    const data = await response.json();
    const contacts = data.contacts || [];
    
    // Find exact email match
    const contact = contacts.find((c: { email?: string }) =>
      c.email?.toLowerCase() === email.toLowerCase()
    );
    
    if (contact && contact.id) {
      console.log(`Found GHL contact for ${email}: ${contact.id}`);
      return {
        found: true,
        contact: {
          id: contact.id,
          email: contact.email,
          businessName: contact.businessName || contact.companyName || contact.company,
          firstName: contact.firstName,
          lastName: contact.lastName,
        },
      };
    }
    
    return { found: false };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error searching GHL by email:', errorMessage);
    return { found: false, error: errorMessage };
  }
}

// Search GHL appointments by date range to find matching meetings
async function searchGHLAppointmentsByDate(
  meetingDate: Date,
  ghlApiKey: string,
  ghlLocationId: string
): Promise<{ found: boolean; appointments?: Array<{ id: string; contactId?: string; title?: string; startTime?: string }>; error?: string }> {
  try {
    const dayStart = new Date(meetingDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(meetingDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    console.log(`Searching GHL appointments for date: ${meetingDate.toDateString()}`);
    
    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/events?locationId=${ghlLocationId}&startTime=${dayStart.getTime()}&endTime=${dayEnd.getTime()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ghlApiKey}`,
          'Version': GHL_V3,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // Don't treat as error - endpoint might not be available
      console.log('GHL appointments search not available or returned error');
      return { found: false };
    }

    const data = await response.json();
    const events = data.events || data.appointments || [];
    
    if (events.length > 0) {
      console.log(`Found ${events.length} GHL appointments for ${meetingDate.toDateString()}`);
      return {
        found: true,
        appointments: events.map((e: { id: string; contactId?: string; title?: string; startTime?: string }) => ({
          id: e.id,
          contactId: e.contactId,
          title: e.title,
          startTime: e.startTime,
        })),
      };
    }
    
    return { found: false };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error searching GHL appointments:', errorMessage);
    return { found: false, error: errorMessage };
  }
}

// Match file to a meeting record
async function matchToMeeting(
  supabase: SupabaseClient,
  fileName: string,
  content: string,
  fileCreatedTime: string,
  ghlApiKey?: string,
  ghlLocationId?: string
): Promise<MatchResult | null> {
  const info = extractMeetingInfo(fileName, content);
  const fileDate = new Date(fileCreatedTime);
  // Use parsed meeting date from filename if available, otherwise fall back to file created time
  const meetingDate = info.meetingDate || fileDate;

  // Strategy 1: Match by meet link (highest confidence)
  if (info.meetLink) {
    // Check investor bookings
    const { data: investorBookings } = await supabase
      .from("investor_bookings")
      .select("id")
      .ilike("location", `%${info.meetLink}%`)
      .limit(1);

    if (investorBookings && investorBookings.length > 0) {
      return {
        meetingId: investorBookings[0].id,
        meetingType: "investor",  // Use 'investor' so it shows in admin panel
        matchMethod: "meet_link",
        confidence: "high",
      };
    }

    // Check GHL submissions
    const { data: ghlSubmissions } = await supabase
      .from("ghl_submissions")
      .select("id")
      .ilike("meet_link", `%${info.meetLink}%`)
      .limit(1);

    if (ghlSubmissions && ghlSubmissions.length > 0) {
      return {
        meetingId: ghlSubmissions[0].id,
        meetingType: "demo",  // Use 'demo' so it shows in admin panel
        matchMethod: "meet_link",
        confidence: "high",
      };
    }
  }

  // Strategy 2: Match by attendee email + date proximity (within same day)
  if (info.attendeeEmails && info.attendeeEmails.length > 0) {
    const dayStart = new Date(meetingDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(meetingDate);
    dayEnd.setHours(23, 59, 59, 999);

    for (const email of info.attendeeEmails) {
      // Check GHL submissions by email within the same day
      const { data: ghlSubmissions } = await supabase
        .from("ghl_submissions")
        .select("id, ghl_response")
        .eq("lead_email", email)
        .in("ghl_status", ["confirmed", "rescheduled"])
        .order("created_at", { ascending: false })
        .limit(5);

      if (ghlSubmissions && ghlSubmissions.length > 0) {
        // Find one that matches the meeting date
        for (const submission of ghlSubmissions) {
          const response = submission.ghl_response as { start_time?: string } | null;
          if (response?.start_time) {
            const startTime = new Date(response.start_time);
            if (startTime >= dayStart && startTime <= dayEnd) {
              console.log(`Matched by email ${email} + date ${meetingDate.toDateString()}`);
              return {
                meetingId: submission.id,
                meetingType: "demo",
                matchMethod: "email_date",
                confidence: "high",
              };
            }
          }
        }
      }

      // Check investor leads by email
      const { data: investorLeads } = await supabase
        .from("investor_leads")
        .select("id")
        .eq("email", email)
        .limit(1);

      if (investorLeads && investorLeads.length > 0) {
        const { data: bookings } = await supabase
          .from("investor_bookings")
          .select("id, start_time")
          .eq("investor_id", investorLeads[0].id)
          .gte("start_time", dayStart.toISOString())
          .lte("start_time", dayEnd.toISOString())
          .limit(1);

        if (bookings && bookings.length > 0) {
          console.log(`Matched investor by email ${email} + date`);
          return {
            meetingId: bookings[0].id,
            meetingType: "investor",
            matchMethod: "email_date",
            confidence: "high",
          };
        }
      }
    }
  }

  // Strategy 3: Match by attendee name + date proximity (NEW)
  if (info.attendeeNames && info.attendeeNames.length > 0 && info.meetingDate) {
    const dayStart = new Date(info.meetingDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(info.meetingDate);
    dayEnd.setHours(23, 59, 59, 999);

    console.log(`Attempting attendee name + date match: "${info.attendeeNames.join(', ')}" on ${info.meetingDate.toDateString()}`);

    // Get all GHL submissions for the date
    const { data: ghlByDate } = await supabase
      .from("ghl_submissions")
      .select("id, lead_name, lead_first_name, lead_last_name, lead_company, ghl_response")
      .in("ghl_status", ["confirmed", "rescheduled"])
      .order("created_at", { ascending: false })
      .limit(50);

    if (ghlByDate && ghlByDate.length > 0) {
      for (const submission of ghlByDate) {
        const response = submission.ghl_response as { start_time?: string } | null;
        if (response?.start_time) {
          const startTime = new Date(response.start_time);
          if (startTime >= dayStart && startTime <= dayEnd) {
            // Build candidate names from the submission
            const candidateNames: string[] = [];
            if (submission.lead_name) candidateNames.push(submission.lead_name);
            if (submission.lead_first_name) candidateNames.push(submission.lead_first_name);
            if (submission.lead_first_name && submission.lead_last_name) {
              candidateNames.push(`${submission.lead_first_name} ${submission.lead_last_name}`);
            }
            if (submission.lead_company) candidateNames.push(submission.lead_company);

            // Check if any attendee name matches any candidate name
            for (const attendeeName of info.attendeeNames) {
              for (const candidateName of candidateNames) {
                if (namesMatch(attendeeName, candidateName)) {
                  console.log(`Matched by attendee name "${attendeeName}" ≈ "${candidateName}" + date`);
                  return {
                    meetingId: submission.id,
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
        // Check if any attendee name matches
        for (const attendeeName of info.attendeeNames) {
          if (
            (investor.full_name && namesMatch(attendeeName, investor.full_name)) ||
            (investor.firm_name && namesMatch(attendeeName, investor.firm_name))
          ) {
            // Check for bookings on the date
            const { data: bookings } = await supabase
              .from("investor_bookings")
              .select("id")
              .eq("investor_id", investor.id)
              .gte("start_time", dayStart.toISOString())
              .lte("start_time", dayEnd.toISOString())
              .limit(1);

            if (bookings && bookings.length > 0) {
              console.log(`Matched investor by name "${attendeeName}" ≈ "${investor.full_name || investor.firm_name}" + date`);
              return {
                meetingId: bookings[0].id,
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

  // Strategy 4: Match by attachment Meet link + attendee name (NEW)
  // When we have a Meet link from attachments but couldn't match directly, try with name
  if (info.attachmentMeetLink && info.attendeeNames && info.attendeeNames.length > 0) {
    console.log(`Attempting attachment meet link + name match: "${info.attachmentMeetLink}" with "${info.attendeeNames.join(', ')}"`);

    // Try to find the meeting by Meet link in location field
    const { data: ghlByMeetLink } = await supabase
      .from("ghl_submissions")
      .select("id, lead_name, lead_first_name, lead_last_name, lead_company")
      .or(`meet_link.ilike.%${info.attachmentMeetLink}%`)
      .limit(10);

    if (ghlByMeetLink && ghlByMeetLink.length > 0) {
      for (const submission of ghlByMeetLink) {
        const candidateNames: string[] = [];
        if (submission.lead_name) candidateNames.push(submission.lead_name);
        if (submission.lead_first_name) candidateNames.push(submission.lead_first_name);
        if (submission.lead_first_name && submission.lead_last_name) {
          candidateNames.push(`${submission.lead_first_name} ${submission.lead_last_name}`);
        }
        if (submission.lead_company) candidateNames.push(submission.lead_company);

        for (const attendeeName of info.attendeeNames) {
          for (const candidateName of candidateNames) {
            if (namesMatch(attendeeName, candidateName)) {
              console.log(`Matched by attachment meet link + name "${attendeeName}" ≈ "${candidateName}"`);
              return {
                meetingId: submission.id,
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
        if (booking.investor_id) {
          const { data: investor } = await supabase
            .from("investor_leads")
            .select("full_name, firm_name")
            .eq("id", booking.investor_id)
            .single();

          if (investor) {
            for (const attendeeName of info.attendeeNames) {
              if (
                (investor.full_name && namesMatch(attendeeName, investor.full_name)) ||
                (investor.firm_name && namesMatch(attendeeName, investor.firm_name))
              ) {
                console.log(`Matched investor by attachment meet link + name "${attendeeName}"`);
                return {
                  meetingId: booking.id,
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

  // Strategy 5: Match by company name + date proximity
  if (info.companyName && info.meetingDate) {
    const dayStart = new Date(info.meetingDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(info.meetingDate);
    dayEnd.setHours(23, 59, 59, 999);

    console.log(`Attempting company name + date match: "${info.companyName}" on ${info.meetingDate.toDateString()}`);

    // Check GHL submissions by company within the date
    const { data: ghlByCompany } = await supabase
      .from("ghl_submissions")
      .select("id, lead_company, ghl_response")
      .ilike("lead_company", `%${info.companyName}%`)
      .in("ghl_status", ["confirmed", "rescheduled"])
      .order("created_at", { ascending: false })
      .limit(10);

    if (ghlByCompany && ghlByCompany.length > 0) {
      for (const submission of ghlByCompany) {
        const response = submission.ghl_response as { start_time?: string } | null;
        if (response?.start_time) {
          const startTime = new Date(response.start_time);
          if (startTime >= dayStart && startTime <= dayEnd) {
            console.log(`Matched by company "${submission.lead_company}" + date`);
            return {
              meetingId: submission.id,
              meetingType: "demo",
              matchMethod: "company_date",
              confidence: "high",
            };
          }
        }
      }
    }

    // Check investor leads by firm name within the date
    const { data: investorByFirm } = await supabase
      .from("investor_leads")
      .select("id")
      .ilike("firm_name", `%${info.companyName}%`)
      .limit(5);

    if (investorByFirm && investorByFirm.length > 0) {
      for (const investor of investorByFirm) {
        const { data: bookings } = await supabase
          .from("investor_bookings")
          .select("id")
          .eq("investor_id", investor.id)
          .gte("start_time", dayStart.toISOString())
          .lte("start_time", dayEnd.toISOString())
          .limit(1);

        if (bookings && bookings.length > 0) {
          console.log(`Matched investor by firm name + date`);
          return {
            meetingId: bookings[0].id,
            meetingType: "investor",
            matchMethod: "company_date",
            confidence: "high",
          };
        }
      }
    }
  }

  // Strategy 4: Match by company name only (medium confidence)
  if (info.companyName) {
    console.log(`Attempting company name match: "${info.companyName}"`);
    
    // Check GHL submissions by company
    const { data: ghlByCompany } = await supabase
      .from("ghl_submissions")
      .select("id, lead_company, ghl_status")
      .ilike("lead_company", `%${info.companyName}%`)
      .in("ghl_status", ["confirmed", "rescheduled"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (ghlByCompany && ghlByCompany.length > 0) {
      console.log(`Company match found: ${ghlByCompany[0].lead_company}`);
      return {
        meetingId: ghlByCompany[0].id,
        meetingType: "demo",
        matchMethod: "company_name",
        confidence: "medium",
      };
    }

    // Check investor leads by firm name
    const { data: investorByFirm } = await supabase
      .from("investor_leads")
      .select("id")
      .ilike("firm_name", `%${info.companyName}%`)
      .limit(1);

    if (investorByFirm && investorByFirm.length > 0) {
      const { data: bookings } = await supabase
        .from("investor_bookings")
        .select("id")
        .eq("investor_id", investorByFirm[0].id)
        .order("start_time", { ascending: false })
        .limit(1);

      if (bookings && bookings.length > 0) {
        return {
          meetingId: bookings[0].id,
          meetingType: "investor",
          matchMethod: "company_name",
          confidence: "medium",
        };
      }
    }
  }

  // Strategy 5: Most recent confirmed meeting by email (medium confidence)
  if (info.email) {
    const { data: investorLeads } = await supabase
      .from("investor_leads")
      .select("id")
      .eq("email", info.email)
      .limit(1);

    if (investorLeads && investorLeads.length > 0) {
      const { data: recentBookings } = await supabase
        .from("investor_bookings")
        .select("id")
        .eq("investor_id", investorLeads[0].id)
        .eq("status", "confirmed")
        .order("start_time", { ascending: false })
        .limit(1);

      if (recentBookings && recentBookings.length > 0) {
        return {
          meetingId: recentBookings[0].id,
          meetingType: "investor",
          matchMethod: "recent_confirmed_email",
          confidence: "medium",
        };
      }
    }

    // GHL by email
    const { data: ghlByEmail } = await supabase
      .from("ghl_submissions")
      .select("id")
      .eq("lead_email", info.email)
      .in("ghl_status", ["confirmed", "rescheduled"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (ghlByEmail && ghlByEmail.length > 0) {
      return {
        meetingId: ghlByEmail[0].id,
        meetingType: "demo",
        matchMethod: "recent_confirmed_email",
        confidence: "medium",
      };
    }
  }

  // Strategy 6: Search GHL by company name (NEW - high confidence when found)
  if (info.companyName && ghlApiKey && ghlLocationId) {
    console.log(`Strategy 6: Searching GHL for company "${info.companyName}"`);
    const ghlCompanyResult = await searchGHLByCompanyName(info.companyName, ghlApiKey, ghlLocationId);
    
    if (ghlCompanyResult.found && ghlCompanyResult.contacts && ghlCompanyResult.contacts.length > 0) {
      // Try to match GHL contacts to our database records
      for (const ghlContact of ghlCompanyResult.contacts) {
        if (ghlContact.email) {
          // Check GHL submissions by email
          const { data: ghlMatch } = await supabase
            .from("ghl_submissions")
            .select("id, ghl_status")
            .eq("lead_email", ghlContact.email)
            .in("ghl_status", ["confirmed", "rescheduled"])
            .order("created_at", { ascending: false })
            .limit(1);
            
          if (ghlMatch && ghlMatch.length > 0) {
            console.log(`Matched via GHL company search: "${info.companyName}" → ${ghlContact.email}`);
            return {
              meetingId: ghlMatch[0].id,
              meetingType: "demo",
              matchMethod: "ghl_company_search",
              confidence: "high",
            };
          }
          
          // Check investor leads
          const { data: investorMatch } = await supabase
            .from("investor_leads")
            .select("id")
            .eq("email", ghlContact.email)
            .limit(1);
            
          if (investorMatch && investorMatch.length > 0) {
            const { data: bookings } = await supabase
              .from("investor_bookings")
              .select("id")
              .eq("investor_id", investorMatch[0].id)
              .order("start_time", { ascending: false })
              .limit(1);
              
            if (bookings && bookings.length > 0) {
              console.log(`Matched investor via GHL company search: "${info.companyName}" → ${ghlContact.email}`);
              return {
                meetingId: bookings[0].id,
                meetingType: "investor",
                matchMethod: "ghl_company_search",
                confidence: "high",
              };
            }
          }
        }
      }
    }
  }

  // Strategy 7: Search GHL by Contact ID (if found in transcript)
  if (info.contactId && ghlApiKey) {
    console.log(`Strategy 7: Fetching GHL contact by ID "${info.contactId}"`);
    const ghlContactResult = await fetchGHLContactById(info.contactId, ghlApiKey);
    
    if (ghlContactResult.found && ghlContactResult.contact?.email) {
      // Try to match to our database by email
      const { data: ghlMatch } = await supabase
        .from("ghl_submissions")
        .select("id")
        .eq("lead_email", ghlContactResult.contact.email)
        .in("ghl_status", ["confirmed", "rescheduled"])
        .order("created_at", { ascending: false })
        .limit(1);
        
      if (ghlMatch && ghlMatch.length > 0) {
        console.log(`Matched via GHL contact ID: ${info.contactId} → ${ghlContactResult.contact.email}`);
        return {
          meetingId: ghlMatch[0].id,
          meetingType: "demo",
          matchMethod: "ghl_contact_id",
          confidence: "high",
        };
      }
      
      // Check investor leads
      const { data: investorMatch } = await supabase
        .from("investor_leads")
        .select("id")
        .eq("email", ghlContactResult.contact.email)
        .limit(1);
        
      if (investorMatch && investorMatch.length > 0) {
        const { data: bookings } = await supabase
          .from("investor_bookings")
          .select("id")
          .eq("investor_id", investorMatch[0].id)
          .order("start_time", { ascending: false })
          .limit(1);
          
        if (bookings && bookings.length > 0) {
          console.log(`Matched investor via GHL contact ID: ${info.contactId}`);
          return {
            meetingId: bookings[0].id,
            meetingType: "investor",
            matchMethod: "ghl_contact_id",
            confidence: "high",
          };
        }
      }
    }
  }

  // Strategy 8: Search GHL by email directly (when email found in transcript)
  if (info.email && ghlApiKey && ghlLocationId) {
    console.log(`Strategy 8: Searching GHL for email "${info.email}"`);
    const ghlEmailResult = await searchGHLByEmail(info.email, ghlApiKey, ghlLocationId);
    
    if (ghlEmailResult.found && ghlEmailResult.contact) {
      // Found in GHL - try to match to our database
      const { data: ghlMatch } = await supabase
        .from("ghl_submissions")
        .select("id")
        .eq("lead_email", info.email)
        .in("ghl_status", ["confirmed", "rescheduled"])
        .order("created_at", { ascending: false })
        .limit(1);
        
      if (ghlMatch && ghlMatch.length > 0) {
        console.log(`Matched via GHL email search: ${info.email}`);
        return {
          meetingId: ghlMatch[0].id,
          meetingType: "demo",
          matchMethod: "ghl_email_search",
          confidence: "high",
        };
      }
    }
  }

  // Strategy 9: Search GHL appointments by date
  if (info.meetingDate && ghlApiKey && ghlLocationId) {
    console.log(`Strategy 9: Searching GHL appointments for ${info.meetingDate.toDateString()}`);
    const ghlAppointments = await searchGHLAppointmentsByDate(info.meetingDate, ghlApiKey, ghlLocationId);
    
    if (ghlAppointments.found && ghlAppointments.appointments && ghlAppointments.appointments.length > 0) {
      // Try to match appointment contacts to our database
      for (const appointment of ghlAppointments.appointments) {
        if (appointment.contactId) {
          // Fetch the contact details
          const contactResult = await fetchGHLContactById(appointment.contactId, ghlApiKey);
          if (contactResult.found && contactResult.contact?.email) {
            const { data: ghlMatch } = await supabase
              .from("ghl_submissions")
              .select("id")
              .eq("lead_email", contactResult.contact.email)
              .in("ghl_status", ["confirmed", "rescheduled"])
              .limit(1);
              
            if (ghlMatch && ghlMatch.length > 0) {
              console.log(`Matched via GHL appointment date + contact: ${contactResult.contact.email}`);
              return {
                meetingId: ghlMatch[0].id,
                meetingType: "demo",
                matchMethod: "ghl_appointment_date",
                confidence: "high",
              };
            }
          }
        }
      }
    }
  }

  // Strategy 10: Time-only fallback (±15 minutes) - low confidence
  const fifteenMinsBefore = new Date(fileDate.getTime() - 15 * 60 * 1000).toISOString();
  const fifteenMinsAfter = new Date(fileDate.getTime() + 15 * 60 * 1000).toISOString();

  const { data: timeOnlyBookings } = await supabase
    .from("investor_bookings")
    .select("id")
    .gte("start_time", fifteenMinsBefore)
    .lte("start_time", fifteenMinsAfter)
    .eq("status", "confirmed")
    .limit(1);

  if (timeOnlyBookings && timeOnlyBookings.length > 0) {
    return {
      meetingId: timeOnlyBookings[0].id,
      meetingType: "investor",
      matchMethod: "time_proximity_only",
      confidence: "low",
    };
  }

  return null;
}

// GHL file size limit is 5MB
const GHL_MAX_FILE_SIZE = 5 * 1024 * 1024;

// Download file content as binary for GHL upload
async function downloadFileContentBinary(accessToken: string, fileId: string, mimeType: string): Promise<{ data: Uint8Array; size: number } | null> {
  let url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  
  // For Google Docs, export as plain text
  if (mimeType === "application/vnd.google-apps.document") {
    url += "/export?mimeType=text/plain";
  } else {
    url += "?alt=media";
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    console.error(`Failed to download file binary: ${response.status}`);
    return null;
  }

  const arrayBuffer = await response.arrayBuffer();
  return { data: new Uint8Array(arrayBuffer), size: arrayBuffer.byteLength };
}

// Upload file to GHL as attachment
async function uploadFileToGHL(params: {
  ghlApiKey: string;
  ghlLocationId: string;
  contactId: string;
  fileName: string;
  fileContent: Uint8Array;
  mimeType: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('contactId', params.contactId);
    formData.append('locationId', params.ghlLocationId);
    formData.append('type', 'Custom');
    
    // Create blob from Uint8Array - use the array directly which is safe
    const blob = new Blob([new Uint8Array(params.fileContent)], { type: params.mimeType });
    formData.append('fileAttachment', blob, params.fileName);

    const response = await fetch(
      'https://services.leadconnectorhq.com/conversations/messages/upload',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${params.ghlApiKey}`,
          Version: '2021-04-15',
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GHL-UPLOAD] Failed to upload file: ${errorText}`);
      return { success: false, error: `Upload failed: ${response.status}` };
    }

    const result = await response.json();
    console.log(`[GHL-UPLOAD] Successfully uploaded file: ${params.fileName}`);
    return { success: true, messageId: result.id || result.messageId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[GHL-UPLOAD] Error: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

// GHL-first sync helper: Sync transcript to GHL BEFORE database insert
interface GHLSyncParams {
  ghlApiKey: string;
  ghlLocationId: string;
  contactEmail: string;
  fileName: string;
  fileLink: string;
  matchMethod: string;
  matchConfidence: string;
  accessToken?: string;
  fileId?: string;
  mimeType?: string;
}

interface GHLSyncResult {
  success: boolean;
  contactId: string | null;
  error: string | null;
  syncType: 'file_attachment' | 'note_with_link' | null;
  // Business name from GHL contact - for syncing back to admin panel
  businessName: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
}

async function syncTranscriptToGHL(params: GHLSyncParams): Promise<GHLSyncResult> {
  const { ghlApiKey, ghlLocationId, contactEmail, fileName, fileLink, matchMethod, matchConfidence, accessToken, fileId, mimeType } = params;
  
  try {
    console.log(`[GHL-FIRST] Attempting sync for ${fileName} to contact ${contactEmail}`);
    
    // Step 1: Find GHL contact by email
    const searchResponse = await fetch(
      `https://services.leadconnectorhq.com/contacts/?locationId=${ghlLocationId}&query=${encodeURIComponent(contactEmail)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${ghlApiKey}`,
          Version: GHL_V3,
          "Content-Type": "application/json",
        },
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error(`[GHL-FIRST] Contact search failed: ${errorText}`);
      return { success: false, contactId: null, error: `Contact search failed: ${searchResponse.status}`, syncType: null, businessName: null, firstName: null, lastName: null, phone: null };
    }

    const searchData = await searchResponse.json();
    const contact = searchData.contacts?.find(
      (c: { email?: string }) => c.email?.toLowerCase() === contactEmail.toLowerCase()
    ) as { id?: string; email?: string; firstName?: string; lastName?: string; phone?: string; companyName?: string; businessName?: string; company?: string } | undefined;

    if (!contact?.id) {
      console.log(`[GHL-FIRST] No contact found for email: ${contactEmail}`);
      return { success: false, contactId: null, error: `Contact not found: ${contactEmail}`, syncType: null, businessName: null, firstName: null, lastName: null, phone: null };
    }

    // Extract contact details from GHL for syncing back to admin panel
    const ghlBusinessName = contact.businessName || contact.companyName || contact.company || null;
    const ghlFirstName = contact.firstName || null;
    const ghlLastName = contact.lastName || null;
    const ghlPhone = contact.phone || null;
    
    if (ghlBusinessName) {
      console.log(`[GHL-FIRST] Found business name in GHL: ${ghlBusinessName}`);
    }

    // Step 2: Try to upload actual file if we have the access token and file ID
    let uploadSuccess = false;
    let syncType: 'file_attachment' | 'note_with_link' = 'note_with_link';
    
    if (accessToken && fileId && mimeType) {
      // Download file content
      const fileData = await downloadFileContentBinary(accessToken, fileId, mimeType);
      
      if (fileData && fileData.size <= GHL_MAX_FILE_SIZE) {
        console.log(`[GHL-FIRST] File size ${fileData.size} bytes is under 5MB limit, uploading as attachment`);
        
        // Determine the actual mime type for the file
        const exportMimeType = mimeType === "application/vnd.google-apps.document" 
          ? "text/plain" 
          : mimeType;
        
        const uploadResult = await uploadFileToGHL({
          ghlApiKey,
          ghlLocationId,
          contactId: contact.id,
          fileName,
          fileContent: fileData.data,
          mimeType: exportMimeType,
        });

        if (uploadResult.success) {
          uploadSuccess = true;
          syncType = 'file_attachment';
          console.log(`[GHL-FIRST] Successfully uploaded file attachment to contact ${contact.id}`);
        } else {
          console.log(`[GHL-FIRST] File upload failed, falling back to note: ${uploadResult.error}`);
        }
      } else if (fileData) {
        console.log(`[GHL-FIRST] File size ${fileData.size} bytes exceeds 5MB limit, using note with link`);
      }
    }

    // Step 3: Create note (always, with different content based on upload success)
    let noteBody: string;
    if (uploadSuccess) {
      noteBody = `[AlfredAI] Meeting Transcript Synced (File Attached)
📄 File: ${fileName}
✅ Matched: ${matchMethod} (${matchConfidence})
📅 Imported: ${new Date().toISOString()}

The file has been attached to this conversation.`;
    } else {
      noteBody = `[AlfredAI] Meeting Transcript Auto-Synced
📄 File: ${fileName}
🔗 Link: ${fileLink}
✅ Matched: ${matchMethod} (${matchConfidence})
📅 Imported: ${new Date().toISOString()}

This transcript was automatically synced when detected in Google Drive.`;
    }

    const noteResponse = await fetch(
      `https://services.leadconnectorhq.com/contacts/${contact.id}/notes`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ghlApiKey}`,
          Version: GHL_V3,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: noteBody }),
      }
    );

    if (!noteResponse.ok) {
      const errorText = await noteResponse.text();
      console.error(`[GHL-FIRST] Note creation failed: ${errorText}`);
      // If we already uploaded the file, consider it a partial success
      if (uploadSuccess) {
        return { success: true, contactId: contact.id, error: null, syncType, businessName: ghlBusinessName, firstName: ghlFirstName, lastName: ghlLastName, phone: ghlPhone };
      }
      return { success: false, contactId: contact.id, error: `Note creation failed: ${noteResponse.status}`, syncType: null, businessName: ghlBusinessName, firstName: ghlFirstName, lastName: ghlLastName, phone: ghlPhone };
    }

    console.log(`[GHL-FIRST] Successfully synced ${fileName} to contact ${contact.id} (${syncType})${ghlBusinessName ? ` - Business: ${ghlBusinessName}` : ''}`);
    return { success: true, contactId: contact.id, error: null, syncType, businessName: ghlBusinessName, firstName: ghlFirstName, lastName: ghlLastName, phone: ghlPhone };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[GHL-FIRST] Sync error: ${errorMessage}`);
    return { success: false, contactId: null, error: errorMessage, syncType: null, businessName: null, firstName: null, lastName: null, phone: null };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON")!;
    const folderId = Deno.env.get("GOOGLE_DRIVE_FOLDER_ID")!;
    const ghlApiKey = Deno.env.get("GHL_API_KEY");
    const ghlLocationId = Deno.env.get("GHL_LOCATION_ID");

    if (!serviceAccountJson || !folderId) {
      throw new Error("Missing Google Drive configuration secrets");
    }

    const credentials: ServiceAccountCredentials = JSON.parse(serviceAccountJson);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Authenticating with Google Drive...");
    const accessToken = await generateServiceAccountToken(credentials);

    console.log("Listing files in folder...");
    const files = await listFolderFiles(accessToken, folderId);
    console.log(`Found ${files.length} files`);

    const processedFiles: string[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        // Check if we've already processed this file
        const { data: existingDocs } = await supabase
          .from("meeting_documents")
          .select("id")
          .eq("metadata->>google_drive_file_id", file.id)
          .limit(1);

        if (existingDocs && existingDocs.length > 0) {
          console.log(`Skipping already processed file: ${file.name}`);
          continue;
        }

        // Only process text-based files
        const supportedTypes = [
          "application/vnd.google-apps.document",
          "text/plain",
          "application/pdf",
        ];
        if (!supportedTypes.includes(file.mimeType)) {
          console.log(`Skipping unsupported file type: ${file.name} (${file.mimeType})`);
          continue;
        }

        console.log(`Processing file: ${file.name}`);

        // Download content (skip PDFs for now - would need OCR)
        let content = "";
        if (file.mimeType !== "application/pdf") {
          content = await downloadFileContent(accessToken, file.id, file.mimeType);
        }

        // Try to match to a meeting (now with GHL company search capability)
        const match = await matchToMeeting(supabase, file.name, content, file.createdTime, ghlApiKey, ghlLocationId);

        // STEP 1: Attempt GHL sync BEFORE database insert (GHL-first approach)
        let ghlSyncResult: GHLSyncResult = { success: false, contactId: null, error: null, syncType: null, businessName: null, firstName: null, lastName: null, phone: null };
        let contactEmail: string | null = null;

        if (match) {
          try {
            // Get contact email based on match type
            if (match.meetingType === "demo") {
              const { data: meeting } = await supabase
                .from("ghl_submissions")
                .select("lead_email")
                .eq("id", match.meetingId)
                .single();
              contactEmail = meeting?.lead_email || null;
            } else if (match.meetingType === "investor") {
              const { data: booking } = await supabase
                .from("investor_bookings")
                .select("investor_id")
                .eq("id", match.meetingId)
                .single();

              if (booking?.investor_id) {
                const { data: investor } = await supabase
                  .from("investor_leads")
                  .select("email")
                  .eq("id", booking.investor_id)
                  .single();
                contactEmail = investor?.email || null;
              }
            }

            // Attempt GHL sync FIRST (with file upload if possible)
            if (contactEmail) {
              const ghlApiKey = Deno.env.get("GHL_API_KEY");
              const ghlLocationId = Deno.env.get("GHL_LOCATION_ID");

              if (ghlApiKey && ghlLocationId) {
                console.log(`[GHL-FIRST] Syncing BEFORE database insert: ${file.name}`);
                ghlSyncResult = await syncTranscriptToGHL({
                  ghlApiKey,
                  ghlLocationId,
                  contactEmail,
                  fileName: file.name,
                  fileLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}`,
                  matchMethod: match.matchMethod,
                  matchConfidence: match.confidence,
                  // Pass file info for direct upload attempt
                  accessToken,
                  fileId: file.id,
                  mimeType: file.mimeType,
                });
              }
            }
          } catch (syncError) {
            console.error(`[GHL-FIRST] Pre-insert sync error for ${file.name}:`, syncError);
            ghlSyncResult = { 
              success: false, 
              contactId: null, 
              error: syncError instanceof Error ? syncError.message : String(syncError),
              syncType: null,
              businessName: null,
              firstName: null,
              lastName: null,
              phone: null,
            };
          }
        }

        // STEP 2: Insert document with GHL sync status already set
        const documentData = {
          meeting_id: match?.meetingId || null,
          meeting_type: match?.meetingType || "pending_match",
          document_type: "transcript",
          file_name: file.name,
          file_url: file.webViewLink || `https://drive.google.com/file/d/${file.id}`,
          source: "google_drive",
          ghl_synced: ghlSyncResult.success,
          ghl_synced_at: ghlSyncResult.success ? new Date().toISOString() : null,
          ghl_sync_response: ghlSyncResult.success 
            ? { 
                contact_id: ghlSyncResult.contactId, 
                sync_type: ghlSyncResult.syncType || "auto_on_import",
                synced_at: new Date().toISOString(),
              }
            : ghlSyncResult.error 
              ? { 
                  error: ghlSyncResult.error, 
                  attempted_at: new Date().toISOString(),
                  sync_type: "auto_on_import_failed",
                }
              : null,
          metadata: {
            google_drive_file_id: file.id,
            mime_type: file.mimeType,
            match_method: match?.matchMethod || null,
            match_confidence: match?.confidence || null,
            confidence: match?.confidence || null,
            created_time: file.createdTime,
            modified_time: file.modifiedTime,
            auto_sync_attempted: match ? true : false,
            contact_email: contactEmail || null,
          },
        };

        const { error: insertError } = await supabase
          .from("meeting_documents")
          .insert(documentData)
          .select()
          .single();

        if (insertError) {
          console.error("Insert error details:", JSON.stringify(insertError));
          throw new Error(`Insert failed: ${insertError.message || insertError.code || JSON.stringify(insertError)}`);
        }

        // STEP 3: Update admin panel records with business name from GHL (if available)
        if (ghlSyncResult.success && ghlSyncResult.businessName && match) {
          const syncTimestamp = new Date().toISOString();
          
          if (match.meetingType === "demo" && contactEmail) {
            // Update ghl_submissions with business name from GHL
            const { data: existingSubmission } = await supabase
              .from("ghl_submissions")
              .select("id, ghl_response")
              .eq("id", match.meetingId)
              .single();
            
            if (existingSubmission) {
              const existingResponse = (existingSubmission.ghl_response as Record<string, unknown>) || {};
              const updatePayload = {
                ghl_response: {
                  ...existingResponse,
                  ghl_contact_id: ghlSyncResult.contactId || existingResponse.ghl_contact_id,
                  ghl_business_name: ghlSyncResult.businessName,
                  ghl_company_synced: true,
                  ghl_company_synced_at: syncTimestamp,
                  ghl_first_name: ghlSyncResult.firstName || existingResponse.ghl_first_name,
                  ghl_last_name: ghlSyncResult.lastName || existingResponse.ghl_last_name,
                  ghl_phone: ghlSyncResult.phone || existingResponse.ghl_phone,
                  last_synced_at: syncTimestamp,
                  synced_via: "transcript_upload",
                },
              };
              
              const { error: updateError } = await supabase
                .from("ghl_submissions")
                .update(updatePayload)
                .eq("id", match.meetingId);
              
              if (updateError) {
                console.warn(`[GHL-FIRST] Failed to update ghl_submissions with business name: ${updateError.message}`);
              } else {
                console.log(`[GHL-FIRST] Updated ghl_submissions with business name: ${ghlSyncResult.businessName}`);
              }
            }
            
            // Also update leads table if email matches
            const { data: existingLead } = await supabase
              .from("leads")
              .select("id, ghl_response")
              .ilike("email", contactEmail)
              .maybeSingle();
            
            if (existingLead) {
              const existingResponse = (existingLead.ghl_response as Record<string, unknown>) || {};
              const updatePayload = {
                ghl_response: {
                  ...existingResponse,
                  ghl_contact_id: ghlSyncResult.contactId || existingResponse.ghl_contact_id,
                  ghl_business_name: ghlSyncResult.businessName,
                  ghl_company_synced: true,
                  ghl_company_synced_at: syncTimestamp,
                  ghl_first_name: ghlSyncResult.firstName || existingResponse.ghl_first_name,
                  ghl_last_name: ghlSyncResult.lastName || existingResponse.ghl_last_name,
                  ghl_phone: ghlSyncResult.phone || existingResponse.ghl_phone,
                  last_synced_at: syncTimestamp,
                  synced_via: "transcript_upload",
                },
              };
              
              const { error: updateError } = await supabase
                .from("leads")
                .update(updatePayload)
                .eq("id", existingLead.id);
              
              if (!updateError) {
                console.log(`[GHL-FIRST] Updated leads table with business name: ${ghlSyncResult.businessName}`);
              }
            }
          } else if (match.meetingType === "investor" && contactEmail) {
            // Update investor_leads with business name from GHL
            const { data: investor } = await supabase
              .from("investor_leads")
              .select("id, firm_name")
              .ilike("email", contactEmail)
              .maybeSingle();
            
            // Only update if firm_name is empty (don't overwrite existing data)
            if (investor && !investor.firm_name) {
              const { error: updateError } = await supabase
                .from("investor_leads")
                .update({ firm_name: ghlSyncResult.businessName })
                .eq("id", investor.id);
              
              if (!updateError) {
                console.log(`[GHL-FIRST] Updated investor_leads with firm name: ${ghlSyncResult.businessName}`);
              }
            }
          }
        }

        processedFiles.push(file.name);
        const syncStatus = ghlSyncResult.success 
          ? `GHL synced${ghlSyncResult.businessName ? ` (Company: ${ghlSyncResult.businessName})` : ''}` 
          : (ghlSyncResult.error ? `GHL sync failed: ${ghlSyncResult.error}` : "no sync attempted");
        console.log(`Successfully processed: ${file.name} (${match ? `matched: ${match.matchMethod}` : "pending match"}, ${syncStatus})`)
      } catch (fileError) {
        const errorMessage = fileError instanceof Error ? fileError.message : String(fileError);
        console.error(`Error processing file ${file.name}:`, errorMessage);
        errors.push(`${file.name}: ${errorMessage}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${processedFiles.length} files`,
        processed: processedFiles,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Google Drive webhook error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
