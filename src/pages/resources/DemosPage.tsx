import { useState, useEffect, Suspense, useMemo, useCallback, useRef, memo } from "react";
import { useImagePreload } from "@/hooks/useImagePreload";
import { useDemoViews } from "@/hooks/useDemoViews";
import { motion } from "framer-motion";
import { SafeAnimatePresence } from "@/components/ui/safe-animate-presence";
import { Link, useSearchParams, useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Play, Filter, Grid, List, 
  X, ChevronRight, LayoutGrid, Search, ChevronDown, Info, Share2, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { getShareableUrl } from "@/lib/siteConfig";
import { createDemoShareLink } from "@/lib/demoShareLinks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import SwipeableDemoCards from "@/components/mobile/SwipeableDemoCards";
import { DemoSkeleton } from "@/components/demos/DemoSkeleton";
import { DemoFooter } from "@/components/demos/DemoFooter";
import { DemosDashboard } from "@/components/demos/DemosDashboard";
import { DemoLeadCaptureModal } from "@/components/demos/DemoLeadCaptureModal";
import { shouldBypassLeadCapture, logSilentDemoAccess } from "@/components/demos/demoLeadAccess";
import BookingChatModal from "@/components/BookingChatModal";
import { DemoSpeedProvider } from "@/contexts/DemoSpeedProvider";
import { DemoSpeedControl } from "@/components/demos/shared/DemoSpeedControl";

// Import data and components from extracted module
import {
  demos,
  demoCategories,
  demoComponents,
  businessCategories,
  topicVariants,
  getTopicsForBusinessFunction,
  ITEMS_PER_PAGE,
  BusinessMatchMakerDemo,
} from "./demosData";

// Helper to check if demo is new (added in last 14 days)
const isNewDemo = (dateAdded: string) => {
  const addedDate = new Date(dateAdded);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - addedDate.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 14;
};

// Memoized Demo Card for List View
const DemoListCard = memo(({ 
  demo, 
  index, 
  onOpen, 
  onShare 
}: { 
  demo: typeof demos[0]; 
  index: number; 
  onOpen: (id: string) => void;
  onShare: (e: React.MouseEvent, id: string) => void;
}) => {
  const Icon = demo.icon;
  const isNew = isNewDemo(demo.dateAdded);
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => onOpen(demo.id)}
      className="group flex flex-col md:flex-row gap-3 md:gap-5 p-3 md:p-4 rounded-xl cursor-pointer bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all"
    >
      {/* Thumbnail */}
      <div className="w-full md:w-44 aspect-video md:aspect-[4/3] rounded-lg overflow-hidden flex-shrink-0 relative">
        <img 
          src={demo.thumbnail} 
          alt={demo.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
            <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
          </div>
        </div>
        {isNew && (
          <Badge className="absolute top-2 right-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[9px] px-1.5 py-0.5 font-semibold">New</Badge>
        )}
        {demo.isInteractive && (
          <Badge className="absolute top-2 left-2 bg-primary/90 text-[9px] px-1.5 py-0.5">Interactive</Badge>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1.5 md:mb-2">
          <Icon className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-xs text-muted-foreground">{demo.duration}</span>
          {/* Mobile Share Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-7 w-7 text-pink-500 hover:text-pink-500 hover:bg-pink-500/10 ml-auto"
            onClick={(e) => onShare(e, demo.id)}
            title="Copy link"
          >
            <Share2 className="w-3.5 h-3.5" />
          </Button>
        </div>
        <h3 className="font-semibold text-sm md:text-base text-foreground mb-1 md:mb-2 group-hover:text-primary transition-colors line-clamp-1">
          {demo.title}
        </h3>
        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mb-2 md:mb-3">{demo.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {demo.topics.slice(0, 3).map(topic => (
            <Badge key={topic} variant={topicVariants[topic] || "secondary"} className="text-[9px] md:text-xs px-1.5 md:px-2 py-0 h-5 md:h-auto">{topic}</Badge>
          ))}
        </div>
      </div>
      
      {/* Share & Arrow */}
      <div className="hidden md:flex items-center gap-2 self-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-pink-500 hover:text-pink-500 hover:bg-pink-500/10"
          onClick={(e) => onShare(e, demo.id)}
          title="Copy link"
        >
          <Share2 className="w-4 h-4" />
        </Button>
        <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </motion.div>
  );
});

DemoListCard.displayName = "DemoListCard";

// Memoized Demo Card for Grid View
const DemoGridCard = memo(({ 
  demo, 
  index, 
  onOpen, 
  onShare 
}: { 
  demo: typeof demos[0]; 
  index: number; 
  onOpen: (id: string) => void;
  onShare: (e: React.MouseEvent, id: string) => void;
}) => {
  const Icon = demo.icon;
  const isNew = isNewDemo(demo.dateAdded);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => onOpen(demo.id)}
      className="group rounded-xl overflow-hidden cursor-pointer bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all"
    >
      <div className="aspect-video relative overflow-hidden">
        <img 
          src={demo.thumbnail} 
          alt={demo.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
            <Play className="w-6 h-6 text-primary-foreground ml-1" />
          </div>
        </div>
        <span className="absolute bottom-3 right-3 text-xs bg-background/80 px-2 py-1 rounded text-foreground">
          {demo.duration}
        </span>
        {isNew && (
          <Badge className="absolute top-3 right-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-semibold">New</Badge>
        )}
        {demo.isInteractive && (
          <Badge className="absolute top-3 left-3 bg-primary/90 text-[10px]">Interactive</Badge>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-pink-500 hover:text-pink-500 hover:bg-pink-500/10"
            onClick={(e) => onShare(e, demo.id)}
            title="Copy link"
          >
            <Share2 className="w-3.5 h-3.5" />
          </Button>
        </div>
        <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
          {demo.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{demo.description}</p>
      </div>
    </motion.div>
  );
});

DemoGridCard.displayName = "DemoGridCard";

// Featured Demo Slide Component
const FeaturedDemoSlide = memo(({ 
  demo, 
  onOpen 
}: { 
  demo: typeof demos[0]; 
  onOpen: (id: string) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -50 }}
    transition={{ duration: 0.3 }}
    onClick={() => onOpen(demo.id)}
    className="group cursor-pointer"
  >
    <div className="flex flex-col lg:flex-row bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/30 transition-all min-h-[400px]">
      <div className="lg:w-1/2 aspect-video lg:aspect-auto relative overflow-hidden">
        <img 
          src={demo.thumbnail} 
          alt={demo.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            className="w-24 h-24 rounded-full bg-primary/90 flex items-center justify-center shadow-2xl opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"
            whileHover={{ scale: 1.1 }}
          >
            <Play className="w-12 h-12 text-primary-foreground ml-1" />
          </motion.div>
        </div>
      </div>
      <div className="lg:w-1/2 p-8 lg:p-10 flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-5">
          <Badge className="bg-primary text-primary-foreground text-sm px-3 py-1">★ Featured</Badge>
          <Badge variant="secondary" className="text-sm px-3 py-1">{demo.duration}</Badge>
        </div>
        <h3 className="text-3xl font-semibold text-foreground mb-4 group-hover:text-primary transition-colors line-clamp-2">
          {demo.title}
        </h3>
        <p className="text-muted-foreground text-lg mb-5 line-clamp-3">{demo.description}</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {demo.topics.map(topic => (
            <Badge key={topic} variant={topicVariants[topic] || "secondary"} className="text-sm">{topic}</Badge>
          ))}
        </div>
        <Button size="lg" className="w-fit bg-primary hover:bg-primary/90 text-primary-foreground">
          <Play className="w-5 h-5 mr-2" />
          Launch Demo
        </Button>
      </div>
    </div>
  </motion.div>
));

FeaturedDemoSlide.displayName = "FeaturedDemoSlide";

const DemosPageContent = () => {
  const { demoId } = useParams<{ demoId?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [demoCompleted, setDemoCompleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [activeBusinessFunctions, setActiveBusinessFunctions] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Demo view tracking hook
  const { viewCounts, trackView, isLoading: viewsLoading } = useDemoViews();

  // Check if this is a direct link access (via URL path)
  const isDirectLinkAccess = useRef(!!demoId);

  // Debounce search for performance
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle URL-based demo selection - no lead capture on quick view
  useEffect(() => {
    if (demoId) {
      if (demos.some(d => d.id === demoId)) {
        setActiveDemo(demoId);
        isDirectLinkAccess.current = false;
        return;
      }
    }
    const demoParam = searchParams.get("demo");
    if (demoParam && demos.some(d => d.id === demoParam)) {
      navigate(`/resources/demos/${demoParam}`, { replace: true });
    }
  }, [demoId, searchParams, navigate]);

  // Lock body scroll when demo is active (prevents scroll bleed-through on mobile)
  useEffect(() => {
    if (activeDemo) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [activeDemo]);

  const handleDemoOpen = useCallback((demoIdToOpen: string) => {
    // Track the view
    trackView(demoIdToOpen);
    
    setActiveDemo(demoIdToOpen);
    setDemoCompleted(false);
    navigate(`/resources/demos/${demoIdToOpen}`, { replace: false });
  }, [navigate, trackView]);

  // Log silent demo access for returning visitors
  useEffect(() => {
    if (activeDemo && shouldBypassLeadCapture()) {
      const demo = demos.find(d => d.id === activeDemo);
      if (demo) {
        logSilentDemoAccess(activeDemo, demo.title);
      }
    }
  }, [activeDemo]);

  const handleDemoClose = useCallback(() => {
    setActiveDemo(null);
    setDemoCompleted(false);
    navigate('/resources/demos', { replace: false });
  }, [navigate]);

  // Memoized filtered demos
  const filteredDemos = useMemo(() => {
    const searchLower = debouncedSearch.toLowerCase();
    return demos.filter(d => {
      if (activeCategory !== "all" && d.category !== activeCategory) return false;
      if (activeBusinessFunctions.length > 0) {
        const allRelevantTopics = activeBusinessFunctions.flatMap(bf => getTopicsForBusinessFunction(bf));
        if (!d.topics.some(topic => allRelevantTopics.includes(topic))) return false;
      }
      if (searchLower === "") return true;
      return d.title.toLowerCase().includes(searchLower) ||
        d.description.toLowerCase().includes(searchLower) ||
        d.topics.some(t => t.toLowerCase().includes(searchLower));
    });
  }, [activeCategory, debouncedSearch, activeBusinessFunctions]);

  // Preload all demo thumbnails in the background for faster modal opening
  const allThumbnailUrls = useMemo(() => demos.map(d => d.thumbnail), []);
  useImagePreload(allThumbnailUrls);

  // Pagination
  const totalPages = Math.ceil(filteredDemos.length / ITEMS_PER_PAGE);
  const paginatedDemos = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDemos.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredDemos, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, debouncedSearch, activeBusinessFunctions]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  }, []);

  const handleShareDemo = useCallback(async (e: React.MouseEvent, demoIdToShare: string) => {
    e.stopPropagation();
    try {
      const url = await createDemoShareLink(demoIdToShare);
      await navigator.clipboard.writeText(url);
      toast.success("Unique share link copied to clipboard!");
    } catch {
      // Fallback to static URL
      const fallbackUrl = getShareableUrl(`/resources/demos/${demoIdToShare}`);
      navigator.clipboard.writeText(fallbackUrl).then(() => {
        toast.success("Link copied to clipboard!");
      }).catch(() => {
        toast.error("Failed to copy link");
      });
    }
  }, []);

  // Featured demos sorted by view count (most viewed first)
  const featuredDemos = useMemo(() => {
    const allFeatured = demos.filter(d => d.featured);
    
    // Sort by view count (descending), maintaining original order for demos with equal views
    return allFeatured
      .map((demo, originalIndex) => ({
        ...demo,
        viewCount: viewCounts[demo.id]?.total_views || 0,
        originalIndex, // For stable sort when view counts are equal
      }))
      .sort((a, b) => {
        // Primary sort: by view count (descending)
        if (b.viewCount !== a.viewCount) {
          return b.viewCount - a.viewCount;
        }
        // Secondary sort: maintain original order (by dateAdded since demos are pre-sorted)
        return a.originalIndex - b.originalIndex;
      })
      .slice(0, 3);
  }, [viewCounts]);

  // Auto-cycle featured demos
  useEffect(() => {
    if (featuredDemos.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setFeaturedIndex(prev => (prev + 1) % featuredDemos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredDemos.length, isPaused]);

  const goToPrevFeatured = useCallback(() => {
    setFeaturedIndex(prev => (prev - 1 + featuredDemos.length) % featuredDemos.length);
  }, [featuredDemos.length]);

  const goToNextFeatured = useCallback(() => {
    setFeaturedIndex(prev => (prev + 1) % featuredDemos.length);
  }, [featuredDemos.length]);

  const selectedDemo = demos.find(d => d.id === activeDemo);
  const DemoComponent = activeDemo ? demoComponents[activeDemo] : null;

  // Generate meta tags for sharing - uses demo-specific info when a demo is selected
  const pageTitle = selectedDemo 
    ? `${selectedDemo.title} | alfred ai Demo`
    : "Interactive Demos | alfred ai";
  const pageDescription = selectedDemo
    ? selectedDemo.description
    : "Explore alfred ai's capabilities through hands-on demonstrations. See AI-powered automation, voice agents, document processing, and more in action.";
  const pageImage = selectedDemo?.thumbnail || "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=630&fit=crop";
  const pageUrl = selectedDemo 
    ? getShareableUrl(`/resources/demos/${selectedDemo.id}`)
    : getShareableUrl("/resources/demos");

  return (
    <><DemoSpeedControl /><div className="min-h-screen bg-background overflow-x-hidden">
      <SEO 
        fullTitle={pageTitle}
        description={pageDescription}
        image={pageImage}
        path={selectedDemo ? `/resources/demos/${selectedDemo.id}` : "/resources/demos"}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Resources", url: "/resources" },
          { name: "Demos", url: "/resources/demos" },
          ...(selectedDemo ? [{ name: selectedDemo.title, url: `/resources/demos/${selectedDemo.id}` }] : [])
        ]}
      />
      
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-12 md:pt-40 md:pb-16 bg-background relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent pointer-events-none" />
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
                className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Play className="w-7 h-7 text-primary" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-semibold text-foreground mb-4 leading-tight">
                Interactive Demos
              </h1>
              <p className="text-xl text-muted-foreground">
                Explore alfred ai's capabilities through hands-on demonstrations.
              </p>
              
              <div className="flex flex-wrap gap-6 mt-8">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Play className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{demos.length}</p>
                    <p className="text-sm text-muted-foreground">Interactive Demos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <LayoutGrid className="w-5 h-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{businessCategories.length}</p>
                    <p className="text-sm text-muted-foreground">Categories</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Demo Cockpit — dashboard overview built on the UX foundation primitives */}
        <DemosDashboard
          demos={demos}
          categories={demoCategories}
          viewCounts={viewCounts}
          isLoading={viewsLoading}
          activeCategory={activeCategory}
          onSelectCategory={(catId) => {
            setActiveCategory(catId);
            document.getElementById("all-demos")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          onOpenDemo={handleDemoOpen}
        />

        {/* Featured Demos */}

        <section className="py-16 bg-gradient-to-b from-primary/5 to-background relative overflow-hidden">
          <div className="container-wide relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">Featured</Badge>
                <h2 className="text-3xl font-semibold text-foreground mb-2">Featured Demos</h2>
                <p className="text-muted-foreground max-w-xl">Our most popular demonstrations.</p>
              </div>
            </div>
            
            <SwipeableDemoCards demos={featuredDemos} onSelectDemo={handleDemoOpen} />
            
            <div className="hidden md:block relative overflow-hidden rounded-2xl">
              <SafeAnimatePresence mode="wait">
                {featuredDemos.map((demo, index) => 
                  index === featuredIndex && (
                    <FeaturedDemoSlide 
                      key={demo.id} 
                      demo={demo} 
                      onOpen={handleDemoOpen}
                    />
                  )
                )}
              </SafeAnimatePresence>
            </div>

            {featuredDemos.length > 1 && (
              <div className="hidden md:flex justify-center items-center gap-4 mt-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrevFeatured}
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                  className="rounded-full hover:bg-primary/10"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex gap-2">
                  {featuredDemos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setFeaturedIndex(index)}
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        index === featuredIndex ? 'bg-primary w-8' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2.5'
                      }`}
                    />
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNextFeatured}
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                  className="rounded-full hover:bg-primary/10"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* All Demos */}
        <section id="all-demos" className="py-12 bg-background scroll-mt-24">
          <div className="container-wide">
            {/* Search and Filters */}
            <div className="flex flex-col gap-4 mb-8">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search demos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl"
                />
                {searchQuery && (
                  <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2 bg-background">
                        <Filter className="w-4 h-4" />
                        {demoCategories.find(c => c.id === activeCategory)?.label || 'All Demos'}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-52 bg-background border border-border z-50 max-h-80 overflow-y-auto">
                      {demoCategories.map((cat) => (
                        <DropdownMenuItem
                          key={cat.id}
                          onClick={() => setActiveCategory(cat.id)}
                          className={`cursor-pointer ${activeCategory === cat.id ? 'bg-primary/10 text-primary' : ''}`}
                        >
                          {cat.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {(activeCategory !== "all" || searchQuery || activeBusinessFunctions.length > 0) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setActiveCategory("all");
                        setSearchQuery("");
                        setActiveBusinessFunctions([]);
                      }}
                      className="gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                      Clear filters
                    </Button>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/80 px-4 py-2 rounded-full border border-border">
                    <Play className="w-4 h-4 text-primary" />
                    <span className="font-medium">{filteredDemos.length} demos</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant={viewMode === "grid" ? "default" : "ghost"} size="icon" onClick={() => setViewMode("grid")}>
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button variant={viewMode === "list" ? "default" : "ghost"} size="icon" onClick={() => setViewMode("list")}>
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Category Legend */}
            <div className="mb-8 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm rounded-xl border border-border/60 overflow-hidden shadow-sm">
              <button
                onClick={() => setIsLegendOpen(!isLegendOpen)}
                className="w-full flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
                    <Info className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Filter by Business Function</span>
                  {activeBusinessFunctions.length > 0 && (
                    <div className="flex items-center gap-1 ml-1">
                      {activeBusinessFunctions.map(bf => (
                        <Badge key={bf} variant={businessCategories.find(c => c.name === bf)?.color || "secondary"} className="text-xs">
                          {bf}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isLegendOpen ? 'rotate-180' : ''}`} />
              </button>
              <SafeAnimatePresence>
                {isLegendOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 pt-1 border-t border-border/40">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {businessCategories.map((cat) => {
                          const Icon = cat.icon;
                          const isActive = activeBusinessFunctions.includes(cat.name);
                          return (
                            <button
                              key={cat.name}
                              onClick={() => {
                                setActiveBusinessFunctions(prev => 
                                  isActive ? prev.filter(bf => bf !== cat.name) : [...prev, cat.name]
                                );
                              }}
                              className={`group flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
                                isActive ? 'border-primary bg-primary/10 shadow-sm' : 'border-transparent hover:border-border hover:bg-muted/30'
                              }`}
                            >
                              <Badge variant={cat.color} className="gap-1.5 py-1 px-2">
                                <Icon className="w-3.5 h-3.5" />
                              </Badge>
                              <span className={`text-xs font-medium truncate ${isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                {cat.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      {activeBusinessFunctions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/40 flex justify-end">
                          <button
                            onClick={() => setActiveBusinessFunctions([])}
                            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-muted/30 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            Clear all ({activeBusinessFunctions.length})
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </SafeAnimatePresence>
            </div>

            {/* Demo Grid/List */}
            <SafeAnimatePresence mode="wait">
              <motion.div
                key={activeCategory + viewMode + currentPage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}
              >
                {paginatedDemos.map((demo, index) => 
                  viewMode === "list" ? (
                    <DemoListCard key={demo.id} demo={demo} index={index} onOpen={handleDemoOpen} onShare={handleShareDemo} />
                  ) : (
                    <DemoGridCard key={demo.id} demo={demo} index={index} onOpen={handleDemoOpen} onShare={handleShareDemo} />
                  )
                )}
              </motion.div>
            </SafeAnimatePresence>

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
                      if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return <PaginationItem key={page}><PaginationEllipsis /></PaginationItem>;
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

            {/* Empty State */}
            {filteredDemos.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No demos found</h3>
                <p className="text-muted-foreground mb-4">Try adjusting your search or filters.</p>
                <Button variant="outline" onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}>
                  Clear all filters
                </Button>
              </motion.div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/10 to-secondary/15 pointer-events-none" />
          <div className="container-wide relative text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">Want a personalised demo?</h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Book a conversation with our team to see alfred ai configured for your specific use cases.
              </p>
              <Button size="lg" className="bg-primary hover:bg-primary-hover text-primary-foreground" onClick={() => setIsBookingOpen(true)}>
                Book an Impact Conversation
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Demo Modal */}
      <SafeAnimatePresence>
        {activeDemo && selectedDemo && DemoComponent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          >
            <div className="absolute inset-0" onClick={handleDemoClose} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-[61] bg-card rounded-2xl border border-border shadow-2xl max-w-5xl w-full overflow-hidden max-h-[90vh] overflow-y-auto isolate"
            >
              <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = selectedDemo.icon;
                    return <Icon className="w-5 h-5 text-primary" />;
                  })()}
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{selectedDemo.title}</h2>
                    <p className="text-xs text-muted-foreground line-clamp-1">{selectedDemo.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden sm:inline-flex gap-1.5 text-xs"
                    onClick={() => {
                      window.open(`/demos/${activeDemo}?ref=internal`, '_blank');
                    }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Full Screen
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="sm:hidden h-8 w-8"
                    onClick={() => {
                      window.open(`/demos/${activeDemo}?ref=internal`, '_blank');
                    }}
                    title="Open full screen in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleDemoClose}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <div className="p-4 md:p-5">
                <Suspense fallback={<DemoSkeleton variant="compact" />}>
                  {activeDemo === 'matchmaker' ? (
                    <BusinessMatchMakerDemo onDemoComplete={() => setDemoCompleted(true)} />
                  ) : (
                    <DemoComponent />
                  )}
                </Suspense>
                <DemoFooter
                  currentDemoId={activeDemo}
                  demos={demos}
                  demoCompleted={demoCompleted}
                  onBookDemo={() => { handleDemoClose(); setIsBookingOpen(true); }}
                  onSelectDemo={handleDemoOpen}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </SafeAnimatePresence>

      <BookingChatModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />

      {/* Lead capture removed from quick view - only on standalone pages */}
      </div>
    </>
  );
};

const DemosPage = () => (
  <DemoSpeedProvider>
    <DemosPageContent />
  </DemoSpeedProvider>
);

export default DemosPage;
