import { memo, useState } from 'react';
import { Mail, Copy, ExternalLink, RefreshCw, Loader2, Info, Check, AlertCircle, Eye, Pencil, History, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { QuoteFormData } from '@/hooks/useQuoteBuilder';
import type { PricingResult } from '@/lib/pricingEngine';
import type { ROICalculation } from '@/lib/roiScenarios';
import { format } from 'date-fns';

// Simple markdown renderer for email preview
const renderMarkdown = (text: string) => {
  return text
    .split('\n\n')
    .map((paragraph, i) => {
      // Process inline formatting
      let processed = paragraph
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="bg-muted px-1 rounded text-sm">$1</code>');
      
      // Handle bullet points
      if (processed.includes('\n- ') || processed.startsWith('- ')) {
        const lines = processed.split('\n');
        const listItems = lines
          .filter(line => line.startsWith('- '))
          .map(line => `<li>${line.substring(2)}</li>`)
          .join('');
        const nonListContent = lines.filter(line => !line.startsWith('- ')).join('\n');
        return (
          <div key={i} className="mb-3">
            {nonListContent && <p dangerouslySetInnerHTML={{ __html: nonListContent }} />}
            <ul className="list-disc list-inside ml-2 space-y-1" dangerouslySetInnerHTML={{ __html: listItems }} />
          </div>
        );
      }
      
      // Handle line breaks within paragraphs
      processed = processed.replace(/\n/g, '<br />');
      
      return (
        <p key={i} className="mb-3" dangerouslySetInnerHTML={{ __html: processed }} />
      );
    });
};

interface VoiceAgentCosts {
  monthly: number;
  setup: number;
  planName?: string;
  workflowCount?: number;
}

interface QuoteHistoryItem {
  version_number: number;
  created_at: string;
  created_by: string | null;
  change_summary: string | null;
  transcript_summary: string | null;
  meeting_transcript?: string | null;
  notes: string | null;
}

interface OriginalQuoteData {
  status?: string | null;
  outcome?: string | null;
  created_at?: string;
  created_by?: string | null;
}

interface EmailGeneratorProps {
  formData: QuoteFormData;
  pricing: PricingResult;
  effectivePricingOption: 'A' | 'A1' | 'B' | 'C';
  roiCalculations: ROICalculation[];
  voiceAgentCosts?: VoiceAgentCosts;
  quoteHistory?: QuoteHistoryItem[];
  originalQuoteData?: OriginalQuoteData | null;
  loadedQuoteId?: string | null;
  proposalUrl?: string;
  manualSetupFee?: number;
  manualMonthlyRetainer?: number;
  accessCode?: string;
  slotReservationPaymentLink?: string;
}

type EmailDirection = 'next-meeting' | 'negotiation' | 'closure' | 'post-discovery-prep' | 'post-low-interest' | 'reactivation' | 'proposal-delivery';

interface GeneratedEmail {
  subject: string;
  body: string;
  tone: string;
  keyPoints: string[];
}

const directionInfo = {
  'proposal-delivery': {
    label: 'Proposal Delivery',
    description: 'Send the proposal link with investment summary to client',
    tooltip: 'Use after generating a proposal. Creates a professional email with the proposal link, pricing summary, and clear call-to-action for the client to review and accept.'
  },
  'post-discovery-prep': {
    label: 'Post-Call: Discovery Prep',
    description: 'After initial call, prepare them for a deep Discovery Meeting',
    tooltip: 'Use after an initial intro/setting call when the prospect shows interest. Prepares them for a structured Discovery session with agenda and what to bring.'
  },
  'post-low-interest': {
    label: 'Post-Call: Low Interest',
    description: 'After call with lukewarm interest, share value resources',
    tooltip: 'Use when the prospect shows low interest but wants more info. Shares educational resources and keeps the door open without being pushy.'
  },
  'reactivation': {
    label: 'Reactivation',
    description: 'Re-engage dormant leads with demos and meeting invite',
    tooltip: 'Use when a prospect has gone quiet. References previous discussions, shares relevant demo links based on their workflows, and proposes a catch-up call to revive the conversation.'
  },
  'next-meeting': {
    label: 'Next Meeting',
    description: 'Propose a follow-up meeting to discuss solutions and ROI',
    tooltip: 'Use this when the prospect is interested but needs more information. The email will reference their specific challenges and include ROI projections to spark continued interest.'
  },
  'negotiation': {
    label: 'Negotiation',
    description: 'Discuss SOW, terms, and pricing',
    tooltip: 'Use when discussing terms, pricing, or scope. The email will clearly present the selected pricing option, payment structure, and address value vs. cost with ROI numbers.'
  },
  'closure': {
    label: 'Closure',
    description: 'Handle win or loss situations',
    tooltip: 'Use to close the deal or gracefully handle a lost opportunity. Choose "Win" to share onboarding steps and celebrate, or "Lost" to maintain the relationship professionally.'
  }
};

// Component to display a single transcript history item
const TranscriptHistoryItem = memo(function TranscriptHistoryItem({ 
  version 
}: { 
  version: QuoteHistoryItem 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
            v{version.version_number}
          </div>
          <div>
            <p className="text-sm font-medium">
              {version.change_summary || `Version ${version.version_number}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(version.created_at)}
              {version.created_by && ` • ${version.created_by}`}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      
      {isExpanded && (
        <div className="p-3 pt-0 space-y-3">
          {/* AI Summary */}
          {version.transcript_summary && (
            <div className="p-3 bg-primary/5 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-primary mb-1">AI Summary</p>
                  <p className="text-sm text-muted-foreground">{version.transcript_summary}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Raw Transcript */}
          {version.meeting_transcript && (
            <div className="p-3 bg-muted/50 rounded-md">
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Raw Transcript ({version.meeting_transcript.split(/\s+/).length} words)
                  </p>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                    {version.meeting_transcript}
                  </pre>
                </div>
              </div>
            </div>
          )}
          
          {/* Notes */}
          {version.notes && (
            <div className="p-3 bg-amber-50 rounded-md border border-amber-200/50">
              <p className="text-xs font-medium text-amber-700 mb-1">Notes</p>
              <p className="text-sm text-amber-900">{version.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export const EmailGenerator = memo(function EmailGenerator({
  formData,
  pricing,
  effectivePricingOption,
  roiCalculations,
  voiceAgentCosts,
  quoteHistory = [],
  originalQuoteData,
  loadedQuoteId,
  proposalUrl,
  manualSetupFee,
  manualMonthlyRetainer,
  accessCode,
  slotReservationPaymentLink
}: EmailGeneratorProps) {
  const { toast } = useToast();
  const [direction, setDirection] = useState<EmailDirection>('proposal-delivery');
  const [closureOutcome, setClosureOutcome] = useState<'win' | 'lost'>('win');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedEmail(null);

    try {
      const hasVoiceAgent = voiceAgentCosts && (voiceAgentCosts.monthly > 0 || voiceAgentCosts.setup > 0);
      
      // Build history context for AI
      const historyContext = quoteHistory.length > 0 ? {
        previousVersions: quoteHistory.map(v => ({
          version: v.version_number,
          date: v.created_at,
          changedBy: v.created_by,
          summary: v.change_summary,
          transcriptSummary: v.transcript_summary,
          notes: v.notes,
        })),
        originalStatus: originalQuoteData?.status,
        originalOutcome: originalQuoteData?.outcome,
        originalCreatedAt: originalQuoteData?.created_at,
        originalCreatedBy: originalQuoteData?.created_by,
        isReturningClient: true,
        totalInteractions: quoteHistory.length + 1,
      } : null;
      
      const { data, error } = await supabase.functions.invoke('generate-sales-email', {
        body: {
          direction,
          closureOutcome: direction === 'closure' ? closureOutcome : undefined,
          formData,
          pricing: {
            setupFee: pricing.setupRange,
            monthlyRetainer: pricing.monthlyRange,
            annualInvestment: pricing.annualRange,
            potentialSaasSavings: pricing.potentialSaasSavings
          },
          // Pass manual fee overrides so the AI uses exact figures
          manualFees: (manualSetupFee || manualMonthlyRetainer) ? {
            setupFee: manualSetupFee,
            monthlyRetainer: manualMonthlyRetainer,
          } : undefined,
          effectivePricingOption,
          roiCalculations: roiCalculations.map(r => ({
            scenario: { type: r.scenario.type, label: r.scenario.label },
            annualSavings: r.annualSavings,
            roiPercentage: r.roiPercentage,
            paybackMonths: r.paybackMonths
          })),
          voiceAgent: hasVoiceAgent ? {
            planName: voiceAgentCosts.planName || 'Voice Agent',
            monthlyFee: voiceAgentCosts.monthly,
            setupCost: voiceAgentCosts.setup,
            workflowCount: voiceAgentCosts.workflowCount || 1
          } : undefined,
          historyContext,
          loadedQuoteId,
          // Pass proposal data for proposal-delivery direction
          proposalUrl: direction === 'proposal-delivery' ? proposalUrl : undefined,
          accessCode: direction === 'proposal-delivery' ? accessCode : undefined,
          proposalData: direction === 'proposal-delivery' ? {
            quoteId: loadedQuoteId,
            proposalUrl: proposalUrl,
            accessCode: accessCode,
            slotReservationPaymentLink: slotReservationPaymentLink,
          } : undefined,
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate email');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to generate email');
      }

      setGeneratedEmail(data.email);
      setEditedSubject(data.email.subject);
      setEditedBody(data.email.body);

      toast({
        title: "Email generated",
        description: `${directionInfo[direction].label} email ready for review`,
      });
    } catch (error) {
      console.error('Email generation error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Generation failed",
        description: (
          <div className="space-y-2">
            <p>{errorMessage}</p>
            <a 
              href={`mailto:support@alfredai.com?subject=Email Generation Error&body=Error: ${encodeURIComponent(errorMessage)}%0A%0APage: ${encodeURIComponent(window.location.href)}`}
              className="text-primary underline text-sm"
            >
              Report this issue
            </a>
          </div>
        ),
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    const fullEmail = `Subject: ${editedSubject}\n\n${editedBody}`;
    
    try {
      // Try to copy as both plain text and HTML for rich text support
      const htmlContent = `<html><body><pre style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; white-space: pre-wrap;">${editedBody}</pre></body></html>`;
      
      // Use ClipboardItem API if available for rich content
      if (typeof ClipboardItem !== 'undefined') {
        const blob = new Blob([fullEmail], { type: 'text/plain' });
        const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
        const clipboardItem = new ClipboardItem({
          'text/plain': blob,
          'text/html': htmlBlob,
        });
        await navigator.clipboard.write([clipboardItem]);
      } else {
        // Fallback to plain text copy
        await navigator.clipboard.writeText(fullEmail);
      }
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Copied to clipboard",
        description: "Email copied with markdown formatting preserved",
      });
    } catch {
      // Fallback: try plain text copy
      try {
        await navigator.clipboard.writeText(fullEmail);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
          title: "Copied to clipboard",
          description: "Email content copied as plain text",
        });
      } catch {
        toast({
          title: "Copy failed",
          description: "Please select and copy manually",
          variant: "destructive",
        });
      }
    }
  };

  const handleOpenMailClient = () => {
    const recipientEmail = formData.contactEmail || '';
    const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(editedSubject)}&body=${encodeURIComponent(editedBody)}`;
    window.open(mailtoUrl, '_blank');
  };

  const hasHistoryContext = quoteHistory.length > 0;
  const transcriptsWithContent = quoteHistory.filter(v => v.transcript_summary || v.meeting_transcript);

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Sales Email Generator</h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Full Transcript History Button */}
            {transcriptsWithContent.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs">
                    <FileText className="h-3 w-3" />
                    View All Transcripts ({transcriptsWithContent.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Full Transcript History
                    </DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="space-y-4">
                      {transcriptsWithContent.map((version) => (
                        <TranscriptHistoryItem key={version.version_number} version={version} />
                      ))}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            )}
            
            {hasHistoryContext && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    <History className="h-3 w-3" />
                    <span>{quoteHistory.length} version{quoteHistory.length !== 1 ? 's' : ''}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="text-sm">
                    AI will use {quoteHistory.length} previous interaction{quoteHistory.length !== 1 ? 's' : ''} to generate 
                    contextual, step-aware emails that reference past discussions.
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Direction Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Email Direction</Label>
          <RadioGroup
            value={direction}
            onValueChange={(value) => setDirection(value as EmailDirection)}
            className="space-y-2"
          >
            {(Object.keys(directionInfo) as EmailDirection[])
              .filter(dir => {
                // Only show 'proposal-delivery' if we have a proposal URL
                if (dir === 'proposal-delivery') {
                  return !!loadedQuoteId || !!proposalUrl;
                }
                return true;
              })
              .map((dir) => (
              <div key={dir} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value={dir} id={dir} className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={dir} className="font-medium cursor-pointer">
                      {directionInfo[dir].label}
                    </Label>
                    {dir === 'proposal-delivery' && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                        NEW
                      </span>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p className="text-sm">{directionInfo[dir].tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {directionInfo[dir].description}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Win/Lost Toggle for Closure */}
        {direction === 'closure' && (
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Outcome</Label>
              <p className="text-xs text-muted-foreground">
                {closureOutcome === 'win' ? 'Celebrate and share next steps' : 'Gracefully close and maintain relationship'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${closureOutcome === 'lost' ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                Lost
              </span>
              <Switch
                checked={closureOutcome === 'win'}
                onCheckedChange={(checked) => setClosureOutcome(checked ? 'win' : 'lost')}
              />
              <span className={`text-sm ${closureOutcome === 'win' ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                Win
              </span>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Generate {directionInfo[direction].label} Email
            </>
          )}
        </Button>

        {/* Generated Email Preview */}
        {generatedEmail && (
          <div className="space-y-4 pt-4 border-t border-border">
            {/* Tone & Key Points */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <AlertCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Tone: {generatedEmail.tone}</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {generatedEmail.keyPoints.map((point, i) => (
                    <li key={i}>• {point}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Subject Line */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Subject Line</Label>
              <Input
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                placeholder="Email subject..."
              />
            </div>

            {/* Email Body with Preview/Edit toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Email Body</Label>
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'preview' | 'edit')} className="h-8">
                  <TabsList className="h-7">
                    <TabsTrigger value="preview" className="h-6 px-2 text-xs gap-1">
                      <Eye className="h-3 w-3" />
                      Preview
                    </TabsTrigger>
                    <TabsTrigger value="edit" className="h-6 px-2 text-xs gap-1">
                      <Pencil className="h-3 w-3" />
                      Edit
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              {viewMode === 'preview' ? (
                <div className="min-h-[200px] max-h-[400px] overflow-y-auto rounded-md border border-input bg-background p-4 text-sm">
                  {renderMarkdown(editedBody)}
                </div>
              ) : (
                <Textarea
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  placeholder="Email content..."
                  rows={12}
                  className="font-mono text-sm"
                />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
              
              <Button
                size="sm"
                onClick={handleOpenMailClient}
                disabled={!formData.contactEmail}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Email Client
              </Button>
            </div>

            {!formData.contactEmail && (
              <p className="text-xs text-muted-foreground">
                Add a contact email in the form to enable "Open in Email Client"
              </p>
            )}
          </div>
        )}
      </div>
  );
});
