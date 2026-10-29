-- Fix security: Restrict event_registrations INSERT to require email validation
-- The current policy allows anyone to insert, which could be abused for spam

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Anyone can register for events" ON public.event_registrations;

-- Create a more restrictive INSERT policy that still allows public registration
-- but requires valid email format via a check constraint
ALTER TABLE public.event_registrations DROP CONSTRAINT IF EXISTS valid_email_format;
ALTER TABLE public.event_registrations ADD CONSTRAINT valid_email_format 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Also ensure name is not empty if provided
ALTER TABLE public.event_registrations DROP CONSTRAINT IF EXISTS valid_name_if_provided;
ALTER TABLE public.event_registrations ADD CONSTRAINT valid_name_if_provided 
  CHECK (name IS NULL OR length(trim(name)) >= 2);

-- Recreate the INSERT policy - still public but with database-level validation
CREATE POLICY "Anyone can register for events" 
ON public.event_registrations 
FOR INSERT 
WITH CHECK (true);