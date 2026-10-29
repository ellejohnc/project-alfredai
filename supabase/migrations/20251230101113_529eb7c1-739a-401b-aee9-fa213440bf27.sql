-- Create event registrations table to track attendees and reminder status
CREATE TABLE public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.webinars_events(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(event_id, email)
);

-- Enable RLS
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to register for events
CREATE POLICY "Anyone can register for events"
ON public.event_registrations
FOR INSERT
WITH CHECK (true);

-- Only service role can view/update registrations (for the cron job)
CREATE POLICY "Only service role can view registrations"
ON public.event_registrations
FOR SELECT
USING (false);

CREATE POLICY "Only service role can update registrations"
ON public.event_registrations
FOR UPDATE
USING (false);

-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create index for efficient queries
CREATE INDEX idx_event_registrations_event_id ON public.event_registrations(event_id);
CREATE INDEX idx_event_registrations_reminder_sent ON public.event_registrations(reminder_sent_at) WHERE reminder_sent_at IS NULL;