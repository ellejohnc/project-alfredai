import { lazy, Suspense } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History, Eye, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const ActivityLogAdmin = lazy(() => import('./ActivityLogAdmin'));
const UserActivityAdmin = lazy(() => import('./UserActivityAdmin'));

const fallback = (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

export default function ActivityCombinedAdmin() {
  const { isSuperAdmin } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'log';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Activity</h1>
        <p className="text-muted-foreground text-sm">Monitor admin actions and user behavior</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="log" className="gap-1.5">
            <History className="h-3.5 w-3.5" />
            Activity Log
          </TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="user-activity" className="gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              User Activity
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="log" className="mt-4">
          <Suspense fallback={fallback}>
            <ActivityLogAdmin />
          </Suspense>
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="user-activity" className="mt-4">
            <Suspense fallback={fallback}>
              <UserActivityAdmin />
            </Suspense>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
