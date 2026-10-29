import { useState } from "react";
import DOMPurify from "dompurify";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { FileText, ZoomIn, ZoomOut, X, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SampleDocViewerProps {
  title: string;
  content: string;
  highlights?: { text: string; type: "risk" | "info" | "success" }[];
  isProcessing?: boolean;
  onClose?: () => void;
}

export function SampleDocViewer({
  title,
  content,
  highlights = [],
  isProcessing = false,
  onClose
}: SampleDocViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const highlightContent = (text: string) => {
    let result = text;
    highlights.forEach((h, i) => {
      const colorClass = h.type === "risk" 
        ? "bg-red-200 dark:bg-red-900/50" 
        : h.type === "success" 
          ? "bg-green-200 dark:bg-green-900/50" 
          : "bg-yellow-200 dark:bg-yellow-900/50";
      result = result.replace(
        new RegExp(`(${h.text})`, 'gi'),
        `<mark class="${colorClass} px-0.5 rounded" data-highlight="${i}">$1</mark>`
      );
    });
    return result;
  };

  return (
    <motion.div
      layout
      className={cn(
        "bg-background border rounded-lg overflow-hidden",
        isFullscreen && "fixed inset-4 z-50 shadow-2xl"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setZoom(Math.max(50, zoom - 25))}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground w-10 text-center">
            {zoom}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setZoom(Math.min(150, zoom + 25))}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={onClose}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Document content */}
      <div 
        className="p-6 overflow-auto max-h-96 bg-white dark:bg-slate-950"
        style={{ fontSize: `${zoom}%` }}
      >
        {isProcessing && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "100%" }}
            className="absolute inset-0 bg-primary/5 pointer-events-none"
            style={{ 
              background: "linear-gradient(180deg, hsl(var(--primary) / 0.1) 0%, transparent 100%)" 
            }}
          />
        )}
        <div 
          className="prose prose-sm dark:prose-invert max-w-none font-serif leading-relaxed"
          dangerouslySetInnerHTML={{ 
            __html: DOMPurify.sanitize(highlightContent(content), {
              ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'strong', 'em', 'span', 'mark', 'br', 'ul', 'ol', 'li'],
              ALLOWED_ATTR: ['class', 'data-highlight']
            })
          }}
        />
      </div>

      {/* Highlight legend */}
      {highlights.length > 0 && (
        <div className="flex gap-3 p-2 border-t bg-muted/20 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-200 dark:bg-red-900/50" />
            Risk
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-yellow-200 dark:bg-yellow-900/50" />
            Info
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-200 dark:bg-green-900/50" />
            OK
          </span>
        </div>
      )}
    </motion.div>
  );
}
