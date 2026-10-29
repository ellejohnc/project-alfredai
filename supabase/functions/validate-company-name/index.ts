import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyName } = await req.json();

    if (!companyName || typeof companyName !== "string" || companyName.trim().length === 0) {
      return new Response(
        JSON.stringify({ valid: true, suggestion: null, confidence: "skip" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ valid: true, suggestion: null, confidence: "error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
            content: `You are a company name spell-checker. Given a company name, check if the spelling looks correct.

Rules:
- Check for common misspellings of well-known companies (e.g., "Gooogle" → "Google", "Haywood" → "Hayward")
- Check for obvious typos (doubled letters, swapped letters, missing letters)
- If the name looks like a real but uncommon company name, assume it's correct
- If unsure, mark as correct — don't over-correct
- Preserve the original casing style
- Do NOT change abbreviations, acronyms, or intentional stylizations
- Common proper nouns that sound similar should be flagged (e.g., "Haywood" vs "Hayward")`,
          },
          {
            role: "user",
            content: `Check this company name for spelling: "${companyName.trim()}"`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "spell_check_result",
              description: "Return the spell-check result for the company name",
              parameters: {
                type: "object",
                properties: {
                  isCorrect: {
                    type: "boolean",
                    description: "Whether the company name appears to be spelled correctly",
                  },
                  suggestedName: {
                    type: "string",
                    description: "The corrected company name if misspelled, or the original if correct",
                  },
                  confidence: {
                    type: "string",
                    enum: ["high", "medium", "low"],
                    description: "How confident the spell-check is. High = obvious typo, Medium = possible misspelling, Low = uncertain",
                  },
                  reason: {
                    type: "string",
                    description: "Brief explanation of what was found (e.g., 'Common misspelling: Haywood → Hayward')",
                  },
                },
                required: ["isCorrect", "suggestedName", "confidence", "reason"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "spell_check_result" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ valid: true, suggestion: null, confidence: "rate_limited" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI gateway error:", response.status);
      return new Response(
        JSON.stringify({ valid: true, suggestion: null, confidence: "error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(
        JSON.stringify({ valid: true, suggestion: null, confidence: "error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        valid: result.isCorrect,
        suggestion: result.isCorrect ? null : result.suggestedName,
        confidence: result.confidence,
        reason: result.reason,
        original: companyName.trim(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("validate-company-name error:", err);
    return new Response(
      JSON.stringify({ valid: true, suggestion: null, confidence: "error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
