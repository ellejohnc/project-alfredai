-- Enable realtime for meeting_history table (for webhook status updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_history;

-- Enable realtime for investor_bookings table (already subscribed, ensuring it's enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE public.investor_bookings;