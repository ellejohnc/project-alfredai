// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://new.alfredai.bot";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const entries: SitemapEntry[] = [
  // Core
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/products", changefreq: "weekly", priority: "0.9" },
  // Product detail pages
  { path: "/products/axiom", changefreq: "monthly", priority: "0.8" },
  { path: "/products/omega", changefreq: "monthly", priority: "0.8" },
  { path: "/products/butler", changefreq: "monthly", priority: "0.8" },
  { path: "/products/watch", changefreq: "monthly", priority: "0.8" },
  { path: "/products/aos", changefreq: "monthly", priority: "0.8" },
  { path: "/products/eva", changefreq: "monthly", priority: "0.8" },
  { path: "/products/use-cases", changefreq: "weekly", priority: "0.7" },
  { path: "/products/use-cases/automated-tender-bid-completion", changefreq: "monthly", priority: "0.7" },
  { path: "/products/use-cases/rfp-compliance-bid-recommendation", changefreq: "monthly", priority: "0.7" },
  { path: "/products/use-cases/purchase-order-to-sales-order", changefreq: "monthly", priority: "0.7" },
  { path: "/products/use-cases/marketing-content-production", changefreq: "monthly", priority: "0.7" },
  { path: "/solutions", changefreq: "weekly", priority: "0.9" },
  { path: "/solutions/ai-for-construction", changefreq: "weekly", priority: "0.9" },
  { path: "/solutions/ai-for-construction/best-ai-for-construction", changefreq: "monthly", priority: "0.8" },
  { path: "/solutions/ai-for-construction/estimating", changefreq: "monthly", priority: "0.8" },
  { path: "/solutions/ai-for-construction/operations", changefreq: "monthly", priority: "0.8" },
  { path: "/ai-construction-takeoff", changefreq: "monthly", priority: "0.9" },
  { path: "/solutions/construction-project-management-software", changefreq: "monthly", priority: "0.8" },
  { path: "/pricing", changefreq: "weekly", priority: "0.9" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/careers", changefreq: "weekly", priority: "0.7" },
  { path: "/press", changefreq: "monthly", priority: "0.6" },
  { path: "/partners", changefreq: "monthly", priority: "0.7" },
  { path: "/investors", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.7" },
  { path: "/support", changefreq: "monthly", priority: "0.6" },
  { path: "/book-demo", changefreq: "monthly", priority: "0.8" },
  { path: "/book", changefreq: "monthly", priority: "0.7" },
  { path: "/faq", changefreq: "monthly", priority: "0.6" },
  { path: "/documentation", changefreq: "weekly", priority: "0.6" },
  { path: "/status", changefreq: "daily", priority: "0.4" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },

  // Impact studies
  { path: "/impact-studies", changefreq: "weekly", priority: "0.8" },
  { path: "/impact-studies/case-studies", changefreq: "weekly", priority: "0.8" },
  { path: "/impact-studies/roi-breakdowns", changefreq: "weekly", priority: "0.8" },
  { path: "/impact-studies/testimonials", changefreq: "weekly", priority: "0.7" },
  { path: "/impact-studies/reduce-admin", changefreq: "monthly", priority: "0.7" },
  { path: "/impact-studies/revenue-per-head", changefreq: "monthly", priority: "0.7" },
  { path: "/impact-studies/execution", changefreq: "monthly", priority: "0.7" },
  { path: "/impact-studies/scale-without-hiring", changefreq: "monthly", priority: "0.7" },

  // Resources
  { path: "/resources", changefreq: "weekly", priority: "0.8" },
  { path: "/resources/demos", changefreq: "weekly", priority: "0.8" },
  { path: "/resources/webinars", changefreq: "weekly", priority: "0.7" },
  { path: "/resources/guides", changefreq: "weekly", priority: "0.7" },
  { path: "/resources/guides/automating-construction-takeoffs", changefreq: "monthly", priority: "0.7" },
  { path: "/resources/guides/ai-for-construction-project-management", changefreq: "monthly", priority: "0.7" },
  { path: "/resources/blog", changefreq: "daily", priority: "0.8" },
  { path: "/explained", changefreq: "weekly", priority: "0.7" },
  { path: "/explained/pricing/diy-quote", changefreq: "monthly", priority: "0.7" },

  // Featured demos
  { path: "/demos/purchase-bill-intake", changefreq: "monthly", priority: "0.7" },
  { path: "/demos/technical-report-agent", changefreq: "monthly", priority: "0.7" },
  { path: "/demos/drawings-to-estimate", changefreq: "monthly", priority: "0.7" },
  { path: "/demos/vendor-compliance", changefreq: "monthly", priority: "0.7" },
  { path: "/voice-demo", changefreq: "monthly", priority: "0.6" },

  // Compare
  { path: "/compare", changefreq: "monthly", priority: "0.7" },
  { path: "/compare/vs-monday", changefreq: "monthly", priority: "0.6" },
  { path: "/compare/vs-notion", changefreq: "monthly", priority: "0.6" },
  { path: "/compare/vs-asana", changefreq: "monthly", priority: "0.6" },
  { path: "/compare/vs-clickup", changefreq: "monthly", priority: "0.6" },
  { path: "/compare/vs-zapier", changefreq: "monthly", priority: "0.6" },
  { path: "/compare/vs-make", changefreq: "monthly", priority: "0.6" },
  { path: "/compare/vs-n8n", changefreq: "monthly", priority: "0.6" },
  { path: "/compare/vs-pipedrive", changefreq: "monthly", priority: "0.6" },
  { path: "/compare/vs-gohighlevel", changefreq: "monthly", priority: "0.6" },
  { path: "/compare/vs-procore", changefreq: "monthly", priority: "0.6" },
  { path: "/compare/vs-construction-enterprise", changefreq: "monthly", priority: "0.6" },
  { path: "/compare/vs-construction-builders", changefreq: "monthly", priority: "0.6" },
  { path: "/compare/vs-buildpass", changefreq: "monthly", priority: "0.6" },
  { path: "/compare/vs-jobber", changefreq: "monthly", priority: "0.6" },
  { path: "/compare/vs-chatgpt", changefreq: "monthly", priority: "0.6" },
  { path: "/compare/vs-claude", changefreq: "monthly", priority: "0.6" },

  // Auth/signup
  { path: "/signup", changefreq: "monthly", priority: "0.5" },
];

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
