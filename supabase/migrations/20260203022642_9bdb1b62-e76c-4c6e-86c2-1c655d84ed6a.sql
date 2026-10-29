-- Add meeting_category to ghl_submissions for categorizing Discovery vs Solution meetings
ALTER TABLE public.ghl_submissions 
ADD COLUMN IF NOT EXISTS meeting_category text;

-- Add check constraint for valid categories
ALTER TABLE public.ghl_submissions
ADD CONSTRAINT ghl_submissions_meeting_category_check 
CHECK (meeting_category IS NULL OR meeting_category IN ('discovery', 'solution'));

-- Create index for filtering by category
CREATE INDEX IF NOT EXISTS idx_ghl_submissions_meeting_category 
ON public.ghl_submissions(meeting_category) 
WHERE meeting_category IS NOT NULL;

-- Update meeting_documents to include meeting_category for storage organization
ALTER TABLE public.meeting_documents 
ADD COLUMN IF NOT EXISTS meeting_category text;

-- Add check constraint for valid categories
ALTER TABLE public.meeting_documents
ADD CONSTRAINT meeting_documents_meeting_category_check 
CHECK (meeting_category IS NULL OR meeting_category IN ('discovery', 'solution'));

-- Create index for filtering documents by category
CREATE INDEX IF NOT EXISTS idx_meeting_documents_category 
ON public.meeting_documents(meeting_category) 
WHERE meeting_category IS NOT NULL;