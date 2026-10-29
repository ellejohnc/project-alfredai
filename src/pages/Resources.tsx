import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import { Video, BookOpen, FileText, Newspaper, ArrowRight, Play, Calendar, Download, Sparkles, Loader2, Search, X, RefreshCw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SEO from "@/components/SEO";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";

interface ResourceCounts {
  demos: number;
  webinars: number;
  guides: number;
  blogs: number;
}

interface FeaturedResource {
  type: 'Guide' | 'Webinar' | 'Blog' | 'Demo';
  title: string;
  description: string;
  icon: typeof Download | typeof Play | typeof Video | typeof Newspaper;
  href: string;
  id?: string;
  imageUrl?: string;
}

// Demo data with thumbnails
const DEMO_ITEMS = [
  { id: 'knowledge-intelligence', title: 'Knowledge Intelligence', description: 'AI-powered document management', thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=340&fit=crop' },
  { id: 'workflow-builder', title: 'No-Code Workflow Builder', description: 'Build automations without coding', thumbnail: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=340&fit=crop' },
  { id: 'voice-agent', title: 'Voice Agent', description: 'Natural language AI conversations', thumbnail: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&h=340&fit=crop' },
  { id: 'business-operations', title: 'Business Operations', description: 'Streamline complex workflows', thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=340&fit=crop' },
  { id: 'marketplace', title: 'Integration Marketplace', description: 'Connect 5,000+ tools', thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=340&fit=crop' },
];

// Fallback images by resource type
const FALLBACK_IMAGES = {
  Guide: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=600&h=340&fit=crop',
  Webinar: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=340&fit=crop',
  Blog: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&h=340&fit=crop',
  Demo: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=340&fit=crop',
};

// Animation variants for staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  },
};

// Every published event on this site is in the past — 21 of 21, latest 10 Apr.
// This hub fetched them without event_date at all and described each one as an
// "Expert-led session", so a recording from last year read as something you
// could still attend. The dedicated /resources/webinars page has always split
// upcoming from past correctly; only this page did not know the difference.
//
// Nothing is hidden or archived here: a past webinar is still a resource. It is
// labelled as the recording it is.
function describeWebinar(webinar: { description?: string | null; event_date?: string | null }): string {
  if (webinar.description) return webinar.description;
  if (!webinar.event_date) return 'Recorded session';
  const date = new Date(webinar.event_date);
  if (Number.isNaN(date.getTime())) return 'Recorded session';
  const when = date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  return date >= new Date() ? `Live session · ${when}` : `Recorded session · ${when}`;
}

// Prefer an upcoming event for the one featured slot, and only fall back to the
// most recent recording when there is nothing to attend.
function pickFeaturedWebinar<T extends { event_date?: string | null }>(webinars: T[], seeded: T | undefined): T | undefined {
  const now = new Date();
  const upcoming = webinars
    .filter((w) => w.event_date && new Date(w.event_date) >= now)
    .sort((a, b) => new Date(a.event_date!).getTime() - new Date(b.event_date!).getTime());
  return upcoming[0] ?? seeded;
}

const Resources = () => {
  const heroRef = useRef(null);
  const categoriesRef = useRef(null);
  const featuredRef = useRef(null);
  const navigate = useNavigate();
  
  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });
  const categoriesInView = useInView(categoriesRef, { once: true, margin: "-100px" });
  const featuredInView = useInView(featuredRef, { once: true, margin: "-100px" });

  const [counts, setCounts] = useState<ResourceCounts>({ demos: DEMO_ITEMS.length, webinars: 0, guides: 0, blogs: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [allResources, setAllResources] = useState<{
    guides: any[];
    webinars: any[];
    blogs: any[];
  }>({ guides: [], webinars: [], blogs: [] });
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FeaturedResource[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Random seed for featured resources - changes on each refresh
  const [randomSeed, setRandomSeed] = useState(() => Math.random());

  // Fetch counts and resources
  useEffect(() => {
    const fetchData = async () => {
      const [guidesRes, webinarsRes, blogsRes] = await Promise.all([
        supabase.from('guides_playbooks').select('id, title, description, featured_image_url').eq('status', 'published'),
        supabase.from('webinars_events').select('id, title, description, featured_image_url, event_date').eq('status', 'published'),
        supabase.from('blog_posts').select('id, title, excerpt, featured_image_url').eq('status', 'published'),
      ]);

      const guides = guidesRes.data || [];
      const webinars = webinarsRes.data || [];
      const blogs = blogsRes.data || [];

      setCounts({
        demos: DEMO_ITEMS.length,
        webinars: webinars.length,
        guides: guides.length,
        blogs: blogs.length,
      });

      setAllResources({ guides, webinars, blogs });
      setIsLoading(false);
    };

    fetchData();
  }, []);

  // Search across all resources
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    const lowerQuery = query.toLowerCase();
    const results: FeaturedResource[] = [];
    
    // Search demos
    DEMO_ITEMS.forEach(demo => {
      if (demo.title.toLowerCase().includes(lowerQuery) || demo.description.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'Demo',
          title: demo.title,
          description: demo.description,
          icon: Video,
          href: `/resources/demos?demo=${demo.id}`,
          id: demo.id,
          imageUrl: demo.thumbnail,
        });
      }
    });
    
    // Search guides
    allResources.guides.forEach(guide => {
      if (guide.title?.toLowerCase().includes(lowerQuery) || guide.description?.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'Guide',
          title: guide.title,
          description: guide.description || 'Comprehensive guide',
          icon: Download,
          href: `/resources/guides?article=${guide.id}`,
          id: guide.id,
          imageUrl: guide.featured_image_url || FALLBACK_IMAGES.Guide,
        });
      }
    });
    
    // Search webinars
    allResources.webinars.forEach(webinar => {
      if (webinar.title?.toLowerCase().includes(lowerQuery) || webinar.description?.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'Webinar',
          title: webinar.title,
          description: describeWebinar(webinar),
          icon: Play,
          href: `/resources/webinars?event=${webinar.id}`,
          id: webinar.id,
          imageUrl: webinar.featured_image_url || FALLBACK_IMAGES.Webinar,
        });
      }
    });
    
    // Search blogs
    allResources.blogs.forEach(blog => {
      if (blog.title?.toLowerCase().includes(lowerQuery) || blog.excerpt?.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'Blog',
          title: blog.title,
          description: blog.excerpt || 'Latest insights',
          icon: Newspaper,
          href: `/resources/blog?article=${blog.id}`,
          id: blog.id,
          imageUrl: blog.featured_image_url || FALLBACK_IMAGES.Blog,
        });
      }
    });
    
    setSearchResults(results.slice(0, 9)); // Limit to 9 results
  }, [allResources]);
  
  // Refresh featured resources
  const refreshFeatured = useCallback(() => {
    setRandomSeed(Math.random());
  }, []);

  // Generate random featured resources with images - uses randomSeed for true randomness
  const featuredResources = useMemo<FeaturedResource[]>(() => {
    const featured: FeaturedResource[] = [];
    const { guides, webinars, blogs } = allResources;

    // Seeded random function
    const seededRandom = (seed: number, index: number) => {
      const x = Math.sin(seed * 9999 + index) * 10000;
      return x - Math.floor(x);
    };

    const getRandomItem = <T,>(arr: T[], index: number): T | null => {
      if (arr.length === 0) return null;
      return arr[Math.floor(seededRandom(randomSeed, index) * arr.length)];
    };

    // Pick random guide
    const randomGuide = getRandomItem(guides, 1);
    if (randomGuide) {
      featured.push({
        type: 'Guide',
        title: randomGuide.title,
        description: randomGuide.description || 'Comprehensive implementation guide',
        icon: Download,
        href: `/resources/guides?article=${randomGuide.id}`,
        id: randomGuide.id,
        imageUrl: randomGuide.featured_image_url || FALLBACK_IMAGES.Guide,
      });
    }

    // Pick a webinar — an upcoming one if there is one, otherwise the seeded pick.
    const randomWebinar = pickFeaturedWebinar(webinars, getRandomItem(webinars, 2));
    if (randomWebinar) {
      featured.push({
        type: 'Webinar',
        title: randomWebinar.title,
        description: describeWebinar(randomWebinar),
        icon: Play,
        href: `/resources/webinars?event=${randomWebinar.id}`,
        id: randomWebinar.id,
        imageUrl: randomWebinar.featured_image_url || FALLBACK_IMAGES.Webinar,
      });
    }

    // Pick random blog OR demo based on seed
    const randomBlog = getRandomItem(blogs, 3);
    const randomDemo = getRandomItem(DEMO_ITEMS, 4);
    
    if (seededRandom(randomSeed, 5) > 0.5 && randomBlog) {
      featured.push({
        type: 'Blog',
        title: randomBlog.title,
        description: randomBlog.excerpt || 'Latest insights and articles',
        icon: Newspaper,
        href: `/resources/blog?article=${randomBlog.id}`,
        id: randomBlog.id,
        imageUrl: randomBlog.featured_image_url || FALLBACK_IMAGES.Blog,
      });
    } else if (randomDemo) {
      featured.push({
        type: 'Demo',
        title: randomDemo.title,
        description: randomDemo.description,
        icon: Video,
        href: `/resources/demos?demo=${randomDemo.id}`,
        id: randomDemo.id,
        imageUrl: randomDemo.thumbnail,
      });
    } else if (randomBlog) {
      featured.push({
        type: 'Blog',
        title: randomBlog.title,
        description: randomBlog.excerpt || 'Latest insights and articles',
        icon: Newspaper,
        href: `/resources/blog?article=${randomBlog.id}`,
        id: randomBlog.id,
        imageUrl: randomBlog.featured_image_url || FALLBACK_IMAGES.Blog,
      });
    }

    return featured;
  }, [allResources, randomSeed]);

  const resourceCategories = [
    {
      title: "Demos",
      description: "Interactive product demonstrations and walkthroughs",
      icon: Video,
      href: "/resources/demos",
      count: `${counts.demos} demos`,
      gradient: "from-primary/20 to-primary/5",
    },
    {
      title: "Webinars & Events",
      description: "Live sessions and recorded presentations from industry experts",
      icon: Calendar,
      href: "/resources/webinars",
      count: `${counts.webinars} webinars`,
      gradient: "from-secondary/20 to-secondary/5",
    },
    {
      title: "Guides & Playbooks",
      description: "Step-by-step implementation guides and best practices",
      icon: FileText,
      href: "/resources/guides",
      count: `${counts.guides} guides`,
      gradient: "from-violet-500/20 to-violet-500/5",
    },
    {
      title: "Blog / Insights",
      description: "Latest articles, case studies, and industry insights",
      icon: Newspaper,
      href: "/resources/blog",
      count: `${counts.blogs} articles`,
      gradient: "from-amber-500/20 to-amber-500/5",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Construction AI Resources & Guides"
        description="Demos, guides, webinars, and insights for construction and contracting businesses adopting agentic AI. Learn how to achieve 10x operational improvement."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Resources", url: "/resources" }
        ]}
      />
      <Header />
      
      <main>
        {/* Hero with enhanced animations */}
        <section ref={heroRef} className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-background to-primary/5" />
          <motion.div 
            className="absolute top-0 left-1/4 w-96 h-96 bg-secondary/15 rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
              x: [0, 20, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: [0.1, 0.2, 0.1],
              y: [0, -30, 0],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          <motion.div 
            className="absolute top-1/2 right-1/3 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.05, 0.15, 0.05],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          
          <div className="container-wide relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              <motion.span 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={heroInView ? { opacity: 1, scale: 1, y: 0 } : {}}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/20 text-secondary rounded-full text-sm font-medium mb-6"
              >
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                >
                  <BookOpen className="w-4 h-4" />
                </motion.span>
                Resources
              </motion.span>
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground mb-6 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                Learn &{" "}
                <span className="text-gradient-animated bg-gradient-to-r from-secondary via-primary to-secondary bg-[length:200%_auto] bg-clip-text text-transparent">
                  Explore
                </span>
              </motion.h1>
              <motion.p 
                className="text-xl text-muted-foreground"
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                Explore demos, guides, webinars, and insights to get the most out of alfred ai.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Global Search Section */}
        <section className="py-8 bg-background border-b border-border/50">
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="max-w-2xl mx-auto"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search across demos, guides, webinars, and articles..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-12 pr-10 py-6 text-base rounded-2xl border-2 border-border bg-card focus:border-primary/50 transition-all shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearch("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </motion.div>
            
            {/* Search Results */}
            {isSearching && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    Found <span className="font-medium text-foreground">{searchResults.length}</span> results for "{searchQuery}"
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => handleSearch("")}>
                    Clear search
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((result, index) => (
                    <motion.div
                      key={result.id || result.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        to={result.href}
                        className="flex gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all group"
                      >
                        <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={result.imageUrl} 
                            alt={result.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="inline-flex items-center gap-1 text-xs text-primary font-medium mb-1">
                            <result.icon className="w-3 h-3" />
                            {result.type}
                          </span>
                          <h3 className="font-medium text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
                            {result.title}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">{result.description}</p>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
            
            {isSearching && searchResults.length === 0 && searchQuery && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 text-center py-8"
              >
                <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
                <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
              </motion.div>
            )}
          </div>
        </section>

        {/* Resource Categories with staggered animations */}
        <section ref={categoriesRef} className="py-16 bg-background relative">
          <div className="container-wide">
            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate={categoriesInView ? "visible" : "hidden"}
            >
              {resourceCategories.map((category, index) => (
                <motion.div
                  key={category.title}
                  variants={itemVariants}
                  whileHover={{ 
                    y: -8, 
                    scale: 1.02,
                    transition: { duration: 0.2 } 
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    to={category.href}
                    className={`relative block bg-gradient-to-br ${category.gradient} rounded-2xl border border-border/50 p-6 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 transition-all group h-full overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-card/80 backdrop-blur-sm" />
                    {/* Hover glow effect */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-secondary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    />
                    <div className="relative z-10">
                      <motion.div 
                        className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <category.icon className="w-6 h-6 text-primary" />
                      </motion.div>
                      <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {category.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {category.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : category.count}
                        </span>
                        <motion.div
                          initial={{ x: -10, opacity: 0 }}
                          whileHover={{ x: 0, opacity: 1 }}
                          className="group-hover:opacity-100"
                        >
                          <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                        </motion.div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Featured Resources with images */}
        <section ref={featuredRef} className="py-16 bg-gradient-to-b from-background to-muted/20 relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="container-wide relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={featuredInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="mb-8 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="w-5 h-5 text-primary" />
                </motion.div>
                <div>
                  <span className="section-label">Recommended</span>
                  <h2 className="text-2xl font-semibold text-foreground">Featured Resources</h2>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshFeatured}
                className="text-muted-foreground hover:text-primary"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Shuffle
              </Button>
            </motion.div>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <motion.div 
                className="grid md:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate={featuredInView ? "visible" : "hidden"}
              >
                {featuredResources.map((resource, index) => (
                  <motion.div
                    key={resource.id || resource.title}
                    variants={itemVariants}
                    whileHover={{ 
                      y: -8, 
                      scale: 1.02,
                      transition: { duration: 0.25 } 
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to={resource.href}
                      className="block bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 transition-all group h-full"
                    >
                      {/* Image */}
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img 
                          src={resource.imageUrl} 
                          alt={resource.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/20 to-transparent" />
                        {/* Type badge */}
                        <div className="absolute top-3 left-3">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background/90 backdrop-blur-sm rounded-full text-xs font-medium text-primary border border-border/50">
                            <resource.icon className="w-3.5 h-3.5" />
                            {resource.type}
                          </span>
                        </div>
                        {/* Play button for videos/demos */}
                        {(resource.type === 'Demo' || resource.type === 'Webinar') && (
                          <motion.div 
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            whileHover={{ scale: 1.1 }}
                          >
                            <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                              <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
                            </div>
                          </motion.div>
                        )}
                      </div>
                      {/* Content */}
                      <div className="p-5">
                        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {resource.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{resource.description}</p>
                        <motion.div 
                          className="flex items-center gap-1 text-primary text-sm font-medium mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
                          initial={{ x: -5 }}
                          whileHover={{ x: 0 }}
                        >
                          Explore <ArrowRight className="w-4 h-4" />
                        </motion.div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-background">
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-3xl p-10 md:p-14 text-center max-w-4xl mx-auto"
            >
              {/* Pastel Mesh Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-100/60 via-cyan-50/40 to-violet-100/50" />
              <motion.div 
                className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-gradient-to-br from-pink-200/50 to-rose-100/30 rounded-full blur-[80px]"
                animate={{ 
                  x: [0, 20, 0],
                  y: [0, -10, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div 
                className="absolute bottom-0 right-1/4 w-[250px] h-[250px] bg-gradient-to-br from-cyan-100/50 to-sky-100/30 rounded-full blur-[70px]"
                animate={{ 
                  x: [0, -15, 0],
                  y: [0, 10, 0],
                  scale: [1, 1.08, 1]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              />
              <motion.div 
                className="absolute top-1/2 right-1/3 w-[200px] h-[200px] bg-gradient-to-br from-violet-100/40 to-purple-50/20 rounded-full blur-[60px]"
                animate={{ 
                  x: [0, 10, 0],
                  y: [0, -5, 0]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              />
              
              <div className="relative z-10">
                <motion.div 
                  className="w-14 h-14 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/10"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sparkles className="w-7 h-7 text-primary" />
                </motion.div>
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                  Can't find what you're looking for?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Our team is here to help you find the right resources for your needs.
                </p>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link to="/contact">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 hover:shadow-lg hover:shadow-primary/25 transition-all font-medium">
                      Contact Us
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Resources;