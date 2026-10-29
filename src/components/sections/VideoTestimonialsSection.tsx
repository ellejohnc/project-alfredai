import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, X, Star, ChevronRight, ChevronLeft, Volume2, VolumeX } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LazyImage from "@/components/ui/lazy-image";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { usePublishedTestimonials, PublishedTestimonial } from "@/hooks/usePublishedContent";

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
const getEmbedUrl = (url: string, autoplay = true, muted = true): string | null => {
  if (!url) return null;
  
  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      mute: muted ? '1' : '0',
      controls: '0',
      loop: '1',
      playlist: youtubeMatch[1],
      modestbranding: '1',
      rel: '0',
    });
    return `https://www.youtube.com/embed/${youtubeMatch[1]}?${params.toString()}`;
  }
  
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      muted: muted ? '1' : '0',
      loop: '1',
      background: '1',
    });
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?${params.toString()}`;
  }
  
  return url;
};

// Get full embed URL for modal playback (with sound)
const getFullEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1`;
  }
  
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }
  
  return url;
};

// Client avatar with error fallback to initials
const ClientAvatar = ({ 
  testimonial, 
  size = 44 
}: { 
  testimonial: PublishedTestimonial; 
  size?: number;
}) => {
  const [imgError, setImgError] = useState(false);
  const initials = testimonial.client_name.split(' ').map(n => n[0]).join('').slice(0, 2);
  
  if (!testimonial.client_avatar_url || imgError) {
    return (
      <div 
        className="bg-primary/10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-primary/20"
        style={{ width: size, height: size }}
      >
        <span className="text-sm font-semibold text-primary">{initials}</span>
      </div>
    );
  }
  
  return (
    <div 
      className="bg-primary/10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-primary/20"
      style={{ width: size, height: size }}
    >
      <LazyImage 
        src={testimonial.client_avatar_url} 
        alt={testimonial.client_name} 
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

const VideoCard = ({ 
  testimonial, 
  index, 
  onPlay 
}: { 
  testimonial: PublishedTestimonial; 
  index: number; 
  onPlay: (testimonial: PublishedTestimonial) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const thumbnail = getVideoThumbnail(testimonial.video_url || '');
  const previewEmbedUrl = getEmbedUrl(testimonial.video_url || '', true, true);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className="group relative h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className="bg-card rounded-2xl overflow-hidden border border-border cursor-pointer hover:shadow-2xl hover:border-primary/40 transition-all duration-500 hover:scale-[1.02] h-full flex flex-col"
        onClick={() => onPlay(testimonial)}
        role="button"
        aria-label={`Play video testimonial from ${testimonial.client_name}`}
      >
        {/* Video Container */}
        <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
          {/* Thumbnail (shows when not hovered) */}
          <div className={`absolute inset-0 transition-opacity duration-500 ${isHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            {thumbnail && (
              <LazyImage 
                src={thumbnail} 
                alt={`${testimonial.client_name} video testimonial`}
                className="w-full h-full object-cover"
                wrapperClassName="w-full h-full"
                placeholderColor="bg-gradient-to-br from-primary/20 to-primary/5"
              />
            )}
          </div>
          
          {/* Auto-play preview (shows on hover) */}
          <div className={`absolute inset-0 transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {isHovered && previewEmbedUrl && (
              <iframe
                src={previewEmbedUrl}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                loading="lazy"
              />
            )}
          </div>
          
          {/* Muted indicator on hover */}
          <div className={`absolute bottom-3 right-3 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 rounded-full">
              <VolumeX className="w-3.5 h-3.5" />
              <span>Click for sound</span>
            </div>
          </div>
          
          {/* Play Button Overlay */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isHovered ? 'bg-black/10' : 'bg-black/30'}`}>
            <div className={`w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${isHovered ? 'scale-90 opacity-80' : 'scale-100 opacity-100 glow-pulse'}`}>
              <Play className="w-7 h-7 text-primary-foreground ml-1" fill="currentColor" />
            </div>
          </div>
          
          {/* Industry Badge */}
          {testimonial.industry && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center rounded-full bg-background/90 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-foreground shadow-lg">
                {testimonial.industry}
              </span>
            </div>
          )}
          
          {/* Featured badge */}
          {testimonial.is_featured && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-lg">
                Featured
              </span>
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <ClientAvatar testimonial={testimonial} size={44} />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-foreground text-sm truncate">{testimonial.client_name}</h4>
              <p className="text-xs text-muted-foreground truncate">
                {testimonial.client_title}{testimonial.client_company && `, ${testimonial.client_company}`}
              </p>
            </div>
          </div>

          {/* Star Rating */}
          <div className="flex gap-0.5 mt-auto">
            {Array.from({ length: testimonial.rating || 5 }).map((_, i) => (
              <Star key={i} className="w-4 h-4 text-warning fill-warning" />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const VideoTestimonialsSection = () => {
  const [selectedVideo, setSelectedVideo] = useState<PublishedTestimonial | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);

  const { items: dbTestimonials, isLoading } = usePublishedTestimonials();

  // Get featured video testimonials only
  const videoTestimonials = useMemo(() => {
    return dbTestimonials
      .filter(t => t.video_url && t.video_url.trim() !== '' && t.is_featured);
  }, [dbTestimonials]);

  const handlePlayVideo = useCallback((testimonial: PublishedTestimonial) => {
    setSelectedVideo(testimonial);
    setIsVideoModalOpen(true);
  }, []);

  // Update current index when carousel scrolls
  const onSelect = useCallback(() => {
    if (!carouselApi) return;
    setCurrentIndex(carouselApi.selectedScrollSnap());
  }, [carouselApi]);

  // Set up carousel event listener
  useMemo(() => {
    if (!carouselApi) return;
    carouselApi.on("select", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi, onSelect]);

  // Show skeleton while loading
  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-b from-background to-background-alt">
        <div className="container-wide">
          <div className="text-center mb-12">
            <div className="h-8 w-48 bg-muted rounded-full mx-auto mb-4 animate-pulse" />
            <div className="h-10 w-72 bg-muted rounded-lg mx-auto mb-4 animate-pulse" />
            <div className="h-6 w-96 bg-muted rounded-lg mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border">
                <div className="aspect-video bg-muted animate-pulse" />
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 bg-muted rounded-full animate-pulse" />
                    <div className="flex-1">
                      <div className="h-4 w-24 bg-muted rounded mb-2 animate-pulse" />
                      <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <div key={s} className="w-4 h-4 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (videoTestimonials.length === 0) {
    return (
      <section className="py-20 bg-gradient-to-b from-background to-background-alt">
        <div className="container-wide">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Play className="w-4 h-4" />
              Video Testimonials
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
              Hear From Our Clients
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Real stories from businesses transforming with alfred ai
            </p>
          </div>
          <div className="max-w-xl mx-auto text-center py-12 px-6 bg-card rounded-2xl border border-border">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Video testimonials coming soon</h3>
            <p className="text-muted-foreground mb-6">
              We're gathering inspiring stories from our clients. Check back soon to see their transformation journeys.
            </p>
            <Link to="/impact-studies/testimonials">
              <Button variant="outline">
                View Written Testimonials
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-20 pb-6 bg-gradient-to-b from-background to-background-alt">
      <div className="container-wide">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Play className="w-4 h-4" />
            Video Testimonials
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
            Hear From Our Clients
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Watch real business leaders share their transformation stories
          </p>
        </div>

        {/* Swipeable Carousel */}
        <div className="relative px-4 md:px-12">
          <Carousel
            setApi={setCarouselApi}
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {videoTestimonials.map((testimonial, index) => (
                <CarouselItem key={testimonial.id} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                  <VideoCard
                    testimonial={testimonial}
                    index={index}
                    onPlay={handlePlayVideo}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {/* Navigation Arrows */}
            <CarouselPrevious className="hidden md:flex -left-4 lg:-left-6 w-10 h-10 bg-background border-border hover:bg-primary hover:text-primary-foreground hover:border-primary" />
            <CarouselNext className="hidden md:flex -right-4 lg:-right-6 w-10 h-10 bg-background border-border hover:bg-primary hover:text-primary-foreground hover:border-primary" />
          </Carousel>

          {/* Dot Indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {videoTestimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => carouselApi?.scrollTo(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentIndex === index 
                    ? 'bg-primary w-6' 
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Swipe hint for mobile */}
          <p className="text-center text-xs text-muted-foreground mt-4 md:hidden">
            <ChevronLeft className="w-3 h-3 inline" /> Swipe to see more <ChevronRight className="w-3 h-3 inline" />
          </p>
        </div>

        {/* View All Link */}
        <div className="text-center mt-10 mb-8">
          <Link to="/impact-studies/testimonials">
            <Button variant="outline" size="lg" className="group">
              View All Testimonials
              <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Subtle transition to next section */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-border" />
          <div className="flex gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary/25 animate-pulse [animation-delay:0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse [animation-delay:0.6s]" />
          </div>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-border" />
        </div>
      </div>

      {/* Video Player Modal */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none backdrop-blur-xl">
          <DialogClose className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <X className="w-5 h-5 text-white" />
          </DialogClose>
          
          {selectedVideo && (
            <div className="w-full">
              <div className="aspect-video bg-black">
                {getFullEmbedUrl(selectedVideo.video_url || '') ? (
                  <iframe
                    src={getFullEmbedUrl(selectedVideo.video_url || '') || ''}
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
                      {selectedVideo.client_title}{selectedVideo.client_company && `, ${selectedVideo.client_company}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-primary" />
                    {selectedVideo.industry && (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {selectedVideo.industry}
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-4 text-muted-foreground italic">
                  "{selectedVideo.quote}"
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default VideoTestimonialsSection;