import { useState, useEffect, useRef } from 'react';
import { Download, X, Loader2, Video, Volume2, VolumeX, Maximize, Play, Pause } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { MeetingDocument } from '@/hooks/useMeetingDocuments';
import { cn } from '@/lib/utils';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface VideoViewerModalProps {
  document: MeetingDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  getSignedUrl: (path: string) => Promise<string | null>;
  initialTime?: number;
}

/**
 * Format seconds to display time (HH:MM:SS or MM:SS)
 */
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VideoViewerModal({
  document,
  open,
  onOpenChange,
  getSignedUrl,
  initialTime = 0,
}: VideoViewerModalProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when modal is open
  useBodyScrollLock(open);

  // Load video URL when document changes
  useEffect(() => {
    async function loadVideo() {
      if (!document || !open) {
        setVideoUrl(null);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const url = await getSignedUrl(document.file_url);
        if (url) {
          setVideoUrl(url);
        } else {
          setError('Failed to load video URL');
        }
      } catch (err) {
        console.error('Error loading video:', err);
        setError('Failed to load video');
        toast.error('Failed to load video');
      } finally {
        setIsLoading(false);
      }
    }

    loadVideo();
  }, [document, open, getSignedUrl]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setError(null);
    }
  }, [open]);

  // Handle initial time seek
  useEffect(() => {
    if (videoRef.current && initialTime > 0 && !isLoading && videoUrl) {
      videoRef.current.currentTime = initialTime;
    }
  }, [initialTime, isLoading, videoUrl]);

  const handleDownload = async () => {
    if (!document) return;
    
    setIsDownloading(true);
    try {
      const url = await getSignedUrl(document.file_url);
      if (url) {
        const a = window.document.createElement('a');
        a.href = url;
        a.download = document.file_name;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
      }
    } catch (err) {
      toast.error('Failed to download video');
    } finally {
      setIsDownloading(false);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (value: number[]) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    
    try {
      if (window.document.fullscreenElement) {
        await window.document.exitFullscreen();
      } else {
        await containerRef.current.requestFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'google_meet': return 'Google Meet';
      case 'fathom': return 'Fathom';
      case 'otter': return 'Otter.ai';
      case 'fireflies': return 'Fireflies';
      case 'manual_upload': return 'Manual Upload';
      default: return source;
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-4 pb-3 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 min-w-0 flex-1">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Video className="h-5 w-5 text-red-500" />
                <span className="truncate">{document?.file_name || 'Recording'}</span>
              </DialogTitle>
              
              {document && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 border-red-500/20">
                    Recording
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getSourceLabel(document.source)}
                  </Badge>
                  {document.file_size_bytes && (
                    <span>{formatFileSize(document.file_size_bytes)}</span>
                  )}
                  <span>
                    {format(new Date(document.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">Download</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Video Player */}
        <div ref={containerRef} className="flex-1 bg-black relative min-h-[300px]">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p className="text-sm">Loading video...</p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <Video className="h-8 w-8 mb-3 opacity-50" />
              <p className="text-sm">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Download Instead
              </Button>
            </div>
          ) : videoUrl ? (
            <>
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain max-h-[60vh]"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={() => {
                  if (videoRef.current) {
                    setCurrentTime(videoRef.current.currentTime);
                  }
                }}
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    setDuration(videoRef.current.duration);
                    if (initialTime > 0) {
                      videoRef.current.currentTime = initialTime;
                    }
                  }
                }}
                onError={(e) => {
                  console.error('Video error:', e);
                  setError('Failed to play video. Try downloading it instead.');
                }}
                onClick={togglePlay}
              />

              {/* Play overlay when paused */}
              {!isPlaying && (
                <button
                  className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity hover:bg-black/40"
                  onClick={togglePlay}
                >
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="h-8 w-8 text-black ml-1" />
                  </div>
                </button>
              )}

              {/* Custom Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-8">
                {/* Progress bar */}
                <div className="mb-3">
                  <Slider
                    value={[currentTime]}
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="cursor-pointer"
                  />
                </div>

                {/* Controls row */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-white hover:bg-white/20 min-h-[44px] touch-manipulation"
                      onClick={togglePlay}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4 ml-0.5" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-white hover:bg-white/20 min-h-[44px] touch-manipulation"
                      onClick={toggleMute}
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <span className="text-white text-xs font-mono">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-white hover:bg-white/20 min-h-[44px] touch-manipulation"
                    onClick={toggleFullscreen}
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer with keyboard hints */}
        <div className="p-3 border-t text-xs text-muted-foreground flex items-center justify-between gap-2 shrink-0 bg-muted/30">
          <div className="flex items-center gap-3">
            <span>Click video to play/pause</span>
          </div>
          <span>Esc Close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
