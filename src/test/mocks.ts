// Centralized mocks for testing

import { vi } from 'vitest';

// Mock external libraries
vi.mock('@monaco-editor/react', () => ({
  default: vi.fn(),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(),
  Type: {
    ARRAY: 'array',
    STRING: 'string',
    OBJECT: 'object',
  },
}));

vi.mock('idb', () => ({
  openDB: vi.fn(),
}));

// Mock browser APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
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

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock indexedDB
const indexedDBMock = {
  open: vi.fn(),
  cmp: vi.fn(),
  deleteDatabase: vi.fn(),
};
Object.defineProperty(window, 'indexedDB', {
  value: indexedDBMock,
  writable: true,
});

// Mock URL
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn(),
  },
  writable: true,
});

// Mock Blob
Object.defineProperty(window, 'Blob', {
  value: vi.fn().mockImplementation((content, options) => ({
    content,
    options,
    size: content?.[0]?.length || 0,
    type: options?.type || '',
  })),
  writable: true,
});

// Mock FileReader
Object.defineProperty(window, 'FileReader', {
  value: vi.fn().mockImplementation(() => ({
    readAsDataURL: vi.fn(),
    readAsText: vi.fn(),
    readAsArrayBuffer: vi.fn(),
    onload: null,
    onloadend: null,
    onerror: null,
    onabort: null,
    result: null,
    readyState: 0,
    EMPTY: 0,
    LOADING: 1,
    DONE: 2,
    abort: vi.fn(),
  })),
  writable: true,
});

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = vi.fn();
  console.warn = vi.fn();
  console.log = vi.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});

// Export mocks for use in tests
export {
  localStorageMock,
  indexedDBMock,
};