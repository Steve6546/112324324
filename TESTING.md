# 🧪 Testing Guide

This document outlines the comprehensive testing strategy for the Lovable project.

## 📋 Test Types

### 1. Unit Tests
- **Framework**: Vitest + React Testing Library
- **Location**: `src/**/__tests__/*.test.{ts,tsx}`
- **Coverage**: Components, hooks, utilities, services

### 2. Integration Tests
- **Location**: `src/__tests__/workflows/*.test.tsx`
- **Coverage**: End-to-end workflows within the application

### 3. Progressive Enhancement Tests
- **Location**: `src/test/progressive-enhancement.test.tsx`
- **Coverage**: Device capability detection, feature availability
- **Purpose**: Ensures app works across different device types

### 4. Interaction Feature Tests
- **Location**: `src/test/interaction-features.test.tsx`
- **Coverage**: Voice commands, touch gestures, haptic feedback
- **Purpose**: Tests advanced UX features

### 5. E2E Tests
- **Framework**: Playwright
- **Location**: `e2e/*.spec.ts`
- **Coverage**: Full user journeys in the browser

## 🚀 Running Tests

### Unit & Integration Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Check coverage thresholds
npm run test:coverage:check

# Run all checks (types, lint, tests, coverage)
npm run test:all
```

### E2E Tests
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (visible browser)
npm run test:e2e:headed
```

### Code Quality
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## 📊 Coverage Requirements

| Category | Branches | Functions | Lines | Statements |
|----------|----------|-----------|-------|------------|
| Global   | 70%      | 70%       | 70%  | 70%        |
| Hooks    | 80%      | 80%       | 80%  | 80%        |
| Components| 75%     | 75%       | 75%  | 75%        |
| Library  | 85%      | 85%       | 85%  | 85%        |

## 🏗️ Project Structure

```
112324324/
├── components/
│   ├── __tests__/              # Component unit tests
│   │   ├── BuildingScreen.test.tsx
│   │   ├── ErrorBoundary.test.tsx
│   │   └── ...
│   └── editor/
│       └── __tests__/          # Editor component tests
│           ├── CodeEditor.test.tsx
│           └── FileExplorer.test.tsx
├── hooks/
│   └── __tests__/              # Hook unit tests
│       └── useProjectFileSystem.test.ts
├── lib/
│   └── __tests__/              # Utility tests
│       └── db.test.ts
├── services/
│   └── __tests__/              # Service tests
│       └── gemini.test.ts
├── src/
│   ├── __tests__/              # Integration tests
│   │   ├── App.integration.test.tsx
│   │   └── workflows/          # Workflow tests
│   │       ├── FileEditingWorkflow.test.tsx
│   │       └── ProjectCreationWorkflow.test.tsx
│   └── components/
│       └── __tests__/          # Component unit tests
│           ├── InputSection.test.tsx
│           ├── ProjectCard.test.tsx
│           └── Toast.test.tsx
└── test/                       # Test utilities & setup
    ├── advanced-test-utils.tsx # Advanced testing utilities
    ├── interaction-features.test.tsx    # Interaction feature tests
    ├── progressive-enhancement.test.tsx # Progressive enhancement tests
    ├── mocks.ts                # Global mocks
    ├── setup.ts               # Test environment setup
    ├── test-utils.tsx         # Testing utilities
    └── utils.tsx              # Test helper functions

e2e/                            # E2E tests
├── project-creation.spec.ts    # Project creation tests
└── editor.spec.ts             # Editor functionality tests

scripts/                       # Test scripts
└── check-coverage.js         # Coverage validation

e2e/                           # E2E tests
├── project-creation.spec.ts   # Project creation tests
└── editor.spec.ts            # Editor functionality tests

scripts/                      # Test scripts
└── check-coverage.js         # Coverage validation
```

## 🛠️ Testing Utilities

