import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface JobOpening {
  id: string;
  title: string;
  slug: string | null;
  department: string;
  location: string;
  employment_type: string;
  description: string | null;
  requirements: string | null;
  responsibilities: string | null;
  salary_range: string | null;
  is_remote: boolean;
  is_featured: boolean;
  application_url: string | null;
  sort_order: number;
  status: 'draft' | 'published' | 'archived';
  author_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useJobOpenings() {
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true);
        const { data, error: fetchError } = await supabase
          .from('job_openings')
          .select('*')
          .eq('status', 'published')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setJobs((data || []) as JobOpening[]);
      } catch (err) {
        console.error('Error fetching job openings:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  return { jobs, isLoading, error };
}

export function useFeaturedJobs() {
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data } = await supabase
          .from('job_openings')
          .select('*')
          .eq('status', 'published')
          .eq('is_featured', true)
          .order('sort_order', { ascending: true })
          .limit(4);

        setJobs((data || []) as JobOpening[]);
      } catch (err) {
        console.error('Error fetching featured jobs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  return { jobs, isLoading };
}
