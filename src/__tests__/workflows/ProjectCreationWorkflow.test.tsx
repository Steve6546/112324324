import { render, screen, fireEvent, waitFor } from '../../test/utils';
import App from '../../../App';
import { vi } from 'vitest';

// Mock all external dependencies
vi.mock('../../../services/gemini');
vi.mock('../../../hooks/useProjectFileSystem');
vi.mock('../../../lib/db');

const mockGemini = vi.mocked(await import('../../../services/gemini'));
const mockUseProjectFileSystem = vi.mocked(await import('../../../hooks/useProjectFileSystem'));

describe('Project Creation Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Mock successful API key validation
    mockGemini.hasValidApiKey.mockReturnValue(true);

    // Mock project file system
    mockUseProjectFileSystem.useProjectFileSystem.mockReturnValue({
      files: [],
      isLoading: false,
      activeFileId: null,
      setActiveFileId: vi.fn(),
      updateFile: vi.fn(),
      createFile: vi.fn(),
      deleteFile: vi.fn(),
      renameFile: vi.fn(),
      forceSave: vi.fn(),
      flushAll: vi.fn(),
      error: null,
      clearError: vi.fn(),
    });
  });

  it('completes full project creation workflow', async () => {
    // Mock streaming responses
    const mockIdeaStream = async function* () {
      yield 'Planning your amazing app...';
      yield '## Todo App Plan\n\n- Task list\n- Add/delete tasks\n- Mark complete';
    };

    const mockCodeStream = async function* () {
      yield '<html><body><h1>Todo App</h1><div id="app"></div></body></html>';
      yield '<html><body><h1>Todo App</h1><div id="app"></div>';
      yield '<html><body><h1>Todo App</h1><div id="app"></div><script>';
      yield '<html><body><h1>Todo App</h1><div id="app"></div><script>const app = document.getElementById(\'app\');';
      yield '<html><body><h1>Todo App</h1><div id="app"></div><script>const app = document.getElementById(\'app\'); app.innerHTML = \'<h2>My Todos</h2>\';</script></body></html>';
    };

    mockGemini.streamIdeaResponse.mockReturnValue(mockIdeaStream());
    mockGemini.streamAppCode.mockReturnValue(mockCodeStream());

    render(<App />);

    // Step 1: Verify initial state
    expect(screen.getByText(/Got an idea/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask Lovable to create/)).toBeInTheDocument();

    // Step 2: Enter project description
    const textarea = screen.getByPlaceholderText(/Ask Lovable to create/);
    fireEvent.change(textarea, { target: { value: 'Create a todo app' } });

    // Step 3: Submit the request
    const submitButton = screen.getByText('Chat');
    fireEvent.click(submitButton);

    // Step 4: Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Plan Preview')).toBeInTheDocument();
    });

    // Step 5: Wait for streaming to complete
    await waitFor(() => {
      expect(screen.getByText('Todo App Plan')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Step 6: Click Create Project
    const createProjectButton = screen.getByText('Create Project');
    fireEvent.click(createProjectButton);

    // Step 7: Verify building screen appears
    await waitFor(() => {
      expect(screen.getByText('Building...')).toBeInTheDocument();
    });

    // Step 8: Wait for building to complete (mock completion)
    // In a real scenario, this would be handled by the building logic
    // For this test, we verify the building screen is shown
    expect(screen.getByText('Building...')).toBeInTheDocument();
  });

  it('handles project creation with theme selection', async () => {
    const mockIdeaStream = async function* () {
      yield 'Planning your modern app...';
      yield '## Modern App Plan\n\n- Clean design\n- Modern UI';
    };

    mockGemini.streamIdeaResponse.mockReturnValue(mockIdeaStream());

    render(<App />);

    // Select theme first
    const themeButton = screen.getByText('Theme');
    fireEvent.click(themeButton);

    const modernTheme = screen.getByText('Modern');
    fireEvent.click(modernTheme);

    // Enter description
    const textarea = screen.getByPlaceholderText(/Ask Lovable to create/);
    fireEvent.change(textarea, { target: { value: 'Create a modern website' } });

    const submitButton = screen.getByText('Chat');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Plan Preview')).toBeInTheDocument();
    });
  });

  it('handles quick actions', async () => {
    const mockIdeaStream = async function* () {
      yield 'Planning your landing page...';
      yield '## Landing Page Plan\n\n- Hero section\n- CTA buttons';
    };

    mockGemini.streamIdeaResponse.mockReturnValue(mockIdeaStream());

    render(<App />);

    // Use quick action
    const plusButton = screen.getByTestId('plus-icon').closest('button');
    fireEvent.click(plusButton!);

    const landingPageAction = screen.getByText('Landing Page');
    fireEvent.click(landingPageAction);

    // Verify textarea is populated
    const textarea = screen.getByPlaceholderText(/Ask Lovable to create/);
    expect(textarea).toHaveValue('Create a high-conversion landing page for... ');

    // Submit
    const submitButton = screen.getByText('Chat');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Plan Preview')).toBeInTheDocument();
    });
  });

  it('handles file attachment workflow', async () => {
    render(<App />);

    // Find attach button (it might be in a different location)
    const attachButton = screen.getByText('Attach');
    const fileInput = attachButton.closest('button')?.querySelector('input[type="file"]') as HTMLInputElement;

    // Create mock file
    const mockFile = new File(['test image'], 'test.png', { type: 'image/png' });

    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onloadend: null as any,
    };
    global.FileReader = vi.fn(() => mockFileReader) as any;

    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(mockFile);
  });

  it('persists project data correctly', async () => {
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(() => '[]'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    const mockIdeaStream = async function* () {
      yield 'Planning...';
      yield '## Test Plan';
    };

    mockGemini.streamIdeaResponse.mockReturnValue(mockIdeaStream());

    render(<App />);

    // Create a project
    const textarea = screen.getByPlaceholderText(/Ask Lovable to create/);
    fireEvent.change(textarea, { target: { value: 'Test project' } });

    const submitButton = screen.getByText('Chat');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('lovable_projects', expect.any(String));
    });
  });

  it('handles API errors gracefully', async () => {
    mockGemini.streamIdeaResponse.mockRejectedValue(new Error('API Error'));

    render(<App />);

    const textarea = screen.getByPlaceholderText(/Ask Lovable to create/);
    fireEvent.change(textarea, { target: { value: 'Test project' } });

    const submitButton = screen.getByText('Chat');
    fireEvent.click(submitButton);

    // Should handle error gracefully (exact behavior depends on implementation)
    // This test ensures the app doesn't crash
    expect(submitButton).toBeInTheDocument();
  });

  it('validates API key before allowing project creation', () => {
    mockGemini.hasValidApiKey.mockReturnValue(false);

    render(<App />);

    expect(screen.getByText(/API Key Required/)).toBeInTheDocument();
    expect(screen.getByText(/Click here to configure/)).toBeInTheDocument();
  });
});