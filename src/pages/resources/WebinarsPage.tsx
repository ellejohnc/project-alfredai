import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { SafeAnimatePresence } from "@/components/ui/safe-animate-presence";
import { PRODUCTION_URL } from "@/lib/siteConfig";
import { Link, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, Calendar, Clock, Users, Play, 
  CalendarPlus, Bell, Video, CheckCircle, X,
  MapPin, ExternalLink, Loader2, Filter, ChevronDown,
  ChevronLeft, ChevronRight, Download, User, Radio,
  ShieldCheck
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
import WebinarDetailModal from "@/components/webinars/WebinarDetailModal";
import CountdownTimer from "@/components/CountdownTimer";
import { ComingSoonPage } from "@/components/ui/ComingSoonPage";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AdminQuickEditBanner from "@/components/admin/AdminQuickEditBanner";
import { usePublishedWebinars, type PublishedWebinar } from "@/hooks/usePublishedContent";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";

type WebinarEvent = PublishedWebinar;

// Helper to extract YouTube video ID
const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

// Helper to extract Vimeo video ID
const getVimeoVideoId = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
};

// Helper to get video thumbnail from URL
const getVideoThumbnail = (url: string | null): string | null => {
  if (!url) return null;
  
  // YouTube thumbnail
  const youtubeId = getYouTubeVideoId(url);
  if (youtubeId) {
    return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
  }
  
  // Vimeo - requires API call, use placeholder
  const vimeoId = getVimeoVideoId(url);
  if (vimeoId) {
    return `https://vumbnail.com/${vimeoId}.jpg`;
  }
  
  return null;
};

// Check if URL is a direct video file (for uploaded videos)
const isDirectVideoFile = (url: string | null): boolean => {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
};

const EVENT_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'webinar', label: 'Webinars' },
  { value: 'workshop', label: 'Workshops' },
  { value: 'conference', label: 'Conferences' },
  { value: 'meetup', label: 'Meetups' },
  { value: 'summit', label: 'Summits' },
  { value: 'masterclass', label: 'Masterclasses' },
  { value: 'live_demo', label: 'Live Demos' },
];

const ITEMS_PER_PAGE = 9;

// Generate iCal file content
const generateICalFile = (webinar: WebinarEvent): string => {
  const formatICalDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  const startDate = webinar.event_date ? new Date(webinar.event_date) : new Date();
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
  
  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//alfred ai//Webinar//EN',
    'BEGIN:VEVENT',
    `UID:${webinar.id}@${PRODUCTION_URL.replace('https://', '').replace('new.', '')}`,
    `DTSTAMP:${formatICalDate(new Date())}`,
    `DTSTART:${formatICalDate(startDate)}`,
    `DTEND:${formatICalDate(endDate)}`,
    `SUMMARY:${webinar.title}`,
    `DESCRIPTION:${(webinar.description || '').replace(/\n/g, '\\n')}`,
    'LOCATION:Online',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  return icalContent;
};

