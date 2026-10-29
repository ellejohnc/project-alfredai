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
  name: "submit_lead",
  title: "Submit a contact enquiry",
  description:
    "Submit a new contact enquiry / lead to alfred ai. Use when a person wants alfred ai to get in touch about its AI services. Only submit details the person has explicitly provided.",
  inputSchema: {
    firstName: z.string().describe("The person's first name."),
    lastName: z.string().optional().describe("The person's last name."),
    email: z.string().describe("A valid contact email address."),
    company: z.string().optional().describe("Company or organisation name."),
    jobTitle: z.string().optional().describe("The person's role or job title."),
    phone: z.string().optional().describe("Contact phone number."),
    message: z.string().optional().describe("What the person is interested in or their question."),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ firstName, lastName, email, company, jobTitle, phone, message }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated." }], isError: true };
    }
    const trimmedEmail = (email ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return { content: [{ type: "text", text: "A valid email address is required." }], isError: true };
    }
    if (!firstName || !firstName.trim()) {
      return { content: [{ type: "text", text: "A first name is required." }], isError: true };
    }

    const { error } = await userClient(ctx).from("leads").insert({
      first_name: firstName.trim(),
      last_name: lastName?.trim() || "",
      email: trimmedEmail,
      company: company?.trim() || null,
      job_title: jobTitle?.trim() || null,
      phone: phone?.trim() || null,
      message: message?.trim() || null,
      lead_type: "contact",
      lead_source: "mcp",
      source_medium: "mcp",
    });

    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
    return {
      content: [
        {
          type: "text",
          text: "Thanks — your enquiry has been received. The alfred ai team will be in touch shortly.",
        },
      ],
      structuredContent: { submitted: true },
    };
  },
});
