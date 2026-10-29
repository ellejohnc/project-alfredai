import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Download, Copy, Check, Loader2, FileText, Clock, User, Search, X, ChevronUp, ChevronDown, Play, Video } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { MeetingDocument } from '@/hooks/useMeetingDocuments';
import { cn } from '@/lib/utils';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface TranscriptViewerModalProps {
  document: MeetingDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  getDocumentContent: (doc: MeetingDocument) => Promise<string | null>;
  getSignedUrl: (path: string) => Promise<string | null>;
  /** Associated recording document for timestamp navigation */
  associatedRecording?: MeetingDocument | null;
  /** Callback when a timestamp is clicked */
  onTimestampClick?: (seconds: number) => void;
}

interface ParsedLine {
  index: number;
  type: 'speaker' | 'text' | 'empty';
  speaker?: string;
  text: string;
  originalLine: string;
  timestamp?: { raw: string; seconds: number };
}

// Regex patterns for various timestamp formats
const TIMESTAMP_PATTERNS = [
  // [00:05:23] or (00:05:23) - bracketed with hours
  /[[(](\d{1,2}):(\d{2}):(\d{2})[\])]/,
  // [05:23] or (05:23) - bracketed without hours
  /[[(](\d{1,2}):(\d{2})[\])]/,
  // 00:05:23 - plain with hours
  /(?:^|\s)(\d{1,2}):(\d{2}):(\d{2})(?:\s|$|:)/,
  // 05:23 - plain without hours (at start of line or after speaker)
  /(?:^|\s|:)(\d{1,2}):(\d{2})(?:\s|$)/,
];

/**
 * Parse a timestamp string and return total seconds
 */
function parseTimestamp(timestampStr: string): { raw: string; seconds: number } | null {
  // Try each pattern
  for (const pattern of TIMESTAMP_PATTERNS) {
    const match = timestampStr.match(pattern);
    if (match) {
      const parts = match.slice(1).map(Number);
      let seconds: number;
      
      if (parts.length === 3) {
        // HH:MM:SS
        seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2) {
        // MM:SS
        seconds = parts[0] * 60 + parts[1];
      } else {
        continue;
      }
      
      return { raw: match[0].trim(), seconds };
    }
  }
  return null;
}

/**
 * Extract timestamp from a line of text
 */
function extractTimestamp(line: string): { raw: string; seconds: number } | null {
  for (const pattern of TIMESTAMP_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      return parseTimestamp(match[0]);
    }
  }
  return null;
}

