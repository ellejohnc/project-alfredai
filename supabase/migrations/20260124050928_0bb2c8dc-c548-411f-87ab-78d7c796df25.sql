-- Create update_updated_at_column function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create job_openings table for careers page
CREATE TABLE public.job_openings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  employment_type TEXT DEFAULT 'Full-time',
  description TEXT,
  requirements TEXT,
  responsibilities TEXT,
  salary_range TEXT,
  is_remote BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  application_url TEXT,
  sort_order INTEGER DEFAULT 0,
  status public.content_status DEFAULT 'draft',
  author_id UUID,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_openings ENABLE ROW LEVEL SECURITY;

-- Public read access for published jobs
CREATE POLICY "Anyone can view published jobs"
  ON public.job_openings FOR SELECT
  USING (status = 'published');

-- Admin full access
CREATE POLICY "Admins can manage all jobs"
  ON public.job_openings FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Create updated_at trigger
CREATE TRIGGER update_job_openings_updated_at
  BEFORE UPDATE ON public.job_openings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();