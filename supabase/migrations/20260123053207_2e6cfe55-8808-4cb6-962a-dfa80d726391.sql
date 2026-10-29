-- Update meeting_type check constraint to allow new types
ALTER TABLE public.meeting_documents 
DROP CONSTRAINT meeting_documents_meeting_type_check;

ALTER TABLE public.meeting_documents 
ADD CONSTRAINT meeting_documents_meeting_type_check 
CHECK (meeting_type IN ('demo', 'investor', 'investor_booking', 'ghl_submission', 'pending_match'));