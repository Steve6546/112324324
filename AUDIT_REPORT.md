# Comprehensive Code Audit & Technical Roadmap

**Date:** 2026-01-12
**Project:** Lovable.dev Clone
**Status:** Functional MVP (Refactored to Tailwind v3 + Monaco Editor)

## 1. Executive Summary
The project has successfully transitioned from a rough prototype to a functional MVP. The UI is now stable (Tailwind v3), the editor is professional (Monaco), and the AI integration is active. However, several core technologies are still "simulated" or "shallow," limiting the potential for complex app development.

## 2. Simulated Technologies (The "Fake" Parts)

### A. Virtual File System (VFS)
*   **Current State:** In-memory `VirtualFile[]` array initialized by regex-parsing a single `project.code` string.
*   **Limitations:**
    *   **Persistence:** Creating new files works in the session but is lossy upon reload/save because everything is flattened back into a single HTML string (`bundlePreview`).
    *   **Complexity:** Cannot support images, assets, or complex folder structures.
*   **Recommendation:** Move to a structured storage model where `Project` contains a `files` object (e.g., `files: { 'index.html': '...', 'style.css': '...' }`). Use `IndexedDB` (via `idb` library) for persistence.

### B. Live Preview (Bundler)
*   **Current State:** Basic string injection (`iframe.srcdoc`).
*   **Limitations:**
    *   **No Module Support:** Cannot use ES Modules (`import/export`) between user files.
    *   **Security:** `sandbox` attribute is present but basic.
*   **Recommendation:** Implement a browser-based bundler logic (like `Sandpack` or a custom `Blob` URL generator) that intercepts requests to serve "virtual" files properly, allowing imports.

### C. Problems Panel
*   **Current State:** Hardcoded check for `<!DOCTYPE>`.
*   **Limitations:** Does not reflect actual syntax errors or runtime errors from the preview.
*   **Recommendation:** Integrate with Monaco Editor's `onDidChangeModelDecorations` to pull real syntax errors (linting). Add a `window.onerror` listener inside the preview iframe to catch runtime errors and postMessage them to the editor.

## 3. Technology Stack Status

| Component | Status | Verification |
| :--- | :--- | :--- |
| **UI Framework** | **Real** (React 19 + Tailwind v3) | Verified via browser check. |
| **Code Editor** | **Real** (Monaco Editor) | Verified. Syntax highlighting & line numbers active. |
| **AI Engine** | **Real** (Gemini 1.5 Flash) | Verified. Streaming works. |
| **File System** | **Simulated** (Memory + LocalStorage flattened) | Needs architectural upgrade. |
| **CSS Processor** | **Real** (PostCSS + Autoprefixer) | Verified fixes. |

## 4. Immediate Action Plan (Next Steps)
1.  **Refactor Project Data Structure:** Update `types.ts` to store files individually, not as a single string.
2.  **Connect Monaco Linter:** Extract errors from Monaco and display them in the `Problems` panel.
3.  **Enhance Preview:** Listen for iframe console logs/errors and display them in a new "Console" tab in the editor.

## 5. Security & Stability
*   **CSP:** Currently relaxed (`unsafe-eval` allowed) to support dev mode. Should be tightened for production.
*   **API Key:** Stored in `localStorage`. Secure enough for client-side demo, but should eventually move to a proxy server for production.

---
*Created by Antigravity (Google Deepmind)*
