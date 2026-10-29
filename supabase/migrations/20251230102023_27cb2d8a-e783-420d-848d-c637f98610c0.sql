-- Add show_registration column to control whether registration button appears
ALTER TABLE public.webinars_events 
ADD COLUMN show_registration BOOLEAN NOT NULL DEFAULT true;