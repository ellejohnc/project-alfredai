import { memo, useMemo } from "react";
import { Helmet } from "react-helmet";
import { useLocation } from "react-router-dom";
import { PRODUCTION_URL, SEO_DEFAULTS, HELLO_EMAIL } from "@/lib/siteConfig";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface ArticleData {
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  authorUrl?: string;
  section?: string;
  tags?: string[];
  wordCount?: number;
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
}

interface SoftwareToolData {
  name: string;
  description: string;
  applicationCategory?: string;
  operatingSystem?: string;
  offers?: {
    price: string;
    priceCurrency: string;
  };
}

interface ServiceData {
  name: string;
  description: string;
  serviceType?: string;
  areaServed?: string;
  provider?: string;
  features?: string[];
}

interface ProductData {
  name: string;
  description: string;
  category?: string;
  features?: string[];
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

interface SEOProps {
  title?: string;
  fullTitle?: string;
  description?: string;
  image?: string;
  path?: string;
  type?: "website" | "article";
  noindex?: boolean;
  article?: ArticleData;
  breadcrumbs?: BreadcrumbItem[];
  faqs?: FAQItem[];
  softwareTool?: SoftwareToolData;
  service?: ServiceData;
  product?: ProductData;
}

// Generate Organization schema
const getOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "alfred ai",
  "alternateName": ["alfred ai", "alfred ai", "Alfred.AI"],
  "url": PRODUCTION_URL,
  "logo": `${PRODUCTION_URL}/alfred-ai-logo.png`,
  "description": "alfred ai is the leading agentic AI execution layer for construction and contracting businesses. Our configurable AI agents orchestrate project workflows end-to-end, enabling 10x faster delivery for builders, contractors, and construction firms.",
  "sameAs": [
    "https://www.linkedin.com/company/alfred-ai-bot",
    "https://www.youtube.com/@alfred ai-bot",
    "https://www.instagram.com/alfredai.bot/",
    "https://www.tiktok.com/@alfredaiservices"
  ],
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": HELLO_EMAIL,
      "availableLanguage": "English"
    },
    {
      "@type": "ContactPoint",
      "contactType": "sales",
      "email": "sales@alfredai.bot",
      "availableLanguage": "English"
    }
  ],
  "knowsAbout": [
    "Construction AI",
    "AI Takeoff",
    "Agentic AI",
    "Construction Project Management",
    "Workflow Automation",
    "Construction Technology",
    "AI for Contractors",
    "AI Estimating",
    "Construction Automation",
    "Digital Construction"
  ],
  "areaServed": {
    "@type": "GeoShape",
    "name": "Worldwide"
  },
  "slogan": "Agentic AI for Construction Project Execution",
  "foundingDate": "2024",
  "numberOfEmployees": {
    "@type": "QuantitativeValue",
    "minValue": 2,
    "maxValue": 10
  }
});

// Generate WebSite schema with search action
const getWebsiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": SEO_DEFAULTS.siteName,
  "url": PRODUCTION_URL,
  "description": SEO_DEFAULTS.defaultDescription,
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${PRODUCTION_URL}/resources/blog?search={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  }
});

// Generate BreadcrumbList schema
const getBreadcrumbSchema = (breadcrumbs: BreadcrumbItem[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": breadcrumbs.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url.startsWith("http") ? item.url : `${PRODUCTION_URL}${item.url}`
  }))
});

// Generate FAQPage schema for rich snippets
const getFAQPageSchema = (faqs: FAQItem[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map((faq) => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer.replace(/<[^>]*>/g, '') // Strip HTML tags for schema
    }
  }))
});

