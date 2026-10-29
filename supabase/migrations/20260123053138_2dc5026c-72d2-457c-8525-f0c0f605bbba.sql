-- Allow meeting_id to be nullable for pending document matching
ALTER TABLE public.meeting_documents 
ALTER COLUMN meeting_id DROP NOT NULL;