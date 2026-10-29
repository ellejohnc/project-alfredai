import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Loader2, 
  Save, 
  X, 
  Pencil, 
  Link2, 
  ChevronDown, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  CreditCard,
  Check,
  SpellCheck,
  AlertTriangle as SpellCheckAlert,
} from 'lucide-react';

const PRODUCTION_URL = 'https://new.alfredai.bot';

interface Quote {
  id: string;
  quote_id: string | null;
  company_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  industry: string | null;
  team_size: number | null;
  timeline: string | null;
  setup_fee_min: number | null;
  setup_fee_max: number | null;
  monthly_retainer_min: number | null;
  monthly_retainer_max: number | null;
  setup_fee_final: number | null;
  monthly_retainer_final: number | null;
  status: string | null;
  outcome: string | null;
  notes: string | null;
  handover_status: string | null;
  handover_notes: string | null;
  access_code: string | null;
}

interface QuoteEditModalProps {
  quote: Quote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

interface GeneratedLinks {
  slotReservation?: string;
  setupFee?: string;
  monthlyRetainer?: string;
}

const STATUS_OPTIONS = ['draft', 'sent', 'signed', 'won', 'refunded', 'lost'];

const HANDOVER_STATUS_OPTIONS = ['pending', 'triggered', 'in_progress', 'completed'];
const TIMELINE_OPTIONS = ['immediately', 'this_quarter', 'next_quarter', 'this_year', 'exploring'];
const INDUSTRY_OPTIONS = [
  'Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing',
  'Real Estate', 'Construction', 'Legal', 'Consulting', 'Education',
  'Hospitality', 'Transportation', 'Energy', 'Agriculture', 'Other'
];

// Helper component for displaying generated links
function LinkRow({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 text-sm py-1">
      <span className="flex-1 truncate text-muted-foreground">{label}</span>
      <Button 
        variant="ghost" 
        size="icon"
        className="h-8 w-8"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      </Button>
      <Button 
        variant="ghost" 
        size="icon"
        className="h-8 w-8"
        onClick={() => window.open(url, '_blank')}
      >
        <ExternalLink className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function QuoteEditModal({ quote, open, onOpenChange, onSave }: QuoteEditModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingLinks, setIsGeneratingLinks] = useState(false);
  const [isRegeneratingCode, setIsRegeneratingCode] = useState(false);
  const [isCheckingSpelling, setIsCheckingSpelling] = useState(false);
  const [spellCheckResult, setSpellCheckResult] = useState<{
    valid: boolean;
    suggestion: string | null;
    confidence: string;
    reason: string;
    original: string;
  } | null>(null);
  const [showSpellConfirm, setShowSpellConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [generatedLinks, setGeneratedLinks] = useState<GeneratedLinks | null>(null);
  const [currency, setCurrency] = useState<'aud' | 'usd'>('aud');
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [linksOpen, setLinksOpen] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    contact_email: '',
    industry: '',
    team_size: 0,
    timeline: '',
    setup_fee_min: 0,
    setup_fee_max: 0,
    monthly_retainer_min: 0,
    monthly_retainer_max: 0,
    setup_fee_final: 0,
    monthly_retainer_final: 0,
    status: 'draft',
    outcome: '',
    notes: '',
    handover_status: 'pending',
    handover_notes: '',
  });

  useEffect(() => {
    if (quote) {
      const avgSetupFee = Math.round(((quote.setup_fee_min || 0) + (quote.setup_fee_max || 0)) / 2);
      const avgMonthlyRetainer = Math.round(((quote.monthly_retainer_min || 0) + (quote.monthly_retainer_max || 0)) / 2);
      
      setFormData({
        company_name: quote.company_name || '',
        contact_name: quote.contact_name || '',
        contact_email: quote.contact_email || '',
        industry: quote.industry || '',
        team_size: quote.team_size || 0,
        timeline: quote.timeline || '',
        setup_fee_min: quote.setup_fee_min || 0,
        setup_fee_max: quote.setup_fee_max || 0,
        monthly_retainer_min: quote.monthly_retainer_min || 0,
        monthly_retainer_max: quote.monthly_retainer_max || 0,
        setup_fee_final: quote.setup_fee_final || avgSetupFee,
        monthly_retainer_final: quote.monthly_retainer_final || avgMonthlyRetainer,
        status: quote.status || 'draft',
        outcome: quote.outcome || '',
        notes: quote.notes || '',
        handover_status: quote.handover_status || 'pending',
        handover_notes: quote.handover_notes || '',
      });
      setAccessCode(quote.access_code);
      setGeneratedLinks(null);
      setSpellCheckResult(null);
      setShowSpellConfirm(false);
      setShowSaveConfirm(false);
      setDirtyFields(new Set());
    }
  }, [quote]);

  // AI spell-check for company name
  const checkCompanyNameSpelling = useCallback(async (): Promise<boolean> => {
    if (!formData.company_name.trim()) return true;

    setIsCheckingSpelling(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-company-name', {
        body: { companyName: formData.company_name.trim() },
      });

      if (error || !data) {
        console.warn('Spell-check failed, proceeding:', error);
        return true; // Fail open — don't block save
      }

      if (!data.valid && data.suggestion) {
        setSpellCheckResult(data);
        setShowSpellConfirm(true);
        return false; // Pause save — show suggestion
      }

      return true; // Name looks good
    } catch (err) {
      console.warn('Spell-check error, proceeding:', err);
      return true;
    } finally {
      setIsCheckingSpelling(false);
    }
  }, [formData.company_name]);

  // Helper to update form data and track dirty fields
  const updateFormField = useCallback(<K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setDirtyFields(prev => new Set(prev).add(field as string));
  }, []);

  // The actual save to DB — only sends fields that were actually changed
  const executeSave = useCallback(async () => {
    if (!quote) return;

    setIsSaving(true);
    try {
      // Build update payload from only dirty (changed) fields
      const allFields: Record<string, unknown> = {
        company_name: formData.company_name || null,
        contact_name: formData.contact_name || null,
        contact_email: formData.contact_email || null,
        industry: formData.industry || null,
        team_size: formData.team_size || null,
        timeline: formData.timeline || null,
        setup_fee_min: formData.setup_fee_min || null,
        setup_fee_max: formData.setup_fee_max || null,
        monthly_retainer_min: formData.monthly_retainer_min || null,
        monthly_retainer_max: formData.monthly_retainer_max || null,
        setup_fee_final: formData.setup_fee_final || null,
        monthly_retainer_final: formData.monthly_retainer_final || null,
        status: formData.status,
        outcome: formData.outcome || null,
        notes: formData.notes || null,
        handover_status: formData.handover_status,
        handover_notes: formData.handover_notes || null,
      };

      // Only include fields the admin actually modified
      const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      for (const field of dirtyFields) {
        if (field in allFields) {
          updatePayload[field] = allFields[field];
        }
      }

      // If nothing changed, skip the update
      if (dirtyFields.size === 0) {
        toast.info('No changes to save');
        onOpenChange(false);
        return;
      }

      const { error } = await supabase
        .from('quotes')
        .update(updatePayload)
        .eq('id', quote.id);

      if (error) throw error;

      toast.success('Quote updated successfully');
      onSave();
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to update quote:', err);
      toast.error(err.message || 'Failed to update quote');
    } finally {
      setIsSaving(false);
    }
  }, [quote, formData, dirtyFields, onSave, onOpenChange]);

  // Main save handler — spell-check first, then save directly
  const handleSave = async () => {
    if (!quote) return;

    // Run AI spell-check
    const nameIsValid = await checkCompanyNameSpelling();
    if (!nameIsValid) return; // Spell-check dialog will handle flow

    // Save directly without confirmation (confirmation dialog was blocked by parent Dialog overlay)
    await executeSave();
  };

  // Handle accepting the AI suggestion
  const handleAcceptSuggestion = () => {
    if (spellCheckResult?.suggestion) {
      updateFormField('company_name', spellCheckResult.suggestion);
    }
    setShowSpellConfirm(false);
    setSpellCheckResult(null);
    setShowSaveConfirm(true); // proceed to save confirmation
  };

  // Handle keeping original name
  const handleKeepOriginal = () => {
    setShowSpellConfirm(false);
    setSpellCheckResult(null);
    setShowSaveConfirm(true); // proceed to save confirmation
  };

  const handleCopyUrl = async () => {
    if (!quote?.quote_id) return;
    const url = `${PRODUCTION_URL}/proposal/${quote.quote_id}`;
    await navigator.clipboard.writeText(url);
    setUrlCopied(true);
    toast.success('Proposal URL copied!');
    setTimeout(() => setUrlCopied(false), 2000);
  };

  const handleRegenerateAccessCode = async () => {
    if (!quote) return;
    
    setIsRegeneratingCode(true);
    try {
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const { error } = await supabase
        .from('quotes')
        .update({ access_code: newCode })
        .eq('id', quote.id);

      if (error) throw error;

      setAccessCode(newCode);
      toast.success(`New access code: ${newCode}`);
    } catch (err) {
      console.error('Failed to regenerate access code:', err);
      toast.error('Failed to regenerate access code');
    } finally {
      setIsRegeneratingCode(false);
    }
  };

  const handleGeneratePaymentLinks = async () => {
    if (!quote?.quote_id || !formData.company_name) {
      toast.error('Quote ID and Company Name are required');
      return;
    }

    if (!formData.setup_fee_final || !formData.monthly_retainer_final) {
      toast.error('Please set final pricing before generating payment links');
      return;
    }

    setIsGeneratingLinks(true);
    setGeneratedLinks(null);

    const params = {
      quoteId: quote.quote_id,
      companyName: formData.company_name,
      contactEmail: formData.contact_email || undefined,
      contactName: formData.contact_name || undefined,
      pricingOption: 'A' as const,
      currency,
    };

    try {
      // Generate all 3 links in parallel
      const [slotRes, setupRes, monthlyRes] = await Promise.all([
        supabase.functions.invoke('create-quote-payment-link', {
          body: { ...params, paymentType: 'slot_reservation' }
        }),
        supabase.functions.invoke('create-quote-payment-link', {
          body: { ...params, paymentType: 'setup_fee', amount: formData.setup_fee_final * 100 }
        }),
        supabase.functions.invoke('create-quote-payment-link', {
          body: { ...params, paymentType: 'monthly_retainer', amount: formData.monthly_retainer_final * 100 }
        }),
      ]);

      const links: GeneratedLinks = {
        slotReservation: slotRes.data?.url,
        setupFee: setupRes.data?.url,
        monthlyRetainer: monthlyRes.data?.url,
      };

      const successCount = Object.values(links).filter(Boolean).length;

      if (successCount === 0) {
        toast.error('Failed to generate payment links. Please try again.');
        return;
      }

      setGeneratedLinks(links);

      if (successCount === 3) {
        toast.success('All 3 payment links generated successfully!');
      } else {
        toast.warning(`Generated ${successCount}/3 payment links. Some links may be missing.`);
      }
    } catch (err) {
      console.error('Failed to generate payment links:', err);
      toast.error('Failed to generate payment links');
    } finally {
      setIsGeneratingLinks(false);
    }
  };

  if (!quote) return null;

  const proposalUrl = quote.quote_id ? `${PRODUCTION_URL}/proposal/${quote.quote_id}` : null;
  const currencySymbol = currency === 'aud' ? 'A$' : 'US$';

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Edit Quote: {quote.quote_id || 'Unknown'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Company Info */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Company Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => updateFormField('company_name', e.target.value)}
                    placeholder="Company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={formData.industry || undefined}
                    onValueChange={(value) => updateFormField('industry', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRY_OPTIONS.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Contact Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contact Name</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => updateFormField('contact_name', e.target.value)}
                    placeholder="Contact name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => updateFormField('contact_email', e.target.value)}
                    placeholder="contact@company.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="team_size">Team Size</Label>
                  <Input
                    id="team_size"
                    type="number"
                    value={formData.team_size}
                    onChange={(e) => updateFormField('team_size', parseInt(e.target.value) || 0)}
                    placeholder="Number of employees"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeline">Timeline</Label>
                  <Select
                    value={formData.timeline || undefined}
                    onValueChange={(value) => updateFormField('timeline', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMELINE_OPTIONS.map((timeline) => (
                        <SelectItem key={timeline} value={timeline}>
                          {timeline.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Pricing</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="setup_fee_min">Setup Fee Min ($)</Label>
                  <Input
                    id="setup_fee_min"
                    type="number"
                    value={formData.setup_fee_min}
                    onChange={(e) => updateFormField('setup_fee_min', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setup_fee_max">Setup Fee Max ($)</Label>
                  <Input
                    id="setup_fee_max"
                    type="number"
                    value={formData.setup_fee_max}
                    onChange={(e) => updateFormField('setup_fee_max', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthly_retainer_min">Monthly Retainer Min ($)</Label>
                  <Input
                    id="monthly_retainer_min"
                    type="number"
                    value={formData.monthly_retainer_min}
                    onChange={(e) => updateFormField('monthly_retainer_min', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_retainer_max">Monthly Retainer Max ($)</Label>
                  <Input
                    id="monthly_retainer_max"
                    type="number"
                    value={formData.monthly_retainer_max}
                    onChange={(e) => updateFormField('monthly_retainer_max', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Status</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => updateFormField('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="handover_status">Handover Status</Label>
                  <Select
                    value={formData.handover_status}
                    onValueChange={(value) => updateFormField('handover_status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select handover status" />
                    </SelectTrigger>
                    <SelectContent>
                      {HANDOVER_STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Notes</h4>
              <div className="space-y-2">
                <Label htmlFor="notes">Quote Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateFormField('notes', e.target.value)}
                  placeholder="Add notes about this quote..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="handover_notes">Handover Notes</Label>
                <Textarea
                  id="handover_notes"
                  value={formData.handover_notes}
                  onChange={(e) => updateFormField('handover_notes', e.target.value)}
                  placeholder="Add handover notes..."
                  rows={3}
                />
              </div>
            </div>

            {/* Proposal & Payment Links */}
            <Collapsible open={linksOpen} onOpenChange={setLinksOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <Link2 className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-sm flex-1 text-left">Proposal & Payment Links</h4>
                <ChevronDown className={`h-4 w-4 transition-transform ${linksOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4 px-1">
                {/* Current Proposal URL */}
                {proposalUrl ? (
                  <div className="p-3 bg-muted/50 rounded-lg space-y-3">
                    <Label className="text-xs text-muted-foreground">Current Proposal URL</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={proposalUrl} 
                        readOnly 
                        className="text-xs font-mono bg-background"
                      />
                      <Button variant="outline" size="icon" onClick={handleCopyUrl} className="shrink-0">
                        {urlCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => window.open(proposalUrl, '_blank')}
                        className="shrink-0"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">Access Code:</span>
                      <Badge variant="secondary" className="font-mono">
                        {accessCode || 'Not set'}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleRegenerateAccessCode}
                        disabled={isRegeneratingCode}
                        className="h-7 text-xs"
                      >
                        {isRegeneratingCode ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3 mr-1" />
                        )}
                        Regenerate
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      No Quote ID found. Save the quote first to generate a proposal URL.
                    </p>
                  </div>
                )}

                {/* Final Pricing for Payment Links */}
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">Final Pricing for Payment Links</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="setup_fee_final" className="text-sm">Setup Fee Final ($)</Label>
                      <Input
                        id="setup_fee_final"
                        type="number"
                        value={formData.setup_fee_final}
                        onChange={(e) => updateFormField('setup_fee_final', parseInt(e.target.value) || 0)}
                        placeholder="Final setup fee"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthly_retainer_final" className="text-sm">Monthly Retainer Final ($)</Label>
                      <Input
                        id="monthly_retainer_final"
                        type="number"
                        value={formData.monthly_retainer_final}
                        onChange={(e) => updateFormField('monthly_retainer_final', parseInt(e.target.value) || 0)}
                        placeholder="Final monthly retainer"
                      />
                    </div>
                  </div>
                </div>

                {/* Currency Selection */}
                <div className="space-y-2">
                  <Label className="text-sm">Currency</Label>
                  <Select value={currency} onValueChange={(v) => setCurrency(v as 'aud' | 'usd')}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border shadow-lg z-50">
                      <SelectItem value="aud">AUD (Australian Dollar)</SelectItem>
                      <SelectItem value="usd">USD (US Dollar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Generate Payment Links Button */}
                <Button 
                  onClick={handleGeneratePaymentLinks}
                  disabled={isGeneratingLinks || !formData.company_name || !formData.setup_fee_final || !quote?.quote_id}
                  className="w-full min-h-[44px]"
                >
                  {isGeneratingLinks ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating Payment Links...</>
                  ) : (
                    <><CreditCard className="h-4 w-4 mr-2" />Generate Payment Links</>
                  )}
                </Button>

                {/* Display Generated Links */}
                {generatedLinks && (
                  <div className="space-y-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <Label className="text-xs text-green-700 dark:text-green-400 font-medium">
                      ✓ Generated Payment Links
                    </Label>
                    {generatedLinks.slotReservation && (
                      <LinkRow 
                        label={`Slot Reservation (${currencySymbol}5,000)`} 
                        url={generatedLinks.slotReservation} 
                      />
                    )}
                    {generatedLinks.setupFee && (
                      <LinkRow 
                        label={`Setup Fee (${currencySymbol}${formData.setup_fee_final.toLocaleString()})`} 
                        url={generatedLinks.setupFee} 
                      />
                    )}
                    {generatedLinks.monthlyRetainer && (
                      <LinkRow 
                        label={`Monthly Retainer (${currencySymbol}${formData.monthly_retainer_final.toLocaleString()}/mo)`} 
                        url={generatedLinks.monthlyRetainer} 
                      />
                    )}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isCheckingSpelling}>
            {isCheckingSpelling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking spelling...
              </>
            ) : isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {!isCheckingSpelling && 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Spell-check suggestion dialog */}
    <AlertDialog open={showSpellConfirm} onOpenChange={setShowSpellConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <SpellCheck className="h-5 w-5 text-amber-500" />
            Spelling Suggestion
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>AI detected a possible spelling issue with the company name:</p>
              <div className="flex flex-col gap-2 p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Current:</span>
                  <span className="font-medium line-through text-destructive">{spellCheckResult?.original}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Suggested:</span>
                  <span className="font-semibold text-primary">{spellCheckResult?.suggestion}</span>
                </div>
              </div>
              {spellCheckResult?.reason && (
                <p className="text-xs text-muted-foreground italic">{spellCheckResult.reason}</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleKeepOriginal}>
            Keep "{spellCheckResult?.original}"
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleAcceptSuggestion}>
            Use "{spellCheckResult?.suggestion}"
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Save confirmation dialog */}
    <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Save</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>Please confirm the company name and details are correct:</p>
              <div className="p-3 rounded-lg bg-muted space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Company:</span>
                  <span className="font-semibold text-lg">{formData.company_name || '(empty)'}</span>
                </div>
                {formData.contact_name && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Contact:</span>
                    <span className="text-sm">{formData.contact_name}</span>
                  </div>
                )}
                {formData.contact_email && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <span className="text-sm">{formData.contact_email}</span>
                  </div>
                )}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Go Back</AlertDialogCancel>
          <AlertDialogAction onClick={() => { setShowSaveConfirm(false); executeSave(); }}>
            Confirm & Save
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
}
