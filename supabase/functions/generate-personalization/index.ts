import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In-memory rate limiting - strict limits for personalization (one-time use per session)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = { maxRequests: 5, windowMs: 60 * 60 * 1000 }; // 5 requests per hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);
  
  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return true;
  }
  
  if (limit.count >= RATE_LIMIT.maxRequests) {
    return false;
  }
  
  limit.count++;
  return true;
}

// Workflow to demo mapping
const WORKFLOW_TO_DEMO: Record<string, string[]> = {
  "Site Inspections": ["site-inspection"],
  "Subcontractor Management": ["subcontractor-assignment"],
  "Contract Review": ["contract-review"],
  "Procurement": ["procurement"],
  "Fee Proposals": ["fee-proposal"],
  "Project Scheduling": ["workflow-builder"],
  "Property Management": ["property-management"],
  "Lease Administration": ["property-management"],
  "Tenant Communications": ["cx-agent", "property-management"],
  "Client Communications": ["cx-agent", "voice-agent"],
  "Knowledge Management": ["knowledge-synthesis"],
  "Time Tracking": ["auto-invoicing"],
  "Knowledge Synthesis": ["knowledge-synthesis"],
  "Lead Research": ["lead-research"],
  "Client Reports": ["fee-proposal", "bi-dashboard"],
  "Document Analysis": ["contract-review", "knowledge-synthesis"],
  "Candidate Screening": ["candidate-match"],
  "Interview Scheduling": ["candidate-match", "voice-agent"],
  "Offer Letters": ["workflow-builder"],
  "Candidate Matching": ["candidate-match"],
  "Background Checks": ["lead-research"],
  "Workflow Automation": ["workflow-builder"],
  "Knowledge Base": ["knowledge-synthesis"],
  "Customer Support": ["cx-agent", "voice-agent"],
  "Documentation": ["knowledge-synthesis"],
  "Incident Management": ["workflow-builder"],
  "Supplier Management": ["procurement", "subcontractor-assignment"],
  "Quality Control": ["site-inspection"],
  "Inventory": ["procurement"],
  "Compliance Reporting": ["bi-dashboard", "workflow-builder"],
  "Invoice Processing": ["auto-invoicing"],
  "Expense Management": ["auto-invoicing"],
  "Compliance": ["contract-review", "workflow-builder"],
  "Audit Preparation": ["bi-dashboard", "workflow-builder"],
  "Report Generation": ["bi-dashboard", "fee-proposal"],
  "Due Diligence": ["contract-review", "lead-research"],
  "Research": ["knowledge-synthesis", "lead-research"],
  "Document Processing": ["contract-review", "workflow-builder"],
  "Invoicing": ["auto-invoicing"],
};

// Challenge to demo mapping
const CHALLENGE_TO_DEMO: Record<string, string[]> = {
  "Too much time on documents & contracts": ["contract-review", "workflow-builder", "knowledge-synthesis"],
  "Hiring/recruitment is too slow": ["candidate-match", "voice-agent"],
  "Client communications are overwhelming": ["cx-agent", "voice-agent", "workflow-builder"],
  "Project coordination is chaotic": ["workflow-builder", "subcontractor-assignment", "bi-dashboard"],
  "Cash flow and invoicing is unpredictable": ["auto-invoicing", "fee-proposal", "bi-dashboard"],
  "Compliance and reporting is manual": ["workflow-builder", "bi-dashboard", "contract-review"],
};

