import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Workflow catalog for AI matching - derived from workflowDefinitions.ts
const workflowCatalog = [
  { id: 'workflow-builder', name: 'Custom Process Automation Builder', keywords: ['automation', 'no-code', 'process', 'workflow', 'custom', 'build', 'create', 'design', 'DIY', 'self-service'] },
  { id: 'knowledge-intelligence', name: 'Document Search & Knowledge Q&A', keywords: ['documents', 'search', 'knowledge', 'Q&A', 'files', 'information', 'find', 'lookup', 'retrieve', 'answers'] },
  { id: 'knowledge-synthesis', name: 'Cross-Document Insights & Synthesis', keywords: ['synthesis', 'insights', 'summaries', 'analysis', 'reports', 'executive', 'cross-reference', 'patterns', 'trends'] },
  { id: 'business-operations', name: 'Operations Workflow Automation', keywords: ['operations', 'workflow', 'approvals', 'accountability', 'tracking', 'reporting', 'process', 'efficiency', 'streamline'] },
  { id: 'consultant-decision-support', name: 'Business Consultant Decision Support', keywords: ['consulting', 'risk analysis', 'pricing', 'fee proposal', 'pre-engagement', 'assessment', 'margins', 'advisory', 'professional services', 'scoping'] },
  { id: 'inventory-asset-tracking', name: 'Inventory & Asset Tracking Agent', keywords: ['inventory', 'assets', 'tracking', 'stock', 'warehouse', 'equipment', 'movement', 'audit', 'location'] },
  { id: 'smart-warehouse', name: 'Warehouse Operations Optimizer', keywords: ['warehouse', 'picking', 'routing', 'logistics', 'fulfillment', 'orders', 'batch', 'WMS', 'distribution'] },
  { id: 'customer-experience', name: 'AI Customer Service Agent', keywords: ['customer', 'service', 'support', 'tickets', 'help', 'queries', 'responses', 'chatbot', 'multichannel', 'experience'] },
  { id: 'butler-voice', name: 'Executive Voice Assistant', keywords: ['assistant', 'voice', 'schedule', 'meetings', 'tasks', 'calendar', 'executive', 'personal', 'hands-free'] },
  { id: 'voice-agent', name: 'Conversational Voice AI Agent', keywords: ['voice', 'phone', 'call', 'conversation', 'speaking', 'audio', 'real-time', 'talk', 'dialogue'] },
  { id: 'voice-operations', name: 'High-Volume Call Automation', keywords: ['calls', 'call center', 'high volume', 'concurrent', 'inbound', 'outbound', 'routing', 'escalation', 'SDR', 'cold calling'] },
  { id: 'marketplace', name: 'Integration & API Connectivity', keywords: ['integrations', 'APIs', 'connectors', 'tools', 'systems', 'connect', 'sync', 'third-party', 'platforms'] },
  { id: 'property-management', name: 'Property Management Voice Agent', keywords: ['property', 'real estate', 'leasing', 'maintenance', 'tenant', 'landlord', 'rent', 'arrears', 'renewals'] },
  { id: 'subcontractor-assignment', name: 'Subcontractor Coordination & Assignment', keywords: ['subcontractor', 'contractor', 'construction', 'trades', 'project', 'assignment', 'coordination', 'job', 'site'] },
  { id: 'rfi-management', name: 'RFI Processing & Response Agent', keywords: ['RFI', 'request for information', 'Procore', 'construction', 'questions', 'responses', 'tracking', 'clarification'] },
  { id: 'fee-proposal', name: 'Proposal Generation & Tracking', keywords: ['proposal', 'fee', 'quote', 'estimate', 'bid', 'pricing', 'drafting', 'client', 'scope'] },
  { id: 'contract-review', name: 'AI Contract Analysis & Risk Detection', keywords: ['contract', 'legal', 'review', 'clauses', 'risk', 'terms', 'agreement', 'compliance', 'redline', 'negotiation'] },
  { id: 'smart-quote-builder', name: 'AI Quote Generation & Pricing', keywords: ['quote', 'quotation', 'RFQ', 'pricing', 'products', 'proposal', 'estimate', 'costing'] },
  { id: 'site-inspection', name: 'Site Inspection & Defect Detection', keywords: ['inspection', 'site', 'defect', 'photos', 'reports', 'quality', 'audit', 'checklist', 'construction', 'safety'] },
  { id: 'procurement', name: 'AI Procurement & Supplier Matching', keywords: ['procurement', 'purchasing', 'supplier', 'vendor', 'sourcing', 'PO', 'purchase order', 'buying', 'spend'] },
  { id: 'tender-management', name: 'Tender Lifecycle Management', keywords: ['tender', 'RFQ', 'RFP', 'bid', 'vendor', 'selection', 'evaluation', 'award', 'supplier portal'] },
  { id: 'candidate-match', name: 'Candidate Matching & Visa Eligibility', keywords: ['candidate', 'recruitment', 'hiring', 'resume', 'CV', 'visa', 'immigration', 'matching', 'talent', 'applicant'] },
  { id: 'interview-scoring', name: 'Interview Analysis & Scoring Agent', keywords: ['interview', 'scoring', 'assessment', 'evaluation', 'hiring', 'candidate', 'recording', 'analysis', 'bias'] },
  { id: 'lead-research', name: 'Lead Research & Prospecting Agent', keywords: ['leads', 'prospecting', 'research', 'outreach', 'cold', 'sales', 'LinkedIn', 'enrichment', 'SDR', 'pipeline'] },
  { id: 'ai-crm-insights', name: 'CRM Intelligence & Deal Forecasting', keywords: ['CRM', 'deals', 'pipeline', 'forecast', 'leads', 'opportunities', 'sales', 'Salesforce', 'HubSpot', 'predictions'] },
  { id: 'auto-invoicing', name: 'Automated Invoicing & Payment Reminders', keywords: ['invoice', 'invoicing', 'billing', 'payment', 'reminders', 'collections', 'AR', 'receivables', 'cash flow'] },
  { id: 'invoice-processing', name: 'Invoice Processing & AP Automation', keywords: ['invoice', 'AP', 'payables', 'processing', 'approval', 'accounting', 'Xero', 'MYOB', 'QuickBooks', 'bills'] },
  { id: 'patient-engagement', name: 'Patient Booking & Engagement Agent', keywords: ['patient', 'booking', 'appointment', 'healthcare', 'medical', 'clinic', 'doctor', 'dental', 'reminder', 'wellness'] },
  { id: 'insurance-broker', name: 'Insurance Broker Automation', keywords: ['insurance', 'broker', 'policy', 'claims', 'underwriting', 'compliance', 'premiums', 'renewals', 'risk'] },
  { id: 'business-matchmaker', name: 'Business Partnership Matching', keywords: ['matching', 'partnerships', 'networking', 'connections', 'business development', 'introductions', 'referrals'] },
  { id: 'law-firm-os', name: 'Legal Operations & Case Management', keywords: ['legal', 'law firm', 'case', 'matter', 'lawyer', 'attorney', 'litigation', 'compliance', 'billing'] },
  { id: 'trades-platform', name: 'Trades Business Automation (TradeFlow)', keywords: ['trades', 'painter', 'plumber', 'electrician', 'quote', 'booking', 'payments', 'jobs', 'tradesman'] },
  { id: 'event-seating', name: 'Event Seating & Planning Agent', keywords: ['event', 'seating', 'wedding', 'conference', 'gala', 'table', 'guests', 'planning', 'floor plan'] },
  { id: 'drawings-to-estimate', name: 'Drawings to Draft Estimate', keywords: ['drawings', 'estimate', 'estimating', 'quantity', 'takeoff', 'take-off', 'material takeoff', 'QS', 'BOQ', 'bill of quantities', 'PDF drawings', 'scan drawings', 'PDF plans', 'quantity surveyor', 'measurement', 'extraction', 'scope of works', 'construction'] },
  { id: 'purchase-bill-intake', name: 'Purchase & Bill Intake Agent', keywords: ['purchase', 'bill', 'intake', 'receipt', 'expense', 'OCR', 'scan', 'accounts payable'] },
  { id: 'timber-flooring-quote', name: 'AlfredFloors AI Quote Builder', keywords: ['flooring', 'timber', 'hardwood', 'floor', 'installation', 'sanding', 'coating', 'renovation'] },
  { id: 'technical-report-agent', name: 'Technical Report Generation Agent', keywords: ['report', 'technical', 'inspection', 'engineering', 'assessment', 'findings', 'compliance', 'certification'] },
];

