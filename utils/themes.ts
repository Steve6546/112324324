// Enhanced theme system with colors and adaptive themes
export interface ThemeDefinition {
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

// Get adaptive theme based on system preference
export const getAdaptiveTheme = (): ThemeDefinition => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? THEMES.find(t => t.id === 'adaptive-dark')! : THEMES.find(t => t.id === 'adaptive-light')!;
};