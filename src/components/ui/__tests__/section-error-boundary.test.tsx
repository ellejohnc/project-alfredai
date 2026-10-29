import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { SectionErrorBoundary } from '../section-error-boundary';

// Mock console.error to avoid noisy test output
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  console.error = originalConsoleError;
});

// Component that throws an error
const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>Content rendered successfully</div>;
};

describe('SectionErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    const { getByText } = render(
      <SectionErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </SectionErrorBoundary>
    );

    expect(getByText('Content rendered successfully')).toBeDefined();
  });

  it('renders error fallback when an error occurs', () => {
    const { getByText } = render(
      <SectionErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </SectionErrorBoundary>
    );

    // "Unable to load this section" is SectionErrorFallback's default title.
    // The boundary overrides it with its own, so asserting the default here
    // never described what this component renders.
    expect(getByText('Section failed to load')).toBeDefined();
    // The boundary shows the REAL error message, falling back to
    // "An unexpected error occurred" only when the error carries none. The old
    // fixed string it asserted here is not copy this component has.
    expect(getByText('Test error message')).toBeDefined();
  });

  it('displays custom title when provided', () => {
    const { getByText } = render(
      <SectionErrorBoundary title="Formula Breakdown Error">
        <ThrowingComponent shouldThrow={true} />
      </SectionErrorBoundary>
    );

    expect(getByText('Formula Breakdown Error')).toBeDefined();
  });

  it('displays the error message in the fallback', () => {
    const { getByText } = render(
      <SectionErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </SectionErrorBoundary>
    );

    expect(getByText('Test error message')).toBeDefined();
  });

  it('shows retry button', () => {
    const { getByRole } = render(
      <SectionErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </SectionErrorBoundary>
    );

    const retryButton = getByRole('button', { name: /try again/i });
    expect(retryButton).toBeDefined();
  });

  it('renders custom fallback when provided', () => {
    const { getByText } = render(
      <SectionErrorBoundary fallback={<div>Custom fallback UI</div>}>
        <ThrowingComponent shouldThrow={true} />
      </SectionErrorBoundary>
    );

    expect(getByText('Custom fallback UI')).toBeDefined();
  });

  it('applies compact styling when compact prop is true', () => {
    const { getByRole } = render(
      <SectionErrorBoundary compact>
        <ThrowingComponent shouldThrow={true} />
      </SectionErrorBoundary>
    );

    // In compact mode, the retry button should still be present
    const retryButton = getByRole('button', { name: /try again/i });
    expect(retryButton).toBeDefined();
  });

  it('includes contact support link with email', () => {
    const { getByText } = render(
      <SectionErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </SectionErrorBoundary>
    );

    const supportLink = getByText('contact support');
    expect(supportLink).toBeDefined();
    expect(supportLink.getAttribute('href')).toContain('mailto:support@alfredai.bot');
  });
});
