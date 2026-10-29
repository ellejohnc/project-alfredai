import { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Video, 
  X, 
  Loader2,
  AlertCircle,
  Search
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StandaloneDocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface MeetingOption {
  id: string;
  type: 'demo' | 'investor';
  label: string;
  email: string;
}

const ALLOWED_MIME_TYPES = [
  'text/plain',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'audio/mpeg',
  'audio/wav',
  'audio/mp4',
  'video/mp4',
  'video/webm',
  'application/json',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function StandaloneDocumentUploadDialog({ 
  open, 
  onOpenChange,
  onSuccess
}: StandaloneDocumentUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<'transcript' | 'recording' | 'summary' | 'notes'>('transcript');
  const [source, setSource] = useState<'google_meet' | 'fathom' | 'otter' | 'fireflies' | 'manual_upload'>('manual_upload');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Meeting linking
  const [searchQuery, setSearchQuery] = useState('');
  const [meetings, setMeetings] = useState<MeetingOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingOption | null>(null);

  const resetForm = useCallback(() => {
    setSelectedFile(null);
    setDocumentType('transcript');
    setSource('manual_upload');
    setError(null);
    setSearchQuery('');
    setMeetings([]);
    setSelectedMeeting(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File is too large. Maximum size is 50MB, your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`;
    }
    
    if (!ALLOWED_MIME_TYPES.includes(file.type) && !file.type.startsWith('text/')) {
      return `File type "${file.type}" is not supported. Allowed types: PDF, DOC, DOCX, TXT, MP3, WAV, MP4, WebM`;
    }
    
    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }
    
    setError(null);
    setSelectedFile(file);
    
    // Auto-detect document type from file
    if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
      setDocumentType('recording');
    } else {
      const lowerName = file.name.toLowerCase();
      if (lowerName.includes('transcript')) {
        setDocumentType('transcript');
      } else if (lowerName.includes('summary')) {
        setDocumentType('summary');
      } else if (lowerName.includes('notes')) {
        setDocumentType('notes');
      }
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const searchMeetings = async (query: string) => {
    if (!query || query.length < 2) {
      setMeetings([]);
      return;
    }

    setIsSearching(true);
    try {
      // Search both ghl_submissions and investor_leads
      const [ghlRes, investorRes] = await Promise.all([
        supabase
          .from('ghl_submissions')
          .select('id, lead_email, lead_name, lead_company')
          .or(`lead_email.ilike.%${query}%,lead_name.ilike.%${query}%,lead_company.ilike.%${query}%`)
          .limit(5),
        supabase
          .from('investor_leads')
          .select('id, email, full_name, firm_name')
          .or(`email.ilike.%${query}%,full_name.ilike.%${query}%,firm_name.ilike.%${query}%`)
          .limit(5),
      ]);

      const options: MeetingOption[] = [];

      if (ghlRes.data) {
        ghlRes.data.forEach(sub => {
          options.push({
            id: sub.id,
            type: 'demo',
            label: sub.lead_company || sub.lead_name || sub.lead_email,
            email: sub.lead_email,
          });
        });
      }

      if (investorRes.data) {
        investorRes.data.forEach(lead => {
          options.push({
            id: lead.id,
            type: 'investor',
            label: `${lead.full_name} (${lead.firm_name})`,
            email: lead.email,
          });
        });
      }

      setMeetings(options);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    try {
      // Convert file to base64
      const arrayBuffer = await selectedFile.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to upload documents');
        return;
      }

      const response = await supabase.functions.invoke('upload-meeting-document', {
        body: {
          meeting_id: selectedMeeting?.id || null,
          meeting_type: selectedMeeting?.type || 'pending_match',
          document_type: documentType,
          source,
          file_name: selectedFile.name,
          file_base64: base64,
          mime_type: selectedFile.type || 'application/octet-stream',
          metadata: {
            standalone_upload: true,
            linked_at_upload: !!selectedMeeting,
          },
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Upload failed');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Upload failed');
      }

      toast.success(selectedMeeting 
        ? `Document uploaded and linked to ${selectedMeeting.label}`
        : 'Document uploaded (unlinked - can be linked later)'
      );
      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Document
          </DialogTitle>
          <DialogDescription>
            Upload a transcript, recording, or summary. Optionally link it to a meeting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* File Drop Zone */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground",
              selectedFile && "border-emerald-500 bg-emerald-500/5"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".txt,.pdf,.doc,.docx,.mp3,.wav,.mp4,.webm,.json"
              onChange={handleFileInputChange}
            />
            
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                {selectedFile.type.startsWith('video/') || selectedFile.type.startsWith('audio/') ? (
                  <Video className="h-8 w-8 text-emerald-500" />
                ) : (
                  <FileText className="h-8 w-8 text-emerald-500" />
                )}
                <div className="text-left">
                  <p className="font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setError(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Drag & drop a file here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, DOC, TXT, MP3, WAV, MP4 (max 50MB)
                </p>
              </>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Document Type */}
          <div className="space-y-2">
            <Label className="text-sm">Document Type</Label>
            <Select value={documentType} onValueChange={(v) => setDocumentType(v as typeof documentType)}>
              <SelectTrigger className="min-h-[44px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="transcript">Transcript</SelectItem>
                <SelectItem value="recording">Recording</SelectItem>
                <SelectItem value="summary">Summary</SelectItem>
                <SelectItem value="notes">Notes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label className="text-sm">Source</Label>
            <Select value={source} onValueChange={(v) => setSource(v as typeof source)}>
              <SelectTrigger className="min-h-[44px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="google_meet">Google Meet</SelectItem>
                <SelectItem value="fathom">Fathom</SelectItem>
                <SelectItem value="otter">Otter.ai</SelectItem>
                <SelectItem value="fireflies">Fireflies</SelectItem>
                <SelectItem value="manual_upload">Manual Upload</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Meeting Link (Optional) */}
          <div className="space-y-2">
            <Label className="text-sm">Link to Meeting (Optional)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or company..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchMeetings(e.target.value);
                }}
                className="pl-9 min-h-[44px]"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            
            {/* Search Results */}
            {meetings.length > 0 && !selectedMeeting && (
              <div className="border rounded-lg divide-y max-h-40 overflow-y-auto bg-background">
                {meetings.map((meeting) => (
                  <button
                    key={`${meeting.type}-${meeting.id}`}
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors min-h-[44px] touch-manipulation"
                    onClick={() => {
                      setSelectedMeeting(meeting);
                      setSearchQuery('');
                      setMeetings([]);
                    }}
                  >
                    <p className="text-sm font-medium">{meeting.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {meeting.type === 'demo' ? 'Demo Meeting' : 'Investor Meeting'} • {meeting.email}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Meeting */}
            {selectedMeeting && (
              <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{selectedMeeting.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedMeeting.type === 'demo' ? 'Demo Meeting' : 'Investor Meeting'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 min-h-[44px] touch-manipulation"
                  onClick={() => setSelectedMeeting(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {!selectedMeeting && searchQuery.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Leave empty to upload as unlinked. You can link it to a meeting later.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={isUploading}
            className="min-h-[44px]"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || isUploading || !!error}
            className="gap-2 min-h-[44px]"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
