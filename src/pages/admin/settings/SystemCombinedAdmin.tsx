import { lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Activity, Flag, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const SitemapAdmin = lazy(() => import('./SitemapAdmin'));
const PerformanceAdmin = lazy(() => import('./PerformanceAdmin'));
const FeatureFlagsAdmin = lazy(() => import('./FeatureFlagsAdmin'));

const fallback = (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

export default function SystemCombinedAdmin() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'sitemap';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">System</h1>
        <p className="text-muted-foreground text-sm">Sitemap, performance metrics, and feature flags</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="sitemap" className="gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Sitemap
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="flags" className="gap-1.5">
            <Flag className="h-3.5 w-3.5" />
            Feature Flags
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sitemap" className="mt-4">
          <Suspense fallback={fallback}>
            <SitemapAdmin />
          </Suspense>
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <Suspense fallback={fallback}>
            <PerformanceAdmin />
          </Suspense>
        </TabsContent>

        <TabsContent value="flags" className="mt-4">
          <Suspense fallback={fallback}>
            <FeatureFlagsAdmin />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
