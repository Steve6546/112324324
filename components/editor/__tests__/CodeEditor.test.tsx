import { render, screen, fireEvent, waitFor } from '../../../src/test/utils';
import { vi } from 'vitest';

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: vi.fn(),
}));

import CodeEditor from '../CodeEditor';

const mockEditor = vi.mocked(await import('@monaco-editor/react'));

// Mock Editor component from @monaco-editor/react
const MockEditor = vi.fn();
mockEditor.default.mockImplementation(MockEditor);

describe('CodeEditor', () => {
  const defaultProps = {
    code: '<html><body>Hello World</body></html>',
    language: 'html',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    MockEditor.mockImplementation((props: any) => (
      <div data-testid="monaco-editor">
        <div data-testid="editor-content">
          {props.loading || 'Editor Content'}
        </div>
      </div>
    ));
  });

  it('renders editor with correct props', async () => {
    MockEditor.mockImplementation((props: any) => (
      <div data-testid="monaco-editor">
        <div data-testid="editor-content">
          {props.loading || 'Editor Content'}
        </div>
      </div>
    ));

    render(<CodeEditor {...defaultProps} />);

    // Should show loading state initially
    expect(screen.getByText('Loading Code Editor...')).toBeInTheDocument();

    // Wait for the Monaco Editor to load
    await waitFor(() => {
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toBeInTheDocument();
    });

    // Check that Monaco Editor was called with correct props
    expect(MockEditor).toHaveBeenCalledWith(
      expect.objectContaining({
        height: '100%',
        defaultLanguage: 'html',
        language: 'html',
        value: defaultProps.code,
        theme: 'lovable-dark',
        onChange: expect.any(Function), // This is the debounced function
        onMount: expect.any(Function),
        options: expect.objectContaining({
          readOnly: false,
          wordWrap: 'on',
          largeFileOptimizations: true,
          maxTokenizationLineLength: 20000,
          renderLineHighlight: 'line',
          renderWhitespace: 'none',
          wordBasedSuggestions: 'currentDocument',
        }),
        loading: expect.any(Object), // Loading component
      }),
      undefined
    );
  });

  it('maps languages correctly', async () => {
    MockEditor.mockImplementation((props: any) => (
      <div data-testid="monaco-editor">
        <div data-testid="editor-content">
          {props.loading || 'Editor Content'}
        </div>
      </div>
    ));

    const { rerender } = render(<CodeEditor {...defaultProps} language="javascript" />);

    await waitFor(() => {
      expect(MockEditor).toHaveBeenCalledWith(
        expect.objectContaining({ language: 'javascript', defaultLanguage: 'javascript' }),
        undefined
      );
    });

    rerender(<CodeEditor {...defaultProps} language="css" />);
    await waitFor(() => {
      expect(MockEditor).toHaveBeenLastCalledWith(
        expect.objectContaining({ language: 'css', defaultLanguage: 'css' }),
        undefined
      );
    });

    rerender(<CodeEditor {...defaultProps} language="unknown" />);
    await waitFor(() => {
      expect(MockEditor).toHaveBeenLastCalledWith(
        expect.objectContaining({ language: 'plaintext', defaultLanguage: 'plaintext' }),
        undefined
      );
    });
  });

  it('handles readonly mode', async () => {
    MockEditor.mockImplementation((props: any) => (
      <div data-testid="monaco-editor">
        <div data-testid="editor-content">
          {props.loading || 'Editor Content'}
        </div>
      </div>
    ));

    render(<CodeEditor {...defaultProps} readOnly={true} />);

    await waitFor(() => {
      expect(MockEditor).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            readOnly: true,
          }),
        }),
        undefined
      );
    });
  });

  it('calls onChange when content changes', async () => {
    MockEditor.mockImplementation((props: any) => {
      // Simulate Monaco Editor calling onChange
      setTimeout(() => {
        if (props.onChange) {
          props.onChange('<html><body>Updated</body></html>');
        }
      }, 0);

      return (
        <div data-testid="monaco-editor">
          <div data-testid="editor-content">
            {props.loading || 'Editor Content'}
          </div>
        </div>
      );
    });

    render(<CodeEditor {...defaultProps} />);

    await waitFor(() => {
      expect(defaultProps.onChange).toHaveBeenCalledWith('<html><body>Updated</body></html>');
    });
  });

  it('shows loading state when loading', () => {
    MockEditor.mockImplementationOnce((props: any) => props.loading);

    render(<CodeEditor {...defaultProps} />);

    expect(screen.getByText('Initializing Editor...')).toBeInTheDocument();
  });

  it('applies correct styling', () => {
    render(<CodeEditor {...defaultProps} />);

    const container = screen.getByTestId('monaco-editor').parentElement;
    expect(container).toHaveClass('w-full', 'h-full', 'overflow-hidden', 'bg-[#1e1e1e]');
  });

  it('handles empty code', async () => {
    MockEditor.mockImplementation((props: any) => (
      <div data-testid="monaco-editor">
        <div data-testid="editor-content">
          {props.loading || 'Editor Content'}
        </div>
      </div>
    ));

    render(<CodeEditor {...defaultProps} code="" />);

    await waitFor(() => {
      expect(MockEditor).toHaveBeenCalledWith(
        expect.objectContaining({ value: '' }),
        undefined
      );
    });
  });

  it('handles onMount callback', () => {
    const mockOnMount = vi.fn();
    MockEditor.mockImplementationOnce((props: any) => {
      // Simulate calling onMount
      if (props.onMount) {
        const mockEditorInstance = {
          updateOptions: vi.fn(),
        };
        const mockMonaco = {
          editor: {
            defineTheme: vi.fn(),
            setTheme: vi.fn(),
          },
        };
        props.onMount(mockEditorInstance, mockMonaco);
      }
      return <div data-testid="monaco-editor" />;
    });

    render(<CodeEditor {...defaultProps} />);

    // Check that editor options were configured
    expect(MockEditor).toHaveBeenCalled();
  });

  it('configures editor with correct options', async () => {
    let capturedOnMount: any;

    MockEditor.mockImplementation((props: any) => {
      capturedOnMount = props.onMount;
      return <div data-testid="monaco-editor" />;
    });

    render(<CodeEditor {...defaultProps} />);

    await waitFor(() => {
      expect(capturedOnMount).toBeDefined();
    });

    const mockEditorInstance = {
      updateOptions: vi.fn(),
      onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
      getModel: vi.fn(() => ({
        uri: { toString: () => 'file:///test.html' },
        getValue: vi.fn(() => '<html><body>Hello World</body></html>'),
        getLineLength: vi.fn(() => 50),
      })),
    };
    const mockMonaco = {
      editor: {
        defineTheme: vi.fn(),
        setTheme: vi.fn(),
        setModelMarkers: vi.fn(),
        onDidChangeMarkers: vi.fn(() => ({ dispose: vi.fn() })),
        getModelMarkers: vi.fn(() => []),
      },
      MarkerSeverity: {
        Error: 8,
        Warning: 4,
      }
    };

    capturedOnMount(mockEditorInstance, mockMonaco);

    expect(mockEditorInstance.updateOptions).toHaveBeenCalledWith({
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
      lineNumbers: 'on',
      roundedSelection: false,
      padding: { top: 16, bottom: 16 },
      cursorBlinking: 'smooth',
      smoothScrolling: true,
      contextmenu: true,
      formatOnPaste: true,
      automaticLayout: true,
    });

    expect(mockMonaco.editor.defineTheme).toHaveBeenCalledWith('lovable-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.lineHighlightBackground': '#2a2a2a',
      },
    });

    expect(mockMonaco.editor.setTheme).toHaveBeenCalledWith('lovable-dark');
  });

  it('handles undefined onChange', async () => {
    MockEditor.mockImplementation((props: any) => {
      // Simulate Monaco Editor calling onChange
      setTimeout(() => {
        if (props.onChange) {
          props.onChange('test');
        }
      }, 0);

      return (
        <div data-testid="monaco-editor">
          <div data-testid="editor-content">
            {props.loading || 'Editor Content'}
          </div>
        </div>
      );
    });

    render(<CodeEditor {...defaultProps} />);

    await waitFor(() => {
      expect(defaultProps.onChange).toHaveBeenCalledWith('test');
    });
  });
});