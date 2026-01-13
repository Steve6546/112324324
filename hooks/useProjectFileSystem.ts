import { useState, useEffect, useCallback, useRef } from 'react';
import { db, normalizePath, validateName } from '../lib/db';
import { Project, FileNode } from '../types';

// Helper to convert Legacy parsed files to proper FileNodes
const convertVirtualFilesToNodes = (projectId: string, virtualFiles: any[]): FileNode[] => {
    return virtualFiles.map(vf => ({
        id: vf.id || crypto.randomUUID(),
        projectId,
        name: vf.name,
        path: normalizePath(`/${vf.name}`), // Normalized root path
        type: 'file' as const,
        content: vf.content,
        language: vf.language,
        createdAt: Date.now(),
        updatedAt: Date.now()
    }));
};

// Legacy Parser
const parseProjectCodeLegacy = (fullHtml: string): any[] => {
    const files: any[] = [];
    const styleMatch = fullHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    const cssContent = styleMatch ? styleMatch[1].trim() : "";
    const scriptMatch = fullHtml.match(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/i);
    const jsContent = scriptMatch ? scriptMatch[1].trim() : "";

    files.push({ id: crypto.randomUUID(), name: 'index.html', language: 'html', content: fullHtml });
    if (cssContent) files.push({ id: crypto.randomUUID(), name: 'styles.css', language: 'css', content: cssContent });
    if (jsContent) files.push({ id: crypto.randomUUID(), name: 'script.js', language: 'javascript', content: jsContent });

    return files;
};

// Debounce configuration
const DEBOUNCE_MS = 700; // 700ms debounce per file

// Pending writes tracker (for flush on unmount/blur)
type PendingWrite = {
    content: string;
    timerId: NodeJS.Timeout;
};

