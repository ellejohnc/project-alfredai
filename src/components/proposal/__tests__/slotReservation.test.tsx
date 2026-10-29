import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  shouldShowSlotReservation,
  withSlotReservationFallback,
  dedupeLatestPaymentLinks,
  VIRTUAL_SLOT_RESERVATION_ID,
} from '@/lib/proposalSlotReservation';
import { ProposalActions } from '@/components/proposal/ProposalActions';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
    }),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const link = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'p1',
  payment_type: 'setup_fee',
  amount: 1_000_000,
  currency: 'aud',
  payment_link_url: 'https://pay.example/1',
  installment_type: null,
  status: 'pending',
  ...over,
});

describe('slot reservation visibility rules', () => {
  it('shows the section when poc_requested is true and there are NO payment links', () => {
    expect(shouldShowSlotReservation(true, [])).toBe(true);
    expect(shouldShowSlotReservation(true, null)).toBe(true);
    expect(shouldShowSlotReservation(true, undefined)).toBe(true);
  });

  it('shows the section when poc_requested is true but links exist without a slot_reservation row', () => {
    expect(shouldShowSlotReservation(true, [link() as never])).toBe(true);
  });

  it('still shows the section from a slot_reservation link when poc_requested is missing', () => {
    expect(
      shouldShowSlotReservation(null, [link({ payment_type: 'slot_reservation' }) as never]),
    ).toBe(true);
  });

  it('hides the section only when poc_requested is falsy AND no slot link exists', () => {
    expect(shouldShowSlotReservation(false, [link() as never])).toBe(false);
    expect(shouldShowSlotReservation(undefined, [])).toBe(false);
  });
});

describe('withSlotReservationFallback', () => {
  it('injects a virtual slot reservation first when poc_requested and no row exists', () => {
    const out = withSlotReservationFallback([link() as never], {
      pocRequested: true,
      amountDollars: 5000,
      currency: 'aud',
    });

    expect(out).toHaveLength(2);
    expect(out[0].id).toBe(VIRTUAL_SLOT_RESERVATION_ID);
    expect(out[0].payment_type).toBe('slot_reservation');
    expect(out[0].amount).toBe(500_000);
    expect(out[0].payment_link_url).toBeNull();
  });

  it('does not duplicate when a real slot reservation row already exists', () => {
    const real = link({ id: 'real-slot', payment_type: 'slot_reservation' }) as never;
    const out = withSlotReservationFallback([real], { pocRequested: true });
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('real-slot');
  });

  it('injects nothing when poc_requested is false', () => {
    const out = withSlotReservationFallback([link() as never], { pocRequested: false });
    expect(out).toHaveLength(1);
    expect(out[0].payment_type).toBe('setup_fee');
  });

  it('works from an empty/null link list', () => {
    expect(withSlotReservationFallback(null, { pocRequested: true })).toHaveLength(1);
    expect(withSlotReservationFallback([], { pocRequested: true })[0].amount).toBe(500_000);
  });
});

describe('dedupeLatestPaymentLinks (mirrors verify-proposal-access)', () => {
  it('keeps every payment type even when created far apart (no 60s batch window)', () => {
    const rows = [
      { payment_type: 'slot_reservation', created_at: '2026-01-01T00:00:00Z' },
      { payment_type: 'setup_fee', installment_type: 'initiation', created_at: '2026-05-01T00:00:00Z' },
      { payment_type: 'monthly_retainer', created_at: '2026-05-01T00:01:00Z' },
    ];
    const out = dedupeLatestPaymentLinks(rows);
    expect(out.map((r) => r.payment_type).sort()).toEqual([
      'monthly_retainer',
      'setup_fee',
      'slot_reservation',
    ]);
  });

  it('keeps only the newest row per type', () => {
    const out = dedupeLatestPaymentLinks([
      { payment_type: 'slot_reservation', created_at: '2026-01-01T00:00:00Z', id: 'old' } as never,
      { payment_type: 'slot_reservation', created_at: '2026-07-01T00:00:00Z', id: 'new' } as never,
    ]);
    expect(out).toHaveLength(1);
    expect((out[0] as { id: string }).id).toBe('new');
  });
});

describe('ProposalActions end-to-end render', () => {
  beforeEach(() => vi.clearAllMocks());

  const baseProps = {
    quoteId: 'R8E-8RGQ-9KPRB',
    accessCode: '1234',
    companyName: 'Test Co',
    contactName: 'Jane',
    contactEmail: 'jane@test.co',
    setupFee: '$20,000',
    monthlyRetainer: '$2,000',
    isSigned: true,
    onSignSuccess: vi.fn(),
  };

  it('renders the Production Slot Reservation card when poc_requested=true and quote_payments is empty', () => {
    render(<ProposalActions {...baseProps} paymentLinks={[]} pocRequested slotReservationAmount={5000} />);

    expect(screen.getByText(/slot reservation/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/Payment links will be sent to your email shortly/i),
    ).not.toBeInTheDocument();
  });

  it('renders the slot card alongside other payment types', () => {
    render(
      <ProposalActions
        {...baseProps}
        paymentLinks={[link() as never]}
        pocRequested
        slotReservationAmount={5000}
      />,
    );
    expect(screen.getByText(/slot reservation/i)).toBeInTheDocument();
  });

  it('falls back to the email message when there is nothing to pay and no PoC', () => {
    render(<ProposalActions {...baseProps} paymentLinks={[]} pocRequested={false} />);
    expect(screen.getByText(/Payment links will be sent to your email shortly/i)).toBeInTheDocument();
  });
});
