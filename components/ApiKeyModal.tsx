import React, { useState, useEffect } from 'react';
import { Key, X, Check, ExternalLink } from 'lucide-react';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (key: string) => void;
    currentKey?: string;
}

// Store API key in localStorage
const API_KEY_STORAGE = 'lovable_gemini_api_key';

export const getStoredApiKey = (): string | null => {
    return localStorage.getItem(API_KEY_STORAGE);
};

export const setStoredApiKey = (key: string): void => {
    localStorage.setItem(API_KEY_STORAGE, key);
};

export const clearStoredApiKey = (): void => {
    localStorage.removeItem(API_KEY_STORAGE);
};

export const hasValidApiKey = (): boolean => {
    const key = getStoredApiKey();
    return !!key && key.length > 20;
};

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, currentKey }) => {
    const [apiKey, setApiKey] = useState(currentKey || '');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setApiKey(currentKey || getStoredApiKey() || '');
        }
    }, [isOpen, currentKey]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (apiKey.trim().length > 20) {
            setStoredApiKey(apiKey.trim());
            onSave(apiKey.trim());
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#121214]">
                    <div className="flex items-center gap-2 text-blue-400">
                        <Key size={18} />
                        <span className="font-semibold text-sm">API Key Setup</span>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded-md">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-gray-400 text-sm mb-4">
                        Enter your Gemini API key to enable AI features. Your key is stored locally in your browser.
                    </p>

                    <div className="relative mb-4">
                        <input
                            type={isVisible ? 'text' : 'password'}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="AIza..."
                            className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-3 pr-20 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 font-mono"
                        />
                        <button
                            onClick={() => setIsVisible(!isVisible)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs px-2 py-1 rounded"
                        >
                            {isVisible ? 'Hide' : 'Show'}
                        </button>
                    </div>

                    <a
                        href="https://aistudio.google.com/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm mb-6"
                    >
                        <ExternalLink size={14} />
                        Get your API key from Google AI Studio
                    </a>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-gray-400 hover:text-white border border-white/10 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={apiKey.trim().length < 20}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Check size={16} />
                            Save Key
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyModal;
