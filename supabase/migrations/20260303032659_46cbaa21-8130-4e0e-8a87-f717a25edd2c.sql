
-- Table to store per-user Google OAuth connections
CREATE TABLE public.user_google_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_email TEXT NOT NULL,
  google_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_google_connections ENABLE ROW LEVEL SECURITY;

-- Users can view their own connection
CREATE POLICY "Users can view own google connection"
ON public.user_google_connections
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own connection
CREATE POLICY "Users can insert own google connection"
ON public.user_google_connections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own connection
CREATE POLICY "Users can update own google connection"
ON public.user_google_connections
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own connection
CREATE POLICY "Users can delete own google connection"
ON public.user_google_connections
FOR DELETE
USING (auth.uid() = user_id);

-- Super admins can view all connections
CREATE POLICY "Super admins can view all google connections"
ON public.user_google_connections
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_user_google_connections_updated_at
BEFORE UPDATE ON public.user_google_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
