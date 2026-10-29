-- Table to track all admin user activity
CREATE TABLE public.admin_page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  activity_type TEXT NOT NULL DEFAULT 'page_view',
  page_path TEXT,
  page_title TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for efficient querying
CREATE INDEX idx_admin_page_views_user_id ON public.admin_page_views(user_id);
CREATE INDEX idx_admin_page_views_created_at ON public.admin_page_views(created_at DESC);
CREATE INDEX idx_admin_page_views_activity_type ON public.admin_page_views(activity_type);

ALTER TABLE public.admin_page_views ENABLE ROW LEVEL SECURITY;

-- Super admins can view all activity
CREATE POLICY "Super admins can view all activity"
ON public.admin_page_views
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Admins can view their own activity
CREATE POLICY "Admins can view own activity"
ON public.admin_page_views
FOR SELECT
USING (is_admin(auth.uid()) AND user_id = auth.uid());

-- Authenticated admins can log their own activity
CREATE POLICY "Admins can log own activity"
ON public.admin_page_views
FOR INSERT
WITH CHECK (is_admin(auth.uid()) AND user_id = auth.uid());

-- Block updates
CREATE POLICY "Block updates on admin_page_views"
ON public.admin_page_views
FOR UPDATE
USING (false);

-- Block deletes
CREATE POLICY "Block deletes on admin_page_views"
ON public.admin_page_views
FOR DELETE
USING (false);

-- Export requests table
CREATE TABLE public.export_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requested_by UUID NOT NULL,
  requested_by_email TEXT NOT NULL,
  export_type TEXT NOT NULL,
  export_description TEXT,
  filters_applied JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_by_email TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_export_requests_status ON public.export_requests(status);
CREATE INDEX idx_export_requests_requested_by ON public.export_requests(requested_by);

ALTER TABLE public.export_requests ENABLE ROW LEVEL SECURITY;

-- Super admins can view all export requests
CREATE POLICY "Super admins can view all export requests"
ON public.export_requests
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Users can view their own export requests
CREATE POLICY "Users can view own export requests"
ON public.export_requests
FOR SELECT
USING (is_admin(auth.uid()) AND requested_by = auth.uid());

-- Authenticated admins can create export requests
CREATE POLICY "Admins can create export requests"
ON public.export_requests
FOR INSERT
WITH CHECK (is_admin(auth.uid()) AND requested_by = auth.uid());

-- Only super admins can update (approve/deny) export requests
CREATE POLICY "Super admins can update export requests"
ON public.export_requests
FOR UPDATE
USING (is_super_admin(auth.uid()));

-- Block deletes
CREATE POLICY "Block deletes on export_requests"
ON public.export_requests
FOR DELETE
USING (false);

-- Enable realtime for export requests so approvals appear instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.export_requests;