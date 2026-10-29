-- Ensure there's no public read access to event_registrations
-- The existing "Admins can view registrations" policy should be sufficient
-- but let's verify RLS is enabled and add an explicit block for non-admins

-- Create a function to fetch cron jobs (only for admins)
CREATE OR REPLACE FUNCTION public.get_scheduled_jobs()
RETURNS TABLE (
  jobid bigint,
  schedule text,
  command text,
  nodename text,
  nodeport integer,
  database text,
  username text,
  active boolean,
  jobname text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to see scheduled jobs
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    j.jobid,
    j.schedule,
    j.command,
    j.nodename,
    j.nodeport,
    j.database,
    j.username,
    j.active,
    j.jobname
  FROM cron.job j
  ORDER BY j.jobname;
END;
$$;

-- Create a function to get recent job run details
CREATE OR REPLACE FUNCTION public.get_job_run_details(job_name text DEFAULT NULL)
RETURNS TABLE (
  runid bigint,
  jobid bigint,
  job_pid integer,
  database text,
  username text,
  command text,
  status text,
  return_message text,
  start_time timestamp with time zone,
  end_time timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to see job run details
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    d.runid,
    d.jobid,
    d.job_pid,
    d.database,
    d.username,
    d.command,
    d.status,
    d.return_message,
    d.start_time,
    d.end_time
  FROM cron.job_run_details d
  WHERE (job_name IS NULL OR EXISTS (
    SELECT 1 FROM cron.job j WHERE j.jobid = d.jobid AND j.jobname = job_name
  ))
  ORDER BY d.start_time DESC
  LIMIT 50;
END;
$$;