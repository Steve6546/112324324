<div align="center">

# ⚡ Lovable Clone

### AI-Powered Code Editor & App Generator

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Gemini](https://img.shields.io/badge/Gemini_AI-Powered-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

<p align="center">
  <strong>Generate full web applications from natural language prompts using Google Gemini AI</strong>
</p>

[Features](#-features) • [Quick Start](#-quick-start) • [Tech Stack](#-tech-stack) • [Architecture](#-architecture) • [Roadmap](#-roadmap)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Code Generation** | Generate complete HTML/CSS/JS apps from text prompts |
| 📝 **Monaco Editor** | Professional VS Code-like editing experience |
| 👁️ **Live Preview** | Real-time sandboxed preview of your application |
| 💾 **IndexedDB Storage** | Persistent file storage across browser sessions |
| 🎨 **Multi-File Support** | Virtual file system with HTML, CSS, and JS files |
| ⚙️ **Settings Panel** | Configure AI model and API keys |
| 🔔 **Toast Notifications** | Clean feedback system for all operations |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ 
- **Gemini API Key** ([Get one free](https://aistudio.google.com/app/apikey))

### Installation

```bash
# Clone the repository
git clone https://github.com/Steve6546/112324324.git
cd 112324324

# Install dependencies
npm install

# Create environment file
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 19 + TypeScript |
| **Build Tool** | Vite 6.2 |
| **Styling** | Tailwind CSS v3 |
| **Code Editor** | Monaco Editor |
| **AI Engine** | Google Gemini API |
| **Storage** | IndexedDB (via `idb`) |
| **Icons** | Lucide React |

---

## 📁 Project Structure

```
lovable.dev/
├── components/
│   ├── Editor.tsx          # Main IDE component
│   ├── InputSection.tsx    # Prompt input UI
│   ├── BuildingScreen.tsx  # Code generation UI
│   ├── ProjectDashboard.tsx # Project management
│   ├── SettingsModal.tsx   # Settings configuration
│   ├── ApiKeyModal.tsx     # API key input
│   ├── Toast.tsx           # Notification system
│   └── editor/             # Editor sub-components
├── services/
│   └── gemini.ts           # Gemini AI integration
├── hooks/
│   └── useDebounce.ts      # Utility hooks
├── lib/
│   └── db.ts               # IndexedDB adapter
├── utils/
│   └── fileParser.ts       # HTML/CSS/JS parser
├── App.tsx                 # Main application
├── index.tsx               # Entry point
└── types.ts                # TypeScript definitions
```

---

## 🏗️ Architecture

### Data Flow
```
User Prompt → Gemini AI → Generated Code → Virtual Files → Monaco Editor → Live Preview
```

### Core Components

1. **App.tsx** - Main controller handling routing between views
2. **Editor.tsx** - Full IDE with file explorer, Monaco editor, and preview
3. **Gemini Service** - AI integration for code generation and editing
4. **IndexedDB Adapter** - Persistent storage for projects and files

---

## 🗺️ Roadmap

- [x] **Phase 0**: Core stability & foundation
- [x] **Phase 1**: IndexedDB file system
- [ ] **Phase 2**: Monaco diagnostics panel
- [ ] **Phase 3**: Blob URL preview engine
- [ ] **Phase 4**: WebContainer support

See [ROADMAP.md](./ROADMAP.md) for detailed plans.

---

## 📜 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Built with ❤️ using React, TypeScript, and Gemini AI</sub>
</div>
