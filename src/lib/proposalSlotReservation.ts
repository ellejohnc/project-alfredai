/**
 * Single source of truth for whether a proposal shows the PoC / production
 * slot reservation section.
 *
 * Rule: the quote's own `poc_requested` flag decides. A `quote_payments` row of
 * type `slot_reservation` is a nice-to-have, never a precondition — links can be
 * missing, regenerated without the deposit, or filtered out server-side.
 */

export interface SlotReservationLink {
  id: string;
  payment_type: string;
  amount: number;
  currency: string;
  payment_link_url: string | null;
  installment_type?: string | null;
  status: string;
  client_confirmed_at?: string | null;
  completed_at?: string | null;
}

export const VIRTUAL_SLOT_RESERVATION_ID = 'virtual-slot-reservation';

/** Default slot reservation amount in dollars (base, excl. GST). */
export const DEFAULT_SLOT_RESERVATION_DOLLARS = 5000;

export function findSlotReservationLink<T extends { payment_type: string }>(
  links?: T[] | null,
): T | undefined {
  return links?.find((l) => l.payment_type === 'slot_reservation');
}

export function shouldShowSlotReservation(
  pocRequested: boolean | null | undefined,
  links?: { payment_type: string }[] | null,
): boolean {
  if (pocRequested === true) return true;
  return !!findSlotReservationLink(links);
}

/**
 * Returns the payment links to render, injecting a synthesised slot reservation
 * card when the quote requires one but no row exists. Checkout sessions are
 * created on demand, so the client can still pay from the virtual card.
 */
export function withSlotReservationFallback<T extends SlotReservationLink>(
  links: T[] | null | undefined,
  options: {
    pocRequested?: boolean | null;
    amountDollars?: number;
    currency?: string;
  },
): (T | SlotReservationLink)[] {
  const {
    pocRequested,
    amountDollars = DEFAULT_SLOT_RESERVATION_DOLLARS,
    currency = 'aud',
  } = options;

  const result: (T | SlotReservationLink)[] = links ? [...links] : [];

  if (pocRequested === true && !findSlotReservationLink(result)) {
    result.unshift({
      id: VIRTUAL_SLOT_RESERVATION_ID,
      payment_type: 'slot_reservation',
      amount: Math.round((amountDollars || DEFAULT_SLOT_RESERVATION_DOLLARS) * 100),
      currency,
      payment_link_url: null,
      installment_type: null,
      status: 'pending',
    });
  }

  return result;
}

export function isVirtualPaymentLink(id: string): boolean {
  return id.startsWith('virtual-');
}

/**
 * Mirrors the server-side dedupe in `verify-proposal-access`: keep the newest
 * row per payment type / instalment across the WHOLE history. Never drop a
 * payment type (the old 60s "same batch" window did, which is what made the
 * slot reservation section vanish).
 */
export function dedupeLatestPaymentLinks<
  T extends { payment_type: string; installment_type?: string | null; created_at?: string },
>(links: T[]): T[] {
  const sorted = [...links].sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
  );
  const unique = new Map<string, T>();
  for (const link of sorted) {
    const key = link.installment_type
      ? `${link.payment_type}:${link.installment_type}`
      : link.payment_type;
    if (!unique.has(key)) unique.set(key, link);
  }
  return Array.from(unique.values());
}
