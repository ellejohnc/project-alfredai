// Testimonials page - Customer success stories and reviews
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, Quote, Building2, Home, Users2, Shield, 
  Filter, Play, Star, Loader2, X, Heart, Briefcase, Factory,
  Video, MessageSquareQuote, Users, TrendingUp, Cpu, ShoppingBag,
  Hotel, Stethoscope, HardHat, MoreHorizontal, type LucideIcon,
  ChevronLeft, ChevronRight, Sparkles, ChevronDown
} from "lucide-react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import LazyImage from "@/components/ui/lazy-image";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
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
} from "@/components/ui/pagination";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BookingChatModal from "@/components/BookingChatModal";
import PremiumCTASection from "@/components/sections/PremiumCTASection";
import AdminQuickEditBanner from "@/components/admin/AdminQuickEditBanner";
import SEO from "@/components/SEO";
import { usePublishedTestimonials, PublishedTestimonial } from "@/hooks/usePublishedContent";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { formatPrivacyName, getUniqueHeadshot, initializeHeadshotAssignments } from "@/lib/headshotMapping";

// Import custom video cover images
import webinarCover from "@/assets/video-covers/webinar-testimonials-cover.jpg";
import jcaCover from "@/assets/video-covers/jca-lift-cover.jpg";
import marketingCover from "@/assets/video-covers/marketing-agency-cover.jpg";
import inflowCover from "@/assets/video-covers/inflow-cover.jpg";

// Custom cover image mapping by video ID
const customCovers: Record<string, string> = {
  'OVZVpaUJU_U': webinarCover,
  'tD36AH05ysY': jcaCover,
  'XDG6G4GyUCM': marketingCover,
  'tJ12yupbfyw': inflowCover,
};

const VIDEO_ITEMS_PER_PAGE = 6;
const TEXT_ITEMS_PER_PAGE = 8;

// Synced with database industries
const INDUSTRY_OPTIONS = [
  { id: "all", label: "All Industries" },
  { id: "manufacturing", label: "Manufacturing" },
  { id: "finance", label: "Finance" },
  { id: "professional services", label: "Professional Services" },
  { id: "real estate", label: "Real Estate" },
  { id: "technology", label: "Technology" },
  { id: "retail", label: "Retail" },
  { id: "insurance", label: "Insurance" },
  { id: "hospitality", label: "Hospitality" },
  { id: "healthcare", label: "Healthcare" },
  { id: "construction", label: "Construction" },
];

const getIndustryIcon = (industry: string): LucideIcon => {
  switch (industry?.toLowerCase()) {
    case 'all': return Filter;
    case 'real estate': 
    case 'property': return Home;
    case 'construction': return HardHat;
    case 'professional services':
    case 'consulting':
    case 'legal': return Users2;
    case 'insurance': return Shield;
    case 'healthcare': return Stethoscope;
    case 'manufacturing': 
    case 'logistics':
    case 'automotive': return Factory;
    case 'finance': 
    case 'accounting': return Briefcase;
    case 'retail': return ShoppingBag;
    case 'technology':
    case 'education': return Cpu;
    case 'hospitality': return Hotel;
    case 'other': return MoreHorizontal;
    default: return Building2;
  }
};

// Helper to extract YouTube video ID
const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

