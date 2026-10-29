import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { resolveImageUrl } from "@/lib/imageUtils";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { Link, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, Newspaper, Clock, ArrowRight, 
  Search, Tag, TrendingUp, BookOpen, Loader2, X, Filter,
  ChevronLeft, ChevronRight, Calendar, Sparkles,
  Twitter, Linkedin, Link2, Check, Share2, Flame, Bookmark, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import PremiumCTASection from "@/components/sections/PremiumCTASection";
import NewsletterSubscribeModal from "@/components/NewsletterSubscribeModal";
import DOMPurify from "dompurify";
import { format, formatDistanceToNow, isWithinInterval, subDays } from "date-fns";
import { toast } from "sonner";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useBlogViews } from "@/hooks/useBlogViews";
import AdminQuickEditBanner from "@/components/admin/AdminQuickEditBanner";
import { usePublishedBlogs, type PublishedBlogPost } from "@/hooks/usePublishedContent";
import { ApiErrorBanner } from "@/components/ui/ApiErrorBanner";

type BlogPost = PublishedBlogPost;

// Categories are now dynamic from the database

const ITEMS_PER_PAGE = 9;

// Helper to capitalize tags properly
const capitalizeTag = (tag: string): string => {
  return tag
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const BlogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<BlogPost | null>(null);
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const articleRefs = useRef<Record<string, HTMLElement | null>>({});
  const articlesGridRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  
  // Hooks for data fetching, bookmarks and view tracking
  const { items: posts, isLoading, error: blogsError, refetch: refetchBlogs } = usePublishedBlogs();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { viewCounts, trackView, get30dViewCount } = useBlogViews();

  // Handle ?article= query parameter
  useEffect(() => {
    const articleParam = searchParams.get("article");
    if (articleParam && posts.length > 0) {
      const article = posts.find(p => p.id === articleParam || p.slug === articleParam);
      if (article) {
        setTimeout(() => {
          const articleEl = articleRefs.current[article.id];
          if (articleEl) {
            articleEl.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          setSelectedArticle(article);
        }, 300);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, setSearchParams, posts]);

  // Get all unique tags from posts with proper capitalization
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    posts.forEach(post => {
      post.tags?.forEach(tag => tagsSet.add(capitalizeTag(tag)));
    });
    return Array.from(tagsSet).sort();
  }, [posts]);

  // Trending posts based on real view counts (30 day views)
  const trendingPosts = useMemo(() => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentPosts = posts.filter(post => {
      const postDate = new Date(post.published_at || post.created_at);
      return isWithinInterval(postDate, { start: thirtyDaysAgo, end: new Date() });
    });
    
    // Sort by 30-day view count, then by date
    return recentPosts
      .sort((a, b) => {
        const viewsA = get30dViewCount(a.id);
        const viewsB = get30dViewCount(b.id);
        if (viewsB !== viewsA) return viewsB - viewsA;
        // Fallback to date if views are equal
        return new Date(b.published_at || b.created_at).getTime() - 
               new Date(a.published_at || a.created_at).getTime();
      })
      .slice(0, 6);
  }, [posts, get30dViewCount]);

  // Get available categories dynamically from posts (not from hardcoded list)
  const availableCategories = useMemo(() => {
    const cats = Array.from(new Set(posts.map(p => p.category).filter(Boolean) as string[])).sort();
    return [
      { value: 'all', label: 'All Categories' },
      ...cats.map(c => ({ value: c, label: c })),
    ];
  }, [posts]);

  // Filter posts (case-insensitive tag matching)
  const filteredArticles = useMemo(() => {
    return posts.filter(article => {
      const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
      const matchesTag = !selectedTag || article.tags?.some(t => 
        capitalizeTag(t) === selectedTag
      );
      const matchesSearch = !searchQuery || 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (article.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ?? false);
      return matchesCategory && matchesTag && matchesSearch;
    });
  }, [posts, selectedCategory, selectedTag, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredArticles.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredArticles, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedTag, searchQuery]);

  // Related articles (same category or matching tags)
  const relatedArticles = useMemo(() => {
    if (!selectedArticle) return [];
    
    return posts
      .filter(post => post.id !== selectedArticle.id)
      .map(post => {
        let score = 0;
        // Same category = 2 points
        if (post.category && post.category === selectedArticle.category) score += 2;
        // Each matching tag = 1 point
        const matchingTags = (post.tags || []).filter(tag => 
          (selectedArticle.tags || []).includes(tag)
        ).length;
        score += matchingTags;
        return { post, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.post);
  }, [selectedArticle, posts]);

  // Recent posts (last 7 days)
  const recentPosts = useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), 7);
    return posts.filter(post => {
      const postDate = new Date(post.published_at || post.created_at);
      return isWithinInterval(postDate, { start: sevenDaysAgo, end: new Date() });
    }).slice(0, 5);
  }, [posts]);

  // Featured posts (first 5)
  const featuredPosts = useMemo(() => {
    return posts.slice(0, Math.min(5, posts.length));
  }, [posts]);

  // Auto-cycle featured posts
  useEffect(() => {
    if (featuredPosts.length <= 1 || isPaused) return;
    
    const interval = setInterval(() => {
      setFeaturedIndex(prev => (prev + 1) % featuredPosts.length);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [featuredPosts.length, isPaused]);

  // Format date nicely
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown date';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return formatDistanceToNow(date, { addSuffix: true });
    if (diffDays < 365) return format(date, 'MMMM d');
    return format(date, 'MMMM d, yyyy');
  };

  const formatFullDate = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown date';
    return format(new Date(dateStr), 'EEEE, MMMM d, yyyy');
  };

  // Estimated read time
  const getReadTime = (content: string | null, excerpt: string | null) => {
    const text = content || excerpt || '';
    const wordCount = text.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200);
    return readTime < 1 ? 1 : readTime;
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedTag(null);
    setSearchQuery("");
  };

  const hasActiveFilters = selectedCategory !== "all" || selectedTag || searchQuery;

  // Social sharing functions
  const getArticleUrl = useCallback((article: BlogPost) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/resources/blog?article=${article.slug || article.id}`;
  }, []);

  const shareOnTwitter = useCallback((article: BlogPost) => {
    const url = getArticleUrl(article);
    const text = encodeURIComponent(`${article.title} - Check out this article from alfred ai`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank');
  }, [getArticleUrl]);

  const shareOnLinkedIn = useCallback((article: BlogPost) => {
    const url = getArticleUrl(article);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  }, [getArticleUrl]);

  const copyArticleLink = useCallback(async (article: BlogPost) => {
    const url = getArticleUrl(article);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }, [getArticleUrl]);

  // Page change handler
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    articlesGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Reading progress for modal
  const handleModalScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight - target.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    setReadingProgress(Math.min(100, Math.max(0, progress)));
  }, []);

  // Reset reading progress and track view when article changes
  useEffect(() => {
    setReadingProgress(0);
    if (selectedArticle) {
      trackView(selectedArticle.id);
    }
  }, [selectedArticle, trackView]);

  // Handle article selection with tracking
  const handleSelectArticle = useCallback((article: BlogPost) => {
    setSelectedArticle(article);
  }, []);

  // Handle bookmark toggle
  const handleToggleBookmark = useCallback((article: BlogPost, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const wasBookmarked = isBookmarked(article.id);
    toggleBookmark({ id: article.id, type: 'blog', title: article.title });
    toast.success(wasBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
  }, [isBookmarked, toggleBookmark]);

  // Calculate word count for selected article
  const getWordCount = (content: string | null) => {
    if (!content) return undefined;
    return content.split(/\s+/).filter(word => word.length > 0).length;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Dynamic SEO based on whether article is selected */}
      {selectedArticle ? (
        <SEO 
          title={selectedArticle.title}
          description={selectedArticle.excerpt || `Read ${selectedArticle.title} on the alfred ai blog.`}
          image={selectedArticle.featured_image_url || undefined}
          path={`/resources/blog/${selectedArticle.slug || selectedArticle.id}`}
          type="article"
          article={{
            publishedTime: selectedArticle.published_at || selectedArticle.created_at,
            modifiedTime: selectedArticle.updated_at,
            section: selectedArticle.category || undefined,
            tags: selectedArticle.tags || undefined,
            wordCount: getWordCount(selectedArticle.content),
            image: selectedArticle.featured_image_url || undefined,
          }}
          breadcrumbs={[
            { name: "Home", url: "/" },
            { name: "Resources", url: "/resources" },
            { name: "Blog", url: "/resources/blog" },
            { name: selectedArticle.title, url: `/resources/blog/${selectedArticle.slug || selectedArticle.id}` }
          ]}
        />
      ) : (
        <SEO 
          title="Blog & Insights" 
          description="Expert articles on agentic AI, construction automation, workflow optimization, and contracting operations from alfred ai. Learn how AI transforms construction project management."
          breadcrumbs={[
            { name: "Home", url: "/" },
            { name: "Resources", url: "/resources" },
            { name: "Blog", url: "/resources/blog" }
          ]}
          faqs={[
            { question: "What topics does the alfred ai blog cover?", answer: "The alfred ai blog covers agentic AI, construction automation, workflow optimization, contracting operations, and the future of AI-powered project management in the construction industry." },
            { question: "How can AI improve construction project management?", answer: "AI can automate repetitive tasks like document processing, compliance checks, and project scheduling, enabling construction teams to deliver projects up to 10x faster with fewer errors." }
          ]}
        />
      )}
      <Header />
      
      <main>
        {/* Hero */}
        <section className="pt-32 pb-12 md:pt-40 md:pb-16 bg-background relative overflow-hidden">
          {/* Premium gradient background with animated orbs */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent pointer-events-none" />
          <motion.div 
            className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px] pointer-events-none"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.15, 0.25, 0.15]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-secondary/15 rounded-full blur-[100px] pointer-events-none"
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: [0.15, 0.2, 0.15]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          <motion.div 
            className="absolute top-1/2 right-10 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[80px] pointer-events-none"
            animate={{ 
              y: [0, -30, 0],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          
          <div className="container-wide relative">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Link
                to="/resources"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Resources
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="max-w-3xl"
            >
              <motion.div 
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-6 shadow-lg shadow-primary/25"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <Newspaper className="w-8 h-8 text-primary-foreground" />
              </motion.div>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 leading-tight select-text">
                Blog & Insights
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl select-text">
                Expert articles on agentic AI, construction automation, and the future of work from the alfred ai team.
              </p>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-6 mt-8">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Newspaper className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{posts.length}</p>
                    <p className="text-sm text-muted-foreground">Articles</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Tag className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{allTags.length}</p>
                    <p className="text-sm text-muted-foreground">Topics</p>
                  </div>
                </div>
                {recentPosts.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{recentPosts.length}</p>
                      <p className="text-sm text-muted-foreground">This Week</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Admin Quick Edit Banner */}
        <AdminQuickEditBanner adminPath="/admin/blog" label="Manage Blog Posts" />

        {/* API Error Banner */}
        {blogsError && (
          <div className="container-wide py-4">
            <ApiErrorBanner
              error={blogsError}
              onRetry={() => refetchBlogs()}
              context="loading blog posts"
            />
          </div>
        )}

        {/* Loading State with Skeleton */}
        {isLoading && (
          <section className="py-12 bg-background">
            <div className="container-wide space-y-8">
              {/* Featured article skeleton */}
              <div className="bg-card rounded-3xl border border-border p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="aspect-[4/3] bg-muted rounded-xl animate-pulse" />
                  <div className="space-y-4 flex flex-col justify-center">
                    <div className="flex gap-2">
                      <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
                      <div className="h-5 w-20 bg-muted rounded-full animate-pulse" />
                    </div>
                    <div className="h-8 w-3/4 bg-muted rounded animate-pulse" />
                    <div className="h-5 w-full bg-muted rounded animate-pulse" />
                    <div className="h-5 w-2/3 bg-muted rounded animate-pulse" />
                    <div className="flex items-center gap-3 mt-4">
                      <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
                      <div className="space-y-1">
                        <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Articles grid skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="aspect-video bg-muted animate-pulse" />
                    <div className="p-5 space-y-3">
                      <div className="flex gap-2">
                        <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
                        <div className="h-5 w-20 bg-muted rounded-full animate-pulse" />
                      </div>
                      <div className="h-6 w-full bg-muted rounded animate-pulse" />
                      <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-full bg-muted rounded animate-pulse" />
                      <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                      <div className="flex items-center gap-3 pt-2">
                        <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                        <div className="space-y-1">
                          <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                          <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Featured Articles Carousel */}
        {!isLoading && featuredPosts.length > 0 && (
          <section className="py-16 bg-gradient-to-b from-primary/5 to-background relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="container-wide relative">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                <div>
                  <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Latest Insights</h2>
                  <p className="text-muted-foreground max-w-xl">
                    Stay ahead with our most impactful articles and expert perspectives.
                  </p>
                </div>
                {featuredPosts.length > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setFeaturedIndex(prev => (prev - 1 + featuredPosts.length) % featuredPosts.length)}
                      onMouseEnter={() => setIsPaused(true)}
                      onMouseLeave={() => setIsPaused(false)}
                      className="rounded-full"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex gap-1.5">
                      {featuredPosts.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setFeaturedIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            idx === featuredIndex 
                              ? 'bg-primary w-6' 
                              : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                          }`}
                        />
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setFeaturedIndex(prev => (prev + 1) % featuredPosts.length)}
                      onMouseEnter={() => setIsPaused(true)}
                      onMouseLeave={() => setIsPaused(false)}
                      className="rounded-full"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Featured Article Showcase */}
              <AnimatePresence mode="wait">
                <motion.article
                  key={featuredPosts[featuredIndex]?.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                  className="group bg-card rounded-2xl border-2 border-primary/20 shadow-xl overflow-hidden hover:border-primary/40 transition-all"
                >
                  <Link to={`/resources/blog/${featuredPosts[featuredIndex]?.slug || featuredPosts[featuredIndex]?.id}`} className="md:flex md:h-[420px]">
                    <div className="md:w-1/2 h-[200px] md:h-full relative overflow-hidden bg-muted">
                      {featuredPosts[featuredIndex]?.featured_image_url ? (
                        <img 
                          src={resolveImageUrl(featuredPosts[featuredIndex].featured_image_url!)} 
                          alt={`${featuredPosts[featuredIndex].title} - alfred ai Blog${featuredPosts[featuredIndex].category ? ` | ${featuredPosts[featuredIndex].category}` : ''}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center ${featuredPosts[featuredIndex]?.featured_image_url ? 'hidden' : ''}`}>
                        <Newspaper className="w-16 h-16 text-muted-foreground/50" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent md:bg-gradient-to-r" />
                      {featuredPosts[featuredIndex]?.category && (
                        <Badge className="absolute top-4 left-4 bg-primary">{featuredPosts[featuredIndex].category}</Badge>
                      )}
                    </div>
                    <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {formatDate(featuredPosts[featuredIndex]?.published_at || featuredPosts[featuredIndex]?.created_at)}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {getReadTime(featuredPosts[featuredIndex]?.content, featuredPosts[featuredIndex]?.excerpt)} min read
                        </span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors line-clamp-2 select-text">
                        {featuredPosts[featuredIndex]?.title}
                      </h3>
                      <p className="text-muted-foreground mb-6 line-clamp-3 text-lg select-text">
                        {featuredPosts[featuredIndex]?.excerpt}
                      </p>
                      {featuredPosts[featuredIndex]?.tags && featuredPosts[featuredIndex].tags!.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                          {featuredPosts[featuredIndex].tags!.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {capitalizeTag(tag)}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <Button className="self-start group/btn">
                        Read Article
                        <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </Link>
                </motion.article>
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* Trending Section */}
        {!isLoading && trendingPosts.length > 0 && (
          <section className="py-12 bg-background border-b border-border">
            <div className="container-wide">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Trending This Month</h2>
                  <p className="text-sm text-muted-foreground">Most popular articles from the last 30 days</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trendingPosts.map((article, index) => (
                  <Link
                    key={article.id}
                    to={`/resources/blog/${article.slug || article.id}`}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group flex items-start gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-full"
                    >
                      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold text-sm">
                        #{index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
                          {article.title}
                        </h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {getReadTime(article.content, article.excerpt)} min read
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                          {formatDate(article.published_at || article.created_at)}
                        </p>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Articles */}
        {!isLoading && (
          <section className="py-16 bg-background" ref={articlesGridRef}>
            <div className="container-wide">
              {/* Search and Filters */}
              <div className="flex flex-col gap-4 mb-10">
                {/* Search Bar and Filters Row */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1 max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search articles by title, content, or tags..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-12 h-12 text-base"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => setSearchQuery("")}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Category Filter Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="h-12 gap-2 min-w-[180px] justify-between">
                        <div className="flex items-center gap-2">
                          <Filter className="w-4 h-4" />
                          {availableCategories.find(c => c.value === selectedCategory)?.label || 'All Categories'}
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {availableCategories.map(cat => (
                        <DropdownMenuItem
                          key={cat.value}
                          onClick={() => setSelectedCategory(cat.value)}
                          className={selectedCategory === cat.value ? 'bg-primary/10 text-primary' : ''}
                        >
                          {cat.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Tags Dropdown - next to Category */}
                  {allTags.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-12 gap-2 min-w-[160px] justify-between">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            {selectedTag || 'All Topics'}
                          </div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 max-h-64 overflow-auto">
                        <DropdownMenuItem
                          onClick={() => setSelectedTag(null)}
                          className={!selectedTag ? 'bg-primary/10 text-primary' : ''}
                        >
                          All Topics
                        </DropdownMenuItem>
                        {allTags.map(tag => (
                          <DropdownMenuItem
                            key={tag}
                            onClick={() => setSelectedTag(tag)}
                            className={selectedTag === tag ? 'bg-primary/10 text-primary' : ''}
                          >
                            {tag}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Active Filters */}
                {hasActiveFilters && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Active filters:</span>
                    {selectedCategory !== "all" && (
                      <Badge variant="secondary" className="gap-1">
                        {selectedCategory}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory("all")} />
                      </Badge>
                    )}
                    {selectedTag && (
                      <Badge variant="secondary" className="gap-1">
                        {selectedTag}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedTag(null)} />
                      </Badge>
                    )}
                    {searchQuery && (
                      <Badge variant="secondary" className="gap-1">
                        "{searchQuery}"
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                      </Badge>
                    )}
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                      Clear all
                    </Button>
                  </div>
                )}
              </div>

              {/* Results Count */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{paginatedArticles.length}</span> of{' '}
                  <span className="font-semibold text-foreground">{filteredArticles.length}</span> article{filteredArticles.length !== 1 ? 's' : ''}
                </p>
                {totalPages > 1 && (
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                )}
              </div>

              {/* Articles Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedArticles.map((article, index) => (
                  <motion.article
                    key={article.id}
                    ref={(el) => (articleRefs.current[article.id] = el)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group flex flex-col bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-lg transition-all overflow-hidden"
                  >
                    <Link to={`/resources/blog/${article.slug || article.id}`} className="flex flex-col flex-1">
                      {/* Image */}
                      <div className="aspect-video relative overflow-hidden bg-muted">
                        {article.featured_image_url ? (
                      <img 
                        src={resolveImageUrl(article.featured_image_url)} 
                        alt={`${article.title} - alfred ai Blog${article.category ? ` | ${article.category}` : ''}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`absolute inset-0 flex items-center justify-center ${article.featured_image_url ? 'hidden' : ''}`}>
                          <Newspaper className="w-12 h-12 text-muted-foreground/30" />
                        </div>
                        {article.category && (
                          <Badge className="absolute top-3 left-3 bg-background/90 text-foreground backdrop-blur-sm">
                            {article.category}
                          </Badge>
                        )}
                        {/* Bookmark button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleToggleBookmark(article, e)}
                          className="absolute top-3 right-3 h-8 w-8 bg-background/80 hover:bg-background backdrop-blur-sm"
                        >
                          <Bookmark className={`w-4 h-4 ${isBookmarked(article.id) ? 'fill-primary text-primary' : ''}`} />
                        </Button>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 flex flex-col p-5">
                        <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(article.published_at || article.created_at)}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {getReadTime(article.content, article.excerpt)} min
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2 select-text">
                          {article.title}
                        </h3>
                        
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1 select-text">
                          {article.excerpt}
                        </p>
                        
                        {article.tags && article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {article.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs px-2 py-0">
                                {capitalizeTag(tag)}
                              </Badge>
                            ))}
                            {article.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs px-2 py-0">
                                +{article.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          Read article <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="rounded-full"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      // Show first, last, current, and adjacent pages
                      const showPage = page === 1 || 
                        page === totalPages || 
                        Math.abs(page - currentPage) <= 1;
                      const showEllipsis = page === 2 && currentPage > 3 || 
                        page === totalPages - 1 && currentPage < totalPages - 2;
                      
                      if (!showPage && !showEllipsis) return null;
                      if (showEllipsis) return <span key={page} className="px-2 text-muted-foreground">...</span>;
                      
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "ghost"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className={`w-10 h-10 rounded-full ${currentPage === page ? '' : 'text-muted-foreground'}`}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="rounded-full"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {filteredArticles.length === 0 && (
                <div className="text-center py-16">
                  <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No articles found</h3>
                  <p className="text-muted-foreground mb-6">
                    Try adjusting your filters or search terms.
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Newsletter CTA */}
        <PremiumCTASection
          title="Stay Updated"
          description="Subscribe to our newsletter for the latest insights on AI, automation, and operational excellence."
          buttonText="Subscribe Now"
          onButtonClick={() => setIsNewsletterOpen(true)}
          variant="light"
        />
      </main>

      <Footer />

      {/* Newsletter Modal */}
      <NewsletterSubscribeModal
        isOpen={isNewsletterOpen}
        onClose={() => setIsNewsletterOpen(false)}
        source="blog"
      />

      {/* Article Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedArticle(null)}
          >
            {/* Reading Progress Bar */}
            <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-muted">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${readingProgress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            
            <div
              ref={modalContentRef}
              onScroll={handleModalScroll}
              className="h-full overflow-y-auto flex items-start justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.article
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="bg-card rounded-2xl border border-border shadow-2xl max-w-4xl w-full my-8 overflow-hidden"
              >
                {/* Header Image */}
                <div className="aspect-video relative bg-muted">
                  {selectedArticle.featured_image_url ? (
                    <img 
                      src={resolveImageUrl(selectedArticle.featured_image_url)} 
                      alt={`${selectedArticle.title} - alfred ai Blog${selectedArticle.category ? ` | ${selectedArticle.category}` : ''}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`absolute inset-0 flex items-center justify-center ${selectedArticle.featured_image_url ? 'hidden' : ''}`}>
                    <Newspaper className="w-20 h-20 text-muted-foreground/30" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedArticle(null)}
                    className="absolute top-4 right-4 bg-background/80 hover:bg-background"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Close
                  </Button>
                  {/* Reading progress percentage badge */}
                  <Badge className="absolute bottom-4 right-4 bg-background/80 text-foreground">
                    {Math.round(readingProgress)}% read
                  </Badge>
                </div>
              
              <div className="p-8 md:p-10">
                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {selectedArticle.category && (
                    <Badge className="bg-primary">{selectedArticle.category}</Badge>
                  )}
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {formatFullDate(selectedArticle.published_at || selectedArticle.created_at)}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {getReadTime(selectedArticle.content, selectedArticle.excerpt)} min read
                  </span>
                </div>
                
                <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-6 leading-tight select-text">
                  {selectedArticle.title}
                </h1>

                {/* Social Sharing Buttons */}
                <div className="flex items-center gap-2 mb-8 pb-6 border-b border-border">
                  <span className="text-sm text-muted-foreground mr-2 flex items-center gap-1.5">
                    <Share2 className="w-4 h-4" />
                    Share:
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareOnTwitter(selectedArticle)}
                    className="gap-1.5 hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] hover:border-[#1DA1F2]/30"
                  >
                    <Twitter className="w-4 h-4" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareOnLinkedIn(selectedArticle)}
                    className="gap-1.5 hover:bg-[#0A66C2]/10 hover:text-[#0A66C2] hover:border-[#0A66C2]/30"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyArticleLink(selectedArticle)}
                    className="gap-1.5"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Link2 className="w-4 h-4" />
                        Copy Link
                      </>
                    )}
                  </Button>
                  {/* Bookmark Button */}
                  <Button
                    variant={isBookmarked(selectedArticle.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleBookmark(selectedArticle)}
                    className="gap-1.5 ml-auto"
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked(selectedArticle.id) ? 'fill-current' : ''}`} />
                    {isBookmarked(selectedArticle.id) ? 'Saved' : 'Save'}
                  </Button>
                </div>
                
                {/* Content */}
                <div className="prose prose-lg max-w-none text-foreground prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground select-text">
                  {selectedArticle.content ? (
                    <div dangerouslySetInnerHTML={{ 
                      __html: DOMPurify.sanitize(selectedArticle.content, {
                        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'img', 'span', 'div'],
                        ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'src', 'alt', 'width', 'height']
                      })
                    }} />
                  ) : (
                    <p className="text-lg leading-relaxed">{selectedArticle.excerpt}</p>
                  )}
                </div>
                
                {/* Tags */}
                {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-border">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    {selectedArticle.tags.map(tag => (
                      <Badge 
                        key={tag} 
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTag(capitalizeTag(tag));
                          setSelectedArticle(null);
                        }}
                      >
                        {capitalizeTag(tag)}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Related Articles */}
                {relatedArticles.length > 0 && (
                  <div className="mt-10 pt-8 border-t border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      Related Articles
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      {relatedArticles.map(article => (
                        <div
                          key={article.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedArticle(article);
                          }}
                          className="group cursor-pointer bg-muted/50 rounded-lg p-4 border border-border hover:border-primary/30 transition-all"
                        >
                          <div className="aspect-video rounded-md overflow-hidden mb-3 bg-muted">
                            {article.featured_image_url ? (
                              <img 
                                src={resolveImageUrl(article.featured_image_url)} 
                                alt={`${article.title} - Related article on alfred ai Blog`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Newspaper className="w-8 h-8 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {formatDate(article.published_at || article.created_at)}
                          </p>
                          <h4 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 text-sm">
                            {article.title}
                          </h4>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.article>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlogPage;