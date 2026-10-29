import { Building2, Globe, MapPin, Phone, Mail, Users, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGhlContact } from '@/hooks/useGhlLead';

interface Qualification {
  industry?: string | null;
  companySize?: string | null;
  timeline?: string | null;
  challenge?: string | null;
}

interface Props {
  contactId: string;
  qualification?: Qualification;
}

/**
 * "Company Details" card — surfaces the company/business context of a
 * GHL-linked lead. Merges the contact's company fields, the linked GHL
 * Company (if any), and our locally captured qualification data.
 * Renders nothing if there's genuinely no company info.
 */
export function CompanyDetailsCard({ contactId, qualification }: Props) {
  const { data: contact } = useGhlContact(contactId);
  if (!contact) return null;

  const co = contact.company;
  const name = co?.name || contact.companyName || null;
  const website = co?.website || contact.website || null;
  const phone = co?.phone || null;
  const email = co?.email || null;
  const address = co?.address || contact.address || null;
  const industry = co?.industry || qualification?.industry || null;
  const size =
    (co?.employees != null ? String(co.employees) : null) ||
    qualification?.companySize ||
    null;
  const timeline = qualification?.timeline || null;
  const challenge = qualification?.challenge || null;

  const anything =
    name || website || phone || email || address || industry || size || timeline || challenge || co?.description;
  if (!anything) return null;

  const websiteHref = website
    ? /^https?:\/\//i.test(website) ? website : `https://${website}`
    : null;

  return (
    <Card className="border-primary/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" /> Company Details
          <span className="text-xs font-normal text-muted-foreground">
            {co ? '(from GHL company)' : '(from GHL)'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {name && (
          <div className="flex items-start gap-2 text-sm">
            <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground">Company</div>
              <div className="font-semibold">{name}</div>
            </div>
          </div>
        )}

        {websiteHref && (
          <div className="flex items-start gap-2 text-sm">
            <Globe className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Website</div>
              <a
                href={websiteHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline break-all"
              >
                {website}
              </a>
            </div>
          </div>
        )}

        {phone && (
          <div className="flex items-start gap-2 text-sm">
            <Phone className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground">Company phone</div>
              <a href={`tel:${phone}`} className="font-medium hover:underline">{phone}</a>
            </div>
          </div>
        )}

        {email && (
          <div className="flex items-start gap-2 text-sm">
            <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Company email</div>
              <a href={`mailto:${email}`} className="font-medium text-primary hover:underline break-all">{email}</a>
            </div>
          </div>
        )}

        {address && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground">Address</div>
              <div className="font-medium">{address}</div>
            </div>
          </div>
        )}

        {(industry || size) && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {industry && (
              <div className="flex items-start gap-2">
                <Briefcase className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Industry</div>
                  <div className="font-medium">{industry}</div>
                </div>
              </div>
            )}
            {size && (
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Company size</div>
                  <div className="font-medium">{size}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {(timeline || challenge) && (
          <div className="pt-2 border-t border-border space-y-1.5">
            {timeline && (
              <div className="text-sm">
                <div className="text-xs text-muted-foreground">Timeline</div>
                <div className="font-medium">{timeline}</div>
              </div>
            )}
            {challenge && (
              <div className="text-sm">
                <div className="text-xs text-muted-foreground">Challenge</div>
                <div className="font-medium whitespace-pre-wrap">{challenge}</div>
              </div>
            )}
          </div>
        )}

        {co?.description && (
          <div className="pt-2 border-t border-border text-sm">
            <div className="text-xs text-muted-foreground">About</div>
            <div className="whitespace-pre-wrap">{co.description}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
