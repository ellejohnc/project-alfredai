-- Add video_url and is_featured to testimonials table
ALTER TABLE public.testimonials
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;