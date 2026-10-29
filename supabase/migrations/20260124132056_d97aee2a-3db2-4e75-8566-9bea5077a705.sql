-- Create job_applications table
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.job_openings(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  resume_url TEXT,
  cover_letter TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'interviewed', 'offered', 'rejected', 'hired')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit applications
CREATE POLICY "Anyone can submit job applications"
  ON public.job_applications FOR INSERT
  WITH CHECK (true);

-- Only admins can view applications
CREATE POLICY "Admins can view job applications"
  ON public.job_applications FOR SELECT
  USING (is_admin(auth.uid()));

-- Only admins can update applications
CREATE POLICY "Admins can update job applications"
  ON public.job_applications FOR UPDATE
  USING (is_admin(auth.uid()));

-- Only admins can delete applications
CREATE POLICY "Admins can delete job applications"
  ON public.job_applications FOR DELETE
  USING (is_admin(auth.uid()));

-- Create updated_at trigger
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for resumes bucket
CREATE POLICY "Anyone can upload resumes"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Admins can view resumes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'resumes' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete resumes"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'resumes' AND is_admin(auth.uid()));