import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Paperclip, MessageSquare, Mic, Plus, LayoutTemplate, Image as ImageIcon, X, Check, MicOff, Zap, Layout, Database, Smartphone, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { generateVibeIdeas, getAllStoredVibeIdeas, updateVibeIdeaRating, incrementVibeUsage } from '../services/gemini';
import { useVoiceCommands } from '../hooks/useVoiceCommands';
import { useTouchGestures } from '../hooks/useTouchGestures';
import { useProgressiveEnhancementContext, EnhancementGate } from '../src/contexts/ProgressiveEnhancementContext';

interface InputSectionProps {
  onSubmit: (prompt: string, imageBase64?: string) => void;
  isGenerating: boolean;
}

// Enhanced theme system with colors and adaptive themes
interface ThemeDefinition {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    fontFamily: string;
    fontSize: string;
    lineHeight: string;
  };
  spacing: {
    borderRadius: string;
    padding: string;
  };
  animations: boolean;
  isAdaptive?: boolean; // Themes that adapt to system preferences
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'modern',
    name: 'Modern',
    colors: {
      primary: '#3b82f6',
      secondary: '#1e293b',
      accent: '#06b6d4',
      background: '#0f172a',
      text: '#f8fafc'
    },
    typography: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px',
      lineHeight: '1.5'
    },
    spacing: {
      borderRadius: '12px',
      padding: '16px'
    },
    animations: true
  },
  {
    id: 'brutalist',
    name: 'Brutalist',
    colors: {
      primary: '#000000',
      secondary: '#ffffff',
      accent: '#ff0000',
      background: '#000000',
      text: '#ffffff'
    },
    typography: {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      lineHeight: '1.4'
    },
    spacing: {
      borderRadius: '0px',
      padding: '12px'
    },
    animations: false
  },
  {
    id: 'playful',
    name: 'Playful',
    colors: {
      primary: '#ec4899',
      secondary: '#f0abfc',
      accent: '#fbbf24',
      background: '#581c87',
      text: '#fef3c7'
    },
    typography: {
      fontFamily: 'Comic Sans MS, cursive',
      fontSize: '18px',
      lineHeight: '1.6'
    },
    spacing: {
      borderRadius: '24px',
      padding: '20px'
    },
    animations: true
  },
  {
    id: 'corporate',
    name: 'Corporate',
    colors: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#60a5fa',
      background: '#ffffff',
      text: '#1f2937'
    },
    typography: {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      lineHeight: '1.4'
    },
    spacing: {
      borderRadius: '4px',
      padding: '12px'
    },
    animations: false
  },
  {
    id: 'minimal',
    name: 'Minimal',
    colors: {
      primary: '#6b7280',
      secondary: '#9ca3af',
      accent: '#d1d5db',
      background: '#ffffff',
      text: '#111827'
    },
    typography: {
      fontFamily: 'Helvetica, sans-serif',
      fontSize: '15px',
      lineHeight: '1.5'
    },
    spacing: {
      borderRadius: '2px',
      padding: '8px'
    },
    animations: false
  },
  // Adaptive themes that change with system preferences
  {
    id: 'adaptive-light',
    name: 'Adaptive Light',
    colors: {
      primary: '#2563eb',
      secondary: '#e5e7eb',
      accent: '#10b981',
      background: '#ffffff',
      text: '#111827'
    },
    typography: {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      lineHeight: '1.5'
    },
    spacing: {
      borderRadius: '8px',
      padding: '16px'
    },
    animations: true,
    isAdaptive: true
  },
  {
    id: 'adaptive-dark',
    name: 'Adaptive Dark',
    colors: {
      primary: '#3b82f6',
      secondary: '#374151',
      accent: '#06b6d4',
      background: '#111827',
      text: '#f9fafb'
    },
    typography: {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      lineHeight: '1.5'
    },
    spacing: {
      borderRadius: '8px',
      padding: '16px'
    },
    animations: true,
    isAdaptive: true
  }
];

// Get theme by ID
export const getThemeById = (themeId: string): ThemeDefinition | undefined => {
  return THEMES.find(theme => theme.id === themeId);
};

// Get adaptive theme based on system preferences
const getAdaptiveTheme = (): ThemeDefinition => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? THEMES.find(t => t.id === 'adaptive-dark')! : THEMES.find(t => t.id === 'adaptive-light')!;
};

// Legacy theme names for backward compatibility
const LEGACY_THEMES = ['Modern', 'Brutalist', 'Playful', 'Corporate', 'Minimal'];

const QUICK_ACTIONS = [
    { label: 'Landing Page', icon: Layout, prompt: "Create a high-conversion landing page for..." },
    { label: 'Admin Dashboard', icon: Database, prompt: "Build an admin dashboard to manage..." },
    { label: 'Mobile App', icon: Smartphone, prompt: "Design a mobile-first app for..." },
    { label: 'Internal Tool', icon: Zap, prompt: "Create an internal tool to automate..." },
];

// Voice training and correction system
interface VoiceProfile {
  userId: string;
  accent: string;
  commonPhrases: string[];
  correctionHistory: Array<{
    said: string;
    meant: string;
    timestamp: Date;
    frequency: number;
  }>;
}

