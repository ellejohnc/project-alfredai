/**
 * Native jsPDF Proposal PDF Generator
 * Replaces html2canvas image-based approach with native text rendering
 * for selectable text, smaller files, and native clickable links.
 */
import type jsPDF from 'jspdf';
import { formatCurrency, industryMultipliers } from '@/lib/pricingEngine';
import { WorkflowDefinition, workflowDefinitions } from '@/lib/workflowDefinitions';
import { formatQuotePaymentAmountLabel, normalizeQuotePaymentAmount } from '@/lib/quotePaymentAmounts';
import { SALES_EMAIL } from '@/lib/siteConfig';
import alfredLogoWhite from '@/assets/alfred-ai-logo-white.png';

// Helper to load image as base64 for PDF embedding
async function loadImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ─── Types ───────────────────────────────────────────────────────────────
interface PaymentLink {
  payment_type: string;
  amount: number;
  currency: string;
  payment_link_url: string | null;
  installment_type?: string | null;
  status: string;
}

export interface ProposalPDFData {
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
  notes?: string | null;
  createdAt?: string;
  createdBy?: string | null;
  pricingOption?: string | null;
  contractMonths?: number | null;
  ssaUrl?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────
const PAGE_W = 210; // A4 width mm
const PAGE_H = 297; // A4 height mm
const M_LEFT = 15;
const M_RIGHT = 15;
const M_TOP = 15;
const M_BOTTOM = 15;
const CONTENT_W = PAGE_W - M_LEFT - M_RIGHT;

// Colors
const NAVY = [15, 23, 42] as const;       // #0f172a
const SLATE = [51, 65, 85] as const;      // #334155
const MUTED = [100, 116, 139] as const;   // #64748b
const ACCENT = [37, 99, 235] as const;    // #2563eb
const EMERALD = [5, 150, 105] as const;   // #059669
const BORDER = [226, 232, 240] as const;  // #e2e8f0
const WHITE = [255, 255, 255] as const;
const WARM = [248, 250, 252] as const;    // #f8fafc
const ACCENT_SOFT = [239, 246, 255] as const; // #eff6ff
const EMERALD_LIGHT = [209, 250, 229] as const; // #d1fae5

type RGB = readonly [number, number, number];

const PAYMENT_ORDER = [
  'slot_reservation', 'setup_initiation', 'setup_month1', 'setup_month2', 'setup_month3', 'setup_fee', 'monthly_retainer',
];

const paymentTypeLabels: Record<string, string> = {
  slot_reservation: 'Slot Reservation',
  setup_fee: 'Setup Fee',
  setup_initiation: 'Project Initiation (50%)',
  setup_month1: 'Month 1 Payment (20%)',
  setup_month2: 'Month 2 Payment (20%)',
  setup_month3: 'Final Payment (10%)',
  monthly_retainer: 'Monthly Retainer',
};

const timelineLabels: Record<string, string> = {
  'asap': 'ASAP / Urgent',
  '1-2_weeks': '1-2 Weeks',
  '1_month': 'Within 1 Month',
  '2-3_months': '2-3 Months',
  '3-6_months': '3-6 Months',
  'exploring': 'Just Exploring Options',
};

// ─── PDF Drawing Helpers ────────────────────────────────────────────────

class PDFRenderer {
  private doc: jsPDF;
  private y: number = M_TOP;

  constructor(doc: jsPDF) {
    this.doc = doc;
  }

  /** Check if we need a new page, add one if so */
  private ensureSpace(needed: number) {
    if (this.y + needed > PAGE_H - M_BOTTOM) {
      this.doc.addPage();
      this.y = M_TOP;
    }
  }

  private setColor(rgb: RGB) {
    this.doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  }

  private setFillColor(rgb: RGB) {
    this.doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  }

  private setDrawColor(rgb: RGB) {
    this.doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  }

  /** Draw rounded rectangle */
  private roundedRect(x: number, y: number, w: number, h: number, r: number, style: 'F' | 'S' | 'FD' = 'F') {
    // jsPDF has roundedRect built-in
    (this.doc as any).roundedRect(x, y, w, h, r, r, style);
  }

  /** Horizontal line */
  private hLine(y: number) {
    this.setDrawColor(BORDER);
    this.doc.setLineWidth(0.3);
    this.doc.line(M_LEFT, y, PAGE_W - M_RIGHT, y);
  }

  /** Split text to fit width and return lines */
  private splitText(text: string, maxWidth: number): string[] {
    return this.doc.splitTextToSize(text, maxWidth);
  }

  /** Draw text and return height used */
  private drawText(text: string, x: number, y: number, maxWidth: number, options?: { align?: 'left' | 'center' | 'right' }): number {
    const lines = this.splitText(text, maxWidth);
    const lineHeight = this.doc.getLineHeightFactor() * this.doc.getFontSize() / (72 / 25.4);
    this.doc.text(lines, x, y, options);
    return lines.length * lineHeight;
  }

  /** Section label (uppercase, accent color) */
  private sectionLabel(text: string, color: RGB = ACCENT) {
    this.ensureSpace(12);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.setColor(color);
    this.doc.text(text.toUpperCase(), M_LEFT, this.y);
    this.y += 6;
  }

  // ═══════════════ SECTIONS ═══════════════

  drawHeader(data: ProposalPDFData, logoBase64?: string) {
    // Dark header background
    this.setFillColor(NAVY);
    this.doc.rect(0, 0, PAGE_W, 28, 'F');

    // Logo image or fallback text
    if (logoBase64) {
      try {
        // Logo height ~10mm, auto-width to maintain aspect ratio
        const logoH = 10;
        const logoW = logoH * 3.5; // approximate aspect ratio
        this.doc.addImage(logoBase64, 'PNG', M_LEFT, 9, logoW, logoH);
      } catch {
        // Fallback to text if image fails
        this.doc.setFontSize(16);
        this.doc.setFont('helvetica', 'bold');
        this.setColor(WHITE);
        this.doc.text('alfred ai', M_LEFT, 15);
      }
    } else {
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'bold');
      this.setColor(WHITE);
      this.doc.text('alfred ai', M_LEFT, 15);
    }

    // Subtitle
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('PROPOSAL', PAGE_W - M_RIGHT, 12, { align: 'right' });

    // Quote ID
    this.doc.setFontSize(9);
    this.doc.text(data.quoteId, PAGE_W - M_RIGHT, 18, { align: 'right' });

    this.y = 36;
  }

