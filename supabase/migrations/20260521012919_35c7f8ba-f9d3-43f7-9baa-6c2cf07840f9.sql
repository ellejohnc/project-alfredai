UPDATE public.quotes
SET
  monthly_retainer_min = 1750,
  monthly_retainer_max = 2500,
  monthly_retainer_final = 2250,
  bundle_pricing = true,
  updated_at = now()
WHERE quote_id = 'FYK-BMML-S6Q47';