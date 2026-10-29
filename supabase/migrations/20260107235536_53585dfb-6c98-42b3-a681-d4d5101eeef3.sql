-- Create meeting_history table for tracking all meeting status changes and notes
CREATE TABLE public.meeting_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL,
  meeting_type text NOT NULL CHECK (meeting_type IN ('demo', 'investor')),
  previous_status text,
  new_status text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('created', 'confirmed', 'cancelled', 'rescheduled', 'no_show', 'completed', 'note_added', 'updated')),
  notes text,
  appointment_id text,
  created_by uuid,
  webhook_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_meeting_history_meeting_id ON public.meeting_history(meeting_id);
CREATE INDEX idx_meeting_history_appointment_id ON public.meeting_history(appointment_id);
CREATE INDEX idx_meeting_history_created_at ON public.meeting_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.meeting_history ENABLE ROW LEVEL SECURITY;

-- Admins can view all history
CREATE POLICY "Admins can view meeting history"
  ON public.meeting_history FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can insert history (for notes)
CREATE POLICY "Admins can insert meeting history"
  ON public.meeting_history FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Service role can insert (for webhook)
CREATE POLICY "Service role can insert meeting history"
  ON public.meeting_history FOR INSERT
  WITH CHECK (true);

-- Block updates and deletes (history is immutable)
CREATE POLICY "Block updates on meeting_history"
  ON public.meeting_history FOR UPDATE
  USING (false);

CREATE POLICY "Block deletes on meeting_history"
  ON public.meeting_history FOR DELETE
  USING (false);