-- Remove public SELECT access on quotes table
-- All proposal access now goes through the verify-proposal-access edge function
DROP POLICY IF EXISTS "Allow public select for quotes" ON public.quotes;