interface VoicePrivacySettings {
  allowContinuousListening: boolean;
  requireWakeWord: boolean;
  wakeWords: string[];
  autoStopAfterSilence: number;
  maxRecordingTime: number;
}

// Load voice profile from localStorage
const loadVoiceProfile = (): VoiceProfile => {
  try {
    const stored = localStorage.getItem('lovable_voice_profile');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        correctionHistory: parsed.correctionHistory.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
      };
    }
  } catch (error) {
    console.error('Error loading voice profile:', error);
  }

  // Default profile
  return {
    userId: crypto.randomUUID(),
    accent: 'neutral',
    commonPhrases: ['create', 'make', 'build', 'submit', 'clear'],
    correctionHistory: []
  };
};

// Save voice profile to localStorage
const saveVoiceProfile = (profile: VoiceProfile): void => {
  try {
    localStorage.setItem('lovable_voice_profile', JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving voice profile:', error);
  }
};

// Load voice privacy settings
const loadVoicePrivacySettings = (): VoicePrivacySettings => {
  try {
    const stored = localStorage.getItem('lovable_voice_privacy');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading voice privacy settings:', error);
  }

  // Default privacy settings
  return {
    allowContinuousListening: false,
    requireWakeWord: true,
    wakeWords: ['hey lovable', 'لوفابل'],
    autoStopAfterSilence: 5000,
    maxRecordingTime: 30000
  };
};

// Automatic transcription correction
const correctTranscription = (transcript: string): string => {
  const corrections: Record<string, string> = {
    'كرييت': 'create',
    'ميك': 'make',
    'صابميت': 'submit',
    'كلير': 'clear',
    'بيلد': 'build',
    'ستارت': 'start',
    'ستوب': 'stop',
    'أنشئ': 'create',
    'اصنع': 'make',
    'أرسل': 'submit',
    'امسح': 'clear'
  };

  let corrected = transcript.toLowerCase().trim();

  // Apply corrections
  Object.entries(corrections).forEach(([wrong, correct]) => {
    corrected = corrected.replace(new RegExp(wrong, 'gi'), correct);
  });

  return corrected;
};

// Update voice profile with correction
const updateVoiceProfile = (said: string, meant: string): void => {
  const profile = loadVoiceProfile();
  const existingCorrection = profile.correctionHistory.find(
    c => c.said === said && c.meant === meant
  );

  if (existingCorrection) {
    existingCorrection.frequency += 1;
    existingCorrection.timestamp = new Date();
  } else {
    profile.correctionHistory.push({
      said,
      meant,
      timestamp: new Date(),
      frequency: 1
    });
  }

  // Keep only recent corrections (last 100)
  profile.correctionHistory = profile.correctionHistory
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 100);

  saveVoiceProfile(profile);
};

