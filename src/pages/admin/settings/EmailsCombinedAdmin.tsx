import { lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, FileText, BarChart3, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const EmailTemplatesAdmin = lazy(() => import('./EmailTemplatesAdmin'));
const EmailLogsAdmin = lazy(() => import('./EmailLogsAdmin'));
const EmailDeliveryDashboard = lazy(() => import('./EmailDeliveryDashboard'));

const fallback = (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

export default function EmailsCombinedAdmin() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'templates';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Emails</h1>
        <p className="text-muted-foreground text-sm">Manage templates, logs, and delivery analytics</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="templates" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4">
          <Suspense fallback={fallback}>
            <EmailTemplatesAdmin />
          </Suspense>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Suspense fallback={fallback}>
            <EmailLogsAdmin />
          </Suspense>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <Suspense fallback={fallback}>
            <EmailDeliveryDashboard />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
