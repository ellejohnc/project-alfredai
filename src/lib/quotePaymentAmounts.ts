export interface NormalizedQuotePaymentAmounts {
  baseCents: number;
  gstCents: number;
  totalCents: number;
  currency: string;
  taxIncluded: boolean;
}

interface NormalizeQuotePaymentAmountInput {
  amountCents: number;
  currency?: string | null;
  paymentType?: string | null;
}

const GST_RATE = 0.1;
const SLOT_BASE_INCREMENT_CENTS = 50_000;
const SLOT_MIN_BASE_CENTS = 500_000;

function normalizeCurrency(currency?: string | null): string {
  return (currency || 'aud').toLowerCase();
}

function deriveSlotReservationBaseCents(totalCents: number): number {
  const plausible: number[] = [];
  let candidateCents = totalCents;

  for (let i = 0; i < 3; i += 1) {
    if (candidateCents >= SLOT_MIN_BASE_CENTS && candidateCents % 100 === 0) {
      plausible.push(candidateCents);
    }

    candidateCents = Math.round(candidateCents / (1 + GST_RATE));
  }

  const roundedHeuristic = Math.max(
    SLOT_MIN_BASE_CENTS,
    Math.round(candidateCents / SLOT_BASE_INCREMENT_CENTS) * SLOT_BASE_INCREMENT_CENTS,
  );

  if (plausible.length === 0) {
    return roundedHeuristic;
  }

  const smallerPlausible = plausible.filter((value) => value < totalCents);
  return smallerPlausible.length > 0
    ? smallerPlausible[smallerPlausible.length - 1]
    : plausible[0];
}

export function normalizeQuotePaymentAmount({
  amountCents,
  currency,
  paymentType,
}: NormalizeQuotePaymentAmountInput): NormalizedQuotePaymentAmounts {
  const normalizedCurrency = normalizeCurrency(currency);
  const safeAmountCents = Math.max(0, Math.round(amountCents || 0));

  if (safeAmountCents === 0) {
    return {
      baseCents: 0,
      gstCents: 0,
      totalCents: 0,
      currency: normalizedCurrency,
      taxIncluded: false,
    };
  }

  if (normalizedCurrency !== 'aud') {
    return {
      baseCents: safeAmountCents,
      gstCents: 0,
      totalCents: safeAmountCents,
      currency: normalizedCurrency,
      taxIncluded: false,
    };
  }

  if (paymentType === 'slot_reservation') {
    const baseCents = deriveSlotReservationBaseCents(safeAmountCents);
    const totalCents = Math.round(baseCents * (1 + GST_RATE));

    return {
      baseCents,
      gstCents: totalCents - baseCents,
      totalCents,
      currency: normalizedCurrency,
      taxIncluded: true,
    };
  }

  const baseCents = Math.round(safeAmountCents / (1 + GST_RATE));

  return {
    baseCents,
    gstCents: safeAmountCents - baseCents,
    totalCents: safeAmountCents,
    currency: normalizedCurrency,
    taxIncluded: true,
  };
}

export function formatQuotePaymentAmountLabel(
  amounts: NormalizedQuotePaymentAmounts,
  options?: { recurring?: boolean },
): string {
  const { recurring = false } = options || {};
  const suffix = recurring ? '/mo' : '';
  const symbol = amounts.currency === 'aud' ? 'A$' : amounts.currency === 'usd' ? '$' : '$';
  const baseLabel = `${symbol}${(amounts.baseCents / 100).toLocaleString()}${suffix}`;

  if (!amounts.taxIncluded) {
    return `${baseLabel} excl. tax`;
  }

  const totalLabel = `${symbol}${(amounts.totalCents / 100).toLocaleString()}${suffix}`;
  return `${baseLabel} + GST (${totalLabel} total)`;
}
