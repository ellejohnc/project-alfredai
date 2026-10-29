import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SUPPORT_EMAIL } from '@/lib/siteConfig';

interface Props {
  children: ReactNode;
  quoteId?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

/**
 * Error boundary specifically for the Proposal page.
 * Attempts auto-recovery for "undefined" errors, then shows recovery UI.
 */
export class ProposalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ProposalErrorBoundary] Caught error:', error);
    console.error('[ProposalErrorBoundary] Error info:', errorInfo);

    // Auto-retry once for "undefined" property errors
    if (
      error.message.includes('Cannot read properties of undefined') &&
      this.state.retryCount < 1
    ) {
      console.log('[ProposalErrorBoundary] Attempting auto-recovery...');
      setTimeout(() => {
        this.setState(prev => ({
          hasError: false,
          error: null,
          retryCount: prev.retryCount + 1
        }));
      }, 500);
    }
  }

  handleRetry = () => {
    // Clear any cached proposal data
    if (this.props.quoteId) {
      sessionStorage.removeItem(`proposal_${this.props.quoteId}`);
    }
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Unknown error';
      const emailBody = encodeURIComponent(
        `I encountered an error viewing my proposal.\n\nProposal ID: ${this.props.quoteId || 'Unknown'}\nError: ${errorMessage}\nPage: ${window.location.href}\n\nPlease help me resolve this issue.`
      );

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">Unable to Load Proposal</h2>
            
            <p className="text-muted-foreground mb-6">
              We encountered an error loading this proposal. This might be a temporary issue.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleRetry} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              
              <Button variant="outline" onClick={this.handleGoHome} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Go Home
              </Button>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                If the problem persists, please contact support:
              </p>
              <a 
                href={`mailto:${SUPPORT_EMAIL}?subject=Proposal%20Loading%20Error&body=${emailBody}`}
              >
                <Button variant="link" className="gap-2">
                  <Mail className="w-4 h-4" />
                  {SUPPORT_EMAIL}
                </Button>
              </a>
            </div>
            
            {this.props.quoteId && (
              <p className="text-xs text-muted-foreground mt-4">
                Reference: {this.props.quoteId}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ProposalErrorBoundary;
