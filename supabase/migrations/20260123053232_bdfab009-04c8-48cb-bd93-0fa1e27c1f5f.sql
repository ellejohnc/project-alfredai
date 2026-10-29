-- Update source check constraint to allow google_drive
ALTER TABLE public.meeting_documents 
DROP CONSTRAINT meeting_documents_source_check;

ALTER TABLE public.meeting_documents 
ADD CONSTRAINT meeting_documents_source_check 
CHECK (source IN ('manual', 'fathom', 'otter', 'google_drive'));