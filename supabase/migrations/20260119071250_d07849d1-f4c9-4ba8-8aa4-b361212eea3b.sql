-- Add quote_id column to quotes table
ALTER TABLE public.quotes 
ADD COLUMN quote_id text UNIQUE;

-- Create index for faster lookups
CREATE INDEX idx_quotes_quote_id ON public.quotes(quote_id);