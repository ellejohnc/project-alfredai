import { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Video, 
  X, 
  Loader2,
  AlertCircle 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  meetingType: 'demo' | 'investor' | 'discovery' | 'solution' | 'personal';
  onUpload: (params: {
    meeting_id: string;
    meeting_type: 'demo' | 'investor' | 'discovery' | 'solution' | 'personal';
    document_type: 'transcript' | 'recording' | 'summary' | 'notes';
    source: 'google_meet' | 'fathom' | 'otter' | 'fireflies' | 'manual_upload';
    file: File;
    metadata?: Record<string, unknown>;
  }) => Promise<boolean>;
  isUploading: boolean;
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

export function DocumentUploadDialog({ 
  open, 
  onOpenChange, 
  meetingId, 
  meetingType,
  onUpload, 
  isUploading 
}: DocumentUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<'transcript' | 'recording' | 'summary' | 'notes'>('transcript');
  const [source, setSource] = useState<'google_meet' | 'fathom' | 'otter' | 'fireflies' | 'manual_upload'>('manual_upload');
  const [syncToGHL, setSyncToGHL] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setSelectedFile(null);
    setDocumentType('transcript');
    setSource('manual_upload');
    setSyncToGHL(false);
    setError(null);
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
      // Check file name for hints
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

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    const success = await onUpload({
      meeting_id: meetingId,
      meeting_type: meetingType,
      document_type: documentType,
      source,
      file: selectedFile,
      metadata: {
        sync_to_ghl_requested: syncToGHL,
      },
    });
    
    if (success) {
      handleClose();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Document
          </DialogTitle>
          <DialogDescription>
            Upload a transcript, recording, or summary for this meeting.
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
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-600">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Document Type */}
          <div className="space-y-2">
            <Label className="text-sm">Document Type</Label>
            <Select value={documentType} onValueChange={(v) => setDocumentType(v as typeof documentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google_meet">Google Meet</SelectItem>
                <SelectItem value="fathom">Fathom</SelectItem>
                <SelectItem value="otter">Otter.ai</SelectItem>
                <SelectItem value="fireflies">Fireflies</SelectItem>
                <SelectItem value="manual_upload">Manual Upload</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sync to GHL Option */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="sync-ghl"
              checked={syncToGHL}
              onCheckedChange={(checked) => setSyncToGHL(checked === true)}
            />
            <Label htmlFor="sync-ghl" className="text-sm cursor-pointer">
              Sync to GHL after upload
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || isUploading || !!error}
            className="gap-2"
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
