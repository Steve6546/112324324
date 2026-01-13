import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';
import { ToastProvider } from '../../components/Toast';
import { Project, FileNode } from '../../types';

// Custom render function that includes providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Test data factories
export const createMockProject = (overrides?: Partial<Project>): Project => ({
  id: 'test-project-id',
  title: 'Test Project',
  description: 'A test project',
  thumbnailUrl: '',
  viewedAt: 'Just now',
  authorName: 'Test User',
  authorAvatar: '',
  category: 'mine',
  code: '<html><body>Hello World</body></html>',
  chatHistory: [],
  ...overrides,
});

export const createMockFile = (overrides?: Partial<FileNode>): FileNode => ({
  id: 'test-file-id',
  projectId: 'test-project-id',
  name: 'index.html',
  path: '/index.html',
  type: 'file',
  content: '<html><body>Hello World</body></html>',
  language: 'html',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

export const createMockFileNode = (overrides?: Partial<FileNode>): FileNode => ({
  id: 'test-file-node-id',
  projectId: 'test-project-id',
  name: 'script.js',
  path: '/script.js',
  type: 'file',
  content: 'console.log("Hello World");',
  language: 'javascript',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

// Mock database functions
export const mockDatabase = {
  createFile: vi.fn(),
  readFile: vi.fn(),
  updateFileContent: vi.fn(),
  deleteFile: vi.fn(),
  getProjectFiles: vi.fn(),
  saveProject: vi.fn(),
  getProject: vi.fn(),
  hasMigrated: vi.fn(),
  setMigrated: vi.fn(),
};

// Mock Gemini service
export const mockGeminiService = {
  hasValidApiKey: vi.fn(),
  saveSettings: vi.fn(),
  streamIdeaResponse: vi.fn(),
  streamAppCode: vi.fn(),
  streamCodeEdit: vi.fn(),
  generateVibeIdeas: vi.fn(),
  getCurrentModelInfo: vi.fn(),
};

// Utility to wait for async operations
export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0));

// Utility to mock fetch
export const mockFetch = (response: any) => {
  const mockResponse = {
    ok: true,
    json: vi.fn().mockResolvedValue(response),
    text: vi.fn().mockResolvedValue(JSON.stringify(response)),
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    redirected: false,
    type: 'basic' as const,
    url: '',
    clone: vi.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: vi.fn(),
    blob: vi.fn(),
    formData: vi.fn(),
  };

  global.fetch = vi.fn().mockResolvedValue(mockResponse);
};

// Utility to mock localStorage
export const mockLocalStorage = () => {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });
  return localStorageMock;
};

// Utility to mock indexedDB
export const mockIndexedDB = () => {
  const indexedDBMock = {
    open: vi.fn(() => ({
      onsuccess: null,
      onerror: null,
      result: {
        transaction: vi.fn(() => ({
          objectStore: vi.fn(() => ({
            get: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
          })),
          done: Promise.resolve(),
        })),
        close: vi.fn(),
      },
    })),
  };
  Object.defineProperty(window, 'indexedDB', {
    value: indexedDBMock,
  });
  return indexedDBMock;
};