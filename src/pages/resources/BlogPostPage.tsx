import { useEffect, useState, useCallback, useRef } from "react";
import { resolveImageUrl } from "@/lib/imageUtils";
import { useParams, Link, useNavigate } from "react-router-dom";
import { SUPPORT_EMAIL, PRODUCTION_URL } from "@/lib/siteConfig";
import { motion } from "framer-motion";
import {
  ArrowLeft, Clock, Calendar, Tag, Twitter, Linkedin, Link2, Check,
  ChevronLeft, ChevronRight, Bookmark, Eye, Loader2, AlertCircle, Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import PremiumCTASection from "@/components/sections/PremiumCTASection";
import NewsletterSubscribeModal from "@/components/NewsletterSubscribeModal";
import DOMPurify from "dompurify";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useBlogViews } from "@/hooks/useBlogViews";
import AdminQuickEditBanner from "@/components/admin/AdminQuickEditBanner";
import { usePublishedBlogs, type PublishedBlogPost } from "@/hooks/usePublishedContent";
import { useRelatedContent } from "@/hooks/useRelatedContent";
import RelatedContent from "@/components/RelatedContent";

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [copiedLink, setCopiedLink] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);

  // Hooks for data fetching, bookmarks and view tracking
  const { items: posts, isLoading } = usePublishedBlogs();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { viewCounts, trackView } = useBlogViews();

  // Find the current post by slug or id
  const post = posts.find(p => p.slug === slug || p.id === slug);

  // Related articles (same category or matching tags)
  const relatedArticles = post ? posts
    .filter(p => p.id !== post.id)
    .map(p => {
      let score = 0;
      if (p.category && p.category === post.category) score += 2;
      const matchingTags = (p.tags || []).filter(tag =>
        (post.tags || []).includes(tag)
      ).length;
      score += matchingTags;
      return { post: p, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.post) : [];

  // Cross-content recommendations (guides and documentation)
  const { items: crossContentItems } = useRelatedContent({
    currentId: post?.id || '',
    currentType: 'blog',
    category: post?.category,
    tags: post?.tags,
    limit: 4,
    excludeTypes: ['blog'], // Only show guides and docs, not other blogs
  });

  // Track view on mount
  useEffect(() => {
    if (post) {
      trackView(post.id);
    }
  }, [post, trackView]);

  // Reading progress
  useEffect(() => {
    const handleScroll = () => {
      if (!articleRef.current) return;
      const element = articleRef.current;
      const scrollTop = window.scrollY - element.offsetTop;
      const scrollHeight = element.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [post]);

  // Format date
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

  // Get word count
  const getWordCount = (content: string | null) => {
    if (!content) return undefined;
    return content.split(/\s+/).filter(word => word.length > 0).length;
  };

  // Social sharing
  const getArticleUrl = useCallback(() => {
    return `${PRODUCTION_URL}/resources/blog/${post?.slug || post?.id}`;
  }, [post]);

  const shareOnTwitter = useCallback(() => {
    if (!post) return;
    const url = getArticleUrl();
    const text = encodeURIComponent(`${post.title} - Check out this article from alfred ai`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank');
  }, [post, getArticleUrl]);

  const shareOnLinkedIn = useCallback(() => {
    const url = getArticleUrl();
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  }, [getArticleUrl]);

  const copyArticleLink = useCallback(async () => {
    const url = getArticleUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }, [getArticleUrl]);

  // Handle bookmark
  const handleToggleBookmark = useCallback(() => {
    if (!post) return;
    const wasBookmarked = isBookmarked(post.id);
    toggleBookmark({ id: post.id, type: 'blog', title: post.title });
    toast.success(wasBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
  }, [post, isBookmarked, toggleBookmark]);

  // Navigate between articles
  const currentIndex = post ? posts.findIndex(p => p.id === post.id) : -1;
  const prevPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
  const nextPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-16">
          <div className="container-wide flex justify-center items-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Not found state
  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <SEO 
          title="Article Not Found" 
          description="The article you're looking for could not be found."
          noindex
        />
        <Header />
        <main className="pt-32 pb-16">
          <div className="container-wide flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-8 max-w-md">
              The article you're looking for doesn't exist or has been removed.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => navigate('/resources/blog')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Button>
              <Button asChild>
                <a href={`mailto:${SUPPORT_EMAIL}?subject=Missing Article&body=Page URL: ${window.location.href}`}>
                  <Mail className="w-4 h-4 mr-2" />
                  Report Issue
                </a>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/*
        seo_title and seo_description are OVERRIDES. Both are null on all 84
        existing posts, so the fallbacks below are what still runs today and
        nothing changed the moment the columns appeared — a new SEO field that
        blanks every meta description on the site the day it ships is worse than
        not having one.
      */}
      <SEO
        title={post.seo_title?.trim() || post.title}
        description={post.seo_description?.trim() || post.excerpt || `Read ${post.title} on the alfred ai blog.`}
        image={post.featured_image_url || undefined}
        path={`/resources/blog/${post.slug || post.id}`}
        type="article"
        article={{
          publishedTime: post.published_at || post.created_at,
          modifiedTime: post.updated_at,
          section: post.category || undefined,
          tags: post.tags || undefined,
          wordCount: getWordCount(post.content),
          image: post.featured_image_url || undefined,
        }}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Resources", url: "/resources" },
          { name: "Blog", url: "/resources/blog" },
          { name: post.title, url: `/resources/blog/${post.slug || post.id}` }
        ]}
      />
      <Header />

      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-secondary"
          style={{ width: `${readingProgress}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${readingProgress}%` }}
        />
      </div>

      <main ref={articleRef}>
        {/* Hero Section */}
        <section className="pt-32 pb-12 md:pt-40 md:pb-16 bg-background relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent pointer-events-none" />
          <motion.div
            className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px] pointer-events-none"
            animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="container-wide relative">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Link
                to="/resources/blog"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Blog
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="max-w-4xl"
            >
              {/* Category & Tags */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {post.category && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {post.category}
                  </Badge>
                )}
                {post.tags?.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight select-text">
                {post.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatFullDate(post.published_at)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {getReadTime(post.content, post.excerpt)} min read
                </span>
              <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  {viewCounts[post.id]?.total_views || 0} views
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleBookmark}
                  className={isBookmarked(post.id) ? 'text-primary border-primary/50' : ''}
                >
                  <Bookmark className={`w-4 h-4 mr-1.5 ${isBookmarked(post.id) ? 'fill-primary' : ''}`} />
                  {isBookmarked(post.id) ? 'Bookmarked' : 'Bookmark'}
                </Button>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={shareOnTwitter} className="h-8 w-8">
                    <Twitter className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={shareOnLinkedIn} className="h-8 w-8">
                    <Linkedin className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={copyArticleLink} className="h-8 w-8">
                    {copiedLink ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Admin Quick Edit */}
        <AdminQuickEditBanner adminPath={`/admin/blog/${post.id}`} label="Edit Article" />

        {/* Featured Image */}
        {post.featured_image_url && (
          <section className="pb-8">
            <div className="container-wide">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="max-w-4xl mx-auto"
              >
                <img
                  src={resolveImageUrl(post.featured_image_url)}
                  alt={`${post.title} - alfred ai Blog${post.category ? ` | ${post.category}` : ''}`}
                  className="w-full h-auto rounded-2xl shadow-lg object-cover max-h-[500px]"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                />
              </motion.div>
            </div>
          </section>
        )}

        {/* Article Content */}
        <section className="py-12">
          <div className="container-wide">
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="max-w-3xl mx-auto prose prose-lg dark:prose-invert prose-headings:scroll-mt-20 select-text"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(post.content || post.excerpt || '', {
                  ADD_TAGS: ['iframe', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'colgroup', 'col'],
                  ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'colspan', 'rowspan', 'scope']
                })
              }}
            />
          </div>
        </section>

        {/* Article Navigation */}
        <section className="py-8 border-t border-border">
          <div className="container-wide">
            <div className="max-w-4xl mx-auto flex justify-between items-center gap-4">
              {prevPost ? (
                <Link
                  to={`/resources/blog/${prevPost.slug || prevPost.id}`}
                  className="group flex items-center gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors flex-1 max-w-[45%]"
                >
                  <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">Previous</p>
                    <p className="text-sm font-medium text-foreground truncate">{prevPost.title}</p>
                  </div>
                </Link>
              ) : <div />}

              {nextPost ? (
                <Link
                  to={`/resources/blog/${nextPost.slug || nextPost.id}`}
                  className="group flex items-center gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors flex-1 max-w-[45%] text-right justify-end"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">Next</p>
                    <p className="text-sm font-medium text-foreground truncate">{nextPost.title}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              ) : <div />}
            </div>
          </div>
        </section>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="py-16 bg-muted/30">
            <div className="container-wide">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-foreground mb-8">Related Articles</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {relatedArticles.map((article) => (
                    <Link
                      key={article.id}
                      to={`/resources/blog/${article.slug || article.id}`}
                      className="group bg-background rounded-xl border border-border p-4 hover:shadow-lg hover:border-primary/30 transition-all"
                    >
                      {article.featured_image_url && (
                        <img
                          src={resolveImageUrl(article.featured_image_url)}
                          alt={article.title}
                          className="w-full h-32 object-cover rounded-lg mb-4"
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                      {article.category && (
                        <Badge variant="secondary" className="mb-2 text-xs">
                          {article.category}
                        </Badge>
                      )}
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                        {article.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {getReadTime(article.content, article.excerpt)} min
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Cross-Content Recommendations (Guides & Documentation) */}
        {crossContentItems.length > 0 && (
          <RelatedContent
            items={crossContentItems}
            title="Explore Related Resources"
            subtitle="Deepen your knowledge with guides and documentation on similar topics."
            columns={crossContentItems.length >= 4 ? 4 : crossContentItems.length >= 2 ? 2 : 3}
          />
        )}

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
        source="blog_post"
      />
    </div>
  );
};

export default BlogPostPage;
