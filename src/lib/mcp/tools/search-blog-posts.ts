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
  name: "search_blog_posts",
  title: "Search blog posts",
  description:
    "Search alfred ai's published blog posts by keyword and return matching titles, excerpts, categories and slugs.",
  inputSchema: {
    query: z
      .string()
      .optional()
      .describe("Optional keyword to match against title, excerpt or category."),
    limit: z
      .number()
      .int()
      .optional()
      .describe("Maximum number of posts to return (default 10, max 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated." }], isError: true };
    }
    const max = Math.min(Math.max(limit ?? 10, 1), 25);
    let q = userClient(ctx)
      .from("blog_posts")
      .select("title, slug, excerpt, category, tags, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(max);

    if (query && query.trim()) {
      const term = `%${query.trim()}%`;
      q = q.or(`title.ilike.${term},excerpt.ilike.${term},category.ilike.${term}`);
    }

    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { posts: data ?? [] },
    };
  },
});
