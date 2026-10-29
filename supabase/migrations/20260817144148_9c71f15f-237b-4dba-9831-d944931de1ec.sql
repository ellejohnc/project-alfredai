UPDATE public.quotes
SET status = 'won',
    outcome = 'won',
    signed_at = '2026-08-17T00:00:00+10:00',
    signed_by_name = 'Geoff Williams',
    updated_at = now()
WHERE quote_id = 'PEG-6H2N-9XKRT';