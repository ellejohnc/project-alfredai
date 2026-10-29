import { useState, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Book, Search, ChevronRight, FileText, Clock, ArrowRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import AdminQuickEditBanner from "@/components/admin/AdminQuickEditBanner";
import { usePublishedDocs, type PublishedDoc } from "@/hooks/usePublishedContent";
import { ApiErrorBanner } from "@/components/ui/ApiErrorBanner";
import SEO from "@/components/SEO";

type Documentation = PublishedDoc;

const DocumentationPage = () => {
  const { items: docs, isLoading, error: docsError, refetch: refetchDocs } = usePublishedDocs();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("category");
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });

  // Get unique categories
  const categories = useMemo(() => 
    [...new Set(docs.map((d) => d.category).filter(Boolean))] as string[],
    [docs]
  );

  // Filter docs
  const filteredDocs = useMemo(() => docs.filter((doc) => {
    const matchesSearch =
      !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !activeCategory || doc.category === activeCategory;
    return matchesSearch && matchesCategory;
  }), [docs, searchQuery, activeCategory]);

  // Group by category
  const groupedDocs = useMemo(() => filteredDocs.reduce((acc, doc) => {
    const cat = doc.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {} as Record<string, Documentation[]>), [filteredDocs]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="alfred ai Documentation & Setup Guides"
        description="Technical documentation for alfred ai: configuration, integrations, agent workflows and rollout guidance for construction and contracting teams."
        path="/documentation"
        breadcrumbs={[{ name: "Home", url: "/" }, { name: "Documentation", url: "/documentation" }]}
      />
      <Header />
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section ref={heroRef} className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-background to-primary/5" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

          <div className="container-wide py-16 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={heroInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/20 text-secondary rounded-full text-sm font-medium mb-6"
              >
                <Book className="w-4 h-4" />
                Documentation
              </motion.span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                alfred ai{" "}
                <span className="text-gradient bg-gradient-to-r from-secondary via-primary to-primary bg-clip-text text-transparent">
                  Documentation
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Everything you need to get started with alfred ai and make the most of the platform.
              </p>

              {/* Search */}
              <div className="max-w-xl mx-auto relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base bg-card border-border"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Admin Quick Edit Banner */}
        <AdminQuickEditBanner adminPath="/admin/docs" label="Manage Documentation" />

        {/* API Error Banner */}
        {docsError && (
          <div className="container-wide py-4">
            <ApiErrorBanner
              error={docsError}
              onRetry={() => refetchDocs()}
              context="loading documentation"
            />
          </div>
        )}

        {/* Content Section */}
        <section className="py-12">
          <div className="container-wide">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar */}
              <aside className="lg:w-64 flex-shrink-0">
                <div className="sticky top-28 bg-card border border-border rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-4">Categories</h3>
                  <nav className="space-y-1">
                    <Link
                      to="/documentation"
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        !activeCategory
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      All Docs
                    </Link>
                    {categories.map((cat) => (
                      <Link
                        key={cat}
                        to={`/documentation?category=${encodeURIComponent(cat)}`}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          activeCategory === cat
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        <ChevronRight className="w-4 h-4" />
                        {cat}
                      </Link>
                    ))}
                  </nav>
                </div>
              </aside>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                {isLoading ? (
                  <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-card border border-border rounded-xl p-6">
                        <Skeleton className="h-6 w-48 mb-2" />
                        <Skeleton className="h-4 w-full mb-4" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : Object.keys(groupedDocs).length === 0 ? (
                  <div className="text-center py-16">
                    <Book className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {searchQuery ? "No results found" : "No documentation yet"}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchQuery
                        ? "Try adjusting your search terms"
                        : "Documentation will appear here once published."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-10">
                    {Object.entries(groupedDocs).map(([category, categoryDocs]) => (
                      <div key={category}>
                        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                          <span className="w-1.5 h-6 bg-primary rounded-full" />
                          {category}
                        </h2>
                        <div className="grid gap-4">
                          {categoryDocs.map((doc, index) => (
                            <motion.div
                              key={doc.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <Link
                                to={`/documentation/${doc.slug}`}
                                className="group block bg-card border border-border hover:border-primary/30 rounded-xl p-5 transition-all hover:shadow-lg hover:shadow-primary/5"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors mb-1">
                                      {doc.title}
                                    </h3>
                                    {doc.content && (
                                      <p className="text-sm text-muted-foreground line-clamp-2">
                                        {doc.content.replace(/<[^>]*>/g, "").slice(0, 150)}...
                                      </p>
                                    )}
                                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Updated{" "}
                                        {new Date(doc.updated_at).toLocaleDateString("en-AU", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                                </div>
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DocumentationPage;
