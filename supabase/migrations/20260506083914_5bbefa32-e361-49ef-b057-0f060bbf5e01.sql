UPDATE public.quotes
SET current_tech_stack = (
  SELECT jsonb_agg(
    CASE WHEN item->>'name' = 'Logical'
      THEN jsonb_set(item, '{name}', '"Logikal"')
      ELSE item END
  )
  FROM jsonb_array_elements(current_tech_stack::jsonb) item
)
WHERE access_code = '519769';