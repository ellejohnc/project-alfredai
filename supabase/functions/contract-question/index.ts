import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = { maxRequests: 30, windowMs: 60 * 60 * 1000 }; // 30 requests per hour

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

// Demo contract context for the AI
const CONTRACT_CONTEXT = `
You are an AI assistant helping to review a construction contract. Here is the contract being analyzed:

CONTRACT: Construction Agreement v3 (47 pages)
PARTIES: Principal (Acme Corp) and Contractor (BuildRight Construction)
VALUE: $2.4 million
PROJECT: Commercial office fitout

KEY CLAUSES IDENTIFIED:
1. Payment Terms (Clause 14.2) - HIGH RISK: Payment within 60 days of invoice (differs from standard 30 days)
2. Liability Limits (Clause 8.1) - UNDER REVIEW: Contractor liability cap at $5M
3. Insurance Requirements (Clause 9.3) - OK: Public liability $20M minimum
4. Termination Clause (Clause 22.1) - UNDER REVIEW: 30 days notice for termination
5. Dispute Resolution (Clause 25.2) - OK: Mediation before arbitration
6. Variations - MISSING: No variation clause present (typically Section 20)

STAKEHOLDERS:
- Principal side: CEO/Director, Construction Manager, Project Manager, Contract Administrator, Legal Counsel
- Contractor side: Director, Bid Manager, Operations Manager, Legal Advisor

COMMENTS/DISCUSSIONS:
- Sarah Chen (Legal Counsel) flagged: "60 days payment is outside standard terms. We should negotiate back to 30 days."
- James Wilson (PM) suggested: "45 days could work as compromise"
- Emma Roberts (Contract Admin) noted: "30 days termination notice seems short for project of this scale"

Answer questions about this contract concisely and helpfully. Reference specific clauses when relevant.
`;

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
    const { question, conversationHistory } = await req.json();
    
    if (!question) {
      return new Response(
        JSON.stringify({ error: "Question is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build messages array with conversation history
    const messages = [
      { role: "system", content: CONTRACT_CONTEXT },
      ...(conversationHistory || []),
      { role: "user", content: question }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "I couldn't generate a response.";

    return new Response(
      JSON.stringify({ answer }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Contract question error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
