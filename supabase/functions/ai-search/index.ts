import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Searchable content - same structure as frontend
const searchableContent = [
  { title: "Home", path: "/", keywords: ["landing", "main", "homepage", "start"], group: "Main Pages" },
  { title: "Products", path: "/products", keywords: ["features", "offerings", "what we offer", "platform"], group: "Main Pages" },
  { title: "Solutions", path: "/solutions", keywords: ["use cases", "industries", "roles"], group: "Main Pages" },
  { title: "Impact Studies", path: "/impact-studies", keywords: ["case studies", "results", "roi", "success"], group: "Main Pages" },
  { title: "Resources", path: "/resources", keywords: ["docs", "help", "learn", "documentation"], group: "Main Pages" },
  { title: "Sign Up", path: "/signup", keywords: ["register", "join", "get started", "trial"], group: "Main Pages" },
  { title: "What is AlfredAI?", path: "/explained/what-is-alfredai", keywords: ["overview", "intro", "about", "explain"], group: "AlfredAI Explained" },
  { title: "System Architecture", path: "/explained/architecture", keywords: ["tech", "infrastructure", "how it works"], group: "AlfredAI Explained" },
  { title: "AI Engines", path: "/explained/ai-engines", keywords: ["models", "ml", "machine learning", "intelligence"], group: "AlfredAI Explained" },
  { title: "Workflow Builder", path: "/explained/workflow-builder", keywords: ["automation", "processes", "build", "create"], group: "AlfredAI Explained" },
  { title: "Integration Layer", path: "/explained/integration-layer", keywords: ["connect", "apis", "integrations", "tools"], group: "AlfredAI Explained" },
  { title: "Security & Compliance", path: "/explained/security", keywords: ["privacy", "gdpr", "soc", "safe", "secure"], group: "AlfredAI Explained" },
  { title: "Case Studies", path: "/impact-studies/case-studies", keywords: ["success stories", "examples", "customers"], group: "Impact & Results" },
  { title: "ROI Breakdowns", path: "/impact-studies/roi-breakdowns", keywords: ["savings", "returns", "cost", "investment"], group: "Impact & Results" },
  { title: "Testimonials", path: "/impact-studies/testimonials", keywords: ["reviews", "feedback", "quotes", "customers say"], group: "Impact & Results" },
  { title: "Reduce Admin Time", path: "/impact-studies/reduce-admin", keywords: ["efficiency", "save time", "less admin"], group: "Impact & Results" },
  { title: "Revenue Per Head", path: "/impact-studies/revenue-per-head", keywords: ["productivity", "revenue", "performance"], group: "Impact & Results" },
  { title: "Scale Without Hiring", path: "/impact-studies/scale-without-hiring", keywords: ["growth", "scale", "expand", "grow"], group: "Impact & Results" },
  { title: "Execution Speed", path: "/impact-studies/execution", keywords: ["speed", "faster", "quick", "performance"], group: "Impact & Results" },
  { title: "Blog", path: "/resources/blog", keywords: ["articles", "posts", "news", "updates"], group: "Resources" },
  { title: "Guides", path: "/resources/guides", keywords: ["tutorials", "how-to", "learn", "education"], group: "Resources" },
  { title: "Webinars", path: "/resources/webinars", keywords: ["videos", "live", "events", "watch"], group: "Resources" },
  { title: "Demos", path: "/resources/demos", keywords: ["try", "interactive", "experience", "test"], group: "Resources" },
  { title: "Voice Agent Demo", path: "/voice-demo", keywords: ["speech", "call", "voice", "talk", "phone"], group: "Live Demos" },
  { title: "Purchase Bill Intake", path: "/demos/purchase-bill-intake", keywords: ["AP", "invoices", "xero", "accounts payable", "bills"], group: "Live Demos" },
  { title: "Site Inspection", path: "/resources/demos#site-inspection", keywords: ["construction", "survey", "inspect"], group: "Live Demos" },
  { title: "Contract Review", path: "/resources/demos#contract-review", keywords: ["legal", "documents", "contracts"], group: "Live Demos" },
  { title: "Fee Proposal", path: "/resources/demos#fee-proposal", keywords: ["pricing", "quotes", "proposal", "cost"], group: "Live Demos" },
  { title: "Auto Invoicing", path: "/resources/demos#auto-invoicing", keywords: ["billing", "payments", "invoice"], group: "Live Demos" },
  { title: "Interview Scoring", path: "/resources/demos#interview-scoring", keywords: ["hiring", "recruitment", "hr", "interview"], group: "Live Demos" },
  { title: "Candidate Matching", path: "/resources/demos#candidate-matching", keywords: ["hr", "talent", "recruitment", "hiring"], group: "Live Demos" },
  { title: "Lead Research", path: "/resources/demos#lead-research", keywords: ["sales", "prospects", "leads", "research"], group: "Live Demos" },
  { title: "CX Agent", path: "/resources/demos#cx-agent", keywords: ["support", "customer", "service", "help"], group: "Live Demos" },
  { title: "Subcontractor Assignment", path: "/resources/demos#subcontractor", keywords: ["vendors", "assign", "contractors"], group: "Live Demos" },
  { title: "Procurement", path: "/resources/demos#procurement", keywords: ["purchasing", "supply", "buy", "orders"], group: "Live Demos" },
  { title: "Pricing", path: "/explained/pricing", keywords: ["cost", "price", "plans", "subscription", "how much", "payment"], group: "Pricing" },
  { title: "Book a Demo", path: "/book-demo", keywords: ["schedule", "meeting", "call", "talk to sales", "contact"], group: "Get Started" },
  { title: "Contact Us", path: "/contact", keywords: ["reach", "email", "support", "help", "question"], group: "Help" },
  { title: "FAQ", path: "/faq", keywords: ["questions", "answers", "help", "common"], group: "Help" },
  { title: "DIY Quote", path: "/diy-quote", keywords: ["quote", "estimate", "pricing", "self-serve", "calculator"], group: "Get Started" },
  // Company
  { title: "About Us", path: "/about", keywords: ["company", "team", "who we are", "about"], group: "Company" },
  { title: "Careers", path: "/careers", keywords: ["jobs", "hiring", "work with us", "employment"], group: "Company" },
  { title: "Press", path: "/press", keywords: ["news", "media", "announcements", "pr"], group: "Company" },
  { title: "Partners", path: "/partners", keywords: ["partner", "affiliate", "reseller", "partnership"], group: "Company" },
  { title: "Investors", path: "/investors", keywords: ["invest", "funding", "vc", "venture capital"], group: "Company" },
  // Compare
  { title: "How We're Different", path: "/compare", keywords: ["comparison", "vs", "alternative", "different"], group: "Compare" },
  { title: "vs Procore", path: "/compare/vs-procore", keywords: ["procore", "construction", "project management"], group: "Compare" },
  { title: "vs Trimble & Aconex", path: "/compare/vs-construction-enterprise", keywords: ["trimble", "aconex", "e-builder", "enterprise"], group: "Compare" },
  { title: "vs BuildTools", path: "/compare/vs-construction-builders", keywords: ["buildtools", "projectsimpel", "builder"], group: "Compare" },
  { title: "vs Jobber", path: "/compare/vs-jobber", keywords: ["jobber", "field service"], group: "Compare" },
  { title: "vs Monday", path: "/compare/vs-monday", keywords: ["monday.com", "project management"], group: "Compare" },
  { title: "vs Notion", path: "/compare/vs-notion", keywords: ["notion", "documentation", "wiki"], group: "Compare" },
  { title: "vs Asana", path: "/compare/vs-asana", keywords: ["asana", "task management"], group: "Compare" },
  { title: "vs ClickUp", path: "/compare/vs-clickup", keywords: ["clickup", "productivity"], group: "Compare" },
  { title: "vs Zapier", path: "/compare/vs-zapier", keywords: ["zapier", "automation", "triggers"], group: "Compare" },
  { title: "vs Make", path: "/compare/vs-make", keywords: ["make", "integromat", "automation"], group: "Compare" },
  { title: "vs n8n", path: "/compare/vs-n8n", keywords: ["n8n", "workflow", "self-hosted"], group: "Compare" },
  { title: "vs Pipedrive", path: "/compare/vs-pipedrive", keywords: ["pipedrive", "crm", "sales"], group: "Compare" },
  { title: "vs GoHighLevel", path: "/compare/vs-gohighlevel", keywords: ["gohighlevel", "ghl", "marketing"], group: "Compare" },
  { title: "vs Lovable", path: "/compare/vs-lovable", keywords: ["lovable", "app building"], group: "Compare" },
  // Legal
  { title: "Privacy Policy", path: "/privacy", keywords: ["privacy", "data", "gdpr", "cookies"], group: "Legal" },
  { title: "Terms of Service", path: "/terms", keywords: ["terms", "tos", "legal", "agreement"], group: "Legal" },
  { title: "Support", path: "/support", keywords: ["help", "assistance", "support", "ticket"], group: "Legal" },
  { title: "Unsubscribe", path: "/unsubscribe", keywords: ["unsubscribe", "email", "opt out", "newsletter"], group: "Legal" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, sessionId, visitorId, deviceType } = await req.json();

    if (!query || typeof query !== "string") {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create system prompt for semantic search
    const systemPrompt = `You are a helpful search assistant for AlfredAI's website. Your job is to understand the user's natural language query and identify which pages would be most relevant to them.

Available pages on the website:
${searchableContent.map(p => `- "${p.title}" (${p.path}): Keywords: ${p.keywords.join(", ")}`).join("\n")}

Based on the user's query, return a JSON array of the most relevant page paths (maximum 5). Consider:
1. Direct keyword matches
2. Semantic meaning (e.g., "how much does it cost" → pricing page)
3. Intent (e.g., "I want to see it in action" → demos)
4. Related topics (e.g., "automation" → workflow builder, demos)

Return ONLY a valid JSON array of paths like: ["/path1", "/path2"]
If no relevant pages found, return: []`;

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Find relevant pages for: "${query}"` },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      
      // Fallback to keyword matching
      const lowerQuery = query.toLowerCase();
      const fallbackResults = searchableContent
        .filter(item =>
          item.title.toLowerCase().includes(lowerQuery) ||
          item.keywords.some(k => k.toLowerCase().includes(lowerQuery))
        )
        .slice(0, 5)
        .map(item => ({
          title: item.title,
          path: item.path,
          group: item.group,
        }));
      
      return new Response(
        JSON.stringify({ results: fallbackResults, aiEnhanced: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";
    
    // Parse AI response - extract JSON array
    let matchedPaths: string[] = [];
    try {
      // Try to extract JSON array from response
      const jsonMatch = content.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        matchedPaths = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, content);
    }

    // Map paths back to full result objects
    const results = matchedPaths
      .map(path => searchableContent.find(item => item.path === path))
      .filter(Boolean)
      .map(item => ({
        title: item!.title,
        path: item!.path,
        group: item!.group,
      }));

    // Log analytics
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Log analytics - don't await to avoid blocking response
    supabase.from("search_analytics").insert({
      query: query.substring(0, 500),
      results_count: results.length,
      ai_enhanced: true,
      session_id: sessionId,
      visitor_id: visitorId,
      device_type: deviceType,
    }).then(({ error }) => {
      if (error) console.error("Failed to log search:", error);
    });

    return new Response(
      JSON.stringify({ results, aiEnhanced: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI search error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
