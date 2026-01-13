# System Architecture: Lovable Clone v2.0

## Overview
Lovable Clone is an enterprise-ready, browser-based AI code editor that generates and edits web applications using natural language prompts. It features a complete development environment with advanced UX, comprehensive testing, and production-grade security.

## Current Tech Stack (v2.0 - Enterprise Ready)
*   **Frontend Framework:** React 19.2.3 (TypeScript 5.9.3)
*   **Build Tool:** Vite 6.4.1 with optimized production builds
*   **Styling:** Tailwind CSS 3.4.19 with custom design system
*   **Code Editor:** Monaco Editor 4.7.0 with advanced features
*   **AI Service:** Google Gemini API 1.35.0 (multi-model support)
*   **Storage:** IndexedDB via idb@8.0.3 (full file system)
*   **Testing:** Vitest 4.0.17 + Playwright 1.57.0
*   **State Management:** React Context + Progressive Enhancement
*   **Security:** CSP, secure headers, iframe sandboxing

## Architecture Layers

### 🏗️ 1. Presentation Layer (React Components)

#### Core Components
- **App.tsx**: Main application controller with routing and state management
- **Editor.tsx**: Integrated IDE with file system, preview, and AI chat
- **ProjectDashboard.tsx**: Project management and filtering interface
- **InputSection.tsx**: AI prompt input with voice commands and themes

#### UI Components
- **BuildingScreen.tsx**: Animated progress indicator for AI generation
- **SettingsModal.tsx**: Configuration panel for AI models and preferences
- **Toast.tsx**: Notification system with multiple types
- **ErrorBoundary.tsx**: Error handling and crash recovery

#### Editor Components
- **CodeEditor.tsx**: Monaco Editor wrapper with language support
- **FileExplorer.tsx**: File tree with CRUD operations

### 🎯 2. Business Logic Layer (React Hooks)

#### Device & Capability Management
- **useDeviceCapabilities.ts**: Comprehensive device detection (28+ capabilities)
- **useProgressiveEnhancement.ts**: Feature gating based on device capabilities
- **ProgressiveEnhancementContext.tsx**: Global enhancement state management

#### User Interaction Hooks
- **useTouchGestures.ts**: Touch gesture recognition and haptic feedback
- **useVoiceCommands.ts**: Multi-language voice command processing
- **useProjectFileSystem.ts**: Full IndexedDB file system operations

#### Core Functionality
- **useProjectFileSystem.ts**: File CRUD, auto-save, migration support

### 🔧 3. Service Layer (External Integrations)

#### AI Services
- **gemini.ts**: Google Gemini API integration with streaming and retry logic
- Features: Code generation, editing, planning, error handling

#### Storage Services
- **db.ts**: IndexedDB abstraction layer with migration and data integrity
- Operations: Projects, files, metadata, chat history persistence

### 📊 4. Data Layer (State & Persistence)

#### Data Models
```typescript
interface Project {
  id: string;
  name: string;
  description?: string;
  category?: string;
  starred?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FileNode {
  id: string;
  projectId: string;
  path: string;
  type: 'file' | 'folder';
  content: string;
  language?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### Storage Architecture
- **IndexedDB**: Primary storage with transaction support
- **Migration System**: Automatic schema updates and data integrity
- **Auto-save**: Debounced writes (700ms) with pending queue management

## Advanced Features Architecture

### 🔄 Progressive Enhancement System

#### Enhancement Levels
1. **Basic**: Core functionality (all devices)
2. **Standard**: Enhanced UX (fast connections, modern devices)
3. **Advanced**: Rich interactions (WebGL, smooth animations)
4. **Premium**: All features (speech, haptic, real-time)

#### Capability Detection
- **Hardware**: Touch, speech, geolocation, sensors
- **Performance**: CPU cores, memory, connection speed
- **Browser**: WebGL, WebRTC, Service Worker, WebAssembly
- **Display**: Retina, hover, fine pointer, screen size

### 🎤 Voice & Touch Systems

#### Voice Commands
- **Languages**: English, Arabic with smart recognition
- **Commands**: Project management, navigation, editing
- **Integration**: Speech synthesis for feedback

#### Touch Gestures
- **Gestures**: Tap, long press, swipe, pinch
- **Feedback**: Haptic vibration, visual responses
- **Accessibility**: Alternative input methods

### 🔒 Security Architecture

#### Content Security Policy
- **Strict CSP**: Production-grade security headers
- **Dynamic Content**: Blob URLs for generated applications
- **External Resources**: Controlled access to CDNs and APIs

#### Sandboxing
- **iframe Isolation**: Generated apps run in sandboxed iframes
- **Permission Control**: Granular permission management
- **Secure Headers**: XSS protection, clickjacking prevention

## Data Flow Architecture

### 1. Project Creation Flow
```
User Prompt → AI Planning → Code Generation → File System → Live Preview
     ↓           ↓           ↓            ↓          ↓
  InputSection → Gemini API → Parser → IndexedDB → iframe
