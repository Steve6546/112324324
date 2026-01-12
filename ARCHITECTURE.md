# System Architecture: Lovable Clone

## Overview
This project is a browser-based AI code editor that allows users to generate and edit web applications (HTML/CSS/JS) using natural language prompts. It mimics the functionality of tools like Lovable.dev or v0.dev.

## Current Tech Stack (v1.1 - Stable)
*   **Frontend Framework:** React 19 (TypeScript)
*   **Build Tool:** Vite 6.2
*   **Styling:** Tailwind CSS v3 (Configured via PostCSS)
*   **Code Editor:** Monaco Editor (react-monaco-editor)
*   **AI Service:** Google Gemini API (gemini-1.5-flash / gemini-1.5-pro)
*   **State Management:** React Context + LocalStorage

## Core Components

### 1. App.tsx (Main Controller)
*   Handles routing between `Home`, `Building`, and `Editor` views.
*   Manages global `Project` state.
*   **Limitations:** State is currently monolithic.

### 2. Editor.tsx (The IDE)
*   **File System (Simulated):** Parses the single HTML string into virtual files (`index.html`, `style.css`, `script.js`) using Regex. This allows the user to see "files" even though they are stored as one unit.
*   **Preview Engine:** Uses an `iframe` with `srcdoc`. The `bundlePreview` function re-assembles the virtual files into a single HTML string for rendering.
    *   *Security Note:* Uses `sandbox` attribute.
*   **Monaco Integration:** Provides a real coding experience with syntax highlighting and line numbers.

### 3. Gemini Service (AI Brain)
*   `streamIdeaResponse`: Streams generated text for the planning phase.
*   `streamAppCode`: Generates the initial MVP code (Single File HTML).
*   `streamCodeEdit`: Takes the current full code + user prompt and returns a fully rewritten version.

## Data Flow
1.  **User Prompt** -> **Gemini Plan** -> **Approved**.
2.  **Gemini Code Gen** -> **App State (Project.code)**.
3.  **Editor Mounts**:
    *   `Project.code` -> `parseProjectCode()` -> `VirtualFiles[]`.
4.  **User Edits (Manual)**:
    *   `Monaco Change` -> `VirtualFile.content` update.
    *   `VirtualFiles[]` -> `bundlePreview()` -> `Update Live Preview`.
5.  **User Edits (AI)**:
    *   `VirtualFiles[]` -> `bundlePreview()` -> `Gemini` -> `New Full Code` -> `Reparse`.

## Known Constraints (The "Fake" Parts)
1.  **Persistence:** Files created manually in the UI that are NOT standard (e.g. `images.html`) might be lost if the Regex parser doesn't catch them during a re-parse cycle.
2.  **Complex Apps:** Since it relies on a single HTML bundle, multi-page routing is not natively supported (hash-routing is required).
3.  **No Backend:** All data is local.

## Future Roadmap (v2.0)
*   **IndexedDB File System:** Store files individually.
*   **Service Worker Preview:** Intercept requests to serve real file paths (`/style.css` instead of injection).
*   **Smart Diffing:** AI should return diffs, not full rewrites.
