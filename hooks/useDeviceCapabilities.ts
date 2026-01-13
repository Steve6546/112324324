import { useState, useEffect } from 'react';

interface DeviceCapabilities {
  // Hardware capabilities
  hasTouch: boolean;
  hasHapticFeedback: boolean;
  hasSpeechRecognition: boolean;
  hasSpeechSynthesis: boolean;
  hasGeolocation: boolean;
  hasCamera: boolean;
  hasMicrophone: boolean;
  hasAccelerometer: boolean;
  hasGyroscope: boolean;

  // Performance capabilities
  isLowEndDevice: boolean;
  prefersReducedMotion: boolean;
  prefersDarkMode: boolean;
  prefersHighContrast: boolean;

  // Network capabilities
  connectionSpeed: 'slow' | 'fast' | 'unknown';
  isOnline: boolean;

  // Screen capabilities
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  pixelRatio: number;
  isRetina: boolean;
  hasHover: boolean;
  hasFinePointer: boolean;

  // Browser capabilities
  supportsWebGL: boolean;
  supportsWebRTC: boolean;
  supportsServiceWorker: boolean;
  supportsIndexedDB: boolean;
  supportsWebAssembly: boolean;
}

const detectScreenSize = (): DeviceCapabilities['screenSize'] => {
  if (typeof window === 'undefined') return 'md';

  const width = window.innerWidth;
  if (width < 375) return 'xs';
  if (width < 640) return 'sm';
  if (width < 768) return 'md';
  if (width < 1024) return 'lg';
  return 'xl';
};

const detectConnectionSpeed = (): DeviceCapabilities['connectionSpeed'] => {
  if (typeof navigator === 'undefined') return 'unknown';

  // @ts-ignore - Connection API
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  if (connection) {
    const effectiveType = connection.effectiveType;
    if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow';
    if (effectiveType === '3g') return 'slow';
    if (effectiveType === '4g') return 'fast';
  }

  // Fallback: check if images load quickly
  return 'unknown';
};

const detectHardwareConcurrency = (): boolean => {
  if (typeof navigator === 'undefined') return false;

  // Consider devices with less than 4 cores as low-end
  return (navigator.hardwareConcurrency || 4) < 4;
};

const detectWebGLSupport = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
             canvas.getContext('webgl'));
  } catch (e) {
    return false;
  }
};

