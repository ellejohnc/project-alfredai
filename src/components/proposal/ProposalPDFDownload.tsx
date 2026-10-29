import { memo, useState, useCallback } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { SUPPORT_EMAIL } from '@/lib/siteConfig';
import { generateProposalPDF } from '@/lib/proposalPdfGenerator';
import { supabase } from '@/integrations/supabase/client';

interface PaymentLink {
  payment_type: string;
  amount: number;
  currency: string;
  payment_link_url: string | null;
  installment_type?: string | null;
  status: string;
}

interface ProposalPDFDownloadProps {
  quoteId: string;
  companyName?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  industry?: string | null;
  teamSize?: number | null;
  setupFee?: string | null;
  monthlyRetainer?: string | null;
  workflows?: string[];
  challenges?: string[];
  notes?: string | null;
  timeline?: string | null;
  transcriptSummary?: string | null;
  roiConservative?: number | null;
  roiLikely?: number | null;
  roiBest?: number | null;
  paybackConservative?: number | null;
  paybackLikely?: number | null;
  paybackBest?: number | null;
  voiceAgentPlan?: string | null;
  voiceAgentMonthlyCost?: number | null;
  voiceAgentSetupCost?: number | null;
  voiceAgentWorkflowCount?: number | null;
  paymentLinks?: PaymentLink[] | null;
  createdAt?: string;
  createdBy?: string | null;
  pricingOption?: string | null;
  contractMonths?: number | null;
}

export const ProposalPDFDownload = memo(function ProposalPDFDownload(props: ProposalPDFDownloadProps) {
  const {
    quoteId,
    companyName,
    contactName,
    contactEmail,
    industry,
    teamSize,
    setupFee,
    monthlyRetainer,
    workflows = [],
    challenges = [],
    notes,
    timeline,
    transcriptSummary,
    roiConservative,
    roiLikely,
    roiBest,
    paybackConservative,
    paybackLikely,
    paybackBest,
    voiceAgentPlan,
    voiceAgentMonthlyCost,
    voiceAgentSetupCost,
    voiceAgentWorkflowCount,
    paymentLinks = [],
    createdAt,
    createdBy,
    pricingOption,
    contractMonths,
  } = props;

  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadError = useCallback(() => {
    const subject = encodeURIComponent('PDF Download Issue - Proposal');
    const body = encodeURIComponent(
      `Hi,\n\nI encountered an issue downloading my proposal PDF.\n\n` +
      `Proposal ID: ${quoteId}\n` +
      `Page URL: ${window.location.href}\n\n` +
      `Please send me a copy of my proposal.\n\nThank you`
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  }, [quoteId]);

  const handleGeneratePDF = useCallback(async () => {
    setIsGenerating(true);

    try {
      const ssaUrl = `${window.location.origin}/proposal/${quoteId}/ssa`;

      await generateProposalPDF({
        quoteId,
        companyName,
        contactName,
        contactEmail,
        industry,
        teamSize,
        setupFee,
        monthlyRetainer,
        workflows,
        challenges,
        notes,
        timeline,
        transcriptSummary,
        roiConservative,
        roiLikely,
        roiBest,
        paybackConservative,
        paybackLikely,
        paybackBest,
        voiceAgentPlan,
        voiceAgentMonthlyCost,
        voiceAgentSetupCost,
        voiceAgentWorkflowCount,
        paymentLinks,
        createdAt,
        createdBy,
        pricingOption,
        contractMonths,
        ssaUrl,
      });

      // Track download
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('proposal_pdf_downloads').insert({
          quote_id: quoteId,
          downloaded_by: user?.id || null,
          downloaded_by_email: user?.email || 'client',
          user_agent: navigator.userAgent,
        });
      } catch (trackErr) {
        console.warn('Failed to track PDF download:', trackErr);
      }

      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('Failed to generate PDF', {
        description: 'Would you like to request a copy via email?',
        action: {
          label: 'Email Support',
          onClick: handleDownloadError,
        },
      });
    } finally {
      setIsGenerating(false);
    }
  }, [
    quoteId, companyName, contactName, contactEmail, industry, teamSize,
    setupFee, monthlyRetainer, workflows, challenges, notes, timeline,
    transcriptSummary, roiConservative, roiLikely, roiBest,
    paybackConservative, paybackLikely, paybackBest,
    voiceAgentPlan, voiceAgentMonthlyCost, voiceAgentSetupCost,
    voiceAgentWorkflowCount, paymentLinks, createdAt, createdBy,
    pricingOption, contractMonths, handleDownloadError,
  ]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGeneratePDF}
      disabled={isGenerating}
      className="gap-2 min-h-[44px]"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="hidden sm:inline">Generating...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Download PDF</span>
        </>
      )}
    </Button>
  );
});

export default ProposalPDFDownload;
