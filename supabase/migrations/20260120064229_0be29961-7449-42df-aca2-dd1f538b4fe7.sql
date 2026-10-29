-- Create email suppression list for bounced/unsubscribed addresses
CREATE TABLE IF NOT EXISTS public.email_suppressions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('hard_bounce', 'soft_bounce', 'spam_complaint', 'unsubscribe', 'manual')),
  source_log_id UUID REFERENCES public.email_logs(id),
  bounce_type TEXT,
  bounce_message TEXT,
  suppressed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL = permanent, soft bounces can expire
  created_by TEXT,
  UNIQUE(email)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_email_suppressions_email ON public.email_suppressions(email);
CREATE INDEX IF NOT EXISTS idx_email_suppressions_reason ON public.email_suppressions(reason);

-- Enable RLS
ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies
CREATE POLICY "Admins can view suppressions" ON public.email_suppressions
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage suppressions" ON public.email_suppressions
  FOR ALL USING (public.is_admin(auth.uid()));

-- Create function to check if email is suppressed
CREATE OR REPLACE FUNCTION public.is_email_suppressed(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.email_suppressions 
    WHERE email = LOWER(check_email)
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$;

-- Create function to add email to suppression list
CREATE OR REPLACE FUNCTION public.suppress_email(
  p_email TEXT,
  p_reason TEXT,
  p_source_log_id UUID DEFAULT NULL,
  p_bounce_type TEXT DEFAULT NULL,
  p_bounce_message TEXT DEFAULT NULL,
  p_expires_days INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate expiration for soft bounces (default 7 days)
  IF p_reason = 'soft_bounce' AND p_expires_days IS NULL THEN
    v_expires_at := NOW() + INTERVAL '7 days';
  ELSIF p_expires_days IS NOT NULL THEN
    v_expires_at := NOW() + (p_expires_days || ' days')::INTERVAL;
  END IF;

  INSERT INTO public.email_suppressions (
    email, reason, source_log_id, bounce_type, bounce_message, expires_at
  ) VALUES (
    LOWER(p_email), p_reason, p_source_log_id, p_bounce_type, p_bounce_message, v_expires_at
  )
  ON CONFLICT (email) DO UPDATE SET
    reason = EXCLUDED.reason,
    source_log_id = EXCLUDED.source_log_id,
    bounce_type = EXCLUDED.bounce_type,
    bounce_message = EXCLUDED.bounce_message,
    suppressed_at = NOW(),
    expires_at = EXCLUDED.expires_at
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Create email tracking tokens table
CREATE TABLE IF NOT EXISTS public.email_tracking_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  log_id UUID NOT NULL REFERENCES public.email_logs(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  tracking_type TEXT NOT NULL CHECK (tracking_type IN ('open', 'click')),
  target_url TEXT, -- For click tracking, the destination URL
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  first_triggered_at TIMESTAMP WITH TIME ZONE,
  trigger_count INTEGER DEFAULT 0
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_tracking_token ON public.email_tracking_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_tracking_log_id ON public.email_tracking_tokens(log_id);

-- Enable RLS
ALTER TABLE public.email_tracking_tokens ENABLE ROW LEVEL SECURITY;

-- Public read for tracking (needed for pixel/click handler)
CREATE POLICY "Allow public token lookup" ON public.email_tracking_tokens
  FOR SELECT USING (true);

-- Admin manage policy
CREATE POLICY "Admins can manage tracking" ON public.email_tracking_tokens
  FOR ALL USING (public.is_admin(auth.uid()));

-- Function to generate tracking token
CREATE OR REPLACE FUNCTION public.generate_tracking_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$;

-- Function to create tracking tokens for an email log
CREATE OR REPLACE FUNCTION public.create_email_tracking(
  p_log_id UUID,
  p_links TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS TABLE(open_token TEXT, click_tokens JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_open_token TEXT;
  v_click_tokens JSONB := '{}'::JSONB;
  v_link TEXT;
  v_token TEXT;
BEGIN
  -- Create open tracking token
  v_open_token := generate_tracking_token();
  INSERT INTO public.email_tracking_tokens (log_id, token, tracking_type)
  VALUES (p_log_id, v_open_token, 'open');
  
  -- Create click tracking tokens for each link
  FOREACH v_link IN ARRAY p_links LOOP
    v_token := generate_tracking_token();
    INSERT INTO public.email_tracking_tokens (log_id, token, tracking_type, target_url)
    VALUES (p_log_id, v_token, 'click', v_link);
    v_click_tokens := v_click_tokens || jsonb_build_object(v_link, v_token);
  END LOOP;
  
  RETURN QUERY SELECT v_open_token, v_click_tokens;
END;
$$;