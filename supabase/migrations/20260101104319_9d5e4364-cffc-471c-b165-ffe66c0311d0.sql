-- Add phone number and social profile columns to investor_leads table
ALTER TABLE public.investor_leads
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS social_profile_url text,
ADD COLUMN IF NOT EXISTS verification_method text;