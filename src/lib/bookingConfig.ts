/**
 * Centralized configuration for booking and meeting scheduling
 * Uses GoHighLevel (GHL) widget for all booking experiences
 */

/**
 * The one address every "Book a demo" control sends people to: the booking
 * page on the primary domain. Relative "/book" would stay on whatever host the
 * page is opened from (a preview host, a published alias), so the address is
 * absolute — one calendar, one place, however the site is reached.
 */
export const BOOKING_PAGE_URL = "https://new.alfredai.bot/book";

export interface LeadSourceData {
  source?: string;      // Always "website"
  medium?: string;      // "chatbot", "form", "booking_modal", "personalization_flow"
  campaign?: string;    // "contact_form", "demo_request", "signup_flow", etc.
  content?: string;     // Additional context like page path or industry
}

export const BOOKING_CONFIG = {
  // GHL Calendar Widget URL
  ghlWidgetUrl: "https://api.leadconnectorhq.com/widget/booking/UzsgmkS3VDB4iavKB8Dx",
  ghlWidgetId: "UzsgmkS3VDB4iavKB8Dx",
  
  // GHL form embed script URL
  ghlFormEmbedScript: "https://link.msgsndr.com/js/form_embed.js",
  
  // GHL Webhook URL for contact pre-creation (optional - set via VITE_GHL_WEBHOOK_URL env var)
  // If not configured, the calendar will load without pre-creation
  get ghlWebhookUrl(): string | null {
    const envUrl = import.meta.env.VITE_GHL_WEBHOOK_URL;
    if (envUrl && !envUrl.includes('PLACEHOLDER')) {
      return envUrl;
    }
    return null;
  },

  /**
   * Check if contact pre-creation is configured and available
   */
  isPreCreationEnabled(): boolean {
    return Boolean(this.ghlWebhookUrl);
  },

  /**
   * Pre-create a contact in GHL before showing the calendar
   * This allows the calendar to look up the contact by email and auto-fill fields
   * Returns: { success: boolean, skipped: boolean, error?: string }
   */
  async preCreateContact(leadData?: {
    name?: string;
    email?: string;
    company?: string;
    phone?: string;
  }): Promise<{ success: boolean; skipped: boolean; error?: string }> {
    // Skip if webhook not configured
    if (!this.ghlWebhookUrl) {
      console.log('ℹ️ GHL webhook not configured - skipping contact pre-creation');
      return { success: false, skipped: true };
    }

    if (!leadData?.email) {
      console.warn('⚠️ No email - skipping GHL contact pre-creation');
      return { success: false, skipped: true };
    }

    try {
      const nameParts = leadData.name?.trim().split(/\s+/) || [];
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || firstName;
      const cleanPhone = leadData.phone?.replace(/[\s\-()]/g, "") || "";

      console.log('🔄 Pre-creating GHL contact...', {
        email: leadData.email,
        firstName,
        lastName,
        phone: cleanPhone,
        company: leadData.company
      });

      const response = await fetch(this.ghlWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: leadData.email,
          firstName,
          lastName,
          phone: cleanPhone,
          companyName: leadData.company,
          source: 'website_booking',
          tags: ['website-lead', 'calendar-booking']
        })
      });

      if (!response.ok) {
        console.warn('⚠️ GHL contact creation failed:', response.status, '- calendar will load anyway');
        return { success: false, skipped: false, error: `HTTP ${response.status}` };
      }

      console.log('✅ GHL contact pre-created successfully');
      return { success: true, skipped: false };
    } catch (error) {
      console.warn('⚠️ Error pre-creating GHL contact:', error, '- calendar will load anyway');
      return { success: false, skipped: false, error: String(error) };
    }
  },
  
  /**
   * Generate a GHL widget URL with all lead data as URL parameters
   * Uses exact GHL form field names discovered from widget inspection
   */
  getWidgetUrl: (
    leadData?: { 
      name?: string; 
      email?: string; 
      company?: string;
      phone?: string;
    },
    sourceData?: LeadSourceData
  ) => {
    const baseUrl = BOOKING_CONFIG.ghlWidgetUrl;
    const params = new URLSearchParams();
    
    // Split name into first and last
    if (leadData?.name) {
      const nameParts = leadData.name.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || firstName;

      // Exact GHL field names from form inspection
      if (firstName) {
        params.append("first_name", firstName);
      }
      if (lastName) {
        params.append("last_name", lastName);
      }
    }

    // Email - exact field name
    if (leadData?.email) {
      params.append("email", leadData.email);
    }

    // Phone - exact field name with cleaned format
    if (leadData?.phone) {
      const cleanPhone = leadData.phone.replace(/[\s\-()]/g, "");
      params.append("phone", cleanPhone);
    }

    // Business Website - use exact custom field ID from GHL form
    // Field ID: Lkd4j00rQ7uEZo8yaJxR (maps to data-q="business_website")
    if (leadData?.company) {
      params.append("Lkd4j00rQ7uEZo8yaJxR", leadData.company);
      params.append("business_website", leadData.company);
    }
    
    // UTM tracking
    params.append("utm_source", sourceData?.source || "website");
    if (sourceData?.medium) params.append("utm_medium", sourceData.medium);
    if (sourceData?.campaign) params.append("utm_campaign", sourceData.campaign);
    if (sourceData?.content) params.append("utm_content", sourceData.content);
    
    // Cache buster
    params.append("_t", Date.now().toString());
    
    const fullUrl = `${baseUrl}?${params.toString()}`;
    
    console.log("🔗 GHL Booking Widget URL:", fullUrl);
    
    return fullUrl;
  },
};
