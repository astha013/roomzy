import '@testing-library/jest-dom';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// Cleanup after each test
afterEach(() => cleanup());

// Start MSW mock server
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });

// Mock localStorage
const localStorageMock = {
  getItem:    vi.fn(),
  setItem:    vi.fn(),
  removeItem: vi.fn(),
  clear:      vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
