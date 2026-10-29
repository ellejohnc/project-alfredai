import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MeetingDocument {
  id: string;
  meeting_id: string | null;
  // DB column is a string and historically contains values like
  // 'demo', 'investor', 'pending_match', 'ghl_submission', etc.
  // We intentionally keep this broad to avoid hiding linked docs.
  meeting_type: string;
  document_type: 'transcript' | 'recording' | 'summary' | 'notes';
  file_name: string;
  file_url: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  source: string;
  ghl_synced: boolean;
  ghl_synced_at: string | null;
  ghl_sync_response: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface UploadDocumentParams {
  meeting_id: string;
  meeting_type: 'demo' | 'investor';
  meeting_category?: 'discovery' | 'solution';
  document_type: 'transcript' | 'recording' | 'summary' | 'notes';
  source: 'google_meet' | 'fathom' | 'otter' | 'fireflies' | 'manual_upload';
  file: File;
  metadata?: Record<string, unknown>;
}

export function useMeetingDocuments(meetingId: string | null, meetingType: 'demo' | 'investor' | 'discovery' | 'solution' | 'personal' | null) {
  const [documents, setDocuments] = useState<MeetingDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [hasTypeMismatch, setHasTypeMismatch] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!meetingId) {
      setDocuments([]);
      return;
    }

    setIsLoading(true);
    try {
      // IMPORTANT:
      // We query by meeting_id only to avoid hiding documents that were linked
      // while their meeting_type remained 'pending_match' / 'ghl_submission'.
      const { data, error } = await supabase
        .from('meeting_documents')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion since we know the structure
      const next = (data || []) as unknown as MeetingDocument[];
      setDocuments(next);

      // UI hint: if we received rows but none match the current meetingType,
      // it's a signal that older linkage wrote a non-standard meeting_type.
      if (meetingType && next.length > 0) {
        setHasTypeMismatch(!next.some((d) => d.meeting_type === meetingType));
      } else {
        setHasTypeMismatch(false);
      }
    } catch (error) {
      console.error('Error fetching meeting documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [meetingId, meetingType]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadDocument = async (params: UploadDocumentParams): Promise<boolean> => {
    setIsUploading(true);
    try {
      const { meeting_id, meeting_type, meeting_category, document_type, source, file, metadata } = params;

      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to upload documents');
        return false;
      }

      const response = await supabase.functions.invoke('upload-meeting-document', {
        body: {
          meeting_id,
          meeting_type,
          meeting_category,
          document_type,
          source,
          file_name: file.name,
          file_base64: base64,
          mime_type: file.type || 'application/octet-stream',
          metadata,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Upload failed');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Upload failed');
      }

      toast.success('Document uploaded successfully');
      await fetchDocuments();
      return true;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload document');
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const syncToGHL = async (documentId: string, contactEmail?: string): Promise<boolean> => {
    setIsSyncing(documentId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to sync documents');
        return false;
      }

      const response = await supabase.functions.invoke('sync-document-to-ghl', {
        body: {
          document_id: documentId,
          contact_email: contactEmail,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Sync failed');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Sync failed');
      }

      toast.success('Document synced to GHL successfully');
      await fetchDocuments();
      return true;
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sync to GHL');
      return false;
    } finally {
      setIsSyncing(null);
    }
  };

  const deleteDocument = async (documentId: string): Promise<boolean> => {
    try {
      const doc = documents.find(d => d.id === documentId);
      if (!doc) return false;

      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from('meeting-documents')
        .remove([doc.file_url]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('meeting_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;

      toast.success('Document deleted');
      await fetchDocuments();
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
      return false;
    }
  };

  const getSignedUrl = async (storagePath: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('meeting-documents')
        .createSignedUrl(storagePath, 60 * 60); // 1 hour

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  };

  const getDocumentContent = async (document: MeetingDocument): Promise<string | null> => {
    // Only fetch content for text-based documents
    if (!document.mime_type?.startsWith('text/') && document.mime_type !== 'application/json') {
      return null;
    }

    try {
      const { data, error } = await supabase.storage
        .from('meeting-documents')
        .download(document.file_url);

      if (error) throw error;
      return await data.text();
    } catch (error) {
      console.error('Error fetching document content:', error);
      return null;
    }
  };

  return {
    documents,
    isLoading,
    isUploading,
    isSyncing,
    hasTypeMismatch,
    uploadDocument,
    syncToGHL,
    deleteDocument,
    getSignedUrl,
    getDocumentContent,
    refetch: fetchDocuments,
  };
}
