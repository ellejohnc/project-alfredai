import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  FolderOpen,
  Link2,
  Loader2,
  Download,
  AlertCircle,
  Sparkles,
  LogIn,
  CheckCircle2,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink?: string;
  iconLink?: string;
}

interface ImportedData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  tags: string[];
  category: string;
  featured_image_url: string;
}

interface GoogleDriveImporterProps {
  open: boolean;
  onClose: () => void;
  onImport: (data: ImportedData) => void;
}

const mimeIcons: Record<string, string> = {
  'application/vnd.google-apps.document': '📄',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'text/plain': '📃',
  'text/markdown': '📋',
  'application/pdf': '📕',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getMimeLabel(mimeType: string): string {
  if (mimeType.includes('google-apps.document')) return 'Google Doc';
  if (mimeType.includes('wordprocessingml')) return 'Word';
  if (mimeType === 'text/plain') return 'Text';
  if (mimeType === 'text/markdown') return 'Markdown';
  if (mimeType === 'application/pdf') return 'PDF';
  return 'File';
}

export function GoogleDriveImporter({ open, onClose, onImport }: GoogleDriveImporterProps) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importingFileId, setImportingFileId] = useState<string | null>(null);
  const [driveUrl, setDriveUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('browse');
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [needsConnection, setNeedsConnection] = useState(false);
  const navigate = useNavigate();

  // Check Google connection status when dialog opens
  const checkConnection = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('user_google_connections')
        .select('google_email')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!error && data) {
        setGoogleEmail(data.google_email);
        setNeedsConnection(false);
      } else {
        setGoogleEmail(null);
        setNeedsConnection(true);
      }
    } catch {
      // Silently fail, will show connect prompt
    }
  }, []);

  useEffect(() => {
    if (open) {
      checkConnection();
    }
  }, [open, checkConnection]);

  // Load files after connection check resolves
  useEffect(() => {
    if (open && googleEmail && files.length === 0) {
      loadFiles();
    }
  }, [open, googleEmail]);

  const handleGoToConnectors = () => {
    onClose();
    navigate('/admin/connectors');
  };

  const loadFiles = async () => {
    setIsLoadingFiles(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        throw new Error('You must be logged in to use Google Drive import');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-gdrive-doc?action=list`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        const baseError = errData.message || errData.error || 'Failed to load files';
        const message = response.status === 401
          ? 'Session expired or not authorized. Please sign in again, then retry.'
          : baseError;
        setError(message);
        toast.error(`${message} If it persists, email support with a screenshot and this page URL.`);
        return;
      }

      const result = await response.json();

      // Handle explicit backend statuses
      if (result.error === 'no_google_connection' || result.error === 'google_reconnect_needed') {
        setNeedsConnection(true);
        setGoogleEmail(null);
        if (result.error === 'google_reconnect_needed') {
          toast.warning('Your Google connection has expired. Please reconnect your account.');
        }
        return;
      }

      if (result.error === 'google_drive_api_disabled') {
        const details = result.activationUrl
          ? `${result.message} Open this URL to enable it: ${result.activationUrl}`
          : result.message;
        setError(details);
        toast.error(`${details} If it persists, email support with a screenshot and this page URL.`);
        return;
      }

      if (result.error) {
        setError(result.message || result.error);
        toast.error(`${result.message || result.error} If it persists, email support with a screenshot and this page URL.`);
        return;
      }

      setFiles(result.files || []);
      setNeedsConnection(false);
    } catch (err) {
      console.error('Failed to load Drive files:', err);
      setError(err.message || 'Failed to load files from Google Drive');
      toast.error(err.message || 'Failed to load Google Drive files. Please try again.');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const importFile = async (fileId: string, fromUrl?: string) => {
    setIsImporting(true);
    setImportingFileId(fileId);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        throw new Error('You must be logged in to use Google Drive import');
      }

      const params = new URLSearchParams({ action: 'fetch' });
      if (fromUrl) {
        params.set('url', fromUrl);
      } else {
        params.set('fileId', fileId);
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-gdrive-doc?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        const baseError = errData.error || 'Failed to import file';

        const message =
          response.status === 401
            ? 'Session expired or not authorized. Please sign in again, then retry.'
            : response.status === 404
              ? 'File not found. Make sure the document is accessible from your connected Google account.'
              : response.status === 403
                ? 'Access denied. Make sure this document is in your Google Drive or shared with you.'
                : baseError;

        setError(message);
        toast.error(`${message} If this persists, email support with screenshot + page URL.`);
        return;
      }

      const result = await response.json();
      if (result?.ok === false || result?.error) {
        const message = result?.error || 'Failed to import file';
        setError(message);
        toast.error(`${message} If this persists, email support with screenshot + page URL.`);
        return;
      }

      onImport({
        title: result.title || '',
        slug: result.slug || '',
        content: result.content || '',
        excerpt: result.excerpt || '',
        tags: result.tags || [],
        category: result.category || '',
        featured_image_url: result.featured_image_url || '',
      });

      toast.success(`"${result.title}" imported successfully! AI extracted metadata.`, {
        duration: 5000,
      });
      onClose();
    } catch (err) {
      console.error('Failed to import file:', err);
      setError(err.message || 'Failed to import file');
      toast.error(`Import failed: ${err.message}. Please try again or use a different file.`);
    } finally {
      setIsImporting(false);
      setImportingFileId(null);
    }
  };

  const handleUrlImport = () => {
    if (!driveUrl.trim()) {
      toast.error('Please enter a Google Drive URL');
      return;
    }

    const fileIdMatch =
      driveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      driveUrl.match(/\/document\/d\/([a-zA-Z0-9_-]+)/) ||
      driveUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);

    if (!fileIdMatch) {
      toast.error('Invalid Google Drive URL. Please paste a valid file link.');
      return;
    }

    importFile(fileIdMatch[1], driveUrl);
  };

  // Connection prompt component
  const ConnectionPrompt = () => (
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
          You need to connect your Google account first to browse and import documents from Google Drive.
        </p>
      </div>
      <Button
        onClick={handleGoToConnectors}
        className="gap-2 min-w-[200px]"
        size="lg"
      >
        <Settings className="w-4 h-4" />
        Go to Connectors
      </Button>
      <p className="text-xs text-muted-foreground">
        Connect your Google account in <button className="underline font-medium" onClick={handleGoToConnectors}>Integrations → Connectors</button>, then come back here.
      </p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            Import from Google Drive
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1.5 text-sm">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            AI will auto-extract title, excerpt, tags, and category from your document
          </DialogDescription>
        </DialogHeader>

        {/* Connected account indicator */}
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
              onClick={() => { setFiles([]); loadFiles(); }}
              disabled={isLoadingFiles}
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isLoadingFiles ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <div className="text-sm text-destructive">
              <p>{error}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Next best step: reconnect your Google account or re-login. If this persists, email support with a screenshot and this page URL: {typeof window !== 'undefined' ? window.location.href : ''}
              </p>
              <a
                href={`mailto:support@alfredai.com?subject=Google Drive Import Error&body=${encodeURIComponent(`Error: ${error}\nPage URL: ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                className="mt-1 inline-block underline text-xs"
              >
                Email support
              </a>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Browse Drive
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Paste Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="flex-1 overflow-hidden mt-4">
            {needsConnection ? (
              <ConnectionPrompt />
            ) : isLoadingFiles ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading files from your Google Drive...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <FileText className="w-12 h-12 text-muted-foreground/40" />
                <div>
                  <p className="font-medium text-foreground">No documents found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    No supported documents found in your Google Drive, or use the Paste Link tab.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={loadFiles}>
                  Retry
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-3">
                <div className="space-y-2">
                  {files.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => importFile(file.id)}
                      disabled={isImporting}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <span className="text-2xl shrink-0">
                        {mimeIcons[file.mimeType] || '📄'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {file.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs">
                            {getMimeLabel(file.mimeType)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Modified {formatDate(file.modifiedTime)}
                          </span>
                        </div>
                      </div>
                      {importingFileId === file.id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
                      ) : (
                        <Download className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="url" className="mt-4">
            {needsConnection ? (
              <ConnectionPrompt />
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Paste a Google Drive document URL to import its content:
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://docs.google.com/document/d/..."
                      value={driveUrl}
                      onChange={(e) => setDriveUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUrlImport()}
                      disabled={isImporting}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleUrlImport}
                      disabled={isImporting || !driveUrl.trim()}
                      className="min-w-[100px]"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Importing
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Import
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg border border-border/50 space-y-2">
                  <p className="text-sm font-medium text-foreground">Supported URL formats:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Google Docs: <code className="text-xs bg-muted px-1 rounded">docs.google.com/document/d/...</code></li>
                    <li>• Drive file: <code className="text-xs bg-muted px-1 rounded">drive.google.com/file/d/...</code></li>
                    <li>• Share link: <code className="text-xs bg-muted px-1 rounded">drive.google.com/open?id=...</code></li>
                  </ul>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
