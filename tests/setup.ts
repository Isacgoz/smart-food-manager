import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

global.localStorage = localStorageMock as any;

// Mock Supabase
vi.mock('../services/storage', () => ({
  supabase: null,
  loadState: vi.fn(() => Promise.resolve(null)),
  saveState: vi.fn(() => Promise.resolve()),
}));

// Mock Monitoring (Sentry)
vi.mock('../shared/services/monitoring', () => ({
  initMonitoring: vi.fn(),
  initWebVitals: vi.fn(),
  setUserContext: vi.fn(),
  captureBusinessError: vi.fn(),
  captureTechnicalError: vi.fn(),
  trackMetric: vi.fn(),
  trackEvent: vi.fn(),
  businessAlerts: {
    stockNegative: vi.fn(),
    cashDiscrepancy: vi.fn(),
    dbSyncFailed: vi.fn(),
    insufficientStock: vi.fn(),
    lowMargin: vi.fn(),
  },
}));
