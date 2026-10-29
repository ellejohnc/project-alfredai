-- Enable REPLICA IDENTITY FULL for realtime updates
ALTER TABLE public.admin_users REPLICA IDENTITY FULL;

-- Add admin_users to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_users;