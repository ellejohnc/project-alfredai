import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, FileText, Loader2, Check, X, AlertCircle, 
  FolderUp, Link2, Sparkles, Wand2 
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Guide {
  id: string;
  title: string;
  file_url: string | null;
  category?: string | null;
}

type ContentType = 'guide' | 'playbook' | 'unknown';

interface UploadedFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
  assignedGuideId?: string;
  suggestedGuideId?: string;
  matchScore?: number;
  detectedType?: ContentType;
}

interface BulkPdfUploadProps {
  guides: Guide[];
  onComplete: () => void;
  onClose: () => void;
}

// Detect if content is a guide or playbook based on text
function detectContentType(text: string): ContentType {
  const lowerText = text.toLowerCase();
  
  // Keywords that indicate playbook
  const playbookKeywords = ['playbook', 'play-book', 'play book', 'handbook', 'manual', 'checklist', 'toolkit', 'starter kit', 'blueprint'];
  
  // Keywords that indicate guide
  const guideKeywords = ['guide', 'tutorial', 'how-to', 'how to', 'walkthrough', 'introduction', 'getting started', 'overview', 'primer', 'fundamentals'];
  
  const isPlaybook = playbookKeywords.some(kw => lowerText.includes(kw));
  const isGuide = guideKeywords.some(kw => lowerText.includes(kw));
  
  if (isPlaybook && !isGuide) return 'playbook';
  if (isGuide && !isPlaybook) return 'guide';
  if (isPlaybook && isGuide) {
    // If both match, prioritize playbook as it's more specific
    return 'playbook';
  }
  
  return 'unknown';
}

// Helper function to calculate similarity between two strings
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(' ').filter(Boolean);
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(' ').filter(Boolean);
  
  if (s1.length === 0 || s2.length === 0) return 0;
  
  let matches = 0;
  for (const word1 of s1) {
    for (const word2 of s2) {
      // Exact match or partial match (one contains the other)
      if (word1 === word2) {
        matches += 2;
      } else if (word1.length > 3 && word2.length > 3 && (word1.includes(word2) || word2.includes(word1))) {
        matches += 1;
      }
    }
  }
  
  return matches / Math.max(s1.length, s2.length);
}

// Find best matching guide for a filename
function findBestMatch(filename: string, guides: Guide[]): { guideId: string; score: number } | null {
  const cleanFilename = filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
  
  let bestMatch: { guideId: string; score: number } | null = null;
  
  for (const guide of guides) {
    if (guide.file_url) continue; // Skip guides that already have PDFs
    
    const score = calculateSimilarity(cleanFilename, guide.title);
    
    if (score > 0.5 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { guideId: guide.id, score };
    }
  }
  
  return bestMatch;
}

