import { render, screen, fireEvent } from '../../src/test/utils';
import ErrorBoundary from '../ErrorBoundary';
import { vi } from 'vitest';

// Component that throws an error
const ThrowError = ({ message }: { message?: string }) => {
  throw new Error(message || 'Test error');
};

// Component that doesn't throw
const SafeComponent = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="safe-component">{children}</div>
);

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for cleaner test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <SafeComponent>Safe content</SafeComponent>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('safe-component')).toBeInTheDocument();
    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('displays fallback UI when an error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('displays custom error message', () => {
    const customMessage = 'Custom error message';
    render(
      <ErrorBoundary>
        <ThrowError message={customMessage} />
      </ErrorBoundary>
    );

    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('displays default message when no error message', () => {
    const ThrowEmptyError = () => {
      const error = new Error();
      error.message = '';
      throw error;
    };

    render(
      <ErrorBoundary>
        <ThrowEmptyError />
      </ErrorBoundary>
    );

    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
  });

  it('logs error to console when error occurs', () => {
    const consoleSpy = vi.spyOn(console, 'error');

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.any(Error),
      expect.any(Object)
    );
  });

  it('resets error state when Try Again is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Click Try Again
    fireEvent.click(screen.getByText('Try Again'));

    // Rerender with safe component
    rerender(
      <ErrorBoundary>
        <SafeComponent>Now safe</SafeComponent>
      </ErrorBoundary>
    );

    expect(screen.getByText('Now safe')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('handles multiple errors correctly', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError message="First error" />
      </ErrorBoundary>
    );

    expect(screen.getByText('First error')).toBeInTheDocument();

    // Reset and try again with different error
    fireEvent.click(screen.getByText('Try Again'));

    rerender(
      <ErrorBoundary>
        <ThrowError message="Second error" />
      </ErrorBoundary>
    );

    expect(screen.getByText('Second error')).toBeInTheDocument();
  });

  it('maintains error state between renders', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError message="Persistent error" />
      </ErrorBoundary>
    );

    expect(screen.getByText('Persistent error')).toBeInTheDocument();

    // Rerender without changing children
    rerender(
      <ErrorBoundary>
        <ThrowError message="Persistent error" />
      </ErrorBoundary>
    );

    expect(screen.getByText('Persistent error')).toBeInTheDocument();
  });

  it('applies correct styling to error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const errorContainer = screen.getByText('Something went wrong').closest('div');
    expect(errorContainer).toHaveClass('bg-[#18181b]', 'border-red-500/30', 'rounded-2xl');

    const iconContainer = screen.getByRole('img', { hidden: true }).closest('div');
    expect(iconContainer).toHaveClass('bg-red-500/10', 'rounded-full');
  });

  it('shows retry button with correct styling', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toHaveClass(
      'px-6',
      'py-2',
      'bg-blue-600',
      'hover:bg-blue-500',
      'text-white',
      'rounded-lg',
      'flex',
      'items-center',
      'gap-2'
    );
  });

  it('renders error boundary as fullscreen overlay', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const overlay = screen.getByText('Something went wrong').closest('.fixed');
    expect(overlay).toHaveClass('fixed', 'inset-0', 'bg-black', 'flex', 'items-center', 'justify-center');
  });

  it('handles Error objects without message property', () => {
    const ThrowMalformedError = () => {
      throw {}; // Not an Error object
    };

    render(
      <ErrorBoundary>
        <ThrowMalformedError />
      </ErrorBoundary>
    );

    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
  });
});