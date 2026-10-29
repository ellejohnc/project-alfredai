-- Add ghl_response JSONB column to leads table for storing GHL-synced data
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS ghl_response JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.leads.ghl_response IS 'Stores GHL sync data including ghl_business_name, ghl_contact_id, ghl_company_synced, etc.';