/**
 * Format seconds to display time (HH:MM:SS or MM:SS)
 */
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function TranscriptViewerModal({
  document,
  open,
  onOpenChange,
  getDocumentContent,
  getSignedUrl,
  associatedRecording,
  onTimestampClick,
}: TranscriptViewerModalProps) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Speaker navigation state
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(-1);
  
  // Video player state
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoStartTime, setVideoStartTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Refs
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Lock body scroll when modal is open
  useBodyScrollLock(open);

  // Parse content into structured lines with timestamps
  const parsedLines = useMemo((): ParsedLine[] => {
    if (!content) return [];
    
    const lines = content.split('\n');
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        return { index, type: 'empty', text: '', originalLine: line };
      }

      // Extract timestamp from line
      const timestamp = extractTimestamp(trimmedLine);

      // Check for speaker label
      const speakerMatch = trimmedLine.match(/^([[(]?[A-Za-z0-9\s]+[\])]?):\s*(.*)$/);
      
      if (speakerMatch) {
        const [, speaker, text] = speakerMatch;
        return { index, type: 'speaker', speaker, text, originalLine: line, timestamp };
      }

      return { index, type: 'text', text: trimmedLine, originalLine: line, timestamp };
    });
  }, [content]);

  // Get speaker line indices for navigation
  const speakerIndices = useMemo(() => {
    return parsedLines
      .filter(line => line.type === 'speaker')
      .map(line => line.index);
  }, [parsedLines]);

  // Get all timestamps for display
  const timestampCount = useMemo(() => {
    return parsedLines.filter(line => line.timestamp).length;
  }, [parsedLines]);

  // Handle timestamp click
  const handleTimestampClick = useCallback(async (seconds: number) => {
    // If external handler provided, use it
    if (onTimestampClick) {
      onTimestampClick(seconds);
      return;
    }

    // If we have an associated recording, load and play it
    if (associatedRecording) {
      try {
        const url = await getSignedUrl(associatedRecording.file_url);
        if (url) {
          setVideoUrl(url);
          setVideoStartTime(seconds);
          setShowVideoPlayer(true);
          
          // Wait for video to load then seek
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.currentTime = seconds;
              videoRef.current.play().catch(() => {
                // Autoplay might be blocked
              });
            }
          }, 100);
        }
      } catch (error) {
        toast.error('Failed to load recording');
      }
    } else {
      // Copy timestamp to clipboard as fallback
      const formattedTime = formatTime(seconds);
      await navigator.clipboard.writeText(formattedTime);
      toast.success(`Timestamp ${formattedTime} copied`);
    }
  }, [associatedRecording, getSignedUrl, onTimestampClick]);

  // Search functionality
  useEffect(() => {
    if (!searchQuery || !content) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results: number[] = [];
    
    parsedLines.forEach((line) => {
      if (line.text.toLowerCase().includes(query) || 
          (line.speaker && line.speaker.toLowerCase().includes(query))) {
        results.push(line.index);
      }
    });

    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? 0 : -1);
    
    if (results.length > 0) {
      scrollToLine(results[0]);
    }
  }, [searchQuery, parsedLines, content]);

  // Scroll to a specific line
  const scrollToLine = useCallback((lineIndex: number) => {
    const element = lineRefs.current.get(lineIndex);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  // Navigate to next/previous search result
  const navigateSearchResult = useCallback((direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;
    
    let newIndex: number;
    if (direction === 'next') {
      newIndex = (currentSearchIndex + 1) % searchResults.length;
    } else {
      newIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    }
    
    setCurrentSearchIndex(newIndex);
    scrollToLine(searchResults[newIndex]);
  }, [searchResults, currentSearchIndex, scrollToLine]);

  // Navigate to next/previous speaker
  const navigateSpeaker = useCallback((direction: 'next' | 'prev') => {
    if (speakerIndices.length === 0) return;
    
    let newIndex: number;
    if (direction === 'next') {
      newIndex = currentSpeakerIndex === -1 ? 0 : 
                 (currentSpeakerIndex + 1) % speakerIndices.length;
    } else {
      newIndex = currentSpeakerIndex <= 0 ? speakerIndices.length - 1 : 
                 currentSpeakerIndex - 1;
    }
    
    setCurrentSpeakerIndex(newIndex);
    scrollToLine(speakerIndices[newIndex]);
  }, [speakerIndices, currentSpeakerIndex, scrollToLine]);

  // Keyboard navigation
  useEffect(() => {
    if (!open || !content) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
        return;
      }

      if (e.key === 'Escape' && isSearchOpen) {
        e.preventDefault();
        e.stopPropagation();
        setIsSearchOpen(false);
        setSearchQuery('');
        return;
      }

      if (e.key === 'Escape' && showVideoPlayer) {
        e.preventDefault();
        e.stopPropagation();
        setShowVideoPlayer(false);
        return;
      }

      if (!isSearchOpen && speakerIndices.length > 0) {
        if (e.key === 'ArrowDown' || e.key === 'j') {
          e.preventDefault();
          navigateSpeaker('next');
        } else if (e.key === 'ArrowUp' || e.key === 'k') {
          e.preventDefault();
          navigateSpeaker('prev');
        }
      }

      if (isSearchOpen && searchResults.length > 0) {
        if (e.key === 'Enter') {
          e.preventDefault();
          navigateSearchResult(e.shiftKey ? 'prev' : 'next');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, content, isSearchOpen, showVideoPlayer, searchResults, speakerIndices, navigateSpeaker, navigateSearchResult]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSearchResults([]);
      setCurrentSearchIndex(0);
      setCurrentSpeakerIndex(-1);
      setIsSearchOpen(false);
      setShowVideoPlayer(false);
      setVideoUrl(null);
    }
  }, [open]);

  useEffect(() => {
    async function loadContent() {
      if (!document || !open) {
        setContent(null);
        return;
      }

      setIsLoading(true);
      try {
        const text = await getDocumentContent(document);
        setContent(text);
      } catch (error) {
        console.error('Error loading transcript:', error);
        toast.error('Failed to load transcript content');
      } finally {
        setIsLoading(false);
      }
    }

    loadContent();
  }, [document, open, getDocumentContent]);

  const handleCopy = async () => {
    if (!content) return;
    
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      toast.success('Transcript copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy transcript');
    }
  };

  const handleDownload = async () => {
    if (!document) return;
    
    setIsDownloading(true);
    try {
      const signedUrl = await getSignedUrl(document.file_url);
      if (signedUrl) {
        const a = window.document.createElement('a');
        a.href = signedUrl;
        a.download = document.file_name;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
      }
    } catch (error) {
      toast.error('Failed to download file');
    } finally {
      setIsDownloading(false);
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'transcript': return 'Transcript';
      case 'summary': return 'Summary';
      case 'notes': return 'Notes';
      default: return type;
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Highlight search matches in text
  const highlightText = (text: string, lineIndex: number) => {
    if (!searchQuery) return text;
    
    const query = searchQuery.toLowerCase();
    const lowerText = text.toLowerCase();
    const startIndex = lowerText.indexOf(query);
    
    if (startIndex === -1) return text;

    const isCurrentResult = searchResults[currentSearchIndex] === lineIndex;
    
    return (
      <>
        {text.slice(0, startIndex)}
        <mark className={cn(
          "px-0.5 rounded",
          isCurrentResult 
            ? "bg-yellow-400 text-yellow-900" 
            : "bg-yellow-200 text-yellow-800"
        )}>
          {text.slice(startIndex, startIndex + searchQuery.length)}
        </mark>
        {text.slice(startIndex + searchQuery.length)}
      </>
    );
  };

  // Render timestamp badge
  const renderTimestampBadge = (timestamp: { raw: string; seconds: number }) => {
    const hasRecording = !!associatedRecording;
    
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleTimestampClick(timestamp.seconds);
        }}
        className={cn(
          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors",
          hasRecording
            ? "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 cursor-pointer"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
        title={hasRecording ? `Jump to ${formatTime(timestamp.seconds)} in recording` : `Copy timestamp`}
      >
        {hasRecording && <Play className="h-2.5 w-2.5" />}
        <span>{formatTime(timestamp.seconds)}</span>
      </button>
    );
  };

  // Render content with speaker labels, timestamps, and search highlighting
  const renderContent = () => {
    if (!content) return null;

    const hasSpeakerLabels = parsedLines.some(line => line.type === 'speaker');

    if (hasSpeakerLabels) {
      return (
        <div className="space-y-3">
          {parsedLines.map((line) => {
            if (line.type === 'empty') {
              return <div key={line.index} className="h-2" />;
            }

            const isActiveSpeaker = speakerIndices[currentSpeakerIndex] === line.index;
            const isSearchMatch = searchResults.includes(line.index);
            const isCurrentSearchMatch = searchResults[currentSearchIndex] === line.index;

            if (line.type === 'speaker') {
              return (
                <div
                  key={line.index}
                  ref={(el) => {
                    if (el) lineRefs.current.set(line.index, el);
                  }}
                  className={cn(
                    "space-y-1 p-2 -mx-2 rounded-lg transition-colors",
                    isActiveSpeaker && "bg-primary/10 ring-1 ring-primary/30",
                    isCurrentSearchMatch && "bg-yellow-100 ring-1 ring-yellow-400",
                    isSearchMatch && !isCurrentSearchMatch && "bg-yellow-50"
                  )}
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <User className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-xs font-medium text-primary">
                      {highlightText(line.speaker || '', line.index)}
                    </span>
                    {line.timestamp && renderTimestampBadge(line.timestamp)}
                    {isActiveSpeaker && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1 bg-primary/10">
                        {currentSpeakerIndex + 1}/{speakerIndices.length}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground pl-5">
                    {highlightText(line.text, line.index)}
                  </p>
                </div>
              );
            }

            return (
              <div
                key={line.index} 
                ref={(el) => {
                  if (el) lineRefs.current.set(line.index, el);
                }}
                className={cn(
                  "flex items-start gap-2 p-2 -mx-2 rounded-lg transition-colors",
                  isCurrentSearchMatch && "bg-yellow-100",
                  isSearchMatch && !isCurrentSearchMatch && "bg-yellow-50"
                )}
              >
                {line.timestamp && (
                  <div className="shrink-0 pt-0.5">
                    {renderTimestampBadge(line.timestamp)}
                  </div>
                )}
                <p className="text-sm text-foreground flex-1">
                  {highlightText(line.text, line.index)}
                </p>
              </div>
            );
          })}
        </div>
      );
    }

    // Plain text - check for timestamps
    const hasTimestamps = parsedLines.some(line => line.timestamp);
    
    if (hasTimestamps) {
      return (
        <div className="space-y-2">
          {parsedLines.map((line) => {
            if (line.type === 'empty') {
              return <div key={line.index} className="h-2" />;
            }

            return (
              <div key={line.index} className="flex items-start gap-2">
                {line.timestamp && (
                  <div className="shrink-0 pt-0.5">
                    {renderTimestampBadge(line.timestamp)}
                  </div>
                )}
                <p className="text-sm text-foreground flex-1">{line.text}</p>
              </div>
            );
          })}
        </div>
      );
    }

    // Plain text without timestamps
    return (
      <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
        {content}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-4 pb-3 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 min-w-0 flex-1">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-blue-500" />
                <span className="truncate">{document?.file_name || 'Document'}</span>
              </DialogTitle>
              
              {document && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {getTypeLabel(document.document_type)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getSourceLabel(document.source)}
                  </Badge>
                  {associatedRecording && (
                    <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1">
                      <Video className="h-3 w-3" />
                      Recording linked
                    </Badge>
                  )}
                  {document.file_size_bytes && (
                    <span>{formatFileSize(document.file_size_bytes)}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
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
                className="h-8 w-8 p-0"
                onClick={() => {
                  setIsSearchOpen(!isSearchOpen);
                  if (!isSearchOpen) {
                    setTimeout(() => searchInputRef.current?.focus(), 100);
                  }
                }}
                disabled={!content || isLoading}
                title="Search (Ctrl/Cmd + F)"
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                onClick={handleCopy}
                disabled={!content || isLoading}
              >
                {isCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="hidden sm:inline">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </Button>
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

          {/* Search bar */}
          {isSearchOpen && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search transcript..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-8 h-9"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              {searchResults.length > 0 && (
                <>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {currentSearchIndex + 1} of {searchResults.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 min-h-[44px] touch-manipulation"
                      onClick={() => navigateSearchResult('prev')}
                      title="Previous (Shift+Enter)"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 min-h-[44px] touch-manipulation"
                      onClick={() => navigateSearchResult('next')}
                      title="Next (Enter)"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
              
              {searchQuery && searchResults.length === 0 && (
                <span className="text-xs text-muted-foreground">No results</span>
              )}
            </div>
          )}
        </DialogHeader>

        {/* Inline Video Player */}
        {showVideoPlayer && videoUrl && (
          <div className="border-b bg-black relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 z-10 h-8 w-8 p-0 bg-black/50 text-white hover:bg-black/70"
              onClick={() => setShowVideoPlayer(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              className="w-full max-h-64"
              onLoadedMetadata={() => {
                if (videoRef.current && videoStartTime > 0) {
                  videoRef.current.currentTime = videoStartTime;
                }
              }}
            />
          </div>
        )}

        {/* Content */}
        <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
          <div className="p-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-3" />
                <p className="text-sm">Loading transcript...</p>
              </div>
            ) : content ? (
              renderContent()
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="h-8 w-8 mb-3 opacity-50" />
                <p className="text-sm">Unable to load content</p>
                <p className="text-xs mt-1">This file may not be a text format</p>
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
                  Download File Instead
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer with stats and keyboard hints */}
        {content && (
          <div className="p-3 border-t text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2 shrink-0 bg-muted/30">
            <div className="flex items-center gap-3">
              <span>
                {content.split(/\s+/).filter(Boolean).length.toLocaleString()} words
              </span>
              {speakerIndices.length > 0 && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {speakerIndices.length} speakers
                </span>
              )}
              {timestampCount > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timestampCount} timestamps
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-muted-foreground/60">
              {speakerIndices.length > 0 && (
                <span className="hidden sm:inline">↑↓ Navigate speakers</span>
              )}
              {timestampCount > 0 && associatedRecording && (
                <span className="hidden sm:inline">Click timestamps to jump</span>
              )}
              <span className="hidden sm:inline">⌘F Search</span>
              <span>Esc Close</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
