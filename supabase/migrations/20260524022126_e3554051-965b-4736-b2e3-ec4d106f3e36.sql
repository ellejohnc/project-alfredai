ALTER TABLE public.page_engagement
  ADD COLUMN IF NOT EXISTS is_bot boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_page_engagement_is_bot
  ON public.page_engagement (is_bot, landed_at DESC);

CREATE OR REPLACE FUNCTION public.detect_bot_user_agent(ua text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT
    ua IS NULL
    OR length(trim(ua)) = 0
    OR ua ~* '(bot|crawler|spider|scanner|crawling|slurp|curl|wget|python-requests|httpclient|http-client|okhttp|java/|go-http|axios|node-fetch|undici|headless|phantomjs|puppeteer|playwright|selenium|chrome-lighthouse|pagespeed|gtmetrix|pingdom|uptimerobot|statuscake|monitor|preview|semrush|ahrefs|ahrefsbot|dataforseo|petalbot|mj12|dotbot|yandex|baidu|bingbot|googlebot|adsbot|gptbot|chatgpt-user|oai-searchbot|claudebot|anthropic-ai|perplexitybot|bytespider|amazonbot|applebot|meta-externalagent|facebookexternalhit|linkedinbot|twitterbot|slackbot|discordbot|telegrambot|whatsapp|embedly|skypeuripreview|nuzzel|bitlybot|tumblr|vkshare|w3c_validator|qwantify|exabot|seznambot|sogou|coccocbot|mojeekbot|ccbot|cohere-ai|youbot|gemini|searchgpt)';
$$;

CREATE OR REPLACE FUNCTION public.page_engagement_set_is_bot()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.is_bot := public.detect_bot_user_agent(NEW.user_agent);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_page_engagement_set_is_bot ON public.page_engagement;
CREATE TRIGGER trg_page_engagement_set_is_bot
  BEFORE INSERT ON public.page_engagement
  FOR EACH ROW
  EXECUTE FUNCTION public.page_engagement_set_is_bot();

UPDATE public.page_engagement
SET is_bot = public.detect_bot_user_agent(user_agent)
WHERE is_bot = false;

CREATE OR REPLACE VIEW public.bounce_funnel AS
SELECT
  date_trunc('day'::text, landed_at)::date AS day,
  COALESCE(device, 'unknown'::text) AS device,
  count(*) AS sessions,
  count(*) FILTER (WHERE bounced) AS bounces,
  round(100.0 * count(*) FILTER (WHERE bounced)::numeric / NULLIF(count(*), 0)::numeric, 1) AS bounce_rate,
  count(*) FILTER (WHERE ((primary_cta_clicks ->> 'hero_try_demo'::text)::integer) > 0
                      OR ((primary_cta_clicks ->> 'sticky_try_demo'::text)::integer) > 0
                      OR ((primary_cta_clicks ->> 'final_try_demo'::text)::integer) > 0) AS demo_clicks,
  count(*) FILTER (WHERE ((primary_cta_clicks ->> 'hero_book'::text)::integer) > 0
                      OR ((primary_cta_clicks ->> 'sticky_book'::text)::integer) > 0
                      OR ((primary_cta_clicks ->> 'final_book'::text)::integer) > 0) AS book_clicks,
  round(avg(max_scroll_pct), 1) AS avg_scroll_pct,
  round(avg(EXTRACT(epoch FROM last_active_at - landed_at)), 1) AS avg_seconds_on_page
FROM public.page_engagement
WHERE is_bot = false
GROUP BY (date_trunc('day'::text, landed_at)::date), (COALESCE(device, 'unknown'::text))
ORDER BY (date_trunc('day'::text, landed_at)::date) DESC;