import { render, screen } from '../../src/test/utils';
import BuildingScreen from '../BuildingScreen';

describe('BuildingScreen', () => {
  const defaultProps = {
    projectTitle: 'My Awesome App',
    currentStep: 2,
  };

  it('renders building screen with correct title', () => {
    render(<BuildingScreen {...defaultProps} />);

    expect(screen.getByText('Building My Awesome App')).toBeInTheDocument();
    expect(screen.getByText('Our AI architect is constructing your vision.')).toBeInTheDocument();
  });

  it('displays terminal output section', () => {
    render(<BuildingScreen {...defaultProps} />);

    expect(screen.getByText('TERMINAL OUTPUT')).toBeInTheDocument();
  });

  it('renders all building steps', () => {
    render(<BuildingScreen {...defaultProps} />);

    const steps = [
      'Analyzing project requirements...',
      'Scaffolding application architecture...',
      'Generating component structure...',
      'Optimizing Tailwind CSS classes...',
      'Assembling final build...',
    ];

    steps.forEach(step => {
      expect(screen.getByText(step)).toBeInTheDocument();
    });
  });

  it('shows current step with spinner and highlight', () => {
    render(<BuildingScreen {...defaultProps} />);

    const currentStepText = screen.getByText('Generating component structure...');
    const currentStepContainer = currentStepText.closest('div');

    expect(currentStepContainer).toHaveClass('text-blue-400', 'translate-x-1', 'font-medium');
  });

  it('shows completed steps with checkmarks', () => {
    render(<BuildingScreen {...defaultProps} />);

    // Steps 0 and 1 should be completed (currentStep = 2)
    const analyzingStep = screen.getByText('Analyzing project requirements...').closest('div');
    const scaffoldingStep = screen.getByText('Scaffolding application architecture...').closest('div');

    expect(analyzingStep).toHaveClass('text-green-500/70');
    expect(scaffoldingStep).toHaveClass('text-green-500/70');
  });

  it('shows pending steps with gray styling', () => {
    render(<BuildingScreen {...defaultProps} />);

    // Steps 3 and 4 should be pending (currentStep = 2)
    const optimizingStep = screen.getByText('Optimizing Tailwind CSS classes...').closest('div');
    const assemblingStep = screen.getByText('Assembling final build...').closest('div');

    expect(optimizingStep).toHaveClass('text-gray-600');
    expect(assemblingStep).toHaveClass('text-gray-600');
  });

  it('displays code snippet when provided', () => {
    const codeSnippet = '<html><body>Hello World</body></html>';
    render(<BuildingScreen {...defaultProps} generatedCodeSnippet={codeSnippet} />);

    expect(screen.getByText(codeSnippet)).toBeInTheDocument();
  });

  it('hides code rain effect when no snippet provided', () => {
    render(<BuildingScreen {...defaultProps} />);

    // Code rain container should not be present
    const codeRain = document.querySelector('.opacity-20');
    expect(codeRain).not.toBeInTheDocument();
  });

  it('shows spinner animation for current step', () => {
    render(<BuildingScreen {...defaultProps} />);

    // Find the current step container and check for spinner
    const currentStepElements = screen.getAllByRole('generic').filter(el =>
      el.classList.contains('animate-spin') &&
      el.classList.contains('shrink-0')
    );

    expect(currentStepElements.length).toBeGreaterThan(0);
  });

  it('shows check icons for completed steps', () => {
    render(<BuildingScreen {...defaultProps} />);

    // Should have check icons for completed steps
    const checkIcons = document.querySelectorAll('svg');
    const checkIconPaths = Array.from(checkIcons).filter(icon =>
      icon.querySelector('polyline')
    );

    expect(checkIconPaths.length).toBe(2); // Two completed steps
  });

  it('applies correct styling to the main container', () => {
    render(<BuildingScreen {...defaultProps} />);

    const mainContainer = screen.getByText('Building My Awesome App').closest('.fixed');
    expect(mainContainer).toHaveClass(
      'fixed',
      'inset-0',
      'z-50',
      'bg-black',
      'flex',
      'flex-col',
      'items-center',
      'justify-center'
    );
  });

  it('handles first step (step 0)', () => {
    render(<BuildingScreen {...defaultProps} currentStep={0} />);

    const firstStep = screen.getByText('Analyzing project requirements...').closest('div');
    expect(firstStep).toHaveClass('text-blue-400', 'translate-x-1', 'font-medium');

    // No completed steps
    const checkIcons = document.querySelectorAll('svg');
    const checkIconPaths = Array.from(checkIcons).filter(icon =>
      icon.querySelector('polyline')
    );
    expect(checkIconPaths.length).toBe(0);
  });

  it('handles last step (step 4)', () => {
    render(<BuildingScreen {...defaultProps} currentStep={4} />);

    const lastStep = screen.getByText('Assembling final build...').closest('div');
    expect(lastStep).toHaveClass('text-blue-400', 'translate-x-1', 'font-medium');

    // Four completed steps
    const checkIcons = document.querySelectorAll('svg');
    const checkIconPaths = Array.from(checkIcons).filter(icon =>
      icon.querySelector('polyline')
    );
    expect(checkIconPaths.length).toBe(4);
  });

  it('applies backdrop blur and styling to terminal section', () => {
    render(<BuildingScreen {...defaultProps} />);

    const terminalSection = screen.getByText('TERMINAL OUTPUT').closest('div');
    expect(terminalSection).toHaveClass(
      'bg-[#18181b]/80',
      'backdrop-blur-md',
      'border',
      'border-white/10',
      'rounded-xl'
    );
  });
});