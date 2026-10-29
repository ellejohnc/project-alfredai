import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useBulkReplaceDriveImages() {
  const [isReplacing, setIsReplacing] = useState(false);

  const bulkReplace = async (postId: string): Promise<{ replacedCount: number } | null> => {
    setIsReplacing(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        toast.error('You must be logged in');
        return null;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/drive-images?action=bulk-replace`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ postId }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Failed to replace images');
        return null;
      }

      const result = await res.json();

      if (result.error) {
        if (result.error === 'no_google_connection') {
          toast.error('Google account not connected. Go to Connectors to connect.');
        } else {
          toast.error(result.error);
        }
        return null;
      }

      if (result.replacedCount === 0) {
        toast.info('No Google Drive images found in this post.');
      } else {
        toast.success(`${result.replacedCount} image${result.replacedCount > 1 ? 's' : ''} replaced and uploaded to storage!`);
      }

      return { replacedCount: result.replacedCount || 0 };
    } catch (err) {
      toast.error(`Bulk replace failed: ${err.message}. If this persists, email support.`);
      return null;
    } finally {
      setIsReplacing(false);
    }
  };

  return { bulkReplace, isReplacing };
}
