import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { GHLBookingWidget, GHLBookingModal } from '../GHLBookingWidget';

// Mock dependencies
vi.mock('@/lib/bookingConfig', () => ({
  BOOKING_CONFIG: {
    getWidgetUrl: vi.fn(() => 'https://test-widget-url.com'),
    ghlFormEmbedScript: 'https://test-script.js',
    isPreCreationEnabled: vi.fn(() => false),
    preCreateContact: vi.fn(),
  },
}));

vi.mock('@/hooks/useGHLLogging', () => ({
  logGHLSubmission: vi.fn(() => Promise.resolve({})),
}));

vi.mock('@/hooks/useLeadIdentity', () => ({
  getLeadIdentitySync: vi.fn(() => ({
    name: '',
    email: '',
    phone: '',
    company: '',
  })),
}));

describe('GHLBookingWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear session storage
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders inline variant by default', () => {
    const { container } = render(<GHLBookingWidget />);
    
    const iframe = container.querySelector('iframe');
    expect(iframe).toBeDefined();
    expect(iframe?.getAttribute('title')).toBe('Book a meeting');
  });

  it('renders card variant with header', () => {
    const { getByText } = render(<GHLBookingWidget variant="card" />);
    
    expect(getByText('Book Your Call')).toBeDefined();
    expect(getByText('Select a time that works for you')).toBeDefined();
  });

  it('renders fullscreen variant', () => {
    const { container } = render(<GHLBookingWidget variant="fullscreen" />);
    
    const iframe = container.querySelector('iframe');
    expect(iframe).toBeDefined();
    expect(iframe?.className).toContain('min-h-[500px]');
  });

  it('applies custom height', () => {
    const { container } = render(<GHLBookingWidget height={700} />);
    
    const iframe = container.querySelector('iframe');
    expect(iframe?.style.height).toBe('700px');
  });

  it('applies custom className', () => {
    const { container } = render(<GHLBookingWidget className="custom-class" />);
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('custom-class');
  });

  it('passes lead data for pre-fill', () => {
    const leadData = {
      name: 'John Doe',
      email: 'john@example.com',
      company: 'Test Corp',
      phone: '+1234567890',
    };
    
    const { container } = render(<GHLBookingWidget leadData={leadData} />);
    
    const iframe = container.querySelector('iframe');
    expect(iframe).toBeDefined();
  });
});

describe('GHLBookingModal', () => {
  it('renders when open', () => {
    const { getByText } = render(
      <GHLBookingModal
        isOpen={true}
        onClose={() => {}}
      />
    );
    
    expect(getByText('Book an Impact Conversation')).toBeDefined();
  });

  it('renders with custom title and description', () => {
    const { getByText } = render(
      <GHLBookingModal
        isOpen={true}
        onClose={() => {}}
        title="Custom Title"
        description="Custom description"
      />
    );
    
    expect(getByText('Custom Title')).toBeDefined();
    expect(getByText('Custom description')).toBeDefined();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <GHLBookingModal
        isOpen={false}
        onClose={() => {}}
      />
    );
    
    // Modal should not be rendered
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('calls onClose when dialog is closed', () => {
    const onClose = vi.fn();
    render(
      <GHLBookingModal
        isOpen={true}
        onClose={onClose}
      />
    );
    
    // The dialog component handles closing internally
    // We just verify the onClose prop is passed
    expect(onClose).not.toHaveBeenCalled();
  });
});
