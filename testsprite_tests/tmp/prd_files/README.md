<div align="center">

# ⚡ Lovable Clone

### AI-Powered Code Editor & App Generator

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Gemini](https://img.shields.io/badge/Gemini_AI-Powered-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Tests](https://img.shields.io/badge/Tests-Vitest-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

<p align="center">
  <strong>Generate full web applications from natural language prompts using Google Gemini AI</strong>
</p>

<p align="center">
  <em>A browser-based IDE that lets you create, edit, and preview web applications with AI assistance</em>
</p>

[🚀 Quick Start](#-quick-start) • [✨ Features](#-features) • [🛠️ Tech Stack](#-tech-stack) • [📁 Project Structure](#-project-structure) • [🏗️ Architecture](#-architecture) • [🗺️ Roadmap](#-roadmap) • [❓ Troubleshooting](#-troubleshooting)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Code Generation** | Generate complete HTML/CSS/JS apps from natural language prompts using Google Gemini |
| 📝 **Monaco Editor** | Professional VS Code-like editing experience with syntax highlighting |
| 👁️ **Live Preview** | Real-time sandboxed preview of your application with iframe isolation |
| 💾 **Full IndexedDB Storage** | Complete file system persistence with migration support and data integrity |
| 🎨 **Multi-File Support** | Virtual file system with HTML, CSS, and JavaScript files management |
| ⚙️ **Advanced Settings** | Configure AI models, API keys with multiple Gemini options and preferences |
| 🌓 **Smart Theme System** | Light, dark, and system theme support with automatic detection |
| 🔔 **Toast Notifications** | Clean feedback system with different notification types |
| 🎯 **AI Chat Interface** | Refine and modify your projects with conversational AI and context awareness |
| 📱 **Mobile-First Design** | Responsive design optimized for mobile devices with touch-first approach |
| 👆 **Advanced Touch Interactions** | Enhanced touch gestures, haptic feedback, swipe-to-delete, and long-press actions |
| 🎤 **Multi-Language Voice Commands** | Voice input with Arabic and English support, smart recognition |
| ⚡ **Progressive Enhancement** | Automatic adaptation to device capabilities with 4 enhancement levels |
| 🌟 **Modern UI** | Glassmorphism design with smooth animations and accessibility features |
| 🔧 **Code Formatting** | Built-in code formatting with language-specific rules |
| 📊 **Project Management** | Organize projects with categories, starring, and advanced filtering |
| 🔄 **Real-time Sync** | Auto-save functionality with debounced writes and conflict resolution |
| 🧪 **Comprehensive Testing** | 70%+ test coverage with unit, integration, and E2E tests |
| 🔒 **Security First** | Content Security Policy, secure headers, and iframe sandboxing |
| 🌐 **Cross-Platform** | Works on desktop, tablet, and mobile with device-specific optimizations |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18 or higher
- **Gemini API Key** ([Get one free from Google AI Studio](https://aistudio.google.com/app/apikey))

### Installation

```bash
# Clone the repository
git clone https://github.com/Steve6546/112324324.git
cd 112324324

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser and start creating!

### First Time Setup

1. **Configure API Key**: Click "Set API Key" in the top-right corner
2. **Enter your Gemini API Key**: Get it from [Google AI Studio](https://aistudio.google.com/app/apikey)
3. **Choose AI Model**: Select from available Gemini models (free and paid options)
4. **Start Creating**: Use the input field to describe your app idea

---

## 🎯 How to Use

### Creating Your First Project

1. **Describe Your Idea**: Use natural language to describe what you want to build
   - Example: "Create a todo app with dark mode and local storage"

2. **AI Planning Phase**: Review and refine the AI-generated project plan

3. **Code Generation**: Watch as the AI builds your application with visual progress

4. **Edit & Refine**: Use the built-in editor to modify code or chat with AI for changes

5. **Preview & Export**: Test your app in multiple device sizes and export when ready

### AI Chat Features

- **Conversational Refinement**: Chat with AI to modify your project
- **Code Suggestions**: Get AI-powered code improvements
- **Bug Fixes**: Ask AI to identify and fix issues
- **Feature Additions**: Request new functionality in natural language

### File Management

- **Multi-File Support**: Work with HTML, CSS, and JavaScript files
- **Auto-Save**: Changes are automatically saved to browser storage
- **File Operations**: Create, rename, and delete files
- **Code Formatting**: Keep your code clean and readable

---

## 🛠️ Tech Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | React | 19.2.3 | Modern UI library with concurrent features and hooks |
| **Language** | TypeScript | 5.9.3 | Type-safe JavaScript with advanced type system |
| **Build Tool** | Vite | 6.4.1 | Fast development server and optimized production builds |
| **Styling** | Tailwind CSS | 3.4.19 | Utility-first CSS framework with custom design system |
| **Code Editor** | Monaco Editor | 4.7.0 | VS Code-like editing with syntax highlighting |
| **AI Engine** | Google Gemini API | 1.35.0 | Advanced AI for code generation and chat |
| **Storage** | IndexedDB | via `idb@8.0.3` | Full-featured client-side database |
| **Icons** | Lucide React | 0.562.0 | Consistent icon library |
| **Markdown** | React Markdown | 10.1.0 | Rich text rendering for AI responses |
| **Testing** | Vitest + RTL | 4.0.17 | Fast unit testing with React Testing Library |
| **E2E Testing** | Playwright | 1.57.0 | Cross-browser end-to-end testing |
| **Linting** | ESLint | 9.39.2 | Code quality and consistency enforcement |
| **Fonts** | Inter & Cairo | Google Fonts | Modern typography with Arabic support |

---

## 📁 Project Structure

```
112324324/
├── components/
│   ├── __tests__/              # Component unit tests
│   │   ├── BuildingScreen.test.tsx
│   │   ├── ErrorBoundary.test.tsx
│   │   └── ...
│   ├── ApiKeyModal.tsx         # Legacy API key modal (deprecated)
│   ├── BuildingScreen.tsx      # Animated code generation progress
│   ├── Editor.tsx              # Main IDE with file system integration
│   ├── ErrorBoundary.tsx       # Error handling component
│   ├── InputSection.tsx        # AI prompt input with themes & suggestions
│   ├── ProjectCard.tsx         # Project cards with actions
│   ├── ProjectDashboard.tsx    # Project grid and filtering
│   ├── SettingsModal.tsx       # AI model and API key configuration
│   ├── Toast.tsx               # Notification system
│   ├── ui/                     # UI components
│   └── editor/
│       ├── __tests__/          # Editor component tests
│       ├── CodeEditor.tsx      # Monaco editor wrapper
│       └── FileExplorer.tsx    # File tree with operations
├── contexts/
│   ├── ThemeContext.tsx                    # Theme state management
│   └── ProgressiveEnhancementContext.tsx   # Device capabilities context
├── hooks/
│   ├── __tests__/                          # Hook unit tests
│   ├── useDeviceCapabilities.ts            # Device capabilities detection
│   ├── useProjectFileSystem.ts             # File system management
│   ├── useTouchGestures.ts                 # Touch gesture handling
│   └── useVoiceCommands.ts                 # Voice command processing
├── lib/
│   ├── __tests__/                          # Utility function tests
│   └── db.ts                               # IndexedDB operations and utilities
├── services/
│   ├── __tests__/                          # Service tests
│   └── gemini.ts                           # AI integration with retry logic
├── src/
│   ├── __tests__/                          # Integration tests
│   │   └── workflows/                      # Workflow tests
│   ├── components/
│   │   └── __tests__/                      # Component unit tests
│   ├── contexts/                           # Application contexts
│   ├── lib/
│   │   └── __tests__/                      # Library tests
│   └── test/                               # Test utilities & setup
│       ├── advanced-test-utils.tsx         # Advanced testing utilities
│       ├── interaction-features.test.tsx   # Interaction feature tests
│       ├── progressive-enhancement.test.tsx # Progressive enhancement tests
│       ├── mocks.ts                        # Test mocks
│       ├── setup.ts                        # Test environment setup
│       └── utils.tsx                       # Test utilities
├── types.ts                                # TypeScript type definitions
├── utils/
│   └── formatter.ts                        # Code formatting utilities
├── index.html                              # HTML entry point with CSP
├── package.json                            # Dependencies and scripts
├── tailwind.config.js                      # Tailwind CSS configuration
├── tsconfig.json                           # TypeScript configuration
├── vite.config.ts                          # Vite build configuration
└── README.md                              # This file
```

---

## 🏗️ Architecture

### System Overview

Lovable Clone is a browser-based IDE that combines AI-powered code generation with a professional development environment. The system uses a layered architecture with clear separation of concerns.

### Data Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Prompt   │ -> │   Gemini AI     │ -> │  Project Plan   │
│                 │    │   Generation    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                         │
                                                         v
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Code Stream   │ -> │ Virtual Files   │ -> │  Monaco Editor  │
│   Generation    │    │   (IndexedDB)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                         │
                                                         v
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Live Preview  │ <- │   Bundle &      │ <- │   User Edits    │
│   (Sandboxed)   │    │   Inject CSS/JS │    │   (Auto-save)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Components

#### 1. **App.tsx** - Application Controller
- **Purpose**: Main routing and state management
- **Features**: View switching, project lifecycle, toast notifications
- **State**: Projects array, current view, active project

#### 2. **Editor.tsx** - Integrated Development Environment
- **Purpose**: Full IDE experience with file system integration
- **Features**: Monaco editor, file explorer, AI chat, live preview
- **Components**: CodeEditor, FileExplorer, preview iframe

#### 3. **Gemini Service** - AI Integration Layer
- **Purpose**: Interface to Google Gemini API
- **Features**: Streaming responses, retry logic, model selection
- **Capabilities**: Code generation, editing, planning, error handling

#### 4. **IndexedDB Adapter** - Persistence Layer
- **Purpose**: Client-side database for file and project storage
- **Features**: File operations, project management, migration support
- **Storage**: Projects, files, metadata, chat history

### Key Technologies

- **React 19**: Modern UI with concurrent features
- **Monaco Editor**: Professional code editing experience
- **IndexedDB**: Reliable client-side storage
- **Tailwind CSS**: Utility-first styling system
- **Vite**: Fast development and optimized builds

---

## 🗺️ Roadmap

### ✅ Completed Phases

- [x] **Phase 0**: Core stability & foundation (Q4 2024)
- [x] **Phase 1**: IndexedDB file system (Q4 2024)
- [x] **Phase 2**: Enhanced UI/UX and settings (Q1 2025)
- [x] **Phase 3**: AI chat interface and refinements (Q1 2025)

### 🔄 Current Development

- [x] **Phase 4**: Performance optimizations and error handling
- [ ] **Phase 5**: Monaco diagnostics and advanced features

### 🚀 Future Plans

- [ ] **Phase 6**: WebContainer integration for full-stack apps
- [ ] **Phase 7**: Collaborative editing features
- [ ] **Phase 8**: Plugin system and extensibility

See [ROADMAP.md](./ROADMAP.md) for detailed implementation plans.

---

## ❓ Troubleshooting

### Common Issues

#### API Key Problems
**Issue**: "API Key not configured" error
**Solution**:
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Click "Settings" in the app and enter your key
4. Save and refresh the page

#### Generation Fails
**Issue**: Code generation stops or fails
**Solutions**:
- Check your internet connection
- Verify API key is valid and has quota remaining
- Try a different AI model in settings
- Refresh the page and try again

#### Files Not Saving
**Issue**: Changes not persisting
**Solutions**:
- Check browser storage permissions
- Clear browser data for the site
- Try a different browser
- Check console for IndexedDB errors

#### Preview Not Updating
**Issue**: Live preview not reflecting changes
**Solutions**:
- Click "Save Project" to force sync
- Switch between Code/Preview tabs
- Refresh the page
- Check browser console for iframe errors

### Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome 120+ | ✅ Full Support | Recommended |
| Firefox 120+ | ✅ Full Support | Good performance |
| Safari 17+ | ✅ Full Support | Some features limited |
| Edge 120+ | ✅ Full Support | Based on Chromium |

### Performance Tips

- **Large Projects**: Break complex apps into smaller components
- **Memory Usage**: Close unused browser tabs
- **Storage**: Regularly clean old projects you don't need
- **Network**: Use stable internet for AI features

---

## 📜 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server on port 5173
npm run build            # Build for production
npm run preview          # Preview production build locally

# Testing
npm run test             # Run tests in watch mode
npm run test:watch       # Run tests in watch mode (alias)
npm run test:ci          # Run tests for CI (single run with coverage)
npm run test:coverage    # Run tests with coverage report
npm run test:all         # Run all checks (types, lint, tests, coverage)
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # Run E2E tests with UI
npm run test:e2e:headed  # Run E2E tests in headed mode

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting issues automatically
npm run type-check       # Run TypeScript type checking
npm run test:coverage:check # Verify coverage thresholds
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Optional: Pre-configure API key for development
GEMINI_API_KEY=your_api_key_here
```

### Building for Production

```bash
# Build the application
npm run build

# The build artifacts will be stored in the `dist/` directory
# Ready for deployment to any static hosting service
```

---

## 🧪 Testing

### Security

This project implements comprehensive security measures including Content Security Policy (CSP), secure headers, and iframe sandboxing.

See [SECURITY.md](./SECURITY.md) for detailed security guidelines and configurations.

### Testing

This project uses **Vitest** for unit and integration testing, with **React Testing Library** for component testing.

### Running Tests

```bash
# Run tests in watch mode (development)
npm test

# Run tests once with coverage
npm run test:coverage

# Run tests for CI (no watch mode)
npm run test:ci
```

### Test Structure

```
src/
├── __tests__/              # Integration tests
│   └── App.integration.test.tsx
├── components/__tests__/   # Component unit tests
│   ├── ProjectCard.test.tsx
│   ├── InputSection.test.tsx
│   └── Toast.test.tsx
├── lib/__tests__/          # Utility function tests
│   └── db.test.ts
└── test/                   # Test utilities and setup
    ├── setup.ts            # Test environment setup
    ├── utils.tsx           # Custom render utilities
    └── mocks.ts            # External dependency mocks
```

### Test Coverage

The project maintains test coverage thresholds:
- **Statements**: 50%
- **Branches**: 50%
- **Functions**: 50%
- **Lines**: 50%

Coverage reports are generated in the `coverage/` directory and uploaded to Codecov.

### Writing Tests

#### Component Tests
```typescript
import { render, screen, fireEvent } from '../test/utils';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles user interactions', () => {
    render(<MyComponent />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

#### Utility Function Tests
```typescript
import { myUtilityFunction } from './utils';

describe('myUtilityFunction', () => {
  it('returns expected result', () => {
    expect(myUtilityFunction('input')).toBe('expected output');
  });

  it('handles edge cases', () => {
    expect(() => myUtilityFunction(null)).toThrow('Invalid input');
  });
});
```

### CI/CD

Tests run automatically on:
- **Push** to `main` or `develop` branches
- **Pull Requests** targeting `main` or `develop`

The CI pipeline includes:
- ✅ **Linting** (if configured)
- ✅ **TypeScript** type checking
- ✅ **Build** verification
- ✅ **Test execution** with coverage
- ✅ **Coverage reporting** to Codecov

### Test Best Practices

1. **Use descriptive test names** that explain the expected behavior
2. **Test user interactions** rather than implementation details
3. **Mock external dependencies** (API calls, localStorage, etc.)
4. **Use `screen` queries** instead of component internals
5. **Test error states** and edge cases
6. **Keep tests fast** and isolated
7. **Use `beforeEach`** to reset state between tests

### Theme System

The app supports three theme modes:

- **Light**: Always use light theme
- **Dark**: Always use dark theme (default)
- **System**: Automatically follow your system's theme preference

**How to change theme:**
1. Click the theme toggle button in the top-right corner
2. Choose your preferred theme from the dropdown
3. Your choice is automatically saved and persists across sessions

**Theme Features:**
- Smooth transitions between themes
- Consistent theming across all components
- Respects system preferences when set to "System" mode
- All UI elements adapt to the selected theme

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/112324324.git`
3. Install dependencies: `npm install`
4. Start development: `npm run dev`
5. Make your changes
6. Test thoroughly
7. Submit a pull request

### Guidelines

- **Code Style**: Follow existing TypeScript/React patterns
- **Testing**: Test all functionality before submitting
- **Documentation**: Update README for new features
- **Commits**: Use clear, descriptive commit messages

### Areas for Contribution

- UI/UX improvements
- Performance optimizations
- New AI features
- Better error handling
- Documentation improvements
- Browser compatibility fixes

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- **Google Gemini AI** for powering the code generation
- **Microsoft Monaco Editor** for the professional editing experience
- **Tailwind CSS** for the beautiful styling system
- **Vite** for the fast development experience
- **React** ecosystem for the robust UI framework

---

<div align="center">
  <sub>Built with ❤️ using React, TypeScript, and Gemini AI</sub>
  <br>
  <sub>Inspired by the amazing work at Lovable.dev</sub>
</div>
