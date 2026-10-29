import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RecordHistoryEntry {
  id: string;
  meeting_id: string;
  previous_status: string | null;
  new_status: string;
  event_type: string;
  notes: string | null;
  appointment_id: string | null;
  created_by: string | null;
  created_at: string;
  meeting_type: string;
}

interface UseRecordHistoryProps {
  recordId: string | null;
  recordType: 'meeting' | 'lead_booked' | 'lead' | 'ghl_submission';
  userId?: string;
}

export function useRecordHistory({ recordId, recordType, userId }: UseRecordHistoryProps) {
  const [history, setHistory] = useState<RecordHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Fetch history for a record
  const fetchHistory = async () => {
    if (!recordId) {
      setHistory([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('meeting_history')
        .select('*')
        .eq('meeting_id', recordId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add note to history
  const addNote = async (currentStatus: string | null) => {
    if (!recordId || !newNote.trim()) return;

    setIsAddingNote(true);
    try {
      const { error } = await supabase.from('meeting_history').insert({
        meeting_id: recordId,
        meeting_type: recordType,
        previous_status: currentStatus,
        new_status: currentStatus || 'unknown',
        event_type: 'note_added',
        notes: newNote.trim(),
        created_by: userId,
      });

      if (error) throw error;

      toast.success('Note added');
      setNewNote('');
      await fetchHistory();
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setIsAddingNote(false);
    }
  };

  // Log a status change
  const logStatusChange = async (
    previousStatus: string | null,
    newStatus: string,
    eventType: string,
    notes?: string,
    appointmentId?: string
  ) => {
    if (!recordId) return;

    try {
      await supabase.from('meeting_history').insert({
        meeting_id: recordId,
        meeting_type: recordType,
        previous_status: previousStatus,
        new_status: newStatus,
        event_type: eventType,
        notes: notes || null,
        appointment_id: appointmentId || null,
        created_by: userId,
      });
      await fetchHistory();
    } catch (error) {
      console.error('Error logging status change:', error);
    }
  };

  // Reset state when record changes
  useEffect(() => {
    if (recordId) {
      fetchHistory();
    } else {
      setHistory([]);
      setNewNote('');
    }
    // Deliberately keyed on recordId alone. fetchHistory is redefined every
    // render, so listing it here would refetch on every render forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId]);

  return {
    history,
    isLoading,
    newNote,
    setNewNote,
    isAddingNote,
    addNote,
    logStatusChange,
    fetchHistory,
  };
}
