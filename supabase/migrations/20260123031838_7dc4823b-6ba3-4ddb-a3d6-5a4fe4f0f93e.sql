-- Create meeting_documents table for storing transcript/recording metadata
CREATE TABLE public.meeting_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL,
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('demo', 'investor')),
  document_type TEXT NOT NULL CHECK (document_type IN ('transcript', 'recording', 'summary', 'notes')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type TEXT,
  source TEXT NOT NULL CHECK (source IN ('google_meet', 'fathom', 'otter', 'fireflies', 'manual_upload')),
  ghl_synced BOOLEAN DEFAULT false,
  ghl_sync_response JSONB,
  ghl_synced_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups by meeting
CREATE INDEX idx_meeting_documents_meeting_id ON public.meeting_documents(meeting_id);
CREATE INDEX idx_meeting_documents_meeting_type ON public.meeting_documents(meeting_type);
CREATE INDEX idx_meeting_documents_ghl_synced ON public.meeting_documents(ghl_synced);

-- Enable RLS
ALTER TABLE public.meeting_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only admins can manage meeting documents
CREATE POLICY "Admins can view meeting documents"
ON public.meeting_documents
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert meeting documents"
ON public.meeting_documents
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update meeting documents"
ON public.meeting_documents
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete meeting documents"
ON public.meeting_documents
FOR DELETE
USING (is_admin(auth.uid()));

-- Create updated_at trigger
CREATE TRIGGER update_meeting_documents_updated_at
BEFORE UPDATE ON public.meeting_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_visitor_session_timestamp();

-- Create storage bucket for meeting documents (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meeting-documents',
  'meeting-documents',
  false,
  52428800, -- 50MB limit
  ARRAY['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'audio/mpeg', 'audio/wav', 'audio/mp4', 'video/mp4', 'video/webm', 'application/json']
);

-- Storage policies for meeting-documents bucket
CREATE POLICY "Admins can upload meeting documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'meeting-documents' 
  AND is_admin(auth.uid())
);

CREATE POLICY "Admins can view meeting documents storage"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'meeting-documents' 
  AND is_admin(auth.uid())
);

CREATE POLICY "Admins can update meeting documents storage"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'meeting-documents' 
  AND is_admin(auth.uid())
);

CREATE POLICY "Admins can delete meeting documents storage"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'meeting-documents' 
  AND is_admin(auth.uid())
);