import { Button } from '@/components/ui/button';
import { LeadPanelErrorState } from '@/components/admin/LeadPanelErrorState';
import SectionErrorBoundary from '@/components/ui/section-error-boundary';
import LeadDetailPage from './LeadDetailPage';

/**
 * Route wrapper for the lead record page.
 *
 * A render-time throw inside the record page used to unmount the whole admin
 * tree (blank screen, no sidebar). This boundary keeps the crash local: the
 * admin shell stays up and the user gets the standard lead error card with a
 * way back to the Inbox and a support email carrying the page URL.
 */
export default function LeadRecordRoute() {
  return (
    <SectionErrorBoundary
      fallback={
        <div className="space-y-4">
          <LeadPanelErrorState
            panelName="Lead record"
            message="We could not open this lead record. Please reload, or head back to the Leads Inbox — and email us if it keeps happening."
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="min-h-[44px]" onClick={() => window.location.reload()}>
              Reload this record
            </Button>
            <Button variant="outline" size="sm" className="min-h-[44px]" asChild>
              <a href="/admin/leads">Back to Leads Inbox</a>
            </Button>
          </div>
        </div>
      }
    >
      <LeadDetailPage />
    </SectionErrorBoundary>
  );
}
