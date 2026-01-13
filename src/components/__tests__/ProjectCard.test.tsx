import { render, screen, fireEvent } from '../../test/utils';
import { vi } from 'vitest';
import ProjectCard from '../../../components/ProjectCard';
import { Project } from '../../../types';

const mockProject: Project = {
  id: 'test-project-1',
  title: 'Test Project',
  description: 'A test project description',
  thumbnailUrl: '',
  viewedAt: '2 hours ago',
  authorName: 'Test Author',
  authorAvatar: '',
  category: 'mine',
  code: '<html><body>Test</body></html>',
  chatHistory: [],
};

const mockProps = {
  onClick: vi.fn(),
  onDelete: vi.fn(),
  onRename: vi.fn(),
  onStar: vi.fn(),
  onDuplicate: vi.fn(),
};

describe('ProjectCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders project information correctly', () => {
    render(<ProjectCard project={mockProject} {...mockProps} />);

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
    expect(screen.getByText('Viewed 2 hours ago')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked (not in rename mode)', () => {
    render(<ProjectCard project={mockProject} {...mockProps} />);

    const card = screen.getByText('Test Project').closest('div');
    fireEvent.click(card!);

    expect(mockProps.onClick).toHaveBeenCalledWith(mockProject);
  });

  it('shows star icon and allows starring', () => {
    render(<ProjectCard project={mockProject} {...mockProps} />);

    // Find star icon by its SVG class
    const starIcon = document.querySelector('svg.lucide-star');
    expect(starIcon).toBeInTheDocument();

    // Find the star button (parent of the icon)
    const starButton = starIcon?.closest('button');
    expect(starButton).toBeInTheDocument();

    fireEvent.click(starButton!);

    expect(mockProps.onStar).toHaveBeenCalledWith(mockProject.id);
  });

  it('shows more options menu and handles delete', async () => {
    // Mock window.confirm
    const mockConfirm = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(<ProjectCard project={mockProject} {...mockProps} />);

    const moreIcon = document.querySelector('svg.lucide-more-horizontal');
    const moreButton = moreIcon?.closest('button');
    fireEvent.click(moreButton!);

    // The menu should be visible now
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(mockConfirm).toHaveBeenCalledWith(`Delete "${mockProject.title}"?`);
    expect(mockProps.onDelete).toHaveBeenCalledWith(mockProject.id);

    mockConfirm.mockRestore();
  });

  it('shows duplicate option when onDuplicate is provided', () => {
    render(<ProjectCard project={mockProject} {...mockProps} />);

    const moreIcon = document.querySelector('svg.lucide-more-horizontal');
    const moreButton = moreIcon?.closest('button');
    fireEvent.click(moreButton!);

    expect(screen.getByText('Duplicate')).toBeInTheDocument();
  });

  it('calls onDuplicate when duplicate is clicked', () => {
    render(<ProjectCard project={mockProject} {...mockProps} />);

    const moreIcon = document.querySelector('svg.lucide-more-horizontal');
    const moreButton = moreIcon?.closest('button');
    fireEvent.click(moreButton!);

    const duplicateButton = screen.getByText('Duplicate');
    fireEvent.click(duplicateButton);

    expect(mockProps.onDuplicate).toHaveBeenCalledWith(mockProject);
  });

  it('enters rename mode when rename is clicked', () => {
    render(<ProjectCard project={mockProject} {...mockProps} />);

    const moreIcon = document.querySelector('svg.lucide-more-horizontal');
    const moreButton = moreIcon?.closest('button');
    fireEvent.click(moreButton!);

    const renameButton = screen.getByText('Rename');
    fireEvent.click(renameButton);

    // Should show input field and buttons
    expect(screen.getByDisplayValue('Test Project')).toBeInTheDocument();
    const checkIcon = document.querySelector('svg.lucide-check');
    const xIcon = document.querySelector('svg.lucide-x');
    expect(checkIcon).toBeInTheDocument();
    expect(xIcon).toBeInTheDocument();
  });

  it('saves new title when rename is confirmed', () => {
    render(<ProjectCard project={mockProject} {...mockProps} />);

    // Enter rename mode
    const moreIcon = document.querySelector('svg.lucide-more-horizontal');
    const moreButton = moreIcon?.closest('button');
    fireEvent.click(moreButton!);
    fireEvent.click(screen.getByText('Rename'));

    // Change title
    const input = screen.getByDisplayValue('Test Project');
    fireEvent.change(input, { target: { value: 'New Project Title' } });

    // Confirm
    const checkIcon = document.querySelector('svg.lucide-check');
    const checkButton = checkIcon?.closest('button');
    fireEvent.click(checkButton!);

    expect(mockProps.onRename).toHaveBeenCalledWith(mockProject.id, 'New Project Title');
  });

  it('cancels rename when X is clicked', () => {
    render(<ProjectCard project={mockProject} {...mockProps} />);

    // Enter rename mode
    const moreIcon = document.querySelector('svg.lucide-more-horizontal');
    const moreButton = moreIcon?.closest('button');
    fireEvent.click(moreButton!);
    fireEvent.click(screen.getByText('Rename'));

    // Change title
    const input = screen.getByDisplayValue('Test Project');
    fireEvent.change(input, { target: { value: 'Changed Title' } });

    // Cancel
    const xIcon = document.querySelector('svg.lucide-x');
    const xButton = xIcon?.closest('button');
    fireEvent.click(xButton!);

    // Should be back to original title
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(mockProps.onRename).not.toHaveBeenCalled();
  });

  it('handles rename with Enter and Escape keys', () => {
    render(<ProjectCard project={mockProject} {...mockProps} />);

    // Enter rename mode
    const moreIcon = document.querySelector('svg.lucide-more-horizontal');
    const moreButton = moreIcon?.closest('button');
    fireEvent.click(moreButton!);
    fireEvent.click(screen.getByText('Rename'));

    const input = screen.getByDisplayValue('Test Project');

    // Test Enter key
    fireEvent.change(input, { target: { value: 'Enter Title' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockProps.onRename).toHaveBeenCalledWith(mockProject.id, 'Enter Title');

    // Reset and test Escape key
    vi.clearAllMocks();
    render(<ProjectCard project={mockProject} {...mockProps} />);
    fireEvent.click(screen.getByTestId('more-horizontal-icon').closest('button')!);
    fireEvent.click(screen.getByText('Rename'));

    const input2 = screen.getByDisplayValue('Test Project');
    fireEvent.change(input2, { target: { value: 'Escape Title' } });
    fireEvent.keyDown(input2, { key: 'Escape' });

    expect(mockProps.onRename).not.toHaveBeenCalled();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('prevents card click during rename mode', () => {
    render(<ProjectCard project={mockProject} {...mockProps} />);

    // Enter rename mode
    const moreIcon = document.querySelector('svg.lucide-more-horizontal');
    const moreButton = moreIcon?.closest('button');
    fireEvent.click(moreButton!);
    fireEvent.click(screen.getByText('Rename'));

    // Try to click card
    const card = screen.getByText('Test Project').closest('div');
    fireEvent.click(card!);

    // onClick should not be called during rename
    expect(mockProps.onClick).not.toHaveBeenCalled();
  });
});