export function BulkPdfUpload({ guides, onComplete, onClose }: BulkPdfUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedAssignments, setSelectedAssignments] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const guidesWithoutPdf = useMemo(() => guides.filter(g => !g.file_url), [guides]);

  // Auto-suggest matches when files are added
  const suggestMatches = (files: UploadedFile[]): UploadedFile[] => {
    return files.map(uploadedFile => {
      if (uploadedFile.suggestedGuideId) return uploadedFile; // Already has suggestion
      
      const filename = uploadedFile.file.name;
      const detectedType = detectContentType(filename);
      const match = findBestMatch(filename, guides);
      
      return {
        ...uploadedFile,
        detectedType,
        suggestedGuideId: match?.guideId,
        matchScore: match?.score
      };
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const pdfFiles = files.filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    
    if (pdfFiles.length !== files.length) {
      toast.warning('Some files were skipped - only PDF files are allowed');
    }

    const newFiles: UploadedFile[] = pdfFiles.map(file => ({
      file,
      status: 'pending',
      detectedType: detectContentType(file.name)
    }));

    // Add suggestions for new files
    const filesWithSuggestions = suggestMatches(newFiles);
    
    // Auto-apply suggestions to selectedAssignments
    const newAssignments: Record<string, string> = { ...selectedAssignments };
    const currentLength = uploadedFiles.length;
    filesWithSuggestions.forEach((file, index) => {
      if (file.suggestedGuideId) {
        newAssignments[currentLength + index] = file.suggestedGuideId;
      }
    });
    setSelectedAssignments(newAssignments);

    setUploadedFiles(prev => [...prev, ...filesWithSuggestions]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    const matchedCount = filesWithSuggestions.filter(f => f.suggestedGuideId).length;
    if (matchedCount > 0) {
      toast.success(`Auto-matched ${matchedCount} file${matchedCount !== 1 ? 's' : ''} to guides based on filename`);
    }
  };

  const applyAllSuggestions = () => {
    const newAssignments: Record<string, string> = { ...selectedAssignments };
    uploadedFiles.forEach((file, index) => {
      if (file.suggestedGuideId && !file.assignedGuideId) {
        newAssignments[index] = file.suggestedGuideId;
      }
    });
    setSelectedAssignments(newAssignments);
    toast.success('Applied all suggested matches');
  };

  const uploadAllFiles = async () => {
    setIsUploading(true);
    setUploadProgress(0);

    const filesToUpload = uploadedFiles.filter(f => f.status === 'pending');
    let completed = 0;

    for (const uploadedFile of filesToUpload) {
      setUploadedFiles(prev => 
        prev.map(f => f.file === uploadedFile.file 
          ? { ...f, status: 'uploading' } 
          : f
        )
      );

      try {
        const fileExt = uploadedFile.file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `files/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('content-images')
          .upload(filePath, uploadedFile.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('content-images')
          .getPublicUrl(filePath);

        setUploadedFiles(prev => 
          prev.map(f => f.file === uploadedFile.file 
            ? { ...f, status: 'success', url: publicUrl } 
            : f
          )
        );
      } catch (error) {
        setUploadedFiles(prev => 
          prev.map(f => f.file === uploadedFile.file 
            ? { ...f, status: 'error', error: error.message } 
            : f
          )
        );
      }

      completed++;
      setUploadProgress((completed / filesToUpload.length) * 100);
    }

    setIsUploading(false);
    toast.success(`Uploaded ${completed} files`);
  };

  const handleAssignmentChange = (fileIndex: number, guideId: string) => {
    setSelectedAssignments(prev => ({
      ...prev,
      [fileIndex]: guideId
    }));
  };

  const assignFilesToGuides = async () => {
    setIsAssigning(true);
    let successCount = 0;

    for (const [fileIndexStr, guideId] of Object.entries(selectedAssignments)) {
      const fileIndex = parseInt(fileIndexStr);
      const uploadedFile = uploadedFiles[fileIndex];
      
      if (!uploadedFile?.url || !guideId) continue;

      try {
        // Build update data - include category if we detected a type and guide doesn't have one
        const guide = guides.find(g => g.id === guideId);
        const updateData: Record<string, unknown> = { file_url: uploadedFile.url };
        
        // Auto-set category based on detected type if guide has no category
        if (uploadedFile.detectedType && uploadedFile.detectedType !== 'unknown' && !guide?.category) {
          updateData.category = uploadedFile.detectedType === 'playbook' ? 'Playbook' : 'Implementation';
        }

        const { error } = await supabase
          .from('guides_playbooks')
          .update(updateData)
          .eq('id', guideId);

        if (error) throw error;
        successCount++;

        setUploadedFiles(prev => 
          prev.map((f, i) => i === fileIndex 
            ? { ...f, assignedGuideId: guideId } 
            : f
          )
        );
      } catch (error) {
        toast.error(`Failed to assign ${uploadedFile.file.name}: ${error.message}`);
      }
    }

    setIsAssigning(false);
    if (successCount > 0) {
      toast.success(`Assigned ${successCount} PDFs to guides`);
      onComplete();
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setSelectedAssignments(prev => {
      const newAssignments = { ...prev };
      delete newAssignments[index];
      return newAssignments;
    });
  };

  const successfulUploads = uploadedFiles.filter(f => f.status === 'success');
  const pendingUploads = uploadedFiles.filter(f => f.status === 'pending');

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Bulk PDF Upload</CardTitle>
            <CardDescription>
              Upload multiple PDFs and assign them to guides
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" aria-label="Close bulk upload" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Upload Files */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              1
            </div>
            <h3 className="font-semibold text-foreground">Select PDF Files</h3>
          </div>

          <div 
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <FolderUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-foreground font-medium mb-1">
              Drop PDF files here or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              Select multiple files at once
            </p>
          </div>

          {/* File List */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {uploadedFiles.map((uploadedFile, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {uploadedFile.file.name}
                      </p>
                      {uploadedFile.detectedType && uploadedFile.detectedType !== 'unknown' && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-1.5 py-0 ${
                            uploadedFile.detectedType === 'playbook' 
                              ? 'bg-purple-500/10 text-purple-600 border-purple-500/30' 
                              : 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                          }`}
                        >
                          {uploadedFile.detectedType === 'playbook' ? '📚 Playbook' : '📖 Guide'}
                        </Badge>
                      )}
                      {uploadedFile.suggestedGuideId && (
                        <Badge 
                          variant="outline" 
                          className="text-xs px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Matched
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                      {uploadedFile.suggestedGuideId && (
                        <span className="ml-2 text-emerald-600">
                          → {guides.find(g => g.id === uploadedFile.suggestedGuideId)?.title?.slice(0, 30)}...
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {uploadedFile.status === 'pending' && (
                      <span className="text-xs text-muted-foreground">Pending</span>
                    )}
                    {uploadedFile.status === 'uploading' && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    )}
                    {uploadedFile.status === 'success' && (
                      <Check className="w-4 h-4 text-emerald-500" />
                    )}
                    {uploadedFile.status === 'error' && (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Remove file"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-sm text-muted-foreground text-center">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}

          {/* Upload Button */}
          {pendingUploads.length > 0 && (
            <Button 
              onClick={uploadAllFiles} 
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Upload {pendingUploads.length} File{pendingUploads.length !== 1 ? 's' : ''}
            </Button>
          )}
        </div>

        {/* Step 2: Assign to Guides */}
        {successfulUploads.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                2
              </div>
              <h3 className="font-semibold text-foreground">Assign to Guides</h3>
            </div>

            {guidesWithoutPdf.length === 0 ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-sm text-amber-600">
                  All guides already have PDFs attached. You can still use the uploaded files by copying their URLs.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {successfulUploads.map((uploadedFile, fileIndex) => {
                  const actualIndex = uploadedFiles.findIndex(f => f === uploadedFile);
                  const isAssigned = uploadedFile.assignedGuideId;
                  
                  return (
                    <div 
                      key={fileIndex}
                      className={`p-4 rounded-lg border ${isAssigned ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-muted/50 border-border'}`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="font-medium text-foreground truncate">
                          {uploadedFile.file.name}
                        </span>
                        {isAssigned && (
                          <Check className="w-4 h-4 text-emerald-500 ml-auto" />
                        )}
                      </div>
                      
                      {!isAssigned && (
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">
                            Assign to guide:
                          </Label>
                          <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                            {guidesWithoutPdf.map(guide => (
                              <label 
                                key={guide.id}
                                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                                  selectedAssignments[actualIndex] === guide.id 
                                    ? 'bg-primary/10 border border-primary/30' 
                                    : 'hover:bg-muted border border-transparent'
                                }`}
                              >
                                <Checkbox
                                  checked={selectedAssignments[actualIndex] === guide.id}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      handleAssignmentChange(actualIndex, guide.id);
                                    } else {
                                      setSelectedAssignments(prev => {
                                        const newAssignments = { ...prev };
                                        delete newAssignments[actualIndex];
                                        return newAssignments;
                                      });
                                    }
                                  }}
                                />
                                <span className="text-sm text-foreground truncate">
                                  {guide.title}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Copy URL button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          navigator.clipboard.writeText(uploadedFile.url || '');
                          toast.success('URL copied to clipboard');
                        }}
                      >
                        <Link2 className="w-3 h-3 mr-1" />
                        Copy URL
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Assign Button */}
            {Object.keys(selectedAssignments).length > 0 && (
              <Button 
                onClick={assignFilesToGuides} 
                disabled={isAssigning}
                className="w-full"
              >
                {isAssigning ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4 mr-2" />
                )}
                Assign {Object.keys(selectedAssignments).length} PDF{Object.keys(selectedAssignments).length !== 1 ? 's' : ''} to Guides
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
