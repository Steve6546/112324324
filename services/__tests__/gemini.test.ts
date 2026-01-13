import { vi, describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';

// Mock the Google GenAI module
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(),
  Type: {
    ARRAY: 'array',
    STRING: 'string',
  },
}));

import {
  hasValidApiKey,
  saveSettings,
  streamIdeaResponse,
  generateVibeIdeas,
  streamAppCode,
  streamCodeEdit,
  getCurrentModelInfo,
  AVAILABLE_MODELS,
} from '../gemini';

const mockGoogleGenAI = vi.mocked(await import('@google/genai'));

// Helper to create mock client
const createMockClient = () => ({
  models: {
    generateContent: vi.fn(),
    generateContentStream: vi.fn(),
  },
  getGenerativeModel: vi.fn(),
});

describe('Gemini Service', () => {
  let mockLocalStorage: Record<string, string> = {};

  beforeAll(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockLocalStorage[key];
        }),
        clear: vi.fn(() => {
          mockLocalStorage = {};
        }),
      },
      writable: true,
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage = {};

    // Reset localStorage mocks
    const localStorageMock = window.localStorage as any;
    localStorageMock.getItem.mockImplementation((key: string) => mockLocalStorage[key] || null);
    localStorageMock.setItem.mockImplementation((key: string, value: string) => {
      mockLocalStorage[key] = value;
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('API Key Validation', () => {
    it('returns false when no API key is set', () => {
      expect(hasValidApiKey()).toBe(false);
    });

    it('returns false for invalid API keys', () => {
      mockLocalStorage['lovable_gemini_api_key'] = 'short';
      expect(hasValidApiKey()).toBe(false);

      mockLocalStorage['lovable_gemini_api_key'] = '';
      expect(hasValidApiKey()).toBe(false);
    });

    it('returns true for valid API keys', () => {
      mockLocalStorage['lovable_gemini_api_key'] = 'AIzaSyD1234567890abcdefghijklmnopqrstuvw';
      expect(hasValidApiKey()).toBe(true);
    });
  });

  describe('Settings Management', () => {
    it('saves API key and model settings', () => {
      const apiKey = 'test-api-key-123';
      const modelId = 'gemini-3-pro';

      saveSettings(apiKey, modelId);

      expect(mockLocalStorage['lovable_gemini_api_key']).toBe(apiKey);
      expect(mockLocalStorage['lovable_gemini_model']).toBe(modelId);
    });

    it('returns correct current model info', () => {
      mockLocalStorage['lovable_gemini_model'] = 'gemini-3-pro';

      const modelInfo = getCurrentModelInfo();
      expect(modelInfo.id).toBe('gemini-3-pro');
      expect(modelInfo.displayName).toBe('Gemini 3 Pro');
    });

    it('returns default model when none set', () => {
      const modelInfo = getCurrentModelInfo();
      expect(modelInfo.id).toBe('gemini-3-flash');
    });
  });

  describe('Available Models', () => {
    it('contains all expected models', () => {
      expect(AVAILABLE_MODELS).toHaveLength(4);
      expect(AVAILABLE_MODELS.map(m => m.id)).toEqual([
        'gemini-3-flash',
        'gemini-3-pro',
        'gemini-2.5-flash',
        'gemini-2.5-pro',
      ]);
    });

    it('has correct model properties', () => {
      const flashModel = AVAILABLE_MODELS.find(m => m.id === 'gemini-3-flash');
      expect(flashModel).toEqual({
        id: 'gemini-3-flash',
        displayName: 'Gemini 3 Flash',
        description: 'أحدث وأسرع نموذج من Google، مثالي للمهام السريعة',
        tier: 'free',
      });
    });
  });

  describe('streamIdeaResponse', () => {
    it('streams idea response successfully', async () => {
      mockLocalStorage['lovable_gemini_api_key'] = 'valid-api-key';

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { text: 'Planning your' };
          yield { text: ' amazing app...' };
          yield { text: '## App Plan\n\nFeatures here' };
        },
      };

      const mockModel = {
        generateContentStream: vi.fn().mockResolvedValue(mockStream),
      };

      const mockClient = {
        getGenerativeModel: vi.fn().mockReturnValue(mockModel),
      };

      (mockGoogleGenAI.GoogleGenAI as any).mockImplementation(() => mockClient);

      const chunks: string[] = [];
      for await (const chunk of streamIdeaResponse('Create a todo app')) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Planning your', ' amazing app...', '## App Plan\n\nFeatures here']);
      expect(mockClient.getGenerativeModel).toHaveBeenCalledWith('gemini-3-flash');
      expect(mockClient.getGenerativeModel).toHaveBeenCalledWith('gemini-3-flash');
      expect(mockModel.generateContentStream).toHaveBeenCalledWith({
        contents: [{ role: 'user', parts: [{ text: 'Create a todo app' }] }],
        generationConfig: expect.any(Object),
        safetySettings: expect.any(Array),
      });
    });

    it('handles API key not configured', async () => {
      const chunks: string[] = [];
      for await (const chunk of streamIdeaResponse('test prompt')) {
        chunks.push(chunk);
      }

      expect(chunks[0]).toContain('API Key Required');
    });

    it('handles image input', async () => {
      mockLocalStorage['lovable_gemini_api_key'] = 'valid-api-key';

      const mockResponse = {
        [Symbol.asyncIterator]: async function* () {
          yield { text: 'Analyzing image...' };
        },
      };

      const mockModel = {
        generateContentStream: vi.fn().mockResolvedValue(mockResponse),
      };

      const mockClient = {
        getGenerativeModel: vi.fn().mockReturnValue(mockModel),
      };

      (mockGoogleGenAI.GoogleGenAI as any).mockImplementation(() => mockClient);

      const imageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      const chunks: string[] = [];
      for await (const chunk of streamIdeaResponse('Describe this image', imageBase64)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Analyzing image...']);
      expect(mockClient.getGenerativeModel).toHaveBeenCalledWith('gemini-3-flash');
      expect(mockModel.generateContentStream).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              parts: expect.arrayContaining([
                expect.objectContaining({
                  inlineData: {
                    mimeType: 'image/png',
                    data: expect.any(String),
                  },
                }),
                expect.objectContaining({ text: 'Describe this image' }),
              ]),
            }),
          ]),
        })
      );
    });

    it('handles rate limiting with retry', async () => {
      mockLocalStorage['lovable_gemini_api_key'] = 'valid-api-key';

      let attemptCount = 0;
      const mockModel = {
        generateContentStream: vi.fn().mockImplementation(async () => {
          attemptCount++;
          if (attemptCount === 1) {
            const error = new Error('RESOURCE_EXHAUSTED');
            (error as any).status = 429;
            throw error;
          }

          return {
            [Symbol.asyncIterator]: async function* () {
              yield { text: 'Success after retry' };
            },
          };
        }),
      };

      const mockClient = {
        getGenerativeModel: vi.fn().mockReturnValue(mockModel),
      };

      (mockGoogleGenAI.GoogleGenAI as any).mockImplementation(() => mockClient);

      // Mock setTimeout for retry delays
      vi.useFakeTimers();

      const chunks: string[] = [];
      const promise = (async () => {
        for await (const chunk of streamIdeaResponse('test')) {
          chunks.push(chunk);
        }
      })();

      // Advance timer to trigger retry
      await vi.advanceTimersByTimeAsync(2000);

      await promise;

      expect(chunks).toEqual(['Success after retry']);
      expect(mockClient.getGenerativeModel).toHaveBeenCalledWith('gemini-3-flash');
      expect(mockModel.generateContentStream).toHaveBeenCalledTimes(2);
    });

    it('handles daily quota exhaustion', async () => {
      mockLocalStorage['lovable_gemini_api_key'] = 'valid-api-key';

      const mockModel = {
        generateContentStream: vi.fn().mockRejectedValue(
          new Error('Daily quota exceeded for gemini-3-flash')
        ),
      };

      const mockClient = {
        getGenerativeModel: vi.fn().mockReturnValue(mockModel),
      };

      (mockGoogleGenAI.GoogleGenAI as any).mockImplementation(() => mockClient);

      const chunks: string[] = [];
      for await (const chunk of streamIdeaResponse('test')) {
        chunks.push(chunk);
      }

      expect(chunks[0]).toContain('Daily Quota Exceeded');
    });

    it('handles network errors', async () => {
      mockLocalStorage['lovable_gemini_api_key'] = 'valid-api-key';

      const mockModel = {
        generateContentStream: vi.fn().mockRejectedValue(
          new Error('Network request failed')
        ),
      };

      const mockClient = {
        getGenerativeModel: vi.fn().mockReturnValue(mockModel),
      };

      (mockGoogleGenAI.GoogleGenAI as any).mockImplementation(() => mockClient);

      const chunks: string[] = [];
      for await (const chunk of streamIdeaResponse('test')) {
        chunks.push(chunk);
      }

      expect(chunks[0]).toContain('Network Error');
    });
  });

  describe('generateVibeIdeas', () => {
    it('generates vibe ideas successfully', async () => {
      mockLocalStorage['lovable_gemini_api_key'] = 'valid-api-key';

      const mockModel = {
        generateContent: vi.fn().mockResolvedValue({
          text: '["AI Fitness Tracker", "Smart Recipe App", "Crypto Portfolio", "Virtual Garden", "Language Exchange"]',
        }),
      };

      const mockClient = {
        getGenerativeModel: vi.fn().mockReturnValue(mockModel),
      };

      (mockGoogleGenAI.GoogleGenAI as any).mockImplementation(() => mockClient);

      const ideas = await generateVibeIdeas();

      expect(ideas).toEqual([
        'AI Fitness Tracker',
        'Smart Recipe App',
        'Crypto Portfolio',
        'Virtual Garden',
        'Language Exchange',
      ]);

      expect(mockModel.generateContent).toHaveBeenCalledWith({
        model: 'gemini-3-flash',
        contents: 'Generate 5 short, distinct, and creative web app ideas for 2025. They should be specific and trendy.',
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      });
    });

    it('returns fallback ideas on error', async () => {
      mockLocalStorage['lovable_gemini_api_key'] = 'valid-api-key';

      const mockModel = {
        generateContent: vi.fn().mockRejectedValue(new Error('API Error')),
      };

      const mockClient = {
        getGenerativeModel: vi.fn().mockReturnValue(mockModel),
      };

      (mockGoogleGenAI.GoogleGenAI as any).mockImplementation(() => mockClient);

      const ideas = await generateVibeIdeas();

      expect(ideas).toEqual([
        'Futuristic Dashboard',
        'AI Fitness Tracker',
        'Retro Portfolio',
        'Crypto Vibe',
        'Smart Recipe App',
      ]);
    });
  });

  describe('streamAppCode', () => {
    it('streams app code successfully', async () => {
      mockLocalStorage['lovable_gemini_api_key'] = 'valid-api-key';

      const mockResponse = {
        [Symbol.asyncIterator]: async function* () {
          yield { text: '<html>' };
          yield { text: '<body>Hello World</body>' };
          yield { text: '</html>' };
        },
      };

      const mockModel = {
        generateContentStream: vi.fn().mockResolvedValue(mockResponse),
      };

      const mockClient = {
        getGenerativeModel: vi.fn().mockReturnValue(mockModel),
      };

      (mockGoogleGenAI.GoogleGenAI as any).mockImplementation(() => mockClient);

      const chunks: string[] = [];
      for await (const chunk of streamAppCode('Create a simple webpage')) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['<html>', '<body>Hello World</body>', '</html>']);
    });

    it('includes plan in the prompt', async () => {
      mockLocalStorage['lovable_gemini_api_key'] = 'valid-api-key';

      const mockResponse = {
        [Symbol.asyncIterator]: async function* () {
          yield { text: '<html></html>' };
        },
      };

      const mockModel = {
        generateContentStream: vi.fn().mockResolvedValue(mockResponse),
      };

      const mockClient = {
        getGenerativeModel: vi.fn().mockReturnValue(mockModel),
      };

      (mockGoogleGenAI.GoogleGenAI as any).mockImplementation(() => mockClient);

      const plan = 'Simple webpage with header and footer';
      const chunks: string[] = [];
      for await (const chunk of streamAppCode(plan)) {
        chunks.push(chunk);
      }

      expect(mockClient.getGenerativeModel).toHaveBeenCalledWith('gemini-3-flash');
      expect(mockModel.generateContentStream).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.stringContaining(plan),
        })
      );
    });
  });

  describe('streamCodeEdit', () => {
    it('streams code edits successfully', async () => {
      mockLocalStorage['lovable_gemini_api_key'] = 'valid-api-key';

      const mockResponse = {
        [Symbol.asyncIterator]: async function* () {
          yield { text: '<html><body>Updated content</body></html>' };
        },
      };

      const mockModel = {
        generateContentStream: vi.fn().mockResolvedValue(mockResponse),
      };

      const mockClient = {
        getGenerativeModel: vi.fn().mockReturnValue(mockModel),
      };

      (mockGoogleGenAI.GoogleGenAI as any).mockImplementation(() => mockClient);

      const currentCode = '<html><body>Old content</body></html>';
      const editPrompt = 'Change the content to say "Updated content"';

      const chunks: string[] = [];
      for await (const chunk of streamCodeEdit(currentCode, editPrompt)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['<html><body>Updated content</body></html>']);

      expect(mockClient.getGenerativeModel).toHaveBeenCalledWith('gemini-3-flash');
      expect(mockModel.generateContentStream).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.stringContaining(currentCode).and(
            expect.stringContaining(editPrompt)
          ),
        })
      );
    });

    it('returns original code on error', async () => {
      mockLocalStorage['lovable_gemini_api_key'] = 'valid-api-key';

      const mockModel = {
        generateContentStream: vi.fn().mockRejectedValue(new Error('API Error')),
      };

      const mockClient = {
        getGenerativeModel: vi.fn().mockReturnValue(mockModel),
      };

      (mockGoogleGenAI.GoogleGenAI as any).mockImplementation(() => mockClient);

      const originalCode = '<html><body>Original</body></html>';

      const chunks: string[] = [];
      for await (const chunk of streamCodeEdit(originalCode, 'edit request')) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual([originalCode]);
    });
  });

  describe('Error Handling', () => {
    it('handles various error types appropriately', async () => {
      const testCases = [
        {
          error: new Error('API Key not configured'),
          expectedMessage: 'API Key Required',
        },
        {
          error: new Error('Daily API quota exhausted'),
          expectedMessage: 'Daily Quota Exceeded',
        },
        {
          error: Object.assign(new Error('Rate limit'), { status: 429 }),
          expectedMessage: 'Rate Limited',
        },
        {
          error: new Error('Network request failed'),
          expectedMessage: 'Network Error',
        },
        {
          error: new Error('Request timeout'),
          expectedMessage: 'Request Timeout',
        },
      ];

      for (const { error, expectedMessage } of testCases) {
        mockLocalStorage['lovable_gemini_api_key'] = 'valid-api-key';

        const mockModel = {
          generateContentStream: vi.fn().mockRejectedValue(error),
        };

        const mockClient = {
          getGenerativeModel: vi.fn().mockReturnValue(mockModel),
        };

        (mockGoogleGenAI.GoogleGenAI as any).mockImplementation(() => mockClient);

        const chunks: string[] = [];
        for await (const chunk of streamIdeaResponse('test')) {
          chunks.push(chunk);
        }

        expect(chunks[0]).toContain(expectedMessage);
      }
    });
  });
});