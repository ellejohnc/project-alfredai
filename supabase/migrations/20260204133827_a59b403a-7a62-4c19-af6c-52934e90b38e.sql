-- Create partner chat sessions table
CREATE TABLE public.partner_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_type TEXT NOT NULL,
  lead_email TEXT NOT NULL,
  lead_name TEXT NOT NULL,
  lead_company TEXT,
  session_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  ip_hash TEXT,
  device_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create partner chat messages table
CREATE TABLE public.partner_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.partner_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_partner_chat_sessions_partner_type ON public.partner_chat_sessions(partner_type);
CREATE INDEX idx_partner_chat_sessions_lead_email ON public.partner_chat_sessions(lead_email);
CREATE INDEX idx_partner_chat_sessions_created_at ON public.partner_chat_sessions(created_at DESC);
CREATE INDEX idx_partner_chat_messages_session_id ON public.partner_chat_messages(session_id);
CREATE INDEX idx_partner_chat_messages_created_at ON public.partner_chat_messages(created_at);

-- Enable RLS
ALTER TABLE public.partner_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for partner_chat_sessions
CREATE POLICY "Anyone can insert partner chat sessions"
ON public.partner_chat_sessions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view partner chat sessions"
ON public.partner_chat_sessions
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete partner chat sessions"
ON public.partner_chat_sessions
FOR DELETE
USING (is_admin(auth.uid()));

CREATE POLICY "Service role can update partner chat sessions"
ON public.partner_chat_sessions
FOR UPDATE
USING (true)
WITH CHECK (true);

-- RLS Policies for partner_chat_messages
CREATE POLICY "Anyone can insert partner chat messages"
ON public.partner_chat_messages
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view partner chat messages"
ON public.partner_chat_messages
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete partner chat messages"
ON public.partner_chat_messages
FOR DELETE
USING (is_admin(auth.uid()));

-- Block updates on messages (immutable)
CREATE POLICY "Block updates on partner chat messages"
ON public.partner_chat_messages
FOR UPDATE
USING (false);