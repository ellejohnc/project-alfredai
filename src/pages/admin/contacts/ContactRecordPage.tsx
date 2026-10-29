import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, Phone, Building2, ExternalLink, Users } from 'lucide-react';
import AccessDenied from '@/components/admin/AccessDenied';
import { usePermissions } from '@/hooks/usePermissions';
import { useContact } from '@/hooks/useContacts';
import { useSalesReps } from '@/hooks/useSalesReps';
import { LeadOwnershipCard, LeadNotesCard } from '@/components/admin/leads/LeadOverlayPanels';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getGHLContactUrl } from '@/lib/ghlConfig';
import { recordRouteForLead } from '@/lib/leadAdminLinks';
import { LEAD_SOURCE_META, leadStatusLabel } from '@/lib/unifiedLead';
import { format } from 'date-fns';

/**
 * A contact record — sample S6.
 *
 * The difference from a lead record (S3) is scope: that one is ONE record,
 * this is the whole person. Every record they have across the panel is listed
 * and each opens its own deep record, so this page is a hub rather than a
 * duplicate of the detail that already exists per source.
 */
export default function ContactRecordPage() {
  const { key } = useParams<{ key: string }>();
  const { canViewLeads } = usePermissions();
  const { contact, isLoading } = useContact(key ? decodeURIComponent(key) : undefined);
  const { data: reps = [] } = useSalesReps();
  const navigate = useNavigate();

  if (!canViewLeads) return <AccessDenied />;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading contact…
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="space-y-4 py-10">
        <p className="text-sm text-muted-foreground">
          That contact no longer exists — it may have been merged into another person or archived.
        </p>
        <Button variant="outline" onClick={() => navigate('/admin/contacts')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Contacts
        </Button>
      </div>
    );
  }

  const ownerName = contact.ownerId
    ? (reps.find((r) => r.id === contact.ownerId)?.display_name ?? 'Assigned')
    : 'Unassigned';
  const ghlUrl = contact.ghlContactId ? getGHLContactUrl(contact.ghlContactId) : null;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/admin/contacts')} className="-ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" /> Contacts
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-semibold">{contact.name}</h1>
            {contact.ghlContactId ? (
              <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600">
                ● GHL synced
              </Badge>
            ) : (
              <Badge variant="outline">Not in GHL</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {[contact.company, contact.email, contact.phone].filter(Boolean).join(' · ') ||
              'No contact details on file'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {contact.firstSeen ? `First seen ${format(new Date(contact.firstSeen), 'd MMM yyyy')}` : null}
            {contact.firstSeen && contact.lastSeen ? ' · ' : ''}
            {contact.lastSeen ? `Last activity ${format(new Date(contact.lastSeen), 'd MMM yyyy')}` : null}
            {` · Owner: ${ownerName}`}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {contact.email && (
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${contact.email}`}>
                <Mail className="mr-2 h-4 w-4" /> Email
              </a>
            </Button>
          )}
          {contact.phone && (
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${contact.phone}`}>
                <Phone className="mr-2 h-4 w-4" /> Call
              </a>
            </Button>
          )}
          {ghlUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={ghlUrl} target="_blank" rel="noopener noreferrer">
                Open in GHL <ExternalLink className="ml-2 h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" /> Records across the panel
            <Badge variant="secondary" className="ml-1">
              {contact.records.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {contact.records.map((r) => {
            const route = recordRouteForLead({ id: r.id, source: r.source });
            const status = leadStatusLabel({ source: r.source, status: r.status });
            return (
              <button
                key={`${r.source}:${r.id}`}
                onClick={() => navigate(route.path)}
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
              >
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  {r.sourceLabel}
                </Badge>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {status ?? 'No status'}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {r.createdAt ? format(new Date(r.createdAt), 'd MMM yyyy') : '—'}
                </span>
                <span className="shrink-0 text-muted-foreground">›</span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Ownership and notes are the shared cards, keyed to the primary record,
          so a note written here is the same note the lead record shows. */}
      <div className="grid gap-3 sm:grid-cols-2">
        <LeadOwnershipCard lead={contact.primary} />
        <LeadNotesCard lead={contact.primary} />
      </div>

      {contact.company && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" /> Company
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{contact.company}</CardContent>
        </Card>
      )}
    </div>
  );
}
