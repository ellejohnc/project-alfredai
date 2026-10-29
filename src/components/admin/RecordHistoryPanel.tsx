import { format } from 'date-fns';
import { History, MessageSquare, RefreshCw, User, FileText, Plus, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { capitalizeText } from '@/lib/textFormatting';
import type { RecordHistoryEntry } from '@/hooks/useRecordHistory';
import { NoteContent } from '@/components/admin/leads/NoteContent';

interface RecordHistoryPanelProps {
  history: RecordHistoryEntry[];
  newNote: string;
  setNewNote: (note: string) => void;
  isAddingNote: boolean;
  onAddNote: () => void;
  placeholder?: string;
}

export function RecordHistoryPanel({
  history,
  newNote,
  setNewNote,
  isAddingNote,
  onAddNote,
  placeholder = 'Add a note...',
}: RecordHistoryPanelProps) {
  return (
    <div className="space-y-4">
      {/* Add Note Section */}
      <div className="space-y-3 pt-4 border-t">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <FileText className="h-4 w-4" />
          Add Note
        </Label>
        <Textarea
          placeholder={placeholder}
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="min-h-[60px] text-sm"
        />
        <Button
          onClick={onAddNote}
          disabled={isAddingNote || !newNote.trim()}
          size="sm"
          className="gap-2"
        >
          {isAddingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Add Note
        </Button>
      </div>

      {/* Update History */}
      {history.length > 0 && (
        <div className="space-y-3 pt-3 border-t">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <History className="h-4 w-4" />
              Update History
            </Label>
            <Badge variant="secondary" className="text-xs">
              {history.length} update{history.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {history.map((entry, idx) => {
              const isWebhook = entry.event_type.includes('webhook') || entry.appointment_id;
              const isManual = entry.created_by && !isWebhook;

              return (
                <div
                  key={entry.id}
                  className={cn(
                    'relative pl-4 pb-3',
                    idx !== history.length - 1 && 'border-l-2 border-muted ml-1.5'
                  )}
                >
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      'absolute -left-[5px] top-1 w-3 h-3 rounded-full border-2 border-background',
                      entry.event_type === 'confirmed' && 'bg-emerald-500',
                      entry.event_type === 'cancelled' && 'bg-red-500',
                      entry.event_type === 'rescheduled' && 'bg-orange-500',
                      entry.event_type === 'completed' && 'bg-slate-500',
                      entry.event_type === 'no_show' && 'bg-amber-500',
                      entry.event_type === 'note_added' && 'bg-blue-500',
                      entry.event_type === 'created' && 'bg-purple-500',
                      entry.event_type === 'synced' && 'bg-emerald-500',
                      entry.event_type === 'updated' && 'bg-indigo-500',
                      entry.event_type === 'deleted_from_ghl' && 'bg-rose-500',
                      entry.event_type === 'contact_deleted' && 'bg-rose-500',
                      ![
                        'confirmed',
                        'cancelled',
                        'rescheduled',
                        'completed',
                        'no_show',
                        'note_added',
                        'created',
                        'synced',
                        'updated',
                        'deleted_from_ghl',
                        'contact_deleted',
                      ].includes(entry.event_type) && 'bg-muted-foreground'
                    )}
                  />

                  <div className="ml-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs font-medium',
                            entry.event_type === 'confirmed' &&
                              'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                            entry.event_type === 'cancelled' &&
                              'bg-red-500/10 text-red-600 border-red-500/20',
                            entry.event_type === 'rescheduled' &&
                              'bg-orange-500/10 text-orange-600 border-orange-500/20',
                            entry.event_type === 'completed' &&
                              'bg-slate-500/10 text-slate-600 border-slate-500/20',
                            entry.event_type === 'no_show' &&
                              'bg-amber-500/10 text-amber-600 border-amber-500/20',
                            entry.event_type === 'note_added' &&
                              'bg-blue-500/10 text-blue-600 border-blue-500/20',
                            entry.event_type === 'created' &&
                              'bg-purple-500/10 text-purple-600 border-purple-500/20',
                            entry.event_type === 'synced' &&
                              'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                            entry.event_type === 'updated' &&
                              'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
                            (entry.event_type === 'deleted_from_ghl' || entry.event_type === 'contact_deleted') &&
                              'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          )}
                        >
                          {capitalizeText(entry.event_type.replace(/_/g, ' '))}
                        </Badge>
                        {isWebhook && (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-cyan-500/10 text-cyan-600 border-cyan-500/20"
                          >
                            <RefreshCw className="h-2.5 w-2.5 mr-1" />
                            Webhook
                          </Badge>
                        )}
                        {isManual && (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-violet-500/10 text-violet-600 border-violet-500/20"
                          >
                            <User className="h-2.5 w-2.5 mr-1" />
                            Manual
                          </Badge>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs text-muted-foreground block">
                          {format(new Date(entry.created_at), 'MMM d, yyyy')}
                        </span>
                        <span className="text-[10px] text-muted-foreground/70">
                          {format(new Date(entry.created_at), 'h:mm a')}
                        </span>
                      </div>
                    </div>

                    {/* Status change */}
                    {entry.previous_status && entry.previous_status !== entry.new_status && (
                      <div className="flex items-center gap-2 mb-2 text-xs">
                        <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {capitalizeText(entry.previous_status)}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded font-medium',
                            entry.new_status === 'confirmed' && 'bg-emerald-500/20 text-emerald-700',
                            entry.new_status === 'cancelled' && 'bg-red-500/20 text-red-700',
                            entry.new_status === 'rescheduled' && 'bg-orange-500/20 text-orange-700',
                            entry.new_status === 'completed' && 'bg-slate-500/20 text-slate-700',
                            entry.new_status === 'no_show' && 'bg-amber-500/20 text-amber-700',
                            entry.new_status === 'deleted_from_ghl' && 'bg-rose-500/20 text-rose-700'
                          )}
                        >
                          {capitalizeText(entry.new_status)}
                        </span>
                      </div>
                    )}

                    {/* Notes */}
                    {entry.notes && (
                      <div className="text-sm text-foreground/80 bg-background/50 p-2 rounded border border-border/30 flex gap-1.5">
                        <MessageSquare className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                        <NoteContent value={entry.notes} className="flex-1" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty history state */}
      {history.length === 0 && (
        <div className="p-4 bg-muted/30 rounded-lg border border-dashed border-border text-center">
          <History className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No update history yet</p>
        </div>
      )}
    </div>
  );
}
