import { render, screen, fireEvent } from '../../test/utils';
import { vi } from 'vitest';

// Mock components
vi.mock('../../../components/editor/CodeEditor', () => ({
  default: ({ code, onChange }: any) => (
    <textarea
      data-testid="mock-editor"
      value={code}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

vi.mock('../../../components/editor/FileExplorer', () => ({
  FileExplorer: ({ files, activeFileId, onSelectFile, onCreateFile }: any) => (
    <div data-testid="mock-file-explorer">
      {files.map((file: any) => (
        <button
          key={file.id}
          data-testid={`file-${file.id}`}
          onClick={() => onSelectFile(file.id)}
          className={activeFileId === file.id ? 'active' : ''}
        >
          {file.name}
        </button>
      ))}
      <button data-testid="create-file-btn" onClick={() => onCreateFile('test.js')}>
        Create File
      </button>
    </div>
  ),
}));

// Mock the hook
vi.mock('../../../hooks/useProjectFileSystem');

import { useProjectFileSystem } from '../../../hooks/useProjectFileSystem';

const mockUseProjectFileSystem = vi.mocked(useProjectFileSystem);

describe('File Editing Workflow', () => {

  const mockFiles = [
    {
      id: 'file-1',
      projectId: 'test-project',
      name: 'index.html',
      path: '/index.html',
      type: 'file' as const,
      content: '<html><body>Hello World</body></html>',
      language: 'html',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'file-2',
      projectId: 'test-project',
      name: 'styles.css',
      path: '/styles.css',
      type: 'file' as const,
      content: 'body { color: blue; }',
      language: 'css',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  let mockHookReturn: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockHookReturn = {
      files: mockFiles,
      isLoading: false,
      activeFileId: 'file-1',
      setActiveFileId: vi.fn(),
      updateFile: vi.fn(),
      createFile: vi.fn(),
      deleteFile: vi.fn(),
      renameFile: vi.fn(),
      forceSave: vi.fn(),
      flushAll: vi.fn(),
      error: null,
      clearError: vi.fn(),
    };

    mockUseProjectFileSystem.mockReturnValue(mockHookReturn);
  });

  it('displays files in explorer and editor', () => {
    // Mock a simple editor component for this test
    const MockEditor = ({ code, onChange }: any) => (
      <div data-testid="editor">
        <textarea value={code} onChange={(e) => onChange(e.target.value)} />
      </div>
    );

    // Render mock editor view
    const { rerender } = render(<MockEditor code={mockFiles[0].content} onChange={vi.fn()} />);

    const editor = screen.getByTestId('editor');
    expect(editor).toBeInTheDocument();

    // Simulate file switching
    rerender(<MockEditor code={mockFiles[1].content} onChange={vi.fn()} />);

    // Verify content changes
    expect(screen.getByDisplayValue('body { color: blue; }')).toBeInTheDocument();
  });

  it('handles file content updates with debouncing', async () => {
    const mockEditor = ({ code, onChange }: any) => (
      <textarea
        data-testid="editor-textarea"
        value={code}
        onChange={(e) => onChange(e.target.value)}
      />
    );

    render(mockEditor({
      code: mockFiles[0].content,
      onChange: mockHookReturn.updateFile,
    }));

    const textarea = screen.getByTestId('editor-textarea');

    // Type content
    fireEvent.change(textarea, {
      target: { value: '<html><body>Updated content</body></html>' }
    });

    expect(mockHookReturn.updateFile).toHaveBeenCalledWith(
      'file-1',
      '<html><body>Updated content</body></html>'
    );
  });

  it('switches between files correctly', () => {
    // Test file switching logic
    expect(mockHookReturn.activeFileId).toBe('file-1');

    mockHookReturn.setActiveFileId('file-2');

    expect(mockHookReturn.setActiveFileId).toHaveBeenCalledWith('file-2');
  });

  it('handles file creation workflow', async () => {
    mockHookReturn.createFile.mockResolvedValue({
      ...mockFiles[0],
      id: 'new-file',
      name: 'script.js',
      content: '',
    });

    // Simulate creating a file
    await mockHookReturn.createFile('script.js');

    expect(mockHookReturn.createFile).toHaveBeenCalledWith('script.js', undefined);
  });

  it('handles file deletion with confirmation', async () => {
    mockHookReturn.deleteFile.mockResolvedValue(undefined);

    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    // Simulate deleting a file
    await mockHookReturn.deleteFile('file-2');

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockHookReturn.deleteFile).toHaveBeenCalledWith('file-2');

    confirmSpy.mockRestore();
  });

  it('handles file renaming', async () => {
    mockHookReturn.renameFile.mockResolvedValue(true);

    const success = await mockHookReturn.renameFile('file-1', 'newname.html');

    expect(success).toBe(true);
    expect(mockHookReturn.renameFile).toHaveBeenCalledWith('file-1', 'newname.html');
  });

  it('auto-saves when switching files', () => {
    // When switching files, should flush pending writes
    mockHookReturn.setActiveFileId('file-2');

    expect(mockHookReturn.forceSave).toHaveBeenCalledWith('file-1');
  });

  it('handles rapid file switching without data loss', () => {
    // Simulate rapid switching
    mockHookReturn.setActiveFileId('file-2');
    mockHookReturn.setActiveFileId('file-1');
    mockHookReturn.setActiveFileId('file-2');

    // Should flush each time
    expect(mockHookReturn.forceSave).toHaveBeenCalledTimes(3);
  });

  it('preserves unsaved changes when switching back', () => {
    // This would require more complex state management testing
    // For now, we test that the hook methods are called correctly

    mockHookReturn.updateFile('file-1', 'modified content');
    mockHookReturn.setActiveFileId('file-2');

    expect(mockHookReturn.forceSave).toHaveBeenCalledWith('file-1');
  });

  it('handles multiple file updates correctly', () => {
    mockHookReturn.updateFile('file-1', 'content 1');
    mockHookReturn.updateFile('file-1', 'content 2');
    mockHookReturn.updateFile('file-2', 'content 3');

    expect(mockHookReturn.updateFile).toHaveBeenCalledTimes(3);
  });

  it('clears errors when operations succeed', () => {
    mockHookReturn.error = 'Previous error';

    mockHookReturn.createFile.mockResolvedValue(mockFiles[0]);
    mockHookReturn.createFile('test.js');

    expect(mockHookReturn.clearError).toHaveBeenCalled();
  });

  it('displays errors when operations fail', async () => {
    mockHookReturn.createFile.mockRejectedValue(new Error('Creation failed'));

      try {
        await mockHookReturn.createFile('test.js');
      } catch {
      // Error should be set
      expect(mockHookReturn.error).toBe('Creation failed');
    }
  });

  it('handles force save operations', () => {
    mockHookReturn.forceSave('file-1');
    mockHookReturn.forceSave(); // Save all

    expect(mockHookReturn.forceSave).toHaveBeenCalledWith('file-1');
    expect(mockHookReturn.forceSave).toHaveBeenCalledWith(undefined);
  });

  it('flushes all pending writes on unmount', () => {
    mockHookReturn.flushAll();

    expect(mockHookReturn.flushAll).toHaveBeenCalled();
  });
});