// Download iCal file
const downloadICalFile = (webinar: WebinarEvent) => {
  const icalContent = generateICalFile(webinar);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${webinar.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const WebinarsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [registrationModal, setRegistrationModal] = useState<WebinarEvent | null>(null);
  const [calendarModal, setCalendarModal] = useState<WebinarEvent | null>(null);
  const [selectedWebinar, setSelectedWebinar] = useState<WebinarEvent | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [registeredWebinars, setRegisteredWebinars] = useState<string[]>([]);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const webinarRefs = useRef<Record<string, HTMLElement | null>>({});
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // reCAPTCHA hook
  const { verifyRecaptcha, isReady: recaptchaReady } = useRecaptcha();

  // Feature flag for Coming Soon overlay
  const { isEnabled: showComingSoon } = useFeatureFlag("webinars_coming_soon");

  // Fetch webinars using cached hook
  const { items: webinars, isLoading } = usePublishedWebinars();

  // Filter webinars by event type
  const filteredWebinars = useMemo(() => {
    if (selectedEventType === 'all') return webinars;
    return webinars.filter(w => w.event_type === selectedEventType);
  }, [webinars, selectedEventType]);

  // Separate upcoming and past webinars
  const now = new Date();
  const upcomingWebinars = filteredWebinars.filter(w => {
    if (!w.event_date) return false;
    return new Date(w.event_date) >= now;
  });
  const pastWebinars = filteredWebinars.filter(w => {
    if (!w.event_date) return true; // No date = past/recorded
    return new Date(w.event_date) < now;
  });

  // Get featured past webinars (limit to 5 like guides/blog)
  const featuredWebinars = pastWebinars.filter(w => w.is_featured).slice(0, 5);
  const regularWebinars = pastWebinars.filter(w => !w.is_featured);

  // Pagination for regular webinars
  const totalPages = Math.ceil(regularWebinars.length / ITEMS_PER_PAGE);
  const paginatedWebinars = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return regularWebinars.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [regularWebinars, currentPage]);

  // Pagination for upcoming events
  const UPCOMING_PER_PAGE = 5;
  const [upcomingPage, setUpcomingPage] = useState(1);
  const upcomingTotalPages = Math.ceil(upcomingWebinars.length / UPCOMING_PER_PAGE);
  const paginatedUpcoming = useMemo(() => {
    const sorted = [...upcomingWebinars].sort((a, b) => 
      new Date(a.event_date || '').getTime() - new Date(b.event_date || '').getTime()
    );
    const startIndex = (upcomingPage - 1) * UPCOMING_PER_PAGE;
    return sorted.slice(startIndex, startIndex + UPCOMING_PER_PAGE);
  }, [upcomingWebinars, upcomingPage]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
    setUpcomingPage(1);
  }, [selectedEventType]);

  // Auto-cycle featured webinars
  useEffect(() => {
    if (featuredWebinars.length <= 1 || isPaused) return;
    
    const interval = setInterval(() => {
      setFeaturedIndex(prev => (prev + 1) % featuredWebinars.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [featuredWebinars.length, isPaused]);

  const goToPrevFeatured = useCallback(() => {
    setFeaturedIndex(prev => (prev - 1 + featuredWebinars.length) % featuredWebinars.length);
  }, [featuredWebinars.length]);

  const goToNextFeatured = useCallback(() => {
    setFeaturedIndex(prev => (prev + 1) % featuredWebinars.length);
  }, [featuredWebinars.length]);

  // Get unique event types from data for dynamic filtering
  const availableEventTypes = useMemo(() => {
    const types = new Set(webinars.map(w => w.event_type).filter(Boolean));
    return EVENT_TYPES.filter(t => t.value === 'all' || types.has(t.value));
  }, [webinars]);

  // Handle ?event= query parameter
  useEffect(() => {
    const eventParam = searchParams.get("event");
    if (eventParam && webinars.length > 0) {
      const webinar = webinars.find(w => w.id === eventParam);
      if (webinar) {
        setTimeout(() => {
          const webinarEl = webinarRefs.current[eventParam];
          if (webinarEl) {
            webinarEl.scrollIntoView({ behavior: "smooth", block: "center" });
            setRegistrationModal(webinar);
          }
        }, 300);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, setSearchParams, webinars]);

  const handleRegister = async (webinar: WebinarEvent) => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    
    if (!email.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsRegistering(true);
    
    try {
      // Verify reCAPTCHA first
      const recaptchaResult = await verifyRecaptcha('event_registration');
      if (!recaptchaResult.success) {
        toast.error(recaptchaResult.error || "Verification failed. Please try again.");
        setIsRegistering(false);
        return;
      }

      // Registrations from this page used to go into `event_registrations`,
      // which NOTHING in the admin panel reads — the Webinar Leads page reads
      // `webinar_registrations`. So anyone registering here vanished. Both
      // tables were empty, so nothing is being migrated; from here every
      // registration path goes through register-webinar and lands in the one
      // table the admin panel actually shows.
      const [firstName, ...restName] = (name.trim() || '').split(/\s+/);
      const { data: regData, error } = await supabase.functions.invoke('register-webinar', {
        body: {
          webinar_slug: (webinar as { slug?: string | null }).slug ?? null,
          webinar_title: webinar.title,
          webinar_date_label: webinar.event_date,
          first_name: firstName || email.split('@')[0],
          last_name: restName.join(' '),
          email: email.toLowerCase().trim(),
          consent: true,
        },
      });
      if (!error && regData && regData.success === false) {
        throw new Error(regData.error || 'Registration failed');
      }

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast.info("You're already registered for this event!");
        } else {
          throw error;
        }
      } else {
        // Send confirmation email
        try {
          await supabase.functions.invoke('send-registration-confirmation', {
            body: {
              name: name.trim() || null,
              email: email.toLowerCase().trim(),
              eventTitle: webinar.title,
              eventDate: webinar.event_date,
              eventType: webinar.event_type
            }
          });
        } catch (emailError) {
          console.error("Failed to send confirmation email:", emailError);
          // Don't fail the registration if email fails
        }
        
        toast.success("Registration confirmed! Check your email for confirmation.");
      }
      
      setRegisteredWebinars([...registeredWebinars, webinar.id]);
      setRegistrationModal(null);
      setEmail("");
      setName("");
      
      // Offer to add to calendar
      setCalendarModal(webinar);
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Failed to register. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  const addToGoogleCalendar = (webinar: WebinarEvent) => {
    const startDate = webinar.event_date ? new Date(webinar.event_date) : new Date();
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    
    const formatGoogleDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const title = encodeURIComponent(webinar.title);
    const details = encodeURIComponent(webinar.description || '');
    const dates = `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`;
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}&location=Online`;
    window.open(calendarUrl, "_blank");
    toast.success("Opening Google Calendar...");
  };

  const addToOutlookCalendar = (webinar: WebinarEvent) => {
    const startDate = webinar.event_date ? new Date(webinar.event_date) : new Date();
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    
    const title = encodeURIComponent(webinar.title);
    const details = encodeURIComponent(webinar.description || '');
    
    const outlookUrl = `https://outlook.live.com/calendar/0/action/compose?subject=${title}&body=${details}&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}&location=Online`;
    window.open(outlookUrl, "_blank");
    toast.success("Opening Outlook Calendar...");
  };

  const handleDownloadIcs = (webinar: WebinarEvent) => {
    downloadICalFile(webinar);
    toast.success("Calendar file downloaded!");
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'TBA';
    return new Date(dateStr).toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO 
        title="Webinars & Events" 
        description="Join alfred ai webinars and events to learn about AI automation, best practices, and industry insights."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Resources", url: "/resources" },
          { name: "Webinars", url: "/resources/webinars" }
        ]}
      />
      <Header />
      
      {showComingSoon ? (
        <ComingSoonPage
          title="Webinars & Events"
          message="Coming Soon..."
          description="We're preparing expert-led sessions, live demos, and interactive workshops. Sign up to be first in line when we launch!"
          icon={Calendar}
          showEmailSignup
          signupSource="webinars"
          signupPrompt="Get notified when our webinars launch"
          notifySales
          featureName="Webinars"
          backLink="/resources"
          backLinkLabel="Back to Resources"
        />
      ) : (
        <main className="flex-1">
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
                className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <Calendar className="w-7 h-7 text-primary" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-semibold text-foreground mb-4 leading-tight">
                Webinars & Events
              </h1>
              <p className="text-xl text-muted-foreground">
                Join live sessions with industry experts and watch recordings of past webinars. Learn strategies that drive real results.
              </p>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-6 mt-8">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{webinars.length}</p>
                    <p className="text-sm text-muted-foreground">Total Events</p>
                  </div>
                </div>
                {upcomingWebinars.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{upcomingWebinars.length}</p>
                      <p className="text-sm text-muted-foreground">Upcoming</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Video className="w-5 h-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{pastWebinars.length}</p>
                    <p className="text-sm text-muted-foreground">Recordings</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Admin Quick Edit Banner */}
        <AdminQuickEditBanner adminPath="/admin/webinars" label="Manage Webinars" />

        {/* Loading State with Skeleton */}
        {isLoading && (
          <section className="py-12 bg-background">
            <div className="container-wide space-y-8">
              {/* Upcoming events skeleton */}
              <div className="space-y-4">
                <div className="flex gap-2 mb-6">
                  <div className="h-6 w-24 bg-muted rounded-full animate-pulse" />
                </div>
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-card rounded-2xl border border-border p-6 flex gap-6">
                    <div className="w-20 h-20 bg-muted rounded-2xl animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="flex gap-2">
                        <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
                        <div className="h-5 w-20 bg-muted rounded-full animate-pulse" />
                      </div>
                      <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-full bg-muted rounded animate-pulse" />
                      <div className="flex gap-4">
                        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <div className="h-10 w-28 bg-muted rounded-lg animate-pulse" />
                      <div className="h-10 w-28 bg-muted rounded-lg animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
              {/* Past events skeleton grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="aspect-video bg-muted animate-pulse relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 bg-muted-foreground/20 rounded-full animate-pulse" />
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex gap-2">
                        <div className="h-5 w-20 bg-muted rounded-full animate-pulse" />
                      </div>
                      <div className="h-5 w-full bg-muted rounded animate-pulse" />
                      <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Future Events Section */}
        {!isLoading && upcomingWebinars.length > 0 && (
          <section className="py-16 bg-gradient-to-b from-primary/5 to-background relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="container-wide relative">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                <div>
                  <Badge className="mb-3 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    <Bell className="w-3 h-3 mr-1" />
                    Live & Upcoming
                  </Badge>
                  <h2 className="text-3xl font-semibold text-foreground mb-2">Future Events</h2>
                  <p className="text-muted-foreground max-w-xl">
                    Register now to secure your spot and receive reminder notifications before each event.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">{upcomingWebinars.length} upcoming event{upcomingWebinars.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <div className="grid gap-6">
                {paginatedUpcoming.map((webinar, index) => {
                  const isRegistered = registeredWebinars.includes(webinar.id);
                  const eventDate = webinar.event_date ? new Date(webinar.event_date) : null;
                  const daysUntil = eventDate ? Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
                  const showRegistration = webinar.show_registration !== false;
                  
                  // Check if event is currently live (within 2 hours of start time)
                  const isLive = eventDate && 
                    now.getTime() >= eventDate.getTime() - (30 * 60 * 1000) && // 30 min before
                    now.getTime() <= eventDate.getTime() + (2 * 60 * 60 * 1000); // 2 hours after start
                  
                  const isFirst = index === 0 && upcomingPage === 1;
                  
                  return (
                    <motion.div
                      key={webinar.id}
                      ref={(el) => (webinarRefs.current[webinar.id] = el)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-card rounded-2xl border-2 p-6 md:p-8 transition-all duration-300 hover:shadow-xl ${
                        isFirst ? "border-emerald-500/40 shadow-lg shadow-emerald-500/10" : "border-border hover:border-primary/30"
                      } ${searchParams.get("event") === webinar.id ? "ring-2 ring-primary/20" : ""}`}
                    >
                      <div className="flex flex-col xl:flex-row xl:items-start gap-6">
                        {/* Date Badge */}
                        <div className="flex-shrink-0">
                          <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center ${
                            isFirst ? "bg-emerald-500 text-white" : "bg-primary/10 text-primary"
                          }`}>
                            {eventDate ? (
                              <>
                                <span className="text-2xl font-bold">{eventDate.getDate()}</span>
                                <span className="text-xs uppercase tracking-wider">
                                  {eventDate.toLocaleDateString('en-US', { month: 'short' })}
                                </span>
                              </>
                            ) : (
                              <Calendar className="w-8 h-8" />
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {isLive && (
                              <Badge className="bg-red-500 text-white animate-pulse">
                                <Radio className="w-3 h-3 mr-1" />
                                Live Now
                              </Badge>
                            )}
                            {!isLive && isFirst && (
                              <Badge className="bg-emerald-500 text-white">Next Up</Badge>
                            )}
                            {!isLive && daysUntil !== null && daysUntil <= 7 && (
                              <Badge variant="outline" className="border-amber-500/50 text-amber-600 bg-amber-500/10">
                                {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                              </Badge>
                            )}
                            {webinar.event_type && (
                              <Badge variant="secondary" className="capitalize">
                                {webinar.event_type.replace('_', ' ')}
                              </Badge>
                            )}
                          </div>
                          
                          <h3 className="text-xl font-semibold text-foreground mb-2">{webinar.title}</h3>
                          <p className="text-muted-foreground mb-4 line-clamp-2">{webinar.description}</p>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-primary" />
                              {eventDate?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
                            </span>
                            {webinar.presenter_name && (
                              <span className="flex items-center gap-1.5">
                                <User className="w-4 h-4 text-primary" />
                                {webinar.presenter_name}
                              </span>
                            )}
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-primary" />
                              Online
                            </span>
                          </div>

                          {/* Countdown Timer */}
                          {eventDate && isFirst && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <p className="text-sm text-muted-foreground mb-3">Event starts in:</p>
                              <CountdownTimer targetDate={eventDate} />
                            </div>
                          )}
                          {eventDate && !isFirst && (
                            <div className="mt-2">
                              <CountdownTimer targetDate={eventDate} compact />
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3 xl:min-w-[180px]">
                          {/* Join Live button - shows when event is live and has join_url */}
                          {isLive && webinar.join_url && (
                            <Button 
                              asChild
                              className="bg-red-500 hover:bg-red-600 text-white animate-pulse"
                            >
                              <a href={webinar.join_url} target="_blank" rel="noopener noreferrer">
                                <Radio className="w-4 h-4 mr-2" />
                                Join Live
                              </a>
                            </Button>
                          )}
                          
                          {/* Registration buttons - only show if not live or no join_url */}
                          {(!isLive || !webinar.join_url) && (
                            isRegistered ? (
                              <div className="flex items-center justify-center gap-2 text-emerald-600 font-medium bg-emerald-500/10 py-2.5 px-4 rounded-lg border border-emerald-500/20">
                                <CheckCircle className="w-5 h-5" />
                                Registered
                              </div>
                            ) : showRegistration ? (
                              webinar.registration_url ? (
                                <Button 
                                  asChild
                                  className="bg-primary hover:bg-primary-hover text-primary-foreground"
                                >
                                  <a href={webinar.registration_url} target="_blank" rel="noopener noreferrer">
                                    Register Now
                                    <ExternalLink className="w-4 h-4 ml-2" />
                                  </a>
                                </Button>
                              ) : (
                                <Button 
                                  onClick={() => setRegistrationModal(webinar)}
                                  className={isFirst ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-primary hover:bg-primary-hover text-primary-foreground"}
                                >
                                  Register Now
                                </Button>
                              )
                            ) : null
                          )}
                          
                          <Button 
                            variant="outline" 
                            onClick={() => setCalendarModal(webinar)}
                            className="flex items-center gap-2"
                          >
                            <CalendarPlus className="w-4 h-4" />
                            Add to Calendar
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Pagination for upcoming events */}
              {upcomingTotalPages > 1 && (
                <div className="mt-8">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setUpcomingPage(p => Math.max(1, p - 1))}
                          className={upcomingPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: upcomingTotalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setUpcomingPage(page)}
                            isActive={upcomingPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setUpcomingPage(p => Math.min(upcomingTotalPages, p + 1))}
                          className={upcomingPage === upcomingTotalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Featured Webinars Section */}
        {!isLoading && featuredWebinars.length > 0 && (
          <section className="py-16 bg-background">
            <div className="container-wide">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                <div>
                  <Badge variant="secondary" className="mb-3 bg-primary/10 text-primary border-primary/20">
                    Editor's Pick
                  </Badge>
                  <h2 className="text-3xl font-semibold text-foreground mb-2">Featured Sessions</h2>
                  <p className="text-muted-foreground max-w-xl">
                    Hand-picked sessions showcasing our most impactful content.
                  </p>
                </div>
                {featuredWebinars.length > 1 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium">{featuredIndex + 1} / {featuredWebinars.length}</span>
                  </div>
                )}
              </div>

              {/* Featured Carousel */}
              <div 
                className="relative"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                {/* Navigation Arrows */}
                {featuredWebinars.length > 1 && (
                  <>
                    <button
                      onClick={goToPrevFeatured}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 rounded-full bg-background border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors"
                      aria-label="Previous featured webinar"
                    >
                      <ChevronLeft className="w-6 h-6 text-foreground" />
                    </button>
                    <button
                      onClick={goToNextFeatured}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 rounded-full bg-background border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors"
                      aria-label="Next featured webinar"
                    >
                      <ChevronRight className="w-6 h-6 text-foreground" />
                    </button>
                  </>
                )}

                {/* Carousel Container with Fixed Height */}
                <div className="overflow-hidden rounded-2xl">
                  <SafeAnimatePresence mode="wait">
                    {featuredWebinars.map((webinar, index) => 
                      index === featuredIndex && (
                        <motion.div
                          key={webinar.id}
                          initial={{ opacity: 0, x: 100 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                          onClick={() => setSelectedWebinar(webinar)}
                          className="group bg-card rounded-2xl border-2 border-primary/20 overflow-hidden hover:shadow-xl hover:border-primary/40 transition-all duration-300 cursor-pointer"
                        >
                          <div className="flex flex-col lg:flex-row h-full lg:h-[320px]">
                            {/* Thumbnail - Fixed aspect, supports video_url thumbnails */}
                            <div className="lg:w-2/5 h-[200px] lg:h-full relative overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
                              {(() => {
                                const thumbnail = webinar.featured_image_url || getVideoThumbnail(webinar.video_url);
                                const isDirectVideo = isDirectVideoFile(webinar.video_url);
                                
                                if (isDirectVideo && webinar.video_url) {
                                  return (
                                    <video 
                                      src={webinar.video_url}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                      muted
                                      playsInline
                                      preload="metadata"
                                    />
                                  );
                                } else if (thumbnail) {
                                  return (
                                    <img 
                                      src={thumbnail} 
                                      alt={webinar.title}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                      loading="lazy"
                                      decoding="async"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        if (target.src.includes('maxresdefault')) {
                                          target.src = target.src.replace('maxresdefault', 'hqdefault');
                                        }
                                      }}
                                    />
                                  );
                                } else {
                                  return (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center">
                                        <Video className="w-12 h-12 text-primary/60" />
                                      </div>
                                    </div>
                                  );
                                }
                              })()}
                              {/* Play button overlay */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <motion.div 
                                  className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                                >
                                  <Play className="w-9 h-9 text-primary-foreground ml-1" />
                                </motion.div>
                              </div>
                            </div>

                            {/* Content - Fixed height with overflow handling */}
                            <div className="lg:w-3/5 p-6 lg:p-8 flex flex-col justify-center">
                              <div className="flex items-center gap-3 mb-4">
                                <Badge className="bg-primary text-primary-foreground">
                                  ★ Featured
                                </Badge>
                                {webinar.event_type && (
                                  <Badge variant="secondary" className="capitalize">
                                    {webinar.event_type.replace('_', ' ')}
                                  </Badge>
                                )}
                              </div>

                              <h3 className="text-2xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
                                {webinar.title}
                              </h3>

                              {webinar.description && (
                                <p className="text-muted-foreground mb-4 line-clamp-2">
                                  {webinar.description}
                                </p>
                              )}

                              {/* Presenter */}
                              {webinar.presenter_name && (
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium shrink-0">
                                    {webinar.presenter_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-foreground truncate">{webinar.presenter_name}</p>
                                    {webinar.presenter_title && (
                                      <p className="text-sm text-muted-foreground truncate">{webinar.presenter_title}</p>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-4 h-4" />
                                  {webinar.event_date 
                                    ? new Date(webinar.event_date).toLocaleDateString('en-AU', { 
                                        month: 'short', 
                                        day: 'numeric', 
                                        year: 'numeric' 
                                      })
                                    : 'Recorded Session'
                                  }
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-4 h-4" />
                                  On-demand
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    )}
                  </SafeAnimatePresence>
                </div>

                {/* Dot Indicators */}
                {featuredWebinars.length > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    {featuredWebinars.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setFeaturedIndex(index)}
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          index === featuredIndex 
                            ? 'bg-primary w-8' 
                            : 'bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2.5'
                        }`}
                        aria-label={`Go to featured webinar ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Past Webinars / On-Demand Library */}
        {!isLoading && regularWebinars.length > 0 && (
          <section className="py-16 bg-muted/30">
            <div className="container-wide">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                <div>
                  <Badge variant="secondary" className="mb-3 bg-primary/10 text-primary border-primary/20">
                    On-Demand Library
                  </Badge>
                  <h2 className="text-3xl font-semibold text-foreground mb-2">Watch Past Sessions</h2>
                  <p className="text-muted-foreground max-w-xl">
                    Access our complete archive of expert-led sessions, product demos, and industry insights.
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Filter Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2 bg-background">
                        <Filter className="w-4 h-4" />
                        {availableEventTypes.find(t => t.value === selectedEventType)?.label || 'All Types'}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-background border border-border z-50">
                      {availableEventTypes.map((type) => (
                        <DropdownMenuItem
                          key={type.value}
                          onClick={() => setSelectedEventType(type.value)}
                          className={`cursor-pointer ${selectedEventType === type.value ? 'bg-primary/10 text-primary' : ''}`}
                        >
                          {type.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Clear Filters Button */}
                  {selectedEventType !== 'all' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedEventType('all')}
                      className="gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                      Clear filters
                    </Button>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/80 px-4 py-2 rounded-full border border-border">
                    <Video className="w-4 h-4 text-primary" />
                    <span className="font-medium">{regularWebinars.length} recordings</span>
                  </div>
                </div>
              </div>

              {/* Regular Webinars Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedWebinars.map((webinar, index) => (
                  <motion.div
                    key={webinar.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    onClick={() => setSelectedWebinar(webinar)}
                    className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer"
                  >
                    {/* Thumbnail with overlay - supports video_url thumbnails */}
                    <div className="aspect-[16/9] relative overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5">
                      {(() => {
                        const thumbnail = webinar.featured_image_url || getVideoThumbnail(webinar.video_url);
                        const isDirectVideo = isDirectVideoFile(webinar.video_url);
                        
                        if (isDirectVideo && webinar.video_url) {
                          return (
                            <video 
                              src={webinar.video_url}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              muted
                              playsInline
                              preload="metadata"
                            />
                          );
                        } else if (thumbnail) {
                          return (
                            <img 
                              src={thumbnail} 
                              alt={webinar.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (target.src.includes('maxresdefault')) {
                                  target.src = target.src.replace('maxresdefault', 'hqdefault');
                                }
                              }}
                            />
                          );
                        } else {
                          return (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Video className="w-10 h-10 text-primary/60" />
                              </div>
                            </div>
                          );
                        }
                      })()}
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-60" />
                      
                      {/* Play button overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div 
                          className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110"
                          whileHover={{ scale: 1.1 }}
                        >
                          <Play className="w-7 h-7 text-primary-foreground ml-1" />
                        </motion.div>
                      </div>

                      {/* Badges */}
                      <div className="absolute top-4 left-4 flex gap-2">
                        <Badge className="bg-muted-foreground/80 text-white border-0 shadow-sm backdrop-blur-sm">
                          Past Event
                        </Badge>
                        {webinar.event_type && (
                          <Badge className="bg-background/90 text-foreground border-0 shadow-sm backdrop-blur-sm capitalize">
                            {webinar.event_type.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      {/* Date and duration row */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {webinar.event_date 
                            ? new Date(webinar.event_date).toLocaleDateString('en-AU', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })
                            : 'Recorded Session'
                          }
                        </span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          On-demand
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors text-lg leading-snug">
                        {webinar.title}
                      </h3>

                      {/* Presenter */}
                      {webinar.presenter_name && (
                        <p className="text-sm text-muted-foreground mb-3">
                          <span className="text-foreground font-medium">{webinar.presenter_name}</span>
                          {webinar.presenter_title && ` • ${webinar.presenter_title}`}
                        </p>
                      )}

                      {/* Description */}
                      {webinar.description && !webinar.presenter_name && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {webinar.description}
                        </p>
                      )}

                      {/* Watch CTA */}
                      <div className="flex items-center text-sm font-medium text-primary group-hover:gap-2 transition-all">
                        <span>Watch Recording</span>
                        <ExternalLink className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </motion.div>
                ))}
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

              {/* Empty filter state */}
              {regularWebinars.length === 0 && selectedEventType !== 'all' && (
                <div className="text-center py-12">
                  <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No {availableEventTypes.find(t => t.value === selectedEventType)?.label?.toLowerCase()} available.</p>
                  <Button variant="outline" onClick={() => setSelectedEventType('all')}>
                    View All Recordings
                  </Button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!isLoading && webinars.length === 0 && (
          <section className="py-12 bg-background">
            <div className="container-wide text-center">
              <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No webinars available yet. Check back soon!</p>
            </div>
          </section>
        )}

        {/* CTA */}
        <PremiumCTASection
          title="Want to host a webinar with us?"
          description="If you're a customer or partner interested in sharing your story, we'd love to hear from you."
          buttonText="Get in Touch"
          onButtonClick={() => setIsBookingOpen(true)}
          variant="light"
        />
        </main>
      )}

      <Footer />
      <BookingChatModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />

      {/* Webinar Detail Modal */}
      <WebinarDetailModal 
        webinar={selectedWebinar} 
        onClose={() => setSelectedWebinar(null)}
        onAddToCalendar={(webinar) => setCalendarModal(webinar)}
      />

      {/* Registration Modal */}
      {registrationModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={() => setRegistrationModal(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            className="bg-card rounded-2xl border border-border shadow-2xl max-w-lg w-full p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <Badge className="bg-primary mb-2">Event Registration</Badge>
                <h2 className="text-xl font-semibold text-foreground">{registrationModal.title}</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRegistrationModal(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-primary" />
                {formatDate(registrationModal.event_date)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-primary" />
                Online
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Your Name <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address <span className="text-destructive">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <Button 
                className="w-full bg-primary hover:bg-primary-hover text-primary-foreground"
                onClick={() => handleRegister(registrationModal)}
                disabled={isRegistering || !recaptchaReady}
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Register for Event'
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Protected by reCAPTCHA • Reminder sent 24h before
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Calendar Options Modal */}
      {calendarModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={() => setCalendarModal(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            className="bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <Badge className="bg-primary/10 text-primary border-primary/20 mb-2">Add to Calendar</Badge>
                <h2 className="text-lg font-semibold text-foreground line-clamp-2">{calendarModal.title}</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCalendarModal(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Calendar className="w-4 h-4 text-primary" />
              {formatDate(calendarModal.event_date)}
            </div>

            <div className="space-y-3">
              <Button 
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={() => {
                  addToGoogleCalendar(calendarModal);
                  setCalendarModal(null);
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Google Calendar</p>
                  <p className="text-xs text-muted-foreground">Opens in new tab</p>
                </div>
              </Button>

              <Button 
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={() => {
                  addToOutlookCalendar(calendarModal);
                  setCalendarModal(null);
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-sky-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Outlook Calendar</p>
                  <p className="text-xs text-muted-foreground">Opens in new tab</p>
                </div>
              </Button>

              <Button 
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={() => {
                  handleDownloadIcs(calendarModal);
                  setCalendarModal(null);
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Download className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Download .ics File</p>
                  <p className="text-xs text-muted-foreground">Apple Calendar, etc.</p>
                </div>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default WebinarsPage;
