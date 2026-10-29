import { describe, it, expect } from 'vitest';
import {
  recordOwnedByDistributor,
  scopeRecordsToDistributor,
  shouldHideCompanyWideRecords,
  type ScopeContext,
  type OwnableRecord,
} from '@/lib/distributorScope';

const DIST_ID = 'dist-123';
const OTHER_ID = 'other-999';
const DIST_EMAIL = 'rep@alfredai.bot';

const distributorCtx = (overrides: Partial<ScopeContext> = {}): ScopeContext => ({
  isDistributor: true,
  scopedUserId: DIST_ID,
  scopedUserEmail: DIST_EMAIL,
  collaboratorIds: new Set<string>(),
  ...overrides,
});

describe('recordOwnedByDistributor', () => {
  it('shows all records to non-distributor (admin) viewers', () => {
    const ctx: ScopeContext = { isDistributor: false, scopedUserId: DIST_ID };
    const record: OwnableRecord = { id: 'r1', assigned_distributor_id: OTHER_ID };
    expect(recordOwnedByDistributor(record, ctx)).toBe(true);
  });

  it('shows all records when there is no scoped user id', () => {
    const ctx: ScopeContext = { isDistributor: true, scopedUserId: null };
    const record: OwnableRecord = { id: 'r1', assigned_distributor_id: OTHER_ID };
    expect(recordOwnedByDistributor(record, ctx)).toBe(true);
  });

  it('shows records assigned to the distributor', () => {
    const record: OwnableRecord = { id: 'r1', assigned_distributor_id: DIST_ID };
    expect(recordOwnedByDistributor(record, distributorCtx())).toBe(true);
  });

  it('shows records created by the distributor', () => {
    const record: OwnableRecord = { id: 'r1', created_by_user_id: DIST_ID };
    expect(recordOwnedByDistributor(record, distributorCtx())).toBe(true);
  });

  it('shows records the distributor collaborates on', () => {
    const record: OwnableRecord = { id: 'r-collab', assigned_distributor_id: OTHER_ID };
    const ctx = distributorCtx({ collaboratorIds: new Set(['r-collab']) });
    expect(recordOwnedByDistributor(record, ctx)).toBe(true);
  });

  it('shows quotes matched by creator email fallback (case-insensitive)', () => {
    const record: OwnableRecord = { id: 'r1', created_by: '  REP@alfredai.bot ' };
    expect(recordOwnedByDistributor(record, distributorCtx())).toBe(true);
  });

  it('hides records owned by another distributor', () => {
    const record: OwnableRecord = {
      id: 'r1',
      assigned_distributor_id: OTHER_ID,
      created_by_user_id: OTHER_ID,
      created_by: 'someone@else.com',
    };
    expect(recordOwnedByDistributor(record, distributorCtx())).toBe(false);
  });

  it('does not match on email when scopedUserEmail is absent', () => {
    const record: OwnableRecord = { id: 'r1', created_by: DIST_EMAIL };
    const ctx = distributorCtx({ scopedUserEmail: null });
    expect(recordOwnedByDistributor(record, ctx)).toBe(false);
  });
});

describe('scopeRecordsToDistributor', () => {
  const records: OwnableRecord[] = [
    { id: 'own-assigned', assigned_distributor_id: DIST_ID },
    { id: 'own-created', created_by_user_id: DIST_ID },
    { id: 'collab', assigned_distributor_id: OTHER_ID },
    { id: 'own-email', created_by: DIST_EMAIL },
    { id: 'foreign', assigned_distributor_id: OTHER_ID, created_by_user_id: OTHER_ID },
  ];

  it('returns only records the distributor owns/collaborates on (Leads/Quotes/Meetings)', () => {
    const ctx = distributorCtx({ collaboratorIds: new Set(['collab']) });
    const result = scopeRecordsToDistributor(records, ctx).map((r) => r.id);
    expect(result).toEqual(['own-assigned', 'own-created', 'collab', 'own-email']);
    expect(result).not.toContain('foreign');
  });

  it('returns all records unchanged for admins', () => {
    const ctx: ScopeContext = { isDistributor: false, scopedUserId: DIST_ID };
    expect(scopeRecordsToDistributor(records, ctx)).toHaveLength(records.length);
  });

  it('returns all records when no scoped user id', () => {
    const ctx: ScopeContext = { isDistributor: true, scopedUserId: null };
    expect(scopeRecordsToDistributor(records, ctx)).toHaveLength(records.length);
  });
});

describe('shouldHideCompanyWideRecords', () => {
  it('hides company-wide records (e.g. investor bookings) from distributors', () => {
    expect(shouldHideCompanyWideRecords(distributorCtx())).toBe(true);
  });

  it('keeps company-wide records visible to admins', () => {
    expect(shouldHideCompanyWideRecords({ isDistributor: false, scopedUserId: DIST_ID })).toBe(false);
  });

  it('keeps company-wide records visible when no scoped user id', () => {
    expect(shouldHideCompanyWideRecords({ isDistributor: true, scopedUserId: null })).toBe(false);
  });
});
