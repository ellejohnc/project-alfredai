import { ReactNode, Component, ErrorInfo } from 'react';
import { AnimatePresence as FramerAnimatePresence, AnimatePresenceProps } from 'framer-motion';

interface Props extends AnimatePresenceProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * SafeAnimatePresence - Error boundary wrapper for framer-motion's AnimatePresence
 * 
 * This component catches React instance conflicts that can occur when framer-motion
 * loads a separate React chunk. If an error occurs, it gracefully renders the children
 * without animations instead of crashing the entire page.
 */
export class SafeAnimatePresence extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('SafeAnimatePresence caught an animation error:', error.message);
    console.debug('Error info:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      // Return children without animation as fallback
      return <>{this.props.fallback ?? this.props.children}</>;
    }

    try {
      return <FramerAnimatePresence {...this.props} />;
    } catch (error) {
      // Handle synchronous render errors
      console.warn('SafeAnimatePresence render error, falling back to static content');
      return <>{this.props.fallback ?? this.props.children}</>;
    }
  }
}

// Re-export as AnimatePresence for easy drop-in replacement
export { SafeAnimatePresence as AnimatePresence };

// Export a simple fallback div for when motion fails
export function StaticDiv({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props}>{children}</div>;
}
