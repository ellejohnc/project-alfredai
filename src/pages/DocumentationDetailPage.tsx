import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import DOMPurify from "dompurify";
import { Book, ChevronLeft, Clock, ArrowLeft, ArrowRight, Pencil, List } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useRelatedContent } from "@/hooks/useRelatedContent";
import RelatedContent from "@/components/RelatedContent";
import SEO from "@/components/SEO";
interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface Documentation {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  sort_order: number;
  status: string;
  created_at: string;
  updated_at: string;
}

const DocumentationDetailPage = () => {
  const { slug } = useParams();
  const [doc, setDoc] = useState<Documentation | null>(null);
  const [allDocs, setAllDocs] = useState<Documentation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeHeading, setActiveHeading] = useState<string>("");
  const { isAdmin } = useAdminAuth();

  useEffect(() => {
    const fetchDoc = async () => {
      // Fetch current doc
      const { data: docData, error: docError } = await supabase
        .from("documentation")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (!docError && docData) {
        setDoc(docData);
      }

      // Fetch all docs for navigation
      const { data: allDocsData } = await supabase
        .from("documentation")
        .select("*")
        .eq("status", "published")
        .order("sort_order", { ascending: true });

      if (allDocsData) {
        setAllDocs(allDocsData);
      }

      setIsLoading(false);
    };

    if (slug) {
      fetchDoc();
    }
  }, [slug]);

  // Parse headings from content for TOC
  const tableOfContents = useMemo((): TocItem[] => {
    if (!doc?.content) return [];
    
    const headingRegex = /<h([1-3])[^>]*(?:id="([^"]*)")?[^>]*>([^<]*)<\/h[1-3]>/gi;
    const headings: TocItem[] = [];
    let match;
    let index = 0;
    
    while ((match = headingRegex.exec(doc.content)) !== null) {
      const level = parseInt(match[1]);
      const existingId = match[2];
      const text = match[3].trim();
      const id = existingId || `heading-${index}`;
      
      if (text) {
        headings.push({ id, text, level });
        index++;
      }
    }
    
    return headings;
  }, [doc?.content]);

  // Scroll spy for active heading
  useEffect(() => {
    if (tableOfContents.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -80% 0px" }
    );

    tableOfContents.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [tableOfContents]);

  // Add IDs to headings in content
  const contentWithIds = useMemo(() => {
    if (!doc?.content) return "";
    
    let index = 0;
    const content = doc.content.replace(/<h([1-3])([^>]*)>([^<]*)<\/h[1-3]>/gi, (match, level, attrs, text) => {
      const hasId = attrs.includes('id="');
      if (hasId) return match;
      
      const id = `heading-${index}`;
      index++;
      return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
    });
    
    // Sanitize content to prevent XSS attacks (matching Blog/FAQ/Webinar pattern)
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'img', 'blockquote', 'code', 'pre', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'id', 'style'],
    });
  }, [doc?.content]);

  // Find prev/next docs in same category
  const sameCategoryDocs = allDocs.filter((d) => d.category === doc?.category);
  const currentIndex = sameCategoryDocs.findIndex((d) => d.id === doc?.id);
  const prevDoc = currentIndex > 0 ? sameCategoryDocs[currentIndex - 1] : null;
  const nextDoc = currentIndex < sameCategoryDocs.length - 1 ? sameCategoryDocs[currentIndex + 1] : null;

  // Cross-content recommendations (blogs and guides)
  const { items: relatedContent } = useRelatedContent({
    currentId: doc?.id || '',
    currentType: 'documentation',
    category: doc?.category,
    tags: [], // Docs don't have tags, but category matching will still work
    limit: 4,
    excludeTypes: ['documentation'], // Only show blogs and guides
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container-wide max-w-4xl mx-auto">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-12 w-full mb-6" />
            <Skeleton className="h-4 w-32 mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container-wide max-w-4xl mx-auto text-center py-16">
            <Book className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Documentation not found</h1>
            <p className="text-muted-foreground mb-6">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <Button asChild>
              <Link to="/documentation">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Documentation
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={doc ? `${doc.title} — alfred ai Docs` : "alfred ai Documentation"}
        description={
          doc
            ? `${doc.title}: alfred ai documentation covering ${doc.category?.toLowerCase() || "setup and configuration"} for construction and contracting teams.`
            : "alfred ai documentation for construction and contracting teams."
        }
        path={`/documentation/${slug ?? ""}`}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Documentation", url: "/documentation" },
          ...(doc ? [{ name: doc.title, url: `/documentation/${doc.slug}` }] : []),
        ]}
      />
      <Header />
      <main className="pt-24 pb-16">
        {/* Admin Quick Edit Banner */}
        {isAdmin && (
          <div className="container-wide mb-4">
            <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 flex items-center justify-between">
              <span className="text-sm text-primary font-medium">Admin Mode</span>
              <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                <Link to={`/admin/docs/${doc.id}`}>
                  <Pencil className="w-3 h-3 mr-1" />
                  Edit This Page
                </Link>
              </Button>
            </div>
          </div>
        )}

        <div className="container-wide">
          <div className="flex gap-8">
            {/* Main Content */}
            <article className="flex-1 max-w-4xl">
              {/* Breadcrumb */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <Link
                  to="/documentation"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to Documentation
                </Link>
              </motion.div>

              {/* Category Badge */}
              {doc.category && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Link
                    to={`/documentation?category=${encodeURIComponent(doc.category)}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4 hover:bg-primary/20 transition-colors"
                  >
                    {doc.category}
                  </Link>
                </motion.div>
              )}

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl font-bold text-foreground mb-4"
              >
                {doc.title}
              </motion.h1>

              {/* Meta */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b border-border"
              >
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Last updated{" "}
                  {new Date(doc.updated_at).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </motion.div>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground"
                dangerouslySetInnerHTML={{ __html: contentWithIds }}
              />

              {/* Navigation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-12 pt-8 border-t border-border"
              >
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  {prevDoc ? (
                    <Link
                      to={`/documentation/${prevDoc.slug}`}
                      className="group flex-1 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Previous
                      </div>
                      <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {prevDoc.title}
                      </div>
                    </Link>
                  ) : (
                    <div className="flex-1" />
                  )}

                  {nextDoc && (
                    <Link
                      to={`/documentation/${nextDoc.slug}`}
                      className="group flex-1 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-all text-right"
                    >
                      <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground mb-1">
                        Next
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {nextDoc.title}
                      </div>
                    </Link>
                  )}
                </div>
              </motion.div>

              {/* Related Content (Blogs & Guides) */}
              {relatedContent.length > 0 && (
                <div className="mt-12">
                  <RelatedContent
                    items={relatedContent}
                    title="Related Resources"
                    subtitle="Explore blogs and guides on similar topics."
                    columns={relatedContent.length >= 4 ? 4 : relatedContent.length >= 2 ? 2 : 3}
                  />
                </div>
              )}
            </article>

            {/* Table of Contents Sidebar */}
            {tableOfContents.length > 0 && (
              <aside className="hidden xl:block w-64 flex-shrink-0">
                <div className="sticky top-28">
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <List className="w-4 h-4" />
                      On This Page
                    </h3>
                    <nav className="space-y-1">
                      {tableOfContents.map((item) => (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          className={`block text-sm py-1 transition-colors ${
                            item.level === 1 ? "pl-0" : item.level === 2 ? "pl-3" : "pl-6"
                          } ${
                            activeHeading === item.id
                              ? "text-primary font-medium"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            const element = document.getElementById(item.id);
                            if (element) {
                              element.scrollIntoView({ behavior: "smooth", block: "start" });
                            }
                          }}
                        >
                          {item.text}
                        </a>
                      ))}
                    </nav>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DocumentationDetailPage;
