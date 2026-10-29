import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

// Animated shimmer block for content placeholders
const ShimmerBlock = memo(({ className }: { className?: string }) => (
  <div className={cn("relative overflow-hidden bg-muted/40 rounded-lg", className)}>
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
  </div>
));
ShimmerBlock.displayName = 'ShimmerBlock';

// Blog/Article card skeleton
export const ArticleCardSkeleton = memo(({ className }: { className?: string }) => (
  <div className={cn("bg-card rounded-xl border border-border overflow-hidden", className)}>
    <ShimmerBlock className="aspect-video" />
    <div className="p-5 space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex items-center gap-3 pt-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  </div>
));
ArticleCardSkeleton.displayName = 'ArticleCardSkeleton';

// Guide/Resource card skeleton
export const GuideCardSkeleton = memo(({ className }: { className?: string }) => (
  <div className={cn("bg-card rounded-xl border border-border overflow-hidden", className)}>
    <ShimmerBlock className="aspect-[16/9]" />
    <div className="p-5 space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <div className="flex items-center gap-4 pt-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  </div>
));
GuideCardSkeleton.displayName = 'GuideCardSkeleton';

// Video/Webinar card skeleton
export const VideoCardSkeleton = memo(({ className }: { className?: string }) => (
  <div className={cn("bg-card rounded-xl border border-border overflow-hidden", className)}>
    <div className="relative aspect-video">
      <ShimmerBlock className="absolute inset-0" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Skeleton className="w-14 h-14 rounded-full" />
      </div>
    </div>
    <div className="p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-4 w-4" />
        ))}
      </div>
    </div>
  </div>
));
VideoCardSkeleton.displayName = 'VideoCardSkeleton';

// Testimonial card skeleton
export const TestimonialCardSkeleton = memo(({ className }: { className?: string }) => (
  <div className={cn("bg-card rounded-xl border border-border p-6", className)}>
    <div className="flex gap-1 mb-4">
      {[1, 2, 3, 4, 5].map(i => (
        <Skeleton key={i} className="h-4 w-4" />
      ))}
    </div>
    <div className="space-y-2 mb-6">
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-3/4" />
    </div>
    <div className="flex items-center gap-3 pt-4 border-t border-border">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  </div>
));
TestimonialCardSkeleton.displayName = 'TestimonialCardSkeleton';

// FAQ item skeleton
export const FAQItemSkeleton = memo(({ className }: { className?: string }) => (
  <div className={cn("bg-card rounded-lg border border-border p-4", className)}>
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-5 w-5 rounded" />
    </div>
  </div>
));
FAQItemSkeleton.displayName = 'FAQItemSkeleton';

// Event/Webinar list item skeleton
export const EventItemSkeleton = memo(({ className }: { className?: string }) => (
  <div className={cn("bg-card rounded-xl border border-border p-6 flex gap-6", className)}>
    <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
    <div className="flex-1 space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
    <div className="flex flex-col gap-2 flex-shrink-0">
      <Skeleton className="h-10 w-28" />
      <Skeleton className="h-10 w-28" />
    </div>
  </div>
));
EventItemSkeleton.displayName = 'EventItemSkeleton';

// Profile/Avatar with text skeleton
export const ProfileSkeleton = memo(({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = {
    sm: { avatar: 'h-8 w-8', name: 'w-20', title: 'w-24' },
    md: { avatar: 'h-10 w-10', name: 'w-24', title: 'w-32' },
    lg: { avatar: 'h-12 w-12', name: 'w-32', title: 'w-40' },
  };
  const s = sizes[size];
  
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Skeleton className={cn("rounded-full", s.avatar)} />
      <div className="space-y-1">
        <Skeleton className={cn("h-4", s.name)} />
        <Skeleton className={cn("h-3", s.title)} />
      </div>
    </div>
  );
});
ProfileSkeleton.displayName = 'ProfileSkeleton';

// Grid of cards skeleton
interface ContentGridSkeletonProps {
  count?: number;
  columns?: 1 | 2 | 3 | 4;
  variant?: 'article' | 'guide' | 'video' | 'testimonial';
  className?: string;
}

export const ContentGridSkeleton = memo(({ 
  count = 6, 
  columns = 3, 
  variant = 'article',
  className 
}: ContentGridSkeletonProps) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  const CardComponent = {
    article: ArticleCardSkeleton,
    guide: GuideCardSkeleton,
    video: VideoCardSkeleton,
    testimonial: TestimonialCardSkeleton,
  }[variant];

  return (
    <div className={cn("grid gap-6", gridCols[columns], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <CardComponent key={i} />
      ))}
    </div>
  );
});
ContentGridSkeleton.displayName = 'ContentGridSkeleton';

// Page header skeleton
export const PageHeaderSkeleton = memo(({ className }: { className?: string }) => (
  <div className={cn("space-y-4", className)}>
    <Skeleton className="h-6 w-24 rounded-full" />
    <Skeleton className="h-12 w-80 max-w-full" />
    <Skeleton className="h-6 w-96 max-w-full" />
  </div>
));
PageHeaderSkeleton.displayName = 'PageHeaderSkeleton';

// Stats row skeleton
export const StatsRowSkeleton = memo(({ count = 3, className }: { count?: number; className?: string }) => (
  <div className={cn("flex flex-wrap gap-6", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="space-y-1">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    ))}
  </div>
));
StatsRowSkeleton.displayName = 'StatsRowSkeleton';

// Filter bar skeleton
export const FilterBarSkeleton = memo(({ className }: { className?: string }) => (
  <div className={cn("flex flex-wrap items-center gap-3", className)}>
    <Skeleton className="h-10 w-40" />
    <Skeleton className="h-10 w-32" />
    <Skeleton className="h-10 w-36" />
  </div>
));
FilterBarSkeleton.displayName = 'FilterBarSkeleton';

// Full page content skeleton
export const PageContentSkeleton = memo(({ 
  showHeader = true,
  showFilters = true,
  cardCount = 6,
  columns = 3 as 1 | 2 | 3 | 4,
  variant = 'article' as 'article' | 'guide' | 'video' | 'testimonial',
  className 
}: { 
  showHeader?: boolean;
  showFilters?: boolean;
  cardCount?: number;
  columns?: 1 | 2 | 3 | 4;
  variant?: 'article' | 'guide' | 'video' | 'testimonial';
  className?: string;
}) => (
  <div className={cn("space-y-8", className)}>
    {showHeader && <PageHeaderSkeleton />}
    {showFilters && <FilterBarSkeleton />}
    <ContentGridSkeleton count={cardCount} columns={columns} variant={variant} />
  </div>
));
PageContentSkeleton.displayName = 'PageContentSkeleton';

export { ShimmerBlock };
