import { useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { toast } from 'sonner';

export function useExportRequest() {
  const { user } = useAdminAuth();
  const { isSuperAdmin } = usePermissions();
  const { logActivity } = useActivityTracker();
  const queryClient = useQueryClient();

  // Check if a specific export has been approved for current user
  const checkExportApproval = useCallback(
    async (exportType: string): Promise<{ approved: boolean; requestId?: string }> => {
      if (isSuperAdmin) return { approved: true };

      const { data } = await supabase
        .from('export_requests')
        .select('id, status')
        .eq('requested_by', user?.id || '')
        .eq('export_type', exportType)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1);

      if (data?.length) return { approved: true, requestId: data[0].id };
      return { approved: false };
    },
    [user?.id, isSuperAdmin]
  );

  // Submit an export request
  const submitExportRequest = useMutation({
    mutationFn: async ({ exportType, description, filters }: { exportType: string; description?: string; filters?: Record<string, Json> }) => {
      if (!user?.id || !user?.email) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('export_requests')
        .insert([{
          requested_by: user.id,
          requested_by_email: user.email,
          export_type: exportType,
          export_description: description,
          filters_applied: filters || {},
        }])
        .select()
        .single();

      if (error) throw error;

      // Log the export request activity
      await logActivity('export_request', { export_type: exportType, request_id: data.id });

      return data;
    },
    onSuccess: () => {
      toast.success('Export request submitted! Waiting for Super Admin approval.');
      queryClient.invalidateQueries({ queryKey: ['export-requests'] });
    },
    onError: (err) => {
      toast.error('Failed to submit request: ' + (err as Error).message);
    },
  });

  // Wrapper function: either export directly (super admin) or request approval
  const requestExport = useCallback(
    async (exportType: string, description?: string, filters?: Record<string, Json>): Promise<boolean> => {
      if (isSuperAdmin) {
        await logActivity('export_request', { export_type: exportType, auto_approved: true });
        return true;
      }

      // Check if already approved
      const { approved } = await checkExportApproval(exportType);
      if (approved) return true;

      // Submit request
      submitExportRequest.mutate({ exportType, description, filters });
      return false;
    },
    [isSuperAdmin, checkExportApproval, submitExportRequest, logActivity]
  );

  return {
    requestExport,
    submitExportRequest,
    checkExportApproval,
    isPending: submitExportRequest.isPending,
  };
}
