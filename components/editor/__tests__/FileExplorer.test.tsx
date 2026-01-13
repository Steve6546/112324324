import { render, screen, fireEvent, waitFor } from '../../../src/test/utils';
import { FileExplorer } from '../FileExplorer';
import { FileNode } from '../../../types';
import { vi } from 'vitest';

const mockFiles: FileNode[] = [
  {
    id: 'file-1',
    projectId: 'project-1',
    name: 'index.html',
    path: '/index.html',
    type: 'file',
    content: '<html></html>',
    language: 'html',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'file-2',
    projectId: 'project-1',
    name: 'styles.css',
    path: '/styles.css',
    type: 'file',
    content: 'body {}',
    language: 'css',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

const defaultProps = {
  files: mockFiles,
  activeFileId: 'file-1',
  onSelectFile: vi.fn(),
  onCreateFile: vi.fn(),
  onDeleteFile: vi.fn(),
  problems: [],
};

describe('FileExplorer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders file explorer with files', () => {
    render(<FileExplorer {...defaultProps} />);

    expect(screen.getByText('Explorer')).toBeInTheDocument();
    expect(screen.getByText('index.html')).toBeInTheDocument();
    expect(screen.getByText('styles.css')).toBeInTheDocument();
  });

  it('highlights active file', () => {
    render(<FileExplorer {...defaultProps} />);

    const activeFile = screen.getByText('index.html').closest('div');
    expect(activeFile).toHaveClass('bg-blue-500/10');
    expect(activeFile).toHaveClass('text-blue-400');
  });

  it('calls onSelectFile when file is clicked', () => {
    render(<FileExplorer {...defaultProps} />);

    fireEvent.click(screen.getByText('styles.css'));

    expect(defaultProps.onSelectFile).toHaveBeenCalledWith('file-2');
  });

  it('shows create file modal when plus button is clicked', () => {
    render(<FileExplorer {...defaultProps} />);

    const plusButton = screen.getByTitle('New File');
    fireEvent.click(plusButton);

    expect(screen.getByText('إنشاء ملف جديد')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('مثال: page2.html, styles.css, script.js')).toBeInTheDocument();
  });

  it('creates file when form is submitted', async () => {
    defaultProps.onCreateFile.mockResolvedValue(undefined);

    render(<FileExplorer {...defaultProps} />);

    // Open modal
    fireEvent.click(screen.getByTitle('New File'));

    // Fill form
    const input = screen.getByPlaceholderText('مثال: page2.html, styles.css, script.js');
    fireEvent.change(input, { target: { value: 'test.js' } });

    // Submit
    const createButton = screen.getByText('إنشاء');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(defaultProps.onCreateFile).toHaveBeenCalledWith('test.js');
    });
  });

  it('handles Enter key in create file input', async () => {
    defaultProps.onCreateFile.mockResolvedValue(undefined);

    render(<FileExplorer {...defaultProps} />);

    fireEvent.click(screen.getByTitle('New File'));

    const input = screen.getByPlaceholderText('مثال: page2.html, styles.css, script.js');
    fireEvent.change(input, { target: { value: 'enter.js' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(defaultProps.onCreateFile).toHaveBeenCalledWith('enter.js');
    });
  });

  it('handles Escape key in create file input', () => {
    render(<FileExplorer {...defaultProps} />);

    fireEvent.click(screen.getByTitle('New File'));

    const input = screen.getByPlaceholderText('مثال: page2.html, styles.css, script.js');
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByText('إنشاء ملف جديد')).not.toBeInTheDocument();
  });

  it('shows delete button on hover for files when multiple files exist', () => {
    render(<FileExplorer {...defaultProps} />);

    const fileItem = screen.getByText('styles.css').closest('div');
    expect(fileItem).toBeInTheDocument();

    // Delete button should be visible on hover (simulated by checking the element exists)
    const deleteButton = screen.getAllByTitle('Delete File')[1]; // Second file
    expect(deleteButton).toBeInTheDocument();
  });

  it('does not show delete button when only one file exists', () => {
    const singleFileProps = {
      ...defaultProps,
      files: [mockFiles[0]],
    };

    render(<FileExplorer {...singleFileProps} />);

    expect(screen.queryByTitle('Delete File')).not.toBeInTheDocument();
  });

  it('calls onDeleteFile when delete button is clicked', () => {
    render(<FileExplorer {...defaultProps} />);

    const deleteButtons = screen.getAllByTitle('Delete File');
    const secondDeleteButton = deleteButtons[1]; // Delete styles.css

    fireEvent.click(secondDeleteButton);

    expect(defaultProps.onDeleteFile).toHaveBeenCalledWith('file-2', expect.any(Object));
  });

  it('shows problems panel', () => {
    render(<FileExplorer {...defaultProps} />);

    expect(screen.getByText('Problems')).toBeInTheDocument();
    expect(screen.getByText('No issues detected')).toBeInTheDocument();
  });

  it('displays problems when they exist', () => {
    const problemsProps = {
      ...defaultProps,
      problems: ['Syntax error on line 5', 'Unused variable'],
    };

    render(<FileExplorer {...problemsProps} />);

    expect(screen.getByText('Syntax error on line 5')).toBeInTheDocument();
    expect(screen.getByText('Unused variable')).toBeInTheDocument();
  });

  it('closes create modal when cancel button is clicked', () => {
    render(<FileExplorer {...defaultProps} />);

    fireEvent.click(screen.getByTitle('New File'));
    expect(screen.getByText('إنشاء ملف جديد')).toBeInTheDocument();

    fireEvent.click(screen.getByText('إلغاء'));
    expect(screen.queryByText('إنشاء ملف جديد')).not.toBeInTheDocument();
  });

  it('closes create modal when X button is clicked', () => {
    render(<FileExplorer {...defaultProps} />);

    fireEvent.click(screen.getByTitle('New File'));
    expect(screen.getByText('إنشاء ملف جديد')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    expect(screen.queryByText('إنشاء ملف جديد')).not.toBeInTheDocument();
  });

  it('disables create button when filename is empty', () => {
    render(<FileExplorer {...defaultProps} />);

    fireEvent.click(screen.getByTitle('New File'));

    const createButton = screen.getByText('إنشاء');
    expect(createButton).toBeDisabled();
  });

  it('shows loading state during file creation', async () => {
    defaultProps.onCreateFile.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<FileExplorer {...defaultProps} />);

    fireEvent.click(screen.getByTitle('New File'));

    const input = screen.getByPlaceholderText('مثال: page2.html, styles.css, script.js');
    fireEvent.change(input, { target: { value: 'loading.js' } });

    const createButton = screen.getByText('إنشاء');
    fireEvent.click(createButton);

    // Should show loading state
    expect(screen.getByText('جاري الإنشاء...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('جاري الإنشاء...')).not.toBeInTheDocument();
    });
  });

  it('handles file creation errors gracefully', async () => {
    defaultProps.onCreateFile.mockRejectedValue(new Error('Creation failed'));

    render(<FileExplorer {...defaultProps} />);

    fireEvent.click(screen.getByTitle('New File'));

    const input = screen.getByPlaceholderText('مثال: page2.html, styles.css, script.js');
    fireEvent.change(input, { target: { value: 'error.js' } });

    const createButton = screen.getByText('إنشاء');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(defaultProps.onCreateFile).toHaveBeenCalledWith('error.js');
    });

    // Modal should still be open on error
    expect(screen.getByText('إنشاء ملف جديد')).toBeInTheDocument();
  });
});