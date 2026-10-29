import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';

// Mock dependencies before importing the component
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

vi.mock('@/hooks/useRecaptcha', () => ({
  useRecaptcha: vi.fn(() => ({
    verifyRecaptcha: vi.fn().mockResolvedValue({ success: true }),
    isReady: true,
  })),
}));

vi.mock('@/hooks/useGHLLogging', () => ({
  logGHLSubmission: vi.fn().mockResolvedValue(undefined),
  logGHLSubmissionInBackground: vi.fn(),
  flushPendingGHLSubmissions: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

vi.mock('@/lib/phoneUtils', () => ({
  COUNTRY_CODES: [
    { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', format: '### ### ###', placeholder: '400 123 456' },
    { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', format: '### ### ####', placeholder: '555 123 4567' },
  ],
  detectCountryFromLocale: vi.fn(() => 'AU'),
  formatPhoneDisplay: vi.fn((phone) => phone),
  validatePhoneForCountry: vi.fn(() => ({ isValid: true })),
  formatInternationalPhone: vi.fn((phone) => phone),
  getCountryByCode: vi.fn((code) => ({
    code,
    name: code === 'AU' ? 'Australia' : 'United States',
    dialCode: code === 'AU' ? '+61' : '+1',
    flag: code === 'AU' ? '🇦🇺' : '🇺🇸',
    format: '### ### ###',
    placeholder: '400 123 456',
  })),
  saveCountryCode: vi.fn(),
}));

// Import component after mocks
import LeadCaptureChoice from '../LeadCaptureChoice';

describe('LeadCaptureChoice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Choice Mode', () => {
    it('renders choice screen with two options', () => {
      const { getByText } = render(<LeadCaptureChoice type="demo" />);
      
      expect(getByText('Quick Form')).toBeDefined();
      expect(getByText('Guided Chat')).toBeDefined();
    });

    // The subtitle is "Choose your preferred way to connect" and is the same
    // for both types. These asserted "How would you like to get started",
    // which is copy this component no longer has, and asserted it twice as if
    // the two types differed.
    it('shows the same subtitle for demo', () => {
      const { getByText } = render(<LeadCaptureChoice type="demo" />);

      expect(getByText(/Choose your preferred way to connect/i)).toBeDefined();
    });

    it('shows the same subtitle for contact', () => {
      const { getByText } = render(<LeadCaptureChoice type="contact" />);

      expect(getByText(/Choose your preferred way to connect/i)).toBeDefined();
    });
  });

  describe('Form Mode', () => {
    it('switches to form mode when Quick Form is clicked', async () => {
      const { getByText } = render(<LeadCaptureChoice type="demo" />);
      
      const formButton = getByText('Quick Form');
      await act(async () => {
        formButton.click();
      });
      
      expect(getByText('First name')).toBeDefined();
    });

    it('shows required form fields for demo type', () => {
      // Queried by LABEL, not placeholder. The inputs carry placeholder=" " so
      // the floating label can sit over an empty field, which means
      // getByPlaceholderText can never match them — the old assertions could
      // not have passed against this component in any state.
      const { getByText } = render(<LeadCaptureChoice type="demo" initialMode="form" />);

      expect(getByText('First name')).toBeDefined();
      expect(getByText('Last name')).toBeDefined();
      expect(getByText('Work email')).toBeDefined();
    });

    it('allows going back to choice mode from form', async () => {
      // Rendered from the CHOICE screen, not straight into form mode. "Back to
      // options" only exists when initialMode is "choice" — entering directly
      // in form mode has nothing to go back to, so the old version of this test
      // was looking for a control the component deliberately does not render.
      const { getByText } = render(<LeadCaptureChoice type="demo" />);

      await act(async () => {
        getByText('Quick Form').click();
      });
      expect(getByText('First name')).toBeDefined();

      await act(async () => {
        getByText(/Back to options/i).click();
      });
      expect(getByText('Guided Chat')).toBeDefined();
    });
  });

  describe('Chat Mode', () => {
    it('switches to chat mode when Guided Chat is clicked', async () => {
      localStorage.clear(); // Ensure no prefilled identity
      const { getByText } = render(<LeadCaptureChoice type="demo" />);
      
      const chatButton = getByText('Guided Chat');
      await act(async () => {
        chatButton.click();
      });
      
      // Demo questions start with "What's your role?"
      expect(getByText("What's your role?")).toBeDefined();
    });

    it('shows first question in chat mode when no prefilled data', () => {
      localStorage.clear(); // Ensure no prefilled identity
      const { getByText } = render(<LeadCaptureChoice type="demo" initialMode="chat" />);
      
      // Demo questions start with "What's your role?" not "What's your name?"
      expect(getByText("What's your role?")).toBeDefined();
    });
  });

  describe('Duplicate Prevention', () => {
    it('does not mark an email as submitted until it is actually submitted', () => {
      // Renamed to what it checks. It claimed to test that a submission is
      // stored, but it assigned .value directly — which React ignores, so no
      // state changed — and then asserted the key was NULL. It passed by
      // testing nothing, and only failed at all because the placeholder
      // queries could never resolve against this component's floating labels.
      const testEmail = 'test@example.com';
      render(<LeadCaptureChoice type="demo" initialMode="form" />);

      const storageKey = `alfred_lead_submitted_${testEmail.toLowerCase().trim()}`;
      expect(localStorage.getItem(storageKey)).toBeNull();
    });
  });

  describe('Lead Identity Persistence', () => {
    it('renders the identity fields, and persists nothing before submission', () => {
      const { getByText } = render(<LeadCaptureChoice type="demo" initialMode="form" />);

      expect(getByText('First name')).toBeDefined();
      expect(getByText('Last name')).toBeDefined();
      // Identity is written on submit, not on render.
      expect(localStorage.getItem('alfred_lead_identity')).toBeNull();
    });
  });
});

describe('LeadCaptureChoice Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('validates phone number format', async () => {
    const { validatePhoneForCountry } = await import('@/lib/phoneUtils');
    
    // Test valid phone
    (validatePhoneForCountry as any).mockReturnValue({ isValid: true });
    
    const { getByPlaceholderText } = render(<LeadCaptureChoice type="demo" initialMode="form" />);
    
    const phoneInput = getByPlaceholderText('400 123 456');
    
    expect(phoneInput).toBeDefined();
  });
});
