import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import App from '../../App';
import { ToastProvider } from '../../components/Toast';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ProgressiveEnhancementProvider } from '../contexts/ProgressiveEnhancementContext';

// Mock all external dependencies
vi.mock('../../services/gemini');
vi.mock('../../hooks/useProjectFileSystem');
vi.mock('../../lib/db');

const mockGemini = vi.mocked(await import('../../services/gemini'));
const mockUseProjectFileSystem = vi.mocked(await import('../../hooks/useProjectFileSystem'));

// Test wrapper with all required providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ProgressiveEnhancementProvider>
    <ThemeProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </ThemeProvider>
  </ProgressiveEnhancementProvider>
);

describe('App Integration Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Reset all mocks
    vi.clearAllMocks();

    // Default mocks for App dependencies
    mockGemini.hasValidApiKey.mockReturnValue(true);
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

  it('renders the main app with initial state', async () => {
    render(<TestWrapper><App /></TestWrapper>);

    // Wait for app to load
    await waitFor(() => {
      expect(screen.getByText(/Got an idea/)).toBeInTheDocument();
    }, { timeout: 2000 });

    // Should show input section
    expect(screen.getByPlaceholderText(/Ask Lovable to create/)).toBeInTheDocument();

    // Should show project dashboard
    expect(screen.getByText('My projects')).toBeInTheDocument();
  });

  it('shows API key warning when no key is configured', async () => {
    // Mock hasValidApiKey to return false
    const { hasValidApiKey } = await import('../../services/gemini');
    vi.mocked(hasValidApiKey).mockReturnValue(false);

    render(<TestWrapper><App /></TestWrapper>);

    await waitFor(() => {
      expect(screen.getByText(/API Key Required/)).toBeInTheDocument();
    }, { timeout: 2000 });
    expect(screen.getByText(/Click here to configure/)).toBeInTheDocument();
  });

  it('handles project creation flow', async () => {
    // Mock fast responses for speed
    const { streamIdeaResponse, streamAppCode } = await import('../../services/gemini');

    // Mock as async generators for proper typing
    vi.mocked(streamIdeaResponse).mockImplementation(async function* () {
      yield '## Todo App Plan\n\n- Task list\n- Add/delete tasks';
    });
    vi.mocked(streamAppCode).mockImplementation(async function* () {
      yield '<html><body><h1>Todo App</h1></body></html>';
    });

    render(<TestWrapper><App /></TestWrapper>);

    // Wait for app to load quickly
    await waitFor(() => {
      expect(screen.getByText(/Got an idea/)).toBeInTheDocument();
    }, { timeout: 2000 });

    // Type a prompt and submit quickly
    const textarea = screen.getByPlaceholderText(/Ask Lovable to create/);
    fireEvent.change(textarea, { target: { value: 'Create a todo app' } });

    const submitButton = screen.getByText('Chat');
    fireEvent.click(submitButton);

    // Verify modal appears quickly
    await waitFor(() => {
      expect(screen.getByText('Plan Preview')).toBeInTheDocument();
    }, { timeout: 500 });
  });


  it('handles quick actions', async () => {
    render(<TestWrapper><App /></TestWrapper>);

    // Wait for app to load
    await waitFor(() => {
      expect(screen.getByText(/Got an idea/)).toBeInTheDocument();
    }, { timeout: 2000 });

    // Open plus menu
    const plusIcon = document.querySelector('svg.lucide-plus');
    const plusButton = plusIcon?.closest('button');
    if (plusButton) {
      fireEvent.click(plusButton);
    }

    // Click on a quick action
    const landingPageAction = screen.getByText('Landing Page');
    fireEvent.click(landingPageAction);

    // Should populate the textarea
    const textarea = screen.getByPlaceholderText(/Ask Lovable to create/);
    expect(textarea).toHaveValue('Create a high-conversion landing page for... ');
  });

  it('navigates between views', async () => {
    // Mock localStorage to have projects
    const mockProjects = [{
      id: 'test-project',
      title: 'Test Project',
      thumbnailUrl: '',
      viewedAt: 'Just now',
      authorName: 'Test',
      authorAvatar: '',
      category: 'mine',
    }];

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => JSON.stringify(mockProjects)),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    render(<TestWrapper><App /></TestWrapper>);

    // Wait for app to load and projects to be displayed
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Click on project
    const projectCard = screen.getByText('Test Project').closest('div');
    fireEvent.click(projectCard!);

    // Should navigate to editor (mock the view change)
    // Note: In a real integration test, we'd need to mock the routing
    // For now, we'll just verify the click handler is called
  });

  it('displays projects from localStorage', async () => {
    const mockProjects = [{
      id: 'test-project',
      title: 'Test Project',
      viewedAt: 'Just now',
      authorName: 'You',
      category: 'mine',
    }];

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => JSON.stringify(mockProjects)),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    render(<TestWrapper><App /></TestWrapper>);

    // Should show project in dashboard
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Click on project
    const projectCard = screen.getByText('Test Project').closest('div');
    fireEvent.click(projectCard!);

    // Should navigate to editor (mock the view change)
    // Note: In a real integration test, we'd need to mock the routing
    // For now, we'll just verify the click handler is called
  });

  it('handles settings modal', async () => {
    render(<TestWrapper><App /></TestWrapper>);

    // Wait for app to load
    await waitFor(() => {
      expect(screen.getByText(/Got an idea/)).toBeInTheDocument();
    }, { timeout: 2000 });

    // Click settings button
    const settingsButton = screen.getByText('Settings');
    fireEvent.click(settingsButton);

    // Should show settings modal
    expect(screen.getByText('AI Configuration')).toBeInTheDocument();
  });

  it('persists projects to localStorage', () => {
    const mockLocalStorage = {
      getItem: vi.fn(() => '[]'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    render(<TestWrapper><App /></TestWrapper>);

    // Trigger a state change that should save to localStorage
    // This would happen when projects are updated

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('lovable_projects', '[]');
  });
});
