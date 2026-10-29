// GoHighLevel Configuration
// This file contains the GHL location ID for building contact URLs
// Update this value with your actual GHL Location ID from GoHighLevel dashboard

// GHL Location ID - used for building contact detail URLs
// You can find this in your GoHighLevel account under Settings > Business Profile
export const GHL_LOCATION_ID = '0Mihjpq27y2HyrXxdfH3';

// Build GHL contact URL for opening in dashboard
export const getGHLContactUrl = (contactId: string) => {
  return `https://app.gohighlevel.com/v2/location/${GHL_LOCATION_ID}/contacts/detail/${contactId}`;
};

// Build GHL contact search URL
export const getGHLContactSearchUrl = (email: string) => {
  return `https://app.gohighlevel.com/v2/location/${GHL_LOCATION_ID}/contacts?search=${encodeURIComponent(email)}`;
};
