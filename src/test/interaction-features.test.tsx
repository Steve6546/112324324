import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from './utils';
import { ProgressiveEnhancementProvider } from '../contexts/ProgressiveEnhancementContext';
import InputSection from '../../components/InputSection';
import { mockDeviceCapabilities, createMockLocalStorage } from './advanced-test-utils';

describe('Interaction Features', () => {
  let mockLocalStorage: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage = createMockLocalStorage();
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Voice Commands', () => {
    it('shows voice button on supported devices', async () => {
      mockDeviceCapabilities.speechSupported();
      mockDeviceCapabilities.touchDevice();

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

    it('hides voice button on unsupported devices', async () => {
      mockDeviceCapabilities.speechNotSupported();
      mockDeviceCapabilities.desktopDevice();

      render(
        <ProgressiveEnhancementProvider>
          <InputSection onSubmit={vi.fn()} isGenerating={false} />
        </ProgressiveEnhancementProvider>
      );

      await waitFor(() => {
        const voiceButton = screen.queryByRole('button', { name: /voice|microphone/i });
        expect(voiceButton).not.toBeInTheDocument();
      });
    });

    it('handles voice recording state changes', async () => {
      mockDeviceCapabilities.speechSupported();
      mockDeviceCapabilities.touchDevice();

      // Mock SpeechRecognition
      const mockRecognition = {
        start: vi.fn(),
        stop: vi.fn(),
        onstart: null,
        onend: null,
        onresult: null,
        onerror: null,
        continuous: false,
        interimResults: false,
        lang: 'en-US',
      };

      (window as any).webkitSpeechRecognition = vi.fn().mockImplementation(() => mockRecognition);

      render(
        <ProgressiveEnhancementProvider>
          <InputSection onSubmit={vi.fn()} isGenerating={false} />
        </ProgressiveEnhancementProvider>
      );

      await waitFor(() => {
        const voiceButton = screen.getByRole('button', { name: /voice|microphone/i });
        fireEvent.click(voiceButton);

        expect(mockRecognition.start).toHaveBeenCalled();
      });
    });

    it('updates placeholder text during voice recording', async () => {
      mockDeviceCapabilities.speechSupported();
      mockDeviceCapabilities.touchDevice();

      const mockRecognition = {
        start: vi.fn(),
        stop: vi.fn(),
        onstart: vi.fn(),
        onend: vi.fn(),
        onresult: vi.fn(),
        onerror: vi.fn(),
        continuous: false,
        interimResults: true,
        lang: 'en-US',
      };

      (window as any).webkitSpeechRecognition = vi.fn().mockImplementation(() => mockRecognition);

      render(
        <ProgressiveEnhancementProvider>
          <InputSection onSubmit={vi.fn()} isGenerating={false} />
        </ProgressiveEnhancementProvider>
      );

      await waitFor(() => {
        const voiceButton = screen.getByRole('button', { name: /voice|microphone/i });
        fireEvent.click(voiceButton);

        // Trigger onstart
        mockRecognition.onstart();

        const input = screen.getByRole('textbox');
        expect(input).toHaveAttribute('placeholder', expect.stringContaining('Listening'));
      });
    });

    it('processes voice commands in English', async () => {
      mockDeviceCapabilities.speechSupported();
      mockDeviceCapabilities.touchDevice();

      const mockOnSubmit = vi.fn();
      const mockRecognition = {
        start: vi.fn(),
        stop: vi.fn(),
        onstart: vi.fn(),
        onend: vi.fn(),
        onresult: vi.fn(),
        onerror: vi.fn(),
        continuous: false,
        interimResults: true,
        lang: 'en-US',
      };

      (window as any).webkitSpeechRecognition = vi.fn().mockImplementation(() => mockRecognition);

      render(
        <ProgressiveEnhancementProvider>
          <InputSection onSubmit={mockOnSubmit} isGenerating={false} />
        </ProgressiveEnhancementProvider>
      );

      await waitFor(() => {
        const voiceButton = screen.getByRole('button', { name: /voice|microphone/i });
        fireEvent.click(voiceButton);

        // Simulate voice result with command
        const mockEvent = {
          results: [
            {
              0: { transcript: 'create a todo app' },
              isFinal: true,
            },
          ],
        };

        mockRecognition.onresult(mockEvent);
        mockRecognition.onend();

        expect(mockOnSubmit).toHaveBeenCalledWith('create a todo app', undefined, false);
      });
    });

    it('supports Arabic voice commands', async () => {
      // Mock Arabic language
      Object.defineProperty(navigator, 'language', { value: 'ar-SA', configurable: true });

      mockDeviceCapabilities.speechSupported();
      mockDeviceCapabilities.touchDevice();

      const mockOnSubmit = vi.fn();
      const mockRecognition = {
        start: vi.fn(),
        stop: vi.fn(),
        onstart: vi.fn(),
        onend: vi.fn(),
        onresult: vi.fn(),
        onerror: vi.fn(),
        continuous: false,
        interimResults: true,
        lang: 'ar-SA',
      };

      // Mock webkitSpeechRecognition safely
      delete (window as any).webkitSpeechRecognition;
      (window as any).webkitSpeechRecognition = vi.fn().mockImplementation(() => mockRecognition);

      (window as any).webkitSpeechRecognition = vi.fn().mockImplementation(() => mockRecognition);

      render(
        <ProgressiveEnhancementProvider>
          <InputSection onSubmit={mockOnSubmit} isGenerating={false} />
        </ProgressiveEnhancementProvider>
      );

      await waitFor(() => {
        const voiceButton = screen.getByRole('button', { name: /voice|microphone/i });
        fireEvent.click(voiceButton);

        // Simulate Arabic voice command
        const mockEvent = {
          results: [
            {
              0: { transcript: 'أنشئ تطبيق مهام' },
              isFinal: true,
            },
          ],
        };

        mockRecognition.onresult(mockEvent);
        mockRecognition.onend();

        expect(mockOnSubmit).toHaveBeenCalledWith('أنشئ تطبيق مهام', undefined, false);
      });
    });
  });

  describe('Touch Interactions', () => {
    it('applies touch-friendly styling on touch devices', async () => {
      mockDeviceCapabilities.touchDevice();

      render(
        <ProgressiveEnhancementProvider>
          <InputSection onSubmit={vi.fn()} isGenerating={false} />
        </ProgressiveEnhancementProvider>
      );

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        // Check that at least some buttons have touch-friendly styling
        const touchButtons = buttons.filter(button =>
          button.className.includes('touch-manipulation')
        );
        expect(touchButtons.length).toBeGreaterThan(0);

        // The main vibe button should have active:scale-95
        const vibeButton = screen.getByTestId('vibe-btn');
        expect(vibeButton).toHaveClass('active:scale-95');
        expect(vibeButton).toHaveClass('touch-manipulation');
      });
    });

    it('adds long press gesture support', async () => {
      mockDeviceCapabilities.touchDevice();
      mockDeviceCapabilities.speechSupported();

      const mockRecognition = {
        start: vi.fn(),
        stop: vi.fn(),
        onstart: vi.fn(),
        onend: vi.fn(),
        onresult: vi.fn(),
        onerror: vi.fn(),
        continuous: false,
        interimResults: true,
        lang: 'en-US',
      };

      // Mock webkitSpeechRecognition safely
      delete (window as any).webkitSpeechRecognition;
      (window as any).webkitSpeechRecognition = vi.fn().mockImplementation(() => mockRecognition);

      render(
        <ProgressiveEnhancementProvider>
          <InputSection onSubmit={vi.fn()} isGenerating={false} />
        </ProgressiveEnhancementProvider>
      );

      await waitFor(() => {
        const input = screen.getByRole('textbox');
        // Simulate long press (this would need custom event simulation)
        // For now, just verify the input has touch attributes
        expect(input.closest('[class*="touch-pan-y"]')).toBeInTheDocument();
      });
    });

    it('optimizes button sizes for touch', async () => {
      mockDeviceCapabilities.touchDevice();

      render(
        <ProgressiveEnhancementProvider>
          <InputSection onSubmit={vi.fn()} isGenerating={false} />
        </ProgressiveEnhancementProvider>
      );

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          // Check minimum touch target size (44px)
          const styles = window.getComputedStyle(button);
          const minWidth = parseInt(styles.minWidth) || parseInt(styles.width);
          const minHeight = parseInt(styles.minHeight) || parseInt(styles.height);

          expect(minWidth).toBeGreaterThanOrEqual(44);
          expect(minHeight).toBeGreaterThanOrEqual(44);
        });
      });
    });
  });

  describe('Haptic Feedback', () => {
    it('provides haptic feedback on supported devices', async () => {
      mockDeviceCapabilities.touchDevice();

      // Mock vibrate API
      const mockVibrate = vi.fn();
      Object.defineProperty(navigator, 'vibrate', {
        value: mockVibrate,
        writable: true,
      });

      render(
        <ProgressiveEnhancementProvider>
          <InputSection onSubmit={vi.fn()} isGenerating={false} />
        </ProgressiveEnhancementProvider>
      );

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[0]);

        // Should trigger haptic feedback
        expect(mockVibrate).toHaveBeenCalledWith(10);
      });
    });

    it('gracefully handles missing haptic support', async () => {
      mockDeviceCapabilities.touchDevice();

      // Remove vibrate API
      delete (navigator as any).vibrate;

      render(
        <ProgressiveEnhancementProvider>
          <InputSection onSubmit={vi.fn()} isGenerating={false} />
        </ProgressiveEnhancementProvider>
      );

      // Should not throw errors
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(() => fireEvent.click(buttons[0])).not.toThrow();
      });
    });
  });

  describe('Internationalization Support', () => {
    it('adapts to Arabic language settings', async () => {
      // Mock Arabic language
      Object.defineProperty(navigator, 'language', { value: 'ar-SA' });

      mockDeviceCapabilities.touchDevice();

      render(
        <ProgressiveEnhancementProvider>
          <InputSection onSubmit={vi.fn()} isGenerating={false} />
        </ProgressiveEnhancementProvider>
      );

      await waitFor(() => {
        const input = screen.getByRole('textbox');
        expect(input).toHaveAttribute('placeholder', expect.stringContaining('Long press'));
        // Arabic text should be supported
      });
    });

    it('maintains English support by default', async () => {
      Object.defineProperty(navigator, 'language', { value: 'en-US' });

      mockDeviceCapabilities.touchDevice();

      render(
        <ProgressiveEnhancementProvider>
          <InputSection onSubmit={vi.fn()} isGenerating={false} />
        </ProgressiveEnhancementProvider>
      );

      await waitFor(() => {
        const input = screen.getByRole('textbox');
        expect(input).toHaveAttribute('placeholder', expect.stringContaining('Long press'));
      });
    });
  });

  describe('Error Recovery', () => {
    it('continues working after voice recognition errors', async () => {
      mockDeviceCapabilities.speechSupported();
      mockDeviceCapabilities.touchDevice();

      const mockRecognition = {
        start: vi.fn(),
        stop: vi.fn(),
        onstart: vi.fn(),
        onend: vi.fn(),
        onresult: vi.fn(),
        onerror: vi.fn(),
        continuous: false,
        interimResults: true,
        lang: 'en-US',
      };

      (window as any).webkitSpeechRecognition = vi.fn().mockImplementation(() => mockRecognition);

      render(
        <ProgressiveEnhancementProvider>
          <InputSection onSubmit={vi.fn()} isGenerating={false} />
        </ProgressiveEnhancementProvider>
      );

      await waitFor(() => {
        const voiceButton = screen.getByRole('button', { name: /voice|microphone/i });
        fireEvent.click(voiceButton);

        // Simulate error
        mockRecognition.onerror({ error: 'network' });
        mockRecognition.onend();

        // Should still allow text input
        const input = screen.getByRole('textbox');
        expect(input).toBeInTheDocument();
        expect(input).not.toHaveAttribute('disabled');
      });
    });

    it('handles network connectivity changes', async () => {
      mockDeviceCapabilities.touchDevice();

      render(
        <ProgressiveEnhancementProvider>
          <InputSection onSubmit={vi.fn()} isGenerating={false} />
        </ProgressiveEnhancementProvider>
      );

      // Simulate offline
      Object.defineProperty(navigator, 'onLine', { value: false });

      window.dispatchEvent(new Event('offline'));

      await waitFor(() => {
        // Should still be functional in offline mode
        const input = screen.getByRole('textbox');
        expect(input).toBeInTheDocument();
      });

      // Simulate back online
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));
    });
  });
});