// Industry-based ROI factors
const INDUSTRY_ROI_FACTORS: Record<string, { adminReduction: number; revenueIncrease: number; timeBack: number }> = {
  construction: { adminReduction: 0.65, revenueIncrease: 0.22, timeBack: 15 },
  "real-estate": { adminReduction: 0.70, revenueIncrease: 0.18, timeBack: 12 },
  "real estate": { adminReduction: 0.70, revenueIncrease: 0.18, timeBack: 12 },
  "professional-services": { adminReduction: 0.68, revenueIncrease: 0.25, timeBack: 14 },
  "professional services": { adminReduction: 0.68, revenueIncrease: 0.25, timeBack: 14 },
  consulting: { adminReduction: 0.72, revenueIncrease: 0.28, timeBack: 16 },
  recruitment: { adminReduction: 0.60, revenueIncrease: 0.35, timeBack: 10 },
  technology: { adminReduction: 0.55, revenueIncrease: 0.20, timeBack: 8 },
  manufacturing: { adminReduction: 0.58, revenueIncrease: 0.15, timeBack: 12 },
  "finance/accounting": { adminReduction: 0.65, revenueIncrease: 0.20, timeBack: 14 },
  legal: { adminReduction: 0.70, revenueIncrease: 0.25, timeBack: 15 },
  other: { adminReduction: 0.60, revenueIncrease: 0.20, timeBack: 12 },
};

// Pain level multipliers
const PAIN_LEVEL_MULTIPLIERS: Record<string, number> = {
  "10+ hours/week per person": 1.5,
  "5-10 hours/week per person": 1.2,
  "2-5 hours/week per person": 1.0,
  "Just exploring options": 0.8,
};

