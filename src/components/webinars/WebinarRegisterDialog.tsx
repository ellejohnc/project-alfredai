import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Registration for ANY webinar.
 *
 * `webinar_registrations` was empty and it was not because nobody cared: 21
 * webinars were published and 20 flagged as accepting registrations, but the
 * only form that called `register-webinar` was hardcoded to a single slug, and
 * the modal every other webinar opens ignored `show_registration` entirely —
 * it rendered an external "View Resources" link or nothing at all. So roughly
 * half offered no way to sign up, and the rest sent signups to somebody else's
 * system.
 *
 * This is the missing form. It posts the same shape the existing one does, with
 * the slug of whichever webinar was opened.
 */
export interface WebinarRegisterTarget {
  slug: string | null;
  title: string;
  dateLabel?: string | null;
  timeLabel?: string | null;
}

export function WebinarRegisterDialog({
  webinar,
  open,
  onOpenChange,
}: {
  webinar: WebinarRegisterTarget | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setConsent(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webinar) return;
    if (!firstName.trim() || !email.trim()) {
      toast.error('Please add your name and email.');
      return;
    }
    if (!consent) {
      toast.error('Please tick the consent box to register.');
      return;
    }
    setSaving(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const { data, error } = await supabase.functions.invoke('register-webinar', {
        body: {
          webinar_slug: webinar.slug,
          webinar_title: webinar.title,
          webinar_date_label: webinar.dateLabel ?? null,
          webinar_time_label: webinar.timeLabel ?? null,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          company: company.trim() || null,
          consent: true,
          utm_source: params.get('utm_source'),
          utm_medium: params.get('utm_medium'),
          utm_campaign: params.get('utm_campaign'),
        },
      });
      if (error) throw error;
      if (data && data.success === false) throw new Error(data.error || 'Registration failed');

      toast.success("You're registered — check your email for the confirmation.");
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Couldn't register you just now. Please try again, or email hello@alfredai.bot.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register for this webinar</DialogTitle>
          <DialogDescription>
            {webinar?.title}
            {webinar?.dateLabel ? ` · ${webinar.dateLabel}` : ''}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="wr-first">First name</Label>
              <Input id="wr-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wr-last">Last name</Label>
              <Input id="wr-last" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wr-email">Email</Label>
            <Input
              id="wr-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="wr-phone">Phone</Label>
              <Input id="wr-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wr-company">Company</Label>
              <Input id="wr-company" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
          </div>
          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={consent}
              onCheckedChange={(v) => setConsent(v === true)}
              className="mt-0.5"
            />
            <span>I agree to be contacted about this webinar and related updates.</span>
          </label>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {saving ? 'Registering…' : 'Register'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
