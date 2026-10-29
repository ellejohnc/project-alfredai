import { useState } from 'react';
import { DragScrollArea } from '@/components/ui/drag-scroll-area';
import { 
  FileText, 
  Video, 
  Upload, 
  Download, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  Loader2,
  Clock,
  AlertCircle,
  Eye,
  Play,
  Search,
  Link2,
  Filter,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAllDocuments, DocumentFilters } from '@/hooks/useAllDocuments';
import { StandaloneDocumentUploadDialog } from '@/components/admin/StandaloneDocumentUploadDialog';
import { TranscriptViewerModal } from '@/components/admin/TranscriptViewerModal';
import { VideoViewerModal } from '@/components/admin/VideoViewerModal';
import type { MeetingDocument } from '@/hooks/useMeetingDocuments';
import { MeetingNotesAnalysis } from '@/components/admin/MeetingNotesAnalysis';

export default function DocumentsAdmin() {
  const [filters, setFilters] = useState<DocumentFilters>({
    documentType: 'all',
    source: 'all',
    syncStatus: 'all',
    searchQuery: '',
  });
  
  const { 
    documents, 
    stats, 
    isLoading, 
    deleteDocument, 
    syncToGHL, 
    getSignedUrl, 
    getDocumentContent,
    refetch 
  } = useAllDocuments(filters);

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<MeetingDocument | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [viewingDocument, setViewingDocument] = useState<MeetingDocument | null>(null);
  const [viewingVideo, setViewingVideo] = useState<MeetingDocument | null>(null);
  const [searchInput, setSearchInput] = useState('');

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, searchQuery: searchInput }));
  };

  const handleDownload = async (doc: MeetingDocument) => {
    setDownloadingId(doc.id);
    try {
      const signedUrl = await getSignedUrl(doc.file_url);
      if (signedUrl) {
        window.open(signedUrl, '_blank');
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSync = async (doc: MeetingDocument) => {
    setSyncingId(doc.id);
    await syncToGHL(doc.id);
    setSyncingId(null);
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;
    await deleteDocument(documentToDelete.id);
    setDocumentToDelete(null);
  };

  const canViewInline = (doc: MeetingDocument) => {
    const textTypes = ['transcript', 'summary', 'notes'];
    const textMimeTypes = ['text/plain', 'text/markdown', 'application/json'];
    return textTypes.includes(doc.document_type) || 
           (doc.mime_type && textMimeTypes.some(mt => doc.mime_type?.includes(mt)));
  };

  const canPlayVideo = (doc: MeetingDocument) => {
    if (doc.document_type === 'recording') return true;
    const videoMimeTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    return doc.mime_type && videoMimeTypes.some(mt => doc.mime_type?.includes(mt));
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'recording':
        return <Video className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
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

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isUnmatched = (doc: MeetingDocument) => !doc.meeting_id || doc.meeting_type === 'pending_match';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-muted-foreground text-sm">Manage all meeting transcripts, recordings, and summaries</p>
        </div>
        <Button onClick={() => setShowUploadDialog(true)} className="gap-2 min-h-[44px]">
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* AI Analysis Panel */}
      <MeetingNotesAnalysis />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setFilters(prev => ({ ...prev, documentType: 'all', source: 'all', syncStatus: 'all' }))}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors border-blue-500/30 bg-blue-500/5" 
          onClick={() => setFilters(prev => ({ ...prev, documentType: 'transcript', source: 'google_drive', syncStatus: 'all' }))}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Gemini Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{stats.geminiNotes}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setFilters(prev => ({ ...prev, documentType: 'transcript', source: 'all' }))}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transcripts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.transcripts}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setFilters(prev => ({ ...prev, documentType: 'recording', source: 'all' }))}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recordings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.recordings}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setFilters(prev => ({ ...prev, syncStatus: 'synced', documentType: 'all', source: 'all' }))}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Synced</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{stats.synced}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setFilters(prev => ({ ...prev, syncStatus: 'not_synced', documentType: 'all', source: 'all' }))}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Not Synced</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{stats.total - stats.synced}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-amber-500/30" onClick={() => setFilters(prev => ({ ...prev, documentType: 'all', syncStatus: 'all', source: 'all' }))}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">Unmatched</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{stats.unmatched}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by file name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9 min-h-[44px]"
          />
        </div>
        <Select 
          value={filters.documentType} 
          onValueChange={(v) => setFilters(prev => ({ ...prev, documentType: v }))}
        >
          <SelectTrigger className="w-full sm:w-[150px] min-h-[44px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="transcript">Transcript</SelectItem>
            <SelectItem value="recording">Recording</SelectItem>
            <SelectItem value="summary">Summary</SelectItem>
            <SelectItem value="notes">Notes</SelectItem>
          </SelectContent>
        </Select>
        <Select 
          value={filters.source} 
          onValueChange={(v) => setFilters(prev => ({ ...prev, source: v }))}
        >
          <SelectTrigger className="w-full sm:w-[150px] min-h-[44px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="google_drive">Google Drive</SelectItem>
            <SelectItem value="ghl_direct">GHL Upload</SelectItem>
            <SelectItem value="manual_upload">Manual</SelectItem>
            <SelectItem value="fathom">Fathom</SelectItem>
            <SelectItem value="otter">Otter.ai</SelectItem>
          </SelectContent>
        </Select>
        <Select 
          value={filters.syncStatus} 
          onValueChange={(v) => setFilters(prev => ({ ...prev, syncStatus: v as 'all' | 'synced' | 'not_synced' }))}
        >
          <SelectTrigger className="w-full sm:w-[150px] min-h-[44px]">
            <SelectValue placeholder="Sync Status" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="synced">Synced</SelectItem>
            <SelectItem value="not_synced">Not Synced</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={refetch} className="min-h-[44px] min-w-[44px]">
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Document List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium mb-1">No documents found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {filters.searchQuery || filters.documentType !== 'all' || filters.source !== 'all' || filters.syncStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Upload your first document to get started'}
            </p>
            <Button onClick={() => setShowUploadDialog(true)} className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card key={doc.id} className={cn(isUnmatched(doc) && "border-amber-500/30 bg-amber-500/5")}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Icon & Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn(
                      "p-2 rounded-lg shrink-0",
                      doc.document_type === 'recording' ? "bg-red-500/10 text-red-600" :
                      doc.document_type === 'transcript' ? "bg-blue-500/10 text-blue-600" :
                      doc.document_type === 'summary' ? "bg-purple-500/10 text-purple-600" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {getDocumentIcon(doc.document_type)}
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <DragScrollArea showArrows={true} arrowSize="sm" alwaysShowArrows={false} showFadeGradient={true} className="w-full">
                        <p className="font-medium whitespace-nowrap pr-2">{doc.file_name}</p>
                      </DragScrollArea>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span className="capitalize">{doc.document_type}</span>
                        <span>•</span>
                        <span>{getSourceLabel(doc.source)}</span>
                        {doc.file_size_bytes && (
                          <>
                            <span>•</span>
                            <span>{formatFileSize(doc.file_size_bytes)}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {isUnmatched(doc) && (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
                        <Link2 className="h-3 w-3" />
                        Unmatched
                      </Badge>
                    )}
                    {doc.ghl_synced ? (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Synced
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
                        <Clock className="h-3 w-3" />
                        Not synced
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {canViewInline(doc) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 min-h-[44px]"
                        onClick={() => setViewingDocument(doc)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                    ) : canPlayVideo(doc) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 min-h-[44px] bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20"
                        onClick={() => setViewingVideo(doc)}
                      >
                        <Play className="h-4 w-4" />
                        <span className="hidden sm:inline">Play</span>
                      </Button>
                    ) : null}
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="min-h-[44px] min-w-[44px]"
                      onClick={() => handleDownload(doc)}
                      disabled={downloadingId === doc.id}
                      title="Download"
                    >
                      {downloadingId === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>

                    {!doc.ghl_synced && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="min-h-[44px] min-w-[44px] text-blue-600 hover:text-blue-700 hover:bg-blue-500/10"
                        onClick={() => handleSync(doc)}
                        disabled={syncingId === doc.id}
                        title="Sync to GHL"
                      >
                        {syncingId === doc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDocumentToDelete(doc)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <StandaloneDocumentUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onSuccess={refetch}
      />

      {/* Transcript Viewer */}
      <TranscriptViewerModal
        document={viewingDocument}
        open={!!viewingDocument}
        onOpenChange={(open) => !open && setViewingDocument(null)}
        getDocumentContent={getDocumentContent}
        getSignedUrl={getSignedUrl}
      />

      {/* Video Viewer */}
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
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.file_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-h-[44px]">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
