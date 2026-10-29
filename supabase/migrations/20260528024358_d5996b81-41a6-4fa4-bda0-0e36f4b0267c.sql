UPDATE public.quotes
SET current_tech_stack = (
  SELECT jsonb_agg(
    CASE WHEN item->>'name' = 'Logical (V6)'
      THEN jsonb_set(item, '{name}', '"Logikal"')
      ELSE item
    END
  )
  FROM jsonb_array_elements(current_tech_stack) AS item
)
WHERE quote_id = 'PV4-ABZQ-4PXPP';