export const useDeviceCapabilities = () => {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    // Hardware capabilities
    hasTouch: false,
    hasHapticFeedback: false,
    hasSpeechRecognition: false,
    hasSpeechSynthesis: false,
    hasGeolocation: false,
    hasCamera: false,
    hasMicrophone: false,
    hasAccelerometer: false,
    hasGyroscope: false,

    // Performance capabilities
    isLowEndDevice: false,
    prefersReducedMotion: false,
    prefersDarkMode: false,
    prefersHighContrast: false,

    // Network capabilities
    connectionSpeed: 'unknown',
    isOnline: true,

    // Screen capabilities
    screenSize: 'md',
    pixelRatio: 1,
    isRetina: false,
    hasHover: false,
    hasFinePointer: false,

    // Browser capabilities
    supportsWebGL: false,
    supportsWebRTC: false,
    supportsServiceWorker: false,
    supportsIndexedDB: false,
    supportsWebAssembly: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateCapabilities = () => {
      const newCapabilities: DeviceCapabilities = {
        // Hardware capabilities
        hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        hasHapticFeedback: 'vibrate' in navigator,
        hasSpeechRecognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
        hasSpeechSynthesis: 'speechSynthesis' in window,
        hasGeolocation: 'geolocation' in navigator,
        hasCamera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        hasMicrophone: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        hasAccelerometer: 'DeviceMotionEvent' in window,
        hasGyroscope: 'DeviceOrientationEvent' in window,

        // Performance capabilities
        isLowEndDevice: detectHardwareConcurrency(),
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
        prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,

        // Network capabilities
        connectionSpeed: detectConnectionSpeed(),
        isOnline: navigator.onLine,

        // Screen capabilities
        screenSize: detectScreenSize(),
        pixelRatio: window.devicePixelRatio || 1,
        isRetina: (window.devicePixelRatio || 1) > 1,
        hasHover: window.matchMedia('(hover: hover)').matches,
        hasFinePointer: window.matchMedia('(pointer: fine)').matches,

        // Browser capabilities
        supportsWebGL: detectWebGLSupport(),
        supportsWebRTC: !!(window.RTCPeerConnection || (window as any).webkitRTCPeerConnection),
        supportsServiceWorker: 'serviceWorker' in navigator,
        supportsIndexedDB: !!(window.indexedDB || (window as any).webkitIndexedDB || (window as any).mozIndexedDB),
        supportsWebAssembly: typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function',
      };

      setCapabilities(newCapabilities);
    };

    updateCapabilities();

    // Listen for changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const hoverQuery = window.matchMedia('(hover: hover)');
    const pointerQuery = window.matchMedia('(pointer: fine)');

    const handleChange = () => updateCapabilities();
    const handleResize = () => updateCapabilities();
    const handleOnline = () => setCapabilities(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setCapabilities(prev => ({ ...prev, isOnline: false }));

    mediaQuery.addListener(handleChange);
    contrastQuery.addListener(handleChange);
    motionQuery.addListener(handleChange);
    hoverQuery.addListener(handleChange);
    pointerQuery.addListener(handleChange);

    window.addEventListener('resize', handleResize);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      mediaQuery.removeListener(handleChange);
      contrastQuery.removeListener(handleChange);
      motionQuery.removeListener(handleChange);
      hoverQuery.removeListener(handleChange);
      pointerQuery.removeListener(handleChange);

      window.removeEventListener('resize', handleResize);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return capabilities;
};

// Hook for progressive enhancement based on capabilities
export const useProgressiveEnhancement = () => {
  const capabilities = useDeviceCapabilities();

  // Determine enhancement levels
  const enhancementLevel = {
    // Basic: works on all devices
    basic: true,

    // Standard: enhanced interactions
    standard: !capabilities.isLowEndDevice && capabilities.connectionSpeed !== 'slow',

    // Advanced: rich interactions and animations
    advanced: capabilities.supportsWebGL &&
              !capabilities.prefersReducedMotion &&
              capabilities.connectionSpeed === 'fast' &&
              !capabilities.isLowEndDevice,

    // Premium: all features enabled
    premium: capabilities.supportsWebRTC &&
             capabilities.hasSpeechRecognition &&
             capabilities.hasHapticFeedback &&
             capabilities.connectionSpeed === 'fast',
  };

  // Feature flags based on capabilities
  const features = {
    // UI Features
    enableAnimations: !capabilities.prefersReducedMotion && !capabilities.isLowEndDevice,
    enableHoverEffects: capabilities.hasHover,
    enableTouchGestures: capabilities.hasTouch,
    enableHapticFeedback: capabilities.hasHapticFeedback,

    // Voice Features
    enableVoiceCommands: capabilities.hasSpeechRecognition && capabilities.hasMicrophone,
    enableSpeechSynthesis: capabilities.hasSpeechSynthesis,

    // Media Features
    enableCamera: capabilities.hasCamera,
    enableRealTime: capabilities.supportsWebRTC && capabilities.connectionSpeed === 'fast',

    // Performance Features
    enableComplexAnimations: enhancementLevel.advanced,
    enableBackgroundEffects: enhancementLevel.standard,
    enablePreloading: enhancementLevel.standard,

    // Accessibility Features
    enableHighContrast: capabilities.prefersHighContrast,
    enableReducedMotion: capabilities.prefersReducedMotion,
  };

  return {
    capabilities,
    enhancementLevel,
    features,
  };
};