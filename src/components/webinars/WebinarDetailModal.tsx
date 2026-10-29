import { normalizeUrl } from "@/lib/siteConfig";
import { useState } from 'react';
import { WebinarRegisterDialog } from '@/components/webinars/WebinarRegisterDialog';
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  X, Calendar, Clock, User, Play, ExternalLink, 
  Video, CalendarPlus, Share2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DOMPurify from "dompurify";

interface WebinarEvent {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  event_date: string | null;
  event_type: string | null;
  featured_image_url: string | null;
  registration_url: string | null;
  presenter_name: string | null;
  presenter_title: string | null;
  presenter_image_url: string | null;
  video_url: string | null;
  join_url: string | null;
  is_featured: boolean;
  show_registration: boolean;
  slug?: string | null;
  created_at: string;
  published_at: string | null;
}

interface WebinarDetailModalProps {
  webinar: WebinarEvent | null;
  onClose: () => void;
  onAddToCalendar?: (webinar: WebinarEvent) => void;
}

const WebinarDetailModal = ({ webinar, onClose, onAddToCalendar }: WebinarDetailModalProps) => {
  // Above the `!webinar` guard on purpose: a hook after an early return runs on
  // some renders and not others, and React throws "rendered more hooks than
  // during the previous render" the moment the guard flips.
  const [registerOpen, setRegisterOpen] = useState(false);

  if (!webinar) return null;

  const now = new Date();
  const eventDate = webinar.event_date ? new Date(webinar.event_date) : null;
  const isPastEvent = eventDate ? eventDate < now : true;
  // The flag was declared on the row and then never read here, which is why
  // ~10 published webinars offered no way to sign up at all.
  const canRegister = webinar.show_registration && !isPastEvent;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Recorded Session';
    return new Date(dateStr).toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVideoEmbedUrl = (url: string | null) => {
    if (!url) return null;
    
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?\s]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    // Loom
    const loomMatch = url.match(/loom\.com\/share\/([^?]+)/);
    if (loomMatch) {
      return `https://www.loom.com/embed/${loomMatch[1]}`;
    }
    
    return url;
  };

  // Check if URL is a direct video file (for uploaded videos)
  const isDirectVideoFile = (url: string | null): boolean => {
    if (!url) return false;
    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
  };

  const embedUrl = getVideoEmbedUrl(webinar.video_url);

  const handleShare = () => {
    const shareUrl = normalizeUrl(window.location.href);
    if (navigator.share) {
      navigator.share({
        title: webinar.title,
        text: webinar.description || '',
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
    }
  };

  const sanitizedContent = webinar.content 
    ? DOMPurify.sanitize(webinar.content, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'a', 'blockquote'],
        ALLOWED_ATTR: ['href', 'target', 'rel']
      })
    : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-8 bg-background/80 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-4xl my-8 overflow-hidden"
        >
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
            <div className="flex items-center gap-3">
              {webinar.event_type && (
                <Badge className="bg-primary/10 text-primary border-primary/20 capitalize">
                  {webinar.event_type.replace('_', ' ')}
                </Badge>
              )}
              {isPastEvent && (
                <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">
                  Past Event
                </Badge>
              )}
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(webinar.event_date)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Video Player - supports embeds and direct video files */}
          {isDirectVideoFile(webinar.video_url) ? (
            <div className="aspect-video bg-black">
              <video
                src={webinar.video_url || ''}
                className="w-full h-full"
                controls
                autoPlay
                playsInline
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ) : embedUrl ? (
            <div className="aspect-video bg-muted">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={webinar.title}
              />
            </div>
          ) : webinar.featured_image_url ? (
            <div className="aspect-video relative bg-gradient-to-br from-primary/10 to-secondary/10">
              <img 
                src={webinar.featured_image_url} 
                alt={webinar.title}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <Video className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Video coming soon</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Video className="w-10 h-10 text-primary/60" />
                </div>
                <p className="text-sm text-muted-foreground">Recording not available</p>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6 md:p-8">
            {/* Title */}
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
              {webinar.title}
            </h2>

            {/* Presenter Info */}
            {webinar.presenter_name && (
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl mb-6">
                <Avatar className="h-14 w-14 border-2 border-primary/20">
                  <AvatarImage src={webinar.presenter_image_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {webinar.presenter_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{webinar.presenter_name}</p>
                  {webinar.presenter_title && (
                    <p className="text-sm text-muted-foreground">{webinar.presenter_title}</p>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {webinar.description && (
              <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                {webinar.description}
              </p>
            )}

            {/* Full Content */}
            {sanitizedContent && (
              <div 
                className="prose prose-sm max-w-none text-foreground mb-8
                  prose-headings:text-foreground prose-headings:font-semibold
                  prose-p:text-muted-foreground prose-p:leading-relaxed
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-foreground prose-strong:font-semibold
                  prose-ul:text-muted-foreground prose-ol:text-muted-foreground
                  prose-li:marker:text-primary"
                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              />
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
              {webinar.video_url && (
                <Button asChild className="bg-primary hover:bg-primary-hover">
                  <a href={webinar.video_url} target="_blank" rel="noopener noreferrer">
                    <Play className="w-4 h-4 mr-2" />
                    Watch Full Video
                  </a>
                </Button>
              )}
              {canRegister && (
                <Button
                  className={webinar.video_url ? undefined : 'bg-primary hover:bg-primary-hover'}
                  variant={webinar.video_url ? 'outline' : 'default'}
                  onClick={() => setRegisterOpen(true)}
                >
                  <CalendarPlus className="w-4 h-4 mr-2" />
                  Register
                </Button>
              )}
              {webinar.registration_url && (
                <Button asChild variant="outline">
                  <a href={webinar.registration_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Resources
                  </a>
                </Button>
              )}
              {onAddToCalendar && !isPastEvent && (
                <Button variant="outline" onClick={() => onAddToCalendar(webinar)}>
                  <CalendarPlus className="w-4 h-4 mr-2" />
                  Add to Calendar
                </Button>
              )}
              {isPastEvent && !webinar.video_url && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Clock className="w-4 h-4" />
                  This event has ended
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      <WebinarRegisterDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        webinar={{
          slug: webinar.slug ?? null,
          title: webinar.title,
          dateLabel: eventDate
            ? eventDate.toLocaleDateString('en-AU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : null,
          timeLabel: eventDate
            ? eventDate.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })
            : null,
        }}
      />
    </AnimatePresence>
  );
};

export default WebinarDetailModal;
