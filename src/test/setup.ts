import '@testing-library/jest-dom';
import { vi, beforeAll, afterEach, afterAll } from 'vitest';
import React from 'react';

// Mock window.location.
//
// This stub replaces jsdom's real Location, so anything it LEAVES OUT reads as
// undefined rather than falling back — and nothing warns. A Lovable-generated
// module started reading `location.hostname` to decide whether it is on a
// preview host, and the whole Spotlight route-guard suite stopped collecting
// with "Cannot read properties of undefined (reading 'endsWith')" — 53
// assertions gone, from a field we simply had not listed.
//
// So this mirrors a real Location, not just the four fields the first test
// needed. Add the field here when a new one is read; do not narrow it.
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/test-page',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/test-page',
    search: '',
    hash: '',
    origin: 'http://localhost:3000',
    ancestorOrigins: [] as unknown as DOMStringList,
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
    toString: () => 'http://localhost:3000/test-page',
  },
  writable: true,
});

// Mock matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock framer-motion to prevent animation issues in tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: (props: React.HTMLProps<HTMLDivElement>) => React.createElement('div', props),
      span: (props: React.HTMLProps<HTMLSpanElement>) => React.createElement('span', props),
      button: (props: React.HTMLProps<HTMLButtonElement>) => React.createElement('button', props),
      p: (props: React.HTMLProps<HTMLParagraphElement>) => React.createElement('p', props),
      h1: (props: React.HTMLProps<HTMLHeadingElement>) => React.createElement('h1', props),
      h2: (props: React.HTMLProps<HTMLHeadingElement>) => React.createElement('h2', props),
      section: (props: React.HTMLProps<HTMLElement>) => React.createElement('section', props),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
    useInView: () => true,
    useScroll: () => ({ scrollY: { get: () => 0 }, scrollYProgress: { get: () => 0 } }),
    useTransform: () => 0,
    useMotionValue: () => ({ get: () => 0, set: vi.fn() }),
  };
});

// Suppress console errors during tests unless explicitly testing errors
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Allow explicit error testing
    if (args[0]?.toString().includes('Test error boundary')) return;
    // Suppress React 18 hydration warnings in tests
    if (args[0]?.toString().includes('ReactDOM.render is no longer supported')) return;
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});
