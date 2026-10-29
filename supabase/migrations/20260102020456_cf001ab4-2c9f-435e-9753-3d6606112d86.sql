-- Create investor_bookings table to track Calendly meetings
CREATE TABLE public.investor_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investor_id UUID REFERENCES public.investor_leads(id) ON DELETE CASCADE,
  calendly_event_id TEXT UNIQUE,
  calendly_invitee_id TEXT,
  event_type TEXT,
  event_name TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'scheduled',
  location TEXT,
  cancellation_reason TEXT,
  rescheduled_from UUID REFERENCES public.investor_bookings(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investor_bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can view investor bookings"
ON public.investor_bookings
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage investor bookings"
ON public.investor_bookings
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Block public insert on investor_bookings"
ON public.investor_bookings
FOR INSERT
WITH CHECK (false);

-- Create updated_at trigger
CREATE TRIGGER update_investor_bookings_updated_at
BEFORE UPDATE ON public.investor_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_visitor_session_timestamp();

-- Add index for faster lookups
CREATE INDEX idx_investor_bookings_investor_id ON public.investor_bookings(investor_id);
CREATE INDEX idx_investor_bookings_status ON public.investor_bookings(status);
CREATE INDEX idx_investor_bookings_calendly_event ON public.investor_bookings(calendly_event_id);