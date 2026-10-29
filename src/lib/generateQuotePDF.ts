import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { PricingResult } from './pricingEngine';
import { ROICalculation } from './roiScenarios';
import { QuoteFormData, MeetingSentiment, TechStackItem } from '@/hooks/useQuoteBuilder';
import { BOOKING_CONFIG } from './bookingConfig';
import { getWorkflowById } from './workflowDefinitions';
import { PRODUCTION_URL, PRODUCTION_DOMAIN } from './siteConfig';

// Payment link configuration
const PAYMENT_BASE_URL = 'https://checkout.stripe.com/c/pay/';
// We'll use edge function to generate dynamic links, but show static QR for slot reservation

// ============= Simple Color Palette =============
const colors = {
  navy: [0, 33, 77] as [number, number, number],       // #00214d
  coral: [255, 84, 112] as [number, number, number],   // #ff5470
  mint: [0, 235, 199] as [number, number, number],     // #00ebc7
  white: [255, 255, 255] as [number, number, number],
  lightGray: [245, 247, 250] as [number, number, number],
  mediumGray: [120, 130, 150] as [number, number, number],
  darkGray: [60, 70, 90] as [number, number, number],
};

// alfred ai Logo as base64 (will be loaded dynamically)
const LOGO_URL = '/src/assets/alfred-ai-logo.svg';

