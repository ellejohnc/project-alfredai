import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchBlogPosts from "./tools/search-blog-posts";
import searchFaqs from "./tools/search-faqs";
import listJobOpenings from "./tools/list-job-openings";
import submitLead from "./tools/submit-lead";

// The OAuth issuer MUST be the direct Supabase host, derived from the project ref
// (Vite inlines this at build time, so it stays import-safe). The fallback keeps
// the issuer well-formed during the throwaway manifest-extract eval.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "alfredai-mcp",
  title: "alfred ai MCP",
  version: "0.1.0",
  instructions:
    "Tools for alfred ai, a done-for-you agentic AI service for construction and mid-market businesses. Use `search_blog_posts` and `search_faqs` to answer questions about alfred ai, `list_job_openings` for careers, and `submit_lead` to pass along a contact enquiry when someone wants alfred ai to reach out.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchBlogPosts, searchFaqs, listJobOpenings, submitLead],
});
