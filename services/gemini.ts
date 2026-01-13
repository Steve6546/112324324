import { GoogleGenAI, Type } from "@google/genai";
import { THEMES, getThemeById } from '../components/InputSection';

// --- Official Google GenAI Model IDs ---
// Reference: https://ai.google.dev/gemini-api/docs/models
// IMPORTANT: Only use official model IDs from Google documentation

export interface ModelInfo {
    id: string;          // Official Model ID (used in API calls)
    displayName: string; // Human-readable name
    description: string; // Brief description
    tier: 'free' | 'paid';
}

export const AVAILABLE_MODELS: ModelInfo[] = [
    {
        id: 'gemini-3-flash',
        displayName: 'Gemini 3 Flash',
        description: 'أحدث وأسرع نموذج من Google، مثالي للمهام السريعة',
        tier: 'free'
    },
    {
        id: 'gemini-3-pro',
        displayName: 'Gemini 3 Pro',
        description: 'أقوى نموذج احترافي، مثالي للمهام المعقدة والتحليل المتقدم',
        tier: 'paid'
    },
    {
        id: 'gemini-2.5-flash',
        displayName: 'Gemini 2.5 Flash',
        description: 'نموذج متقدم سريع ومتوازن للمهام اليومية',
        tier: 'free'
    },
    {
        id: 'gemini-2.5-pro',
        displayName: 'Gemini 2.5 Pro',
        description: 'نموذج احترافي متقدم للتحليل المعقد والمهام المتخصصة',
        tier: 'paid'
    },
];

// Default model (most accessible)
const DEFAULT_MODEL = 'gemini-3-flash';

// --- Settings Management ---

const getSettings = () => {
    if (typeof window === 'undefined') {
        return { apiKey: '', modelId: DEFAULT_MODEL };
    }
    return {
        apiKey: localStorage.getItem('lovable_gemini_api_key') || '',
        modelId: localStorage.getItem('lovable_gemini_model') || DEFAULT_MODEL
    };
};

export const hasValidApiKey = (): boolean => {
    const { apiKey } = getSettings();
    return !!apiKey && apiKey.length > 20;
};

export const saveSettings = (apiKey: string, modelId: string) => {
    localStorage.setItem('lovable_gemini_api_key', apiKey);
    localStorage.setItem('lovable_gemini_model', modelId);
};

const getAIClient = () => {
    const { apiKey } = getSettings();
    if (!apiKey) {
        throw new Error('API Key not configured. Please open Settings and add your Gemini API key.');
    }
    return new GoogleGenAI({ apiKey });
};

// --- Retry System with Exponential Backoff + Jitter ---

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000;
const MAX_DELAY_MS = 60000;

interface RetryError extends Error {
    status?: number;
    isQuotaExhausted?: boolean;
    isDailyQuota?: boolean;
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Determines if an error is retryable and what kind
 */
function analyzeError(error: any): RetryError {
    const retryError = new Error(error.message || 'Unknown error') as RetryError;
    retryError.status = error.status;

    const message = error.message?.toLowerCase() || '';

    // Rate limit (temporary)
    if (error.status === 429 || message.includes('429') || message.includes('resource_exhausted')) {
        retryError.isQuotaExhausted = true;

        // Check if it's daily quota (not just rate limit)
        if (message.includes('quota') && (message.includes('daily') || message.includes('per day'))) {
            retryError.isDailyQuota = true;
        }
    }

    return retryError;
}

/**
 * Calculate delay with exponential backoff + jitter
 */
function calculateDelay(attempt: number): number {
    const exponentialDelay = BASE_DELAY_MS * Math.pow(2, attempt);
    const jitter = Math.random() * 1000; // 0-1000ms random jitter
    return Math.min(exponentialDelay + jitter, MAX_DELAY_MS);
}

/**
 * Smart Retry Wrapper
 * - Exponential backoff with jitter
 * - Detects daily quota vs rate limit
 * - Clear error reporting
 */
async function withRetry<T>(
    operation: () => Promise<T>,
    context: string = 'Operation'
): Promise<T> {
    let lastError: RetryError | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = analyzeError(error);

            // If daily quota exhausted, don't retry - inform user immediately
            if (lastError.isDailyQuota) {
                throw new Error(
                    `Daily API quota exhausted. Options:\n` +
                    `1. Wait until tomorrow (quota resets daily)\n` +
                    `2. Use a different API key\n` +
                    `3. Upgrade to a paid plan`
                );
            }

            // If retryable and not last attempt, wait and retry
            if (lastError.isQuotaExhausted && attempt < MAX_RETRIES - 1) {
                const delay = calculateDelay(attempt);
                console.warn(
                    `[${context}] Rate limited. Retry ${attempt + 1}/${MAX_RETRIES} in ${Math.round(delay / 1000)}s...`
                );
                await wait(delay);
                continue;
            }

            // Not retryable or max attempts reached
            throw error;
        }
    }

    throw lastError || new Error('Max retries exceeded');
}