// Voice Privacy Settings Component
const VoicePrivacySettings: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  settings: VoicePrivacySettings;
  onSettingsChange: (settings: VoicePrivacySettings) => void;
}> = ({ isOpen, onClose, settings, onSettingsChange }) => {
  if (!isOpen) return null;

  const updateSetting = <K extends keyof VoicePrivacySettings>(
    key: K,
    value: VoicePrivacySettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1f1f22] border border-white/10 rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Voice Privacy Settings</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Wake Word Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Require Wake Word
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.requireWakeWord}
                  onChange={(e) => updateSetting('requireWakeWord', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-400">
                  Only respond when you say the wake word
                </span>
              </div>
            </div>

            {/* Wake Words */}
            {settings.requireWakeWord && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Wake Words
                </label>
                <div className="flex flex-wrap gap-2">
                  {settings.wakeWords.map((word, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm"
                    >
                      {word}
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add new wake word..."
                  className="mt-2 w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      updateSetting('wakeWords', [
                        ...settings.wakeWords,
                        e.currentTarget.value.trim()
                      ]);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            )}

            {/* Auto-stop Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Auto-stop After Silence (seconds)
              </label>
              <input
                type="range"
                min="1"
                max="30"
                value={settings.autoStopAfterSilence / 1000}
                onChange={(e) => updateSetting('autoStopAfterSilence', parseInt(e.target.value) * 1000)}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-xs text-gray-400 mt-1">
                {settings.autoStopAfterSilence / 1000} seconds
              </div>
            </div>

            {/* Max Recording Time */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Maximum Recording Time (seconds)
              </label>
              <input
                type="range"
                min="10"
                max="120"
                value={settings.maxRecordingTime / 1000}
                onChange={(e) => updateSetting('maxRecordingTime', parseInt(e.target.value) * 1000)}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-xs text-gray-400 mt-1">
                {settings.maxRecordingTime / 1000} seconds
              </div>
            </div>

            {/* Continuous Listening */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Continuous Listening
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.allowContinuousListening}
                  onChange={(e) => updateSetting('allowContinuousListening', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-400">
                  Keep listening until manually stopped (uses more battery)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-700">
            <button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Voice feedback utilities
const playAudioFeedback = async (type: 'start' | 'success' | 'error'): Promise<void> => {
  try {
    // Create audio context for better audio control
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Create oscillator for synthetic feedback
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure based on feedback type
    switch (type) {
      case 'start':
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
        break;

      case 'success':
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
        break;

      case 'error':
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
        break;
    }
  } catch (error) {
    // Fallback: show toast notification
    console.warn('Audio feedback not available:', error);
  }
};

// Waveform Animation Component
const WaveformAnimation: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="flex items-center justify-center h-full">
        <div className="flex items-end gap-0.5">
          {[1, 2, 3, 4, 5].map((bar, index) => (
            <div
              key={bar}
              className="w-1 bg-red-500 rounded-full animate-pulse"
              style={{
                height: `${Math.random() * 20 + 5}px`,
                animationDelay: `${index * 0.1}s`,
                animationDuration: '0.8s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const InputSection: React.FC<InputSectionProps> = ({ onSubmit, isGenerating }) => {
  const { features } = useProgressiveEnhancementContext();

  const [prompt, setPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showThemePreview, setShowThemePreview] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<ThemeDefinition | null>(null);
  const [showMobileThemeSheet, setShowMobileThemeSheet] = useState(false);
  const [showVoicePrivacySettings, setShowVoicePrivacySettings] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);

  // Vibe State - Enhanced with local storage and smart updates
  const [vibeIdeas, setVibeIdeas] = useState<string[]>([]);
  const [allStoredIdeas, setAllStoredIdeas] = useState<any[]>([]);
  const [isLoadingVibes, setIsLoadingVibes] = useState(false);
  const [showVibeMenu, setShowVibeMenu] = useState(false);
  const [currentVibeIndex, setCurrentVibeIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const vibeMenuRef = useRef<HTMLDivElement>(null);
  const vibeListRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  // Theme preference management with localStorage fallback
  const saveThemePreference = useCallback((themeId: string) => {
    try {
      localStorage.setItem('lovable_theme', themeId);
    } catch (error) {
      // Fallback for devices that don't support localStorage
      document.cookie = `lovable_theme=${themeId};max-age=31536000;path=/`;
    }
  }, []);

  const loadThemePreference = useCallback((): string | null => {
    try {
      // Try localStorage first
      const stored = localStorage.getItem('lovable_theme');
      if (stored) return stored;

      // Fallback to cookie
      const cookies = document.cookie.split(';');
      const themeCookie = cookies.find(cookie => cookie.trim().startsWith('lovable_theme='));
      if (themeCookie) {
        return themeCookie.split('=')[1];
      }
    } catch (error) {
      // If both fail, return null
    }
    return null;
  }, []);

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = loadThemePreference();
    if (savedTheme) {
      setSelectedTheme(savedTheme);
    }
  }, [loadThemePreference]);

  // Apply theme instantly when selected
  const applyTheme = useCallback((theme: ThemeDefinition) => {
    const root = document.documentElement;

    // Apply CSS custom properties
    root.style.setProperty('--theme-primary', theme.colors.primary);
    root.style.setProperty('--theme-secondary', theme.colors.secondary);
    root.style.setProperty('--theme-accent', theme.colors.accent);
    root.style.setProperty('--theme-background', theme.colors.background);
    root.style.setProperty('--theme-text', theme.colors.text);

    // Apply typography
    root.style.setProperty('--theme-font-family', theme.typography.fontFamily);
    root.style.setProperty('--theme-font-size', theme.typography.fontSize);
    root.style.setProperty('--theme-line-height', theme.typography.lineHeight);

    // Apply spacing
    root.style.setProperty('--theme-border-radius', theme.spacing.borderRadius);
    root.style.setProperty('--theme-padding', theme.spacing.padding);

    // Apply animations preference
    root.style.setProperty('--theme-animations', theme.animations ? 'all' : 'none');
  }, []);

  // Apply selected theme
  useEffect(() => {
    if (selectedTheme) {
      const theme = getThemeById(selectedTheme) || getAdaptiveTheme();
      applyTheme(theme);
    }
  }, [selectedTheme, applyTheme]);

  // Auto-update adaptive themes when system preferences change
  useEffect(() => {
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Only update if using adaptive theme
      if (selectedTheme?.startsWith('adaptive-')) {
        const adaptiveTheme = getAdaptiveTheme();
        applyTheme(adaptiveTheme);
      }
    };

    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');

    darkModeQuery.addListener(handleSystemThemeChange);
    contrastQuery.addListener(handleSystemThemeChange);

    return () => {
      darkModeQuery.removeListener(handleSystemThemeChange);
      contrastQuery.removeListener(handleSystemThemeChange);
    };
  }, [selectedTheme, applyTheme]);

  // Handle theme selection with instant application
  const handleThemeSelect = useCallback((themeId: string) => {
    const theme = getThemeById(themeId) || getAdaptiveTheme();
    setSelectedTheme(themeId);
    applyTheme(theme);
    saveThemePreference(themeId);
    setShowThemeMenu(false);
    setShowThemePreview(false);
  }, [applyTheme, saveThemePreference]);

  // Handle theme preview
  const handleThemePreview = useCallback((theme: ThemeDefinition) => {
    setPreviewTheme(theme);
    applyTheme(theme); // Apply instantly for preview
    setShowThemePreview(true);
  }, [applyTheme]);

  // Cancel theme preview
  const cancelThemePreview = useCallback(() => {
    setShowThemePreview(false);
    setPreviewTheme(null);
    // Re-apply the selected theme
    if (selectedTheme) {
      const theme = getThemeById(selectedTheme) || getAdaptiveTheme();
      applyTheme(theme);
    }
  }, [selectedTheme, applyTheme]);

  // Voice privacy settings handlers
  const handleVoicePrivacySettingsChange = useCallback((newSettings: VoicePrivacySettings) => {
    setVoicePrivacy(newSettings);
    try {
      localStorage.setItem('lovable_voice_privacy', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving voice privacy settings:', error);
    }
  }, []);

  // Voice profile and privacy settings state
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile>(loadVoiceProfile);
  const [voicePrivacy, setVoicePrivacy] = useState<VoicePrivacySettings>(loadVoicePrivacySettings);

  // Enhanced Voice Commands - Only if supported
  const voiceCommandsEnabled = features.enableVoiceCommands;
  const { isListening, transcript, toggleListening, resetTranscript, isSupported } = useVoiceCommands({
    commands: voiceCommandsEnabled ? [
      {
        keywords: navigator.language.startsWith('ar')
          ? ['أنشئ', 'اصنع', 'بنِ', 'create', 'make', 'build', 'new']
          : ['create', 'make', 'build', 'new'],
        action: (spokenText) => {
          const cleanPrompt = spokenText.replace(
            navigator.language.startsWith('ar')
              ? /^(أنشئ|اصنع|بنِ|create|make|build|new)/i
              : /^(create|make|build|new)/i,
            ''
          ).trim();
          setPrompt(cleanPrompt);
          textareaRef.current?.focus();
        },
        description: navigator.language.startsWith('ar') ? 'إنشاء مشروع جديد' : 'Create a new project',
      },
      {
        keywords: navigator.language.startsWith('ar')
          ? ['مسح', 'نظف', 'أعد', 'clear', 'reset', 'empty']
          : ['clear', 'reset', 'empty'],
        action: () => {
          setPrompt('');
          resetTranscript();
        },
        description: navigator.language.startsWith('ar') ? 'مسح الإدخال' : 'Clear the input',
      },
      {
        keywords: navigator.language.startsWith('ar')
          ? ['أرسل', 'أكد', 'submit', 'send', 'go']
          : ['submit', 'send', 'go'],
        action: () => {
          if (prompt.trim()) {
            handleSend();
          }
        },
        description: navigator.language.startsWith('ar') ? 'إرسال الطلب' : 'Submit the prompt',
      },
    ] : [],
    language: navigator.language.startsWith('ar') ? 'ar-SA' : 'en-US',
    continuous: false,
    interimResults: true,
  });

  // Touch Gestures for input area - Only if touch is supported
  useTouchGestures(inputContainerRef, {
    onLongPress: () => {
      if (voiceCommandsEnabled && isSupported && !isListening) {
        toggleListening();
      }
    },
    longPressDelay: 500,
  });

  // Swipe gestures for vibe navigation on mobile
  useTouchGestures(vibeListRef, {
    onSwipeLeft: () => {
      // Navigate to next vibe idea
      if (showVibeMenu && vibeIdeas.length > 1) {
        setCurrentVibeIndex(prev => (prev + 1) % vibeIdeas.length);
      }
    },
    onSwipeRight: () => {
      // Navigate to previous vibe idea
      if (showVibeMenu && vibeIdeas.length > 1) {
        setCurrentVibeIndex(prev => (prev - 1 + vibeIdeas.length) % vibeIdeas.length);
      }
    },
    threshold: 30, // Lower threshold for better mobile experience
  });


  const handleSend = useCallback(async () => {
    let currentPrompt = isListening && transcript ? transcript : prompt;

    // Apply automatic transcription correction if voice input
    if (isListening && transcript) {
      const corrected = correctTranscription(transcript);
      if (corrected !== transcript.toLowerCase().trim()) {
        // Update profile with the correction
        updateVoiceProfile(transcript.toLowerCase().trim(), corrected);
        currentPrompt = corrected;

        // Play success feedback
        await playAudioFeedback('success');
      }
    }

    if ((!currentPrompt.trim() && !selectedFile) || isGenerating) return;

    // Construct the prompt with theme info
    let finalPrompt = currentPrompt;

    if (selectedTheme) {
        const theme = getThemeById(selectedTheme) || getAdaptiveTheme();
        finalPrompt += ` [Style: ${theme.name}]`;
    }

    // Pass the raw file preview (base64) if it exists
    onSubmit(finalPrompt, filePreview || undefined);

    setPrompt('');
    resetTranscript();
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    // Keep theme selected
  }, [prompt, transcript, isListening, selectedFile, filePreview, selectedTheme, isGenerating, onSubmit, resetTranscript]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Read file as data URL for preview and sending
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearAttachment = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const handleQuickAction = (actionPrompt: string) => {
      setPrompt(actionPrompt + " ");
      setShowPlusMenu(false);
      textareaRef.current?.focus();
  };

  const handleVibesClick = async () => {
      // If we already have ideas and menu is open, just toggle close
      if (showVibeMenu) {
          setShowVibeMenu(false);
          return;
      }

      // If we have ideas but menu is closed, open it
      if (vibeIdeas.length > 0) {
          setShowVibeMenu(true);
          return;
      }

      // Fetch new ideas (smart system will avoid duplicates)
      setIsLoadingVibes(true);
      const newIdeas = await generateVibeIdeas();
      setVibeIdeas(prevIdeas => [...prevIdeas, ...newIdeas]);
      setIsLoadingVibes(false);
      setShowVibeMenu(true);
  };

  const handleVibeSelect = (idea: string) => {
      setPrompt(idea);
      setShowVibeMenu(false);

      // Track usage for smart recommendations
      incrementVibeUsage(idea);

      // Auto-select a random theme to match the "Vibe"
      if (!selectedTheme) {
        const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
        setSelectedTheme(randomTheme);
      }

      textareaRef.current?.focus();
  };

  // Load stored vibe ideas on mount
  useEffect(() => {
    const storedIdeas = getAllStoredVibeIdeas();
    setAllStoredIdeas(storedIdeas);

    // If we have stored ideas, show the top 5 most used ones
    if (storedIdeas.length > 0) {
      const topIdeas = storedIdeas
        .sort((a, b) => b.usedCount - a.usedCount)
        .slice(0, 5)
        .map(idea => idea.text);
      setVibeIdeas(topIdeas);
    }
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
            setShowThemeMenu(false);
        }
        if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
            setShowPlusMenu(false);
        }
        if (vibeMenuRef.current && !vibeMenuRef.current.contains(event.target as Node) && !(event.target as Element).closest('#vibe-btn')) {
             setShowVibeMenu(false);
        }
    };

    if (showThemeMenu || showPlusMenu || showVibeMenu) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showThemeMenu, showPlusMenu, showVibeMenu]);

  return (
    <>
      <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 relative z-20 flex flex-col items-center pb-3 sm:pb-4 min-w-0 touch-pan-y">
        {/* Pill Label / Vibe Button - Now visible on mobile with improved design */}
        <div className="mb-4 sm:mb-6 lg:mb-8 animate-fade-in-up relative block">
            <button
                id="vibe-btn"
                onClick={handleVibesClick}
                disabled={isLoadingVibes}
                className={`cursor-pointer bg-white/10 hover:bg-white/15 border border-white/10 rounded-full pl-2 xs:pl-3 sm:pl-4 pr-1.5 xs:pr-2 sm:pr-3 py-1 xs:py-1.5 text-xs xs:text-sm sm:text-sm text-gray-200 backdrop-blur-md transition-all flex items-center gap-0.5 xs:gap-1 sm:gap-2 shadow-sm group active:scale-95 touch-manipulation ${isLoadingVibes ? 'opacity-80' : ''}`}
            >
                {isLoadingVibes ? (
                    <Loader2 size={10} className="animate-spin text-blue-400 xs:w-[12px] xs:h-[12px] sm:w-[14px] sm:h-[14px]" />
                ) : (
                    <Sparkles size={10} className={`text-yellow-400 group-hover:rotate-12 transition-transform xs:w-[12px] xs:h-[12px] sm:w-[14px] sm:h-[14px]`} />
                )}
                <span className="hidden xs:inline sm:inline">{isLoadingVibes ? "Generating vibes..." : "Your 2025 Lovable Vibes are here"}</span>
                <span className="xs:hidden">{isLoadingVibes ? "Generating..." : "Vibes"}</span>
                <span className="text-gray-400 group-hover:translate-x-1 transition-transform flex items-center">
                  <ArrowRight size={10} className="xs:w-[12px] xs:h-[12px] sm:w-[14px] sm:h-[14px]" />
                </span>
            </button>

            {/* Vibe Dropdown Menu - Enhanced for mobile with swipe navigation */}
            {showVibeMenu && vibeIdeas.length > 0 && (
                <div
                    ref={vibeMenuRef}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-80 max-w-[calc(100vw-2rem)] bg-[#1f1f22]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in origin-top"
                >
                    <div className="p-2">
                        <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center">
                            <span>Fresh Ideas</span>
                            <div className="flex items-center gap-2">
                                <button onClick={handleVibesClick} className="hover:text-white transition-colors p-1">
                                    <span className="sr-only">Refresh</span>
                                    ⟳
                                </button>
                            </div>
                        </div>

                        {/* Mobile: Single idea with swipe navigation */}
                        <div className="block sm:hidden">
                            <div ref={vibeListRef} className="relative">
                                <button
                                    onClick={() => handleVibeSelect(vibeIdeas[currentVibeIndex])}
                                    className="w-full text-left px-3 py-4 text-sm text-gray-300 hover:text-white hover:bg-blue-500/10 hover:border-blue-500/20 border border-transparent rounded-xl transition-all duration-200 group relative overflow-hidden touch-manipulation"
                                >
                                    <span className="relative z-10 block min-h-[3rem] flex items-center">{vibeIdeas[currentVibeIndex]}</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                </button>

                                {/* Swipe indicator dots */}
                                {vibeIdeas.length > 1 && (
                                    <div className="flex justify-center gap-1 mt-2">
                                        {vibeIdeas.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                                    idx === currentVibeIndex ? 'bg-blue-400' : 'bg-gray-600'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Swipe hint */}
                                <div className="text-xs text-gray-500 text-center mt-1">
                                    Swipe left/right to navigate
                                </div>
                            </div>
                        </div>

                        {/* Desktop: Full list */}
                        <div className="hidden sm:block space-y-1" ref={vibeListRef}>
                            {vibeIdeas.map((idea, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleVibeSelect(idea)}
                                    className="w-full text-left px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-blue-500/10 hover:border-blue-500/20 border border-transparent rounded-xl transition-all duration-200 group relative overflow-hidden"
                                >
                                    <span className="relative z-10">{idea}</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Main Heading */}
        <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-4 xs:mb-6 sm:mb-8 tracking-tight text-center drop-shadow-lg leading-tight break-words px-2">
            Got an idea, <span className="font-arabic text-blue-400 break-words">طـهـي</span>?
        </h1>

        {/* Input Container - Mobile-first with enhanced touch and voice interactions */}
        <div
          ref={inputContainerRef}
          className={`w-full bg-[#18181b]/90 backdrop-blur-xl border rounded-2xl xs:rounded-3xl p-3 xs:p-4 shadow-2xl transition-all duration-300 sm:relative sticky bottom-4 touch-pan-y
            ${isGenerating ? 'border-blue-500/50 shadow-blue-500/10' : 'border-white/10 focus-within:border-white/20 focus-within:ring-1 focus-within:ring-white/10'}
            ${isListening ? 'ring-2 ring-red-500/50 shadow-red-500/20' : ''}
          `}
        >
            {/* Keyboard Shortcuts Hint - Hidden on mobile */}
            <div className="hidden sm:flex justify-end mb-2">
                <div className="text-[10px] text-gray-500 bg-black/20 px-2 py-1 rounded-md break-words">
                    Press <kbd className="bg-white/10 px-1 rounded text-[9px]">Enter</kbd> to send
                </div>
            </div>
            <textarea
                ref={textareaRef}
                value={isListening && transcript ? transcript : prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isListening
                    ? navigator.language.startsWith('ar')
                      ? `جاري الاستماع... ${transcript ? '(قل "أرسل" للإرسال)' : ''}`
                      : `Listening... ${transcript ? '(Say "submit" to send)' : ''}`
                    : navigator.language.startsWith('ar')
                      ? "اطلب من Lovable إنشاء تطبيق... (اضغط مطولاً للإدخال الصوتي)"
                      : "Ask Lovable to create an app... (Long press to voice input)"
                }
                disabled={isGenerating}
                className={`w-full bg-transparent text-white text-sm sm:text-base lg:text-lg placeholder-gray-500 px-2 sm:px-3 py-2 min-h-[45px] sm:min-h-[50px] lg:min-h-[60px] max-h-[120px] sm:max-h-[150px] lg:max-h-[200px] resize-none focus:outline-none scrollbar-hide disabled:opacity-50 placeholder:text-gray-500 break-words min-w-0 transition-colors ${
                  isListening ? 'ring-1 ring-blue-400/50' : ''
                }`}
                rows={1}
            />
            
            {/* Hidden File Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
            />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 xs:mt-3 px-1 relative gap-2 xs:gap-3 min-w-0">
                <div className="flex items-center gap-1 xs:gap-2 sm:gap-2 flex-wrap min-w-0">
                    {/* Plus Button with Menu - Enhanced touch target */}
                    <div className="relative" ref={plusMenuRef}>
                        <button
                            onClick={() => setShowPlusMenu(!showPlusMenu)}
                            className={`cursor-pointer p-2 xs:p-3 rounded-full transition-all duration-200 active:scale-tap touch-manipulation ${showPlusMenu ? 'bg-white/10 text-white scale-105' : 'text-gray-400 hover:text-white hover:bg-white/10 hover:scale-105'}`}
                        >
                            <Plus size={18} className="xs:w-5 xs:h-5" />
                        </button>

                         {/* Quick Actions Dropdown */}
                         {showPlusMenu && (
                            <div className="absolute top-full left-0 mt-2 w-56 bg-[#1f1f22] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in-up">
                                <div className="p-1.5">
                                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Start with</div>
                                    {QUICK_ACTIONS.map((action) => (
                                        <button
                                            key={action.label}
                                            onClick={() => handleQuickAction(action.prompt)}
                                            className="w-full text-left px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg flex items-center gap-3 group transition-colors"
                                        >
                                            <action.icon size={16} className="text-blue-400 group-hover:text-blue-300" />
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Attach Button - Mobile optimized */}
                    <button
                        onClick={handleAttachClick}
                        className={`cursor-pointer flex items-center gap-1 xs:gap-2 px-2 xs:px-3 py-2 xs:py-2.5 rounded-full border transition-all duration-200 active:scale-tap touch-manipulation text-xs xs:text-sm font-medium min-w-0 flex-shrink-0 min-h-[40px] ${selectedFile ? 'bg-blue-500/20 border-blue-500/30 text-blue-200 hover:bg-blue-500/30 scale-105' : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border-white/5 hover:scale-105'}`}
                    >
                        {selectedFile ? <ImageIcon size={14} className="xs:w-[16px] xs:h-[16px]" /> : <Paperclip size={14} className="xs:w-[16px] xs:h-[16px]" />}
                        <span className="break-words truncate max-w-[80px] xs:max-w-[120px] sm:max-w-[150px]">{selectedFile ? selectedFile.name : 'Attach'}</span>
                        {selectedFile && (
                             <div role="button" onClick={clearAttachment} className="hover:text-white p-1 xs:p-0.5 rounded-full hover:bg-white/20 ml-1 flex-shrink-0 min-w-[24px] min-h-[24px] flex items-center justify-center">
                                <X size={10} className="xs:w-[12px] xs:h-[12px]" />
                            </div>
                        )}
                    </button>

                    {/* Theme Button - Hidden on mobile, replaced with bottom sheet */}
                    <div className="relative hidden sm:block" ref={themeMenuRef}>
                        <button
                            onClick={() => setShowThemeMenu(!showThemeMenu)}
                            className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-sm font-medium min-w-0 ${selectedTheme ? 'bg-purple-500/20 border-purple-500/30 text-purple-200 hover:bg-purple-500/30' : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border-white/5'}`}
                        >
                            <LayoutTemplate size={16} />
                            <span className="break-words">{selectedTheme || 'Theme'}</span>
                            {selectedTheme && (
                                <div role="button" onClick={(e) => { e.stopPropagation(); setSelectedTheme(null); }} className="hover:text-white p-0.5 rounded-full hover:bg-white/20 ml-1 flex-shrink-0">
                                    <X size={12} />
                                </div>
                            )}
                        </button>
                        
                        {/* Theme Dropdown - Enhanced with preview */}
                        {showThemeMenu && (
                            <div className="absolute top-full left-0 mt-2 w-56 bg-[#1f1f22] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in-up">
                                <div className="p-1.5">
                                    {THEMES.slice(0, 5).map(theme => (
                                        <button
                                            key={theme.id}
                                            onClick={() => handleThemePreview(theme)}
                                            className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg flex items-center justify-between group transition-colors"
                                        >
                                            <span>{theme.name}</span>
                                            <div className="flex items-center gap-1">
                                                {selectedTheme === theme.id && <Check size={14} className="text-purple-400" />}
                                                <span className="text-xs opacity-50">👁</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Theme Preview Modal */}
                        {showThemePreview && previewTheme && (
                            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                <div className="bg-[#1f1f22] border border-white/10 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-white">
                                                Preview: {previewTheme.name}
                                            </h3>
                                            <button
                                                onClick={cancelThemePreview}
                                                className="text-gray-400 hover:text-white transition-colors"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>

                                        {/* Live Preview */}
                                        <div className="space-y-4">
                                            <div
                                                className="p-4 rounded-lg border"
                                                style={{
                                                    backgroundColor: previewTheme.colors.background,
                                                    color: previewTheme.colors.text,
                                                    borderRadius: previewTheme.spacing.borderRadius,
                                                    fontFamily: previewTheme.typography.fontFamily,
                                                    fontSize: previewTheme.typography.fontSize,
                                                    lineHeight: previewTheme.typography.lineHeight
                                                }}
                                            >
                                                <h4 style={{ color: previewTheme.colors.primary }} className="font-bold mb-2">
                                                    Sample Heading
                                                </h4>
                                                <p className="mb-2">This is how your text will look with this theme.</p>
                                                <button
                                                    className="px-3 py-1 rounded text-white text-sm"
                                                    style={{
                                                        backgroundColor: previewTheme.colors.accent,
                                                        borderRadius: previewTheme.spacing.borderRadius
                                                    }}
                                                >
                                                    Sample Button
                                                </button>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleThemeSelect(previewTheme.id)}
                                                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                                                >
                                                    Apply Theme
                                                </button>
                                                <button
                                                    onClick={cancelThemePreview}
                                                    className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 xs:gap-3 sm:gap-2 min-w-0">
                    {/* Mobile theme button - shows as bottom sheet */}
                    <button
                        onClick={() => setShowMobileThemeSheet(true)}
                        className={`cursor-pointer sm:hidden flex items-center justify-center w-10 h-10 xs:w-11 xs:h-11 rounded-full border transition-all duration-200 active:scale-tap touch-manipulation flex-shrink-0 ${selectedTheme ? 'bg-purple-500/20 border-purple-500/30 text-purple-200 scale-105' : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border-white/5 hover:scale-105'}`}
                    >
                        <LayoutTemplate size={14} className="xs:w-[16px] xs:h-[16px]" />
                    </button>

                    {/* Mobile Theme Bottom Sheet */}
                    {showMobileThemeSheet && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 sm:hidden">
                            {/* Backdrop */}
                            <div
                                className="absolute inset-0"
                                onClick={() => setShowMobileThemeSheet(false)}
                            />

                            {/* Bottom Sheet */}
                            <div className="absolute bottom-0 left-0 right-0 bg-[#1f1f22] border-t border-white/10 rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out">
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-white">Choose Theme</h3>
                                        <button
                                            onClick={() => setShowMobileThemeSheet(false)}
                                            className="text-gray-400 hover:text-white transition-colors p-1"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        {THEMES.map(theme => (
                                            <button
                                                key={theme.id}
                                                onClick={() => {
                                                    handleThemePreview(theme);
                                                    setShowMobileThemeSheet(false);
                                                }}
                                                className={`p-3 rounded-xl border transition-all text-left ${
                                                    selectedTheme === theme.id
                                                        ? 'border-purple-500/50 bg-purple-500/10'
                                                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium text-white">{theme.name}</span>
                                                    {selectedTheme === theme.id && (
                                                        <Check size={14} className="text-purple-400" />
                                                    )}
                                                </div>
                                                <div
                                                    className="w-full h-2 rounded-full"
                                                    style={{ backgroundColor: theme.colors.primary }}
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    <div className="text-xs text-gray-400 text-center">
                                        Tap any theme to preview it
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-1 xs:gap-2 sm:gap-2 flex-wrap min-w-0">
                         <button
                            onClick={handleSend}
                            disabled={(!prompt.trim() && !selectedFile) || isGenerating}
                            className={`cursor-pointer flex items-center gap-1 xs:gap-2 sm:gap-2 px-3 xs:px-4 sm:px-3 lg:px-4 py-2 xs:py-3 rounded-full font-medium transition-all duration-200 active:scale-tap touch-manipulation text-xs xs:text-sm sm:text-sm lg:text-base min-w-0 flex-shrink-0 min-h-[44px] ${
                                (prompt.trim() || selectedFile)
                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:scale-105'
                                : 'bg-[#27272a] text-gray-500 cursor-not-allowed'
                            }`}
                         >
                            {isGenerating ? (
                                <div className="w-3 h-3 xs:w-4 xs:h-4 sm:w-4 sm:h-4 lg:w-5 lg:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <MessageSquare size={14} className="xs:w-[16px] xs:h-[16px] sm:w-[16px] sm:h-[16px] lg:w-[18px] lg:h-[18px]" fill="currentColor" />
                            )}
                            <span className="break-words sm:inline">{isGenerating ? '...' : 'Chat'}</span>
                        </button>
                        <div className="flex items-center gap-1 xs:gap-2">
                          <EnhancementGate
                            requiredFeatures={['enableVoiceCommands']}
                            fallback={
                              <div className="w-10 h-10 xs:w-11 xs:h-11 rounded-full bg-gray-800/50 flex items-center justify-center opacity-50">
                                <Mic size={16} className="xs:w-[20px] xs:h-[20px] text-gray-600" />
                              </div>
                            }
                          >
                            <button
                              onClick={async () => {
                                const wasListening = isListening;
                                toggleListening();

                                // Play audio feedback
                                if (!wasListening) {
                                  await playAudioFeedback('start');
                                }
                              }}
                              disabled={!isSupported}
                              className={`cursor-pointer p-2 xs:p-3 sm:p-2.5 rounded-full transition-all duration-200 active:scale-tap touch-manipulation min-w-0 flex-shrink-0 min-w-[44px] min-h-[44px] relative ${
                                isListening
                                  ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 scale-110 animate-bounce-subtle ring-2 ring-red-500/50'
                                  : isSupported
                                  ? 'hover:bg-white/10 text-gray-400 hover:text-white hover:scale-105'
                                  : 'opacity-50 cursor-not-allowed text-gray-600'
                              }`}
                            >
                              {isListening ? (
                                <>
                                  <MicOff size={16} className="xs:w-[20px] xs:h-[20px] sm:w-[20px] sm:h-[20px] animate-pulse relative z-10" />
                                  <WaveformAnimation isActive={true} />
                                </>
                              ) : (
                                <Mic size={16} className="xs:w-[20px] xs:h-[20px] sm:w-[20px] sm:h-[20px] relative z-10" />
                              )}
                            </button>
                          </EnhancementGate>

                          {/* Voice Privacy Settings Button */}
                          <EnhancementGate
                            requiredFeatures={['enableVoiceCommands']}
                            fallback={
                              <div className="w-8 h-8 rounded-full bg-gray-800/50 flex items-center justify-center opacity-50">
                                <div className="w-3 h-3 bg-gray-600 rounded-full" />
                              </div>
                            }
                          >
                            <button
                              onClick={() => setShowVoicePrivacySettings(true)}
                              className="cursor-pointer w-8 h-8 xs:w-9 xs:h-9 rounded-full transition-all duration-200 active:scale-tap touch-manipulation flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white hover:scale-105"
                              title="Voice Privacy Settings"
                            >
                              <div className="w-3 h-3 bg-current rounded-full opacity-60" />
                            </button>
                          </EnhancementGate>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Voice Privacy Settings Modal */}
        <VoicePrivacySettings
          isOpen={showVoicePrivacySettings}
          onClose={() => setShowVoicePrivacySettings(false)}
          settings={voicePrivacy}
          onSettingsChange={handleVoicePrivacySettingsChange}
        />
      </div>
    </>
  );
};

export default InputSection;