// Generate Article schema for blog posts
const getArticleSchema = (
  title: string,
  description: string,
  url: string,
  article: ArticleData
) => {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title.slice(0, 110), // Google recommends max 110 chars
    "description": description,
    "url": url,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    },
    "publisher": {
      "@type": "Organization",
      "name": SEO_DEFAULTS.siteName,
      "logo": {
        "@type": "ImageObject",
        "url": `${PRODUCTION_URL}/alfred-ai-logo.png`
      }
    }
  };

  if (article.publishedTime) {
    schema.datePublished = article.publishedTime;
  }

  if (article.modifiedTime) {
    schema.dateModified = article.modifiedTime;
  } else if (article.publishedTime) {
    schema.dateModified = article.publishedTime;
  }

  if (article.author) {
    schema.author = {
      "@type": "Person",
      "name": article.author,
      ...(article.authorUrl && { "url": article.authorUrl })
    };
  } else {
    schema.author = {
      "@type": "Organization",
      "name": SEO_DEFAULTS.siteName,
      "url": PRODUCTION_URL
    };
  }

  if (article.image) {
    const imageUrl = article.image.startsWith("http") 
      ? article.image 
      : `${PRODUCTION_URL}${article.image}`;
    schema.image = {
      "@type": "ImageObject",
      "url": imageUrl,
      ...(article.imageWidth && { "width": article.imageWidth }),
      ...(article.imageHeight && { "height": article.imageHeight })
    };
  }

  if (article.section) {
    schema.articleSection = article.section;
  }

  if (article.tags && article.tags.length > 0) {
    schema.keywords = article.tags.join(", ");
  }

  if (article.wordCount) {
    schema.wordCount = article.wordCount;
  }

  return schema;
};

// Generate SoftwareApplication schema for tools/calculators
const getSoftwareToolSchema = (
  tool: SoftwareToolData,
  url: string
) => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": tool.name,
  "description": tool.description,
  "url": url,
  "applicationCategory": tool.applicationCategory || "BusinessApplication",
  "operatingSystem": tool.operatingSystem || "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": tool.offers?.price || "0",
    "priceCurrency": tool.offers?.priceCurrency || "AUD"
  },
  "provider": {
    "@type": "Organization",
    "name": SEO_DEFAULTS.siteName,
    "url": PRODUCTION_URL
  },
  "featureList": [
    "ROI calculation",
    "Cost comparison analysis",
    "Team size scaling",
    "Industry-specific benchmarks"
  ]
});

// Generate Service schema for GEO
const getServiceSchema = (service: ServiceData) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  "name": service.name,
  "description": service.description,
  "serviceType": service.serviceType || "AI Automation",
  "provider": {
    "@type": "Organization",
    "name": SEO_DEFAULTS.siteName,
    "url": PRODUCTION_URL
  },
  "areaServed": service.areaServed || "Worldwide",
  ...(service.features && service.features.length > 0 && {
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": `${service.name} Features`,
      "itemListElement": service.features.map((feature, i) => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": feature
        }
      }))
    }
  })
});

// Generate Product schema for GEO
const getProductSchema = (product: ProductData) => {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "brand": {
      "@type": "Brand",
      "name": SEO_DEFAULTS.siteName
    },
    "category": product.category || "Software",
    "manufacturer": {
      "@type": "Organization",
      "name": SEO_DEFAULTS.siteName,
      "url": PRODUCTION_URL
    }
  };

  if (product.features && product.features.length > 0) {
    schema.additionalProperty = product.features.map(f => ({
      "@type": "PropertyValue",
      "name": "Feature",
      "value": f
    }));
  }

  if (product.aggregateRating) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": product.aggregateRating.ratingValue,
      "reviewCount": product.aggregateRating.reviewCount,
      "bestRating": 5
    };
  }

  return schema;
};