// ============= QR Code Generator =============
async function generateQRCodeDataURL(url: string): Promise<string> {
  try {
    return await QRCode.toDataURL(url, {
      width: 80,
      margin: 1,
      color: {
        dark: '#00214d',
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    return '';
  }
}

// Generate booking URL with client pre-fill parameters
function getBookingUrlWithPreFill(formData: QuoteFormData): string {
  const params = new URLSearchParams();
  
  if (formData.contactName) {
    const nameParts = formData.contactName.trim().split(' ');
    params.append('first_name', nameParts[0]);
    if (nameParts.length > 1) {
      params.append('last_name', nameParts.slice(1).join(' '));
    }
  }
  if (formData.contactEmail) params.append('email', formData.contactEmail);
  if (formData.companyName) {
    params.append('Lkd4j00rQ7uEZo8yaJxR', formData.companyName);
    params.append('business_website', formData.companyName);
  }
  
  params.append('utm_source', 'pdf_quote');
  params.append('utm_medium', 'qr_code');
  
  return params.toString() 
    ? `${BOOKING_CONFIG.ghlWidgetUrl}?${params}` 
    : BOOKING_CONFIG.ghlWidgetUrl;
}

// Generate a unique 12-character quote ID
export function generateQuoteId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${result.slice(0, 3)}-${result.slice(3, 7)}-${result.slice(7, 12)}`;
}

interface VoiceAgentCosts {
  monthly: number;
  setup: number;
  planName?: string;
  workflowCount?: number;
}

interface PricingOption {
  id: 'A' | 'A1' | 'B' | 'C';
  name: string;
  discount: string;
}

const pricingOptions: PricingOption[] = [
  { id: 'A', name: 'Standard Setup', discount: 'No discount' },
  { id: 'A1', name: 'Pay Full Upfront', discount: 'No discount' },
  { id: 'B', name: 'Price-Friendly (20% Off Setup)', discount: '20% off setup' },
  { id: 'C', name: 'Long-Term Commitment (50% Off Setup)', discount: '50% off setup' },
];

function getSetupPrice(pricing: PricingResult, optionId: 'A' | 'A1' | 'B' | 'C') {
  const baseMin = pricing.setupRange.min;
  const baseMax = pricing.setupRange.max;
  
  if (optionId === 'B') return { min: baseMin * 0.8, max: baseMax * 0.8 };
  if (optionId === 'C') return { min: baseMin * 0.5, max: baseMax * 0.5 };
  return { min: baseMin, max: baseMax };
}

function formatCurrency(amount: number): string {
  return '$' + amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// Payment link types for the 3-tier system
export interface PaymentLinks {
  slotReservation?: string;
  setupFee?: string;
  monthlyRetainer?: string;
  setupFeeAmount?: number;      // Confirmed amount in dollars
  monthlyRetainerAmount?: number; // Confirmed amount in dollars
}

// Proposal info for embedding in PDF
export interface ProposalInfo {
  quoteId?: string;
  accessCode?: string;
}

// ============= MAIN PDF GENERATOR =============
export async function generateQuotePDF(
  formData: QuoteFormData,
  pricing: PricingResult,
  roiCalculations: ROICalculation[],
  effectiveOption: 'A' | 'A1' | 'B' | 'C',
  sentiment?: MeetingSentiment,
  voiceAgentCosts?: VoiceAgentCosts,
  salesRepName?: string,
  paymentLinks?: PaymentLinks,
  proposalInfo?: ProposalInfo
) {
  const qrCodeDataURL = await generateQRCodeDataURL(getBookingUrlWithPreFill(formData));
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 20;
  const marginTop = 20;
  const marginBottom = 25; // Larger bottom margin for footer
  const contentWidth = pageWidth - (marginX * 2);
  const maxContentY = pageHeight - marginBottom; // Maximum Y position for content
  
  const quoteId = generateQuoteId();
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Helper to check if content fits on current page
  const needsNewPage = (y: number, requiredHeight: number) => {
    return (y + requiredHeight) > maxContentY;
  };

  // ============= PAGE 1 =============
  let y = marginTop;

  // --- Header (compact) ---
  doc.setFillColor(...colors.navy);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Logo text
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text('alfred ai', marginX, 24);
  
  // Tagline
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.mint);
  doc.text('Your AI Workforce Partner', marginX, 33);
  
  // Quote ID and Date
  doc.setFontSize(9);
  doc.setTextColor(...colors.white);
  doc.text(quoteId, pageWidth - marginX, 20, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(...colors.mint);
  doc.text(currentDate, pageWidth - marginX, 28, { align: 'right' });
  if (salesRepName) {
    doc.setTextColor(200, 210, 230);
    doc.text(`Prepared by ${salesRepName}`, pageWidth - marginX, 36, { align: 'right' });
  }

  y = 50;

  // --- Title ---
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.navy);
  doc.text('Investment Proposal', marginX, y);
  y += 10;

  // --- Client Info Section (compact) ---
  doc.setFillColor(...colors.lightGray);
  doc.roundedRect(marginX, y, contentWidth, 38, 2, 2, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.navy);
  doc.text('About You', marginX + 8, y + 10);
  
  const infoY = y + 17;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  // Left column
  doc.setTextColor(...colors.mediumGray);
  doc.text('Organisation:', marginX + 8, infoY);
  doc.text('Contact:', marginX + 8, infoY + 7);
  doc.text('Email:', marginX + 8, infoY + 14);
  
  doc.setTextColor(...colors.navy);
  doc.setFont('helvetica', 'bold');
  doc.text(formData.companyName || 'Your Company', marginX + 38, infoY);
  doc.text(formData.contactName || 'Your Name', marginX + 38, infoY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(formData.contactEmail || 'Not provided', marginX + 38, infoY + 14);
  
  // Right column
  const rightX = marginX + contentWidth / 2;
  doc.setTextColor(...colors.mediumGray);
  doc.text('Industry:', rightX, infoY);
  doc.text('Team Size:', rightX, infoY + 7);
  doc.text('Timeline:', rightX, infoY + 14);
  
  doc.setTextColor(...colors.navy);
  const industryDisplay = formData.industry.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  doc.text(industryDisplay, rightX + 32, infoY);
  doc.text(`${formData.teamSize} team members`, rightX + 32, infoY + 7);
  const timelineDisplay = formData.timeline === 'not-mentioned' ? 'Flexible' : 
    formData.timeline.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  doc.text(timelineDisplay, rightX + 32, infoY + 14);
  
  y += 44;

  // --- Current Systems Section (if tech stack detected) ---
  if (formData.currentTechStack && formData.currentTechStack.length > 0) {
    const techHeight = 14 + (Math.min(formData.currentTechStack.length, 6) * 5);
    if (needsNewPage(y, techHeight)) {
      doc.addPage();
      y = marginTop;
    }
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.navy);
    doc.text('Current Systems', marginX, y);
    y += 6;
    
    doc.setDrawColor(255, 140, 0); // Orange accent
    doc.setLineWidth(1.5);
    doc.line(marginX, y, marginX + 30, y);
    y += 6;
    
    doc.setFontSize(8);
    const techToShow = formData.currentTechStack.slice(0, 6);
    
    techToShow.forEach((tech) => {
      const icon = tech.integrationNeed === 'replace' ? '→' : 
                   tech.integrationNeed === 'integrate' ? '+' : '↑';
      const actionLabel = tech.integrationNeed === 'replace' ? 'replace' :
                          tech.integrationNeed === 'integrate' ? 'connect' : 'enhance';
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.darkGray);
      doc.text(`${icon}  ${tech.name}`, marginX + 4, y);
      
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...colors.mediumGray);
      doc.text(`(${actionLabel})`, marginX + 50, y);
      y += 5;
    });
    
    if (formData.currentTechStack.length > 6) {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...colors.mediumGray);
      doc.text(`+ ${formData.currentTechStack.length - 6} more systems`, marginX + 4, y);
      y += 5;
    }
    
    y += 4;
  }

  // --- Your Goals & Challenges Section (compact) ---
  if (formData.challenges.length > 0) {
    const challengeHeight = 14 + (formData.challenges.length * 5);
    if (needsNewPage(y, challengeHeight)) {
      doc.addPage();
      y = marginTop;
    }
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.navy);
    doc.text('Your Goals & Challenges', marginX, y);
    y += 6;
    
    doc.setDrawColor(...colors.coral);
    doc.setLineWidth(1.5);
    doc.line(marginX, y, marginX + 40, y);
    y += 6;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.darkGray);
    
    formData.challenges.forEach((challenge) => {
      doc.text(`•  ${challenge}`, marginX + 4, y);
      y += 5;
    });
    
    y += 4;
  }

  // --- How We Can Help (Workflows) Section (compact) ---
  const workflowSectionHeight = 16 + (formData.workflows.length * 9);
  if (needsNewPage(y, Math.min(workflowSectionHeight, 60))) {
    doc.addPage();
    y = marginTop;
  }
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.navy);
  doc.text('How We Can Help', marginX, y);
  y += 6;
  
  doc.setDrawColor(...colors.mint);
  doc.setLineWidth(1.5);
  doc.line(marginX, y, marginX + 35, y);
  y += 6;
  
  if (formData.workflows.length > 0) {
    doc.setFontSize(8);
    
    // Limit workflows shown to prevent overflow
    const workflowsToShow = formData.workflows.slice(0, 5);
    const hasMore = formData.workflows.length > 5;
    
    workflowsToShow.forEach((workflowId) => {
      if (needsNewPage(y, 10)) {
        doc.addPage();
        y = marginTop;
      }
      
      // Defensive: validate workflowId is a string
      if (typeof workflowId !== 'string') return;
      
      const workflow = getWorkflowById(workflowId);
      // Defensive: ensure workflow has required properties before accessing
      const workflowName = (workflow && typeof workflow.name === 'string') 
        ? workflow.name 
        : workflowId;
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.navy);
      doc.text(`•  ${workflowName}`, marginX + 4, y);
      y += 4;
      
      // Add brief description if available (limit to 1 line)
      if (workflow && typeof workflow.description === 'string' && workflow.description) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.mediumGray);
        const descLines = doc.splitTextToSize(workflow.description, contentWidth - 16);
        doc.text(descLines[0] + (descLines.length > 1 ? '...' : ''), marginX + 10, y);
        y += 4;
      }
      y += 1;
    });
    
    if (hasMore) {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...colors.mediumGray);
      doc.text(`+ ${formData.workflows.length - 5} more workflows included`, marginX + 4, y);
      y += 5;
    }
  } else {
    doc.setFontSize(8);
    doc.setTextColor(...colors.mediumGray);
    doc.text('Workflow recommendations to be discussed during consultation', marginX + 4, y);
    y += 5;
  }
  
  y += 4;

  // --- Investment Summary (compact) ---
  const investmentSectionHeight = 85;
  if (needsNewPage(y, investmentSectionHeight)) {
    doc.addPage();
    y = marginTop;
  }
  
  const selectedOption = pricingOptions.find(o => o.id === effectiveOption)!;
  const setupPrice = getSetupPrice(pricing, effectiveOption);
  
  // Calculate monthly retainer
  const getMonthlyRetainer = () => {
    if (effectiveOption === 'C') {
      const months = formData.contractMonths || 24;
      const setupDiscountMin = pricing.setupRange.min * 0.5;
      const setupDiscountMax = pricing.setupRange.max * 0.5;
      return {
        min: Math.round(pricing.monthlyRange.min + (setupDiscountMin / months)),
        max: Math.round(pricing.monthlyRange.max + (setupDiscountMax / months))
      };
    }
    return pricing.monthlyRange;
  };
  const monthlyRetainer = getMonthlyRetainer();
  
  // First year total (11 months to account for implementation)
  const firstYearMin = setupPrice.min + (monthlyRetainer.min * 11);
  const firstYearMax = setupPrice.max + (monthlyRetainer.max * 11);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.navy);
  doc.text('Your Investment', marginX, y);
  y += 6;
  
  doc.setDrawColor(...colors.coral);
  doc.setLineWidth(1.5);
  doc.line(marginX, y, marginX + 35, y);
  y += 8;
  
  // Option badge
  doc.setFillColor(...colors.coral);
  doc.roundedRect(marginX, y - 3, 65, 12, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text(`Option ${effectiveOption}: ${selectedOption.discount}`, marginX + 4, y + 4);
  y += 14;
  
  // Pricing table
  const tableData = [
    { label: 'Implementation & Setup', value: `${formatCurrency(setupPrice.min)} – ${formatCurrency(setupPrice.max)}` },
    { label: 'Monthly Partnership', value: `${formatCurrency(monthlyRetainer.min)} – ${formatCurrency(monthlyRetainer.max)} /mo` },
  ];
  
  // Add voice agent if selected
  const hasVoiceAgent = voiceAgentCosts && (voiceAgentCosts.monthly > 0 || voiceAgentCosts.setup > 0);
  if (hasVoiceAgent) {
    if (voiceAgentCosts!.setup > 0) {
      tableData.push({ label: 'Voice AI Setup', value: formatCurrency(voiceAgentCosts!.setup) });
    }
    if (voiceAgentCosts!.monthly > 0) {
      tableData.push({ label: 'Voice AI Monthly', value: `${formatCurrency(voiceAgentCosts!.monthly)} /mo` });
    }
  }
  
  doc.setFontSize(9);
  tableData.forEach((row) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.darkGray);
    doc.text(row.label, marginX + 4, y);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.navy);
    doc.text(row.value, pageWidth - marginX - 4, y, { align: 'right' });
    y += 8;
  });
  
  y += 3;
  
  // First Year Total - highlighted
  doc.setFillColor(...colors.navy);
  doc.roundedRect(marginX, y - 3, contentWidth, 16, 2, 2, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text('Year One Investment (11 months)', marginX + 8, y + 6);
  doc.setTextColor(...colors.mint);
  doc.text(`${formatCurrency(firstYearMin)} – ${formatCurrency(firstYearMax)}`, pageWidth - marginX - 8, y + 6, { align: 'right' });
  
  y += 22;
  
  // Commitment payment
  doc.setFillColor(...colors.coral);
  doc.roundedRect(marginX, y - 3, contentWidth, 13, 2, 2, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text('$5,000 commitment to secure your project slot', marginX + contentWidth / 2, y + 5, { align: 'center' });
  
  y += 16;
  
  // Note
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...colors.mediumGray);
  doc.text('All prices exclude GST (Australia) / applicable taxes.', marginX, y);

  // --- Page 1 Footer ---
  doc.setDrawColor(...colors.lightGray);
  doc.setLineWidth(0.5);
  doc.line(marginX, pageHeight - 15, pageWidth - marginX, pageHeight - 15);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.mediumGray);
  doc.text(`alfred ai  •  ${PRODUCTION_DOMAIN}`, marginX, pageHeight - 8);
  doc.text('Page 1 of 2', pageWidth - marginX, pageHeight - 8, { align: 'right' });

  // ============= PAGE 2 =============
  doc.addPage();
  y = marginTop;

  // --- Header (compact) ---
  doc.setFillColor(...colors.navy);
  doc.rect(0, 0, pageWidth, 28, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text('alfred ai', marginX, 18);
  
  doc.setFontSize(10);
  doc.setTextColor(...colors.mint);
  doc.text('Your Potential Returns', pageWidth - marginX, 18, { align: 'right' });

  y = 38;

  // --- ROI Projections (compact) ---
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.navy);
  doc.text('What You Could Gain', marginX, y);
  y += 5;
  
  doc.setDrawColor(...colors.coral);
  doc.setLineWidth(1.5);
  doc.line(marginX, y, marginX + 40, y);
  y += 8;
  
  // Three ROI cards (compact)
  const cardWidth = (contentWidth - 8) / 3;
  const cardHeight = 42;
  
  const roiData = [
    { label: 'Conservative', color: colors.mint },
    { label: 'Expected', color: colors.coral },
    { label: 'Optimistic', color: colors.navy },
  ];
  
  roiCalculations.forEach((roi, i) => {
    const cardX = marginX + i * (cardWidth + 4);
    
    // Card background
    doc.setFillColor(...colors.lightGray);
    doc.roundedRect(cardX, y, cardWidth, cardHeight, 2, 2, 'F');
    
    // Top accent bar
    doc.setFillColor(...roiData[i].color);
    doc.rect(cardX, y, cardWidth, 3, 'F');
    
    // Label
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.darkGray);
    doc.text(roiData[i].label, cardX + cardWidth / 2, y + 10, { align: 'center' });
    
    // ROI percentage
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...roiData[i].color);
    doc.text(`${roi.roiPercentage}%`, cardX + cardWidth / 2, y + 24, { align: 'center' });
    
    // Payback
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.darkGray);
    doc.text(`${roi.paybackMonths}mo payback • ${formatCurrency(roi.annualSavings)}/yr`, cardX + cardWidth / 2, y + 34, { align: 'center' });
  });
  
  y += cardHeight + 10;

  // --- Why Choose Us Section (compact) ---
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.navy);
  doc.text('Why Choose alfred ai', marginX, y);
  y += 5;
  
  doc.setDrawColor(...colors.coral);
  doc.setLineWidth(1.5);
  doc.line(marginX, y, marginX + 40, y);
  y += 8;
  
  // Credentials cards (compact)
  const credentials = [
    { title: 'SOC 2 Type II Certified', desc: 'Enterprise-grade security' },
    { title: 'HIPAA Certifiable', desc: 'Healthcare ready' },
    { title: 'Australian Owned', desc: 'Local support' },
    { title: 'Enterprise SLA', desc: '99.9% uptime' },
  ];
  
  const credCardWidth = (contentWidth - 8) / 2;
  credentials.forEach((cred, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const credX = marginX + col * (credCardWidth + 8);
    const credY = y + row * 16;
    
    doc.setFillColor(...colors.lightGray);
    doc.roundedRect(credX, credY, credCardWidth, 13, 2, 2, 'F');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.navy);
    doc.text(cred.title, credX + 5, credY + 6);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.mediumGray);
    doc.text(cred.desc, credX + 5, credY + 11);
  });
  
  y += 38;

  // --- Payment Section (3-tier payment links) ---
  // Show payment section if any payment link is available
  const hasAnyPaymentLink = paymentLinks?.slotReservation || paymentLinks?.setupFee || paymentLinks?.monthlyRetainer;
  if (hasAnyPaymentLink) {
    const paymentSectionHeight = 55;
    if (!needsNewPage(y, paymentSectionHeight)) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.navy);
      doc.text('Ready to Get Started?', marginX, y);
      y += 5;
      
      doc.setDrawColor(...colors.mint);
      doc.setLineWidth(1.5);
      doc.line(marginX, y, marginX + 40, y);
      y += 8;
      
      // Payment timeline description
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.darkGray);
      doc.text('Your payment schedule: Slot reservation → Setup fee → Monthly retainer (starts 6 weeks after first payment)', marginX, y);
      y += 6;
      
      // Three payment cards
      const payCardWidth = (contentWidth - 8) / 3;
      const payCardHeight = 32;
      
      // Use confirmed amounts if available, otherwise show ranges
      const confirmedSetup = paymentLinks.setupFeeAmount;
      const confirmedMonthly = paymentLinks.monthlyRetainerAmount;
      
      const paymentSteps = [
        { 
          step: '1', 
          title: '$5,000', 
          subtitle: 'Slot Reservation', 
          desc: 'Secure your project slot',
          url: paymentLinks.slotReservation,
          color: colors.coral,
          hasLink: !!paymentLinks.slotReservation
        },
        { 
          step: '2', 
          title: confirmedSetup ? formatCurrency(confirmedSetup) : 'Setup Fee', 
          subtitle: paymentLinks.setupFee ? 'Implementation' : `Option ${effectiveOption}`, 
          desc: paymentLinks.setupFee ? 'Click to pay' : `${formatCurrency(setupPrice.min)} – ${formatCurrency(setupPrice.max)}`,
          url: paymentLinks.setupFee,
          color: colors.navy,
          hasLink: !!paymentLinks.setupFee
        },
        { 
          step: '3', 
          title: confirmedMonthly ? `${formatCurrency(confirmedMonthly)}/mo` : 'Monthly', 
          subtitle: paymentLinks.monthlyRetainer ? 'Retainer' : 'Retainer', 
          desc: paymentLinks.monthlyRetainer ? 'Starts in 6 weeks' : `${formatCurrency(monthlyRetainer.min)} – ${formatCurrency(monthlyRetainer.max)}/mo`,
          url: paymentLinks.monthlyRetainer,
          color: colors.mint,
          hasLink: !!paymentLinks.monthlyRetainer
        },
      ];
      
      paymentSteps.forEach((pay, i) => {
        const cardX = marginX + i * (payCardWidth + 4);
        
        // Card background
        doc.setFillColor(...colors.lightGray);
        doc.roundedRect(cardX, y, payCardWidth, payCardHeight, 2, 2, 'F');
        
        // Step number badge
        doc.setFillColor(...pay.color);
        doc.circle(cardX + 8, y + 8, 5, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.white);
        doc.text(pay.step, cardX + 8, y + 10, { align: 'center' });
        
        // Title
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.navy);
        doc.text(pay.title, cardX + 16, y + 9);
        
        // Subtitle
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.mediumGray);
        doc.text(pay.subtitle, cardX + 16, y + 15);
        
        // Description
        doc.setFontSize(6);
        doc.text(pay.desc, cardX + 5, y + 23);
        
        // "Pay Now" link for ALL steps with URLs
        if (pay.hasLink && pay.url) {
          doc.setFillColor(...pay.color);
          doc.roundedRect(cardX + 5, y + 25, payCardWidth - 10, 5, 1, 1, 'F');
          doc.setFontSize(5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...colors.white);
          doc.text('PAY NOW →', cardX + payCardWidth / 2, y + 28.5, { align: 'center' });
          doc.link(cardX + 5, y + 25, payCardWidth - 10, 5, { url: pay.url });
        }
      });
      
      y += payCardHeight + 6;
      
      // Payment note - dynamic based on which links are available
      const linkCount = [paymentLinks.slotReservation, paymentLinks.setupFee, paymentLinks.monthlyRetainer].filter(Boolean).length;
      const noteText = linkCount === 3 
        ? 'Click any "Pay Now" button to complete payment securely via Stripe.'
        : linkCount === 1 
          ? 'Click "Pay Now" on Step 1 to secure your slot. Setup and monthly payments discussed during onboarding.'
          : 'Click "Pay Now" on available steps to complete payment securely via Stripe.';
      
      doc.setFontSize(6);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...colors.mediumGray);
      doc.text(noteText, marginX, y);
      y += 6;
    }
  }

  // --- Discussion Notes (if available, compact) ---
  if (formData.transcriptSummary) {
    const summaryHeight = 35;
    if (!needsNewPage(y, summaryHeight)) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.navy);
      doc.text('From Our Conversation', marginX, y);
      y += 5;
      
      doc.setDrawColor(...colors.mint);
      doc.setLineWidth(1.5);
      doc.line(marginX, y, marginX + 40, y);
      y += 6;
      
      doc.setFillColor(...colors.lightGray);
      const summaryLines = doc.splitTextToSize(formData.transcriptSummary, contentWidth - 16);
      const boxHeight = Math.min(summaryLines.length * 4 + 8, 28);
      doc.roundedRect(marginX, y, contentWidth, boxHeight, 2, 2, 'F');
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.darkGray);
      doc.text(summaryLines.slice(0, 4), marginX + 8, y + 7);
      
      y += boxHeight + 6;
    }
  }

  // --- CTA Section (compact, positioned to fit within margin) ---
  const ctaHeight = 42;
  const ctaY = Math.min(y + 6, maxContentY - ctaHeight - 10);
  
  // --- Online Proposal Link (if available) ---
  if (proposalInfo?.quoteId && proposalInfo?.accessCode) {
    const proposalBoxY = ctaY - 30;
    
    doc.setFillColor(240, 253, 250); // Light mint background
    doc.roundedRect(marginX, proposalBoxY, contentWidth, 24, 2, 2, 'F');
    doc.setDrawColor(...colors.mint);
    doc.setLineWidth(1);
    doc.roundedRect(marginX, proposalBoxY, contentWidth, 24, 2, 2, 'S');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.navy);
    doc.text('📱 Interactive Proposal (Shareable)', marginX + 6, proposalBoxY + 6);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.darkGray);
    doc.text('URL:', marginX + 6, proposalBoxY + 13);
    
    doc.setFont('helvetica', 'bold');
    const proposalUrlDisplay = `${PRODUCTION_URL.replace('https://', '')}/proposal/${proposalInfo.quoteId}`;
    doc.text(proposalUrlDisplay, marginX + 18, proposalBoxY + 13);
    doc.link(marginX + 18, proposalBoxY + 10, 80, 5, { url: `${PRODUCTION_URL}/proposal/${proposalInfo.quoteId}` });
    
    doc.setFont('helvetica', 'normal');
    doc.text('Access Code:', marginX + 100, proposalBoxY + 13);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(proposalInfo.accessCode, marginX + 128, proposalBoxY + 13);
    
    doc.setFontSize(6);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...colors.mediumGray);
    doc.text('Client can view their interactive proposal online using this code', marginX + 6, proposalBoxY + 20);
  }
  
  // QR Code
  if (qrCodeDataURL) {
    const qrSize = 30;
    
    doc.setFillColor(...colors.lightGray);
    doc.roundedRect(marginX, ctaY, qrSize + 10, qrSize + 14, 2, 2, 'F');
    
    try {
      doc.addImage(qrCodeDataURL, 'PNG', marginX + 5, ctaY + 4, qrSize, qrSize);
    } catch (e) {
      console.warn('Failed to add QR code:', e);
    }
    
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.navy);
    doc.text('Scan to Book', marginX + 5 + qrSize / 2, ctaY + qrSize + 10, { align: 'center' });
  }
  
  // CTA Box
  const ctaBoxX = marginX + 50;
  const ctaBoxWidth = contentWidth - 50;
  
  doc.setFillColor(...colors.navy);
  doc.roundedRect(ctaBoxX, ctaY, ctaBoxWidth, 36, 3, 3, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text("Let's Talk Next Steps", ctaBoxX + ctaBoxWidth / 2, ctaY + 10, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Book a call to discuss your custom implementation', ctaBoxX + ctaBoxWidth / 2, ctaY + 18, { align: 'center' });
  
  // CTA Button
  const buttonWidth = 90;
  const buttonX = ctaBoxX + (ctaBoxWidth - buttonWidth) / 2;
  doc.setFillColor(...colors.coral);
  doc.roundedRect(buttonX, ctaY + 23, buttonWidth, 10, 2, 2, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text('Book an Impact Conversation', buttonX + buttonWidth / 2, ctaY + 29, { align: 'center' });
  
  // Clickable link on button
  const bookingUrl = getBookingUrlWithPreFill(formData);
  doc.link(buttonX, ctaY + 23, buttonWidth, 10, { url: bookingUrl });

  // --- Page 2 Footer ---
  doc.setDrawColor(...colors.lightGray);
  doc.setLineWidth(0.5);
  doc.line(marginX, pageHeight - 15, pageWidth - marginX, pageHeight - 15);
  
  doc.setFontSize(6);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...colors.mediumGray);
  doc.text('This proposal is valid for 30 days. Final pricing confirmed upon scope agreement.', marginX, pageHeight - 8);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Page 2 of 2', pageWidth - marginX, pageHeight - 8, { align: 'right' });

  // Save
  const companyName = formData.companyName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Proposal';
  const date = new Date().toISOString().split('T')[0];
  doc.save(`AlfredAI_Proposal_${companyName}_${date}.pdf`);
}
