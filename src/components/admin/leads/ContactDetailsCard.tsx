import { useState } from 'react';
import { Building, Mail, Phone, Linkedin, User, Tag, Briefcase, Loader2, Pencil, X, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGhlContact, ghlKeys } from '@/hooks/useGhlLead';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { stripEmojis } from '@/lib/textFormatting';

/**
 * Read + edit GHL "Contact Details" card. Admins can push firstName /
 * lastName / email / phone / companyName back to GHL via the
 * update-ghl-contact edge function; local ghl_submissions + leads rows are
 * mirrored so the record & inbox refresh instantly.
 */
export function ContactDetailsCard({ contactId }: { contactId: string }) {
  const { data: contact, isLoading, isError } = useGhlContact(contactId);
  const { isAdmin } = usePermissions();
  const qc = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
  });

  const openEdit = () => {
    if (!contact) return;
    setForm({
      firstName: stripEmojis(contact.firstName ?? ''),
      lastName: stripEmojis(contact.lastName ?? ''),
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      companyName: contact.companyName ?? '',
    });
    setEditing(true);
  };

  const save = async () => {
    if (!contact) return;
    setSaving(true);
    try {
      const original = {
        firstName: contact.firstName ?? '',
        lastName: contact.lastName ?? '',
        email: contact.email ?? '',
        phone: contact.phone ?? '',
        companyName: contact.companyName ?? '',
      };
      const body: Record<string, unknown> = { contact_id: contactId };
      let changed = false;
      (['firstName', 'lastName', 'email', 'phone', 'companyName'] as const).forEach((k) => {
        const next = (form[k] ?? '').trim();
        if (next !== (original[k] ?? '').trim()) {
          body[k] = next;
          changed = true;
        }
      });
      if (!changed) {
        setEditing(false);
        setSaving(false);
        return;
      }
      if (contact.email) body.old_email = contact.email;

      const { data, error } = await supabase.functions.invoke('update-ghl-contact', { body });
      if (error) throw error;
      if (data?.success === false) throw new Error(data?.error || 'Failed to update contact');

      toast.success('Contact updated in GHL');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ghlKeys.contact(contactId) }),
        qc.invalidateQueries({ queryKey: ['unified-leads'] }),
        qc.invalidateQueries({ queryKey: ['lead-overlay'] }),
      ]);
      setEditing(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update contact';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && !contact) {
    return (
      <Card className="border-primary/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Contact Details
            <span className="text-xs font-normal text-muted-foreground">(from GHL)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading contact from GoHighLevel…
        </CardContent>
      </Card>
    );
  }

  if (isError || !contact) return null;

  const emails = [
    { label: 'Email', value: contact.email },
    { label: 'Work email', value: contact.workEmail },
    { label: 'Secondary email', value: contact.secondaryEmail },
    ...contact.additionalEmails
      .filter((e) => e && e !== contact.email && e !== contact.workEmail && e !== contact.secondaryEmail)
      .map((e) => ({ label: 'Additional email', value: e })),
  ].filter((e) => !!e.value);

  const phones = [
    { label: 'Phone', value: contact.phone },
    { label: 'Mobile', value: contact.mobilePhone },
  ].filter((p) => !!p.value);

  const linkedin = contact.linkedinUrl;
  const canEdit = isAdmin && !!contactId;

  return (
    <Card className="border-primary/40">
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="h-4 w-4 text-primary" /> Contact Details
          <span className="text-xs font-normal text-muted-foreground">(from GHL)</span>
        </CardTitle>
        {canEdit && !editing && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs hover:bg-muted/60"
            onClick={openEdit}
          >
            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">First name</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: stripEmojis(e.target.value) })}
                  disabled={saving}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Last name</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: stripEmojis(e.target.value) })}
                  disabled={saving}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={saving}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                disabled={saving}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Company</Label>
              <Input
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-8"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                <X className="h-3.5 w-3.5 mr-1" /> Cancel
              </Button>
              <Button size="sm" className="h-8" onClick={save} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-1" />
                )}
                Save & push to GHL
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Name (first / last) leads the card so it matches the record header */}
            {(contact.firstName || contact.lastName) && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">First name</div>
                  <div className="font-semibold">{stripEmojis(contact.firstName ?? '').trim() || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Last name</div>
                  <div className="font-semibold">{stripEmojis(contact.lastName ?? '').trim() || '—'}</div>
                </div>
              </div>
            )}

            {/* Company + primary email lead the card (Will's ask) */}
            {contact.companyName && (
              <div className="flex items-start gap-2 text-sm">
                <Building className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Company</div>
                  <div className="font-semibold">{contact.companyName}</div>
                </div>
              </div>
            )}

            {emails.length > 0 && (
              <div className="space-y-1.5">
                {emails.map((e) => (
                  <div key={e.label + e.value} className="flex items-start gap-2 text-sm">
                    <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">{e.label}</div>
                      <a
                        href={`mailto:${e.value}`}
                        className="font-medium text-primary hover:underline break-all"
                      >
                        {e.value}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {phones.length > 0 && (
              <div className="space-y-1.5">
                {phones.map((p) => (
                  <div key={p.label + p.value} className="flex items-start gap-2 text-sm">
                    <Phone className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">{p.label}</div>
                      <a href={`tel:${p.value}`} className="font-medium hover:underline">
                        {p.value}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {linkedin && (
              <div className="flex items-start gap-2 text-sm">
                <Linkedin className="h-4 w-4 mt-0.5 text-[#0A66C2] shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">LinkedIn</div>
                  <a
                    href={linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline break-all"
                  >
                    View profile
                  </a>
                </div>
              </div>
            )}

            {(contact.title || contact.department || contact.seniority) && (
              <div className="flex items-start gap-2 text-sm">
                <Briefcase className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Role</div>
                  <div className="font-medium">
                    {[contact.title, contact.department, contact.seniority].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </div>
            )}

            {(contact.contactType || contact.ownerName) && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                {contact.contactType && (
                  <div>
                    <div className="text-xs text-muted-foreground">Contact type</div>
                    <div className="font-medium capitalize">{contact.contactType}</div>
                  </div>
                )}
                {contact.ownerName && (
                  <div>
                    <div className="text-xs text-muted-foreground">Owner</div>
                    <div className="font-medium">{contact.ownerName}</div>
                  </div>
                )}
              </div>
            )}

            {contact.tags.length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <Tag className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {contact.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="text-[11px]">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {contact.customFields.length > 0 && (
              <div className="pt-2 border-t border-border space-y-1">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Custom fields</div>
                {contact.customFields.map((cf) => {
                  const val = String(cf.value ?? '');
                  const isUrl = /^https?:\/\//i.test(val);
                  return (
                    <div key={cf.id} className="flex gap-2 text-sm">
                      <span className="text-muted-foreground w-40 shrink-0 truncate">{cf.name}</span>
                      {isUrl ? (
                        <a
                          href={val}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all font-medium text-primary hover:underline"
                        >
                          {val}
                        </a>
                      ) : (
                        <span className="break-all font-medium">{val}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
