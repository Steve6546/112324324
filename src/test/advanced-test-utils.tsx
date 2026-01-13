import React, { ReactElement } from 'react';
import { render, RenderOptions, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Enhanced render function with better error handling
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const result = render(ui, {
    ...options,
    wrapper: ({ children }) => children,
  });

  return {
    ...result,
    // Add custom query methods
    findByTextContent: (text: string | RegExp) =>
      screen.findByText(text),
    waitForLoadingToFinish: () =>
      waitFor(() => {
        const loadingElements = screen.queryAllByText(/loading|loading\.\.\./i);
        expect(loadingElements.length).toBe(0);
      }, { timeout: 5000 }),
  };
};

// Mock utilities for common dependencies
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
  };
};

export const mockGoogleGenerativeAI = () => {
  const mockModel = {
    generateContentStream: vi.fn(),
    generateContent: vi.fn(),
  };

  const mockClient = {
    getGenerativeModel: vi.fn().mockReturnValue(mockModel),
  };

  const mockGoogleGenAI = {
    GoogleGenAI: vi.fn().mockReturnValue(mockClient),
  };

  vi.mock('@google/genai', () => mockGoogleGenAI);

  return { mockClient, mockModel, mockGoogleGenAI };
};

export const mockMonacoEditor = () => {
  const mockEditor = vi.fn();
  vi.mock('@monaco-editor/react', () => ({
    default: mockEditor,
  }));
  return mockEditor;
};

// Test helpers for async operations
export const waitForAsyncOperation = async (
  operation: () => Promise<void> | void,
  timeout = 5000
) => {
  await waitFor(operation, { timeout });
};

export const waitForComponentToLoad = async (
  componentTestId: string,
  timeout = 5000
) => {
  await waitFor(() => {
    expect(screen.getByTestId(componentTestId)).toBeInTheDocument();
  }, { timeout });
};

// Accessibility testing helpers
export const testAccessibility = {
  hasAriaLabel: (element: HTMLElement, label: string) => {
    expect(element).toHaveAttribute('aria-label', label);
  },

  hasRole: (element: HTMLElement, role: string) => {
    expect(element).toHaveAttribute('role', role);
  },

  isKeyboardNavigable: (element: HTMLElement) => {
    expect(element).toHaveAttribute('tabindex', expect.any(String));
  },

  hasAltText: (image: HTMLElement, altText: string) => {
    expect(image).toHaveAttribute('alt', altText);
  },
};

// Performance testing helpers
export const performanceHelpers = {
  measureRenderTime: async (component: ReactElement) => {
    const startTime = performance.now();

    customRender(component);

    await waitFor(() => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(1000); // Should render within 1 second
    });
  },

  mockSlowNetwork: () => {
    // Mock slow network conditions
    vi.mock('navigator', () => ({
      onLine: true,
      connection: {
        effectiveType: 'slow-2g',
        downlink: 0.1,
      },
    }));
  },

  mockFastNetwork: () => {
    vi.mock('navigator', () => ({
      onLine: true,
      connection: {
        effectiveType: '4g',
        downlink: 10,
      },
    }));
  },
};

// Device capability mocking
export const mockDeviceCapabilities = {
  touchDevice: () => {
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 5 });
    Object.defineProperty(window, 'ontouchstart', { value: {} });
  },

  desktopDevice: () => {
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 0 });
    delete (window as any).ontouchstart;
  },

  lowEndDevice: () => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2 });
  },

  highEndDevice: () => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8 });
  },

  speechSupported: () => {
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      value: vi.fn(),
    });
    Object.defineProperty(window, 'speechSynthesis', {
      value: { speak: vi.fn() },
    });
  },

  speechNotSupported: () => {
    delete (window as any).webkitSpeechRecognition;
    delete (window as any).speechSynthesis;
  },
};

// Progressive enhancement testing
export const testProgressiveEnhancement = {
  testBasicFeatures: (component: ReactElement) => {
    mockDeviceCapabilities.desktopDevice();
    mockDeviceCapabilities.speechNotSupported();
    mockDeviceCapabilities.lowEndDevice();

    customRender(component);

    // Should work without advanced features
    expect(screen.getByRole('main')).toBeInTheDocument();
  },

  testAdvancedFeatures: (component: ReactElement) => {
    mockDeviceCapabilities.touchDevice();
    mockDeviceCapabilities.speechSupported();
    mockDeviceCapabilities.highEndDevice();

    customRender(component);

    // Should have advanced features enabled
    const voiceButton = screen.queryByRole('button', { name: /voice|microphone/i });
    expect(voiceButton).toBeInTheDocument();
  },

  testTouchGestures: (component: ReactElement) => {
    mockDeviceCapabilities.touchDevice();

    customRender(component);

    // Should support touch interactions
    const touchableElement = screen.getByRole('textbox');
    expect(touchableElement).toHaveAttribute('inputmode');
  },
};

// Integration testing helpers
export const createIntegrationTest = {
  setupApp: () => {
    const mockLocalStorage = createMockLocalStorage();
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    mockGoogleGenerativeAI();
    mockMonacoEditor();

    return { mockLocalStorage };
  },

  mockAPIResponses: () => {
    const { mockModel } = mockGoogleGenerativeAI();

    mockModel.generateContentStream.mockImplementation(async function* () {
      yield { text: 'Creating' };
      yield { text: ' your app...' };
      yield { text: '## Complete!\n\nYour app is ready.' };
    });

    return mockModel;
  },

  simulateUserJourney: async (startAction: () => void) => {
    // Setup
    const { mockLocalStorage } = createIntegrationTest.setupApp();
    const mockModel = createIntegrationTest.mockAPIResponses();

    // Execute user journey
    startAction();

    // Wait for completion
    await waitFor(() => {
      expect(mockModel.generateContentStream).toHaveBeenCalled();
    });

    return { mockLocalStorage, mockModel };
  },
};

export { customRender as render };