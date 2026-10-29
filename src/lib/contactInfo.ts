import { SUPPORT_EMAIL, ENQUIRY_EMAIL, PRODUCTION_DOMAIN } from './siteConfig';

// Centralized contact information for alfred ai
export const CONTACT_INFO = {
  email: {
    general: ENQUIRY_EMAIL,
    support: SUPPORT_EMAIL,
    press: `press@${PRODUCTION_DOMAIN}`,
  },
  phone: "+61 02 5759 8881",
  phoneHref: "tel:+610257598881",
  phoneNote: "Operated by AI • Mon-Fri, 9am-6pm AEST",
  location: {
    full: "Level 35, International Tower One, Barangaroo NSW 2000",
    short: "International Tower One, Barangaroo, Sydney",
    street: "Level 35, International Tower One",
    city: "Barangaroo NSW 2000",
    country: "Australia",
    note: "By Appointment Only",
    mapsUrl: "https://maps.apple.com/?address=Level%2035,%20International%20Tower%20One,%20Barangaroo%20NSW%202000,%20Australia&ll=-33.8651,151.2023&q=International%20Tower%20One",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Level+35+International+Tower+One+Barangaroo+NSW+2000+Australia",
  },
  social: {
    linkedin: "https://www.linkedin.com/company/alfred-ai-transformation/",
    youtube: "https://www.youtube.com/@alfred ai-agent",
    instagram: "https://www.instagram.com/alfredai.bot/",
    tiktok: "https://www.tiktok.com/@alfredaiservices",
  },
  serviceRegions: [
    { name: "Australia", code: "AU" },
    { name: "New Zealand", code: "NZ" },
    { name: "Singapore", code: "SG" },
    { name: "Malaysia", code: "MY" },
    { name: "Indonesia", code: "ID" },
    { name: "UK", code: "UK" },
    { name: "KSA (Saudi Arabia)", code: "SA" },
    { name: "Dubai (UAE)", code: "AE" },
  ],
} as const;
