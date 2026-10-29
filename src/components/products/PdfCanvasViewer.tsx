import { useEffect, useRef, useState } from "react";
import { ExternalLink, FileText, Loader2 } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

interface PdfCanvasViewerProps {
  src: string;
  title?: string;
  className?: string;
}

/**
 * Renders a PDF to canvas via pdf.js. The asset CDN serves PDFs with a
 * `content-security-policy: object-src 'none'` header, which blocks
 * `<object>`/`<iframe>` embedding — so we fetch the bytes and paint pages
 * to canvas instead (works on desktop and mobile).
 */
const PdfCanvasViewer = ({ src, title, className }: PdfCanvasViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    setStatus("loading");
    container.innerHTML = "";

    const render = async () => {
      try {
        const doc = await pdfjsLib.getDocument({ url: src }).promise;
        if (cancelled) return;

        const width = container.clientWidth || 800;

        for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
          const page = await doc.getPage(pageNum);
          if (cancelled) return;

          const baseViewport = page.getViewport({ scale: 1 });
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const scale = (width / baseViewport.width) * dpr;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.className = "block w-full mb-3 last:mb-0 rounded-sm shadow-sm";
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;

          container.appendChild(canvas);
          await page.render({ canvasContext: ctx, viewport }).promise;
        }

        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    };

    render();
    return () => {
      cancelled = true;
    };
  }, [src]);

  return (
    <div className={className}>
      {status === "loading" && (
        <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center gap-3 bg-muted">
          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground">Loading PDF…</p>
        </div>
      )}

      {status === "error" && (
        <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center gap-3 bg-muted p-6 text-center">
          <FileText className="w-10 h-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground max-w-sm">
            This PDF couldn't be previewed here. Open it in a new tab to view the full document.
          </p>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <ExternalLink className="w-4 h-4" /> Open PDF
          </a>
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full overflow-auto bg-muted p-3"
        style={{ display: status === "ready" ? "block" : "none" }}
        aria-label={title || "PDF preview"}
      />
    </div>
  );
};

export default PdfCanvasViewer;
