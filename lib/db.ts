import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { FileNode, Project } from '../types';

interface LovableDB extends DBSchema {
    files: {
        key: string; // id
        value: FileNode;
        indexes: { 'by-project': string; 'by-path': [string, string] };
    };
    projects: {
        key: string; // id
        value: Project & { migratedAt?: number }; // Migration timestamp
    };
    metadata: {
        key: string;
        value: { key: string; value: any };
    };
}

const DB_NAME = 'lovable-db-v2'; // Bumped version for new metadata store
const DB_VERSION = 2;

// Singleton DB promise
let dbPromise: Promise<IDBPDatabase<LovableDB>>;

function getDB() {
    if (!dbPromise) {
        dbPromise = openDB<LovableDB>(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion) {
                // Files Store
                if (!db.objectStoreNames.contains('files')) {
                    const fileStore = db.createObjectStore('files', { keyPath: 'id' });
                    fileStore.createIndex('by-project', 'projectId');
                    fileStore.createIndex('by-path', ['projectId', 'path'], { unique: true });
                }

                // Projects Store
                if (!db.objectStoreNames.contains('projects')) {
                    db.createObjectStore('projects', { keyPath: 'id' });
                }

                // Metadata Store (for migration flags, etc.)
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'key' });
                }

                console.log(`[DB] Upgraded from v${oldVersion} to v${DB_VERSION}`);
            },
        });
    }
    return dbPromise;
}

// --- Path Normalization Utilities ---

/**
 * Normalizes a file path:
 * - Ensures leading /
 * - Removes trailing /
 * - Collapses multiple slashes
 * - Resolves .. and .
 * - Rejects empty or invalid names
 */
export function normalizePath(path: string): string {
    if (!path || typeof path !== 'string') {
        throw new Error('Invalid path: empty or not a string');
    }

    // Trim whitespace
    path = path.trim();

    // Ensure starts with /
    if (!path.startsWith('/')) {
        path = '/' + path;
    }

    // Split, filter empty parts and resolve . and ..
    const parts = path.split('/').filter(Boolean);
    const resolved: string[] = [];

    for (const part of parts) {
        if (part === '.') {
            continue; // Skip current dir
        }
        if (part === '..') {
            resolved.pop(); // Go up one level
            continue;
        }
        // Validate part name (no empty, no special characters that break paths)
        if (!part || /^[\s.]+$/.test(part)) {
            throw new Error(`Invalid path segment: "${part}"`);
        }
        resolved.push(part);
    }

    const normalized = '/' + resolved.join('/');
    return normalized === '' ? '/' : normalized;
}

/**
 * Validates a file/folder name
 */
