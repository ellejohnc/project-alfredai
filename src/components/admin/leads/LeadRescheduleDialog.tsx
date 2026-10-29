import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CalendarClock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { cn } from '@/lib/utils';

/**
 * Reschedule or cancel a booking without leaving the admin panel.
 *
 * Until now appointments were only ever READ, through the contact — so a
 * reschedule request meant opening GoHighLevel separately. `ghl-appointments`
 * covers it; this is the surface that calls it, because a function nothing
 * calls is the exact pattern the design audit was about.
 *
 * Both actions send mail to the client from GHL's side. That is a real-world
 * consequence, so the slot list is explicit rather than a date picker that
 * might offer a time the calendar cannot take, and cancelling asks first.
 */
export function LeadRescheduleDialog({
  open,
  onOpenChange,
  eventId,
  calendarId,
  contactName,
  currentTime,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  eventId: string;
  calendarId: string | null;
  contactName?: string | null;
  currentTime?: string | null;
  onDone?: () => void;
}) {
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    if (!open || !calendarId) return;
    let cancelled = false;
    setLoadingSlots(true);
    setSlotError(null);
    setPicked(null);
    supabase.functions
      .invoke('ghl-appointments', { body: { action: 'slots', calendar_id: calendarId } })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) throw error;
        if (data?.success === false) throw new Error(data.error || 'Could not load times');
        setSlots(Array.isArray(data?.slots) ? data.slots : []);
      })
      .catch((e) => {
        if (!cancelled) setSlotError(e instanceof Error ? e.message : 'Could not load times');
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, calendarId]);

  const reschedule = async () => {
    if (!picked) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('ghl-appointments', {
        body: { action: 'reschedule', event_id: eventId, start_time: picked },
      });
      if (error) throw error;
      if (data?.success === false) throw new Error(data.error || 'Reschedule failed');
      toast.success('Meeting moved — GoHighLevel will email the client.');
      onOpenChange(false);
      onDone?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not move the meeting.');
    } finally {
      setSaving(false);
    }
  };

  const cancelBooking = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('ghl-appointments', {
        body: { action: 'cancel', event_id: eventId },
      });
      if (error) throw error;
      if (data?.success === false) throw new Error(data.error || 'Cancel failed');
      toast.success('Meeting cancelled — GoHighLevel will email the client.');
      setConfirmCancel(false);
      onOpenChange(false);
      onDone?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not cancel the meeting.');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : format(d, 'EEE d MMM, h:mm a');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" /> Move this meeting
            </DialogTitle>
            <DialogDescription>
              {contactName ? `${contactName} · ` : ''}
              {currentTime ? `currently ${currentTime}` : 'Pick a new time'}
            </DialogDescription>
          </DialogHeader>

          {!calendarId ? (
            <p className="text-sm text-muted-foreground">
              This booking has no calendar on file, so we cannot ask GoHighLevel what is free.
              Reschedule it in GHL directly.
            </p>
          ) : loadingSlots ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Asking the calendar what is free…
            </div>
          ) : slotError ? (
            <p className="text-sm text-destructive">{slotError}</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No free times in the next two weeks. Widen the availability in GoHighLevel, or cancel
              and let them rebook.
            </p>
          ) : (
            <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
              {slots.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPicked(s)}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                    picked === s
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted/50',
                  )}
                >
                  {fmt(s)}
                </button>
              ))}
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmCancel(true)}
              disabled={saving}
            >
              Cancel the meeting
            </Button>
            <Button onClick={reschedule} disabled={!picked || saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Move to this time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this meeting?</AlertDialogTitle>
            <AlertDialogDescription>
              GoHighLevel emails the client when a booking is cancelled, so this reaches them
              straight away. It cannot be undone from here — they would need to rebook.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                cancelBooking();
              }}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Cancel the meeting
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default LeadRescheduleDialog;
