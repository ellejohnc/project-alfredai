import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = { maxRequests: 15, windowMs: 10 * 60 * 1000 }; // 15 requests per 10 minutes

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

const QUALIFICATION_PROMPT = `You are Alfred, a friendly AI assistant for AlfredAI. You're having a natural qualification conversation with a potential lead during our signup flow.

## Your Goal
Have a genuine conversation to understand if AlfredAI is right for them. You want to either:
1. **Qualify IN**: Understand their needs and guide them to continue the signup
2. **Qualify OUT gracefully**: If they're not a fit, be helpful and suggest alternatives

## Context
The user has shown some hesitation (clicked "I'll think about it" or expressed uncertainty). Your job is to have a natural conversation to understand why and see if you can help.

## Conversation Approach

### If they seem hesitant but curious:
- Ask what's holding them back
- Address concerns directly
- Share a relevant quick win or stat
- Offer low-commitment next steps

### If they have a specific concern:
- Acknowledge it genuinely
- Provide relevant information
- If it's a deal-breaker, be honest about it
- Suggest alternatives if we're not the right fit

### If they're clearly not interested:
- Respect their decision
- Offer helpful resources anyway
- Leave the door open for the future
- Don't be pushy

## Conversation Signals

When the user seems ready to continue, naturally include one of these phrases:
- "Ready to continue?" (triggers continue prompt)
- "Shall we proceed?" (triggers continue prompt)
- "Let's get started" (triggers continue prompt)

When the conversation should end (user not interested):
- "Best of luck with" (signals graceful exit)
- "Feel free to come back" (signals graceful exit)
- "No pressure at all" (signals graceful exit)

## Your Style
- Be conversational, not salesy
- Keep responses to 2-3 sentences max
- Ask only one question at a time
- Be genuinely helpful, even if it means qualifying them out
- Use the visitor's context (industry, company, pain points) if provided

## Key AlfredAI Benefits (use sparingly, when relevant):
- 70% reduction in admin tasks
- Typical ROI in 90 days
- 15+ hours saved per week
- Works with existing tools (no rip-and-replace)
- Industry-specific (construction, property, consulting, etc.)`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting check
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) {
    console.log(`Rate limit exceeded for IP: ${ip.substring(0, 8)}...`);
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again in a few minutes." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { messages, visitorContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ 
        error: "Service temporarily unavailable"
      }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build context-aware system prompt
    let systemPrompt = QUALIFICATION_PROMPT;
    if (visitorContext) {
      systemPrompt += `\n\n## Visitor Context\n`;
      if (visitorContext.name) systemPrompt += `- Name: ${visitorContext.name}\n`;
      if (visitorContext.company) systemPrompt += `- Company: ${visitorContext.company}\n`;
      if (visitorContext.industry) systemPrompt += `- Industry: ${visitorContext.industry}\n`;
      if (visitorContext.teamSize) systemPrompt += `- Team Size: ${visitorContext.teamSize}\n`;
      if (visitorContext.primaryChallenge) systemPrompt += `- Main Challenge: ${visitorContext.primaryChallenge}\n`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "High demand right now. Please try again in a moment."
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Service temporarily unavailable."
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ 
        error: "Failed to get response"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Signup qualify error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
