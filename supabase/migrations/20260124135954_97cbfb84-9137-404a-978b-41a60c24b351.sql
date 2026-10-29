-- Add fields to support general/spontaneous applications
ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS is_general_application BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS areas_of_interest TEXT[];

-- Add comment for clarity
COMMENT ON COLUMN public.job_applications.is_general_application IS 'True when application is not for a specific job opening';
COMMENT ON COLUMN public.job_applications.areas_of_interest IS 'Array of department/area interests for general applications';