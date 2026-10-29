import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Skeleton for the Quote Form section (left column)
 */
export function QuoteFormSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-8 animate-in fade-in duration-300">
      {/* Client Info Section */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Team & Operations Section */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>

      {/* Workflows Section */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-36" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>

      {/* Challenges Section */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-32 rounded-full" />
          ))}
        </div>
      </div>

      {/* Timeline Section */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-28" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for the Results Panel (right column)
 */
export function ResultsPanelSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Pricing Recommendation */}
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 flex-1 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quote Result Card */}
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
          <Skeleton className="h-24 rounded-lg" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
        </CardContent>
      </Card>

      {/* Actions Skeleton */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 flex-1" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Skeleton for accordion items (Formula Breakdown, Sensitivity Analysis)
 */
export function AccordionSkeleton() {
  return (
    <Card className="animate-in fade-in duration-300">
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
    </Card>
  );
}

/**
 * Skeleton for the Quote Loader section
 */
export function QuoteLoaderSkeleton() {
  return (
    <Card className="animate-in fade-in duration-300">
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for the Transcript Analyzer section
 */
export function TranscriptAnalyzerSkeleton() {
  return (
    <Card className="animate-in fade-in duration-300">
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-24 w-full rounded-md" />
        <Skeleton className="h-10 w-32" />
      </CardContent>
    </Card>
  );
}

/**
 * Combined skeleton for the entire page content
 */
export function DIYQuotePageSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* Left Column */}
      <div className="lg:col-span-3 space-y-6">
        <QuoteLoaderSkeleton />
        <TranscriptAnalyzerSkeleton />
        <QuoteFormSkeleton />
      </div>

      {/* Right Column */}
      <div className="lg:col-span-2">
        <ResultsPanelSkeleton />
      </div>
    </div>
  );
}
