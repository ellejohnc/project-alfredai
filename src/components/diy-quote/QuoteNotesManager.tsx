import { memo, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  StickyNote, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Pencil, 
  Trash2, 
  Check, 
  X, 
  Loader2,
  User,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface QuoteNote {
  id: string;
  quote_id: string;
  content: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface QuoteNotesManagerProps {
  quoteDbId: string | null;
  salesRepName?: string;
  className?: string;
}

export const QuoteNotesManager = memo(function QuoteNotesManager({
  quoteDbId,
  salesRepName = 'Sales Rep',
  className,
}: QuoteNotesManagerProps) {
  const [notes, setNotes] = useState<QuoteNote[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch notes when panel opens
  const fetchNotes = useCallback(async () => {
    if (!quoteDbId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('quote_notes')
        .select('*')
        .eq('quote_id', quoteDbId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
      toast.error('Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  }, [quoteDbId]);

  useEffect(() => {
    if (isOpen && quoteDbId) {
      fetchNotes();
    }
  }, [isOpen, quoteDbId, fetchNotes]);

  // Add new note
  const handleAddNote = useCallback(async () => {
    if (!quoteDbId || !newNoteContent.trim()) return;
    
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('quote_notes')
        .insert({
          quote_id: quoteDbId,
          content: newNoteContent.trim(),
          created_by: salesRepName,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setNotes(prev => [data, ...prev]);
      setNewNoteContent('');
      setIsAdding(false);
      toast.success('Note added');
    } catch (err) {
      console.error('Failed to add note:', err);
      toast.error('Failed to add note');
    } finally {
      setIsSaving(false);
    }
  }, [quoteDbId, newNoteContent, salesRepName]);

  // Edit note
  const handleStartEdit = useCallback((note: QuoteNote) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingNoteId(null);
    setEditContent('');
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingNoteId || !editContent.trim()) return;
    
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('quote_notes')
        .update({ content: editContent.trim() })
        .eq('id', editingNoteId)
        .select()
        .single();
      
      if (error) throw error;
      
      setNotes(prev => prev.map(n => n.id === editingNoteId ? data : n));
      setEditingNoteId(null);
      setEditContent('');
      toast.success('Note updated');
    } catch (err) {
      console.error('Failed to update note:', err);
      toast.error('Failed to update note');
    } finally {
      setIsSaving(false);
    }
  }, [editingNoteId, editContent]);

  // Delete note
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteNoteId) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('quote_notes')
        .delete()
        .eq('id', deleteNoteId);
      
      if (error) throw error;
      
      setNotes(prev => prev.filter(n => n.id !== deleteNoteId));
      setDeleteNoteId(null);
      toast.success('Note deleted');
    } catch (err) {
      console.error('Failed to delete note:', err);
      toast.error('Failed to delete note');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteNoteId]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return format(date, 'MMM d, yyyy h:mm a');
  };

  // Show placeholder state when no quote is loaded
  const isQuoteSaved = !!quoteDbId;

  return (
    <>
      <Collapsible 
        open={isOpen} 
        onOpenChange={setIsOpen} 
        className={cn("w-full", className)}
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full flex items-center justify-between gap-2 h-auto py-2 px-3 text-muted-foreground hover:text-foreground"
          >
            <div className="flex items-center gap-2">
              <StickyNote className="w-4 h-4" />
              <span className="text-sm">Manage Notes</span>
              {notes.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {notes.length}
                </Badge>
              )}
            </div>
            {isOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-2 space-y-3">
          {/* Show placeholder when quote not saved */}
          {!isQuoteSaved ? (
            <div className="text-center py-4 px-3 bg-muted/50 rounded-lg border border-dashed border-border">
              <StickyNote className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Save this quote first to start adding notes
              </p>
            </div>
          ) : (
            <>
              {/* Add Note Button/Form */}
              {!isAdding ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAdding(true)}
                  className="w-full gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Note
                </Button>
              ) : (
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg border border-border">
                  <Textarea
                    placeholder="Enter your note..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    rows={3}
                    className="resize-none"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsAdding(false);
                        setNewNoteContent('');
                      }}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddNote}
                      disabled={!newNoteContent.trim() || isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-1" />
                      )}
                      Save
                    </Button>
                  </div>
                </div>
              )}

          {/* Notes List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No notes yet. Add your first note above.
            </div>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2 pr-2">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 bg-muted/50 rounded-lg border border-border"
                  >
                    {editingNoteId === note.id ? (
                      // Edit mode
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className="resize-none"
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={!editContent.trim() || isSaving}
                          >
                            {isSaving ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4 mr-1" />
                            )}
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {note.created_by && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {note.created_by}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(note.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              onClick={() => handleStartEdit(note)}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteNoteId(note.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        {note.updated_at !== note.created_at && (
                          <p className="text-xs text-muted-foreground/60 mt-2 italic">
                            Edited {formatDate(note.updated_at)}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
            </>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteNoteId} onOpenChange={() => setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
