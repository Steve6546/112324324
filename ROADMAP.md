# Professional Development Roadmap: From MVP to Real Cloud IDE

## Phase 0: Stability & Foundation (Current Focus)
**Goal:** Ensure zero data loss and UI stability.
**Key Change:** Define a robust Data Model via `StorageAdapter`.

### New Data Model
```typescript
interface Project { 
    id: string;
    name: string;
    createdAt: string; 
    updatedAt: string; 
}

interface FileNode { 
    id: string; 
    projectId: string; 
    path: string; 
    type: 'file' | 'folder'; 
    content: string; 
    updatedAt: string; 
}
```

## Phase 1: Real File System (IndexedDB)
**Implementation:**
*   Tech: `idb` (IndexedDB Wrapper).
*   Structure: `db.ts` acting as the Storage Adapter.
*   Operations: `createFile`, `readFile`, `writeFile`, `renamePath`, `deletePath`.
*   **Success Criteria:** Multi-file projects persist across reloads.

## Phase 2: Real Problems Panel (Monaco Markers)
**Implementation:**
*   Listen to `monaco.editor.onDidChangeModelDecorations`.
*   Group errors by File + Severity.
*   Clicking an error opens the file and jumps to the line.

## Phase 3: Enhanced Preview Engine (No-Build)
**Goal:** Robust HTML/CSS/JS preview without fragile string replacement.
**Implementation:**
*   **Bundler:** 
    *   HTML Entry point.
    *   CSS -> Blob URL (`<link href="blob:...">`).
    *   JS -> Blob URL (Module scripts).
*   **Sandbox:** `iframe` with `postMessage` bridge for console logs.

## Phase 4: Full WebContainer Preview (Future)
**Goal:** Run React/Vite/Next.js directly in the browser via WebAssembly.

## AI Upgrade Strategy (Context Aware)
**Goal:** AI understands the whole project structure, not just one file.
*   **Input:** Tree summary + Top-K files + Recent Diffs.
*   **Output:** JSON Patch (Files to edit, create, delete).
*   **Verification:** Loop that checks markers/preview before confirming.