// Helper to get custom cover or YouTube thumbnail
const getVideoThumbnail = (url: string): string | null => {
  const videoId = getYouTubeVideoId(url);
  if (videoId) {
    // Use custom cover if available, otherwise fall back to YouTube
    if (customCovers[videoId]) {
      return customCovers[videoId];
    }
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  return null;
};

// Helper to extract YouTube/Vimeo embed URL
const getEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  
  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1`;
  }
  
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }
  
  return url;
};

// Client avatar with error fallback to initials
const ClientAvatarWithFallback = ({ 
  testimonial, 
  size = 40 
}: { 
  testimonial: PublishedTestimonial; 
  size?: number;
}) => {
  const [imgError, setImgError] = useState(false);
  const avatarSrc = testimonial.client_avatar_url || getUniqueHeadshot(testimonial.id, testimonial.client_name, testimonial.headshot_key);
  const initials = testimonial.client_name.split(' ').map(n => n[0]).join('').slice(0, 2);
  
  if (imgError) {
    return (
      <div 
        className="bg-primary/10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <span className="text-sm font-semibold text-primary">{initials}</span>
      </div>
    );
  }
  
  return (
    <div 
      className="bg-primary/10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <LazyImage 
        src={avatarSrc} 
        alt={formatPrivacyName(testimonial.client_name)} 
        className="w-full h-full object-cover"
        wrapperClassName="w-full h-full"
        width={size}
        height={size}
        placeholderColor="bg-primary/10"
        onError={() => setImgError(true)}
        fallbackContent={<span className="text-sm font-semibold text-primary">{initials}</span>}
      />
    </div>
  );
};

const VideoTestimonialCard = ({ 
  testimonial, 
  index, 
  onPlay 
}: { 
  testimonial: PublishedTestimonial; 
  index: number; 
  onPlay: (testimonial: PublishedTestimonial) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = getIndustryIcon(testimonial.industry || '');
  const thumbnail = getVideoThumbnail(testimonial.video_url || '');
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="bg-card rounded-2xl overflow-hidden border border-border cursor-pointer group hover:shadow-xl hover:border-primary/30 transition-all duration-300"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      onClick={() => onPlay(testimonial)}
      role="button"
      aria-label={`Play video testimonial from ${testimonial.client_name}`}
    >
      {/* Video Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
        {thumbnail && (
          <LazyImage 
            src={thumbnail} 
            alt={`${testimonial.client_name} video testimonial`}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            wrapperClassName="absolute inset-0 w-full h-full"
            placeholderColor="bg-gradient-to-br from-primary/20 to-primary/5"
          />
        )}
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
          <div className="w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:shadow-primary/30 transition-all glow-pulse">
            <Play className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" />
          </div>
        </div>
        
        {/* Featured badge */}
        {testimonial.is_featured && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow-lg">
              <Sparkles className="w-3 h-3" />
              Featured
            </span>
          </div>
        )}
        
        {/* Industry badge */}
        {testimonial.industry && (
          <div className="absolute bottom-3 right-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-white">
              <Icon className="w-3 h-3" />
              {testimonial.industry}
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <ClientAvatarWithFallback testimonial={testimonial} size={40} />
            <div className="min-w-0">
              <h4 className="font-bold text-foreground text-sm truncate">{testimonial.client_name}</h4>
              <p className="text-xs text-muted-foreground truncate">
                {testimonial.client_title}{testimonial.industry && `, ${testimonial.industry}`}
              </p>
            </div>
          </div>

        {/* Star Rating */}
        <div className="flex gap-0.5 mb-2">
          {Array.from({ length: testimonial.rating || 5 }).map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
          ))}
        </div>

        {/* Quote Preview - Expands on hover */}
        <AnimatePresence mode="wait">
          <motion.p 
            key={isExpanded ? 'expanded' : 'collapsed'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`text-sm text-muted-foreground italic ${isExpanded ? '' : 'line-clamp-2'}`}
          >
            "{testimonial.quote}"
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const TextTestimonialCard = ({ 
  testimonial, 
  index 
}: { 
  testimonial: PublishedTestimonial; 
  index: number; 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = getIndustryIcon(testimonial.industry || '');
  const isLongQuote = testimonial.quote.length > 200;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      className="bg-card rounded-xl border border-border p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Featured badge */}
      {testimonial.is_featured && (
        <div className="mb-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
            <Sparkles className="w-3 h-3" />
            Featured
          </span>
        </div>
      )}
      
      <div className="flex items-start gap-4">
        <Quote className="w-8 h-8 text-primary/20 flex-shrink-0 group-hover:text-primary/40 transition-colors" />
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={isExpanded ? 'expanded' : 'collapsed'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`text-foreground mb-4 leading-relaxed ${!isExpanded && isLongQuote ? 'line-clamp-4' : ''}`}
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(`"${testimonial.quote}"`, {
                  ALLOWED_TAGS: ['strong', 'em']
                })
              }}
            />
          </AnimatePresence>
          
            <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <ClientAvatarWithFallback testimonial={testimonial} size={40} />
              <div className="min-w-0">
                <div className="font-medium text-foreground text-sm truncate">{testimonial.client_name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {testimonial.client_title}{testimonial.industry && `, ${testimonial.industry}`}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex gap-0.5">
                {Array.from({ length: testimonial.rating || 5 }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
            </div>
          </div>
          
          {testimonial.industry && (
            <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
              <Icon className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">{testimonial.industry}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const TestimonialsPage = () => {
  const [activeIndustry, setActiveIndustry] = useState<string>("all");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [videoPage, setVideoPage] = useState(1);
  const [textPage, setTextPage] = useState(1);
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<PublishedTestimonial | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const { ref: heroRef, isVisible: heroVisible } = useScrollReveal();

  // Fetch from database
  const { items: dbTestimonials, isLoading } = usePublishedTestimonials();

  // Initialize headshot assignments when testimonials load
  useEffect(() => {
    if (dbTestimonials.length > 0) {
      initializeHeadshotAssignments(
        dbTestimonials.map((t) => ({ id: t.id, clientName: t.client_name }))
      );
    }
  }, [dbTestimonials]);

  const normalizeIndustry = (industry: string | null | undefined) =>
    (industry || "").trim().toLowerCase();

  const formatIndustryLabel = (id: string) =>
    id
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  // Use static industry options synced with backend
  const activeIndustryLabel = useMemo(() => {
    return INDUSTRY_OPTIONS.find((o) => o.id === activeIndustry)?.label || "All Industries";
  }, [activeIndustry]);

  // Filter all testimonials by industry first
  const filteredTestimonials = useMemo(() => {
    let filtered = dbTestimonials;
    
    // Apply featured filter
    if (showFeaturedOnly) {
      filtered = filtered.filter((t) => t.is_featured);
    }
    
    // Apply industry filter
    if (activeIndustry === "all") return filtered;

    return filtered.filter((t) => normalizeIndustry(t.industry) === activeIndustry);
  }, [dbTestimonials, activeIndustry, showFeaturedOnly]);

  // Separate video testimonials (filtered) - sort featured first
  const videoTestimonials = useMemo(() => {
    return filteredTestimonials
      .filter((t) => t.video_url && t.video_url.trim() !== "")
      .sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
  }, [filteredTestimonials]);

  // Text-only testimonials (filtered) - sort featured first
  const textTestimonials = useMemo(() => {
    return filteredTestimonials
      .filter((t) => !t.video_url || t.video_url.trim() === "")
      .sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
  }, [filteredTestimonials]);

  // Paginated video testimonials
  const paginatedVideoTestimonials = useMemo(() => {
    const start = (videoPage - 1) * VIDEO_ITEMS_PER_PAGE;
    return videoTestimonials.slice(start, start + VIDEO_ITEMS_PER_PAGE);
  }, [videoTestimonials, videoPage]);

  const totalVideoPages = Math.ceil(videoTestimonials.length / VIDEO_ITEMS_PER_PAGE);

  // Paginated text testimonials
  const paginatedTextTestimonials = useMemo(() => {
    const start = (textPage - 1) * TEXT_ITEMS_PER_PAGE;
    return textTestimonials.slice(start, start + TEXT_ITEMS_PER_PAGE);
  }, [textTestimonials, textPage]);

  const totalTextPages = Math.ceil(textTestimonials.length / TEXT_ITEMS_PER_PAGE);

  // Stats (unfiltered totals for display)
  const allVideoTestimonials = useMemo(() => {
    return dbTestimonials.filter((t) => t.video_url && t.video_url.trim() !== "");
  }, [dbTestimonials]);

  const allTextTestimonials = useMemo(() => {
    return dbTestimonials.filter((t) => !t.video_url || t.video_url.trim() === "");
  }, [dbTestimonials]);

  const featuredCount = useMemo(() => {
    return dbTestimonials.filter((t) => t.is_featured).length;
  }, [dbTestimonials]);

  const stats = useMemo(
    () => ({
      total: dbTestimonials.length,
      videos: allVideoTestimonials.length,
      textOnly: allTextTestimonials.length,
      industries: INDUSTRY_OPTIONS.length - 1, // exclude "All"
      avgRating:
        dbTestimonials.length > 0
          ? (
              dbTestimonials.reduce((sum, t) => sum + (t.rating || 5), 0) /
              dbTestimonials.length
            ).toFixed(1)
          : "5.0",
      featured: featuredCount,
    }),
    [dbTestimonials, allVideoTestimonials, allTextTestimonials, featuredCount]
  );

  const handlePlayVideo = (testimonial: PublishedTestimonial) => {
    setSelectedVideo(testimonial);
    setIsVideoModalOpen(true);
  };

  // Reset pagination when filters change
  const handleIndustryChange = (industry: string) => {
    setActiveIndustry(industry);
    setVideoPage(1);
    setTextPage(1);
  };

  const handleFeaturedToggle = (checked: boolean) => {
    setShowFeaturedOnly(checked);
    setVideoPage(1);
    setTextPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Customer Testimonials" 
        description="Hear from real customers about their experience with alfred ai. Watch video testimonials and read success stories from organisations across industries."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Impact Studies", url: "/impact-studies" },
          { name: "Testimonials", url: "/impact/testimonials" }
        ]}
      />
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
                to="/impact-studies"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Impact Studies
              </Link>
            </motion.div>
            
            <motion.div
              ref={heroRef}
              initial={{ opacity: 0, y: 30 }}
              animate={heroVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="max-w-3xl"
            >
              <motion.div 
                className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <Quote className="w-7 h-7 text-primary" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-semibold text-foreground mb-4 leading-tight">
                Customer Testimonials
              </h1>
              <p className="text-xl text-muted-foreground">
                Hear directly from decision-makers who transformed their operations with alfred ai.
              </p>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-6 mt-8">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MessageSquareQuote className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total Reviews</p>
                  </div>
                </div>
                {stats.videos > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                      <Video className="w-5 h-5 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stats.videos}</p>
                      <p className="text-sm text-muted-foreground">Video Stories</p>
                    </div>
                  </div>
                )}
                {stats.textOnly > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <MessageSquareQuote className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stats.textOnly}</p>
                      <p className="text-sm text-muted-foreground">Written Reviews</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Star className="w-5 h-5 text-emerald-500 fill-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.avgRating}</p>
                    <p className="text-sm text-muted-foreground">Avg Rating</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.industries}</p>
                    <p className="text-sm text-muted-foreground">Industries</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Admin Quick Edit Banner */}
        <AdminQuickEditBanner adminPath="/admin/testimonials" label="Manage Testimonials" />

        {/* Loading State with Skeleton */}
        {isLoading && (
          <section className="py-12 bg-background">
            <div className="container-wide space-y-12">
              {/* Video testimonials skeleton */}
              <div>
                <div className="flex gap-2 mb-6">
                  <div className="h-6 w-32 bg-muted rounded-full animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
                      <div className="aspect-video bg-muted animate-pulse relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 bg-muted-foreground/20 rounded-full animate-pulse" />
                        </div>
                      </div>
                      <div className="p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                          <div className="space-y-1.5 flex-1">
                            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                            <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <div key={s} className="h-4 w-4 bg-muted rounded animate-pulse" />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Text testimonials skeleton */}
              <div>
                <div className="flex gap-2 mb-6">
                  <div className="h-6 w-40 bg-muted rounded-full animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-card rounded-xl border border-border p-6">
                      <div className="flex gap-1 mb-4">
                        {[1, 2, 3, 4, 5].map(s => (
                          <div key={s} className="h-4 w-4 bg-muted rounded animate-pulse" />
                        ))}
                      </div>
                      <div className="space-y-2 mb-6">
                        <div className="h-5 w-full bg-muted rounded animate-pulse" />
                        <div className="h-5 w-full bg-muted rounded animate-pulse" />
                        <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
                      </div>
                      <div className="flex items-center gap-3 pt-4 border-t border-border">
                        <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
                        <div className="space-y-1">
                          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                          <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Industry Filter - applies to both video and text testimonials */}
        {!isLoading && dbTestimonials.length > 0 && (
          <section className="py-4 bg-background border-b border-border sticky top-[72px] z-40">
            <div className="container-wide">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  {/* Industry Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        {(() => {
                          const Icon = getIndustryIcon(activeIndustry);
                          return <Icon className="w-4 h-4" />;
                        })()}
                        {activeIndustryLabel}
                        <ChevronDown className="w-4 h-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {INDUSTRY_OPTIONS.map((option) => {
                        const Icon = getIndustryIcon(option.id);
                        return (
                          <DropdownMenuItem
                            key={option.id}
                            onClick={() => handleIndustryChange(option.id)}
                            className={activeIndustry === option.id ? "bg-primary/10" : ""}
                          >
                            <Icon className="w-4 h-4 mr-2" />
                            {option.label}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {activeIndustry !== "all" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleIndustryChange("all")}
                      className="gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                      Clear
                    </Button>
                  )}
                </div>
                
                {/* Featured Toggle */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Switch
                    id="featured-toggle"
                    checked={showFeaturedOnly}
                    onCheckedChange={handleFeaturedToggle}
                  />
                  <Label htmlFor="featured-toggle" className="text-sm cursor-pointer flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Featured Only ({stats.featured})
                  </Label>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Video Testimonials Section */}
        {!isLoading && videoTestimonials.length > 0 && (
          <section className="py-16 bg-gradient-to-b from-primary/5 to-background relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            
            <div className="container-wide relative">
              <div className="flex items-center justify-between gap-3 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                    <Play className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">
                      {showFeaturedOnly ? "Featured Video Stories" : activeIndustry === "all" ? "Watch Their Stories" : `${activeIndustryLabel} Video Stories`}
                    </h2>
                    <p className="text-muted-foreground">{videoTestimonials.length} video testimonial{videoTestimonials.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {totalVideoPages > 1 && (
                  <p className="text-sm text-muted-foreground">
                    Page {videoPage} of {totalVideoPages}
                  </p>
                )}
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div 
                  key={`video-page-${videoPage}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {paginatedVideoTestimonials.map((testimonial, index) => (
                    <VideoTestimonialCard
                      key={testimonial.id}
                      testimonial={testimonial}
                      index={index}
                      onPlay={handlePlayVideo}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>

              {/* Video Pagination */}
              {totalVideoPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setVideoPage(p => Math.max(1, p - 1))}
                          className={videoPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalVideoPages }, (_, i) => i + 1).map(page => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setVideoPage(page)}
                            isActive={videoPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setVideoPage(p => Math.min(totalVideoPages, p + 1))}
                          className={videoPage === totalVideoPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          </section>
        )}

        {/* All Text Testimonials */}
        {!isLoading && (
          <section className="py-16 bg-background">
            <div className="container-wide">
              <div className="flex items-center justify-between gap-3 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MessageSquareQuote className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">
                      {showFeaturedOnly ? "Featured Written Reviews" : activeIndustry === "all" ? "Written Reviews" : `${activeIndustryLabel} Written Reviews`}
                    </h2>
                    <p className="text-muted-foreground">{textTestimonials.length} testimonial{textTestimonials.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {totalTextPages > 1 && (
                  <p className="text-sm text-muted-foreground">
                    Page {textPage} of {totalTextPages}
                  </p>
                )}
              </div>
              
              {textTestimonials.length === 0 && videoTestimonials.length === 0 ? (
                <div className="text-center py-12">
                  <Quote className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No testimonials found for this filter.</p>
                </div>
              ) : textTestimonials.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquareQuote className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No written reviews for this filter yet.</p>
                </div>
              ) : (
                <>
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={`text-page-${textPage}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="grid md:grid-cols-2 gap-6"
                    >
                      {paginatedTextTestimonials.map((testimonial, index) => (
                        <TextTestimonialCard
                          key={testimonial.id}
                          testimonial={testimonial}
                          index={index}
                        />
                      ))}
                    </motion.div>
                  </AnimatePresence>

                  {/* Text Pagination */}
                  {totalTextPages > 1 && (
                    <div className="mt-8 flex justify-center">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setTextPage(p => Math.max(1, p - 1))}
                              className={textPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          {Array.from({ length: totalTextPages }, (_, i) => i + 1).map(page => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setTextPage(page)}
                                isActive={textPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setTextPage(p => Math.min(totalTextPages, p + 1))}
                              className={textPage === totalTextPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        )}

        {/* CTA */}
        <PremiumCTASection
          title="Ready to share your success story?"
          description="Join hundreds of organisations that have transformed their operations with alfred ai."
          buttonText="Book an Impact Conversation"
          onButtonClick={() => setIsCalendlyOpen(true)}
          variant="light"
        />
      </main>

      <Footer />
      <BookingChatModal isOpen={isCalendlyOpen} onClose={() => setIsCalendlyOpen(false)} />
      
      {/* Video Player Modal */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none backdrop-blur-xl">
          <DialogClose className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <X className="w-5 h-5 text-white" />
          </DialogClose>
          
          {selectedVideo && (
            <div className="w-full">
              <div className="aspect-video bg-black">
                {getEmbedUrl(selectedVideo.video_url || '') ? (
                  <iframe
                    src={getEmbedUrl(selectedVideo.video_url || '') || ''}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white">
                    <p>Video unavailable</p>
                  </div>
                )}
              </div>
              
              <div className="p-6 bg-card">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center overflow-hidden">
                    {selectedVideo.client_avatar_url ? (
                      <img src={selectedVideo.client_avatar_url} alt={selectedVideo.client_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-semibold text-primary">
                        {selectedVideo.client_name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-foreground">{selectedVideo.client_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedVideo.client_title}, {selectedVideo.client_company}
                    </p>
                  </div>
                  {selectedVideo.industry && (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {selectedVideo.industry}
                    </span>
                  )}
                </div>
                <p className="mt-4 text-muted-foreground italic">
                  "{selectedVideo.quote}"
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestimonialsPage;