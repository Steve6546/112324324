import { render, screen } from '../../test/utils';
import { ToastProvider, useToast } from '../../../components/Toast';

// Test component that uses the toast hook
const TestComponent = () => {
  const { showToast } = useToast();

  return (
    <div>
      <button onClick={() => showToast('Test message', 'success')}>
        Show Toast
      </button>
    </div>
  );
};

describe('Toast', () => {
  it('renders toast provider without crashing', () => {
    render(
      <ToastProvider>
        <div>Test content</div>
      </ToastProvider>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('can use toast hook within provider', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    expect(screen.getByText('Show Toast')).toBeInTheDocument();
  });
});