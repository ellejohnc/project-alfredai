import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import DOMPurify from "dompurify";
import { resolveImageUrl } from "@/lib/imageUtils";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { Link, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, FileText, Download, Eye, Book, 
  CheckCircle, Lock, Star, Clock, X, Loader2, Mail,
  ChevronLeft, ChevronRight, Filter, Sparkles, Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import SEO from "@/components/SEO";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BookingChatModal from "@/components/BookingChatModal";
import PremiumCTASection from "@/components/sections/PremiumCTASection";
import CountdownTimer from "@/components/CountdownTimer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ResourceAccessFields } from "@/components/resources/ResourceAccessFields";
import { initialResourceAccessValues, validateResourceAccess, normaliseResourceAccess, type ResourceAccessValues, type ResourceAccessErrors } from "@/lib/resourceAccess";
import { saveCountryCode } from "@/lib/phoneUtils";
import AdminQuickEditBanner from "@/components/admin/AdminQuickEditBanner";
import { usePublishedGuides, type PublishedGuide } from "@/hooks/usePublishedContent";
import { ApiErrorBanner } from "@/components/ui/ApiErrorBanner";

type Guide = PublishedGuide;

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'Implementation', label: 'Implementation' },
  { value: 'Playbook', label: 'Playbook' },
  { value: 'Framework', label: 'Framework' },
  { value: 'Technical', label: 'Technical' },
  { value: 'Best Practices', label: 'Best Practices' },
  { value: 'Strategy', label: 'Strategy' },
];