const SEO = memo(({
  title,
  fullTitle,
  description = SEO_DEFAULTS.defaultDescription,
  image = SEO_DEFAULTS.defaultImage,
  path,
  type = "website",
  noindex = false,
  article,
  breadcrumbs,
  faqs,
  softwareTool,
  service,
  product,
}: SEOProps) => {
  const location = useLocation();
  
  const finalTitle = useMemo(() => fullTitle 
    ? fullTitle 
    : title 
      ? SEO_DEFAULTS.titleTemplate.replace("%s", title)
      : SEO_DEFAULTS.defaultTitle, [fullTitle, title]);
  
  const canonicalPath = path ?? location.pathname;
  const canonicalUrl = `${PRODUCTION_URL}${canonicalPath}`;
  
  const absoluteImage = useMemo(() => image.startsWith("http") 
    ? image 
    : `${PRODUCTION_URL}${image}`, [image]);

  // Memoize JSON-LD scripts to prevent unnecessary re-renders
  const jsonLdScripts = useMemo(() => {
    const scripts: Record<string, unknown>[] = [];
    
    // Always include Organization schema on homepage
    if (canonicalPath === "/" || canonicalPath === "") {
      scripts.push(getOrganizationSchema());
      scripts.push(getWebsiteSchema());
    }
    
    // Add breadcrumbs if provided
    if (breadcrumbs && breadcrumbs.length > 0) {
      scripts.push(getBreadcrumbSchema(breadcrumbs));
    }
    
    // Add FAQPage schema if provided
    if (faqs && faqs.length > 0) {
      scripts.push(getFAQPageSchema(faqs));
    }

    // Add Article schema if type is article and article data provided
    if (type === "article" && article) {
      scripts.push(getArticleSchema(
        title || SEO_DEFAULTS.defaultTitle,
        description,
        canonicalUrl,
        article
      ));
    }

    // Add SoftwareApplication schema for tools/calculators
    if (softwareTool) {
      scripts.push(getSoftwareToolSchema(softwareTool, canonicalUrl));
    }

    // Add Service schema for GEO
    if (service) {
      scripts.push(getServiceSchema(service));
    }

    // Add Product schema for GEO
    if (product) {
      scripts.push(getProductSchema(product));
    }
    
    return scripts;
  }, [canonicalPath, breadcrumbs, faqs, type, article, title, description, canonicalUrl, softwareTool, service, product]);

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {!noindex && <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* LLMs.txt discovery for AI crawlers (GEO) */}
      <link rel="alternate" type="text/plain" href="https://new.alfredai.bot/llms.txt" title="LLMs.txt - AI content summary" />
      
      {/* GEO / AI Search Engine Friendly Meta */}
      <meta name="author" content={article?.author || SEO_DEFAULTS.siteName} />
      <meta name="publisher" content={SEO_DEFAULTS.siteName} />
      <meta name="generator" content="alfred ai" />
      
      {/* Additional AI-crawler / GEO signals */}
      <meta name="subject" content={title || SEO_DEFAULTS.defaultTitle} />
      <meta name="classification" content="Construction Technology, Artificial Intelligence" />
      <meta name="language" content="en" />
      
      {/* Open Graph */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:image:alt" content={title ? `${title} - ${SEO_DEFAULTS.siteName}` : SEO_DEFAULTS.siteName} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SEO_DEFAULTS.siteName} />
      <meta property="og:locale" content={SEO_DEFAULTS.locale} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />
      <meta name="twitter:image:alt" content={title ? `${title} - ${SEO_DEFAULTS.siteName}` : SEO_DEFAULTS.siteName} />
      
      {/* Article-specific meta tags */}
      {article?.publishedTime && (
        <meta property="article:published_time" content={article.publishedTime} />
      )}
      {article?.modifiedTime && (
        <meta property="article:modified_time" content={article.modifiedTime} />
      )}
      {article?.author && (
        <meta property="article:author" content={article.author} />
      )}
      {article?.section && (
        <meta property="article:section" content={article.section} />
      )}
      {article?.tags?.map((tag, index) => (
        <meta key={index} property="article:tag" content={tag} />
      ))}
      
      {/* JSON-LD Structured Data */}
      {jsonLdScripts.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
});

SEO.displayName = 'SEO';

export default SEO;