// --- API Functions ---

export async function* streamIdeaResponse(prompt: string, imageBase64?: string) {
    try {
        const { modelId } = getSettings();
        const parts: any[] = [{ text: prompt }];

        if (imageBase64) {
            const match = imageBase64.match(/^data:(image\/[a-z]+);base64,(.+)$/);
            if (match) {
                parts.unshift({
                    inlineData: { mimeType: match[1], data: match[2] }
                });
            }
        }

        const ai = getAIClient();

        const response = await withRetry(async () => {
            return await ai.models.generateContentStream({
                model: modelId,
                contents: [{ role: 'user', parts: parts }],
                config: {
                    systemInstruction: "You are an AI assistant for a web creation tool called 'Lovable'. Your tone is helpful, creative, and enthusiastic. The user is asking to create an internal tool or app. If an image is provided, analyze it as a wireframe or reference. Provide a structured plan including: 1) Core Features, 2) Data Structure, 3) Color Palette (Hex codes). Use simple formatting.",
                },
            });
        }, 'IdeaGeneration');

        for await (const chunk of response) {
            if (chunk.text) yield chunk.text;
        }

    } catch (error: any) {
        console.error("Error calling Gemini API:", error);

        // Provide user-friendly error messages based on error type
        if (error.message?.includes("API Key")) {
            yield "🔑 **API Key Required**\n\nPlease configure your Gemini API key in Settings to use AI features.\n\n1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)\n2. Create a new API key\n3. Click Settings in the app and enter your key";
        } else if (error.message?.includes("Daily API quota")) {
            yield "📊 **Daily Quota Exceeded**\n\nYou've reached your daily API limit. Options:\n\n• Wait until tomorrow (quota resets daily)\n• Use a different API key\n• Upgrade to a paid plan for higher limits\n• Try again later";
        } else if (error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")) {
            yield "⏳ **Rate Limited**\n\nThe API is temporarily busy. This usually resolves automatically in:\n\n• 1-2 minutes for light usage\n• 5-10 minutes for heavy usage\n\nPlease wait and try again.";
        } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
            yield "🌐 **Network Error**\n\nUnable to connect to AI services. Please check:\n\n• Your internet connection\n• Firewall/antivirus settings\n• Try refreshing the page";
        } else if (error.message?.includes("timeout")) {
            yield "⏰ **Request Timeout**\n\nThe AI request took too long to complete. This can happen with:\n\n• Complex prompts (try simplifying)\n• Network issues\n• High server load\n\nTry again with a shorter prompt.";
        } else {
            yield `❌ **AI Service Error**\n\n${error.message || 'An unexpected error occurred'}\n\nIf this persists:\n• Check your API key is valid\n• Try a different AI model\n• Refresh the page and try again`;
        }
    }
}

interface VibeIdea {
    id: string;
    text: string;
    category: string;
    rating: number;
    savedAt: Date;
    usedCount: number;
}

const VIBE_STORAGE_KEY = 'lovable_vibe_ideas';

// Get stored vibe ideas
const getStoredVibeIdeas = (): VibeIdea[] => {
    try {
        const stored = localStorage.getItem(VIBE_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return parsed.map((idea: any) => ({
                ...idea,
                savedAt: new Date(idea.savedAt)
            }));
        }
    } catch (error) {
        console.error('Error loading stored vibe ideas:', error);
    }
    return [];
};