// Generate workflow catalog string for AI prompt
const workflowCatalogPrompt = workflowCatalog.map(w => 
  `- ${w.id}: "${w.name}" | Keywords: ${w.keywords.join(', ')}`
).join('\n');

// Valid workflow IDs for enum
const validWorkflowIds = workflowCatalog.map(w => w.id);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript } = await req.json();
    
    if (!transcript || typeof transcript !== 'string') {
      return new Response(
        JSON.stringify({ error: "Transcript is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert sales analyst. Extract structured information from meeting transcripts to help generate quotes and assess deal potential.

AVAILABLE AI AGENT WORKFLOWS:
Match the transcript content to these workflows based on keywords, pain points, and business context.
${workflowCatalogPrompt}

WORKFLOW SELECTION RULES:
1. Match based on keywords mentioned in the transcript (e.g., "invoices", "procurement", "candidates")
2. Match based on pain points that align with workflow solutions
3. Match based on industry/business context
4. Only include workflows that are clearly relevant - be conservative
5. Return the workflow ID (e.g., "invoice-processing", "lead-research")

Extract and return a JSON object with these fields:
- companyName: string (company name if mentioned)
- contactName: string (main contact's name if mentioned)
- contactEmail: string | null (ONLY if an email address is EXPLICITLY mentioned in the transcript - look for exact @domain.com patterns like "my email is john@company.com", "reach me at name@example.com", "send it to email@domain.com". DO NOT guess or construct email addresses from names. Return null if no email is explicitly stated.)
- industry: string (one of: general, construction, professional_services, manufacturing, finance, healthcare, retail, technology)
- teamSize: number (estimated team size, default 10 if unclear)
- teamSizeConfidence: string (one of: explicit, inferred, unknown) - how certain we are about team size
- hoursPerWeekOnAdmin: number (estimated hours per person per week on manual/repetitive work, default 15)
- hoursPerWeekConfidence: string (one of: explicit, inferred, unknown) - how certain we are about hours
- workflows: string[] (array of workflow IDs from the catalog above - MUST match exact IDs)
- challenges: string[] (array from EXACT list below, match based on keywords/themes detected)
- timeline: string (one of: immediate, next-quarter, next-6-months, exploring, not-mentioned)
- timelineConfidence: string (one of: explicit, inferred, unknown) - SEE RULES BELOW
- summary: string (A detailed bullet-point summary written from AlfredAI's perspective using "we learned" / "we heard" framing. Format as bullet points using "• " prefix. Each section heading should be bold with **. The summary MUST be comprehensive — at least 8-12 bullet points total across ALL six dimensions below. Be specific, reference actual details from the transcript, and elaborate on each point.

  MUST cover ALL of the following dimensions with at least 1-2 bullet points each:

  **Your Goal & Desired Outcome**
  • What you want to achieve and the end-state you're working toward
  • Any specific KPIs, targets, or success metrics mentioned

  **Your Current Process & Effort**
  • How you currently handle the workflow, step by step
  • How many people are involved and how much time they spend
  • What tools or systems you currently rely on

  **Why You're Exploring AI & Automation**
  • The specific triggers or pain points driving this initiative
  • What's at stake if you don't automate (cost, speed, competitive risk)

  **Opportunities Unlocked**
  • What becomes possible once automation is in place
  • Revenue growth, capacity gains, or strategic advantages you stand to unlock
  • How your team's time gets redirected to higher-value work

  **Why a Custom AlfredAI Agent Is the Right Fit**
  • Why your workflow needs a tailored executable agent, not a generic off-the-shelf tool
  • Specific complexities in your process that require custom logic or domain expertise

  **What Makes Your Business & Workflow Unique**
  • Industry-specific nuances, proprietary processes, or unusual data flows
  • Competitive differentiators that a custom agent can amplify

  CRITICAL PRONOUN RULES: ALWAYS address the client as "you" / "your" — NEVER use third-person pronouns like "they", "their", "them", or "the client". Write as if speaking directly to the client. For example: "You need a proof of concept" NOT "They need a proof of concept". "Your team is prepared" NOT "They are prepared".
  Use empowering, goal-oriented language throughout. Say "needs" not "struggles with", "managing high volumes" not "overwhelmed by", "ready to streamline" not "drowning in". Never imply the client is failing.)

TEAM SIZE DETECTION RULES:
- teamSizeConfidence: How certain we are about the team size
  - "explicit": Team size was directly stated in the conversation
    Examples: "We have 50 employees", "Our team is about 25 people", "There are 10 of us"
  - "inferred": No direct mention, but reasonably inferred from context
    Examples: Mentions departments, job titles, hiring plans suggesting size
    Small company language → likely 5-20
    Mid-size with departments → likely 20-100
    Enterprise language → likely 100+
  - "unknown": No indicators found, use default of 10

HOURS/ADMIN WORK DETECTION RULES:
- hoursPerWeekConfidence: How certain we are about manual work hours
  - "explicit": Hours were directly mentioned
    Examples: "We spend 20 hours a week on data entry", "Half my day is manual work"
  - "inferred": Estimated from pain points and context
    Examples: Heavy mentions of manual processes → likely 20-30 hrs
    Some admin complaints → likely 10-20 hrs
    Minimal manual work mentioned → likely 5-10 hrs
  - "unknown": No indicators found, use default of 15

TIMELINE DETECTION RULES:
- timeline: The detected or inferred timeline
- timelineConfidence: How certain we are about the timeline
  - "explicit": Timeline was directly stated in the conversation
    Examples: "We want to start next month", "Looking at Q2 implementation", "This is urgent, need it ASAP", "We have budget allocated for January"
  - "inferred": No direct mention, but reasonably inferred from context/tone/urgency
    Examples: High interest + asking implementation details → likely "immediate" or "next-quarter"
    Exploratory questions only, no urgency → likely "exploring"
    Mentions upcoming events/deadlines → infer based on those
  - "unknown": No timeline indicators found at all, use "not-mentioned" for timeline

INFERENCE LOGIC (when timelineConfidence = "inferred"):
- High interest + urgent tone + implementation questions → "immediate"
- High interest + mentions budget/planning → "next-quarter"
- Medium interest + exploratory questions → "next-6-months" or "exploring"
- Low engagement or just gathering info → "exploring"
- No indicators at all → timeline = "not-mentioned", timelineConfidence = "unknown"

SENTIMENT ANALYSIS (assess based on conversation tone, questions, objections):
- interestLevel: string (one of: high, medium, low)
  - high: Prospect asks detailed implementation questions, discusses timelines, mentions budget, shows urgency
  - medium: Engaged in conversation, asks clarifying questions, but non-committal on next steps
  - low: Skeptical tone, many objections, disengaged, short responses
  
- productFit: string (one of: strong, moderate, weak)
  - strong: Clear pain points that match our solutions, prospect explicitly sees value
  - moderate: Some relevant pain points, but also needs we may not fully address
  - weak: Pain points don't align well with automation/AI solutions
  
- pricingSensitivity: string (one of: high, medium, low)
  - high: Multiple mentions of budget constraints, asks about discounts, compares to cheaper alternatives
  - medium: Asks about pricing but focuses more on value/ROI, normal price negotiations
  - low: Rarely mentions price, focuses on capabilities and outcomes, budget not a concern

- recommendedPricingOption: string (one of: A, B, C)
  OPTION LOGIC:
  - Option A (Normal): High interest + strong product fit + low/medium pricing sensitivity. Standard terms work.
  - Option B (20% Discount Upfront): Medium-high interest + moderate-strong fit + high pricing sensitivity. They need a deal to move forward.
  - Option C (50% Discount + 24mo Contract): Any interest level + budget-constrained BUT long-term committed. They want maximum savings and are willing to commit for 2 years. Setup discount is redistributed into monthly retainer.

- pricingRationale: string (1-2 sentences explaining why this pricing option is recommended)

VOICE AGENT DETECTION:
- voiceAgentNeeded: boolean (true if any voice/calling needs detected)
- voiceAgentPlanRecommendation: string (one of: starter, growth, scale, enterprise-10k, enterprise-20k, payg, or null)
- voiceAgentRationale: string (1-2 sentences explaining recommendation)

VOICE AGENT PLAN LOGIC:
- starter ($99/mo): Small volume, <250 min/month calls, basic needs
- growth ($259/mo): Medium volume, 250-1500 min/month, growing team
- scale ($499/mo): High volume, 1500-3000 min/month, established sales team
- enterprise-10k ($3200/mo): Very high volume, 10K+ min/month
- enterprise-20k ($3900/mo): Enterprise scale, 20K+ min/month
- payg ($0.40/min): Uncertain volume, testing phase, or project-based

Voice agent keywords: phone calls, outbound calling, cold calling, voice AI, call automation, appointment setting, sales calls, lead calls, phone follow-up, SMS campaigns, text follow-up, call center, SDR automation

CHALLENGE MAPPING (use EXACT strings from list):
- Data entry, manual input, typing, spreadsheets, copy-paste → "Too much manual data entry"
- Response time, slow replies, lead follow-up delays, missing leads → "Slow response times to leads"
- Proposals, quotes, inconsistent quality, formatting issues → "Inconsistent proposal quality"
- Scaling, growth challenges, capacity limits, can't keep up → "Difficulty scaling operations"
- Admin burden, overhead, back-office time, paperwork → "High admin overhead"
- Documents, filing, lost files, version control, finding files → "Document chaos"
- Visibility, tracking, project status, reporting, dashboards → "Poor visibility into projects"
- Customer service, support tickets, bottlenecks, slow support → "Customer service bottlenecks"
- Compliance, regulations, audits, privacy, security concerns → "Compliance concerns"
- Multiple tools, fragmented systems, integrations, switching apps → "Tool fragmentation"

Only include fields you can confidently extract. Be conservative with estimates.

CURRENT TECH STACK DETECTION:
Extract any mentions of software, platforms, tools, or systems the prospect currently uses.
For each detected system, identify:
- name: The tool/platform name (e.g., "Salesforce", "HubSpot", "SAP", "Excel spreadsheets")
- category: One of: CRM, ERP, Communication, Project Management, Accounting, Storage, Custom/Legacy, Other
- integrationNeed: How we should approach this system:
  - "integrate": Keep and connect to (works well, they like it)
  - "replace": They want to move away from it (pain points, complaints)
  - "augment": Add AI capabilities on top (enhance, automate)
- notes: Brief context (e.g., "frustrated with manual entry", "using for 5 years")

Tech stack keywords to look for:
- CRM: Salesforce, HubSpot, Pipedrive, Zoho, Monday, Freshworks
- ERP: SAP, Oracle, NetSuite, Microsoft Dynamics, MYOB, Sage
- Communication: Slack, Teams, Zoom, Google Meet, Outlook
- PM: Asana, Monday, Jira, Trello, ClickUp, Basecamp
- Accounting: Xero, QuickBooks, MYOB, FreshBooks, Wave
- Storage: Google Drive, Dropbox, SharePoint, Box
- Custom/Legacy: Spreadsheets, Excel, manual processes, paper-based, custom-built, in-house system`;

    const models = ["openai/gpt-5-mini", "google/gemini-3-flash-preview", "google/gemini-2.5-flash", "openai/gpt-5", "google/gemini-2.5-pro"];
    
    const requestBody = (model: string) => JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this meeting transcript and extract structured information:\n\n${transcript}` },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_meeting_info",
            description: "Extract structured information from a meeting transcript",
            parameters: {
              type: "object",
              properties: {
                companyName: { type: "string" },
                contactName: { type: "string" },
                contactEmail: { 
                  type: "string",
                  description: "Email address ONLY if explicitly mentioned in transcript with @domain pattern. Return empty string if not explicitly stated."
                },
                industry: { 
                  type: "string", 
                  enum: ["general", "construction", "professional_services", "manufacturing", "finance", "healthcare", "retail", "technology"]
                },
                teamSize: { type: "number" },
                teamSizeConfidence: {
                  type: "string",
                  enum: ["explicit", "inferred", "unknown"],
                  description: "How confident we are about the team size extraction"
                },
                hoursPerWeekOnAdmin: { 
                  type: "number",
                  description: "Estimated hours per person per week on manual/repetitive work"
                },
                hoursPerWeekConfidence: {
                  type: "string",
                  enum: ["explicit", "inferred", "unknown"],
                  description: "How confident we are about the hours estimate"
                },
                workflows: { 
                  type: "array", 
                  items: { 
                    type: "string",
                    enum: validWorkflowIds
                  }
                },
                challenges: { 
                  type: "array", 
                  items: { 
                    type: "string",
                    enum: [
                      "Too much manual data entry",
                      "Slow response times to leads",
                      "Inconsistent proposal quality",
                      "Difficulty scaling operations",
                      "High admin overhead",
                      "Document chaos",
                      "Poor visibility into projects",
                      "Customer service bottlenecks",
                      "Compliance concerns",
                      "Tool fragmentation"
                    ]
                  }
                },
                timeline: { 
                  type: "string",
                  enum: ["immediate", "next-quarter", "next-6-months", "exploring", "not-mentioned"]
                },
                timelineConfidence: {
                  type: "string",
                  enum: ["explicit", "inferred", "unknown"]
                },
                summary: { type: "string" },
                interestLevel: {
                  type: "string",
                  enum: ["high", "medium", "low"]
                },
                productFit: {
                  type: "string",
                  enum: ["strong", "moderate", "weak"]
                },
                pricingSensitivity: {
                  type: "string",
                  enum: ["high", "medium", "low"]
                },
                recommendedPricingOption: {
                  type: "string",
                  enum: ["A", "B", "C"]
                },
                pricingRationale: { type: "string" },
                voiceAgentNeeded: { type: "boolean" },
                voiceAgentPlanRecommendation: {
                  type: "string",
                  enum: ["starter", "growth", "scale", "enterprise-10k", "enterprise-20k", "payg"]
                },
                voiceAgentRationale: { type: "string" },
                currentTechStack: {
                  type: "array",
                  description: "Software and systems currently used by the prospect. Each item has name (string), category (CRM|ERP|Communication|Project Management|Accounting|Storage|Custom/Legacy|Other), integrationNeed (integrate|replace|augment), and optional notes (string).",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      category: { type: "string" },
                      integrationNeed: { type: "string" },
                      notes: { type: "string" }
                    }
                  }
                }
              },
              required: ["summary", "timeline", "timelineConfidence"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "extract_meeting_info" } },
    });

    let response: Response | null = null;
    let lastError = "";
    const MODEL_TIMEOUT_MS = 25000; // 25s per model attempt
    
    for (const model of models) {
      console.log(`Trying model: ${model}`);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);
        
        response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: requestBody(model),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`Success with model: ${model}`);
          break;
        }
        
        const errorText = await response.text();
        console.error(`Model ${model} failed:`, response.status, errorText);
        lastError = `${model}: ${response.status} ${errorText}`;
        
        // Don't retry on rate limit
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        response = null; // Reset so we try next model
      } catch (fetchErr) {
        const isTimeout = fetchErr instanceof DOMException && fetchErr.name === 'AbortError';
        console.error(`Model ${model} ${isTimeout ? 'timed out' : 'fetch error'}:`, fetchErr);
        lastError = `${model}: ${isTimeout ? 'timeout' : fetchErr}`;
        response = null;
      }
    }

    if (!response || !response.ok) {
      console.error("All models failed. Last error:", lastError);
      throw new Error(`AI gateway error: all models failed. Last: ${lastError}`);
    }

    const data = await response.json();
    
    // Check if the AI gateway returned an error in the response body
    if (data.error) {
      console.error("AI gateway returned error in body:", JSON.stringify(data.error));
      const errorMessage = data.error.message || "AI service temporarily unavailable";
      return new Response(
        JSON.stringify({ error: `AI analysis failed: ${errorMessage}. Please try again.` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("AI response structure:", JSON.stringify({
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      messageKeys: data.choices?.[0]?.message ? Object.keys(data.choices[0].message) : [],
      hasToolCalls: !!data.choices?.[0]?.message?.tool_calls,
      toolCallsLength: data.choices?.[0]?.message?.tool_calls?.length,
      hasContent: !!data.choices?.[0]?.message?.content,
      finishReason: data.choices?.[0]?.finish_reason,
    }));
    
    // Extract the function call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      console.log("Found tool call response");
      const extractedInfo = JSON.parse(toolCall.function.arguments);
      return new Response(
        JSON.stringify(extractedInfo),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback: try to parse content as JSON
    const content = data.choices?.[0]?.message?.content;
    console.log("Checking content fallback, content exists:", !!content, "content length:", content?.length);
    
    if (content) {
      try {
        // First, try to extract JSON from markdown code blocks (```json ... ``` or ``` ... ```)
        const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
        const match = content.match(codeBlockRegex);
        const cleanedContent = match ? match[1].trim() : content.trim();
        
        const parsed = JSON.parse(cleanedContent);
        return new Response(
          JSON.stringify(parsed),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch {
        // If still can't parse, create minimal response with cleaned summary
        // Strip any remaining markdown/JSON formatting for display
        let cleanSummary = content
          .replace(/```(?:json)?/g, '')
          .replace(/```/g, '')
          .replace(/^[\s\n]+|[\s\n]+$/g, '');
        
        // Try to extract summary field if the content looks like JSON
        try {
          const jsonMatch = cleanSummary.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const innerParsed = JSON.parse(jsonMatch[0]);
            if (innerParsed.summary && typeof innerParsed.summary === 'string') {
              cleanSummary = innerParsed.summary;
            }
          }
        } catch {
          // Keep the cleaned string
        }
        
        // Limit length for display
        if (cleanSummary.length > 500) {
          cleanSummary = cleanSummary.substring(0, 500) + '...';
        }
        
        return new Response(
          JSON.stringify({ summary: cleanSummary, timeline: 'not-mentioned', timelineConfidence: 'unknown' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Log full response for debugging when we hit the "No valid response" case
    console.error("No valid response structure. Full response:", JSON.stringify(data).substring(0, 1000));
    throw new Error("No valid response from AI");
  } catch (error) {
    console.error("Error analyzing transcript:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to analyze transcript" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
