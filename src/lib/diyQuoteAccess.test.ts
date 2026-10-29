import { describe, it, expect } from 'vitest';
import {
  isQuoteAdminRole,
  isValidQuickAccessCode,
  resolveDIYAccessMode,
  canSaveLoad,
  canAccessBuilder,
  type DIYAccessInput,
} from '@/lib/diyQuoteAccess';

import type { AppRole } from '@/lib/rolePermissions';

const ALL_ROLES: AppRole[] = ['super_admin', 'admin', 'editor', 'sales_rep', 'distributor'];

describe('isQuoteAdminRole', () => {
  it('grants admin rights only to super_admin and admin', () => {
    expect(isQuoteAdminRole('super_admin')).toBe(true);
    expect(isQuoteAdminRole('admin')).toBe(true);
  });

  it('denies all other roles', () => {
    expect(isQuoteAdminRole('editor')).toBe(false);
    expect(isQuoteAdminRole('sales_rep')).toBe(false);
    expect(isQuoteAdminRole('distributor')).toBe(false);
  });

  it('denies null/unauthenticated role', () => {
    expect(isQuoteAdminRole(null)).toBe(false);
  });
});

describe('isValidQuickAccessCode', () => {
  it('accepts any non-empty code (real validation is server-side)', () => {
    expect(isValidQuickAccessCode('2026')).toBe(true);
    expect(isValidQuickAccessCode('any-code')).toBe(true);
  });

  it('trims surrounding whitespace', () => {
    expect(isValidQuickAccessCode('  2026 ')).toBe(true);
  });

  it('rejects empty/whitespace-only codes', () => {
    expect(isValidQuickAccessCode('')).toBe(false);
    expect(isValidQuickAccessCode('   ')).toBe(false);
  });
});


describe('resolveDIYAccessMode', () => {
  const input = (o: Partial<DIYAccessInput> = {}): DIYAccessInput => ({
    isAuthenticated: false,
    role: null,
    quickAccessUsed: false,
    ...o,
  });

  it('returns "full" for authenticated admin accounts (Admin Users mapping)', () => {
    expect(resolveDIYAccessMode(input({ isAuthenticated: true, role: 'admin' }))).toBe('full');
    expect(resolveDIYAccessMode(input({ isAuthenticated: true, role: 'super_admin' }))).toBe('full');
  });

  it('does NOT grant full access to non-admin authenticated roles', () => {
    for (const role of ['editor', 'sales_rep', 'distributor'] as AppRole[]) {
      expect(resolveDIYAccessMode(input({ isAuthenticated: true, role }))).not.toBe('full');
    }
  });

  it('grants full access to the quick code (super-admin) even for a non-admin auth role', () => {
    expect(
      resolveDIYAccessMode(input({ isAuthenticated: true, role: 'distributor', quickAccessUsed: true })),
    ).toBe('full');
  });

  it('returns "full" for quick access code without auth (code represents super admin)', () => {
    expect(resolveDIYAccessMode(input({ quickAccessUsed: true }))).toBe('full');
  });

  it('prefers admin full access over quick access', () => {
    expect(
      resolveDIYAccessMode(input({ isAuthenticated: true, role: 'admin', quickAccessUsed: true })),
    ).toBe('full');
  });

  it('returns "none" when there is neither admin auth nor quick access', () => {
    expect(resolveDIYAccessMode(input())).toBe('none');
    expect(resolveDIYAccessMode(input({ isAuthenticated: true, role: null }))).toBe('none');
  });
});

describe('Save/Load scoping', () => {
  it('only full (admin) access can Save/Load', () => {
    expect(canSaveLoad('full')).toBe(true);
    expect(canSaveLoad('view-only')).toBe(false);
    expect(canSaveLoad('none')).toBe(false);
  });

  it('quick-access (super-admin) users can build and Save/Load', () => {
    const mode = resolveDIYAccessMode({ isAuthenticated: false, role: null, quickAccessUsed: true });
    expect(canAccessBuilder(mode)).toBe(true);
    expect(canSaveLoad(mode)).toBe(true);
  });

  it('admin email+password sign-in maps to full Save/Load', () => {
    const mode = resolveDIYAccessMode({ isAuthenticated: true, role: 'admin', quickAccessUsed: false });
    expect(canAccessBuilder(mode)).toBe(true);
    expect(canSaveLoad(mode)).toBe(true);
  });

  it('no access mode cannot enter the builder', () => {
    expect(canAccessBuilder('none')).toBe(false);
  });
});

describe('end-to-end role matrix', () => {
  it('maps each role to the expected Save/Load capability when signed in', () => {
    const expected: Record<AppRole, boolean> = {
      super_admin: true,
      admin: true,
      editor: false,
      sales_rep: false,
      distributor: false,
    };
    for (const role of ALL_ROLES) {
      const mode = resolveDIYAccessMode({ isAuthenticated: true, role, quickAccessUsed: false });
      expect(canSaveLoad(mode)).toBe(expected[role]);
    }
  });
});
