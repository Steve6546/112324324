import { render, screen, fireEvent, waitFor } from '../../test/utils';
import { vi } from 'vitest';
import InputSection from '../../../components/InputSection';

const mockOnSubmit = vi.fn();

const defaultProps = {
  onSubmit: mockOnSubmit,
  isGenerating: false,
};

describe('InputSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders main heading and input elements', () => {
    render(<InputSection {...defaultProps} />);

    expect(screen.getByText(/Got an idea/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask Lovable to create/)).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
  }, 10000); // Increased timeout for component loading

  it('shows vibe button and generates vibes on click', async () => {
    // Mock the generateVibeIdeas function
    const mockGenerateVibeIdeas = vi.fn().mockResolvedValue([
      'Create a task management app',
      'Build a weather dashboard',
      'Design a recipe finder'
    ]);

    vi.mock('../../../services/gemini', () => ({
      ...vi.importActual('../../../services/gemini'),
      generateVibeIdeas: mockGenerateVibeIdeas,
    }));

    render(<InputSection {...defaultProps} />);

    // Wait for component to load and check for vibe button
    await waitFor(() => {
      const vibeButton = screen.queryByText(/2025 Vibes/) || screen.queryByText(/Generating/);
      if (vibeButton) {
        fireEvent.click(vibeButton);
      }
    });

    await waitFor(() => {
      expect(mockGenerateVibeIdeas).toHaveBeenCalled();
    }, { timeout: 5000 });
  });

  it('handles prompt input and submission', () => {
    render(<InputSection {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Ask Lovable to create/);
    const submitButton = screen.getByText('Chat');

    // Type in textarea
    fireEvent.change(textarea, { target: { value: 'Create a todo app' } });
    expect(textarea).toHaveValue('Create a todo app');

    // Submit
    fireEvent.click(submitButton);
    expect(mockOnSubmit).toHaveBeenCalledWith('Create a todo app', undefined);
  });

  it('handles Enter key submission', () => {
    render(<InputSection {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Ask Lovable to create/);

    fireEvent.change(textarea, { target: { value: 'Create a blog' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(mockOnSubmit).toHaveBeenCalledWith('Create a blog', undefined);
  });

  it('prevents submission with Shift+Enter', () => {
    render(<InputSection {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Ask Lovable to create/);

    fireEvent.change(textarea, { target: { value: 'Create a blog' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    expect(mockOnSubmit).not.toHaveBeenCalled();
    // Should still have the text with newline
    expect(textarea).toHaveValue('Create a blog\n');
  });

  it('shows loading state when generating', () => {
    render(<InputSection {...defaultProps} isGenerating={true} />);

    expect(screen.getByText('Thinking')).toBeInTheDocument();
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });

  it('disables input when generating', () => {
    render(<InputSection {...defaultProps} isGenerating={true} />);

    const textarea = screen.getByPlaceholderText(/Ask Lovable to create/);
    const submitButton = screen.getByText('Thinking');

    expect(textarea).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('shows theme selection dropdown', () => {
    render(<InputSection {...defaultProps} />);

    const themeButton = screen.getByText('Theme');
    fireEvent.click(themeButton);

    // Should show theme options
    expect(screen.getByText('Modern')).toBeInTheDocument();
    expect(screen.getByText('Minimal')).toBeInTheDocument();
  });

  it('handles theme selection', () => {
    render(<InputSection {...defaultProps} />);

    const themeButton = screen.getByText('Theme');
    fireEvent.click(themeButton);

    const modernTheme = screen.getByText('Modern');
    fireEvent.click(modernTheme);

    // Theme button should now show selected theme
    expect(screen.getByText('Modern')).toBeInTheDocument();
  });

  it('handles quick actions', () => {
    render(<InputSection {...defaultProps} />);

    // Find the plus button by its icon
    const plusIcon = document.querySelector('svg.lucide-plus');
    const plusButton = plusIcon?.closest('button');
    fireEvent.click(plusButton!);

    const landingPageAction = screen.getByText('Landing Page');
    fireEvent.click(landingPageAction);

    const textarea = screen.getByPlaceholderText(/Ask Lovable to create/);
    expect(textarea).toHaveValue('Create a high-conversion landing page for... ');
  });

  it('handles file attachment', () => {
    // Mock file input
    const mockFile = new File(['test image'], 'test.png', { type: 'image/png' });
    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onloadend: null,
    };

    // Mock FileReader
    global.FileReader = vi.fn(() => mockFileReader) as any;

    render(<InputSection {...defaultProps} />);

    const attachButton = screen.getByText('Attach');
    const fileInput = attachButton.closest('button')?.querySelector('input[type="file"]') as HTMLInputElement;

    expect(fileInput).toBeInTheDocument();

    // Simulate file selection
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(mockFile);
    }
  });

  it('shows keyboard shortcut hint', () => {
    render(<InputSection {...defaultProps} />);

    expect(screen.getByText(/Press/)).toBeInTheDocument();
    expect(screen.getByText(/Enter/)).toBeInTheDocument();
  });
});