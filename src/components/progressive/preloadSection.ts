/** Warms a lazy section import before it scrolls into view. */

import { ReactNode, Suspense, lazy, ComponentType, memo } from 'react';

export const preloadedModules = new Map<string, Promise<{ default: ComponentType<any> }>>();

export const preloadSection = (importFn: () => Promise<{ default: ComponentType<any> }>) => {
  const key = importFn.toString();
  if (!preloadedModules.has(key)) {
    preloadedModules.set(key, importFn());
  }
  return preloadedModules.get(key)!;
};
