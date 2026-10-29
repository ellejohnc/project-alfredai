-- Add is_featured column to guides_playbooks
ALTER TABLE public.guides_playbooks
ADD COLUMN is_featured boolean NOT NULL DEFAULT false;