  drawTitleBlock(data: ProposalPDFData) {
    const formattedDate = data.createdAt
      ? new Date(data.createdAt).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });

    // Section label
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.setColor(ACCENT);
    this.doc.text('AI AUTOMATION BLUEPRINT', M_LEFT, this.y);
    this.y += 6;

    // Company name
    this.doc.setFontSize(22);
    this.doc.setFont('helvetica', 'bold');
    this.setColor(NAVY);
    this.doc.text(data.companyName || 'Your Team', M_LEFT, this.y);
    this.y += 8;

    // Date & prepared by
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.setColor(MUTED);
    let meta = formattedDate;
    if (data.createdBy) meta += `  ·  Prepared by ${data.createdBy}`;
    this.doc.text(meta, M_LEFT, this.y);
    this.y += 6;

    this.hLine(this.y);
    this.y += 6;
  }

  drawClientDetails(data: ProposalPDFData) {
    this.ensureSpace(20);

    const industryInfo = data.industry
      ? industryMultipliers.find(i => i.id === data.industry)
      : null;

    const details = [
      { label: 'CONTACT', value: data.contactName || '—' },
      { label: 'INDUSTRY', value: industryInfo?.name || data.industry || 'General' },
      { label: 'TEAM SIZE', value: data.teamSize ? `${data.teamSize} people` : '—' },
      { label: 'TIMELINE', value: data.timeline ? (timelineLabels[data.timeline] || data.timeline) : '—' },
    ];

    const colW = CONTENT_W / 4;
    details.forEach((item, idx) => {
      const x = M_LEFT + idx * colW;

      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'bold');
      this.setColor(MUTED);
      this.doc.text(item.label, x, this.y);

      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.setColor(NAVY);
      this.doc.text(item.value, x, this.y + 5);

      // Vertical divider
      if (idx < 3) {
        this.setDrawColor(BORDER);
        this.doc.setLineWidth(0.2);
        this.doc.line(x + colW - 2, this.y - 3, x + colW - 2, this.y + 8);
      }
    });

    this.y += 14;
    this.hLine(this.y);
    this.y += 6;
  }

  drawTranscriptSummary(data: ProposalPDFData) {
    if (!data.transcriptSummary) return;
    this.ensureSpace(20);

    this.sectionLabel('What We Heard');

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.setColor(SLATE);
    const h = this.drawText(data.transcriptSummary, M_LEFT, this.y, CONTENT_W);
    this.y += h + 4;

    this.hLine(this.y);
    this.y += 6;
  }

  drawChallenges(data: ProposalPDFData) {
    const challenges = data.challenges || [];
    if (challenges.length === 0) return;
    this.ensureSpace(20);

    this.sectionLabel('Challenges We\'ll Address');

    // Draw as pills
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    let px = M_LEFT;
    const pillH = 6;
    const pillPad = 3;
    const pillGap = 3;
    const rowGap = 3;

    challenges.forEach((challenge) => {
      const textW = this.doc.getTextWidth(challenge) + pillPad * 2;
      if (px + textW > PAGE_W - M_RIGHT) {
        px = M_LEFT;
        this.y += pillH + rowGap;
        this.ensureSpace(pillH + rowGap);
      }

      // Pill background
      this.setFillColor(WARM);
      this.setDrawColor(BORDER);
      this.doc.setLineWidth(0.2);
      this.roundedRect(px, this.y - 4, textW, pillH, 3, 'FD');

      // Pill text
      this.setColor(SLATE);
      this.doc.text(challenge, px + pillPad, this.y);

      px += textW + pillGap;
    });

    this.y += pillH + 4;
    this.hLine(this.y);
    this.y += 6;
  }

  drawWorkflows(data: ProposalPDFData) {
    const workflowNames = data.workflows || [];
    if (workflowNames.length === 0) return;

    // Look up standard workflows; for custom ones (not found), create a minimal entry
    const selectedWorkflows = workflowNames
      .map(wfName => {
        const found = workflowDefinitions.find(w => w.name === wfName);
        if (found) return found;
        // Custom workflow - create a minimal WorkflowDefinition-like object
        return { id: `custom-${wfName}`, name: wfName, description: 'Custom workflow tailored to your requirements', category: 'custom', applications: [] } as WorkflowDefinition;
      });

    if (selectedWorkflows.length === 0) return;

    this.ensureSpace(20);
    this.sectionLabel('Your AI Solutions');

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.setColor(MUTED);
    this.doc.text(`${selectedWorkflows.length} purpose-built automation${selectedWorkflows.length !== 1 ? 's' : ''}`, M_LEFT, this.y);
    this.y += 6;

    // Draw workflow cards in 2-column grid
    const colW = (CONTENT_W - 4) / 2;
    const cardPad = 4;

    for (let i = 0; i < selectedWorkflows.length; i += 2) {
      const cardH = 20;
      this.ensureSpace(cardH + 4);

      for (let col = 0; col < 2 && i + col < selectedWorkflows.length; col++) {
        const wf = selectedWorkflows[i + col];
        const x = M_LEFT + col * (colW + 4);

        // Card border
        this.setDrawColor(BORDER);
        this.doc.setLineWidth(0.2);
        this.roundedRect(x, this.y, colW, cardH, 2, 'S');

        // Workflow name
        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'bold');
        this.setColor(NAVY);
        this.doc.text(wf.name, x + cardPad, this.y + 5);

        // Description (truncated)
        this.doc.setFontSize(7.5);
        this.doc.setFont('helvetica', 'normal');
        this.setColor(MUTED);
        const desc = wf.description
          ? (wf.description.length > 80 ? wf.description.slice(0, 80) + '…' : wf.description)
          : 'Automation workflow';
        const descLines = this.splitText(desc, colW - cardPad * 2);
        this.doc.text(descLines.slice(0, 2), x + cardPad, this.y + 10);

        // Applications tags
        if (wf.applications && wf.applications.length > 0) {
          this.doc.setFontSize(6.5);
          this.setColor(MUTED);
          const apps = wf.applications.slice(0, 3).join('  ·  ');
          this.doc.text(apps, x + cardPad, this.y + 17);
        }
      }

      this.y += cardH + 3;
    }

    this.y += 2;
    this.hLine(this.y);
    this.y += 6;
  }

  drawVoiceAgent(data: ProposalPDFData) {
    if (!data.voiceAgentPlan || data.voiceAgentPlan === 'none') return;
    this.ensureSpace(20);

    // Accent background card
    this.setFillColor(ACCENT_SOFT);
    this.setDrawColor(ACCENT);
    this.doc.setLineWidth(0.3);
    this.roundedRect(M_LEFT, this.y, CONTENT_W, 18, 2, 'FD');

    // Label
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'bold');
    this.setColor(ACCENT);
    this.doc.text('VOICE AI AGENT', M_LEFT + 5, this.y + 5);

    // Plan name
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.setColor(NAVY);
    this.doc.text(`${data.voiceAgentPlan} Plan`, M_LEFT + 5, this.y + 11);

    if (data.voiceAgentWorkflowCount && data.voiceAgentWorkflowCount > 1) {
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.setColor(MUTED);
      this.doc.text(`${data.voiceAgentWorkflowCount} voice workflows included`, M_LEFT + 5, this.y + 15);
    }

    // Price on right
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.setColor(ACCENT);
    this.doc.text(formatCurrency(data.voiceAgentMonthlyCost || 0), PAGE_W - M_RIGHT - 5, this.y + 10, { align: 'right' });
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.setColor(MUTED);
    this.doc.text('per month', PAGE_W - M_RIGHT - 5, this.y + 15, { align: 'right' });

    this.y += 22;
    this.hLine(this.y);
    this.y += 6;
  }

  drawInvestment(data: ProposalPDFData) {
    this.ensureSpace(45);
    this.sectionLabel('Your Investment');

    const filteredLinks = (data.paymentLinks || []).filter(
      link => link.payment_link_url && link.status === 'pending'
    );
    const hasInstallments = filteredLinks.some(l => l.payment_type === 'setup_fee' && l.installment_type);

    const boxW = (CONTENT_W - 4) / 2;
    const boxH = 22;

    // Setup Fee box (dark)
    this.setFillColor(NAVY);
    this.roundedRect(M_LEFT, this.y, boxW, boxH, 2, 'F');

    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('SETUP FEE · ONE-TIME', M_LEFT + 5, this.y + 6);

    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(data.setupFee || 'TBD', M_LEFT + 5, this.y + 14);

    if (data.voiceAgentSetupCost && data.voiceAgentSetupCost > 0) {
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(200, 200, 200);
      this.doc.text(`+ ${formatCurrency(data.voiceAgentSetupCost)} Voice Agent setup`, M_LEFT + 5, this.y + 19);
    }

    if (hasInstallments) {
      this.doc.setFontSize(6.5);
      this.doc.setTextColor(180, 180, 180);
      this.doc.text('Paid in installments — see schedule below', M_LEFT + 5, this.y + 19);
    }

    // Monthly Retainer box (light)
    const x2 = M_LEFT + boxW + 4;
    this.setFillColor(WARM);
    this.setDrawColor(BORDER);
    this.doc.setLineWidth(0.2);
    this.roundedRect(x2, this.y, boxW, boxH, 2, 'FD');

    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'bold');
    this.setColor(MUTED);
    this.doc.text('MONTHLY RETAINER', x2 + 5, this.y + 6);

    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.setColor(NAVY);
    this.doc.text(data.monthlyRetainer || 'TBD', x2 + 5, this.y + 14);

    if (data.voiceAgentMonthlyCost && data.voiceAgentMonthlyCost > 0) {
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.setColor(MUTED);
      this.doc.text(`+ ${formatCurrency(data.voiceAgentMonthlyCost)}/mo Voice Agent`, x2 + 5, this.y + 19);
    }

    this.y += boxH + 3;

    // Option C pricing condition
    if (data.pricingOption === 'C') {
      this.ensureSpace(22);
      this.setFillColor([240, 253, 244] as unknown as RGB); // emerald-50
      this.setDrawColor(EMERALD);
      this.doc.setLineWidth(0.3);
      this.roundedRect(M_LEFT, this.y, CONTENT_W, 20, 2, 'FD');

      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'bold');
      this.setColor(NAVY);
      this.doc.text('Option C: Long-term Commitment Pricing', M_LEFT + 4, this.y + 5);

      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.setColor(MUTED);
      const months = data.contractMonths || 24;
      const optionCText = `Pricing is based on a ${months}-month contracted period. 50% discounted setup fee paid upfront. Setup savings are redistributed into the monthly retainer over the contract term.`;
      const lines = this.splitText(optionCText, CONTENT_W - 8);
      this.doc.text(lines, M_LEFT + 4, this.y + 10);

      this.doc.setFont('helvetica', 'bold');
      this.setColor(NAVY);
      this.doc.text('Termination for convenience: The Client must pay the remainder of the total contractual value in full.', M_LEFT + 4, this.y + 17);

      this.y += 23;
    }

    // Contract period for non-C options
    if (data.pricingOption !== 'C' && data.contractMonths && data.contractMonths > 0) {
      this.ensureSpace(14);
      this.setFillColor([240, 253, 244] as unknown as RGB);
      this.setDrawColor(EMERALD);
      this.doc.setLineWidth(0.3);
      this.roundedRect(M_LEFT, this.y, CONTENT_W, 10, 2, 'FD');

      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'bold');
      this.setColor(NAVY);
      this.doc.text(`${data.contractMonths}-month contracted period`, M_LEFT + 4, this.y + 4);

      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.setColor(MUTED);
      this.doc.text('Agreed minimum contract duration as outlined in the service agreement.', M_LEFT + 4, this.y + 8);

      this.y += 13;
    }

    // "All prices in AUD" note
    this.doc.setFontSize(7.5);
    this.doc.setFont('helvetica', 'normal');
    this.setColor(MUTED);
    this.doc.text('All prices in AUD, excluding GST', PAGE_W / 2, this.y, { align: 'center' });
    this.y += 5;

    this.hLine(this.y);
    this.y += 6;
  }

  drawGettingStarted(data: ProposalPDFData) {
    this.ensureSpace(40);
    this.sectionLabel('Getting Started', EMERALD);

    // Derive slot reservation amount
    const filteredLinks = (data.paymentLinks || []).filter(
      link => link.payment_link_url && link.status === 'pending'
    );
    const slotLink = filteredLinks.find(l => l.payment_type === 'slot_reservation');
    const slotDisplay = slotLink
      ? formatCurrency(normalizeQuotePaymentAmount({
          amountCents: slotLink.amount,
          currency: slotLink.currency,
          paymentType: slotLink.payment_type,
        }).baseCents / 100)
      : '$5,000';

    const steps = [
      { step: '01', label: 'Slot Reservation', value: slotDisplay, sub: 'Deducted from setup fee' },
      { step: '02', label: 'Lead Time', value: '1 Week', sub: 'From reservation' },
      { step: '03', label: 'PoC Delivery', value: '2 Weeks', sub: 'Proof of Concept' },
    ];

    const colW = (CONTENT_W - 8) / 3;
    const cardH = 24;

    steps.forEach((item, idx) => {
      const x = M_LEFT + idx * (colW + 4);

      this.setDrawColor(BORDER);
      this.doc.setLineWidth(0.2);
      this.roundedRect(x, this.y, colW, cardH, 2, 'S');

      // Step number
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'bold');
      this.setColor(ACCENT);
      this.doc.text(`Step ${item.step}`, x + colW / 2, this.y + 5, { align: 'center' });

      // Value
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'bold');
      this.setColor(NAVY);
      this.doc.text(item.value, x + colW / 2, this.y + 13, { align: 'center' });

      // Label
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'bold');
      this.setColor(SLATE);
      this.doc.text(item.label, x + colW / 2, this.y + 18, { align: 'center' });

      // Sub
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.setColor(MUTED);
      this.doc.text(item.sub, x + colW / 2, this.y + 22, { align: 'center' });
    });

    this.y += cardH + 4;

    // Refund guarantee banner
    this.ensureSpace(12);
    this.setFillColor(EMERALD_LIGHT);
    this.roundedRect(M_LEFT, this.y, CONTENT_W, 9, 2, 'F');

    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.setColor([6, 95, 70] as unknown as RGB);
    const refundBoldText = '100% Refundable';
    this.doc.text(refundBoldText, M_LEFT + 5, this.y + 4);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(' - Your slot reservation is fully refundable if the project doesn\'t proceed.', M_LEFT + 5 + this.doc.getTextWidth(refundBoldText), this.y + 4);

    this.y += 13;
    this.hLine(this.y);
    this.y += 6;
  }

  drawROI(data: ProposalPDFData) {
    this.ensureSpace(40);
    this.sectionLabel('Expected Return');

    const scenarios = [
      { label: 'GUARANTEED*', roi: data.roiConservative, payback: data.paybackConservative, highlight: true },
      { label: 'LIKELY', roi: data.roiLikely, payback: data.paybackLikely, highlight: false },
      { label: 'BEST CASE', roi: data.roiBest, payback: data.paybackBest, highlight: false },
    ];

    const colW = (CONTENT_W - 8) / 3;
    const cardH = 30;

    scenarios.forEach((item, idx) => {
      const x = M_LEFT + idx * (colW + 4);

      if (item.highlight) {
        this.setFillColor(ACCENT_SOFT);
        this.setDrawColor(ACCENT);
        this.doc.setLineWidth(0.5);
        this.roundedRect(x, this.y, colW, cardH, 2, 'FD');
      } else {
        this.setDrawColor(BORDER);
        this.doc.setLineWidth(0.2);
        this.roundedRect(x, this.y, colW, cardH, 2, 'S');
      }

      // Label
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'bold');
      this.setColor(item.highlight ? ACCENT : MUTED);
      this.doc.text(item.label, x + colW / 2, this.y + 5, { align: 'center' });

      // ROI percentage
      this.doc.setFontSize(24);
      this.doc.setFont('helvetica', 'bold');
      this.setColor(item.highlight ? ACCENT : NAVY);
      this.doc.text(`${item.roi || 0}%`, x + colW / 2, this.y + 16, { align: 'center' });

      // ROI Year 1 subtitle
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.setColor(MUTED);
      this.doc.text('ROI Year 1', x + colW / 2, this.y + 20, { align: 'center' });

      // Divider
      this.setDrawColor(item.highlight ? ACCENT : BORDER);
      this.doc.setLineWidth(0.2);
      this.doc.line(x + 4, this.y + 22, x + colW - 4, this.y + 22);

      // Payback
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.setColor(item.highlight ? ACCENT : SLATE);
      this.doc.text(`${item.payback || 0} months payback`, x + colW / 2, this.y + 27, { align: 'center' });
    });

    this.y += cardH + 4;

    // ROI disclaimer
    this.doc.setFontSize(6.5);
    this.doc.setFont('helvetica', 'italic');
    this.setColor(MUTED);
    const disclaimer = '*If ROI thresholds are not achieved after reasonable remediation efforts, we will continue optimization work at no additional charge. Monthly retainer fees continue during this period.';
    const disclaimerLines = this.splitText(disclaimer, CONTENT_W);
    this.doc.text(disclaimerLines, M_LEFT, this.y);
    this.y += disclaimerLines.length * 3 + 3;

    this.hLine(this.y);
    this.y += 6;
  }

  drawNotes(data: ProposalPDFData) {
    if (!data.notes || !data.notes.trim()) return;
    this.ensureSpace(15);

    this.sectionLabel('Additional Notes');

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.setColor(SLATE);
    const h = this.drawText(data.notes, M_LEFT, this.y, CONTENT_W);
    this.y += h + 4;

    this.hLine(this.y);
    this.y += 6;
  }

  drawCredentials() {
    this.ensureSpace(18);

    const creds = [
      { label: 'SOC 2 Type II', sub: 'Compliant' },
      { label: 'ISO 27001', sub: 'Certified' },
      { label: 'Australian Owned', sub: 'Local Support' },
      { label: 'Enterprise SLA', sub: '99.9% Uptime' },
    ];

    const colW = (CONTENT_W - 12) / 4;
    creds.forEach((cred, idx) => {
      const x = M_LEFT + idx * (colW + 4);

      this.setDrawColor(BORDER);
      this.doc.setLineWidth(0.2);
      this.roundedRect(x, this.y, colW, 12, 2, 'S');

      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'bold');
      this.setColor(NAVY);
      this.doc.text(cred.label, x + colW / 2, this.y + 5, { align: 'center' });

      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.setColor(MUTED);
      this.doc.text(cred.sub, x + colW / 2, this.y + 10, { align: 'center' });
    });

    this.y += 16;
    this.hLine(this.y);
    this.y += 6;
  }

  drawPaymentLinks(data: ProposalPDFData) {
    const getDisplayKey = (link: PaymentLink): string => {
      if (link.payment_type === 'setup_fee' && link.installment_type) {
        switch (link.installment_type) {
          case 'initiation': return 'setup_initiation';
          case 'month1': return 'setup_month1';
          case 'month2': return 'setup_month2';
          case 'month3': return 'setup_month3';
          case 'full': return 'setup_fee';
          default: return 'setup_fee';
        }
      }
      return link.payment_type;
    };

    const filteredLinks = (data.paymentLinks || []).filter(
      link => link.payment_link_url && link.status === 'pending'
    );
    const deduped = new Map<string, PaymentLink>();
    for (const link of filteredLinks) {
      deduped.set(getDisplayKey(link), link);
    }
    const activeLinks = Array.from(deduped.values()).sort((a, b) => {
      const aOrder = PAYMENT_ORDER.indexOf(getDisplayKey(a));
      const bOrder = PAYMENT_ORDER.indexOf(getDisplayKey(b));
      return (aOrder === -1 ? 99 : aOrder) - (bOrder === -1 ? 99 : bOrder);
    });

    if (activeLinks.length === 0) return;

    this.ensureSpace(10 + activeLinks.length * 14);
    this.sectionLabel('Make a Payment');

    activeLinks.forEach((link) => {
      this.ensureSpace(14);
      const isSlot = link.payment_type === 'slot_reservation';
      const labelKey = link.payment_type === 'setup_fee' && link.installment_type
        ? `setup_${link.installment_type}`
        : link.payment_type;
      const label = paymentTypeLabels[labelKey] || paymentTypeLabels[link.payment_type] || link.payment_type;
      const normalizedAmounts = normalizeQuotePaymentAmount({
        amountCents: link.amount,
        currency: link.currency,
        paymentType: link.payment_type,
      });
      const amountStr = formatQuotePaymentAmountLabel(normalizedAmounts, {
        recurring: link.payment_type === 'monthly_retainer',
      });

      // Card
      if (isSlot) {
        this.setFillColor(ACCENT_SOFT);
        this.setDrawColor(ACCENT);
        this.doc.setLineWidth(0.4);
      } else {
        this.setDrawColor(BORDER);
        this.doc.setLineWidth(0.2);
      }
      this.roundedRect(M_LEFT, this.y, CONTENT_W, 12, 2, isSlot ? 'FD' : 'S');

      // Label
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.setColor(NAVY);
      this.doc.text(label, M_LEFT + 5, this.y + 5);

      // Subtitle
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.setColor(isSlot ? ACCENT : MUTED);
      this.doc.text(
        isSlot ? 'Pay this first to reserve your build slot' : 'Click to pay securely via Stripe',
        M_LEFT + 5,
        this.y + 9
      );

      // Amount badge
      const badgeW = this.doc.getTextWidth(amountStr) + 8;
      const badgeX = PAGE_W - M_RIGHT - badgeW - 3;
      this.setFillColor(ACCENT);
      this.roundedRect(badgeX, this.y + 2, badgeW, 8, 2, 'F');
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.setColor(WHITE);
      this.doc.text(amountStr, badgeX + badgeW / 2, this.y + 7, { align: 'center' });

      // Clickable link
      if (link.payment_link_url) {
        this.doc.link(M_LEFT, this.y, CONTENT_W, 12, { url: link.payment_link_url });
      }

      this.y += 14;
    });

    this.y += 2;
    this.hLine(this.y);
    this.y += 6;
  }

  drawCTA(data: ProposalPDFData) {
    this.ensureSpace(30);

    // CTA background box
    this.setFillColor(WARM);
    this.setDrawColor(BORDER);
    this.doc.setLineWidth(0.2);
    this.roundedRect(M_LEFT, this.y, CONTENT_W, 28, 3, 'FD');

    // Title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.setColor(NAVY);
    this.doc.text('Ready to Transform Your Operations?', PAGE_W / 2, this.y + 10, { align: 'center' });

    // Subtitle
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.setColor(MUTED);
    const ctaLines = this.splitText(
      'Accept this proposal to secure your implementation slot. We\'ll guide you through every step.',
      CONTENT_W - 30
    );
    this.doc.text(ctaLines, PAGE_W / 2, this.y + 16, { align: 'center' });

    // SSA link
    const ssaUrl = data.ssaUrl || '';
    if (ssaUrl) {
      this.doc.setFontSize(7.5);
      this.setColor(ACCENT);
      this.doc.text('By proceeding, you agree to our Standard Service Agreement', PAGE_W / 2, this.y + 24, { align: 'center' });
      this.doc.link(M_LEFT + 20, this.y + 21, CONTENT_W - 40, 5, { url: ssaUrl });
    }

    this.y += 32;
    this.hLine(this.y);
    this.y += 4;
  }

  drawFooter(data: ProposalPDFData) {
    // If near the bottom, this is fine — footer sits at bottom of last page
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'normal');
    this.setColor(MUTED);
    this.doc.text(`(c) ${new Date().getFullYear()} alfred ai - All rights reserved`, M_LEFT, PAGE_H - 8);
    this.doc.text(`Questions? ${SALES_EMAIL}`, PAGE_W - M_RIGHT, PAGE_H - 8, { align: 'right' });

    // SSA link in footer
    const ssaUrl = data.ssaUrl || '';
    if (ssaUrl) {
      const footerText = '  ·  Service Agreement';
      const questionsW = this.doc.getTextWidth(`Questions? ${SALES_EMAIL}`);
      const linkX = PAGE_W - M_RIGHT - questionsW - this.doc.getTextWidth(footerText) - 1;
      // We just add the text at the same line
    }
  }

  // ═══════════════ SERVICE AGREEMENT TERMS ═══════════════

  private ssaHeading(text: string) {
    this.ensureSpace(10);
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.setColor(NAVY);
    this.doc.text(text, M_LEFT, this.y);
    this.y += 6;
  }

  private ssaSubHeading(text: string) {
    this.ensureSpace(8);
    this.doc.setFontSize(8.5);
    this.doc.setFont('helvetica', 'bold');
    this.setColor(SLATE);
    this.doc.text(text, M_LEFT, this.y);
    this.y += 4;
  }

  private ssaParagraph(text: string, indent = 0) {
    this.doc.setFontSize(7.5);
    this.doc.setFont('helvetica', 'normal');
    this.setColor(MUTED);
    const lines = this.splitText(text, CONTENT_W - indent);
    this.ensureSpace(lines.length * 3.2 + 2);
    this.doc.text(lines, M_LEFT + indent, this.y);
    this.y += lines.length * 3.2 + 1.5;
  }

  private ssaBullet(text: string, indent = 4) {
    this.doc.setFontSize(7.5);
    this.doc.setFont('helvetica', 'normal');
    this.setColor(MUTED);
    const lines = this.splitText(text, CONTENT_W - indent - 4);
    this.ensureSpace(lines.length * 3.2 + 1);
    this.doc.text('-', M_LEFT + indent, this.y);
    this.doc.text(lines, M_LEFT + indent + 4, this.y);
    this.y += lines.length * 3.2 + 1;
  }

  drawServiceAgreement(data: ProposalPDFData) {
    // New page for the agreement
    this.doc.addPage();
    this.y = M_TOP;

    // Title
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.setColor(NAVY);
    this.doc.text('AI Software Implementation & Services Agreement', PAGE_W / 2, this.y, { align: 'center' });
    this.y += 6;
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.setColor(MUTED);
    this.doc.text('Standard Service Agreement', PAGE_W / 2, this.y, { align: 'center' });
    this.y += 8;
    this.hLine(this.y);
    this.y += 6;

    // 1. Parties
    this.ssaHeading('1. Parties');
    this.ssaSubHeading('Developer');
    this.ssaParagraph('alfred ai Agent Services');
    this.ssaParagraph('ABN: 62 864 936 525');
    this.ssaParagraph('Level 35, International Tower One, Barangaroo NSW 2000');
    this.ssaSubHeading('Client');
    this.ssaParagraph(data.companyName || '[Company Name]');
    this.ssaParagraph(`${data.contactName || '[Contact Name]'} | ${data.contactEmail || '[Contact Email]'}`);
    const contractDate = data.createdAt 
      ? new Date(data.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
    this.ssaParagraph(`Date of Contract: ${contractDate}`);
    this.y += 2;

    // 2. Background
    this.ssaHeading('2. Background & Purpose');
    this.ssaParagraph('A. The Client wishes to engage the Developer to implement AI agents that integrate with the Client\'s existing systems in a minimal disruptive manner.');
    this.ssaParagraph('B. The Developer provides modular artificial intelligence software agents and implementation services.');
    this.ssaParagraph('The AI Solution will be accessible via alfred ai\'s web apps and connected services. Ongoing use requires an active maintenance subscription.');

    // 3. Scope
    this.ssaHeading('3. Scope of Services');
    this.ssaParagraph('3.1 Implementation Services. The Developer shall design, configure, and deploy modular AI agents that integrate with the Client\'s existing systems via APIs, webhooks, or other light-touch connectors, without replacing the Client\'s systems of record.');
    this.ssaParagraph('3.2 Non-Disruptive Operation. The Client\'s personnel shall continue to operate within their existing tools. The AI Solution will automate data handling, outputs, and handoffs.');
    this.ssaParagraph('3.3 Service Packages. The specific modules to be implemented are described in Schedule 1 (Deliverables & Scope).');
    this.ssaParagraph('3.4 Multi-Report Rule. A single workflow may support multiple report templates where the input logic and output data model are identical. Where inputs or outputs materially differ, a separate workflow and setup fee will apply.');
    this.ssaParagraph('3.5 Platform Access. The AI Solution will be accessible via alfred ai web applications and connected services. Continued access requires an active maintenance subscription.');

    // 4. Project Governance
    this.ssaHeading('4. Project Governance and Acceptance');
    this.ssaParagraph('4.1 Kickoff. The project shall commence upon execution of this Agreement and receipt of the initial payment.');
    this.ssaParagraph('4.2 Client Responsibilities. The Client shall provide timely access to templates, data, systems, and personnel reasonably required to deliver the Services.');
    this.ssaParagraph('4.3 User Acceptance Testing (UAT). Following delivery, the Client shall conduct UAT using live or representative data. Unless the Client provides written notice of material defects within thirty (30) days of delivery, the deliverables shall be deemed accepted.');

    // 5. Fees
    this.ssaHeading('5. Fees and Payment');
    this.ssaParagraph('Fees, payment structure, and subscription charges are set out in Schedule 2 (Pricing & Payment Terms).');

    // 6. Change Management
    this.ssaHeading('6. Change Management');
    this.ssaParagraph('6.1 Out-of-Scope Work. Any functionality or modification beyond the agreed scope shall be treated as a Change Request and quoted separately.');
    this.ssaParagraph('6.2 Approval Requirement. No Change Request shall commence without the Client\'s written approval of cost and timeline impact.');

    // 7. IP
    this.ssaHeading('7. Intellectual Property (IP) Rights');
    this.ssaParagraph('7.1 Pre-Existing IP. Each Party retains all rights, title, and interest to any pre-existing Intellectual Property they own prior to this Agreement.');
    this.ssaParagraph('7.2 Developer IP.');
    this.ssaBullet('AI Solution & Source Code: All source code, libraries, workflows, scripts, and associated technical components created by the Developer are owned by the Developer. The Client is granted a non-exclusive, non-transferable, royalty-free license to use the delivered AI Solution for the purpose outlined in this Agreement.');
    this.ssaBullet('Generated Reports & Content: The Client retains ownership of all final reports, data, and other written materials generated by the AI Solution.');
    this.ssaBullet('Custom Integrations & Configurations: Any custom prompts, configurations, or training data provided by the Client remains the property of the Client.');
    this.ssaParagraph('7.3 Licence to Client. The Client acknowledges that any data used to train or refine AI models may be stored, processed, or analyzed by third-party AI service providers under separate terms.');
    this.ssaParagraph('7.4 Third-party Components. The Developer may use open-source or third-party software libraries in the AI Solution.');
    this.ssaParagraph('7.6 Restrictions. The Client shall not reverse-engineer, decompile, or otherwise attempt to derive the source code of the Developer\'s proprietary components without prior written consent.');
    this.ssaParagraph('7.7 License to Use Client Marks. Unless otherwise instructed in writing, the Developer may reference the Client\'s name, logo, or trademark in its marketing materials.');
    this.ssaParagraph('7.8 Post-Termination Access. For 30 days after Termination, the Developer shall not disable or restrict the Client\'s access to the AI Solution unless a complete data export has been confirmed in writing.');

    // 8. Data Processing
    this.ssaHeading('8. Data Processing, Protection and Security');
    this.ssaParagraph('8.1 Data Processing Agreement (DPA). The parties acknowledge the Service Provider may process Personal Information on behalf of the Client. This Clause 8 constitutes the DPA.');
    this.ssaParagraph('8.2 Definitions. "Applicable Data Protection Laws" means the Privacy Act 1988 (Cth), the Australian Privacy Principles (APPs), the Notifiable Data Breaches Scheme, and any other applicable data protection legislation.');
    this.ssaParagraph('8.3 Scope of Processing. The Service Provider shall process Client Data solely for the purpose of providing the Services. The Service Provider shall not use Client Data for AI model training, product improvement unrelated to the Client, or sell, rent, disclose, or commercially exploit Client Data.');
    this.ssaParagraph('8.4 Data Hosting and Residency. Client Data shall be hosted within Australia in AWS Australia (Sydney) and Oracle Australia East (Sydney). Where AI-enabled functionality is used, AI model processing may occur outside Australia; programmatic anonymisation removes personally identifiable information prior to transmission.');
    this.ssaParagraph('8.5 Security. The Service Provider maintains an ISMS aligned with ISO/IEC 27001 principles including RBAC, MFA, encryption in transit (TLS 1.2+) and at rest (AES-256), access logging, and vulnerability management.');
    this.ssaParagraph('8.6 Sub-Processors. The Service Provider may engage sub-processors including Stripe, Xero, and OpenAI, subject to contractual data protection obligations.');
    this.ssaParagraph('8.7 Data Breach. The Service Provider shall notify the Client within one (1) business day of a confirmed eligible data breach.');
    this.ssaParagraph('8.8 Data Retention. Upon termination, the Service Provider shall provide a complete export of Client Data. Deletion requests during the term processed within one (1) business day.');
    this.ssaParagraph('8.9 Audit Rights. Upon reasonable written notice, the Client may request evidence of compliance with this Clause 8.');
    this.ssaParagraph('8.10 Survival. Clauses 8.1 to 8.9 survive termination.');

    // 9-18
    this.ssaHeading('9. Confidentiality');
    this.ssaParagraph('Both Parties agree to keep confidential any proprietary or confidential information shared during the project. This clause survives the termination of this Agreement.');

    this.ssaHeading('10. Warranties & Disclaimers');
    this.ssaParagraph('10.1 Performance Warranty. The Developer warrants that the delivered AI Solution will substantially perform as described under normal conditions.');
    this.ssaParagraph('10.2 No Guarantee of Outcomes. Project "Success" metrics will be jointly defined at kickoff. Approximately 6 months post-delivery, the Parties will review performance. If outcomes fall short, the Developer will continue reasonable efforts within scope.');
    this.ssaParagraph('Disclaimer. The Developer does not warrant uninterrupted or error-free operation, especially given reliance on third-party AI/LLM providers.');

    this.ssaHeading('11. Limitation of Liability');
    this.ssaParagraph('11.1 Neither Party shall be liable for any indirect, special, consequential, or incidental damages.');
    this.ssaParagraph('11.2 The Developer\'s total liability shall not exceed the total amount paid by the Client under this Agreement.');
    this.ssaParagraph('11.3 Clause 11.2 does not apply to breaches of clause 8, IP infringement, fraud/wilful misconduct, or death/personal injury. For data breach liability: capped at the lesser of $50,000 or 2x fees paid.');

    this.ssaHeading('12. Indemnification');
    this.ssaParagraph('12.1 The Client agrees to indemnify the Developer from claims arising from misuse of the AI Solution or third-party claims related to Client-uploaded data.');
    this.ssaParagraph('12.2 The Developer will implement commercially reasonable safeguards. The Client is responsible for its own system security.');
    this.ssaParagraph('12.3 The Developer will indemnify the Client against third-party claims caused by IP infringement, data breach from Developer\'s breach, or bodily injury from Developer\'s negligence.');

    this.ssaHeading('13. Termination');
    this.ssaParagraph('13.1 Termination for Cause. Either Party may terminate upon material breach not remedied within 14 days after written notice.');
    this.ssaParagraph('13.2 Effect of Termination. The Client shall pay for work completed. All licenses immediately cease unless otherwise agreed.');
    if (data.pricingOption === 'C' && (data.contractMonths || 0) > 0) {
      this.ssaParagraph(`13.3 Termination for Convenience (Option C). Termination for convenience prior to expiry of the ${data.contractMonths}-month contracted period requires the Client to pay the remainder of the total contractual value in full.`);
    }

    this.ssaHeading('14. Maintenance & Ongoing Improvements');
    this.ssaParagraph('14.1 Initial Testing Period. After delivery, the Client has approximately 3-4 months for testing.');
    this.ssaParagraph('14.2 Post-Project Work. Any enhancements outside original scope will be charged at an agreed hourly rate or lump sum. Maintenance services require an active subscription.');

    this.ssaHeading('15. Governing Law');
    this.ssaParagraph('This Agreement is governed by the laws of Australia. The Parties submit to the exclusive jurisdiction of the courts of the relevant state or territory.');

    this.ssaHeading('16. Refund & Satisfaction Guarantee Policy');
    this.ssaParagraph('16.1 Monthly Subscriptions: First-month non-refundable once activated. Cancel anytime.');
    this.ssaParagraph('16.2 Custom AI Development: Discovery & Design Phase - 50% refund of Setup Fee available before milestone sign-off within first 14 days. Development & Delivery Phase - no refunds after Discovery outcomes approved.');
    this.ssaParagraph('16.3 Stop Work Flexibility: You may pause or terminate at any point, ceasing future milestone payments. Prior payments remain non-refundable. You retain rights to all completed deliverables.');
    this.ssaParagraph('16.4 Service Downtime: Platform-wide outages exceeding 72 hours may qualify for service credit or subscription extension.');

    this.ssaHeading('17. Dispute Resolution');
    this.ssaParagraph('If a dispute arises, the Parties agree to attempt good-faith negotiation. If unresolved, they agree to consider mediation or arbitration before litigation.');

    this.ssaHeading('18. General');
    this.ssaParagraph('18.1 Assignment. Neither Party may assign without consent (not unreasonably withheld).');
    this.ssaParagraph('18.2 Force Majeure. Neither Party is liable for events beyond reasonable control.');
    this.ssaParagraph('18.3 Severability. Invalid provisions do not affect the remainder.');
    this.ssaParagraph('18.4 Notices. Notices must be in writing.');
    this.ssaParagraph('18.5 Entire Agreement. This Agreement and its Schedules constitute the entire agreement.');
    this.ssaParagraph('18.6 Counterparts. This Agreement may be executed electronically and in counterparts.');

    this.y += 4;
    this.hLine(this.y);
    this.y += 6;

    // Schedule 3: Timeline
    this.ssaHeading('Schedule 3 - Project Timeline & Milestones');
    this.ssaParagraph('Week 1-2: Discovery & Setup - Mapping key workflows, understanding operations, identifying highest-impact automation opportunities, and connecting alfred ai to existing systems.');
    this.ssaParagraph('Week 3-4: AI Training - alfred ai is trained on your documents, templates, processes, and business rules. Outputs configured to match standards, language, and compliance requirements.');
    this.ssaParagraph('Week 5-6: Pilot Launch (UAT) - Focused pilot within one department or workflow. Team uses the system in real scenarios while feedback is collected and outputs refined. Monthly Retainer starts immediately after Contract.');
    this.ssaParagraph('Week 7+: Scale & Expand - Roll out across additional teams and use cases. Platform improves through usage patterns with dashboards providing visibility into efficiency and ROI.');

    // Schedule 4: SLA
    this.ssaHeading('Schedule 4 - Service Levels & Support (SLA)');
    this.ssaParagraph('This Schedule applies while the Client maintains an active maintenance subscription.');
    this.ssaSubHeading('1. Platform Availability');
    this.ssaParagraph('99.9% uptime per calendar month after full launch, excluding Permitted Downtime. Scheduled maintenance outside business hours where reasonably practicable.');
    this.ssaSubHeading('2. Incident Response');
    this.ssaBullet('Severity 1 (Emergency): Platform outage or critical failure. Response: 1-12 hours. Immediate prioritisation.');
    this.ssaBullet('Severity 2 (High): Major functionality impaired but workaround exists. Response: 1 business day.');
    this.ssaBullet('Severity 3 (Normal): Non-critical issue or general inquiry. Response: 2-3 business days.');
    this.ssaSubHeading('3. Monthly Retainer Includes');
    this.ssaBullet('Hosting & Operations: Cloud hosting, monitoring, uptime management, performance optimisation');
    this.ssaBullet('Support & Maintenance: Bug fixes, platform updates, security patches, compatibility updates');
    this.ssaBullet('Minor Enhancements: Up to 3 hours/month (prompt tuning, logic refinements, template adjustments). Unused hours do not roll over.');
    this.ssaBullet('Usage & Performance Reporting and Advisory Support');

    // Schedule 5: ROI
    this.ssaHeading('Schedule 5 - Guaranteed Return on Investment (ROI)');
    const roiC = data.roiConservative || 5;
    const roiL = data.roiLikely || 10;
    const roiB = data.roiBest || 20;
    this.ssaParagraph(`ROI Commitment: Guaranteed* ${roiC}% within 6 months | Possible ${roiL}% within 12 months | A-team ${roiB}% within 24 months.`);
    this.ssaParagraph('Measurement includes: reduction in processing time, increase in throughput, reduction in cycle time, improvement in cash collection, and reduction in manual rework/error rates.');
    this.ssaParagraph('Conditions: Client must actively use the AI Solution, maintain an active subscription, provide timely access, and implement reasonable optimisation recommendations.');
    this.ssaParagraph('Remedy: If ROI thresholds are not achieved after reasonable remediation, the Parties will engage in good-faith discussions. Remedies may include additional optimisation work or subscription extension at no cost.');
    this.ssaParagraph('*If ROI thresholds are not achieved after reasonable remediation efforts, we will continue optimization work at no additional charge. Monthly retainer fees continue during this period.');

    this.y += 6;
    this.hLine(this.y);
    this.y += 4;
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.setColor(MUTED);
    this.doc.text('End of Agreement', PAGE_W / 2, this.y, { align: 'center' });
    this.y += 4;
    const endText = this.splitText('By signing the proposal, both parties acknowledge they have read, understood, and agree to the terms and conditions of this Agreement including all Schedules.', CONTENT_W - 20);
    this.doc.text(endText, PAGE_W / 2, this.y, { align: 'center' });
  }

  // ═══════════════ BANK DETAILS ═══════════════

  drawBankDetails() {
    this.ensureSpace(30);
    this.sectionLabel('BANK TRANSFER DETAILS');
    
    this.setFillColor(WARM);
    this.setDrawColor(BORDER);
    this.doc.setLineWidth(0.3);
    this.roundedRect(M_LEFT, this.y, CONTENT_W, 24, 3, 'FD');

    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.setColor(NAVY);
    this.doc.text('alfred ai Agent Services', M_LEFT + 5, this.y + 5);

    this.doc.setFontSize(7.5);
    this.doc.setFont('helvetica', 'normal');
    this.setColor(MUTED);
    const col1X = M_LEFT + 5;
    const col2X = M_LEFT + CONTENT_W / 2;
    
    this.doc.text('Bank: Commonwealth Bank of Australia', col1X, this.y + 10);
    this.doc.text('BSB: 062-128', col1X, this.y + 14);
    this.doc.text('Account: 1143 4886', col2X, this.y + 10);
    this.doc.text('SWIFT/BIC: CTBAAU2S', col2X, this.y + 14);
    
    this.doc.setFontSize(6.5);
    this.setColor(MUTED);
    this.doc.text('Please use your Quote ID as the payment reference for bank transfers.', col1X, this.y + 20);
    
    this.y += 28;
  }

  // ═══════════════ MAIN GENERATE ═══════════════

  generate(data: ProposalPDFData, logoBase64?: string) {
    this.drawHeader(data, logoBase64);
    this.drawTitleBlock(data);
    this.drawClientDetails(data);
    this.drawTranscriptSummary(data);
    this.drawChallenges(data);
    this.drawWorkflows(data);
    this.drawVoiceAgent(data);
    this.drawInvestment(data);
    this.drawGettingStarted(data);
    this.drawROI(data);
    this.drawNotes(data);
    this.drawCredentials();
    this.drawBankDetails();
    this.drawPaymentLinks(data);
    this.drawCTA(data);
    this.drawFooter(data);
    this.drawServiceAgreement(data);
  }
}

// ─── Main Export ─────────────────────────────────────────────────────────

export async function generateProposalPDF(data: ProposalPDFData): Promise<void> {
  const [{ default: jsPDF }, logoBase64] = await Promise.all([
    import('jspdf'),
    loadImageAsBase64(alfredLogoWhite).catch(() => undefined),
  ]);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const renderer = new PDFRenderer(doc);
  renderer.generate(data, logoBase64);

  const filename = `Alfred-AI-Proposal-${data.quoteId}.pdf`;
  doc.save(filename);
}