### Advanced Test Utils (`src/test/advanced-test-utils.tsx`)
```typescript
import { render, mockDeviceCapabilities, createMockLocalStorage } from 'src/test/advanced-test-utils';

// Enhanced render with better error handling
const { waitForLoadingToFinish } = render(<MyComponent />);

// Device capability mocking
mockDeviceCapabilities.touchDevice();
mockDeviceCapabilities.speechSupported();

// Mock creators
const mockLocalStorage = createMockLocalStorage();
const mockGoogleGenerativeAI = mockGoogleGenerativeAI();
```

### Progressive Enhancement Testing
```typescript
import { testProgressiveEnhancement } from 'src/test/advanced-test-utils';

describe('MyComponent', () => {
  testProgressiveEnhancement.testBasicFeatures(<MyComponent />);
  testProgressiveEnhancement.testAdvancedFeatures(<MyComponent />);
});
```

### Interaction Feature Testing
```typescript
import { mockDeviceCapabilities } from 'src/test/advanced-test-utils';

describe('Voice Commands', () => {
  it('works on supported devices', () => {
    mockDeviceCapabilities.speechSupported();
    // Test voice functionality
  });
});
```

### Test Utils (`src/test/test-utils.tsx`)
```typescript
import { render } from 'src/test/test-utils';

// Custom render with providers
const { getByText } = render(<MyComponent />);

// Mock data
import { mockProject, mockFile, mockFiles } from 'src/test/test-utils';

// Mock creators
const mockDB = createMockDatabase();
const mockLocalStorage = createMockLocalStorage();
```

### Mocks (`src/test/mocks.ts`)
Global mocks for browser APIs and external libraries.

### Custom Matchers
Extended Jest/Vitest matchers via `@testing-library/jest-dom`.

## 📝 Writing Tests

### Component Tests
```typescript
import { render, screen } from 'src/test/test-utils';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles user interactions', async () => {
    render(<MyComponent />);
    fireEvent.click(screen.getByText('Click me'));
    await waitFor(() => {
      expect(screen.getByText('Clicked!')).toBeInTheDocument();
    });
  });
});
```

### Hook Tests
```typescript
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from './useMyHook';

describe('useMyHook', () => {
  it('returns correct initial state', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe('initial');
  });

  it('updates state correctly', () => {
    const { result } = renderHook(() => useMyHook());

    act(() => {
      result.current.setValue('updated');
    });

    expect(result.current.value).toBe('updated');
  });
});
```

### Service Tests
```typescript
import { streamIdeaResponse } from 'services/gemini';

describe('Gemini Service', () => {
  it('streams responses correctly', async () => {
    const chunks = [];
    for await (const chunk of streamIdeaResponse('test prompt')) {
      chunks.push(chunk);
    }
    expect(chunks.length).toBeGreaterThan(0);
  });
});
```

### Progressive Enhancement Tests
```typescript
import { testProgressiveEnhancement } from 'src/test/advanced-test-utils';

describe('Component Progressive Enhancement', () => {
  it('works on low-end devices', () => {
    mockDeviceCapabilities.desktopDevice();
    mockDeviceCapabilities.lowEndDevice();

    render(<MyComponent />);
    // Should work without advanced features
  });

  it('enables advanced features on capable devices', () => {
    mockDeviceCapabilities.touchDevice();
    mockDeviceCapabilities.highEndDevice();
    mockDeviceCapabilities.speechSupported();

    render(<MyComponent />);
    // Should have voice commands and touch gestures
  });
});
```

### Interaction Feature Tests
```typescript
import { mockDeviceCapabilities } from 'src/test/advanced-test-utils';

describe('Voice Commands', () => {
  it('processes English commands', async () => {
    mockDeviceCapabilities.speechSupported();

    const mockOnSubmit = vi.fn();
    render(<InputSection onSubmit={mockOnSubmit} isGenerating={false} />);

    // Simulate voice command
    const voiceButton = screen.getByRole('button', { name: /voice/i });
    fireEvent.click(voiceButton);

    // Mock voice recognition result
    // Verify command processing
  });

  it('supports Arabic voice commands', async () => {
    Object.defineProperty(navigator, 'language', { value: 'ar-SA' });

    // Test Arabic language support
  });
});

describe('Touch Interactions', () => {
  it('provides haptic feedback', () => {
    mockDeviceCapabilities.touchDevice();

    const mockVibrate = vi.fn();
    navigator.vibrate = mockVibrate;

    render(<TouchableComponent />);
    fireEvent.click(screen.getByRole('button'));

    expect(mockVibrate).toHaveBeenCalled();
  });
});
```

