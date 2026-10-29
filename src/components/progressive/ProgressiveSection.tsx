import { preloadSection } from './preloadSection';

import { ReactNode, Suspense, lazy, ComponentType, memo } from 'react';
import { useProgressiveLoad } from '@/hooks/useProgressiveLoad';
import { Skeleton } from '@/components/ui/skeleton';

interface ProgressiveSectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  minHeight?: string;
  className?: string;
}

// CSS-only shimmer block (no framer-motion)
const ShimmerBlock = memo(({ className }: { className?: string }) => (
  <div className={`relative overflow-hidden bg-muted/30 rounded-xl ${className}`}>
    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
  </div>
));

ShimmerBlock.displayName = 'ShimmerBlock';

// Default skeleton fallback — CSS-only animations
const SectionSkeleton = memo(({ minHeight = '400px', variant = 'default' }: { minHeight?: string; variant?: 'default' | 'cards' | 'testimonial' | 'cta' }) => (
  <div className="w-full" style={{ minHeight }}>
    <div className="container-wide py-12 sm:py-16">
      {/* Header skeleton */}
      <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-12">
        <Skeleton className="h-5 w-24 mx-auto mb-4 rounded-full bg-muted/40" />
        <Skeleton className="h-8 sm:h-10 w-64 sm:w-80 mx-auto mb-3" />
        <Skeleton className="h-4 w-48 sm:w-72 mx-auto" />
      </div>
      
      {variant === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 stagger-children">
          {[...Array(3)].map((_, i) => (
            <ShimmerBlock key={i} className="h-44 sm:h-52" />
          ))}
        </div>
      )}
      
      {variant === 'testimonial' && (
        <div className="max-w-2xl mx-auto">
          <ShimmerBlock className="h-32 sm:h-40 mb-4" />
          <div className="flex items-center gap-3 justify-center">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      )}
      
      {variant === 'cta' && (
        <div className="max-w-lg mx-auto text-center">
          <ShimmerBlock className="h-24 sm:h-28 mb-4" />
          <div className="flex gap-3 justify-center">
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </div>
      )}
      
      {variant === 'default' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 stagger-children">
          {[...Array(3)].map((_, i) => (
            <ShimmerBlock key={i} className="h-40 sm:h-48" />
          ))}
        </div>
      )}
    </div>
  </div>
));

SectionSkeleton.displayName = 'SectionSkeleton';

// Progressive section wrapper
export const ProgressiveSection = memo(({
  children,
  fallback,
  rootMargin = '300px',
  minHeight = '400px',
  className = '',
}: ProgressiveSectionProps) => {
  const { ref, isVisible } = useProgressiveLoad({ rootMargin, triggerOnce: true });

  return (
    <div ref={ref} className={className} style={{ minHeight: isVisible ? 'auto' : minHeight }}>
      {isVisible ? children : (fallback || <SectionSkeleton minHeight={minHeight} />)}
    </div>
  );
});

ProgressiveSection.displayName = 'ProgressiveSection';

// Lazy section with progressive rendering
interface LazySectionProps {
  importFn: () => Promise<{ default: ComponentType<any> }>;
  props?: Record<string, unknown>;
  rootMargin?: string;
  minHeight?: string;
  skeletonVariant?: 'default' | 'cards' | 'testimonial' | 'cta';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  preload?: boolean;
}

const priorityMargins = {
  critical: '800px',
  high: '500px',
  medium: '300px',
  low: '150px',
};

const lazySectionCache = new Map<string, ComponentType<any>>();

export const LazySection = memo(({ 
  importFn, 
  props = {}, 
  rootMargin,
  minHeight = '400px',
  skeletonVariant = 'default',
  priority = 'medium',
  preload = false,
}: LazySectionProps) => {
  const effectiveMargin = rootMargin || priorityMargins[priority];
  const { ref, isVisible } = useProgressiveLoad({ rootMargin: effectiveMargin, triggerOnce: true });
  
  if (preload && typeof window !== 'undefined') {
    preloadSection(importFn);
  }
  
  if (!isVisible) {
    return (
      <div
        ref={ref}
        className="content-auto"
        style={{ minHeight, containIntrinsicSize: `auto ${minHeight}` }}
      >
        <SectionSkeleton minHeight={minHeight} variant={skeletonVariant} />
      </div>
    );
  }

  const cacheKey = importFn.toString();
  if (!lazySectionCache.has(cacheKey)) {
    lazySectionCache.set(cacheKey, lazy(importFn));
  }
  const LazyComponent = lazySectionCache.get(cacheKey)!;

  return (
    <div ref={ref} className="animate-section-fade-in">
      <Suspense fallback={<SectionSkeleton minHeight={minHeight} variant={skeletonVariant} />}>
        <LazyComponent {...props} />
      </Suspense>
    </div>
  );
});

LazySection.displayName = 'LazySection';

export { SectionSkeleton, ShimmerBlock };
