-- Add presenter and video fields to webinars_events table
ALTER TABLE public.webinars_events
ADD COLUMN presenter_name text,
ADD COLUMN presenter_title text,
ADD COLUMN presenter_image_url text,
ADD COLUMN video_url text;