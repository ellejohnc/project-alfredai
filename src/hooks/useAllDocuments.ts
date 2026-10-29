import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { MeetingDocument } from './useMeetingDocuments';

export interface DocumentFilters {
  documentType?: string;
  source?: string;
  syncStatus?: 'all' | 'synced' | 'not_synced';
  searchQuery?: string;
}

export interface DocumentStats {
  total: number;
  transcripts: number;
  recordings: number;
  summaries: number;
  notes: number;
  synced: number;
  unmatched: number;
  geminiNotes: number;
}

export function useAllDocuments(filters: DocumentFilters = {}) {
  const [documents, setDocuments] = useState<MeetingDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DocumentStats>({
    total: 0,
    transcripts: 0,
    recordings: 0,
    summaries: 0,
    notes: 0,
    synced: 0,
    unmatched: 0,
    geminiNotes: 0,
  });

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('meeting_documents')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.documentType && filters.documentType !== 'all') {
        query = query.eq('document_type', filters.documentType);
      }

      if (filters.source && filters.source !== 'all') {
        query = query.eq('source', filters.source);
      }

      if (filters.syncStatus === 'synced') {
        query = query.eq('ghl_synced', true);
      } else if (filters.syncStatus === 'not_synced') {
        query = query.eq('ghl_synced', false);
      }

      if (filters.searchQuery) {
        query = query.ilike('file_name', `%${filters.searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const docs = (data || []) as unknown as MeetingDocument[];
      setDocuments(docs);

      // Calculate stats from all documents (before filtering)
      const { data: allDocs } = await supabase
        .from('meeting_documents')
        .select('document_type, ghl_synced, meeting_id, meeting_type, source');

      const all = allDocs || [];
      setStats({
        total: all.length,
        transcripts: all.filter(d => d.document_type === 'transcript').length,
        recordings: all.filter(d => d.document_type === 'recording').length,
        summaries: all.filter(d => d.document_type === 'summary').length,
        notes: all.filter(d => d.document_type === 'notes').length,
        synced: all.filter(d => d.ghl_synced).length,
        unmatched: all.filter(d => !d.meeting_id || d.meeting_type === 'pending_match').length,
        geminiNotes: all.filter(d => d.document_type === 'transcript' && d.source === 'google_drive').length,
      });
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [filters.documentType, filters.source, filters.syncStatus, filters.searchQuery]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

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

  const syncToGHL = async (documentId: string, contactEmail?: string): Promise<boolean> => {
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
    stats,
    isLoading,
    deleteDocument,
    syncToGHL,
    getSignedUrl,
    getDocumentContent,
    refetch: fetchDocuments,
  };
}