// Team size to FTE conversion
const TEAM_SIZE_FTE: Record<string, number> = {
  "1-10": 5,
  "11-50": 25,
  "51-200": 100,
  "201-500": 300,
  "500+": 600,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting check
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) {
    console.log(`Rate limit exceeded for IP: ${ip.substring(0, 8)}...`);
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { sessionId, visitorData } = await req.json();
    
    console.log("Generating personalization for session:", sessionId);
    console.log("Visitor data:", JSON.stringify(visitorData));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Determine recommended demos based on workflows and challenge
    const demoSet = new Set<string>();
    
    // Add demos from selected workflows (highest priority)
    const workflows = visitorData.workflowsToAutomate || [];
    workflows.forEach((workflow: string) => {
      const demos = WORKFLOW_TO_DEMO[workflow];
      if (demos) {
        demos.forEach(d => demoSet.add(d));
      }
    });
    
    // Add demos from primary challenge
    const challenge = visitorData.primaryChallenge || "";
    const challengeDemos = CHALLENGE_TO_DEMO[challenge];
    if (challengeDemos) {
      challengeDemos.forEach(d => demoSet.add(d));
    }
    
    // Fallback: Add demos from legacy pain points
    const painPoints = visitorData.painPoints || [];
    painPoints.forEach((pp: string) => {
      const key = pp.toLowerCase().replace(/\s+/g, "-");
      if (key === "admin-overhead") demoSet.add("auto-invoicing");
      if (key === "document-management") demoSet.add("contract-review");
      if (key === "team-scaling") demoSet.add("candidate-match");
      if (key === "client-experience") demoSet.add("cx-agent");
      if (key === "visibility") demoSet.add("bi-dashboard");
    });
    
    const recommendedDemos = Array.from(demoSet).slice(0, 6);
    console.log("Recommended demos:", recommendedDemos);

    // Calculate ROI inputs with enhanced precision
    const industry = (visitorData.industry || "other").toLowerCase().replace(/\s+/g, "-");
    const roiFactors = INDUSTRY_ROI_FACTORS[industry] || INDUSTRY_ROI_FACTORS["other"];
    const teamSize = visitorData.teamSize || "11-50";
    const fteCount = TEAM_SIZE_FTE[teamSize] || 25;
    const painLevel = visitorData.painLevel || "5-10 hours/week per person";
    const painMultiplier = PAIN_LEVEL_MULTIPLIERS[painLevel] || 1.0;
    const avgSalary = 75000;
    
    // Calculate hours based on pain level
    let hoursPerPersonPerWeek = 5;
    if (painLevel.includes("10+")) hoursPerPersonPerWeek = 12;
    else if (painLevel.includes("5-10")) hoursPerPersonPerWeek = 7.5;
    else if (painLevel.includes("2-5")) hoursPerPersonPerWeek = 3.5;
    
    const roiInputs = {
      teamSize: fteCount,
      industry: visitorData.industry,
      estimatedAdminHours: Math.round(fteCount * hoursPerPersonPerWeek),
      adminReductionPercent: Math.round(roiFactors.adminReduction * 100 * painMultiplier),
      potentialSavings: Math.round(fteCount * avgSalary * 0.15 * roiFactors.adminReduction * painMultiplier),
      revenueIncreasePercent: Math.round(roiFactors.revenueIncrease * 100),
      hoursBackPerWeek: Math.round(roiFactors.timeBack * fteCount / 10 * painMultiplier),
      paybackMonths: painLevel.includes("10+") ? 2 : painLevel.includes("5-10") ? 3 : 4,
      selectedWorkflows: workflows,
      urgencyLevel: painLevel.includes("10+") ? "high" : painLevel.includes("5-10") ? "medium" : "low",
    };

    // Generate personalized content using AI
    const aiPrompt = `You are an AI assistant for AlfredAI, an AI-powered operating system for businesses.

Based on this visitor's profile, generate personalized recommendations:

VISITOR PROFILE:
- Name: ${visitorData.name}
- Company: ${visitorData.company}
- Industry: ${visitorData.industry}
- Team Size: ${visitorData.teamSize}
- Primary Challenge: ${visitorData.primaryChallenge || "Not specified"}
- Workflows to Automate: ${workflows.join(", ") || "Not specified"}
- Pain Level: ${painLevel}
- Timeline: ${visitorData.timeline || "Not specified"}
- Goals: ${(visitorData.goals || []).join(", ")}

Generate a JSON response with:
1. "headline": A personalized headline for their results page (max 10 words, reference their specific challenge)
2. "subheadline": A personalized subheadline explaining what they'll see (max 20 words, mention their selected workflows)
3. "keyBenefits": Array of 3 key benefits specific to their industry and selected workflows (each max 15 words)
4. "roiStatement": A compelling ROI statement based on their team size, pain level, and industry (max 25 words)
5. "cta": A personalized call-to-action for booking a demo (max 8 words)

Make the content specific to their selections - don't be generic. Reference their actual workflows and challenges.

Respond ONLY with valid JSON, no markdown or explanation.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: aiPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI generation failed");
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";
    
    console.log("AI response:", aiContent);

    // Parse AI response
    let personalization;
    try {
      const cleanedContent = aiContent.replace(/```json\n?|\n?```/g, "").trim();
      personalization = JSON.parse(cleanedContent);
    } catch (e) {
      console.error("Failed to parse AI response, using fallback:", e);
      const workflowText = workflows.length > 0 ? workflows.slice(0, 2).join(" and ") : "your workflows";
      personalization = {
        headline: `Transform ${visitorData.company}'s Operations`,
        subheadline: `See how AI can automate ${workflowText} and save your team hours every week`,
        keyBenefits: [
          `Reduce manual work on ${workflowText} by up to ${roiInputs.adminReductionPercent}%`,
          `Save ${Math.round(roiInputs.hoursBackPerWeek)} hours per week across your team`,
          `Increase capacity by ${roiInputs.revenueIncreasePercent}% without new hires`
        ],
        roiStatement: `Your ${teamSize} person team could save $${(roiInputs.potentialSavings / 1000).toFixed(0)}K annually with ${roiInputs.paybackMonths}-month payback`,
        cta: "See Your Custom Demo"
      };
    }

    // Update the session in the database
    const { error: updateError } = await supabase
      .from("visitor_sessions")
      .update({
        personalization,
        recommended_demos: recommendedDemos,
        roi_inputs: roiInputs,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (updateError) {
      console.error("Failed to update session:", updateError);
      throw new Error("Failed to save personalization");
    }

    console.log("Personalization saved successfully");

    return new Response(JSON.stringify({
      success: true,
      sessionId,
      personalization,
      recommendedDemos,
      roiInputs,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-personalization:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
