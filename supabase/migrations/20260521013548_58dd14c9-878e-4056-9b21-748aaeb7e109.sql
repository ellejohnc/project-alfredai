UPDATE public.quotes
SET monthly_retainer_final = 2750,
    monthly_retainer_min = 2250,
    monthly_retainer_max = 3250,
    bundle_pricing = true,
    updated_at = now()
WHERE quote_id = 'VQE-XY9N-EQL8K';