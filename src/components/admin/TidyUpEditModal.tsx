import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, Check, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface EnrichmentSource {
  table: 'leads' | 'ghl_submissions';
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
}

interface TidyUpIssue {
  id: string;
  displayId: string;
  primaryLabel: string;
  secondaryLabel: string | null;
  email: string | null;
  assignee: string | null;
  createdAt: string;
  updatedAt: string | null;
  status: string | null;
  issues: string[];
  source: 'quote' | 'lead';
  dupGroupKey?: string;
  enrichment?: EnrichmentSource[];
  meta: {
    setupFee?: string | null;
    monthlyRetainer?: string | null;
    workflowCount?: number;
    phone?: string | null;
    leadType?: string | null;
    leadSource?: string | null;
    industry?: string | null;
  };
}

interface TidyUpEditModalProps {
  issue: TidyUpIssue | null;
  onClose: () => void;
  onSaved: (id: string) => void;
}

const ISSUE_LABELS: Record<string, string> = {
  empty_deal: 'Empty Deal',
  stale: 'Stale Entry',
  no_sales_rep: 'No Sales Rep',
  no_contact: 'No Contact Info',
  no_company: 'No Company',
  duplicate: 'Duplicate',
  no_name: 'No Name',
  no_email: 'No Email',
};

export function TidyUpEditModal({ issue, onClose, onSaved }: TidyUpEditModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [fields, setFields] = useState({
    companyName: '',
    contactName: '',
    contactEmail: '',
    salesRep: '',
    // Lead fields
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: '',
  });

  useEffect(() => {
    if (!issue) return;
    if (issue.source === 'quote') {
      setFields({
        companyName: issue.primaryLabel === '(No company)' ? '' : issue.primaryLabel,
        contactName: issue.secondaryLabel || '',
        contactEmail: issue.email || '',
        salesRep: issue.assignee || '',
        firstName: '',
        lastName: '',
        email: '',
        company: '',
        phone: '',
      });
    } else {
      const nameParts = issue.primaryLabel === '(No name)' ? ['', ''] : issue.primaryLabel.split(' ');
      setFields({
        companyName: '',
        contactName: '',
        contactEmail: '',
        salesRep: '',
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: issue.email || '',
        company: issue.secondaryLabel || '',
        phone: issue.meta.phone || '',
      });
    }
  }, [issue]);

  if (!issue) return null;

  const isMissing = (issueKey: string) => issue.issues.includes(issueKey);

  const applyEnrichment = (src: EnrichmentSource) => {
    setFields(prev => ({
      ...prev,
      ...(src.name && !prev.contactName ? { contactName: src.name } : {}),
      ...(src.email && !prev.contactEmail ? { contactEmail: src.email } : {}),
      ...(src.company && !prev.companyName ? { companyName: src.company } : {}),
    }));
    toast.success(`Applied data from ${src.table === 'leads' ? 'Leads' : 'GHL'}`);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (issue.source === 'quote') {
        const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (fields.companyName) updateData.company_name = fields.companyName;
        if (fields.contactName) updateData.contact_name = fields.contactName;
        if (fields.contactEmail) updateData.contact_email = fields.contactEmail;
        if (fields.salesRep) updateData.created_by = fields.salesRep;

        const { error } = await supabase.from('quotes').update(updateData).eq('id', issue.id);
        if (error) throw error;
      } else {
        const updateData: Record<string, unknown> = {};
        if (fields.firstName) updateData.first_name = fields.firstName;
        if (fields.lastName) updateData.last_name = fields.lastName;
        if (fields.email) updateData.email = fields.email;
        if (fields.company) updateData.company = fields.company;
        if (fields.phone) updateData.phone = fields.phone;

        const { error } = await supabase.from('leads').update(updateData as any).eq('id', issue.id);
        if (error) throw error;
      }

      toast.success('Record updated successfully');
      onSaved(issue.id);
      onClose();
    } catch (err) {
      console.error('Save failed:', err);
      toast.error('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const quoteFields = [
    { key: 'companyName', label: 'Company Name', issueKey: 'no_company', placeholder: 'Enter company name' },
    { key: 'contactName', label: 'Contact Name', issueKey: 'no_contact', placeholder: 'Enter contact name' },
    { key: 'contactEmail', label: 'Contact Email', issueKey: 'no_contact', placeholder: 'Enter email address', type: 'email' },
    { key: 'salesRep', label: 'Sales Rep', issueKey: 'no_sales_rep', placeholder: 'Enter sales rep name' },
  ];

  const leadFields = [
    { key: 'firstName', label: 'First Name', issueKey: 'no_name', placeholder: 'Enter first name' },
    { key: 'lastName', label: 'Last Name', issueKey: 'no_name', placeholder: 'Enter last name' },
    { key: 'email', label: 'Email', issueKey: 'no_email', placeholder: 'Enter email address', type: 'email' },
    { key: 'company', label: 'Company', issueKey: 'no_company', placeholder: 'Enter company name' },
    { key: 'phone', label: 'Phone', issueKey: '', placeholder: 'Enter phone number', type: 'tel' },
  ];

  const activeFields = issue.source === 'quote' ? quoteFields : leadFields;

  return (
    <Dialog open={!!issue} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            Edit {issue.source === 'quote' ? 'Quote' : 'Lead'}
            <span className="font-mono text-xs text-muted-foreground">{issue.displayId}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Edit missing information for this {issue.source}
          </DialogDescription>
        </DialogHeader>

        {/* Issues summary */}
        <div className="flex flex-wrap gap-1.5 pb-2 border-b border-border">
          {issue.issues.map(ik => (
            <Badge key={ik} variant="destructive" className="text-[10px] gap-1">
              <AlertTriangle className="w-2.5 h-2.5" />
              {ISSUE_LABELS[ik] || ik}
            </Badge>
          ))}
        </div>

        {/* Meta info */}
        <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
          <span>Status: <span className="font-medium text-foreground">{issue.status || 'draft'}</span></span>
          <span>Created: <span className="font-medium text-foreground">{issue.createdAt ? format(new Date(issue.createdAt), 'MMM d, yyyy') : '—'}</span></span>
          {issue.meta.industry && <span>Industry: <span className="font-medium text-foreground">{issue.meta.industry}</span></span>}
          {issue.meta.setupFee && <span>Setup: <span className="font-medium text-foreground">{issue.meta.setupFee}</span></span>}
          {issue.meta.monthlyRetainer && <span>Monthly: <span className="font-medium text-foreground">{issue.meta.monthlyRetainer}</span></span>}
        </div>

        {/* Enrichment sources */}
        {issue.enrichment && issue.enrichment.length > 0 && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-2">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5" />
              {issue.enrichment.length} enrichment source{issue.enrichment.length !== 1 ? 's' : ''} found
            </p>
            <div className="flex flex-wrap gap-2">
              {issue.enrichment.map((src, idx) => (
                <Button
                  key={`${src.table}-${src.id}-${idx}`}
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5 min-h-[36px] border-emerald-500/30 hover:bg-emerald-500/10"
                  onClick={() => applyEnrichment(src)}
                >
                  <Wand2 className="w-3 h-3 text-emerald-600" />
                  Apply from {src.table === 'leads' ? 'Leads' : 'GHL'}
                  {src.name && <span className="text-muted-foreground">({src.name})</span>}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Editable fields */}
        <div className="space-y-3">
          {activeFields.map(field => {
            const fieldIsMissing = field.issueKey && isMissing(field.issueKey) && !fields[field.key as keyof typeof fields];
            return (
              <div key={field.key} className="space-y-1.5">
                <Label
                  htmlFor={field.key}
                  className={cn(
                    "text-xs flex items-center gap-1.5",
                    fieldIsMissing && "text-destructive font-semibold"
                  )}
                >
                  {field.label}
                  {fieldIsMissing && (
                    <Badge variant="destructive" className="text-[9px] px-1 py-0">Missing</Badge>
                  )}
                </Label>
                <Input
                  id={field.key}
                  type={field.type || 'text'}
                  value={fields[field.key as keyof typeof fields]}
                  onChange={(e) => setFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className={cn(
                    "h-9 text-sm",
                    fieldIsMissing && "border-destructive/50 bg-destructive/5 focus-visible:ring-destructive/30"
                  )}
                />
              </div>
            );
          })}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving} className="min-h-[44px]">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="min-h-[44px] gap-1.5">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
