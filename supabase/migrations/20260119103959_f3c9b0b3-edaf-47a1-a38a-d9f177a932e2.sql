-- Create quote_notes table for managed notes (separate from version history)
CREATE TABLE public.quote_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_quote_notes_quote_id ON public.quote_notes(quote_id);

-- Enable RLS
ALTER TABLE public.quote_notes ENABLE ROW LEVEL SECURITY;

-- Allow all users to manage notes (internal tool)
CREATE POLICY "Users can view quote notes" 
ON public.quote_notes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert quote notes" 
ON public.quote_notes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update quote notes" 
ON public.quote_notes 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete quote notes" 
ON public.quote_notes 
FOR DELETE 
USING (true);

-- Create function for updating timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_quote_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_quote_notes_updated_at
BEFORE UPDATE ON public.quote_notes
FOR EACH ROW
EXECUTE FUNCTION public.handle_quote_notes_updated_at();