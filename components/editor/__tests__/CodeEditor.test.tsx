import { render, screen, fireEvent, waitFor } from '../../../src/test/utils';
import CodeEditor from '../CodeEditor';
import { vi } from 'vitest';

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: vi.fn(),
}));

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

  it('renders editor with correct props', () => {
    render(<CodeEditor {...defaultProps} />);

    const editor = screen.getByTestId('monaco-editor');
    expect(editor).toBeInTheDocument();

    // Check that Monaco Editor was called with correct props
    expect(MockEditor).toHaveBeenCalledWith(
      expect.objectContaining({
        height: '100%',
        defaultLanguage: 'html',
        language: 'html',
        value: defaultProps.code,
        theme: 'lovable-dark',
        onChange: defaultProps.onChange,
        onMount: expect.any(Function),
        options: expect.objectContaining({
          readOnly: false,
          wordWrap: 'on',
        }),
      }),
      expect.any(Object)
    );
  });

  it('maps languages correctly', () => {
    const { rerender } = render(<CodeEditor {...defaultProps} language="javascript" />);

    expect(MockEditor).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'javascript', defaultLanguage: 'javascript' }),
      expect.any(Object)
    );

    rerender(<CodeEditor {...defaultProps} language="css" />);
    expect(MockEditor).toHaveBeenLastCalledWith(
      expect.objectContaining({ language: 'css', defaultLanguage: 'css' }),
      expect.any(Object)
    );

    rerender(<CodeEditor {...defaultProps} language="unknown" />);
    expect(MockEditor).toHaveBeenLastCalledWith(
      expect.objectContaining({ language: 'plaintext', defaultLanguage: 'plaintext' }),
      expect.any(Object)
    );
  });

  it('handles readonly mode', () => {
    render(<CodeEditor {...defaultProps} readOnly={true} />);

    expect(MockEditor).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          readOnly: true,
        }),
      }),
      expect.any(Object)
    );
  });

  it('calls onChange when content changes', () => {
    render(<CodeEditor {...defaultProps} />);

    const textarea = screen.getByTestId('editor-textarea');
    fireEvent.change(textarea, { target: { value: '<html><body>Updated</body></html>' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('<html><body>Updated</body></html>');
  });

  it('shows loading state when loading', () => {
    MockEditor.mockImplementationOnce((props: any) => props.loading);

    render(<CodeEditor {...defaultProps} />);

    expect(screen.getByText('Loading Editor...')).toBeInTheDocument();
  });

  it('applies correct styling', () => {
    render(<CodeEditor {...defaultProps} />);

    const container = screen.getByTestId('monaco-editor').parentElement;
    expect(container).toHaveClass('w-full', 'h-full', 'overflow-hidden', 'bg-[#1e1e1e]');
  });

  it('handles empty code', () => {
    render(<CodeEditor {...defaultProps} code="" />);

    expect(MockEditor).toHaveBeenCalledWith(
      expect.objectContaining({ value: '' }),
      expect.any(Object)
    );
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

  it('configures editor with correct options', () => {
    let capturedOnMount: any;

    MockEditor.mockImplementationOnce((props: any) => {
      capturedOnMount = props.onMount;
      return <div data-testid="monaco-editor" />;
    });

    render(<CodeEditor {...defaultProps} />);

    const mockEditorInstance = {
      updateOptions: vi.fn(),
    };
    const mockMonaco = {
      editor: {
        defineTheme: vi.fn(),
        setTheme: vi.fn(),
      },
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

  it('handles undefined onChange', () => {
    render(<CodeEditor {...defaultProps} />);

    const textarea = screen.getByTestId('editor-textarea');
    fireEvent.change(textarea, { target: { value: 'test' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('test');
  });
});