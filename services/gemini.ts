import { GoogleGenAI, Type } from "@google/genai";

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
        id: 'gemini-2.0-flash',
        displayName: 'Gemini 2.0 Flash',
        description: 'Fast & efficient, great for quick tasks',
        tier: 'free'
    },
    {
        id: 'gemini-1.5-flash',
        displayName: 'Gemini 1.5 Flash',
        description: 'Balanced speed and quality',
        tier: 'free'
    },
    {
        id: 'gemini-1.5-pro',
        displayName: 'Gemini 1.5 Pro',
        description: 'Best quality, complex reasoning',
        tier: 'paid'
    },
];

// Default model (most accessible)
const DEFAULT_MODEL = 'gemini-2.0-flash';

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

        if (error.message?.includes("API Key")) {
            yield "⚠️ Please configure your API Key in settings to use AI features.";
        } else if (error.message?.includes("Daily API quota")) {
            yield `⚠️ ${error.message}`;
        } else if (error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")) {
            yield "⚠️ Server is busy (Rate Limit). Please wait a moment and try again.";
        } else {
            yield `⚠️ Error: ${error.message || 'Unknown error'}`;
        }
    }
}

export async function generateVibeIdeas(): Promise<string[]> {
    try {
        const { modelId } = getSettings();
        const ai = getAIClient();

        const response = await withRetry(async () => {
            return await ai.models.generateContent({
                model: modelId,
                contents: "Generate 5 short, distinct, and creative web app ideas for 2025. They should be specific and trendy.",
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                }
            });
        }, 'VibeIdeas');

        if (response.text) return JSON.parse(response.text);
        return [];
    } catch (error) {
        console.error("Error generating vibes:", error);
        // Fallback ideas
        return ["Futuristic Dashboard", "AI Fitness Tracker", "Retro Portfolio", "Crypto Vibe", "Smart Recipe App"];
    }
}

export async function* streamAppCode(plan: string) {
    try {
        const { modelId } = getSettings();
        const ai = getAIClient();

        const response = await withRetry(async () => {
            return await ai.models.generateContentStream({
                model: modelId,
                contents: `Create a single-file, fully functional, responsive HTML prototype using Tailwind CSS for the following project plan.
                
                PLAN:
                ${plan}
                
                REQUIREMENTS:
                1. Use <script src="https://cdn.tailwindcss.com"></script> for styling.
                2. Use <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"> for icons.
                3. Use Google Fonts (Inter).
                4. **IMAGES**: Use https://images.unsplash.com or https://picsum.photos/seed/{keyword}/800/600.
                5. **DESIGN**: Modern, Glassmorphism, Premium.
                6. **FUNCTIONALITY**: Write VALID Vanilla JS. All buttons must work. Forms must handle submit.
                7. **OUTPUT**: Return ONLY raw HTML code. No markdown.
                `,
                config: {
                    systemInstruction: "You are an expert Full Stack Engineer. You write clean, semantic HTML5/Tailwind/JS. You never create static shells; your prototypes are always interactive."
                }
            });
        }, 'CodeGeneration');

        for await (const chunk of response) {
            if (chunk.text) yield chunk.text;
        }
    } catch (error: any) {
        console.error("Error generating code:", error);

        if (error.message?.includes("Daily API quota")) {
            yield `<!-- ${error.message} -->`;
        } else {
            yield "<!-- Error generating code. Please check API Key or Quota. -->";
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