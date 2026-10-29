import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PAGE_URLS } from "../_shared/config.ts";
// Edge function: generate-sales-email

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HistoryVersion {
  version: number;
  date: string;
  changedBy: string | null;
  summary: string | null;
  transcriptSummary: string | null;
  notes: string | null;
}

interface HistoryContext {
  previousVersions: HistoryVersion[];
  originalStatus: string | null;
  originalOutcome: string | null;
  originalCreatedAt: string | null;
  originalCreatedBy: string | null;
  isReturningClient: boolean;
  totalInteractions: number;
}

interface EmailRequest {
  direction: 'next-meeting' | 'negotiation' | 'closure' | 'post-discovery-prep' | 'post-low-interest' | 'reactivation' | 'proposal-delivery';
  closureOutcome?: 'win' | 'lost';
  formData: {
    companyName: string;
    contactName: string;
    contactEmail: string;
    industry: string;
    teamSize: number;
    workflows: string[];
    challenges: string[];
    timeline: string;
    notes: string;
    transcriptSummary: string;
    sentiment?: {
      interestLevel: 'high' | 'medium' | 'low';
      productFit: 'strong' | 'moderate' | 'weak';
      pricingSensitivity: 'high' | 'medium' | 'low';
      recommendedPricingOption: 'A' | 'A1' | 'B' | 'C';
      pricingRationale: string;
    };
  };
  pricing: {
    setupFee: { min: number; max: number };
    monthlyRetainer: { min: number; max: number };
    annualInvestment: { min: number; max: number };
    potentialSaasSavings?: {
      workflowsToReplace: number;
      teamSize: number;
      ratePerUserPerWorkflow: number;
      monthlySavings: number;
      annualSavings: number;
    };
  };
  manualFees?: {
    setupFee?: number;
    monthlyRetainer?: number;
  };
  effectivePricingOption: 'A' | 'A1' | 'B' | 'C';
  roiCalculations: Array<{
    scenario: { type: string; label: string };
    annualSavings: number;
    roiPercentage: number;
    paybackMonths: number;
  }>;
  voiceAgent?: {
    planName: string;
    monthlyFee: number;
    setupCost: number;
    workflowCount: number;
  };
  historyContext?: HistoryContext | null;
  loadedQuoteId?: string | null;
  proposalUrl?: string;
  accessCode?: string;
  proposalData?: {
    quoteId?: string | null;
    proposalUrl?: string;
    accessCode?: string;
    slotReservationPaymentLink?: string;
  } | null;
}

const getPricingOptionDetails = (option: 'A' | 'A1' | 'B' | 'C', pricing: EmailRequest['pricing'], manualFees?: EmailRequest['manualFees']) => {
  // Use manual fees if available, otherwise fall back to range average
  const setupFee = manualFees?.setupFee || (pricing.setupFee.min + pricing.setupFee.max) / 2;
  const monthlyRetainer = manualFees?.monthlyRetainer || (pricing.monthlyRetainer.min + pricing.monthlyRetainer.max) / 2;
  const isManual = !!(manualFees?.setupFee || manualFees?.monthlyRetainer);
  
  switch (option) {
    case 'A':
      return {
        name: 'Standard Setup',
        description: 'Standard payment structure with milestone-based payments',
        structure: `Setup Fee: $${setupFee.toLocaleString()}${isManual ? ' (confirmed)' : ''} (50% upfront, 20% month 1, 20% month 2, 10% month 3)\nMonthly Retainer: $${monthlyRetainer.toLocaleString()}${isManual ? ' (confirmed)' : ''}/month (begins at UAT)`
      };
    case 'A1':
      return {
        name: 'Pay Full Upfront',
        description: 'Full setup fee paid upfront with no installments',
        structure: `Setup Fee: $${setupFee.toLocaleString()}${isManual ? ' (confirmed)' : ''} (paid in full upfront)\nMonthly Retainer: $${monthlyRetainer.toLocaleString()}${isManual ? ' (confirmed)' : ''}/month (begins at UAT)`
      };
    case 'B':
      return {
        name: 'Quick Start (20% Discount)',
        description: 'Discounted setup with full upfront payment',
        structure: `Setup Fee: $${(setupFee * 0.8).toLocaleString()}${isManual ? ' (confirmed)' : ''} (paid in full upfront - 20% discount)\nMonthly Retainer: $${monthlyRetainer.toLocaleString()}${isManual ? ' (confirmed)' : ''}/month (begins at UAT)`
      };
    case 'C':
      const setupDiscount = setupFee * 0.5;
      const redistributedMonthly = Math.round(monthlyRetainer + (setupDiscount / 24));
      return {
        name: '24-Month Partnership (50% Discount)',
        description: 'Maximum savings with 24-month commitment',
        structure: `Setup Fee: $${(setupFee * 0.5).toLocaleString()}${isManual ? ' (confirmed)' : ''} (paid in full upfront - 50% discount)\nMonthly Retainer: $${redistributedMonthly.toLocaleString()}${isManual ? ' (confirmed)' : ''}/month (includes redistributed setup savings over 24-month contract)`
      };
  }
};

