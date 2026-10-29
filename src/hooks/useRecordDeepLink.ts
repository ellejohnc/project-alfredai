import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Standardised deep-link handler for admin lead panels.
 *
 * When a panel is opened with `?record=<id>` (e.g. from a lead-alert email or
 * the Unified Leads Inbox "Open admin record" action), this finds the matching
 * record once the data is ready and opens its details dialog, then strips the
 * `record` param from the URL so refreshes don't re-open it.
 *
 * It only acts once per record id, so it won't fight with a user who closes the
 * dialog. Other query params (filters, status, etc.) are preserved.
 */
export function useRecordDeepLink<T>({
  records,
  ready,
  getId,
  onOpen,
}: {
  /** The currently loaded records to search through. */
  records: T[];
  /** Whether data has finished loading and is safe to search. */
  ready: boolean;
  /** Extract the stable id used in the `?record=` param. */
  getId: (record: T) => string;
  /** Called with the matched record so the panel can open its dialog. */
  onOpen: (record: T) => void;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    const recordId = searchParams.get('record');
    if (!recordId || !ready) return;
    if (handledRef.current === recordId) return;

    const match = records.find((r) => getId(r) === recordId);
    if (match) {
      handledRef.current = recordId;
      onOpen(match);
      const next = new URLSearchParams(searchParams);
      next.delete('record');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, ready, records]);
}
