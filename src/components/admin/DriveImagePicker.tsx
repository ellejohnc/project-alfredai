import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Image,
  Loader2,
  Upload,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Settings,
  Download,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface DriveImage {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  thumbnailLink?: string;
  size?: number;
}

interface DriveImagePickerProps {
  open: boolean;
  onClose: () => void;
  /** Called when an image is selected and uploaded. Receives the public storage URL. */
  onSelect: (imageUrl: string, fileName: string) => void;
  /** Optional title override */
  title?: string;
}

function formatSize(bytes?: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DriveImagePicker({ open, onClose, onSelect, title }: DriveImagePickerProps) {
  const [images, setImages] = useState<DriveImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [needsConnection, setNeedsConnection] = useState(false);
  const navigate = useNavigate();

  const checkConnection = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from('user_google_connections')
        .select('google_email')
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (data) {
        setGoogleEmail(data.google_email);
        setNeedsConnection(false);
      } else {
        setGoogleEmail(null);
        setNeedsConnection(true);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (open) {
      checkConnection();
    }
  }, [open, checkConnection]);

  useEffect(() => {
    if (open && googleEmail && images.length === 0) {
      loadImages();
    }
  }, [open, googleEmail]);

  const loadImages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('You must be logged in');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/drive-images?action=list`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!res.ok) {
        setError('Could not reach Google Drive. Please try again shortly, or email support@alfredai.bot with a screenshot and this page URL.');
        return;
      }

      const result = await res.json();
      if (result.error === 'no_google_connection') {
        setNeedsConnection(true);
        setGoogleEmail(null);
        return;
      }
      if (result.error) {
        setError(result.message || 'Could not load Google Drive images. Please try again, or email support@alfredai.bot with a screenshot and this page URL.');
        setImages(result.files || []);
        return;
      }


      setImages(result.files || []);
    } catch (err) {
      setError(err.message || 'Failed to load images');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = async (image: DriveImage) => {
    setIsUploading(true);
    setUploadingId(image.id);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('You must be logged in');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/drive-images?action=upload-to-storage`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fileId: image.id, fileName: image.name }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to upload image');
      }

      const result = await res.json();
      if (result.error) throw new Error(result.error);

      onSelect(result.publicUrl, image.name);
      toast.success(`"${image.name}" uploaded to storage successfully!`);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to upload image');
      toast.error(`Upload failed: ${err.message}. If this persists, email support with screenshot + page URL.`);
    } finally {
      setIsUploading(false);
      setUploadingId(null);
    }
  };

  const handleGoToConnectors = () => {
    onClose();
    navigate('/admin/connectors');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            {title || 'Pick Image from Google Drive'}
          </DialogTitle>
          <DialogDescription>
            Select an image to upload it to your storage for reliable hosting
          </DialogDescription>
        </DialogHeader>

        {googleEmail && (
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border/50">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            <span className="text-sm text-muted-foreground">
              Connected as <span className="font-medium text-foreground">{googleEmail}</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7 px-2 text-xs"
              onClick={() => { setImages([]); loadImages(); }}
              disabled={isLoading}
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <div className="text-sm text-destructive">
              <p>{error}</p>
              <a
                href={`mailto:support@alfredai.com?subject=Drive Image Error&body=${encodeURIComponent(`Error: ${error}\nPage: ${window.location.href}`)}`}
                className="mt-1 inline-block underline text-xs"
              >
                Email support
              </a>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          {needsConnection ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4 text-center px-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Google Account Required</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Connect your Google account first to browse images from Google Drive.
                </p>
              </div>
              <Button onClick={handleGoToConnectors} className="gap-2 min-w-[200px]" size="lg">
                <Settings className="w-4 h-4" />
                Go to Connectors
              </Button>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading images from Google Drive...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <Image className="w-12 h-12 text-muted-foreground/40" />
              <div>
                <p className="font-medium text-foreground">No images found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No image files found in your Google Drive.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={loadImages}>Retry</Button>
            </div>
          ) : (
            <ScrollArea className="h-[450px] pr-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => handleSelect(img)}
                    disabled={isUploading}
                    className="group relative flex flex-col rounded-lg border border-border/50 hover:border-primary/40 hover:shadow-md transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                      {img.thumbnailLink ? (
                        <img
                          src={img.thumbnailLink.replace(/=s\d+/, '=s400')}
                          alt={img.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      ) : (
                        <Image className="w-8 h-8 text-muted-foreground/40" />
                      )}
                      {uploadingId === img.id && (
                        <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Upload className="w-6 h-6 text-primary drop-shadow-lg" />
                      </div>
                    </div>
                    <div className="p-2 text-left">
                      <p className="text-xs font-medium text-foreground truncate">{img.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{formatDate(img.modifiedTime)}</span>
                        {img.size && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{formatSize(img.size)}</Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
