-- Drop the existing constraint
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS check_status;

-- Recreate with 'signed' included
ALTER TABLE quotes ADD CONSTRAINT check_status 
CHECK (status = ANY (ARRAY['draft', 'sent', 'signed', 'won', 'lost', 'expired']));