const getDirectionPrompt = (
  direction: string,
  closureOutcome?: string,
  proposalData?: EmailRequest['proposalData'],
  effectivePricingOption?: EmailRequest['effectivePricingOption'],
  proposalUrl?: string,
  accessCode?: string,
) => {
  switch (direction) {
    case 'next-meeting':
      return `Generate a compelling follow-up email to propose a next meeting.

EMAIL STRUCTURE (follow this order):
1. ACKNOWLEDGE THEIR SITUATION (1-2 sentences)
   - Reference a specific pain point or challenge they mentioned
   - Show you understood their unique situation

2. PRESENT THE SOLUTION & PROMISE (2-3 sentences)
   - State clearly what outcome they can expect (be specific with numbers)
   - Connect their challenge directly to how AlfredAI solves it
   - Use concise, outcome-focused language

3. WHY THIS SOLUTION IS RIGHT FOR THEM (2-3 bullet points)
   - Match their specific workflows/challenges to Alfred capabilities
   - Highlight ROI potential specific to their team size and industry
   - Reference any SaaS consolidation opportunities if applicable

4. WHY ALFRED AI IS THE RIGHT PARTNER (2-3 sentences)
   - We specialize in AI automation for businesses like theirs
   - Our approach: discovery → custom solution → measurable results
   - Mention the $5,000 commitment payment that secures their project slot

5. CLEAR NEXT STEP
   - Propose a specific action (demo, deep-dive call, or scoping session)
   - Make it easy to say yes

TONE: Confident but not pushy. Consultative, not salesy. Focus on THEIR outcomes, not our features.`;

    case 'post-discovery-prep':
      return `Generate a professional email to send AFTER an initial intro/setting call, preparing the prospect for a structured Discovery Meeting.

EMAIL STRUCTURE (follow this order):
1. THANK THEM FOR THE INITIAL CALL (2 sentences)
   - Reference something specific discussed in the call
   - Express enthusiasm for learning more about their business

2. CONFIRM THE DISCOVERY SESSION (2-3 sentences)
   - Explain the purpose: a deep-dive to understand their workflows, challenges, and goals
   - Set expectations: this is a collaborative session, not a sales pitch
   - Mention duration (typically 45-60 minutes)

3. WHAT TO EXPECT IN THE DISCOVERY SESSION (bullet points)
   - Walkthrough of their current processes and pain points
   - Exploration of automation opportunities specific to their industry
   - Initial assessment of ROI potential
   - Discussion of their timeline and priorities
   - Q&A and next steps

4. WHAT THEY SHOULD PREPARE (bullet points)
   - List of their most time-consuming manual processes
   - Current tools/systems they use (CRM, ERP, etc.)
   - Key team members who should attend (optional)
   - Any specific workflows they'd like to automate first

5. CONFIRM THE DETAILS
   - Proposed date/time (or ask them to confirm)
   - Meeting link or location
   - Offer to reschedule if needed

TONE: Professional, organized, and helpful. Make them feel prepared and confident about the next step.`;

    case 'post-low-interest':
      return `Generate a graceful follow-up email for a prospect who showed LOW INTEREST during the call but mentioned wanting more information.

EMAIL STRUCTURE (follow this order):
1. THANK THEM FOR THEIR TIME (2 sentences)
   - Acknowledge the call without being overly enthusiastic
   - Show respect for their honesty about their current priorities

2. ACKNOWLEDGE THEIR SITUATION (2 sentences)
   - Reference why now might not be the right time (budget, other priorities, etc.)
   - Show you listened and understood their constraints

3. SHARE VALUE WITHOUT PRESSURE (2-3 sentences + resources)
   - Offer educational resources relevant to their industry/challenges:
     - "I thought you might find our [Industry] automation guide helpful"
     - "Here's a case study from a similar company that faced [challenge]"
     - Link to relevant blog post, whitepaper, or ROI calculator
   - Make it about their education, not about selling

4. LEAVE THE DOOR OPEN (2 sentences)
   - Acknowledge that timing matters
   - Offer to be a resource when they're ready
   - Don't push for another meeting

5. SOFT CLOSE
   - No aggressive call-to-action
   - Simple "feel free to reach out when the timing is right"

RESOURCES TO MENTION (pick 1-2 relevant ones):
- ROI Calculator: ${PAGE_URLS.roiCalculator}
- Case Studies: ${PAGE_URLS.caseStudies}
- Automation Guide: ${PAGE_URLS.guides}

TONE: Gracious, patient, no pressure. Leave them with a positive impression for future consideration.`;

    case 'negotiation':
      return `Generate a professional negotiation email about SOW, terms, and pricing.

EMAIL STRUCTURE (follow this order):
1. REAFFIRM THE VALUE (2 sentences)
   - Remind them of the key outcome they'll achieve
   - Reference their specific challenge and how we'll solve it

2. PRESENT THE INVESTMENT CLEARLY
   - Break down the selected pricing option in simple terms
   - Show the payment structure transparently
   - Include the $5,000 commitment payment requirement

3. JUSTIFY THE VALUE (use their numbers)
   - Present ROI projections with their actual team size/hours
   - Show payback period
   - If applicable, highlight SaaS savings as bonus value

4. ADDRESS CONCERNS PROACTIVELY
   - Based on their pricing sensitivity, acknowledge budget considerations
   - Emphasize value over cost
   - Offer to discuss alternative structures if helpful

5. COLLABORATIVE CLOSE
   - Invite questions or concerns
   - Position next steps as a discussion, not a demand

TONE: Transparent, collaborative, value-focused. Show you're a partner, not a vendor.`;

    case 'closure':
      if (closureOutcome === 'win') {
        return `Generate an enthusiastic sales closure email for a WON deal.

EMAIL STRUCTURE:
1. CELEBRATE THE PARTNERSHIP (2 sentences)
   - Express genuine excitement
   - Acknowledge the journey to get here

2. CONFIRM THE COMMITMENT
   - Recap the selected pricing option
   - Confirm the $5,000 commitment payment to secure their slot
   - Set clear payment expectations

3. SET EXPECTATIONS FOR SUCCESS
   - Outline the onboarding timeline (UAT typically week 3-4)
   - Explain what happens next (discovery call, kickoff meeting)
   - Share what they need to prepare

4. REINFORCE THE PROMISE
   - Remind them of the outcomes they'll achieve
   - Express commitment to their success

TONE: Enthusiastic, professional, reassuring. Make them feel confident they made the right choice.`;
      } else {
        return `Generate a graceful sales closure email for a LOST deal.

EMAIL STRUCTURE:
1. THANK THEM GENUINELY (2 sentences)
   - Appreciate their time and consideration
   - Acknowledge the depth of conversations

2. RESPECT THEIR DECISION
   - Express understanding without being dismissive
   - Don't ask why or try to overcome objections

3. LEAVE VALUE BEHIND
   - Offer a helpful resource, insight, or connection
   - Share something useful regardless of the deal outcome

4. KEEP THE DOOR OPEN
   - Note that circumstances change
   - Express genuine interest in staying connected
   - Offer to be a resource in the future

TONE: Gracious, dignified, relationship-preserving. No bitterness, no desperation.`;
      }

    case 'reactivation':
      return `Generate a warm reactivation email to re-engage a dormant prospect based on previous conversations.

EMAIL STRUCTURE (follow this order):
1. WARM RE-CONNECTION (2-3 sentences)
   - Reference a specific topic or challenge from previous discussions
   - Acknowledge the time that has passed without being guilt-inducing
   - Show genuine interest in how their situation has evolved

2. UPDATE ON WHAT'S NEW AT ALFRED AI (2-3 sentences)
   - Share relevant product updates or new capabilities
   - Mention any new case studies or success stories from similar industries
   - Keep it brief but compelling

3. PERSONALIZED DEMO RECOMMENDATIONS (bullet points with links)
   - Based on their previously discussed workflows, recommend 2-3 relevant demos
   - Format each as: "**[Demo Name]** - [brief description]: [demo URL]"
   - Use these demo URLs: ${PAGE_URLS.demos}?demo=[workflow-id]
   - Common workflow IDs: knowledge-intelligence, voice-agent, email-automation, crm-automation, document-processing, customer-support, lead-qualification, appointment-scheduling
   - Pick demos that match their industry and challenges

4. VALUE REMINDER (2 sentences)
   - Reference their specific ROI potential (if available)
   - Remind them of the pain points they mentioned without being pushy

5. SOFT MEETING REQUEST (2-3 sentences)
   - Propose a brief catch-up call (15-20 minutes)
   - Position it as a check-in, not a sales pitch
   - Offer flexibility on timing

6. NO-PRESSURE CLOSE
   - Keep the door open
   - Make it easy to respond with a simple "yes" or "not now"

DEMO LINK FORMAT (CRITICAL):
- Base URL: ${PAGE_URLS.demos}
- Add workflow ID as query param: ?demo=[workflow-id]
- Example: ${PAGE_URLS.demos}?demo=knowledge-intelligence
- Include 2-3 relevant demo links based on their previously discussed workflows

TONE: Warm, genuine, and low-pressure. This is about re-connecting as a helpful resource, not hard-selling. Show you remember them and their specific situation.`;

    case 'proposal-delivery': {
      const paymentOptionLabel =
        effectivePricingOption === 'A' ? 'Installment Plan (4-part setup)'
        : effectivePricingOption === 'A1' ? 'Full Upfront'
        : effectivePricingOption === 'B' ? 'Standard (Upfront setup)'
        : effectivePricingOption === 'C' ? 'Discounted (10% off upfront)'
        : 'Standard';

      return `Generate a customised proposal delivery email that closely mirrors the structure, tone and cadence of the EXAMPLE below. You MUST adapt every dynamic detail (company name, recipient first name, specific challenges, primary workflow, fees, payment option, proposal URL, access code, slot reservation CTA) to this quote — never copy the example verbatim.

WRITING RULES:
- Use Australian English spelling (customised, modernise, organisation, optimise).
- Address the recipient directly using "you / your". Never say "the client" or "they".
- Short paragraphs (1–3 sentences). Match the cadence of the example.
- Use the EXACT pricing figures provided below — do not invent, round, or estimate. Manual fee overrides are already reflected in those figures.
- Render section labels as bold markdown headings exactly: **Investment Summary**, **Secure Your Production Slot**, **Review Your Proposal**.
- Always include the proposal URL and access code (when provided). They must not be omitted.
- Sign-off must reference scaling into the next chapter, similar to the example.

DYNAMIC DATA TO USE:
- Recipient first name: pull from formData.contactName (first word).
- Company name: formData.companyName.
- Primary challenge / pain points: pull 1–2 specific phrases from formData (pain points, current process notes) and/or historyContext.transcriptSummary. If genuinely unavailable, say "your current manual processes" — do not fabricate specifics.
- Primary workflow: name the most relevant workflow from the selected workflows; otherwise say "operational" workflow.
- Setup Fee: use the provided figure exactly (formatted as A$X,XXX).
- Monthly Retainer: use the provided figure exactly, suffix " (Commencing at UAT)".
- Payment Option label: "${paymentOptionLabel}".
- Proposal URL: insert as markdown — View Your Proposal (URL).
- Access code: render only if provided.
- Slot Reservation CTA: ${proposalData?.slotReservationPaymentLink ? `append a markdown CTA after the next-step paragraph: [⚡ Pay Now & Secure Your Build Slot](${proposalData.slotReservationPaymentLink})` : 'state that the payment link is available inside the proposal — no broken CTA.'}

REQUIRED EMAIL STRUCTURE (follow this order, mirroring the example):

1. Greeting: "Hi {firstName},"

2. Thank-you + context (1 short paragraph)
   - Thank them for the opportunity to discuss the future of {companyName}.
   - Reference 1–2 specific challenges they raised (use their own words where possible) and tie to the outcome they want (e.g. "focus on winning {their target work type}").

3. Proposal intro (1 short paragraph)
   - "I have prepared a customised AI automation proposal for you, specifically designed to solve your {primary challenge} and modernise your {primary workflow} workflow."
   - Mention it includes a detailed breakdown of their customised AlfredAI agent.

4. **Investment Summary** (heading + bullet list, this exact format):
   - Setup Fee: A$X,XXX
   - Monthly Retainer: A$X,XXX (Commencing at UAT)
   - Payment Option: ${paymentOptionLabel}
   - All prices exclude GST.

5. **Secure Your Production Slot** (heading + short paragraph)
   - "To ensure we can begin work within a 1-week lead time, we require a $5,000 Production Slot Reservation."
   - "This deposit is 100% refundable if the project doesn't proceed and is fully deducted from your setup fee."
   - "This secures your place in our queue and kicks off our 2-week PoC build."

6. **Review Your Proposal** (heading + short paragraph + link + access code)
   - "You can access the full details, including technical workflows and implementation timelines, via the link below:"
   - View Your Proposal (${proposalUrl || 'PROPOSAL_URL'})
   - ${accessCode || proposalData?.accessCode ? `Your access code: ${accessCode || proposalData?.accessCode}` : '(Omit access code line if none provided)'}

7. Next step (1 short paragraph)
   - "Your next step is simple: pay the $5,000 Slot Reservation to secure your build slot."
   - ${proposalData?.slotReservationPaymentLink ? `Append CTA on its own line: [⚡ Pay Now & Secure Your Build Slot](${proposalData.slotReservationPaymentLink})` : ''}
   - "Once reserved, our tech team and CTO (Alex T cc'ed) will personally reach out to kick off the project."

8. Sign-off
   - "I look forward to helping {companyName} scale into this next chapter."

EXAMPLE (for tone and structure only — DO NOT copy verbatim):
"""
Hi Andy,

Thank you for the opportunity to discuss the future of Aspect Windows. It was great to dive into your current processes and identify how we can eliminate those "onerous" manual takeoffs to help your team focus on winning high-end architectural jobs.

I have prepared a customised AI automation proposal for you, specifically designed to solve your capacity risks and modernise your drawings-to-estimate workflow. This document includes a detailed breakdown of your customised AlfredAI agent.

**Investment Summary**

- Setup Fee: A$20,000
- Monthly Retainer: A$2,000 (Commencing at UAT)
- Payment Option: Full Upfront
- All prices exclude GST.

**Secure Your Production Slot**

To ensure we can begin work within a 1-week lead time, we require a $5,000 Production Slot Reservation. This deposit is 100% refundable if the project doesn't proceed and is fully deducted from your setup fee. This secures your place in our queue and kicks off our 2-week PoC build.

**Review Your Proposal**

You can access the full details, including technical workflows and implementation timelines, via the link below:

View Your Proposal (https://new.alfredai.bot/proposal/VYA-9LKR-BLZP4)

Your access code: 133049

Your next step is simple: pay the $5,000 Slot Reservation to secure your build slot. Once reserved, our tech team and CTO (Alex T cc'ed) will personally reach out to kick off the project.

I look forward to helping Aspect Windows scale into this next chapter.
"""

TONE: Confident, peer-to-peer, empowering. Create gentle urgency around the production slot without pressure.`;
    }

    default:
      return 'Generate a professional follow-up email.';
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { direction, closureOutcome, formData, pricing, manualFees, effectivePricingOption, roiCalculations, voiceAgent, historyContext, loadedQuoteId, proposalUrl, accessCode, proposalData }: EmailRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const pricingDetails = getPricingOptionDetails(effectivePricingOption, pricing, manualFees);
    const likelyROI = roiCalculations.find(r => r.scenario.type === 'likely');
    
    // Build Voice Agent section if present
    let voiceAgentSection = '';
    if (voiceAgent && (voiceAgent.monthlyFee > 0 || voiceAgent.setupCost > 0)) {
      voiceAgentSection = `
VOICE AGENT PACKAGE:
- Plan: ${voiceAgent.planName}
- Monthly Fee: $${voiceAgent.monthlyFee.toLocaleString()}/month (excl. tax/GST)
- Setup Cost: $${voiceAgent.setupCost.toLocaleString()} (${voiceAgent.workflowCount} workflow${voiceAgent.workflowCount !== 1 ? 's' : ''} × $2,500, excl. tax/GST)
- Includes: AI sales calls, SMS & email follow-ups, calendar integration
`;
    }
    
    // Build engagement history section
    let engagementHistorySection = '';
    if (historyContext && historyContext.isReturningClient) {
      const formatDate = (dateStr: string) => {
        try {
          return new Date(dateStr).toLocaleDateString('en-AU', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          });
        } catch {
          return dateStr;
        }
      };

      engagementHistorySection = `
=== ENGAGEMENT HISTORY (CRITICAL CONTEXT) ===
⚠️ THIS IS A RETURNING CLIENT - Use this history to craft a contextual, step-aware email.

Quote ID: ${loadedQuoteId || 'Unknown'}
Total Interactions: ${historyContext.totalInteractions}
First Contact: ${historyContext.originalCreatedAt ? formatDate(historyContext.originalCreatedAt) : 'Unknown'}
Original Sales Rep: ${historyContext.originalCreatedBy || 'Unknown'}
Current Status: ${historyContext.originalStatus || 'Draft'}
${historyContext.originalOutcome ? `Outcome: ${historyContext.originalOutcome}` : ''}

PREVIOUS INTERACTIONS (most recent first):
${historyContext.previousVersions.length > 0 
  ? historyContext.previousVersions.slice(0, 5).map(v => `
  📅 Version ${v.version} (${formatDate(v.date)})
  Changed by: ${v.changedBy || 'Unknown'}
  ${v.summary ? `Summary: ${v.summary}` : ''}
  ${v.transcriptSummary ? `Meeting Notes: ${v.transcriptSummary.slice(0, 300)}${v.transcriptSummary.length > 300 ? '...' : ''}` : ''}
  ${v.notes ? `Notes: ${v.notes.slice(0, 200)}${v.notes.length > 200 ? '...' : ''}` : ''}
`).join('\n')
  : '  No previous version history available.'
}

SALES STRATEGY GUIDANCE:
- Reference previous conversations and show continuity
- Acknowledge the journey and time invested
- Build on what was discussed before (don't repeat introductory pitches)
- If multiple meetings occurred, mention specific progress made
- Personalize based on accumulated knowledge about this prospect
- Match your approach to their demonstrated interest level and timeline
`;
    }
    
    const contextPrompt = `
You are a professional B2B sales representative for AlfredAI, an AI automation company.
${engagementHistorySection}
PROSPECT INFORMATION:
- Company: ${formData.companyName || 'Not specified'}
- Contact: ${formData.contactName || 'the prospect'}
- Industry: ${formData.industry || 'Not specified'}
- Team Size: ${formData.teamSize} staff
- Timeline: ${formData.timeline === 'not-mentioned' ? 'Not discussed yet - needs follow-up' : formData.timeline || 'Not specified'}

CHALLENGES DISCUSSED:
${formData.challenges.length > 0 ? formData.challenges.map(c => `- ${c}`).join('\n') : '- General automation needs (N/A)'}

WORKFLOWS TO AUTOMATE:
${formData.workflows.length > 0 ? formData.workflows.map(w => `- ${w}`).join('\n') : '- Various business processes (N/A)'}

${formData.transcriptSummary ? `LATEST MEETING SUMMARY:\n${formData.transcriptSummary}` : ''}

${formData.sentiment ? `
PROSPECT SENTIMENT:
- Interest Level: ${formData.sentiment.interestLevel}
- Product Fit: ${formData.sentiment.productFit}
- Pricing Sensitivity: ${formData.sentiment.pricingSensitivity}
` : ''}

SELECTED PRICING OPTION: ${pricingDetails.name}
${pricingDetails.structure}
${manualFees ? '⚠️ NOTE: The above prices are MANUALLY CONFIRMED final amounts. Use these EXACT figures in the email — do NOT use ranges or estimates.' : '(All prices exclude GST for Australian clients / tax for other regions)'}

${pricing.potentialSaasSavings && pricing.potentialSaasSavings.monthlySavings > 0 ? `
POTENTIAL SAAS SAVINGS (Value Proposition):
- ${pricing.potentialSaasSavings.workflowsToReplace} legacy workflows/SaaS products to be replaced
- ${pricing.potentialSaasSavings.teamSize} team members
- Rate: $${pricing.potentialSaasSavings.ratePerUserPerWorkflow}/user/workflow/month
- Monthly savings: $${pricing.potentialSaasSavings.monthlySavings.toLocaleString()}/month
- Annual savings: $${pricing.potentialSaasSavings.annualSavings.toLocaleString()}/year
(Note: These savings are ADDITIONAL to the ROI from labor automation)
` : ''}
${voiceAgentSection}
ROI PROJECTIONS:
${likelyROI ? `- Expected Annual Savings: $${likelyROI.annualSavings.toLocaleString()}
- ROI: ${likelyROI.roiPercentage}%
- Payback Period: ${likelyROI.paybackMonths} months` : '- ROI calculations available upon request'}

${formData.notes ? `ADDITIONAL NOTES:\n${formData.notes}` : ''}

${direction === 'proposal-delivery' && proposalUrl ? `
PROPOSAL DETAILS (CRITICAL FOR THIS EMAIL):
⭐ PROPOSAL URL: ${proposalUrl}
- Quote ID: ${proposalData?.quoteId || loadedQuoteId || 'N/A'}
${accessCode || proposalData?.accessCode ? `- ACCESS CODE: ${accessCode || proposalData?.accessCode}` : ''}

IMPORTANT: The email MUST prominently include:
1. The proposal URL above — format as: **[View Your Proposal](${proposalUrl})** or similar prominent formatting.
2. ${accessCode || proposalData?.accessCode ? `The ACCESS CODE (${accessCode || proposalData?.accessCode}) — clearly mention the client will need this code to access the proposal. Format it prominently, e.g., "Your access code: **${accessCode || proposalData?.accessCode}**"` : 'Note: No access code available yet.'}
3. ${proposalData?.slotReservationPaymentLink ? `A prominent "Pay now and secure your build slot" CTA with this Stripe payment link: **[⚡ Pay Now & Secure Your Build Slot](${proposalData.slotReservationPaymentLink})**. Explain the $5,000 is 100% refundable if the project doesn't proceed, deducted from the setup fee, and secures a 1-week lead time to start with a 2-week PoC build.` : 'Mention the slot reservation payment link is available inside the proposal.'}
This is the main call-to-action - the client should click the link and use their access code to review and accept the proposal.
` : ''}
`;

    const directionPrompt = getDirectionPrompt(direction, closureOutcome, proposalData, effectivePricingOption, proposalUrl, accessCode);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `${contextPrompt}

${directionPrompt}

IMPORTANT FORMATTING RULES:
1. Return a JSON object with these exact fields:
   - "subject": A compelling email subject line that MUST include "AlfredAI" (under 60 characters)
   - "body": The full email body in MARKDOWN format
   - "tone": A brief description of the tone used
   - "keyPoints": An array of 3-4 key points covered in the email

2. CRITICAL: The email subject line MUST contain "AlfredAI" - e.g., "AlfredAI: Your Custom Automation Solution" or "Next Steps with AlfredAI"

3. LANGUAGE: You MUST write in Australian English throughout. Use Australian spelling conventions:
   - "customise" not "customize", "organisation" not "organization", "optimise" not "optimize"
   - "colour" not "color", "favour" not "favor", "centre" not "center"
   - "analyse" not "analyze", "catalogue" not "catalog", "licence" (noun) not "license"
   - "specialised" not "specialized", "recognised" not "recognized"
   - Use "whilst" where appropriate, "towards" not "toward"
   - Currency: AUD with $ symbol (e.g., "$5,000 AUD" or just "$5,000" when context is clear)

4. The email body MUST:
   - Start with a proper greeting using the contact's name (e.g., "Hi [Name]," or "Dear [Name],")
   - Use markdown formatting: **bold** for emphasis, bullet points for lists, etc.
   - Be 150-250 words
   - Include clear paragraph breaks (double newlines)
   - End with a professional signature placeholder "[Your Name]"
   - NOT include the subject line in the body

5. Return ONLY valid JSON, no markdown code blocks or additional text.`
          },
          {
            role: "user",
            content: `Generate the ${direction}${closureOutcome ? ` (${closureOutcome})` : ''} email now.`
          }
        ],
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let emailData;
    try {
      // Clean up potential markdown formatting
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      emailData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse email content");
    }

    // Ensure AlfredAI is in subject - fallback enforcement
    let subject = emailData.subject || "Follow-up from AlfredAI";
    if (!subject.toLowerCase().includes('alfred ai')) {
      subject = `AlfredAI: ${subject}`;
    }

    return new Response(JSON.stringify({
      success: true,
      email: {
        subject: subject,
        body: emailData.body || "Unable to generate email content.",
        tone: emailData.tone || "Professional",
        keyPoints: emailData.keyPoints || []
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating email:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate email"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});