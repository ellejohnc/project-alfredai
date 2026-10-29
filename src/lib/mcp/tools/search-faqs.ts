import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function userClient(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "search_faqs",
  title: "Search FAQs",
  description:
    "Search alfred ai's published FAQs by keyword and return matching questions and answers.",
  inputSchema: {
    query: z
      .string()
      .optional()
      .describe("Optional keyword to match against the question, answer or category."),
    limit: z
      .number()
      .int()
      .optional()
      .describe("Maximum number of FAQs to return (default 15, max 40)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated." }], isError: true };
    }
    const max = Math.min(Math.max(limit ?? 15, 1), 40);
    let q = userClient(ctx)
      .from("faqs")
      .select("question, answer, category")
      .eq("status", "published")
      .order("sort_order", { ascending: true })
      .limit(max);

    if (query && query.trim()) {
      const term = `%${query.trim()}%`;
      q = q.or(`question.ilike.${term},answer.ilike.${term},category.ilike.${term}`);
    }

    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { faqs: data ?? [] },
    };
  },
});
