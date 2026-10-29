import { generateSrcSet, getLqipUrl, getOptimizedUrl, isSupabaseStorageUrl } from '@/lib/imageUrls';

import { useState, useEffect, useRef, useMemo, memo } from "react";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholderColor?: string;
  className?: string;
  wrapperClassName?: string;
  /** Explicit width for CLS prevention */
  width?: number;
  /** Explicit height for CLS prevention */
  height?: number;
  /** Priority loading (above-the-fold images) */
  priority?: boolean;
  /** Responsive sizes attribute for srcset */
  sizes?: string;
  /** Enable blur-up effect with low quality placeholder */
  blurUp?: boolean;
  /** Callback when image fails to load */
  onError?: () => void;
  /** Custom fallback content for error state */
  fallbackContent?: React.ReactNode;
}

const LazyImage = memo(({
  src,
  alt,
  placeholderColor = "bg-muted",
  className,
  wrapperClassName,
  width,
  height,
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  blurUp = true,
  onError: onErrorCallback,
  fallbackContent,
  ...props
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority); // Priority images load immediately
  const [hasError, setHasError] = useState(false);
  
  // Determine if this is a small avatar-sized image
  const isSmallImage = (width && width <= 80) || (height && height <= 80);
  const [lqipLoaded, setLqipLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoize srcset generation
  const srcSet = useMemo(() => generateSrcSet(src), [src]);
  
  // Optimized src for the main image
  const optimizedSrc = useMemo(() => {
    return width ? getOptimizedUrl(src, width) : src;
  }, [src, width]);

  // Low quality image placeholder URL
  const lqipSrc = useMemo(() => {
    return blurUp ? getLqipUrl(src) : undefined;
  }, [src, blurUp]);

  // Intersection Observer for lazy loading (skip for priority images)
  useEffect(() => {
    if (priority) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "200px", // Start loading 200px before entering viewport
        threshold: 0,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Preload LQIP first, then full image
  useEffect(() => {
    if (!isInView) return;

    // Load LQIP first if available
    if (lqipSrc && !lqipLoaded) {
      const lqipImg = new Image();
      lqipImg.src = lqipSrc;
      lqipImg.onload = () => setLqipLoaded(true);
    }

    // Load full image
    const img = new Image();
    img.src = optimizedSrc;
    if (srcSet) img.srcset = srcSet;
    img.onload = () => setIsLoaded(true);
    img.onerror = () => {
      setHasError(true);
      onErrorCallback?.();
    };
  }, [isInView, optimizedSrc, srcSet, lqipSrc, lqipLoaded]);

  // Calculate aspect ratio for placeholder
  const aspectRatio = width && height ? width / height : undefined;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", wrapperClassName)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* LQIP blur placeholder */}
      {blurUp && lqipSrc && lqipLoaded && !isLoaded && (
        <img
          src={lqipSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-lg scale-110 transition-opacity duration-300"
          style={{ opacity: isLoaded ? 0 : 1 }}
        />
      )}

      {/* Fallback shimmer placeholder when no LQIP */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-300",
          placeholderColor,
          (isLoaded || (lqipLoaded && lqipSrc)) ? "opacity-0" : "opacity-100"
        )}
        aria-hidden="true"
      >
        {/* Animated shimmer effect - using CSS animation for better performance */}
        {!hasError && (
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        )}
      </div>

      {/* Actual image */}
      {isInView && !hasError && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          srcSet={srcSet}
          sizes={srcSet ? sizes : undefined}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
          className={cn(
            "transition-all duration-500 ease-out",
            isLoaded 
              ? "opacity-100 blur-0 scale-100" 
              : "opacity-40 blur-sm scale-[1.02]",
            className
          )}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true);
            onErrorCallback?.();
          }}
          {...props}
        />
      )}

      {/* Error fallback */}
      {hasError && (
        <div 
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            placeholderColor
          )}
          role="img"
          aria-label={alt}
        >
          {fallbackContent ? (
            fallbackContent
          ) : isSmallImage ? (
            <User className="w-4 h-4 text-muted-foreground/50" />
          ) : (
            <span className="text-muted-foreground text-sm">Image unavailable</span>
          )}
        </div>
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;
