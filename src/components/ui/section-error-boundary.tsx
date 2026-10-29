import { Component, ReactNode } from 'react';
import { SectionErrorFallback } from './section-error-fallback';

interface Props {
  children: ReactNode;
  title?: string;
  compact?: boolean;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for individual sections
 * Catches errors and displays a retry-enabled fallback
 */
export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Section Error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <SectionErrorFallback
          title={this.props.title || "Section failed to load"}
          message={this.state.error?.message || "An unexpected error occurred"}
          onRetry={this.handleRetry}
          compact={this.props.compact}
        />
      );
    }

    return this.props.children;
  }
}

export default SectionErrorBoundary;
