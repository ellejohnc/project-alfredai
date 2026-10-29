import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { Loader2, Clock, Play, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import AccessDenied from '@/components/admin/AccessDenied';

interface ScheduledJob {
  jobid: number;
  schedule: string;
  command: string;
  nodename: string;
  nodeport: number;
  database: string;
  username: string;
  active: boolean;
  jobname: string;
}

interface JobRun {
  runid: number;
  jobid: number;
  job_pid: number;
  database: string;
  username: string;
  command: string;
  status: string;
  return_message: string | null;
  start_time: string;
  end_time: string | null;
}

export default function ScheduledJobsAdmin() {
  const { canManageScheduledJobs } = usePermissions();
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [jobRuns, setJobRuns] = useState<JobRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch scheduled jobs
      const { data: jobsData, error: jobsError } = await supabase
        .rpc('get_scheduled_jobs');

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError);
        toast.error('Failed to load scheduled jobs');
      } else {
        setJobs(jobsData || []);
      }

      // Fetch recent job runs
      const { data: runsData, error: runsError } = await supabase
        .rpc('get_job_run_details');

      if (runsError) {
        console.error('Error fetching job runs:', runsError);
      } else {
        setJobRuns(runsData || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load data');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchData();
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Guard AFTER the hooks — a return above a useEffect makes that effect run on
  // some renders and not others, and React throws when the permission resolves.
  if (!canManageScheduledJobs) {
    return <AccessDenied message="Only admins can view scheduled jobs." requiredRole="Admin or Super Admin" />;
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
    toast.success('Data refreshed');
  };

  const triggerJob = async (jobName: string) => {
    toast.info(`Triggering ${jobName}...`);
    
    try {
      // Call the edge function directly
      const { data, error } = await supabase.functions.invoke('process-event-reminders');
      
      if (error) throw error;
      
      toast.success(`Job executed: ${data?.message || 'Success'}`);
      await fetchData();
    } catch (error) {
      console.error('Error triggering job:', error);
      toast.error(`Failed to trigger job: ${error.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1">
            <CheckCircle className="h-3 w-3" />
            Success
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      case 'running':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Running
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            {status}
          </Badge>
        );
    }
  };

  const parseCronSchedule = (schedule: string) => {
    const parts = schedule.split(' ');
    if (parts.length !== 5) return schedule;
    
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    
    if (minute === '*' && hour === '*') return 'Every minute';
    if (minute === '0' && hour === '*') return 'Every hour';
    if (minute === '0' && hour === '0') return 'Daily at midnight';
    if (minute === '*/5') return 'Every 5 minutes';
    if (minute === '*/15') return 'Every 15 minutes';
    if (minute === '*/30') return 'Every 30 minutes';
    
    return schedule;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Scheduled Jobs</h2>
          <p className="text-muted-foreground">
            {jobs.length} scheduled job{jobs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          className="gap-2"
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Scheduled Jobs */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Active Schedules
          </h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-foreground">Job Name</TableHead>
              <TableHead className="text-foreground">Schedule</TableHead>
              <TableHead className="text-foreground">Status</TableHead>
              <TableHead className="text-foreground w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No scheduled jobs found
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.jobid} className="border-border">
                  <TableCell className="font-medium text-foreground">
                    {job.jobname || `Job #${job.jobid}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-foreground">{parseCronSchedule(job.schedule)}</span>
                      <span className="text-xs text-muted-foreground font-mono">{job.schedule}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {job.active ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {job.jobname?.includes('reminder') && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => triggerJob(job.jobname)}
                      >
                        <Play className="h-3 w-3" />
                        Run Now
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Recent Job Runs */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-primary" />
            Recent Executions
          </h3>
        </div>
        {jobRuns.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No job executions recorded yet
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {jobRuns.slice(0, 20).map((run) => (
              <AccordionItem key={run.runid} value={`run-${run.runid}`} className="border-border">
                <AccordionTrigger className="px-4 py-3 hover:bg-muted/50">
                  <div className="flex items-center gap-4 w-full pr-4">
                    <div className="flex-1 text-left">
                      <span className="font-medium text-foreground">Run #{run.runid}</span>
                      <span className="text-muted-foreground text-sm ml-2">
                        {run.start_time && formatDistanceToNow(new Date(run.start_time), { addSuffix: true })}
                      </span>
                    </div>
                    {getStatusBadge(run.status)}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-muted-foreground">Started:</span>
                        <p className="text-foreground">
                          {run.start_time && format(new Date(run.start_time), 'MMM d, yyyy h:mm:ss a')}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ended:</span>
                        <p className="text-foreground">
                          {run.end_time ? format(new Date(run.end_time), 'MMM d, yyyy h:mm:ss a') : 'In progress...'}
                        </p>
                      </div>
                    </div>
                    {run.return_message && (
                      <div>
                        <span className="text-muted-foreground">Message:</span>
                        <p className="text-foreground font-mono text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                          {run.return_message}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Command:</span>
                      <p className="text-foreground font-mono text-xs bg-muted p-2 rounded mt-1 overflow-x-auto whitespace-pre-wrap">
                        {run.command}
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}