export const useProjectFileSystem = (project: Project) => {
    const [files, setFiles] = useState<FileNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFileId, setActiveFileId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Pending writes map: fileId -> { content, timerId }
    const pendingWrites = useRef<Map<string, PendingWrite>>(new Map());

    // --- Flush Function: Immediately save all pending writes ---
    const flushPendingWrites = useCallback(async () => {
        const pending = Array.from(pendingWrites.current.entries());

        for (const [fileId, { content, timerId }] of pending) {
            clearTimeout(timerId);
            try {
                await db.updateFileContent(fileId, content);
                console.log(`[Flush] File ${fileId} saved.`);
            } catch (e) {
                console.error(`[Flush] Failed to save file ${fileId}:`, e);
            }
        }

        pendingWrites.current.clear();
    }, []);

    // Flush on unmount or when switching files
    useEffect(() => {
        return () => {
            // Sync flush on unmount (best effort)
            const pending = Array.from(pendingWrites.current.entries());
            for (const [fileId, { content, timerId }] of pending) {
                clearTimeout(timerId);
                // Fire and forget (can't await in cleanup)
                db.updateFileContent(fileId, content).catch(e =>
                    console.error(`[Cleanup] Failed to save ${fileId}:`, e)
                );
            }
            pendingWrites.current.clear();
        };
    }, []);

    // Initial Load & Migration (ONE-TIME)
    useEffect(() => {
        const loadFiles = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Check if already migrated
                const alreadyMigrated = await db.hasMigrated(project.id);

                const dbFiles = await db.getProjectFiles(project.id);

                if (dbFiles && dbFiles.length > 0) {
                    // Debug: Found existing files in database
                    console.log('[DEBUG] Found existing files in database:', { projectId: project.id, dbFilesCount: dbFiles.length, alreadyMigrated, firstFile: dbFiles[0] });
                    // Files exist in DB - use them
                    setFiles(dbFiles);
                    if (!activeFileId) setActiveFileId(dbFiles[0].id);

                    // Mark as migrated if not already (for existing projects loaded from DB)
                    if (!alreadyMigrated) {
                        await db.setMigrated(project.id);
                        // Debug: Marked project as migrated
                        console.log('[DEBUG] Marked project as migrated:', { projectId: project.id });
                    }
// Debug: Starting migration check
console.log('[DEBUG] Starting migration check:', { projectId: project.id, alreadyMigrated, dbFilesCount: dbFiles?.length || 0, hasCode: !!project.code });

                } else if (!alreadyMigrated && project.code) {
                    // No files in DB AND not migrated AND has legacy code -> Migrate
                    console.log(`[Migration] Migrating project ${project.id}...`);

// Debug: Starting migration process
console.log('[DEBUG] Starting migration process:', { projectId: project.id, hasCode: !!project.code });

                    const legacyFiles = parseProjectCodeLegacy(project.code);
                    const newNodes = convertVirtualFilesToNodes(project.id, legacyFiles);

// Debug: Parsed legacy files
console.log('[DEBUG] Parsed legacy files:', { legacyFilesCount: legacyFiles.length, newNodesCount: newNodes.length, firstNode: newNodes[0] });

                    let migratedCount = 0;
                    for (const node of newNodes) {
                        // Debug: Attempting to create file
                        console.log('[DEBUG] Attempting to create file:', { fileName: node.name, filePath: node.path, projectId: node.projectId });
                        try {
                            await db.createFile(node);
                            migratedCount++;
                            // Debug: File created successfully
                            console.log('[DEBUG] File created successfully:', { fileName: node.name, migratedCount });
                        } catch (e: any) {
                            // Handle collision during migration
                            if (e.message?.includes('already exists') || e.message?.includes('ConstraintError')) {
                                // Debug: Skipping duplicate file during migration
                                console.log('[DEBUG] Skipping duplicate file during migration:', { fileName: node.name, filePath: node.path, errorMessage: e.message });
                                console.warn(`[Migration] Skipping duplicate: ${node.path}`);
                            } else {
                                // Debug: Migration failed with unexpected error
                                console.log('[DEBUG] Migration failed with unexpected error:', { fileName: node.name, filePath: node.path, errorMessage: e.message, errorName: e.name });
                                console.error(`[Migration] Failed to migrate file ${node.name}:`, e);
                                throw new Error(`Migration failed for file ${node.name}: ${e.message}`);
                            }
                        }
                    }

                    // Mark migration complete
                    await db.setMigrated(project.id);
                    console.log(`[Migration] Project ${project.id} migrated successfully (${migratedCount} files).`);

                    setFiles(newNodes);
                    if (newNodes.length > 0) setActiveFileId(newNodes[0].id);
                } else {
                    // Empty project or already migrated with no files
                    setFiles([]);
                }
            } catch (err: any) {
                console.error("Failed to load project files:", err);
                const errorMessage = err.message?.includes('Migration failed')
                    ? `Failed to load project: ${err.message}`
                    : err.message || 'Failed to load project files. Please try refreshing the page.';
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        if (project.id) loadFiles();
    }, [project.id]);

    // --- CRUD Operations ---

    // 1. Update File Content (Debounced DB Write)
    const updateFile = useCallback((id: string, content: string) => {
        // Optimistic UI Update (Immediate)
        setFiles(prev => prev.map(f => f.id === id ? { ...f, content, updatedAt: Date.now() } : f));

        // Cancel previous timer for this file
        const existing = pendingWrites.current.get(id);
        if (existing) {
            clearTimeout(existing.timerId);
        }

        // Schedule new write
        const timerId = setTimeout(async () => {
            try {
                await db.updateFileContent(id, content);
                console.log(`[AutoSave] File ${id} saved.`);
            } catch (e) {
                console.error("[AutoSave] Failed:", e);
            } finally {
                pendingWrites.current.delete(id);
            }
        }, DEBOUNCE_MS);

        pendingWrites.current.set(id, { content, timerId });
    }, []);

    // 2. Create File
    const createFile = useCallback(async (name: string, autoSuffix = false): Promise<FileNode | null> => {
        // Validate name
        const nameCheck = validateName(name);
        if (!nameCheck.valid) {
            setError(nameCheck.error || 'Invalid file name');
            return null;
        }

        const lang = name.endsWith('.css') ? 'css'
            : name.endsWith('.js') ? 'javascript'
                : name.endsWith('.ts') || name.endsWith('.tsx') ? 'typescript'
                    : 'html';

        let path = `/${name}`;

        // Handle collision
        if (autoSuffix) {
            path = await db.getUniquePath(project.id, path);
        }

        const newFile: FileNode = {
            id: crypto.randomUUID(),
            projectId: project.id,
            name: path.split('/').pop() || name,
            path,
            type: 'file',
            content: lang === 'html' ? '<!-- New Page -->' : '',
            language: lang,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        try {
            const created = await db.createFile(newFile);
            setFiles(prev => [...prev, created]);
            setActiveFileId(created.id);
            setError(null);
            return created;
        } catch (e: any) {
            setError(e.message || 'Failed to create file');
            return null;
        }
    }, [project.id]);

    // 3. Delete File
    const deleteFile = useCallback(async (id: string) => {
        // Cancel any pending write for this file
        const pending = pendingWrites.current.get(id);
        if (pending) {
            clearTimeout(pending.timerId);
            pendingWrites.current.delete(id);
        }

        try {
            await db.deleteFile(id);
            setFiles(prev => prev.filter(f => f.id !== id));
            if (activeFileId === id) {
                setActiveFileId(files.find(f => f.id !== id)?.id || null);
            }
            setError(null);
        } catch (e: any) {
            setError(e.message || 'Failed to delete file');
        }
    }, [activeFileId, files]);

    // 4. Rename File
    const renameFile = useCallback(async (id: string, newName: string): Promise<boolean> => {
        // Validate name
        const nameCheck = validateName(newName);
        if (!nameCheck.valid) {
            setError(nameCheck.error || 'Invalid name');
            return false;
        }

        const newPath = `/${newName}`;

        try {
            const updated = await db.renameFile(id, newName, newPath);

            // Update UI
            setFiles(prev => prev.map(f => f.id === id ? updated : f));
            setError(null);
            return true;
        } catch (e: any) {
            setError(e.message || 'Failed to rename file');
            return false;
        }
    }, []);

    // 5. Force Save (flush specific file or all)
    const forceSave = useCallback(async (fileId?: string) => {
        if (fileId) {
            const pending = pendingWrites.current.get(fileId);
            if (pending) {
                clearTimeout(pending.timerId);
                await db.updateFileContent(fileId, pending.content);
                pendingWrites.current.delete(fileId);
                console.log(`[ForceSave] File ${fileId} saved.`);
            }
        } else {
            await flushPendingWrites();
        }
    }, [flushPendingWrites]);

    // Handle file switch - flush current file first
    const switchFile = useCallback(async (newFileId: string) => {
        if (activeFileId && activeFileId !== newFileId) {
            // Flush current file before switching
            await forceSave(activeFileId);
        }
        setActiveFileId(newFileId);
    }, [activeFileId, forceSave]);

    return {
        files,
        isLoading,
        activeFileId,
        setActiveFileId: switchFile, // Use switchFile to auto-flush
        updateFile,
        createFile,
        deleteFile,
        renameFile,
        forceSave,
        flushAll: flushPendingWrites,
        error,
        clearError: () => setError(null)
    };
};