```

### 2. File Editing Flow
```
User Edit → Monaco → Virtual Files → Auto-save → Preview Update
     ↓         ↓         ↓              ↓            ↓
  CodeEditor → Change → FileNode → Debounced → bundlePreview
```

### 3. AI Refinement Flow
```
User Request → Context Gathering → AI Processing → Diff Application → Validation
      ↓              ↓                  ↓              ↓             ↓
  Chat Input → Project Files → Gemini API → File Updates → Preview Check
```

## Testing Architecture

### 🧪 Test Pyramid
- **Unit Tests (70%)**: Components, hooks, utilities with Vitest + RTL
- **Integration Tests (20%)**: Workflows and component interactions
- **E2E Tests (10%)**: Full user journeys with Playwright

### 🎯 Test Categories
- **Component Tests**: Rendering, interactions, props validation
- **Hook Tests**: State management, side effects, cleanup
- **Service Tests**: API calls, error handling, data persistence
- **Progressive Enhancement**: Device capability simulation
- **Interaction Tests**: Voice commands, touch gestures

## Performance Optimizations

### 🚀 Runtime Performance
- **Code Splitting**: Dynamic imports for large components
- **Lazy Loading**: Components loaded on demand
- **Memoization**: React.memo, useMemo, useCallback optimization
- **Virtual Scrolling**: Efficient large list rendering

### 💾 Memory Management
- **Cleanup**: Event listeners, timers, subscriptions
- **Debouncing**: Auto-save with 700ms delay and flush queues
- **Garbage Collection**: Explicit cleanup on unmount

### 🌐 Network Optimization
- **API Batching**: Multiple requests optimization
- **Caching**: IndexedDB for offline functionality
- **Compression**: Gzip for production builds

## Deployment Architecture

### 🏭 Build Pipeline
- **Development**: Hot reload, source maps, fast iteration
- **Production**: Minification, tree shaking, asset optimization
- **Testing**: Automated CI/CD with coverage verification

### 🔐 Security in Production
- **CSP Headers**: Strict content security policies
- **Secure Headers**: XSS protection, clickjacking prevention
- **HTTPS Only**: Secure communication channels
- **Dependency Auditing**: Regular security updates

## Evolution from v1.0 to v2.0

### Key Improvements
1. **File System**: Single HTML string → Full IndexedDB file system
2. **UX**: Basic interface → Progressive enhancement system
3. **Testing**: Manual testing → 70%+ automated coverage
4. **Security**: Basic security → Enterprise-grade protections
5. **Performance**: Basic optimization → Advanced performance features

### Architecture Maturity
- **Scalability**: Component-based architecture with clear separation
- **Maintainability**: TypeScript strict mode, comprehensive testing
- **Reliability**: Error boundaries, data integrity, crash recovery
- **Security**: CSP, secure headers, sandboxing
- **Accessibility**: WCAG compliance, progressive enhancement

This architecture provides a solid foundation for future enhancements including WebContainer integration, collaborative features, and plugin ecosystems.
