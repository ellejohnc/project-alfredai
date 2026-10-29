import { useEffect, useState, useCallback, useRef } from "react";
import { resolveImageUrl } from "@/lib/imageUtils";
import { useParams, Link, useNavigate } from "react-router-dom";
import { SUPPORT_EMAIL } from "@/lib/siteConfig";
import { motion } from "framer-motion";
import {
  ArrowLeft, Clock, Calendar, Twitter, Linkedin, Link2, Check,
  ChevronLeft, ChevronRight, Download, Lock, Loader2, AlertCircle, Mail,
  Star, Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import PremiumCTASection from "@/components/sections/PremiumCTASection";
import RelatedContent from "@/components/RelatedContent";
import NewsletterSubscribeModal from "@/components/NewsletterSubscribeModal";
import DOMPurify from "dompurify";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useBookmarks } from "@/hooks/useBookmarks";
import AdminQuickEditBanner from "@/components/admin/AdminQuickEditBanner";
import { usePublishedGuides } from "@/hooks/usePublishedContent";
import { useRelatedContent } from "@/hooks/useRelatedContent";
import { supabase } from "@/integrations/supabase/client";
import { ResourceAccessFields } from "@/components/resources/ResourceAccessFields";
import { initialResourceAccessValues, validateResourceAccess, normaliseResourceAccess, type ResourceAccessValues, type ResourceAccessErrors } from "@/lib/resourceAccess";
import { saveCountryCode } from "@/lib/phoneUtils";


const difficultyConfig: Record<string, { label: string; color: string; icon: string }> = {
  'beginner': { 
    label: 'Beginner', 
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    icon: '🌱'
  },
  'intermediate': { 
    label: 'Intermediate', 
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    icon: '🔥'
  },
  'advanced': { 
    label: 'Advanced', 
    color: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    icon: '🚀'
  },
};

const GuideDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [copiedLink, setCopiedLink] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showAccessForm, setShowAccessForm] = useState(false);
  const [access, setAccess] = useState<ResourceAccessValues>(() => initialResourceAccessValues());
  const [accessErrors, setAccessErrors] = useState<ResourceAccessErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);

  // Hooks for data fetching and bookmarks
  const { items: guides, isLoading } = usePublishedGuides();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  // Find the current guide
  const guide = guides.find(g => g.id === id);

  // Get related content
  const { items: relatedItems } = useRelatedContent({
    currentId: id || '',
    currentType: 'guide',
    category: guide?.category,
    limit: 6,
  });

  // Check if user already has access (via localStorage)
  useEffect(() => {
    if (guide) {
      const accessKey = `guide_access_${guide.id}`;
      const hasStoredAccess = localStorage.getItem(accessKey);
      if (hasStoredAccess || !guide.is_gated) {
        setHasAccess(true);
      }
    }
  }, [guide]);

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
  }, [guide]);

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

  // Get word count
  const getWordCount = (content: string | null) => {
    if (!content) return undefined;
    return content.split(/\s+/).filter(word => word.length > 0).length;
  };

  const getDifficultyConfig = (level: string | null) => {
    if (!level) return null;
    return difficultyConfig[level.toLowerCase()] || null;
  };

  // Social sharing
  const getGuideUrl = useCallback(() => {
    return `${window.location.origin}/resources/guides/${guide?.id}`;
  }, [guide]);

  const shareOnTwitter = useCallback(() => {
    if (!guide) return;
    const url = getGuideUrl();
    const text = encodeURIComponent(`${guide.title} - Check out this guide from alfred ai`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank');
  }, [guide, getGuideUrl]);

  const shareOnLinkedIn = useCallback(() => {
    const url = getGuideUrl();
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  }, [getGuideUrl]);

  const copyGuideLink = useCallback(async () => {
    const url = getGuideUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }, [getGuideUrl]);

  // Handle bookmark
  const handleToggleBookmark = useCallback(() => {
    if (!guide) return;
    const wasBookmarked = isBookmarked(guide.id);
    toggleBookmark({ id: guide.id, type: 'guide', title: guide.title });
    toast.success(wasBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
  }, [guide, isBookmarked, toggleBookmark]);

  // Handle access form submit
  const handleAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateResourceAccess(access);
    setAccessErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Please complete all fields and tick the agreement box.");
      return;
    }
    const lead = normaliseResourceAccess(access);
    const name = lead.fullName;
    const email = lead.email;
    try {
      localStorage.setItem("alfred_lead_identity", JSON.stringify({ name, firstName: lead.firstName, lastName: lead.lastName, email, phone: lead.phone, company: lead.company, turnover: access.turnover }));
      saveCountryCode(access.countryCode);
    } catch { /* storage unavailable */ }

    setIsSubmitting(true);

    try {
      // Save lead to database
      await supabase.from('leads').insert({
        email,
        first_name: lead.firstName,
        last_name: lead.lastName,
        phone: lead.phone,
        company: lead.company,
        lead_type: 'guide_download',
        message: `Requested access to: ${guide?.title}. Annual company turnover: ${access.turnover}. Consented to contact by phone, SMS and email.`
      });

      // Send email with download link
      try {
        await supabase.functions.invoke('send-guide-access', {
          body: {
            name,
            email,
            guideTitle: guide?.title,
            guideDescription: guide?.description,
            downloadUrl: guide?.file_url
          }
        });
      } catch (emailError) {
        console.error("Failed to send guide access email:", emailError);
      }

      // Log the guide access
      try {
        await supabase.functions.invoke('log-guide-access', {
          body: {
            guideId: guide?.id,
            guideTitle: guide?.title,
            userEmail: email,
            userName: name
          }
        });
      } catch (logError) {
        console.error("Failed to log guide access:", logError);
      }

      // Store access in localStorage
      if (guide) {
        localStorage.setItem(`guide_access_${guide.id}`, 'true');
      }

      toast.success("Access granted! Check your email for the download link.");
      setHasAccess(true);
      setShowAccessForm(false);
      setAccess((a) => ({ ...a, consent: false }));
      setAccessErrors({});
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle download
  const handleDownload = () => {
    if (guide?.file_url) {
      window.open(guide.file_url, '_blank');
      toast.success(`Downloading "${guide.title}"...`);
    }
  };

  // Navigate between guides
  const currentIndex = guide ? guides.findIndex(g => g.id === guide.id) : -1;
  const prevGuide = currentIndex > 0 ? guides[currentIndex - 1] : null;
  const nextGuide = currentIndex < guides.length - 1 ? guides[currentIndex + 1] : null;

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
  if (!guide) {
    return (
      <div className="min-h-screen bg-background">
        <SEO 
          title="Guide Not Found" 
          description="The guide you're looking for could not be found."
          noindex
        />
        <Header />
        <main className="pt-32 pb-16">
          <div className="container-wide flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Guide Not Found</h1>
            <p className="text-muted-foreground mb-8 max-w-md">
              The guide you're looking for doesn't exist or has been removed.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => navigate('/resources/guides')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Guides
              </Button>
              <Button asChild>
                <a href={`mailto:${SUPPORT_EMAIL}?subject=Missing Guide&body=Page URL: ${window.location.href}`}>
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

  const difficulty = getDifficultyConfig(guide.difficulty_level);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={guide.title}
        description={guide.description || `Read ${guide.title} - a comprehensive guide from alfred ai.`}
        image={guide.featured_image_url || undefined}
        path={`/resources/guides/${guide.id}`}
        type="article"
        article={{
          publishedTime: guide.published_at || guide.created_at,
          modifiedTime: guide.updated_at,
          section: guide.category || 'Guides',
          tags: [
            guide.category || 'Guide',
            guide.difficulty_level || 'All Levels',
            guide.is_gated ? 'Exclusive' : 'Free Download'
          ].filter(Boolean) as string[],
          wordCount: getWordCount(guide.content),
          image: guide.featured_image_url || undefined,
        }}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Resources", url: "/resources" },
          { name: "Guides", url: "/resources/guides" },
          { name: guide.title, url: `/resources/guides/${guide.id}` }
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
                to="/resources/guides"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Guides
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="max-w-4xl"
            >
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {guide.is_gated && (
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                    <Lock className="w-3 h-3 mr-1" />
                    Exclusive
                  </Badge>
                )}
                {guide.category && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {guide.category}
                  </Badge>
                )}
                {difficulty && (
                  <Badge variant="outline" className={`text-xs ${difficulty.color}`}>
                    <span className="mr-1">{difficulty.icon}</span>
                    {difficulty.label}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                {guide.title}
              </h1>

              {/* Description */}
              {guide.description && (
                <p className="text-xl text-muted-foreground mb-6 max-w-3xl">
                  {guide.description}
                </p>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatFullDate(guide.published_at)}
                </span>
                {guide.estimated_read_time && (
                  <span className="flex items-center gap-1.5">
                    <Timer className="w-4 h-4" />
                    {guide.estimated_read_time} min read
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3">
                {guide.file_url && hasAccess && (
                  <Button onClick={handleDownload} className="glow-pulse">
                    <Download className="w-4 h-4 mr-2" />
                    Download Guide
                  </Button>
                )}
                {guide.is_gated && !hasAccess && (
                  <Button onClick={() => setShowAccessForm(true)} className="glow-pulse">
                    <Lock className="w-4 h-4 mr-2" />
                    Get Access
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleBookmark}
                  className={isBookmarked(guide.id) ? 'text-primary border-primary/50' : ''}
                >
                  <Star className={`w-4 h-4 mr-1.5 ${isBookmarked(guide.id) ? 'fill-primary' : ''}`} />
                  {isBookmarked(guide.id) ? 'Saved' : 'Save'}
                </Button>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={shareOnTwitter} className="h-8 w-8">
                    <Twitter className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={shareOnLinkedIn} className="h-8 w-8">
                    <Linkedin className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={copyGuideLink} className="h-8 w-8">
                    {copiedLink ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Admin Quick Edit */}
        <AdminQuickEditBanner adminPath={`/admin/guides/${guide.id}`} label="Edit Guide" />

        {/* Access Form Modal */}
        {showAccessForm && guide.is_gated && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-background border border-border rounded-2xl p-6 shadow-xl"
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Get Exclusive Access</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Enter your details to unlock this guide and receive a download link.
                </p>
              </div>
              
              <form onSubmit={handleAccessSubmit} className="space-y-4">
                <ResourceAccessFields values={access} errors={accessErrors} onChange={setAccess} idPrefix="guide" />
                
                <div className="flex gap-3 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAccessForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Get Access
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Featured Image */}
        {guide.featured_image_url && (
          <section className="pb-8">
            <div className="container-wide">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="max-w-4xl mx-auto"
              >
                <img
                  src={resolveImageUrl(guide.featured_image_url)}
                  alt={guide.title}
                  className="w-full h-auto rounded-2xl shadow-lg object-cover max-h-[500px]"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                />
              </motion.div>
            </div>
          </section>
        )}

        {/* Guide Content */}
        {(hasAccess || !guide.is_gated) && guide.content && (
          <section className="py-12">
            <div className="container-wide">
              <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="max-w-3xl mx-auto prose prose-lg dark:prose-invert prose-headings:scroll-mt-20"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(guide.content, {
                    ADD_TAGS: ['iframe'],
                    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling']
                  })
                }}
              />
            </div>
          </section>
        )}

        {/* Gated content placeholder */}
        {!hasAccess && guide.is_gated && (
          <section className="py-12">
            <div className="container-wide">
              <div className="max-w-3xl mx-auto text-center py-16 px-6 bg-muted/30 rounded-2xl border border-border">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Unlock This Exclusive Guide
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Enter your email to access the full content and receive a downloadable copy.
                </p>
                <Button onClick={() => setShowAccessForm(true)} size="lg" className="glow-pulse">
                  <Lock className="w-4 h-4 mr-2" />
                  Get Access Now
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Guide Navigation */}
        <section className="py-8 border-t border-border">
          <div className="container-wide">
            <div className="max-w-4xl mx-auto flex justify-between items-center gap-4">
              {prevGuide ? (
                <Link
                  to={`/resources/guides/${prevGuide.id}`}
                  className="group flex items-center gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors flex-1 max-w-[45%]"
                >
                  <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">Previous</p>
                    <p className="text-sm font-medium text-foreground truncate">{prevGuide.title}</p>
                  </div>
                </Link>
              ) : <div />}

              {nextGuide ? (
                <Link
                  to={`/resources/guides/${nextGuide.id}`}
                  className="group flex items-center gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors flex-1 max-w-[45%] text-right justify-end"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">Next</p>
                    <p className="text-sm font-medium text-foreground truncate">{nextGuide.title}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              ) : <div />}
            </div>
          </div>
        </section>

        {/* Related Content */}
        <RelatedContent
          items={relatedItems}
          title="Related Resources"
          subtitle="Continue exploring our guides, articles, and documentation"
        />

        {/* CTA Section */}
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
        source="guide_detail"
      />
    </div>
  );
};

export default GuideDetailPage;
