import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from './utils';
import { ProgressiveEnhancementProvider } from '../src/contexts/ProgressiveEnhancementContext';
import InputSection from '../../components/InputSection';
import { mockDeviceCapabilities } from './advanced-test-utils';

describe('Progressive Enhancement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Features (Always Available)', () => {
    it('works on low-end devices without advanced features', async () => {
      // Setup basic device capabilities
      mockDeviceCapabilities.desktopDevice();
      mockDeviceCapabilities.lowEndDevice();
      mockDeviceCapabilities.speechNotSupported();

      render(
        <ProgressiveEnhancementProvider>
          <InputSection onSubmit={vi.fn()} isGenerating={false} />
        </ProgressiveEnhancementProvider>
      );

      // Should still work with basic features
      await waitFor(() => {
        expect(screen.getByText(/Got an idea/)).toBeInTheDocument();
      });

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();

      // Should not have voice features on unsupported devices
      const voiceButton = screen.queryByRole('button', { name: /voice|microphone/i });
      expect(voiceButton).not.toBeInTheDocument();
    });

    it('handles text input and submission on any device', async () => {
      mockDeviceCapabilities.desktopDevice();

      const mockOnSubmit = vi.fn();

      render(
        <ProgressiveEnhancementProvider>
          <InputSection onSubmit={mockOnSubmit} isGenerating={false} />
        </ProgressiveEnhancementProvider>
      );

      await waitFor(() => {
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'Create a todo app' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(mockOnSubmit).toHaveBeenCalledWith('Create a todo app', undefined, false);
      });
    });
  });

  describe('Standard Features (Enhanced Experience)', () => {
    it('enables touch interactions on touch devices', async () => {
      mockDeviceCapabilities.touchDevice();
      mockDeviceCapabilities.speechNotSupported();

      render(
        <ProgressiveEnhancementProvider>
          <InputSection onSubmit={vi.fn()} isGenerating={false} />
        </ProgressiveEnhancementProvider>
      );

      await waitFor(() => {
        const input = screen.getByRole('textbox');
        expect(input).toHaveAttribute('inputmode'); // Touch-friendly input
      });
    });

    it('shows visual feedback for touch interactions', async () => {
      mockDeviceCapabilities.touchDevice();

      render(
        <ProgressiveEnhancementProvider>
          <InputSection onSubmit={vi.fn()} isGenerating={false} />
        </ProgressiveEnhancementProvider>
      );

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        // Buttons should have touch-friendly styling
        buttons.forEach(button => {
          expect(button).toHaveClass('active:scale-tap');
        });
      });
    });
  });

  describe('Advanced Features (Premium Experience)', () => {
    it('enables voice commands on supported devices', async () => {
      mockDeviceCapabilities.touchDevice();
      mockDeviceCapabilities.speechSupported();
      mockDeviceCapabilities.highEndDevice();

      render(
        <ProgressiveEnhancementProvider>
          <InputSection onSubmit={vi.fn()} isGenerating={false} />
        </ProgressiveEnhancementProvider>
      );

      await waitFor(() => {
        const voiceButton = screen.getByRole('button', { name: /voice|microphone/i });
        expect(voiceButton).toBeInTheDocument();
      });
    });

    it('adapts to different screen sizes', () => {
      // Test mobile-first responsive design
      mockDeviceCapabilities.touchDevice();

      // Mock small screen
      Object.defineProperty(window, 'innerWidth', { value: 375 });

      render(
        <ProgressiveEnhancementProvider>
          <InputSection onSubmit={vi.fn()} isGenerating={false} />
        </ProgressiveEnhancementProvider>
      );

      // Should use mobile-optimized layout
      const heading = screen.getByText(/Got an idea/);
      expect(heading).toHaveClass('text-xl'); // Smaller on mobile
    });

    it('handles network conditions gracefully', async () => {
      // Test with slow network
      mockDeviceCapabilities.desktopDevice();

      // Mock slow connection
      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: 'slow-2g' },
        configurable: true,
      });

      render(
        <ProgressiveEnhancementProvider>
          <InputSection onSubmit={vi.fn()} isGenerating={false} />
        </ProgressiveEnhancementProvider>
      );

      // Should still work but maybe with reduced animations
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Features', () => {
    it('maintains accessibility across all enhancement levels', async () => {
      mockDeviceCapabilities.desktopDevice();

      render(
        <ProgressiveEnhancementProvider>
          <InputSection onSubmit={vi.fn()} isGenerating={false} />
        </ProgressiveEnhancementProvider>
      );

      await waitFor(() => {
        const input = screen.getByRole('textbox');
        expect(input).toHaveAttribute('aria-label'); // Or appropriate accessibility attributes

        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          expect(button).toHaveAttribute('aria-label'); // Voice buttons should be accessible
        });
      });
    });

    it('supports keyboard navigation', async () => {
      mockDeviceCapabilities.desktopDevice();

      render(
        <ProgressiveEnhancementProvider>
          <InputSection onSubmit={vi.fn()} isGenerating={false} />
        </ProgressiveEnhancementProvider>
      );

      await waitFor(() => {
        const input = screen.getByRole('textbox');
        input.focus();

        // Should handle keyboard events
        fireEvent.keyDown(input, { key: 'Enter' });
        // Test passes if no errors occur
      });
    });
  });

  describe('Error Handling and Resilience', () => {
    it('gracefully handles feature detection failures', async () => {
      // Mock failed feature detection
      mockDeviceCapabilities.desktopDevice();
      delete (navigator as any).hardwareConcurrency;

      render(
        <ProgressiveEnhancementProvider>
          <InputSection onSubmit={vi.fn()} isGenerating={false} />
        </ProgressiveEnhancementProvider>
      );

      // Should still render basic functionality
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
    });

    it('continues working when advanced features fail', async () => {
      mockDeviceCapabilities.touchDevice();
      mockDeviceCapabilities.speechSupported();

      // Mock voice API failure
      const originalSpeechRecognition = window.webkitSpeechRecognition;
      delete (window as any).webkitSpeechRecognition;

      render(
        <ProgressiveEnhancementProvider>
          <InputSection onSubmit={vi.fn()} isGenerating={false} />
        </ProgressiveEnhancementProvider>
      );

      // Should still work without voice features
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
        // Voice button might be disabled or hidden
      });

      // Restore
      (window as any).webkitSpeechRecognition = originalSpeechRecognition;
    });
  });
});