import React, { ReactElement } from 'react';
import { render, RenderOptions, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

// Mock ThemeContext for components that use it
const mockThemeContext = {
  theme: 'light',
  setTheme: vi.fn(),
};

vi.mock('../contexts/ThemeContext', () => ({
  ThemeContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
  useTheme: () => mockThemeContext,
}));

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}
    </>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock implementations for common scenarios
export const mockProject = {
  id: 'test-project-id',
  name: 'Test Project',
  code: '<html><body>Hello World</body></html>',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const mockFile = {
  id: 'file-1',
  projectId: 'test-project-id',
  name: 'index.html',
  path: '/index.html',
  type: 'file' as const,
  content: '<html><body>Hello World</body></html>',
  language: 'html',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const mockFiles = [
  mockFile,
  {
    id: 'file-2',
    projectId: 'test-project-id',
    name: 'styles.css',
    path: '/styles.css',
    type: 'file' as const,
    content: 'body { color: blue; }',
    language: 'css',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// Database mocking utilities
export const createMockDatabase = () => ({
  hasMigrated: vi.fn(),
  getProjectFiles: vi.fn(),
  setMigrated: vi.fn(),
  createFile: vi.fn(),
  updateFileContent: vi.fn(),
  deleteFile: vi.fn(),
  renameFile: vi.fn(),
  getUniquePath: vi.fn(),
});

// Local storage mocking utilities
export const createMockLocalStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    getStore: () => store,
  };
};

// API mocking utilities
export const createMockGeminiClient = () => ({
  models: {
    generateContent: vi.fn(),
    generateContentStream: vi.fn(),
  },
});

// Stream utilities for testing async generators
export const createMockStream = (chunks: string[]) => {
  return {
    [Symbol.asyncIterator]: async function* () {
      for (const chunk of chunks) {
        yield { text: chunk };
      }
    },
  };
};

// File input utilities
export const createMockFile = (name: string, content: string, type = 'text/plain') => {
  const blob = new Blob([content], { type });
  const file = new File([blob], name, { type });
  return file;
};

// User event utilities
export const createMockUserEvent = () => ({
  type: async (element: HTMLElement, text: string) => {
    fireEvent.change(element, { target: { value: text } });
  },
  click: async (element: HTMLElement) => {
    fireEvent.click(element);
  },
  keyboard: async (element: HTMLElement, options: { key: string; shiftKey?: boolean }) => {
    fireEvent.keyDown(element, options);
  },
});

// Timer utilities for testing debounced functions
export const advanceTimersByTime = (time: number) => {
  vi.advanceTimersByTime(time);
};

export const runOnlyPendingTimers = () => {
  vi.runOnlyPendingTimers();
};

export const runAllTimers = () => {
  vi.runAllTimers();
};

// Async utilities
export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0));

export const waitForCondition = async (
  condition: () => boolean,
  timeout = 1000,
  interval = 50
): Promise<void> => {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Condition not met within timeout');
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export * from '@testing-library/user-event';

// Override render with custom render
export { customRender as render };

// Additional exports
export { mockThemeContext };