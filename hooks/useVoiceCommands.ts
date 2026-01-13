import { useState, useEffect, useRef, useCallback } from 'react';

interface VoiceCommand {
  keywords: string[];
  action: (transcript: string) => void;
  description: string;
}

interface VoiceCommandsOptions {
  commands?: VoiceCommand[];
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  autoStart?: boolean;
}

export const useVoiceCommands = (options: VoiceCommandsOptions = {}) => {
  const {
    commands = [],
    language = 'en-US',
    continuous = false,
    interimResults = false,
    autoStart = false,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');

  // Check for browser support
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
    } else {
      setError('Speech recognition is not supported in this browser');
    }
  }, []);

  // Initialize recognition
  useEffect(() => {
    if (!isSupported) return;

    try {
      // @ts-ignore - Webkit speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        transcriptRef.current = '';
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        transcriptRef.current = currentTranscript;
        setTranscript(currentTranscript);

        // Process commands if we have final results
        if (finalTranscript && commands.length > 0) {
          processVoiceCommand(finalTranscript.toLowerCase().trim());
        }
      };

      recognitionRef.current = recognition;
    } catch (err) {
      setError('Failed to initialize speech recognition');
    }
  }, [isSupported, continuous, interimResults, language, commands]);

  const processVoiceCommand = useCallback((spokenText: string) => {
    for (const command of commands) {
      const matchedKeyword = command.keywords.find(keyword =>
        spokenText.includes(keyword.toLowerCase())
      );

      if (matchedKeyword) {
        command.action(spokenText);
        break;
      }
    }
  }, [commands]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        setError('Failed to start speech recognition');
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    transcriptRef.current = '';
  }, []);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && isSupported && !isListening) {
      const timer = setTimeout(() => {
        startListening();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [autoStart, isSupported, isListening, startListening]);

  return {
    isListening,
    transcript,
    isSupported,
    error,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
};

// Get language-specific commands
const getLanguageCommands = (language: string): VoiceCommand[] => {
  const isArabic = language.startsWith('ar');

  if (isArabic) {
    return [
      {
        keywords: ['أنشئ', 'اصنع', 'بنِ', 'مشروع جديد', 'ابدأ مشروع', 'create', 'make', 'build'],
        action: (transcript) => {
          const prompt = transcript
            .replace(/^(أنشئ|اصنع|بنِ|مشروع جديد|ابدأ مشروع|create|make|build)/i, '')
            .trim();
          return prompt || 'أنشئ تطبيق جديد';
        },
        description: 'إنشاء مشروع جديد',
      },
      {
        keywords: ['افتح', 'اظهر', 'حمّل', 'open', 'show', 'load'],
        action: (transcript) => {
          const projectName = transcript
            .replace(/^(افتح|اظهر|حمّل|open|show|load)/i, '')
            .trim();
          return projectName;
        },
        description: 'فتح مشروع',
      },
      {
        keywords: ['احذف', 'أزل', 'امسح', 'delete', 'remove', 'erase'],
        action: (transcript) => {
          const projectName = transcript
            .replace(/^(احذف|أزل|امسح|delete|remove|erase)/i, '')
            .trim();
          return projectName;
        },
        description: 'حذف مشروع',
      },
      {
        keywords: ['الرئيسية', 'المنزل', 'لوحة التحكم', 'home', 'main', 'dashboard'],
        action: () => 'navigate_home',
        description: 'الذهاب للصفحة الرئيسية',
      },
      {
        keywords: ['الإعدادات', 'التفضيلات', 'الإعداد', 'settings', 'preferences', 'config'],
        action: () => 'show_settings',
        description: 'فتح الإعدادات',
      },
      {
        keywords: ['ابدأ التسجيل', 'سجّل', 'start recording', 'begin recording', 'record'],
        action: () => 'start_recording',
        description: 'بدء التسجيل الصوتي',
      },
      {
        keywords: ['توقف عن التسجيل', 'أنهِ التسجيل', 'stop recording', 'end recording', 'finish'],
        action: () => 'stop_recording',
        description: 'إيقاف التسجيل الصوتي',
      },
      {
        keywords: ['مسح', 'نظف', 'أعد', 'clear', 'reset', 'empty'],
        action: () => 'clear_input',
        description: 'مسح الإدخال',
      },
      {
        keywords: ['أرسل', 'أكد', 'submit', 'send', 'go'],
        action: () => 'submit_prompt',
        description: 'إرسال الطلب',
      },
    ];
  }

  // English commands (default)
  return [
    {
      keywords: ['create', 'make', 'build', 'new project', 'start project'],
      action: (transcript) => {
        const prompt = transcript.replace(/^(create|make|build|new project|start project)/i, '').trim();
        return prompt || 'Create a new app';
      },
      description: 'Create a new project',
    },
    {
      keywords: ['open', 'show', 'load'],
      action: (transcript) => {
        const projectName = transcript.replace(/^(open|show|load)/i, '').trim();
        return projectName;
      },
      description: 'Open a project',
    },
    {
      keywords: ['delete', 'remove', 'erase'],
      action: (transcript) => {
        const projectName = transcript.replace(/^(delete|remove|erase)/i, '').trim();
        return projectName;
      },
      description: 'Delete a project',
    },
    {
      keywords: ['home', 'main', 'dashboard'],
      action: () => 'navigate_home',
      description: 'Go to home page',
    },
    {
      keywords: ['settings', 'preferences', 'config'],
      action: () => 'show_settings',
      description: 'Open settings',
    },
    {
      keywords: ['start recording', 'begin recording', 'record'],
      action: () => 'start_recording',
      description: 'Start voice recording',
    },
    {
      keywords: ['stop recording', 'end recording', 'finish'],
      action: () => 'stop_recording',
      description: 'Stop voice recording',
    },
    {
      keywords: ['clear', 'reset', 'empty'],
      action: () => 'clear_input',
      description: 'Clear the input',
    },
    {
      keywords: ['submit', 'send', 'go'],
      action: () => 'submit_prompt',
      description: 'Submit the prompt',
    },
  ];
};

// Predefined voice commands for the app
export const useAppVoiceCommands = (callbacks: {
  onCreateProject?: (prompt: string) => void;
  onOpenProject?: (projectName: string) => void;
  onDeleteProject?: (projectName: string) => void;
  onNavigateHome?: () => void;
  onShowSettings?: () => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onClearInput?: () => void;
  onSubmitPrompt?: () => void;
}) => {
  const language = navigator.language || 'en-US';
  const commands = getLanguageCommands(language);

  const { isListening, transcript, toggleListening, resetTranscript, isSupported } = useVoiceCommands({
    commands: commands.map(cmd => ({
      keywords: cmd.keywords,
      action: (transcript) => {
        const result = cmd.action(transcript);

        // Handle different action types
        if (typeof result === 'string') {
          switch (result) {
            case 'navigate_home':
              callbacks.onNavigateHome?.();
              break;
            case 'show_settings':
              callbacks.onShowSettings?.();
              break;
            case 'start_recording':
              callbacks.onStartRecording?.();
              break;
            case 'stop_recording':
              callbacks.onStopRecording?.();
              break;
            case 'clear_input':
              callbacks.onClearInput?.();
              break;
            case 'submit_prompt':
              callbacks.onSubmitPrompt?.();
              break;
            default:
              // If it's not a special command, treat as project-related
              if (cmd.keywords.some(k => ['create', 'make', 'build', 'أنشئ', 'اصنع', 'بنِ'].includes(k))) {
                callbacks.onCreateProject?.(result);
              } else if (cmd.keywords.some(k => ['open', 'show', 'load', 'افتح', 'اظهر', 'حمّل'].includes(k))) {
                callbacks.onOpenProject?.(result);
              } else if (cmd.keywords.some(k => ['delete', 'remove', 'erase', 'احذف', 'أزل', 'امسح'].includes(k))) {
                callbacks.onDeleteProject?.(result);
              }
          }
        }
      },
      description: cmd.description,
    })),
    language,
    continuous: false,
    interimResults: true,
  });

  return {
    isListening,
    transcript,
    toggleListening,
    resetTranscript,
    isSupported,
    language,
  };
};