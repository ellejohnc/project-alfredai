-- Create leads table to capture contact form and demo booking submissions
CREATE TABLE public.leads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    job_title TEXT,
    message TEXT,
    lead_type TEXT NOT NULL DEFAULT 'contact', -- 'contact' or 'demo_request'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (anyone can submit a lead form)
CREATE POLICY "Anyone can submit leads"
ON public.leads
FOR INSERT
WITH CHECK (true);

-- Only authenticated admins would read leads (for now, block all reads from frontend)
-- Leads would be accessed via Supabase dashboard or admin panel