-- Add join_url column for live session links
ALTER TABLE public.webinars_events 
ADD COLUMN join_url TEXT;