// Save vibe ideas to localStorage
const saveVibeIdeas = (ideas: VibeIdea[]): void => {
    try {
        localStorage.setItem(VIBE_STORAGE_KEY, JSON.stringify(ideas));
    } catch (error) {
        console.error('Error saving vibe ideas:', error);
    }
};

// Get unique ideas avoiding duplicates
const getUniqueIdeas = (newIdeas: string[], existingIdeas: VibeIdea[]): string[] => {
    const existingTexts = new Set(existingIdeas.map(idea => idea.text.toLowerCase().trim()));
    return newIdeas.filter(idea => !existingTexts.has(idea.toLowerCase().trim()));
};

// Generate smart vibe ideas with local storage and duplicate avoidance
export async function generateVibeIdeas(): Promise<string[]> {
    try {
        const { modelId } = getSettings();
        const ai = getAIClient();

        // Get existing ideas to avoid duplicates
        const existingIdeas = getStoredVibeIdeas();
        const existingTexts = existingIdeas.map(idea => idea.text.toLowerCase());

        // Create prompt that avoids existing ideas
        let prompt = "Generate 5 short, distinct, and creative web app ideas for 2025. They should be specific and trendy.";
        if (existingTexts.length > 0) {
            prompt += `\n\nAvoid these existing ideas: ${existingTexts.slice(-10).join(', ')}`;
        }

        const response = await withRetry(async () => {
            return await ai.models.generateContent({
                model: modelId,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                }
            });
        }, 'VibeIdeas');

        let newIdeas: string[] = [];
        if (response.text) {
            newIdeas = JSON.parse(response.text);
        }

        // Filter out duplicates
        const uniqueIdeas = getUniqueIdeas(newIdeas, existingIdeas);

        // Save new ideas locally
        if (uniqueIdeas.length > 0) {
            const vibeIdeas: VibeIdea[] = [
                ...existingIdeas,
                ...uniqueIdeas.map(text => ({
                    id: crypto.randomUUID(),
                    text,
                    category: 'generated',
                    rating: 0,
                    savedAt: new Date(),
                    usedCount: 0
                }))
            ];
            saveVibeIdeas(vibeIdeas);
        }

        return uniqueIdeas.length > 0 ? uniqueIdeas : newIdeas;
    } catch (error) {
        console.error("Error generating vibes:", error);
        // Smart fallback that considers existing ideas
        const fallbackIdeas = ["Futuristic Dashboard", "AI Fitness Tracker", "Retro Portfolio", "Crypto Vibe", "Smart Recipe App"];
        const existingIdeas = getStoredVibeIdeas();
        const uniqueFallbacks = getUniqueIdeas(fallbackIdeas, existingIdeas);

        return uniqueFallbacks.length > 0 ? uniqueFallbacks : fallbackIdeas;
    }
}

// Get all stored vibe ideas
export const getAllStoredVibeIdeas = (): VibeIdea[] => {
    return getStoredVibeIdeas();
};

// Update vibe idea rating
export const updateVibeIdeaRating = (ideaId: string, rating: number): void => {
    const ideas = getStoredVibeIdeas();
    const ideaIndex = ideas.findIndex(idea => idea.id === ideaId);

    if (ideaIndex !== -1) {
        ideas[ideaIndex].rating = rating;
        saveVibeIdeas(ideas);
    }
};

// Increment usage count
export const incrementVibeUsage = (ideaText: string): void => {
    const ideas = getStoredVibeIdeas();
    const ideaIndex = ideas.findIndex(idea => idea.text === ideaText);

    if (ideaIndex !== -1) {
        ideas[ideaIndex].usedCount += 1;
        saveVibeIdeas(ideas);
    }
}

