-- Add is_featured column to webinars_events table
ALTER TABLE public.webinars_events
ADD COLUMN is_featured boolean NOT NULL DEFAULT false;