import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { requireAdmin } from "../_shared/ghlClient.ts";

/**
 * AI-assisted drafting for the content editor.
 *
 * THE ONE THING THIS FUNCTION DOES NOT DO IS WRITE. It returns text to the
 * person who asked for it and touches no table, so nothing it produces can
 * reach the public site without an editor reading it, keeping it, and pressing
 * publish. That was the explicit condition on building it at all, and it is
 * enforced here by there being no write path rather than by a flag someone
 * could flip.
 *
 * ADMIN ONLY, and not because the output is sensitive — because each call costs
 * money. An open endpoint that spends per request is a bill someone else gets
 * to write. `requireAdmin` is the same check the other privileged functions use.
 *
 * It runs on the Lovable AI gateway, the pattern already established by
 * generate-sales-email and generate-personalization, so no new key and no new
 * vendor. If LOVABLE_API_KEY is absent this fails loudly rather than silently
 * returning an empty draft that reads like the model had nothing to say.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** What each content type actually is, so the draft arrives in the right shape. */
const SHAPES: Record<string, string> = {
  blog: "a blog article with a clear argument and concrete examples",
  guide: "a practical how-to guide a reader can follow step by step",
  webinar: "a session description covering who it is for and what they will leave knowing",
  documentation: "a reference page: precise, scannable, no persuasion",
  faq: "a direct answer to one question, no preamble",
  testimonial: "a short client quote in plain first-person speech",
  job: "a role description covering the work, the person and the team",
};

interface DraftRequest {
  contentType?: string;
  topic?: string;
  brief?: string;
  /** Existing text to work from, when the editor wants a rewrite rather than a blank page. */
  existing?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const auth = await requireAdmin(req, supabase);
    if (!auth.ok) return json({ error: auth.error }, 401);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Loud, not empty. A missing key returning a blank draft looks like a
      // model that had nothing to say, and someone would retry it all day.
      console.error("LOVABLE_API_KEY is not configured — cannot draft.");
      return json({ error: "AI drafting is not configured on this project." }, 503);
    }

    const body: DraftRequest = await req.json().catch(() => ({}));
    const contentType = (body.contentType ?? "blog").toLowerCase();
    const topic = (body.topic ?? "").trim();
    const brief = (body.brief ?? "").trim();
    const existing = (body.existing ?? "").trim();

    if (!topic && !existing) {
      return json({ error: "Give it a topic, or some existing text to work from." }, 400);
    }

    const shape = SHAPES[contentType] ?? SHAPES.blog;

    const system = [
      "You write for AlfredAI, which builds and runs AI agents for construction and",
      "professional services firms. Audience: owners and operators, not engineers.",
      "",
      "Write plainly. No hype, no 'unlock', no 'revolutionise', no em-dash-heavy",
      "throat-clearing. Prefer a concrete number or example over an adjective. If",
      "you do not know a figure, leave a clearly marked [FIGURE] placeholder rather",
      "than inventing one — an invented statistic in published copy is worse than a",
      "gap, because nobody knows to check it.",
      "",
      "Return JSON only, with exactly these keys: title, excerpt, content.",
      "`content` is HTML using only <h2> <h3> <p> <ul> <li> <strong> <em>.",
      "`excerpt` is one sentence, under 160 characters.",
    ].join("\n");

    const user = [
      `Write ${shape}.`,
      topic ? `Topic: ${topic}` : "",
      brief ? `Brief: ${brief}` : "",
      existing ? `Work from this existing text rather than starting fresh:\n${existing.slice(0, 6000)}` : "",
    ].filter(Boolean).join("\n\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`AI gateway ${res.status}: ${detail.slice(0, 300)}`);
      // 429 and 402 are worth telling the editor apart from a fault: one means
      // wait, the other means the credits ran out, and "something went wrong"
      // sends them to me for both.
      const message = res.status === 429
        ? "The AI gateway is rate limiting. Try again shortly."
        : res.status === 402
          ? "AI credits are exhausted on this workspace."
          : "The AI gateway refused the request.";
      return json({ error: message, status: res.status }, 502);
    }

    const payload = await res.json();
    const raw = payload?.choices?.[0]?.message?.content ?? "";

    let draft: { title?: string; excerpt?: string; content?: string };
    try {
      draft = JSON.parse(raw);
    } catch {
      // Asked for JSON and got prose. Hand back what came so the editor can use
      // it rather than losing a paid call to a parse error.
      console.warn("Model did not return JSON; returning raw text as content.");
      draft = { content: String(raw) };
    }

    return json({
      draft: {
        title: draft.title ?? "",
        excerpt: draft.excerpt ?? "",
        content: draft.content ?? "",
      },
      // Stated in the response, not just in a comment, so any future caller can
      // see this is a suggestion and not a saved record.
      saved: false,
      note: "Draft only — nothing has been written to the database.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("generate-content-draft failed:", message);
    return json({ error: "Draft failed." }, 500);
  }
});
