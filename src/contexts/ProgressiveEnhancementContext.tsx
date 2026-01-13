import React, { createContext, useContext, ReactNode } from 'react';
import { useProgressiveEnhancement } from '../../hooks/useDeviceCapabilities';

interface ProgressiveEnhancementContextType {
  enhancementLevel: {
    basic: boolean;
    standard: boolean;
    advanced: boolean;
    premium: boolean;
  };
  features: {
    enableAnimations: boolean;
    enableHoverEffects: boolean;
    enableTouchGestures: boolean;
    enableHapticFeedback: boolean;
    enableVoiceCommands: boolean;
    enableSpeechSynthesis: boolean;
    enableCamera: boolean;
    enableRealTime: boolean;
    enableComplexAnimations: boolean;
    enableBackgroundEffects: boolean;
    enablePreloading: boolean;
    enableHighContrast: boolean;
    enableReducedMotion: boolean;
  };
}

const ProgressiveEnhancementContext = createContext<ProgressiveEnhancementContextType | null>(null);

interface ProgressiveEnhancementProviderProps {
  children: ReactNode;
}

export const ProgressiveEnhancementProvider: React.FC<ProgressiveEnhancementProviderProps> = ({
  children
}) => {
  const { enhancementLevel, features } = useProgressiveEnhancement();

  return (
    <ProgressiveEnhancementContext.Provider value={{
      enhancementLevel,
      features,
    }}>
      {children}
    </ProgressiveEnhancementContext.Provider>
  );
};

export const useProgressiveEnhancementContext = () => {
  const context = useContext(ProgressiveEnhancementContext);
  if (!context) {
    throw new Error('useProgressiveEnhancementContext must be used within ProgressiveEnhancementProvider');
  }
  return context;
};

// Higher-order component for progressive enhancement
export const withProgressiveEnhancement = <P extends object>(
  Component: React.ComponentType<P>,
  requiredFeatures?: (keyof ProgressiveEnhancementContextType['features'])[]
) => {
  return (props: P) => {
    const { features } = useProgressiveEnhancementContext();

    // Check if all required features are available
    if (requiredFeatures) {
      const hasAllFeatures = requiredFeatures.every(feature => features[feature]);
      if (!hasAllFeatures) {
        return null; // Don't render if required features aren't available
      }
    }

    return <Component {...props} />;
  };
};

// Hook for conditional rendering based on enhancement level
export const useEnhancementLevel = (minLevel: keyof ProgressiveEnhancementContextType['enhancementLevel']) => {
  const { enhancementLevel } = useProgressiveEnhancementContext();

  const levels = ['basic', 'standard', 'advanced', 'premium'] as const;
  const minLevelIndex = levels.indexOf(minLevel);
  const currentLevelIndex = levels.findIndex(level => enhancementLevel[level]);

  return currentLevelIndex >= minLevelIndex;
};

// Utility component for conditional rendering
interface EnhancementGateProps {
  minLevel?: keyof ProgressiveEnhancementContextType['enhancementLevel'];
  requiredFeatures?: (keyof ProgressiveEnhancementContextType['features'])[];
  fallback?: ReactNode;
  children: ReactNode;
}

export const EnhancementGate: React.FC<EnhancementGateProps> = ({
  minLevel,
  requiredFeatures,
  fallback = null,
  children,
}) => {
  const { enhancementLevel, features } = useProgressiveEnhancementContext();

  // Check minimum level
  if (minLevel) {
    const levels = ['basic', 'standard', 'advanced', 'premium'] as const;
    const minLevelIndex = levels.indexOf(minLevel);
    const currentLevelIndex = levels.findIndex(level => enhancementLevel[level]);

    if (currentLevelIndex < minLevelIndex) {
      return <>{fallback}</>;
    }
  }

  // Check required features
  if (requiredFeatures) {
    const hasAllFeatures = requiredFeatures.every(feature => features[feature]);
    if (!hasAllFeatures) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};