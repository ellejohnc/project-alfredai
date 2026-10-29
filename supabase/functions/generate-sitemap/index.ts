import { createClient } from "npm:@supabase/supabase-js@2";
import { PRODUCTION_URL } from "../_shared/config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_URL = PRODUCTION_URL;

// Static pages with their priority and change frequency
const staticPages = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/solutions', priority: '0.9', changefreq: 'weekly' },
  { path: '/products', priority: '0.9', changefreq: 'weekly' },
  { path: '/resources', priority: '0.8', changefreq: 'weekly' },
  { path: '/resources/blog', priority: '0.8', changefreq: 'daily' },
  { path: '/resources/guides', priority: '0.8', changefreq: 'weekly' },
  { path: '/resources/webinars', priority: '0.7', changefreq: 'weekly' },
  { path: '/resources/demos', priority: '0.8', changefreq: 'weekly' },
  { path: '/explained', priority: '0.7', changefreq: 'monthly' },
  { path: '/pricing', priority: '0.8', changefreq: 'monthly' },
  { path: '/roi-calculator', priority: '0.8', changefreq: 'monthly' },
  { path: '/faq', priority: '0.6', changefreq: 'monthly' },
  { path: '/contact', priority: '0.7', changefreq: 'monthly' },
  { path: '/book', priority: '0.8', changefreq: 'monthly' },
  { path: '/book-demo', priority: '0.8', changefreq: 'monthly' },
  { path: '/support', priority: '0.5', changefreq: 'monthly' },
  { path: '/documentation', priority: '0.7', changefreq: 'weekly' },
  // Company pages
  { path: '/about', priority: '0.6', changefreq: 'monthly' },
  { path: '/careers', priority: '0.6', changefreq: 'weekly' },
  { path: '/partners', priority: '0.6', changefreq: 'monthly' },
  { path: '/press', priority: '0.5', changefreq: 'monthly' },
  // Impact pages
  { path: '/impact-studies', priority: '0.7', changefreq: 'weekly' },
  { path: '/impact-studies/case-studies', priority: '0.7', changefreq: 'weekly' },
  { path: '/impact-studies/testimonials', priority: '0.6', changefreq: 'weekly' },
  { path: '/impact-studies/roi-breakdowns', priority: '0.6', changefreq: 'monthly' },
  { path: '/impact-studies/execution', priority: '0.6', changefreq: 'monthly' },
  { path: '/impact-studies/reduce-admin', priority: '0.6', changefreq: 'monthly' },
  { path: '/impact-studies/revenue-per-head', priority: '0.6', changefreq: 'monthly' },
  { path: '/impact-studies/scale-without-hiring', priority: '0.6', changefreq: 'monthly' },
  // Compare pages
  { path: '/compare', priority: '0.7', changefreq: 'monthly' },
  { path: '/compare/vs-zapier', priority: '0.6', changefreq: 'monthly' },
  { path: '/compare/vs-make', priority: '0.6', changefreq: 'monthly' },
  { path: '/compare/vs-n8n', priority: '0.6', changefreq: 'monthly' },
  { path: '/compare/vs-monday', priority: '0.6', changefreq: 'monthly' },
  { path: '/compare/vs-clickup', priority: '0.6', changefreq: 'monthly' },
  { path: '/compare/vs-asana', priority: '0.6', changefreq: 'monthly' },
  { path: '/compare/vs-notion', priority: '0.6', changefreq: 'monthly' },
  { path: '/compare/vs-pipedrive', priority: '0.6', changefreq: 'monthly' },
  { path: '/compare/vs-gohighlevel', priority: '0.6', changefreq: 'monthly' },
  { path: '/compare/vs-procore', priority: '0.6', changefreq: 'monthly' },
  { path: '/compare/vs-construction-enterprise', priority: '0.6', changefreq: 'monthly' },
  { path: '/compare/vs-construction-builders', priority: '0.6', changefreq: 'monthly' },
  { path: '/compare/vs-jobber', priority: '0.6', changefreq: 'monthly' },
  // Legal pages
  { path: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms-of-service', priority: '0.3', changefreq: 'yearly' },
];

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(date: string | null): string {
  if (!date) return new Date().toISOString().split('T')[0];
  return new Date(date).toISOString().split('T')[0];
}

function generateUrlEntry(
  loc: string,
  lastmod: string,
  changefreq: string,
  priority: string
): string {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generating sitemap...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const urls: string[] = [];

    // Add static pages
    const today = new Date().toISOString().split('T')[0];
    for (const page of staticPages) {
      urls.push(generateUrlEntry(
        `${SITE_URL}${page.path}`,
        today,
        page.changefreq,
        page.priority
      ));
    }

    // Fetch published blog posts
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .not('slug', 'is', null);

    if (blogError) {
      console.error('Error fetching blog posts:', blogError);
    } else if (blogPosts) {
      console.log(`Found ${blogPosts.length} published blog posts`);
      for (const post of blogPosts) {
        if (post.slug) {
          urls.push(generateUrlEntry(
            `${SITE_URL}/resources/blog/${post.slug}`,
            formatDate(post.updated_at || post.published_at),
            'weekly',
            '0.7'
          ));
        }
      }
    }

    // Fetch published guides
    const { data: guides, error: guidesError } = await supabase
      .from('guides_playbooks')
      .select('id, title, updated_at, published_at')
      .eq('status', 'published');

    if (guidesError) {
      console.error('Error fetching guides:', guidesError);
    } else if (guides) {
      console.log(`Found ${guides.length} published guides`);
      for (const guide of guides) {
        // Generate slug from title
        const slug = guide.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        urls.push(generateUrlEntry(
          `${SITE_URL}/resources/guides/${slug}`,
          formatDate(guide.updated_at || guide.published_at),
          'monthly',
          '0.6'
        ));
      }
    }

    // Fetch published documentation
    const { data: docs, error: docsError } = await supabase
      .from('documentation')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .not('slug', 'is', null);

    if (docsError) {
      console.error('Error fetching documentation:', docsError);
    } else if (docs) {
      console.log(`Found ${docs.length} published documentation pages`);
      for (const doc of docs) {
        if (doc.slug) {
          urls.push(generateUrlEntry(
            `${SITE_URL}/documentation/${doc.slug}`,
            formatDate(doc.updated_at || doc.published_at),
            'monthly',
            '0.6'
          ));
        }
      }
    }

    // Fetch published webinars
    const { data: webinars, error: webinarsError } = await supabase
      .from('webinars_events')
      .select('id, title, updated_at, published_at')
      .eq('status', 'published');

    if (webinarsError) {
      console.error('Error fetching webinars:', webinarsError);
    } else if (webinars) {
      console.log(`Found ${webinars.length} published webinars`);
      for (const webinar of webinars) {
        const slug = webinar.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        urls.push(generateUrlEntry(
          `${SITE_URL}/resources/webinars/${slug}`,
          formatDate(webinar.updated_at || webinar.published_at),
          'monthly',
          '0.5'
        ));
      }
    }

    // Generate XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    console.log(`Sitemap generated with ${urls.length} URLs`);

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate sitemap' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
