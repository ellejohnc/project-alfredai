import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { SectionErrorFallback } from '../section-error-fallback';

describe('SectionErrorFallback', () => {
  it('renders with default title and message', () => {
    const { getByText } = render(<SectionErrorFallback />);

    expect(getByText('Unable to load this section')).toBeDefined();
    expect(getByText('Something went wrong while loading. Please try again.')).toBeDefined();
  });

  it('renders with custom title and message', () => {
    const { getByText } = render(
      <SectionErrorFallback 
        title="Custom Error Title" 
        message="Custom error message for testing" 
      />
    );

    expect(getByText('Custom Error Title')).toBeDefined();
    expect(getByText('Custom error message for testing')).toBeDefined();
  });

  it('shows retry button when onRetry is provided', () => {
    const mockRetry = vi.fn();
    const { getByRole } = render(<SectionErrorFallback onRetry={mockRetry} />);

    const retryButton = getByRole('button', { name: /try again/i });
    expect(retryButton).toBeDefined();
  });

  it('calls onRetry when retry button is clicked', () => {
    const mockRetry = vi.fn();
    const { getByRole } = render(<SectionErrorFallback onRetry={mockRetry} />);

    const retryButton = getByRole('button', { name: /try again/i });
    retryButton.click();

    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('does not show retry button when onRetry is not provided', () => {
    const { queryByRole } = render(<SectionErrorFallback />);

    const retryButton = queryByRole('button', { name: /try again/i });
    expect(retryButton).toBeNull();
  });

  it('renders in compact mode with smaller styling', () => {
    const mockRetry = vi.fn();
    const { container } = render(<SectionErrorFallback compact onRetry={mockRetry} />);

    // Compact mode should have smaller padding (p-4 instead of p-6)
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('p-4');
  });

  it('renders in default mode with larger styling', () => {
    const mockRetry = vi.fn();
    const { container } = render(<SectionErrorFallback onRetry={mockRetry} />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('p-6');
  });

  it('contains contact support email link', () => {
    const { getByText } = render(<SectionErrorFallback title="Test Section" message="Test message" />);

    const supportLink = getByText('contact support') as HTMLAnchorElement;
    expect(supportLink.tagName).toBe('A');
    
    const href = supportLink.getAttribute('href');
    expect(href).toContain('mailto:support@alfredai.bot');
    expect(href).toContain('subject=Section%20Load%20Error');
    expect(href).toContain('Test%20Section');
  });

  it('displays warning icon', () => {
    const { container } = render(<SectionErrorFallback />);

    // Check for the AlertTriangle icon wrapper
    const iconWrapper = container.querySelector('.rounded-full');
    expect(iconWrapper).toBeDefined();
  });
});
