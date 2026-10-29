-- Add sentiment_analysis column to quotes table
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS sentiment_analysis jsonb;

-- Add sentiment_analysis column to quote_versions table for history tracking
ALTER TABLE public.quote_versions 
ADD COLUMN IF NOT EXISTS sentiment_analysis jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.quotes.sentiment_analysis IS 'Stores AI-extracted meeting sentiment: interestLevel, productFit, pricingSensitivity, recommendedPricingOption, pricingRationale';
COMMENT ON COLUMN public.quote_versions.sentiment_analysis IS 'Historical snapshot of sentiment analysis for version tracking';