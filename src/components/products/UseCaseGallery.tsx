import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink, FileText, Images, X, ZoomIn } from "lucide-react";
import type { GalleryItem } from "@/data/useCases";
import PdfCanvasViewer from "@/components/products/PdfCanvasViewer";

const isPdf = (src: string) => src.toLowerCase().split(/[?#]/)[0].endsWith(".pdf");

const fileNameFromSrc = (src: string) => {
  try {
    const clean = src.split(/[?#]/)[0];
    return decodeURIComponent(clean.substring(clean.lastIndexOf("/") + 1)) || "document.pdf";
  } catch {
    return "document.pdf";
  }
};

const titleMatchesType = (item: GalleryItem) =>
  item.title.toLowerCase().trim() === item.type.toLowerCase().trim();





const UseCaseGallery = ({ items }: { items: GalleryItem[] }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const open = useCallback((index: number) => {
    setActiveIndex(index);
    setImageIndex(0);
    setDirection(0);
  }, []);

  const goTo = useCallback((index: number) => {
    if (index < 0 || index >= items.length) return;
    setDirection(index > (activeIndex ?? 0) ? 1 : -1);
    setActiveIndex(index);
    setImageIndex(0);
  }, [items.length, activeIndex]);

  // Images of the currently open card (falls back to its single src).
  const activeImages =
    activeIndex !== null
      ? items[activeIndex].images && items[activeIndex].images!.length > 0
        ? items[activeIndex].images!
        : [items[activeIndex].src]
      : [];

  const next = useCallback(() => {
    if (activeIndex === null) return;
    const imgs = items[activeIndex].images ?? [items[activeIndex].src];
    setDirection(1);
    // Step through this card's images first, then move to the next card.
    if (imageIndex < imgs.length - 1) {
      setImageIndex((i) => i + 1);
    } else if (activeIndex < items.length - 1) {
      setActiveIndex(activeIndex + 1);
      setImageIndex(0);
    }
  }, [activeIndex, imageIndex, items]);

  const prev = useCallback(() => {
    if (activeIndex === null) return;
    setDirection(-1);
    if (imageIndex > 0) {
      setImageIndex((i) => i - 1);
    } else if (activeIndex > 0) {
      const prevImgs = items[activeIndex - 1].images ?? [items[activeIndex - 1].src];
      setActiveIndex(activeIndex - 1);
      setImageIndex(prevImgs.length - 1);
    }
  }, [activeIndex, imageIndex, items]);

  const close = useCallback(() => setActiveIndex(null), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (activeIndex === null) return;
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, next, prev, close]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    const threshold = 50;
    if (diff > threshold) next();
    else if (diff < -threshold) prev();
    setTouchStart(null);
  };

  if (!items || items.length === 0) return null;

  const activeItem = activeIndex !== null ? items[activeIndex] : null;
  const hasMultipleImages = activeImages.length > 1;
  const isFirst = activeIndex === 0 && imageIndex === 0;
  const isLast =
    activeIndex === items.length - 1 && imageIndex === activeImages.length - 1;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-2">
          Sample outputs
        </h2>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
          Real formats the coordinator generates end-to-end — from social posts to ebooks and landing pages.
        </p>
      </div>

      <div className="grid gap-4 md:gap-5 sm:grid-cols-2 lg:grid-cols-3 items-start">
        {items.map((item, i) => (
          <motion.button
            key={item.title}
            type="button"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.2) }}
            onClick={() => open(i)}
            className="group text-left rounded-2xl border border-border bg-card overflow-hidden shadow-elevation-1 hover:border-foreground/20 hover:shadow-elevation-3 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <div className="relative w-full pb-[75%] bg-muted overflow-hidden">
              {isPdf(item.src) && !item.poster ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted">
                  <FileText className="w-10 h-10 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">PDF</span>
                </div>
              ) : (
                <img
                  src={item.poster || item.src}
                  alt={item.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                />
              )}
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300 flex items-center justify-center">
                <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow" />
              </div>
              <span className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full bg-background/90 text-foreground border border-border">
                {item.type}
              </span>
              {item.images && item.images.length > 1 && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-background/90 text-foreground border border-border">
                  <Images className="w-3 h-3" /> {item.images.length}
                </span>
              )}
            </div>
            {!titleMatchesType(item) && (
              <div className="p-4">
                <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
              </div>
            )}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {activeIndex !== null && activeItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm"
            onClick={() => setActiveIndex(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-5xl w-full max-h-[90vh] rounded-2xl border border-border bg-card shadow-elevation-3 flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <button
                type="button"
                onClick={() => setActiveIndex(null)}
                className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Close preview"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>

              {!isFirst && (
                <button
                  type="button"
                  onClick={prev}
                  className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background border border-border items-center justify-center hover:bg-muted transition-colors"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>
              )}
              {!isLast && (
                <button
                  type="button"
                  onClick={next}
                  className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background border border-border items-center justify-center hover:bg-muted transition-colors"
                  aria-label="Next"
                >
                  <ChevronRight className="w-5 h-5 text-foreground" />
                </button>
              )}

              <div className="flex-1 min-h-0 overflow-auto">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`${activeIndex}-${imageIndex}`}
                    initial={{ opacity: 0, x: direction * 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction * -30 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    {isPdf(activeItem.src) ? (
                      <PdfCanvasViewer
                        src={activeItem.src}
                        title={activeItem.title}
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center p-2 md:p-4">
                        <img
                          src={activeImages[imageIndex]}
                          alt={`${activeItem.title}${hasMultipleImages ? ` (${imageIndex + 1} of ${activeImages.length})` : ""}`}
                          className="max-h-full max-w-full object-contain rounded-sm"
                          draggable={false}
                        />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {hasMultipleImages && !isPdf(activeItem.src) && (
                  <div className="flex items-center justify-center gap-2 py-3">
                    {activeImages.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setDirection(idx > imageIndex ? 1 : -1);
                          setImageIndex(idx);
                        }}
                        className={`h-2.5 rounded-full transition-all ${
                          idx === imageIndex ? "w-6 bg-primary" : "w-2.5 bg-border hover:bg-muted-foreground/40"
                        }`}
                        aria-label={`Go to image ${idx + 1}`}
                        aria-current={idx === imageIndex}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border flex flex-wrap items-start justify-between gap-3 shrink-0">
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {activeItem.type}
                  </span>
                  {!titleMatchesType(activeItem) && (
                    <h3 className="mt-2 text-base font-bold text-foreground">{activeItem.title}</h3>
                  )}
                  {isPdf(activeItem.src) && (
                    <p className="mt-1 text-xs text-muted-foreground truncate">
                      {fileNameFromSrc(activeItem.src)}
                    </p>
                  )}
                </div>
                {isPdf(activeItem.src) && (
                  <a
                    href={activeItem.src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 min-h-touch px-4 rounded-full border border-border bg-background text-sm font-semibold text-foreground hover:bg-muted transition-colors shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" /> Open PDF
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UseCaseGallery;
