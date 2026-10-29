import { useState } from 'react';
import { toast } from 'sonner';
import { 
  FileText, 
  Video, 
  Download, 
  Upload, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  Loader2,
  File,
  Clock,
  AlertCircle,
  Eye,
  Play,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useMeetingDocuments, MeetingDocument } from '@/hooks/useMeetingDocuments';
import { DocumentUploadDialog } from './DocumentUploadDialog';
import { TranscriptViewerModal } from './TranscriptViewerModal';
import { VideoViewerModal } from './VideoViewerModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface MeetingDocumentsSectionProps {
  meetingId: string;
  meetingType: 'demo' | 'investor' | 'discovery' | 'solution' | 'personal';
  contactEmail?: string;
  contactName?: string;
}

export function MeetingDocumentsSection({ meetingId, meetingType, contactEmail }: MeetingDocumentsSectionProps) {
  const { 
    documents, 
    isLoading, 
    isUploading,
    isSyncing,
    hasTypeMismatch,
    uploadDocument, 
    syncToGHL, 
    deleteDocument,
    getSignedUrl,
    getDocumentContent
  } = useMeetingDocuments(meetingId, meetingType);
  
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<MeetingDocument | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [viewingDocument, setViewingDocument] = useState<MeetingDocument | null>(null);
  const [viewingVideo, setViewingVideo] = useState<MeetingDocument | null>(null);

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'recording':
        return <Video className="h-4 w-4" />;
      case 'transcript':
      case 'summary':
      case 'notes':
        return <FileText className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'transcript': return 'Transcript';
      case 'recording': return 'Recording';
      case 'summary': return 'Summary';
      case 'notes': return 'Notes';
      default: return type;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'google_meet': return 'Google Meet';
      case 'google_drive': return 'Google Drive';
      case 'ghl_direct': return 'GHL Upload';
      case 'fathom': return 'Fathom';
      case 'otter': return 'Otter.ai';
      case 'fireflies': return 'Fireflies';
      case 'manual_upload': return 'Manual';
      default: return source;
    }
  };

  // Get sync type badge info from ghl_sync_response
  const getSyncTypeBadge = (doc: MeetingDocument): { 
    label: string; 
    icon: 'file' | 'link' | 'download' | 'auto' | null;
    className: string;
  } | null => {
    const syncResponse = doc.ghl_sync_response as Record<string, unknown> | null;
    if (!syncResponse) return null;
    
    const syncType = syncResponse.sync_type as string | undefined;
    
    switch (syncType) {
      case 'file_attachment':
      case 'file_upload':
        return { 
          label: '📎 File synced', 
          icon: 'file',
          className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
        };
      case 'note_with_link':
        return { 
          label: '📝 Link synced', 
          icon: 'link',
          className: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
        };
      case 'ghl_direct_import':
        return { 
          label: '↓ From GHL', 
          icon: 'download',
          className: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
        };
      case 'auto_on_import':
        return { 
          label: 'Auto-synced', 
          icon: 'auto',
          className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
        };
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Get match confidence info from document metadata
  const getMatchConfidence = (doc: MeetingDocument): { level: 'high' | 'medium' | 'low' | null; method: string | null } => {
    const meta = doc.metadata as Record<string, unknown> | null;
    if (!meta) return { level: null, method: null };
    
    const confidence = meta.confidence as string | undefined;
    const matchMethod = meta.match_method as string | undefined;
    
    // Map confidence levels
    let level: 'high' | 'medium' | 'low' | null = null;
    if (confidence === 'high' || confidence === 'highest') {
      level = 'high';
    } else if (confidence === 'medium') {
      level = 'medium';
    } else if (confidence === 'low') {
      level = 'low';
    }
    
    // Format match method for display
    let method: string | null = null;
    if (matchMethod) {
      switch (matchMethod) {
        case 'meet_link':
          method = 'Meet link match';
          break;
        case 'email_time':
        case 'email_date':
          method = 'Email + time';
          break;
        case 'attendee_name_date':
          method = 'Name + date';
          break;
        case 'attachment_link_name':
          method = 'Attachment link + name';
          break;
        case 'company_time':
        case 'company_date':
          method = 'Company + time';
          break;
        case 'company_only':
        case 'company_name':
          method = 'Company name';
          break;
        case 'email_only':
        case 'recent_confirmed_email':
          method = 'Email only';
          break;
        case 'time_only':
        case 'time_proximity_only':
          method = 'Time proximity';
          break;
        case 'manual':
          method = 'Manual link';
          break;
        default:
          method = matchMethod.replace(/_/g, ' ');
      }
    }
    
    return { level, method };
  };

  const getConfidenceBadgeStyles = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'low':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
    }
  };

  const handleDownload = async (doc: MeetingDocument) => {
    setDownloadingId(doc.id);
    try {
      const signedUrl = await getSignedUrl(doc.file_url);
      if (signedUrl) {
        // Create a temporary link element to trigger proper download
        const link = document.createElement('a');
        link.href = signedUrl;
        link.download = doc.file_name;
        link.target = '_blank';
        // For cross-origin downloads, we need to fetch and create a blob
        try {
          const response = await fetch(signedUrl);
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          link.href = blobUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        } catch {
          // Fallback: open in new tab if blob download fails
          window.open(signedUrl, '_blank');
        }
      } else {
        toast.error('Failed to get download URL');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;
    await deleteDocument(documentToDelete.id);
    setDocumentToDelete(null);
  };

  // Check if document can be viewed inline (text-based documents)
  const canViewInline = (doc: MeetingDocument) => {
    const textTypes = ['transcript', 'summary', 'notes'];
    const textMimeTypes = ['text/plain', 'text/markdown', 'application/json'];
    return textTypes.includes(doc.document_type) || 
           (doc.mime_type && textMimeTypes.some(mt => doc.mime_type?.includes(mt)));
  };

  // Check if document is a video that can be played
  const canPlayVideo = (doc: MeetingDocument) => {
    if (doc.document_type === 'recording') return true;
    const videoMimeTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    return doc.mime_type && videoMimeTypes.some(mt => doc.mime_type?.includes(mt));
  };

  // Group documents by type
  const transcripts = documents.filter(d => d.document_type === 'transcript');
  const recordings = documents.filter(d => d.document_type === 'recording');
  const summaries = documents.filter(d => d.document_type === 'summary');
  const notes = documents.filter(d => d.document_type === 'notes');

  // Get the first recording to associate with transcripts for timestamp navigation
  const associatedRecording = recordings.length > 0 ? recordings[0] : null;

  const renderDocumentCard = (doc: MeetingDocument) => (
    <div
      key={doc.id}
      className="p-3 bg-muted/50 rounded-lg border border-border/50 space-y-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <div className={cn(
            "p-1.5 rounded-md shrink-0",
            doc.document_type === 'recording' ? "bg-red-500/10 text-red-600" :
            doc.document_type === 'transcript' ? "bg-blue-500/10 text-blue-600" :
            doc.document_type === 'summary' ? "bg-purple-500/10 text-purple-600" :
            "bg-muted text-muted-foreground"
          )}>
            {getDocumentIcon(doc.document_type)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{doc.file_name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>{getSourceLabel(doc.source)}</span>
              {doc.file_size_bytes && (
                <>
                  <span>•</span>
                  <span>{formatFileSize(doc.file_size_bytes)}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Badges row: Sync status + Match confidence */}
        <div className="shrink-0 flex items-center gap-1.5">
          {/* Match confidence badge */}
          {(() => {
            const { level, method } = getMatchConfidence(doc);
            if (!level) return null;
            return (
              <Badge 
                variant="outline" 
                className={cn("text-xs gap-1", getConfidenceBadgeStyles(level))}
                title={method ? `Matched via: ${method}` : undefined}
              >
                <Sparkles className="h-3 w-3" />
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Badge>
            );
          })()}
          
          {/* Sync status with type-specific badges */}
          {doc.ghl_synced ? (
            (() => {
              const syncBadge = getSyncTypeBadge(doc);
              if (syncBadge) {
                return (
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs gap-1", syncBadge.className)}
                    title={`Sync type: ${(doc.ghl_sync_response as Record<string, unknown>)?.sync_type || 'synced'}`}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {syncBadge.label}
                  </Badge>
                );
              }
              // Fallback for older synced documents
              return (
                <Badge 
                  variant="outline" 
                  className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"
                  title="Synced to GHL"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Synced
                </Badge>
              );
            })()
          ) : (doc.ghl_sync_response as Record<string, unknown>)?.sync_type === 'auto_on_import_failed' ? (
            <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 border-red-500/20 gap-1">
              <AlertCircle className="h-3 w-3" />
              Sync failed
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
              <Clock className="h-3 w-3" />
              Not synced
            </Badge>
          )}
        </div>
      </div>
      {/* Created date */}
      <div className="text-xs text-muted-foreground">
        Uploaded {format(new Date(doc.created_at), 'MMM d, yyyy h:mm a')}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 flex-wrap">
        {/* View/Play button based on document type */}
        {canViewInline(doc) ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 min-h-[44px] touch-manipulation"
            onClick={() => setViewingDocument(doc)}
          >
            <Eye className="h-3 w-3" />
            View
          </Button>
        ) : canPlayVideo(doc) ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 min-h-[44px] touch-manipulation bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20"
            onClick={() => setViewingVideo(doc)}
          >
            <Play className="h-3 w-3" />
            Play
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 min-h-[44px] touch-manipulation"
            onClick={() => handleDownload(doc)}
            disabled={downloadingId === doc.id}
          >
            {downloadingId === doc.id ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
            Download
          </Button>
        )}
        
        {/* Download button for viewable documents (they have both view/play and download) */}
        {(canViewInline(doc) || canPlayVideo(doc)) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 min-h-[44px] touch-manipulation"
            onClick={() => handleDownload(doc)}
            disabled={downloadingId === doc.id}
            title="Download"
          >
            {downloadingId === doc.id ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
          </Button>
        )}
        
        {!doc.ghl_synced && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5 bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20"
            onClick={() => syncToGHL(doc.id, contactEmail)}
            disabled={isSyncing === doc.id}
          >
            {isSyncing === doc.id ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            Sync to GHL
          </Button>
        )}

        {doc.ghl_synced && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => syncToGHL(doc.id, contactEmail)}
            disabled={isSyncing === doc.id}
          >
            {isSyncing === doc.id ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            Re-sync
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 min-h-[44px] touch-manipulation text-red-500 hover:text-red-600 hover:bg-red-500/10 ml-auto"
          onClick={() => setDocumentToDelete(doc)}
          title="Delete"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Sync error message */}
      {doc.ghl_sync_response && !doc.ghl_synced && (doc.ghl_sync_response as Record<string, unknown>)?.error && (
        <div className="flex items-start gap-2 p-2 bg-red-500/5 border border-red-500/20 rounded text-xs text-red-600">
          <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
          <span>Sync failed: {JSON.stringify((doc.ghl_sync_response as Record<string, unknown>).error)}</span>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading documents...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 bg-slate-500/5 border border-slate-500/20 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4" />
            Documents & Recordings
          </Label>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => setShowUploadDialog(true)}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Upload className="h-3 w-3" />
            )}
            Upload
          </Button>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No documents uploaded yet</p>
            <p className="text-xs mt-1">Upload transcripts, recordings, or summaries from your meetings</p>

            <div className="mt-3 text-xs">
              <a
                className="underline underline-offset-4 text-primary"
                href={`mailto:support@alfredai.bot?subject=${encodeURIComponent('Meeting transcript not showing')}&body=${encodeURIComponent(`Hi team,\n\nI linked a transcript but it did not appear under Documents & Recordings.\n\nPage URL: ${window.location.href}\nMeeting ID: ${meetingId}\n\nPlease attach a screenshot of the page.\n`)}`}
              >
                Email support (attach a screenshot)
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {hasTypeMismatch && (
              <div className="flex items-start gap-2 p-2 rounded-md border border-border bg-muted/40 text-xs text-muted-foreground">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  We found documents for this meeting, but their stored type doesn’t match this meeting. They’re still shown here.
                </span>
              </div>
            )}
            {/* Transcripts */}
            {transcripts.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Transcripts</Label>
                {transcripts.map(renderDocumentCard)}
              </div>
            )}

            {/* Recordings */}
            {recordings.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Recordings</Label>
                {recordings.map(renderDocumentCard)}
              </div>
            )}

            {/* Summaries */}
            {summaries.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Summaries</Label>
                {summaries.map(renderDocumentCard)}
              </div>
            )}

            {/* Notes */}
            {notes.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Notes</Label>
                {notes.map(renderDocumentCard)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <DocumentUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        meetingId={meetingId}
        meetingType={meetingType}
        onUpload={uploadDocument}
        isUploading={isUploading}
      />

      {/* Transcript Viewer Modal */}
      <TranscriptViewerModal
        document={viewingDocument}
        open={!!viewingDocument}
        onOpenChange={(open) => !open && setViewingDocument(null)}
        getDocumentContent={getDocumentContent}
        getSignedUrl={getSignedUrl}
        associatedRecording={associatedRecording}
      />

      {/* Video Viewer Modal */}
      <VideoViewerModal
        document={viewingVideo}
        open={!!viewingVideo}
        onOpenChange={(open) => !open && setViewingVideo(null)}
        getSignedUrl={getSignedUrl}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!documentToDelete} onOpenChange={(open) => !open && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{documentToDelete?.file_name}" from storage.
              {documentToDelete?.ghl_synced && " Note: This won't remove it from GHL."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