export function validateName(name: string): { valid: boolean; error?: string } {
    if (!name || typeof name !== 'string') {
        return { valid: false, error: 'Name cannot be empty' };
    }

    name = name.trim();

    if (name.length === 0) {
        return { valid: false, error: 'Name cannot be empty' };
    }

    if (name.length > 255) {
        return { valid: false, error: 'Name too long (max 255 characters)' };
    }

    // Forbidden characters in file names
    const forbidden = /[<>:"/\\|?*\x00-\x1f]/;
    if (forbidden.test(name)) {
        return { valid: false, error: 'Name contains invalid characters' };
    }

    // Reserved names (Windows)
    const reserved = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
    if (reserved.test(name)) {
        return { valid: false, error: 'Reserved name not allowed' };
    }

    return { valid: true };
}

export const db = {
    // --- Migration Flag ---

    async hasMigrated(projectId: string): Promise<boolean> {
        const database = await getDB();
        const meta = await database.get('metadata', `migrated_${projectId}`);
        return !!meta?.value;
    },

    async setMigrated(projectId: string): Promise<void> {
        const database = await getDB();
        await database.put('metadata', { key: `migrated_${projectId}`, value: Date.now() });
    },

    // --- File Operations ---

    async createFile(file: FileNode): Promise<FileNode> {
        // Validate name
        const nameCheck = validateName(file.name);
        if (!nameCheck.valid) {
            throw new Error(nameCheck.error);
        }

        // Normalize path
        file.path = normalizePath(file.path);

        const database = await getDB();

        // Check for collision
        const existing = await database.getFromIndex('files', 'by-path', [file.projectId, file.path]);
        if (existing) {
            throw new Error(`File already exists at path: ${file.path}`);
        }

        const now = Date.now();
        const newFile = { ...file, createdAt: now, updatedAt: now };
        await database.put('files', newFile);
        return newFile;
    },

    async readFile(projectId: string, path: string): Promise<FileNode | undefined> {
        const database = await getDB();
        const normalizedPath = normalizePath(path);
        return database.getFromIndex('files', 'by-path', [projectId, normalizedPath]);
    },

    async getFileById(id: string): Promise<FileNode | undefined> {
        const database = await getDB();
        return database.get('files', id);
    },

    async getProjectFiles(projectId: string): Promise<FileNode[]> {
        const database = await getDB();
        return database.getAllFromIndex('files', 'by-project', projectId);
    },

    async updateFileContent(id: string, content: string): Promise<FileNode> {
        const database = await getDB();
        const tx = database.transaction('files', 'readwrite');
        const file = await tx.store.get(id);
        if (!file) throw new Error(`File ${id} not found`);

        file.content = content;
        file.updatedAt = Date.now();
        await tx.store.put(file);
        await tx.done;
        return file;
    },

    async renameFile(id: string, newName: string, newPath: string): Promise<FileNode> {
        // Validate name
        const nameCheck = validateName(newName);
        if (!nameCheck.valid) {
            throw new Error(nameCheck.error);
        }

        // Normalize path
        newPath = normalizePath(newPath);

        const database = await getDB();
        const tx = database.transaction('files', 'readwrite');
        const file = await tx.store.get(id);
        if (!file) throw new Error(`File ${id} not found`);

        // Check for collision (exclude self)
        const existing = await database.getFromIndex('files', 'by-path', [file.projectId, newPath]);
        if (existing && existing.id !== id) {
            throw new Error(`A file already exists at path: ${newPath}`);
        }

        file.name = newName;
        file.path = newPath;
        file.updatedAt = Date.now();

        await tx.store.put(file);
        await tx.done;
        return file;
    },

    /**
     * Rename a folder and all its children atomically
     */
    async renameFolder(projectId: string, oldPath: string, newPath: string): Promise<number> {
        oldPath = normalizePath(oldPath);
        newPath = normalizePath(newPath);

        const newName = newPath.split('/').filter(Boolean).pop() || '';
        const nameCheck = validateName(newName);
        if (!nameCheck.valid) {
            throw new Error(nameCheck.error);
        }

        const database = await getDB();

        // Check newPath doesn't collide
        const collision = await database.getFromIndex('files', 'by-path', [projectId, newPath]);
        if (collision) {
            throw new Error(`A file or folder already exists at path: ${newPath}`);
        }

        // Get all files for this project
        const allFiles = await database.getAllFromIndex('files', 'by-project', projectId);

        // Find files that start with oldPath (the folder and its children)
        const affectedFiles = allFiles.filter(f =>
            f.path === oldPath || f.path.startsWith(oldPath + '/')
        );

        if (affectedFiles.length === 0) {
            throw new Error(`Folder not found: ${oldPath}`);
        }

        // Atomic update in a single transaction
        const tx = database.transaction('files', 'readwrite');
        const now = Date.now();

        for (const file of affectedFiles) {
            if (file.path === oldPath) {
                // The folder itself
                file.name = newName;
                file.path = newPath;
            } else {
                // Children: replace oldPath prefix with newPath
                file.path = newPath + file.path.substring(oldPath.length);
            }
            file.updatedAt = now;
            await tx.store.put(file);
        }

        await tx.done;
        return affectedFiles.length;
    },

    async deleteFile(id: string): Promise<void> {
        const database = await getDB();
        await database.delete('files', id);
    },

    /**
     * Delete a folder and all its children
     */
    async deleteFolder(projectId: string, folderPath: string): Promise<number> {
        folderPath = normalizePath(folderPath);

        const database = await getDB();
        const allFiles = await database.getAllFromIndex('files', 'by-project', projectId);

        const toDelete = allFiles.filter(f =>
            f.path === folderPath || f.path.startsWith(folderPath + '/')
        );

        if (toDelete.length === 0) {
            return 0;
        }

        const tx = database.transaction('files', 'readwrite');
        for (const file of toDelete) {
            await tx.store.delete(file.id);
        }
        await tx.done;

        return toDelete.length;
    },

    /**
     * Check if a path exists
     */
    async pathExists(projectId: string, path: string): Promise<boolean> {
        const database = await getDB();
        const normalized = normalizePath(path);
        const existing = await database.getFromIndex('files', 'by-path', [projectId, normalized]);
        return !!existing;
    },

    /**
     * Generate a unique name by adding suffix if collision exists
     */
    async getUniquePath(projectId: string, basePath: string): Promise<string> {
        basePath = normalizePath(basePath);

        const exists = await this.pathExists(projectId, basePath);
        if (!exists) return basePath;

        // Split path into base and extension
        const lastSlash = basePath.lastIndexOf('/');
        const dir = basePath.substring(0, lastSlash + 1);
        const filename = basePath.substring(lastSlash + 1);

        const dotIndex = filename.lastIndexOf('.');
        const name = dotIndex > 0 ? filename.substring(0, dotIndex) : filename;
        const ext = dotIndex > 0 ? filename.substring(dotIndex) : '';

        let counter = 1;
        let newPath = `${dir}${name} (${counter})${ext}`;

        while (await this.pathExists(projectId, newPath)) {
            counter++;
            if (counter > 100) {
                throw new Error('Could not generate unique path after 100 attempts');
            }
            newPath = `${dir}${name} (${counter})${ext}`;
        }

        return normalizePath(newPath);
    },

    // --- Project Operations ---

    async saveProject(project: Project): Promise<void> {
        const database = await getDB();
        await database.put('projects', project);
    },

    async getProject(id: string): Promise<Project | undefined> {
        const database = await getDB();
        return database.get('projects', id);
    },

    // --- Bulk Operations ---

    async getFileCount(projectId: string): Promise<number> {
        const database = await getDB();
        const files = await database.getAllFromIndex('files', 'by-project', projectId);
        return files.length;
    },

    async clearProjectFiles(projectId: string): Promise<void> {
        const database = await getDB();
        const files = await database.getAllFromIndex('files', 'by-project', projectId);
        const tx = database.transaction('files', 'readwrite');
        for (const file of files) {
            await tx.store.delete(file.id);
        }
        await tx.done;
    }
};