### E2E Tests
```typescript
import { test, expect } from '@playwright/test';

test('complete user workflow', async ({ page }) => {
  await page.goto('/');

  // Interact with the app
  await page.fill('textarea', 'Create a todo app');
  await page.click('button:has-text("Chat")');

  // Verify results
  await expect(page.locator('text=Plan Preview')).toBeVisible();
});
```

## 🔧 CI/CD Integration

### GitHub Actions
- **Location**: `.github/workflows/ci.yml`
- **Triggers**: Push/PR to main/develop
- **Jobs**:
  - Unit tests with coverage
  - E2E tests
  - Build verification
  - Coverage reporting

### Local Development
```bash
# Run all pre-commit checks
npm run test:all

# Quick test run
npm test

# Focused testing
npm test -- MyComponent.test.tsx
```

## 🎯 Best Practices

### General
- ✅ Write tests for new features
- ✅ Test error conditions
- ✅ Use descriptive test names
- ✅ Keep tests fast and isolated
- ✅ Mock external dependencies

### Progressive Enhancement
- ✅ Test on different device capabilities
- ✅ Verify graceful degradation
- ✅ Test feature availability based on device support
- ✅ Ensure basic functionality works everywhere

### Interaction Features
- ✅ Test voice commands in multiple languages
- ✅ Verify touch gesture support
- ✅ Test haptic feedback availability
- ✅ Ensure accessibility compliance

### Device Compatibility
- ✅ Test touch vs desktop interactions
- ✅ Verify speech synthesis/recognition support
- ✅ Test network-dependent features
- ✅ Check performance on different devices

### Components
- ✅ Test rendering with different props
- ✅ Test user interactions
- ✅ Test loading and error states
- ✅ Use `screen` queries over container queries

### Hooks
- ✅ Test with `renderHook`
- ✅ Use `act()` for state updates
- ✅ Test cleanup functions
- ✅ Mock dependencies

### Services
- ✅ Mock API responses
- ✅ Test error handling
- ✅ Test retry logic
- ✅ Test streaming responses

### E2E
- ✅ Test complete user journeys
- ✅ Use data-testid for selectors
- ✅ Avoid testing implementation details
- ✅ Keep tests independent

## 🐛 Debugging Tests

### Common Issues
1. **Async operations**: Use `waitFor` or `findBy*`
2. **Timers**: Use `vi.useFakeTimers()` for debounced functions
3. **Network requests**: Mock with `vi.mock()` or `msw`
4. **DOM updates**: Ensure state updates are wrapped in `act()`

### Debugging Tools
```typescript
// Debug component output
screen.debug();

// Log test execution
console.log('Test value:', value);

// Inspect element
const element = screen.getByText('Click me');
console.log(element.outerHTML);
```

## 📈 Coverage Reports

Coverage reports are generated in:
- **HTML**: `coverage/lcov-report/index.html`
- **JSON**: `coverage/coverage-summary.json`
- **Console**: Run `npm run test:coverage`

## 🔄 Migration from Manual Tests

The project previously relied on manual tests in `TESTS.md`. Now we have:

| Manual Test | Automated Equivalent |
|-------------|---------------------|
| Refresh stability | `useProjectFileSystem` hook tests |
| File rename round-trip | Hook and workflow tests |
| Path normalization | `db.test.ts` |
| Collision detection | Hook tests |
| Debounce verification | Hook tests with fake timers |
| Fast file switching | Workflow tests |
| Migration once | Hook tests |
| Delete confirmation | Component tests |

## 🎉 Success Criteria

- [x] 70%+ code coverage across all categories
- [x] All critical user workflows tested
- [x] CI/CD pipeline passing
- [x] E2E tests covering main user journeys
- [x] Automated testing integrated into development workflow

## 📚 Additional Resources

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Library Best Practices](https://www.testing-library.com/docs/guiding-principles/)