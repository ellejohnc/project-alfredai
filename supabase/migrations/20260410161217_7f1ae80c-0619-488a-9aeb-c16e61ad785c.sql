CREATE TABLE public.proposal_pdf_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id TEXT NOT NULL,
  downloaded_by TEXT,
  downloaded_by_email TEXT,
  downloaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

ALTER TABLE public.proposal_pdf_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pdf downloads"
ON public.proposal_pdf_downloads
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert pdf downloads"
ON public.proposal_pdf_downloads
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE INDEX idx_pdf_downloads_quote_id ON public.proposal_pdf_downloads (quote_id);
CREATE INDEX idx_pdf_downloads_downloaded_at ON public.proposal_pdf_downloads (downloaded_at DESC);