export async function* streamAppCode(plan: string, selectedTheme?: string) {
    try {
        const { modelId } = getSettings();
        const ai = getAIClient();

        // Get theme definition if selected
        const theme = selectedTheme ? getThemeById(selectedTheme) : null;

        const response = await withRetry(async () => {
            return await ai.models.generateContentStream({
                model: modelId,
                contents: `Create a single-file, fully functional, responsive HTML prototype using Tailwind CSS for the following project plan.

                PLAN:
                ${plan}

                ${theme ? `DESIGN REQUIREMENTS:
                - Colors: Primary(${theme.colors.primary}), Secondary(${theme.colors.secondary}), Accent(${theme.colors.accent})
                - Background: ${theme.colors.background}
                - Text: ${theme.colors.text}
                - Typography: ${theme.typography.fontFamily}, ${theme.typography.fontSize}
                - Spacing: Border Radius(${theme.spacing.borderRadius}), Padding(${theme.spacing.padding})
                - Animations: ${theme.animations ? 'Include smooth animations and transitions' : 'No animations, clean and minimal design'}
                - Style Approach: ${theme.name} design theme - apply these colors and styling throughout the application` : ''}

                REQUIREMENTS:
                1. Create a fully responsive design that works perfectly on mobile, tablet, and desktop.
                2. Use Tailwind CSS classes extensively for modern, beautiful styling.
                3. Use <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"> for icons.
                4. Use Google Fonts (Inter) for typography unless specified otherwise in the design requirements.
                5. **IMAGES**: Use https://images.unsplash.com or https://picsum.photos/seed/{keyword}/800/600.
                6. **DESIGN**: Modern, Glassmorphism, Premium, Mobile-first approach.
                7. **FUNCTIONALITY**: Write VALID Vanilla JS. All buttons must work. Forms must handle submit.
                8. **MOBILE FOCUS**: Prioritize mobile experience with touch-friendly interfaces.
                9. **OUTPUT**: Return ONLY raw HTML code. No markdown.
                `,
                config: {
                    systemInstruction: "You are an expert Full Stack Engineer specializing in mobile-first responsive design. You create beautiful, functional prototypes that work perfectly on mobile devices. Always prioritize mobile UX, use Tailwind CSS extensively for modern styling, and ensure all interactive elements work flawlessly. Focus on clean, semantic HTML5 with excellent mobile performance. When design requirements are provided, strictly follow the specified colors, typography, and spacing guidelines throughout the application."
                }
            });
        }, 'CodeGeneration');

        for await (const chunk of response) {
            if (chunk.text) yield chunk.text;
        }
    } catch (error: any) {
        console.error("Error generating code:", error);

        if (error.message?.includes("Daily API quota")) {
            yield `<!-- Daily API quota exceeded. Please try again tomorrow or use a different API key. -->`;
        } else if (error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")) {
            yield "<!-- AI service is temporarily busy. Please wait a moment and try again. -->";
        } else if (error.message?.includes("API Key")) {
            yield "<!-- API key not configured. Please set up your Gemini API key in Settings. -->";
        } else {
            yield `<!-- Error generating code: ${error.message || 'Unknown error'}. Please check your API key and try again. -->`;
        }
    }
}

export async function* streamCodeEdit(currentCode: string, prompt: string) {
    try {
        const { modelId } = getSettings();
        const ai = getAIClient();

        const response = await withRetry(async () => {
            return await ai.models.generateContentStream({
                model: modelId,
                contents: `The user wants to update the following HTML code.
                
                CURRENT CODE:
                ${currentCode}
                
                USER REQUEST:
                ${prompt}
                
                REQUIREMENTS:
                1. Return the FULL updated HTML code. 
                2. Do not use markdown blocks.
                3. Maintain functionality.
                `,
                config: {
                    systemInstruction: "You are an expert Frontend Engineer. Implement changes precisely. Fix broken scripts."
                }
            });
        }, 'CodeEdit');

        for await (const chunk of response) {
            if (chunk.text) yield chunk.text;
        }
    } catch (error) {
        console.error("Error editing code:", error);
        yield currentCode;
    }
}

/**
 * Get current model info for display
 */
export function getCurrentModelInfo(): ModelInfo {
    const { modelId } = getSettings();
    return AVAILABLE_MODELS.find(m => m.id === modelId) || AVAILABLE_MODELS[0];
}