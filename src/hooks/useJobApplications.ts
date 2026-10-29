import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ApplicationStatus = 'new' | 'reviewing' | 'interviewed' | 'offered' | 'rejected' | 'hired';

export interface JobApplication {
  id: string;
  job_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  resume_url: string | null;
  cover_letter: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  status: ApplicationStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  is_general_application: boolean;
  areas_of_interest: string[] | null;
  // Joined data
  job_title?: string;
  job_department?: string;
}

export function useJobApplications() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('job_applications')
        .select(`
          *,
          job_openings (
            title,
            department
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const formattedData = (data || []).map((app: any) => ({
        ...app,
        job_title: app.is_general_application 
          ? 'General Application' 
          : (app.job_openings?.title || 'Unknown Position'),
        job_department: app.is_general_application 
          ? (app.areas_of_interest?.join(', ') || 'General')
          : (app.job_openings?.department || 'Unknown'),
      }));

      setApplications(formattedData);
    } catch (err) {
      console.error('Error fetching job applications:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const updateStatus = async (id: string, status: ApplicationStatus): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success(`Application status updated to ${status}`);
      await fetchApplications();
      return true;
    } catch (err) {
      console.error('Error updating application status:', err);
      toast.error('Failed to update application status');
      return false;
    }
  };

  const updateNotes = async (id: string, notes: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ notes, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Notes updated');
      await fetchApplications();
      return true;
    } catch (err) {
      console.error('Error updating notes:', err);
      toast.error('Failed to update notes');
      return false;
    }
  };

  const deleteApplication = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast.success('Application deleted');
      await fetchApplications();
      return true;
    } catch (err) {
      console.error('Error deleting application:', err);
      toast.error('Failed to delete application');
      return false;
    }
  };

  return {
    applications,
    isLoading,
    error,
    fetchApplications,
    updateStatus,
    updateNotes,
    deleteApplication,
  };
}