const DIFFICULTY_LEVELS = [
  { value: 'all', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const ACCESS_TYPES = [
  { value: 'all', label: 'All Access' },
  { value: 'free', label: 'Free Downloads' },
  { value: 'gated', label: 'Exclusive (Email Required)' },
];

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


const ITEMS_PER_PAGE = 12;

// Generate unlock date (7 days from now for gated content)
const getUnlockDate = (guide: Guide): Date | null => {
  if (!guide.is_gated) return null;
  const publishedDate = guide.published_at ? new Date(guide.published_at) : new Date(guide.created_at);
  const unlockDate = new Date(publishedDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days after publish
  return unlockDate > new Date() ? unlockDate : null;
};

const GuidesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedAccess, setSelectedAccess] = useState('all');
  const [previewModal, setPreviewModal] = useState<Guide | null>(null);
  const [accessModal, setAccessModal] = useState<Guide | null>(null);
  const [access, setAccess] = useState<ResourceAccessValues>(() => initialResourceAccessValues());
  const [accessErrors, setAccessErrors] = useState<ResourceAccessErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const guideRefs = useRef<Record<string, HTMLElement | null>>({});
  const [latestIndex, setLatestIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch guides using cached hook
  const { items: guides, isLoading, error: guidesError, refetch: refetchGuides } = usePublishedGuides();

  // Handle ?article= query parameter
  useEffect(() => {
    const articleParam = searchParams.get("article");
    if (articleParam && guides.length > 0) {
      const guide = guides.find(g => g.id === articleParam);
      if (guide) {
        setTimeout(() => {
          const guideEl = guideRefs.current[articleParam];
          if (guideEl) {
            guideEl.scrollIntoView({ behavior: "smooth", block: "center" });
            handleViewGuide(guide);
          }
        }, 300);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, setSearchParams, guides]);

  // Filter guides
  const filteredGuides = useMemo(() => {
    return guides.filter(g => {
      const categoryMatch = selectedCategory === 'all' || g.category === selectedCategory;
      const difficultyMatch = selectedDifficulty === 'all' || 
        g.difficulty_level?.toLowerCase() === selectedDifficulty.toLowerCase();
      const accessMatch = selectedAccess === 'all' || 
        (selectedAccess === 'gated' && g.is_gated) ||
        (selectedAccess === 'free' && !g.is_gated);
      return categoryMatch && difficultyMatch && accessMatch;
    });
  }, [guides, selectedCategory, selectedDifficulty, selectedAccess]);

  // Pagination
  const totalPages = Math.ceil(filteredGuides.length / ITEMS_PER_PAGE);
  const paginatedGuides = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredGuides.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredGuides, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedDifficulty, selectedAccess]);

  // Get available categories and difficulties from data
  const availableCategories = useMemo(() => {
    const cats = new Set(guides.map(g => g.category).filter(Boolean));
    return CATEGORIES.filter(c => c.value === 'all' || cats.has(c.value));
  }, [guides]);

  const availableDifficulties = useMemo(() => {
    const diffs = new Set(guides.map(g => g.difficulty_level?.toLowerCase()).filter(Boolean));
    return DIFFICULTY_LEVELS.filter(d => d.value === 'all' || diffs.has(d.value));
  }, [guides]);

  // Featured guides (manually marked) or latest 3
  const featuredGuides = useMemo(() => {
    const featured = guides.filter(g => g.is_featured);
    return featured.length > 0 ? featured : guides.slice(0, 3);
  }, [guides]);

  // Auto-cycle featured guides
  useEffect(() => {
    if (featuredGuides.length <= 1 || isPaused) return;
    
    const interval = setInterval(() => {
      setLatestIndex(prev => (prev + 1) % featuredGuides.length);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [featuredGuides.length, isPaused]);

  const goToPrevFeatured = useCallback(() => {
    setLatestIndex(prev => (prev - 1 + featuredGuides.length) % featuredGuides.length);
  }, [featuredGuides.length]);

  const goToNextFeatured = useCallback(() => {
    setLatestIndex(prev => (prev + 1) % featuredGuides.length);
  }, [featuredGuides.length]);

  const handleViewGuide = (guide: Guide) => {
    if (guide.is_gated) {
      setAccessModal(guide);
    } else {
      setPreviewModal(guide);
    }
  };

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
        message: `Requested access to: ${accessModal?.title}. Annual company turnover: ${access.turnover}. Consented to contact by phone, SMS and email.`
      });

      // Send email with download link
      try {
        await supabase.functions.invoke('send-guide-access', {
          body: {
            name,
            email,
            guideTitle: accessModal?.title,
            guideDescription: accessModal?.description,
            downloadUrl: accessModal?.file_url
          }
        });
        console.log("Guide access email sent successfully");
      } catch (emailError) {
        console.error("Failed to send guide access email:", emailError);
        // Don't fail the access if email fails
      }

      // Log the guide access for admin tracking
      try {
        await supabase.functions.invoke('log-guide-access', {
          body: {
            guideId: accessModal?.id,
            guideTitle: accessModal?.title,
            userEmail: email,
            userName: name
          }
        });
        console.log("Guide access logged successfully");
      } catch (logError) {
        console.error("Failed to log guide access:", logError);
        // Don't fail the access if logging fails
      }

      toast.success("Access granted! Check your email for the download link.");
      
      // If there's a file, trigger download
      if (accessModal?.file_url) {
        window.open(accessModal.file_url, '_blank');
      }
      
      // Show the content
      setPreviewModal(accessModal);
      setAccessModal(null);
      setAccess((a) => ({ ...a, consent: false }));
      setAccessErrors({});
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = (guide: Guide) => {
    if (guide.file_url) {
      window.open(guide.file_url, '_blank');
      toast.success(`Downloading "${guide.title}"...`);
    }
  };

  const getDifficultyConfig = (level: string | null) => {
    if (!level) return null;
    return difficultyConfig[level.toLowerCase()] || null;
  };

  // Calculate word count for content
  const getWordCount = (content: string | null) => {
    if (!content) return undefined;
    return content.split(/\s+/).filter(word => word.length > 0).length;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Dynamic SEO based on whether guide is being previewed */}
      {previewModal ? (
        <SEO 
          title={previewModal.title}
          description={previewModal.description || `Read ${previewModal.title} - a comprehensive guide from alfred ai.`}
          image={previewModal.featured_image_url || undefined}
          path={`/resources/guides?article=${previewModal.id}`}
          type="article"
          article={{
            publishedTime: previewModal.published_at || previewModal.created_at,
            modifiedTime: previewModal.updated_at,
            section: previewModal.category || 'Guides',
            tags: [
              previewModal.category || 'Guide',
              previewModal.difficulty_level || 'All Levels',
              previewModal.is_gated ? 'Exclusive' : 'Free Download'
            ].filter(Boolean) as string[],
            wordCount: getWordCount(previewModal.content),
            image: previewModal.featured_image_url || undefined,
          }}
          breadcrumbs={[
            { name: "Home", url: "/" },
            { name: "Resources", url: "/resources" },
            { name: "Guides", url: "/resources/guides" },
            { name: previewModal.title, url: `/resources/guides?article=${previewModal.id}` }
          ]}
        />
      ) : (
        <SEO 
          title="Guides & Playbooks" 
          description="Download free guides, playbooks, and frameworks to help you implement AI automation in your business."
          breadcrumbs={[
            { name: "Home", url: "/" },
            { name: "Resources", url: "/resources" },
            { name: "Guides", url: "/resources/guides" }
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
                <Book className="w-8 h-8 text-primary-foreground" />
              </motion.div>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
                Guides & Playbooks
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
                Comprehensive resources to help you implement, optimize, and scale automation in your organization.
              </p>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-6 mt-8">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{guides.length}</p>
                    <p className="text-sm text-muted-foreground">Resources</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{guides.filter(g => g.is_gated).length}</p>
                    <p className="text-sm text-muted-foreground">Exclusive</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Admin Quick Edit Banner */}
        <AdminQuickEditBanner adminPath="/admin/guides" label="Manage Guides" />

        {/* API Error Banner */}
        {guidesError && (
          <div className="container-wide py-4">
            <ApiErrorBanner
              error={guidesError}
              onRetry={() => refetchGuides()}
              context="loading guides"
            />
          </div>
        )}

        {/* Loading State with Skeleton */}
        {isLoading && (
          <section className="py-12 bg-background">
            <div className="container-wide">
              <div className="space-y-8">
                {/* Featured skeleton */}
                <div className="bg-card rounded-3xl border border-border p-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="aspect-[4/3] bg-muted rounded-xl animate-pulse" />
                    <div className="space-y-4 flex flex-col justify-center">
                      <div className="flex gap-2">
                        <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
                        <div className="h-6 w-24 bg-muted rounded-full animate-pulse" />
                      </div>
                      <div className="h-8 w-3/4 bg-muted rounded animate-pulse" />
                      <div className="h-5 w-full bg-muted rounded animate-pulse" />
                      <div className="h-5 w-2/3 bg-muted rounded animate-pulse" />
                      <div className="h-10 w-36 bg-muted rounded-lg animate-pulse mt-4" />
                    </div>
                  </div>
                </div>
                {/* Grid skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
                      <div className="aspect-[16/9] bg-muted animate-pulse" />
                      <div className="p-5 space-y-3">
                        <div className="flex gap-2">
                          <div className="h-5 w-20 bg-muted rounded-full animate-pulse" />
                          <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
                        </div>
                        <div className="h-6 w-full bg-muted rounded animate-pulse" />
                        <div className="h-4 w-full bg-muted rounded animate-pulse" />
                        <div className="h-4 w-4/5 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Featured Releases Section */}
        {!isLoading && featuredGuides.length > 0 && (
          <section className="py-16 bg-gradient-to-b from-primary/5 to-background relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="container-wide relative">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                <div>
                  <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Featured Resources</h2>
                  <p className="text-muted-foreground max-w-xl">
                    Hand-picked guides and playbooks to supercharge your automation journey.
                  </p>
                </div>
                {featuredGuides.length > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={goToPrevFeatured}
                      onMouseEnter={() => setIsPaused(true)}
                      onMouseLeave={() => setIsPaused(false)}
                      className="rounded-full"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex gap-1.5">
                      {featuredGuides.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setLatestIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            idx === latestIndex 
                              ? 'bg-primary w-6' 
                              : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                          }`}
                        />
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={goToNextFeatured}
                      onMouseEnter={() => setIsPaused(true)}
                      onMouseLeave={() => setIsPaused(false)}
                      className="rounded-full"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Featured Guide Showcase */}
              <AnimatePresence mode="wait">
                {featuredGuides[latestIndex] && (
                  <motion.div
                    key={featuredGuides[latestIndex].id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                    className="bg-card rounded-3xl border-2 border-primary/20 shadow-2xl shadow-primary/10 overflow-hidden"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                  >
                    <div className="grid md:grid-cols-2 gap-0">
                      {/* Image Side */}
                      <div className="relative aspect-[4/3] md:aspect-auto">
                        {featuredGuides[latestIndex].featured_image_url ? (
                          <img 
                            src={resolveImageUrl(featuredGuides[latestIndex].featured_image_url)} 
                            alt={featuredGuides[latestIndex].title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                            <Book className="w-20 h-20 text-primary/40" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-card/80 hidden md:block" />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent md:hidden" />
                        
                        {/* Badges overlay */}
                        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                          <Badge className="bg-primary text-primary-foreground shadow-lg">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            Featured
                          </Badge>
                          {featuredGuides[latestIndex].is_gated && (
                            <Badge className="bg-amber-500 text-white shadow-lg">
                              <Lock className="w-3 h-3 mr-1" />
                              Exclusive
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Content Side */}
                      <div className="p-8 md:p-10 flex flex-col justify-center">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          {featuredGuides[latestIndex].category && (
                            <Badge variant="secondary">{featuredGuides[latestIndex].category}</Badge>
                          )}
                          {getDifficultyConfig(featuredGuides[latestIndex].difficulty_level) && (
                            <Badge className={`${getDifficultyConfig(featuredGuides[latestIndex].difficulty_level)?.color} border`}>
                              <span className="mr-1">{getDifficultyConfig(featuredGuides[latestIndex].difficulty_level)?.icon}</span>
                              {getDifficultyConfig(featuredGuides[latestIndex].difficulty_level)?.label}
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                          {featuredGuides[latestIndex].title}
                        </h3>
                        
                        <p className="text-muted-foreground mb-6 line-clamp-3">
                          {featuredGuides[latestIndex].description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                          {featuredGuides[latestIndex].estimated_read_time && (
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              {featuredGuides[latestIndex].estimated_read_time} min read
                            </span>
                          )}
                          {featuredGuides[latestIndex].published_at && (
                            <span className="flex items-center gap-1.5">
                              <FileText className="w-4 h-4" />
                              {new Date(featuredGuides[latestIndex].published_at).toLocaleDateString('en-AU', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          )}
                        </div>
                        
                        {/* Countdown for gated content */}
                        {getUnlockDate(featuredGuides[latestIndex]) && (
                          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Timer className="w-4 h-4 text-amber-600" />
                              <span className="text-sm font-medium text-amber-600">Free Access Unlocks In</span>
                            </div>
                            <CountdownTimer 
                              targetDate={getUnlockDate(featuredGuides[latestIndex])!} 
                              compact 
                            />
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-3">
                          <Button 
                            size="lg"
                            onClick={() => handleViewGuide(featuredGuides[latestIndex])}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
                          >
                            <Eye className="w-5 h-5 mr-2" />
                            {featuredGuides[latestIndex].is_gated ? 'Get Exclusive Access' : 'Read Now'}
                          </Button>
                          {featuredGuides[latestIndex].file_url && !featuredGuides[latestIndex].is_gated && (
                            <Button 
                              size="lg"
                              variant="outline"
                              onClick={() => handleDownload(featuredGuides[latestIndex])}
                            >
                              <Download className="w-5 h-5 mr-2" />
                              Download PDF
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* Filter Section */}
        {!isLoading && guides.length > 0 && (
          <section className="py-8 bg-background border-b border-border">
            <div className="container-wide">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium text-foreground">Filters</span>
                  <span className="text-sm text-muted-foreground">
                    ({filteredGuides.length} result{filteredGuides.length !== 1 ? 's' : ''})
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  {/* Category Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <FileText className="w-4 h-4" />
                        {availableCategories.find(c => c.value === selectedCategory)?.label || 'All Categories'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
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
                  
                  {/* Difficulty Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Sparkles className="w-4 h-4" />
                        {availableDifficulties.find(d => d.value === selectedDifficulty)?.label || 'All Levels'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {availableDifficulties.map(diff => (
                        <DropdownMenuItem
                          key={diff.value}
                          onClick={() => setSelectedDifficulty(diff.value)}
                          className={selectedDifficulty === diff.value ? 'bg-primary/10 text-primary' : ''}
                        >
                          {diff.value !== 'all' && difficultyConfig[diff.value] && (
                            <span className="mr-2">{difficultyConfig[diff.value].icon}</span>
                          )}
                          {diff.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {/* Access Type Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Lock className="w-4 h-4" />
                        {ACCESS_TYPES.find(a => a.value === selectedAccess)?.label || 'All Access'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {ACCESS_TYPES.map(access => (
                        <DropdownMenuItem
                          key={access.value}
                          onClick={() => setSelectedAccess(access.value)}
                          className={selectedAccess === access.value ? 'bg-primary/10 text-primary' : ''}
                        >
                          {access.value === 'free' && <Download className="w-4 h-4 mr-2" />}
                          {access.value === 'gated' && <Lock className="w-4 h-4 mr-2" />}
                          {access.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {/* Clear Filters */}
                  {(selectedCategory !== 'all' || selectedDifficulty !== 'all' || selectedAccess !== 'all') && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedCategory('all');
                        setSelectedDifficulty('all');
                        setSelectedAccess('all');
                      }}
                      className="gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                      Clear filters
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* All Guides Grid */}
        {!isLoading && (
          <section className="py-16 bg-background">
            <div className="container-wide">
              <h2 className="text-2xl font-bold text-foreground mb-8">All Resources</h2>
              
              {/* Guides Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedGuides.map((guide, index) => {
                  const diffConfig = getDifficultyConfig(guide.difficulty_level);
                  const unlockDate = getUnlockDate(guide);
                  
                  return (
                    <motion.div
                      key={guide.id}
                      ref={(el) => (guideRefs.current[guide.id] = el)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`group bg-card rounded-2xl border overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col h-full ${
                        searchParams.get("article") === guide.id ? "border-primary ring-2 ring-primary/20" : "border-border"
                      }`}
                    >
                      {/* Fixed height image section */}
                      <div className="h-48 relative overflow-hidden flex-shrink-0">
                        {guide.featured_image_url ? (
                          <img 
                            src={resolveImageUrl(guide.featured_image_url)} 
                            alt={guide.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                            <Book className="w-12 h-12 text-muted-foreground/50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
                        
                        {/* Badges */}
                        <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-2">
                          {guide.is_gated && (
                            <Badge className="bg-amber-500/90 text-white backdrop-blur-sm">
                              <Lock className="w-3 h-3 mr-1" />
                              Exclusive
                            </Badge>
                          )}
                          {guide.file_url && !guide.is_gated && (
                            <Badge className="bg-emerald-500/90 text-white backdrop-blur-sm">
                              <Download className="w-3 h-3 mr-1" />
                              PDF Ready
                            </Badge>
                          )}
                          {diffConfig && (
                            <Badge className={`${diffConfig.color} border backdrop-blur-sm`}>
                              <span className="mr-1">{diffConfig.icon}</span>
                              {diffConfig.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Content section with flex-grow */}
                      <div className="p-4 flex flex-col flex-grow">
                        {guide.category && (
                          <Badge variant="secondary" className="mb-2 w-fit">
                            {guide.category}
                          </Badge>
                        )}
                        <h3 className="font-bold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-2">
                          {guide.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-grow">
                          {guide.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                          {guide.estimated_read_time ? (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {guide.estimated_read_time} min
                            </span>
                          ) : (
                            <span />
                          )}
                          {guide.file_url && (
                            <span className="flex items-center gap-1 text-primary">
                              <Download className="w-3.5 h-3.5" />
                              PDF
                            </span>
                          )}
                        </div>
                        
                        {/* Countdown for gated */}
                        {unlockDate && (
                          <div className="mb-4 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-1">
                              <Timer className="w-3 h-3" />
                              <span className="font-medium">Unlocks in</span>
                            </div>
                            <CountdownTimer targetDate={unlockDate} compact />
                          </div>
                        )}
                        
                        <Button 
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-auto"
                          onClick={() => handleViewGuide(guide)}
                        >
                          {guide.is_gated ? (
                            <>
                              <Lock className="w-4 h-4 mr-2" />
                              Get Access
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-2" />
                              View Guide
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first, last, and pages around current
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                        // Show ellipsis
                        if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}

              {filteredGuides.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Book className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No guides found</h3>
                  <p className="text-muted-foreground mb-4">Try adjusting your filters to see more results.</p>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedDifficulty('all');
                      setSelectedAccess('all');
                    }}
                  >
                    Clear all filters
                  </Button>
                </motion.div>
              )}
            </div>
          </section>
        )}

        {/* Premium CTA */}
        <PremiumCTASection 
          title="Ready to supercharge your workflow?"
          description="Book an Impact Conversation to see how these guides apply to your organization."
          buttonText="Book Your Session"
          onButtonClick={() => setIsBookingOpen(true)}
        />
      </main>
      
      <Footer />

      {/* Access Modal for Gated Content */}
      <AnimatePresence>
        {accessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setAccessModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card rounded-2xl border border-border shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with image */}
              <div className="relative h-48 overflow-hidden">
                {accessModal.featured_image_url ? (
                  <img 
                    src={resolveImageUrl(accessModal.featured_image_url)} 
                    alt={accessModal.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                <button
                  onClick={() => setAccessModal(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
                <div className="absolute bottom-4 left-6 right-6">
                  <Badge className="mb-2 bg-amber-500 text-white">
                    <Lock className="w-3 h-3 mr-1" />
                    Exclusive Resource
                  </Badge>
                  <h3 className="text-xl font-bold text-foreground">{accessModal.title}</h3>
                </div>
              </div>
              
              {/* Form */}
              <form onSubmit={handleAccessSubmit} className="p-6">
                <p className="text-muted-foreground mb-6">
                  Enter your details below to get instant access to this exclusive resource.
                </p>
                
                {getUnlockDate(accessModal) && (
                  <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Timer className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-600">Or wait for free access</span>
                    </div>
                    <CountdownTimer targetDate={getUnlockDate(accessModal)!} compact />
                  </div>
                )}
                
                <ResourceAccessFields values={access} errors={accessErrors} onChange={setAccess} idPrefix="guides" />
                
                <Button 
                  type="submit" 
                  className="w-full mt-6 bg-primary hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {isSubmitting ? 'Processing...' : 'Get Instant Access'}
                </Button>
                
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card rounded-2xl border border-border shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-border flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-2">
                    {previewModal.category && <Badge>{previewModal.category}</Badge>}
                    {getDifficultyConfig(previewModal.difficulty_level) && (
                      <Badge className={`${getDifficultyConfig(previewModal.difficulty_level)?.color} border`}>
                        <span className="mr-1">{getDifficultyConfig(previewModal.difficulty_level)?.icon}</span>
                        {getDifficultyConfig(previewModal.difficulty_level)?.label}
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{previewModal.title}</h2>
                  <p className="text-muted-foreground mt-2">{previewModal.description}</p>
                </div>
                <button
                  onClick={() => setPreviewModal(null)}
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {previewModal.content ? (
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(previewModal.content, {
                        ALLOWED_TAGS: ['p','br','strong','em','u','s','ul','ol','li','a','h1','h2','h3','h4','h5','h6','blockquote','code','pre','img','span','div','table','thead','tbody','tr','th','td','hr'],
                        ALLOWED_ATTR: ['href','target','rel','class','src','alt','title']
                      })
                    }}
                  />
                ) : (
                  <div className="text-center py-12">
                    <Book className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Content coming soon...</p>
                  </div>
                )}
              </div>
              
              {/* Footer */}
              {previewModal.file_url && (
                <div className="p-6 border-t border-border bg-muted/30">
                  <Button 
                    onClick={() => handleDownload(previewModal)}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download Full PDF
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BookingChatModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
    </div>
  );
};

export default GuidesPage;
