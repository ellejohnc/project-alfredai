-- Allow flexible event types in meeting history (used across admin panels)
-- Previously a CHECK constraint blocked new event types like 'merged', 'restored', 'deleted', etc.
ALTER TABLE public.meeting_history
  DROP CONSTRAINT IF EXISTS meeting_history_event_type_check;