import React, { useState, useEffect } from 'react';
import { X, Save, Key, Cpu, AlertTriangle, CheckCircle, ChevronDown, Check } from 'lucide-react';
import { AVAILABLE_MODELS, saveSettings, ModelInfo } from '../services/gemini';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DEFAULT_MODEL = 'gemini-3-flash';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [apiKey, setApiKey] = useState('');
    const [modelId, setModelId] = useState(DEFAULT_MODEL);
    const [saved, setSaved] = useState(false);
    const [showModelDropdown, setShowModelDropdown] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const storedKey = localStorage.getItem('lovable_gemini_api_key') || '';
            const storedModel = localStorage.getItem('lovable_gemini_model') || DEFAULT_MODEL;
            setApiKey(storedKey);
            setModelId(storedModel);
            setSaved(false);
            setShowModelDropdown(false);
        }
    }, [isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showModelDropdown && !(event.target as Element).closest('.model-dropdown-container')) {
                setShowModelDropdown(false);
            }
        };

        if (showModelDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showModelDropdown]);

    const handleSave = () => {
        saveSettings(apiKey, modelId);
        setSaved(true);
        setTimeout(() => {
            onClose();
        }, 500);
    };

    if (!isOpen) return null;

    const selectedModel = AVAILABLE_MODELS.find(m => m.id === modelId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#18181b] w-full max-w-md rounded-xl border border-white/10 shadow-2xl overflow-hidden transform transition-all scale-100">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#09090b]">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Cpu size={16} className="text-blue-500" />
                        AI Configuration
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                    {/* API Key Section */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <Key size={12} /> Google Gemini API Key
                        </label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full bg-[#09090b] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600"
                        />
                        <p className="text-[10px] text-gray-500">
                            Get your key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Google AI Studio</a>.
                        </p>
                    </div>

                    {/* Model Section */}
                    <div className="space-y-3">
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <Cpu size={12} /> Model Selection
                        </label>

                        {/* Dropdown Button */}
                        <div className="relative model-dropdown-container">
                            <button
                                onClick={() => setShowModelDropdown(!showModelDropdown)}
                                className="w-full bg-[#09090b] border border-white/10 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:border-white/20 transition-all"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-300">
                                        {selectedModel?.displayName || 'اختر نموذج'}
                                    </span>
                                    {selectedModel?.tier === 'paid' && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium uppercase">
                                            Paid
                                        </span>
                                    )}
                                </div>
                                <ChevronDown size={16} className={`text-gray-400 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {showModelDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-[#09090b] border border-white/10 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                                    {AVAILABLE_MODELS.map((model) => (
                                        <button
                                            key={model.id}
                                            onClick={() => {
                                                setModelId(model.id);
                                                setShowModelDropdown(false);
                                            }}
                                            className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm text-gray-300 font-medium">
                                                        {model.displayName}
                                                    </div>
                                                    <div className="text-[11px] text-gray-500">
                                                        {model.description}
                                                    </div>
                                                </div>
                                                {modelId === model.id && (
                                                    <Check size={14} className="text-blue-500" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Selected Model Info */}
                        {selectedModel && (
                            <div className="bg-[#09090b] rounded-lg p-3 border border-white/5">
                                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Active Model ID</div>
                                <code className="text-xs text-green-400 font-mono">{selectedModel.id}</code>
                            </div>
                        )}
                    </div>

                    {/* Info Box */}
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex gap-3">
                        <AlertTriangle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                        <div className="text-xs text-yellow-200/80 leading-relaxed">
                            <strong>Rate Limits:</strong> Free tier has usage limits. The system automatically retries with exponential backoff.
                            If you hit daily quota, switch to a different API key or wait until tomorrow.
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-[#09090b] flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saved}
                        className={`px-4 py-2 text-white text-sm font-medium rounded-lg flex items-center gap-2 shadow-lg transition-all ${saved
                            ? 'bg-green-600 shadow-green-500/20'
                            : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                            }`}
                    >
                        {saved ? (
                            <>
                                <CheckCircle size={14} />
                                Saved!
                            </>
                        ) : (
                            <>
                                <Save size={14} />
                                Save Settings
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default SettingsModal;
