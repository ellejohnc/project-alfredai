import { useState, useCallback, useEffect, lazy, Suspense, memo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Loader2, AlertTriangle, Mail, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { SUPPORT_EMAIL } from '@/lib/siteConfig';
import { ProposalErrorBoundary } from '@/components/proposal/ProposalErrorBoundary';

// Lazy load heavy components for faster initial paint
const ProposalAccessGate = lazy(() => 
  import('@/components/proposal/ProposalAccessGate').then(m => ({ default: m.ProposalAccessGate }))
);
const ProposalContent = lazy(() => 
  import('@/components/proposal/ProposalContent').then(m => ({ default: m.ProposalContent }))
);

// Lightweight loading spinner component
const LoadingSpinner = memo(function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
});

// Error fallback component with contact support
const ErrorFallback = memo(function ErrorFallback({ 
  quoteId, 
  title = 'Something went wrong',
  message = 'We encountered an error loading your proposal.'
}: { 
  quoteId?: string;
  title?: string;
  message?: string;
}) {
  const handleContactSupport = () => {
    const subject = encodeURIComponent('Proposal Error Report');
    const body = encodeURIComponent(
      `Hi,\n\nI encountered an error while accessing my proposal.\n\nProposal ID: ${quoteId || 'Unknown'}\nPage: ${window.location.href}\nError: ${message}\n\nPlease help me resolve this issue.\n\nThank you`
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <Helmet>
        <title>Error | alfred ai</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground mb-6">{message}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline">
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
            <Button onClick={handleContactSupport}>
              <Mail className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </div>
          {quoteId && (
            <p className="text-xs text-muted-foreground mt-6">
              Reference: {quoteId}
            </p>
          )}
        </div>
      </div>
    </>
  );
});

// Not Found component
const NotFoundFallback = memo(function NotFoundFallback({ quoteId }: { quoteId?: string }) {
  return (
    <>
      <Helmet>
        <title>Proposal Not Found | alfred ai</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Proposal Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The proposal you're looking for doesn't exist or may have been removed.
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            If you believe this is an error, please contact support with your proposal ID.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline">
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Proposal%20Not%20Found&body=Proposal%20ID:%20${quoteId || 'Unknown'}%0APage:%20${encodeURIComponent(window.location.href)}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:underline"
            >
              <Mail className="w-4 h-4" />
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </>
  );
});

export default function ProposalPage() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [quoteData, setQuoteData] = useState<any>(null);
  const [paymentLinks, setPaymentLinks] = useState<any[] | null>(null);
  const [enteredAccessCode, setEnteredAccessCode] = useState<string>('');
  const [companyName, setCompanyName] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;

  // Auto-recovery for runtime errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('Cannot read properties of undefined')) {
        console.error('[ProposalPage] Runtime error detected:', event.message);
        
        if (retryCount < MAX_RETRIES) {
          console.log(`[ProposalPage] Attempting auto-recovery (retry ${retryCount + 1}/${MAX_RETRIES})...`);
          setRetryCount(prev => prev + 1);
          
          if (quoteId) {
            sessionStorage.removeItem(`proposal_${quoteId}`);
          }
          
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } else {
          setError('Unable to load proposal after multiple attempts. Please contact support.');
        }
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [quoteId, retryCount]);

  // Validate quote exists via secure edge function (no direct DB access)
  useEffect(() => {
    async function validateQuote() {
      if (!quoteId) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      try {
        // Use edge function lookup mode — no access code needed, returns only company_name
        const { data, error: fnError } = await supabase.functions.invoke('verify-proposal-access', {
          body: { quoteId: quoteId.toUpperCase(), mode: 'lookup' }
        });

        if (fnError) {
          console.error('Quote lookup error:', fnError);
          setError('Failed to load proposal. Please try again.');
          setIsLoading(false);
          return;
        }

        if (!data?.found) {
          setNotFound(true);
        } else {
          setCompanyName(data.companyName || undefined);
        }
      } catch (err) {
        console.error('Quote validation exception:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    validateQuote();
  }, [quoteId]);

  const handleUnlock = useCallback((data: any, accessCode: string) => {
    setQuoteData(data);
    setEnteredAccessCode(accessCode);
    // Also capture payment links if returned
    if (data?._paymentLinks) {
      setPaymentLinks(data._paymentLinks);
    }
    setIsUnlocked(true);
  }, []);

  // Loading state
  if (isLoading) {
    return <LoadingSpinner message="Loading proposal..." />;
  }

  // Error state
  if (error) {
    return (
      <ErrorFallback 
        quoteId={quoteId} 
        title="Unable to Load Proposal"
        message={error}
      />
    );
  }

  // Not found state
  if (notFound || !quoteId) {
    return <NotFoundFallback quoteId={quoteId} />;
  }

  // Unlocked - show proposal content with error boundary
  if (isUnlocked && quoteData) {
    return (
      <ProposalErrorBoundary quoteId={quoteId}>
        <Helmet>
          <title>{quoteData.company_name ? `Proposal for ${quoteData.company_name}` : 'Your Proposal'} | alfred ai</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <Suspense fallback={<LoadingSpinner message="Loading proposal content..." />}>
          <ProposalContent data={quoteData} accessCode={enteredAccessCode} paymentLinks={paymentLinks} />
        </Suspense>
      </ProposalErrorBoundary>
    );
  }

  // Locked - show access gate (all access goes through edge function)
  return (
    <>
      <Helmet>
        <title>Secure Proposal | alfred ai</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Suspense fallback={<LoadingSpinner message="Preparing secure access..." />}>
        <ProposalAccessGate 
          quoteId={quoteId} 
          companyName={companyName}
          onUnlock={handleUnlock} 
        />
      </Suspense>
    </>
  );
}
