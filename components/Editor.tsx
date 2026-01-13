import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Project, ChatMessage, FileNode } from '../types';
import { useProjectFileSystem } from '../hooks/useProjectFileSystem';
import {
    ArrowLeft, Play, Code, Smartphone, Monitor, Download,
    File, MoreHorizontal, Loader2, Send, Plus, Trash2,
    FolderOpen, AlertCircle, Save, X, Edit3, Settings
} from 'lucide-react';
import { streamCodeEdit } from '../services/gemini';
import { useToast } from './Toast';
import { FileExplorer } from './editor/FileExplorer';
import { formatCode } from '../utils/formatter';
import CodeEditor from './editor/CodeEditor';
import SettingsModal from './SettingsModal';

interface EditorProps {
    project: Project;
    onBack: () => void;
    onUpdate: (project: Project) => void;
}

type EditorView = 'preview' | 'code' | 'console';
type DeviceType = 'desktop' | 'mobile';

// Enhanced bundling for ES modules and multi-file support
const bundlePreview = (files: FileNode[]): { html: string, errors: string[] } => {
    const errors: string[] = [];
    let bundled = '';

    try {
        // Find index.html or create one
        let indexHtml = files.find(f => f.name === 'index.html');
        if (!indexHtml) {
            // Create a basic HTML structure if no index.html exists
            indexHtml = {
                id: 'temp-index',
                projectId: files[0]?.projectId || '',
                name: 'index.html',
                path: '/index.html',
                type: 'file',
                language: 'html',
                content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated App</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <div id="app">
        <h1 class="text-2xl font-bold text-center py-8">Hello World</h1>
        <p class="text-center text-gray-600">Your app is ready!</p>
    </div>
</body>
</html>`,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            errors.push('No index.html found, created basic template');
        }

        bundled = indexHtml.content;

        // Remove Tailwind CDN if present (we'll inject it properly)
        bundled = bundled
            .replace(/<script[^>]*src=["'][^"']*cdn\.tailwindcss\.com[^"']*["'][^>]*><\/script>/gi, '')
            .replace(/<link[^>]*href=["'][^"']*cdn\.tailwindcss\.com[^"']*["'][^>]*>/gi, '');

        // Process inline scripts for tailwind.config assignments
        bundled = bundled.replace(/(<script[^>]*>)([\s\S]*?)<\/script>/gi, (match, openTag, scriptContent) => {
            let processedContent = scriptContent;
            // Replace tailwind.config assignments that cause errors
            processedContent = processedContent.replace(/tailwind\.config\s*=\s*/g, 'window.tailwind.config = ');
            return openTag + processedContent + '</script>';
        });

        // Inject CSS files
        const cssFiles = files.filter(f => f.language === 'css' && f.name !== 'index.html');
        cssFiles.forEach(file => {
            const cssContent = file.content.trim();
            if (cssContent && !bundled.includes(cssContent.substring(0, 50))) {
                if (bundled.includes('</head>')) {
                    bundled = bundled.replace('</head>', `<style>${cssContent}</style></head>`);
                } else {
                    bundled = `<style>${cssContent}</style>` + bundled;
                }
            }
        });

        // Inject JS files with ES module support
        const jsFiles = files.filter(f => f.language === 'javascript' && f.name !== 'index.html');
        const tsFiles = files.filter(f => f.language === 'typescript' && f.name !== 'index.html');

        // Handle multiple JS files with proper module support
        if (jsFiles.length > 0) {
            // Create a main script that imports all JS files
            let mainScript = '';

            jsFiles.forEach((file, index) => {
                const jsContent = file.content.trim();
                if (jsContent) {
                    // For multiple files, we'll inline them as separate scripts for now
                    // In the future, this could be enhanced with proper module bundling
                    const scriptTag = `<script type="module">
${jsContent}
</script>`;

                    if (bundled.includes('</body>')) {
                        bundled = bundled.replace('</body>', scriptTag + '</body>');
                    } else {
                        bundled += scriptTag;
                    }
                }
            });

            errors.push(`${jsFiles.length} JavaScript file(s) loaded with ES module support`);
        }

        // Enhanced TypeScript support (basic for now)
        if (tsFiles.length > 0) {
            // For now, treat TypeScript as JavaScript (remove type annotations)
            tsFiles.forEach(file => {
                let tsContent = file.content.trim();
                if (tsContent) {
                    // Basic TypeScript to JavaScript conversion (remove type annotations)
                    // This is very basic - a real implementation would need a proper compiler
                    tsContent = tsContent
                        .replace(/:\s*\w+(\[\])?/g, '') // Remove type annotations
                        .replace(/<\w+>/g, '') // Remove generic types
                        .replace(/interface\s+\w+\s*\{[^}]*\}/g, '') // Remove interfaces
                        .replace(/type\s+\w+\s*=.*;/g, ''); // Remove type definitions

                    const scriptTag = `<script type="module">
// Converted from TypeScript: ${file.name}
${tsContent}
</script>`;

                    if (bundled.includes('</body>')) {
                        bundled = bundled.replace('</body>', scriptTag + '</body>');
                    } else {
                        bundled += scriptTag;
                    }
                }
            });

            errors.push(`${tsFiles.length} TypeScript file(s) converted to JavaScript (basic conversion)`);
        }

        // Ensure Tailwind CSS is available
        if (!bundled.includes('tailwindcss.com') && !bundled.includes('tailwind.config')) {
            if (bundled.includes('</head>')) {
                bundled = bundled.replace('</head>', '<script src="https://cdn.tailwindcss.com"></script></head>');
            } else {
                bundled = '<script src="https://cdn.tailwindcss.com"></script>' + bundled;
            }
        }


        // Inject enhanced polyfills and error handling for iframe compatibility
        const polyfills = `<script>
(function() {
    // Enhanced console logging to parent window
    const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info
    };

    // Override console methods to send messages to parent
    ['log', 'warn', 'error', 'info'].forEach(level => {
        console[level] = function(...args) {
            // Call original method
            originalConsole[level].apply(console, args);

            // Send to parent window
            try {
                window.parent.postMessage({
                    type: 'console',
                    level: level,
                    message: args.map(arg =>
                        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                    ).join(' ')
                }, '*');
            } catch (e) {
                // Fallback if postMessage fails
                originalConsole.error('Failed to send console message:', e);
            }
        };
    });

    // Enhanced error handling
    window.addEventListener('error', function(event) {
        window.parent.postMessage({
            type: 'error',
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        }, '*');
    });

    window.addEventListener('unhandledrejection', function(event) {
        window.parent.postMessage({
            type: 'error',
            message: 'Unhandled Promise Rejection: ' + (event.reason?.message || event.reason)
        }, '*');
    });

    // Only define tailwind.config if it doesn't exist to prevent "Cannot set properties of undefined" errors
    if (typeof window.tailwind === 'undefined') {
        window.tailwind = { config: {} };
    } else if (typeof window.tailwind.config === 'undefined') {
        window.tailwind.config = {};
    }

    // ES Module support and CommonJS require polyfill for @tailwindcss plugins
    var modules = {};
    var require = function(id) {
        if (modules[id]) return modules[id].exports;
        if (id === 'console') return console;
        if (id === 'window') return window;
        if (id === 'document') return document;
        // Handle common Tailwind plugins that might be required
        if (id === '@tailwindcss/forms') return {};
        if (id === '@tailwindcss/typography') return {};
        if (id === '@tailwindcss/aspect-ratio') return {};
        if (id.startsWith('@tailwindcss/')) return {};
        throw new Error('Module ' + id + ' not found');
    };
    require.register = function(id, fn) {
        modules[id] = { exports: {} };
        fn.call(modules[id].exports, require, modules[id].exports, modules[id]);
    };
    window.require = require;

    // Prevent history API errors in sandboxed iframe
    var originalPushState = history.pushState;
    var originalReplaceState = history.replaceState;
    history.pushState = function(state, title, url) {
        try {
            return originalPushState.apply(this, arguments);
        } catch (e) {
            console.warn('History.pushState blocked in sandboxed iframe:', e.message);
        }
    };
    history.replaceState = function(state, title, url) {
        try {
            return originalReplaceState.apply(this, arguments);
        } catch (e) {
            console.warn('History.replaceState blocked in sandboxed iframe:', e.message);
        }
    };
})();
</script>`;

        // Inject polyfills immediately after <html> tag for earliest execution
        if (bundled.includes('<html>')) {
            bundled = bundled.replace('<html>', '<html>' + polyfills);
        } else if (bundled.includes('<head>')) {
            bundled = bundled.replace('<head>', polyfills + '<head>');
        } else {
            bundled = polyfills + bundled;
        }

        return { html: bundled, errors };
    } catch (error) {
        errors.push(`Bundling error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Fallback to basic HTML
        return {
            html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <div class="text-center py-8">
        <h1 class="text-2xl font-bold text-red-600">Preview Error</h1>
        <p class="text-gray-600 mt-4">${error instanceof Error ? error.message : 'Unknown error occurred'}</p>
    </div>
</body>
</html>`,
            errors
        };
    }
};

const Editor: React.FC<EditorProps> = ({ project, onBack, onUpdate }) => {
    const { showToast } = useToast();
    const [viewMode, setViewMode] = useState<EditorView>('preview');
    const [device, setDevice] = useState<DeviceType>('desktop');

    // File System Hook
    const {
        files,
        activeFileId,
        setActiveFileId,
        updateFile,
        createFile: dbCreateFile,
        deleteFile: dbDeleteFile,
        renameFile,
        forceSave,
        flushAll,
        isLoading: isFilesLoading,
        error: fsError,
        clearError
    } = useProjectFileSystem(project);

    const [explorerOpen, setExplorerOpen] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Editor State
    const [chatInput, setChatInput] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>(project.chatHistory || []);
    const [problems, setProblems] = useState<string[]>([]);
    const [bundlingErrors, setBundlingErrors] = useState<string[]>([]);
    const [editorMarkers, setEditorMarkers] = useState<any[]>([]);

    // Refs
    const chatEndRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Console logs from iframe
    const [consoleLogs, setConsoleLogs] = useState<{type: string, message: string, timestamp: number}[]>([]);

    // Derived
    const activeFile = useMemo(() => files.find(f => f.id === activeFileId), [files, activeFileId]);

    // Show file system errors as toast
    useEffect(() => {
        if (fsError) {
            showToast(fsError, 'error');
            clearError();
        }
    }, [fsError, showToast, clearError]);

    // Setup iframe communication for console logs and errors
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Only accept messages from our iframe
            if (event.source !== iframeRef.current?.contentWindow) return;

            if (event.data.type === 'console') {
                setConsoleLogs(prev => [...prev.slice(-49), { // Keep last 50 logs
                    type: event.data.level,
                    message: event.data.message,
                    timestamp: Date.now()
                }]);
            } else if (event.data.type === 'error') {
                setProblems(prev => [...prev, `Runtime Error: ${event.data.message}`]);
                setConsoleLogs(prev => [...prev.slice(-49), {
                    type: 'error',
                    message: `Runtime Error: ${event.data.message}`,
                    timestamp: Date.now()
                }]);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // Clear console logs when switching files or updating preview
    const clearConsoleLogs = useCallback(() => {
        setConsoleLogs([]);
    }, []);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isEditing]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        handleSave();
                        break;
                    case 'b':
                        e.preventDefault();
                        handleFormat();
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Live Preview Update (Debounced)
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (iframeRef.current && files.length > 0) {
                try {
                    // Clear console logs when updating preview
                    setConsoleLogs([]);

                    const result = bundlePreview(files);
                    iframeRef.current.srcdoc = result.html;
                    setBundlingErrors(result.errors);

                    // Enhanced Problem Check
                    const newProblems = [...result.errors];
                    if (!result.html.includes('<!DOCTYPE html>')) {
                        newProblems.push("Warning: Missing DOCTYPE declaration.");
                    }

                    // Check for ES module issues
                    const allJsFiles = files.filter(f => f.language === 'javascript');
                    if (allJsFiles.some(f => f.content.includes('import ') || f.content.includes('export '))) {
                        if (!result.html.includes('type="module"')) {
                            newProblems.push("ES modules detected but not properly configured in preview.");
                        }
                    }

                    // Combine bundling errors with editor markers
                    const markerErrors = editorMarkers
                        .filter(marker => marker.severity === 8) // Error severity
                        .map(marker => `${marker.message} (line ${marker.startLineNumber})`);

                    setProblems([...newProblems, ...markerErrors]);
                } catch (error) {
                    console.error('Preview bundling error:', error);
                    setBundlingErrors(['Preview bundling failed']);
                    setProblems(['Preview bundling failed']);
                }
            }
        }, 800);
        return () => clearTimeout(timeout);
    }, [files]);

    // Update problems when editor markers change
    useEffect(() => {
        const currentProblems = bundlingErrors.slice();

        // Add editor markers as problems
        const markerErrors = editorMarkers
            .filter(marker => marker.severity === 8) // Error severity
            .map(marker => `${marker.message} (line ${marker.startLineNumber})`);

        // Add warnings too
        const markerWarnings = editorMarkers
            .filter(marker => marker.severity === 4) // Warning severity
            .map(marker => `Warning: ${marker.message} (line ${marker.startLineNumber})`);

        setProblems([...currentProblems, ...markerErrors, ...markerWarnings]);
    }, [editorMarkers, bundlingErrors]);

    // File Operations
    const handleFileChange = useCallback((newContent: string) => {
        if (activeFileId) {
            updateFile(activeFileId, newContent);
        }
    }, [activeFileId, updateFile]);

    const handleCreateFile = async (fileName: string) => {
        const result = await dbCreateFile(fileName, true); // autoSuffix enabled
        if (result) {
            showToast(`Created ${result.name}`, 'success');
        }
    };

    const handleDeleteFile = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (files.length <= 1) {
            showToast("Cannot delete the last file.", 'warning');
            return;
        }

        const file = files.find(f => f.id === id);
        if (window.confirm(`Delete "${file?.name}"?`)) {
            await dbDeleteFile(id);
            showToast("File deleted", 'info');
        }
    };

    // AI & Save Logic
    const handleSendMessage = async () => {
        if (!chatInput.trim() || isEditing) return;

        // Flush all pending writes before AI operation
        await flushAll();

        const userMsg = chatInput;
        setChatInput('');
        setIsEditing(true);
        setViewMode('preview');

        const newHistoryUser: ChatMessage[] = [...chatHistory, { role: 'user', text: userMsg }];
        setChatHistory(newHistoryUser);
        onUpdate({ ...project, chatHistory: newHistoryUser });

        setChatHistory(prev => [...prev, { role: 'model', text: 'Analyzing project structure and applying changes...' }]);

        try {
            // Bundle all files for AI context
            const bundleResult = bundlePreview(files);
            const currentBundled = bundleResult.html;

            let updatedCode = "";
            const stream = streamCodeEdit(currentBundled, userMsg);

            for await (const chunk of stream) {
                updatedCode += chunk;
            }
            updatedCode = updatedCode.replace(/```html/g, '').replace(/```/g, '').trim();

            if (updatedCode && updatedCode.length > 50) {
                // Update index.html with the new code
                const indexFile = files.find(f => f.name === 'index.html');
                if (indexFile) {
                    updateFile(indexFile.id, updatedCode);
                    await forceSave(indexFile.id); // Immediate save after AI edit
                }

                const successMsg: ChatMessage = { role: 'model', text: 'Code updated successfully.' };
                const finalHistory = [...newHistoryUser, successMsg];
                setChatHistory(finalHistory);

                // Persist to parent
                onUpdate({
                    ...project,
                    code: updatedCode,
                    files: files, // Include real file structure
                    chatHistory: finalHistory
                });

            } else {
                throw new Error("Generated code invalid");
            }
        } catch (e: any) {
            console.error(e);
            const errorMsg: ChatMessage = { role: 'model', text: `Error: ${e.message || 'Failed to apply changes.'}` };
            setChatHistory(prev => [...prev.slice(0, -1), errorMsg]);
        } finally {
            setIsEditing(false);
        }
    };

    const handleSave = async () => {
        await flushAll(); // Flush all pending writes
        const bundleResult = bundlePreview(files);

        // Update project with bundled code for backward compatibility
        onUpdate({
            ...project,
            code: bundleResult.html,
            files: files // Include the real file structure
        });

        // Show bundling errors as warnings
        if (bundleResult.errors.length > 0) {
            showToast(`Saved with warnings: ${bundleResult.errors.join(', ')}`, 'warning');
        } else {
            showToast("Project saved successfully!", 'success');
        }
    };

    const handleExport = async () => {
        await flushAll();
        const bundleResult = bundlePreview(files);
        const blob = new Blob([bundleResult.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (bundleResult.errors.length > 0) {
            showToast(`Exported with warnings: ${bundleResult.errors.join(', ')}`, 'warning');
        } else {
            showToast("Project exported successfully!", 'success');
        }
    };

    const handleFormat = () => {
        if (!activeFile) return;
        const language = activeFile.language as 'html' | 'css' | 'javascript';
        const formatted = formatCode(activeFile.content, language);
        handleFileChange(formatted);
        showToast("Code formatted", 'success');
    };

    // Handle back with flush
    const handleBack = async () => {
        await flushAll();
        onBack();
    };

    // Loading state
    if (isFilesLoading) {
        return (
            <div className="fixed inset-0 bg-[#09090b] flex items-center justify-center z-40">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="text-sm text-gray-400">Loading project files...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[#09090b] flex flex-col z-40 font-sans text-white overflow-hidden">

            {/* Header */}
            <header className="h-12 border-b border-white/10 bg-[#09090b] flex items-center justify-between px-4 shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={handleBack} className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft size={16} />
                    </button>
                    <div className="flex items-center gap-2 select-none">
                        <span className="text-sm font-semibold text-gray-200">{project.title}</span>
                        <span className="text-xs text-gray-600 px-2 py-0.5 border border-white/5 rounded-full">v1.0</span>
                    </div>
                </div>

                {/* Center Tabs */}
                <div className="flex bg-[#18181b] rounded-md p-1 border border-white/5">
                    <button
                        onClick={() => setViewMode('code')}
                        className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-medium transition-all ${viewMode === 'code' ? 'bg-[#27272a] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        <Code size={14} /> Code
                    </button>
                    <button
                        onClick={() => setViewMode('preview')}
                        className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-medium transition-all ${viewMode === 'preview' ? 'bg-[#27272a] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        <Play size={14} /> Preview
                    </button>
                    <button
                        onClick={() => setViewMode('console')}
                        className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-medium transition-all ${viewMode === 'console' ? 'bg-[#27272a] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        <AlertCircle size={14} /> Console
                        {consoleLogs.length > 0 && (
                            <span className="bg-red-500 text-white text-xs px-1 rounded-full min-w-[16px] h-4 flex items-center justify-center">
                                {consoleLogs.length}
                            </span>
                        )}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={handleSave} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md relative group" title="Save Project (Ctrl+S)">
                        <Save size={16} />
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            Ctrl+S
                        </div>
                    </button>
                    <button onClick={handleExport} className="px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-2 shadow-sm">
                        <Download size={14} /> Export
                    </button>
                </div>
            </header>

            {/* Main Workspace */}
            <div className="flex-grow flex overflow-hidden">

                {/* VIEW: CODE EDITOR MODE */}
                <div className={`flex w-full h-full ${viewMode === 'preview' ? 'hidden' : 'flex'}`}>

                    {/* File Explorer Sidebar */}
                    {explorerOpen && (
                        <FileExplorer
                            files={files}
                            activeFileId={activeFileId}
                            onSelectFile={setActiveFileId}
                            onCreateFile={handleCreateFile}
                            onDeleteFile={handleDeleteFile}
                            onRenameFile={renameFile}
                            problems={problems}
                        />
                    )}

                    {/* Code Area */}
                    <div className="flex-grow flex flex-col bg-[#1e1e1e] relative min-w-0">

                        {/* Editor Tabs / Toolbar */}
                        <div className="h-9 bg-[#18181b] border-b border-white/5 flex items-center px-4 justify-between">
                            <div className="flex items-center h-full overflow-x-auto">
                                {files.map(file => (
                                    <div
                                        key={file.id}
                                        onClick={() => setActiveFileId(file.id)}
                                        className={`h-full flex items-center gap-2 px-3 text-xs border-r border-white/5 cursor-pointer whitespace-nowrap ${activeFileId === file.id ? 'bg-[#1e1e1e] text-white border-t-2 border-t-blue-500' : 'text-gray-500 hover:bg-[#27272a]'}`}
                                    >
                                        <span>{file.name}</span>
                                        {files.length > 1 && (
                                            <button
                                                onClick={(e) => handleDeleteFile(file.id, e)}
                                                className="hover:text-red-400 opacity-50 hover:opacity-100"
                                            >
                                                <X size={10} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={handleFormat} className="text-gray-500 hover:text-white relative group" title="Format Code (Ctrl+B)">
                                    <Edit3 size={14} />
                                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        Ctrl+B
                                    </div>
                                </button>
                                <button onClick={() => setExplorerOpen(!explorerOpen)} className="text-gray-500 hover:text-white" title="Toggle Explorer">
                                    <FolderOpen size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Editor Surface */}
                        <div className="relative flex-grow w-full overflow-hidden code-editor-container bg-[#1e1e1e]">
                            <CodeEditor
                                code={activeFile?.content || ''}
                                language={activeFile?.language || 'html'}
                                onChange={(val) => val && handleFileChange(val)}
                                markers={editorMarkers}
                                onMarkersChange={setEditorMarkers}
                            />
                        </div>
                    </div>
                </div>

                {/* VIEW: PREVIEW MODE */}
                <div className={`flex w-full h-full ${viewMode === 'preview' ? 'flex' : 'hidden'}`}>
                    {/* Chat Sidebar */}
                    <div className="w-80 border-r border-white/10 bg-[#09090b] flex flex-col z-10 shrink-0">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">AI Architect</span>
                            <Settings size={14} className="text-gray-500 cursor-pointer hover:text-white transition-colors" onClick={() => setSettingsOpen(true)} />
                        </div>

                        <div className="flex-grow overflow-y-auto p-4 space-y-4">
                            {chatHistory.length === 0 && (
                                <div className="text-center text-gray-500 mt-10 text-sm">
                                    <p>Describe changes naturally.</p>
                                    <p className="mt-2 text-xs text-gray-600">"Make the header sticky", "Change button color to red"</p>
                                </div>
                            )}

                            {chatHistory.map((msg, idx) => (
                                <div key={idx} className="animate-fade-in">
                                    <div className="flex items-center gap-2 mb-2">
                                        {msg.role === 'model' ? (
                                            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold">L</div>
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center text-[10px]">You</div>
                                        )}
                                        <span className="text-[10px] text-gray-500 uppercase">
                                            {msg.role === 'model' ? 'Assistant' : 'You'}
                                        </span>
                                    </div>

                                    <div className={`ml-7 text-sm leading-relaxed p-3 rounded-lg border ${msg.role === 'model' ? 'bg-[#18181b] border-white/5 text-gray-200' : 'bg-blue-600/10 border-blue-600/20 text-blue-100'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-[#09090b] border-t border-white/10">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder={isEditing ? "AI is working..." : "Ask for changes..."}
                                    disabled={isEditing}
                                    className="w-full bg-[#18181b] border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-white/20 disabled:opacity-50 transition-all focus:ring-1 focus:ring-blue-500/50"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!chatInput.trim() || isEditing}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors disabled:opacity-0 shadow-lg shadow-blue-500/20"
                                >
                                    {isEditing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Preview Canvas */}
                    <div className="flex-grow bg-[#18181b] flex flex-col overflow-hidden relative">
                        {/* Device Toolbar */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex bg-[#09090b] border border-white/10 rounded-full p-1 shadow-xl backdrop-blur-md">
                            <button
                                onClick={() => setDevice('desktop')}
                                className={`p-2 rounded-full transition-all ${device === 'desktop' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Monitor size={16} />
                            </button>
                            <button
                                onClick={() => setDevice('mobile')}
                                className={`p-2 rounded-full transition-all ${device === 'mobile' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Smartphone size={16} />
                            </button>
                        </div>

                        <div className="flex-grow flex items-center justify-center p-8 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px]">
                            <div
                                className={`bg-white transition-all duration-500 shadow-2xl overflow-hidden border border-white/10 relative ${device === 'mobile'
                                    ? 'w-[375px] h-[812px] rounded-[3rem] border-[8px] border-[#27272a]'
                                    : 'w-full h-full rounded-xl border border-white/5'
                                    }`}
                            >
                                {isEditing && (
                                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fade-in">
                                        <div className="bg-[#18181b] p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center">
                                            <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
                                            <span className="text-sm font-medium text-white">Generating Changes...</span>
                                        </div>
                                    </div>
                                )}

                                <iframe
                                    ref={iframeRef}
                                    title="Project Preview"
                                    className="w-full h-full bg-white"
                                    sandbox="allow-scripts allow-modals allow-forms allow-popups"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Console Panel */}
                    <div className={`flex w-full h-full ${viewMode === 'console' ? 'flex' : 'hidden'}`}>
                        <div className="flex-grow bg-[#18181b] flex flex-col">
                            {/* Console Header */}
                            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#09090b]">
                                <div className="flex items-center gap-2">
                                    <AlertCircle size={16} className="text-gray-400" />
                                    <span className="text-sm font-medium text-white">Console</span>
                                    <span className="text-xs text-gray-500">({consoleLogs.length} logs)</span>
                                </div>
                                <button
                                    onClick={clearConsoleLogs}
                                    className="text-xs px-2 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition-colors"
                                >
                                    Clear
                                </button>
                            </div>

                            {/* Console Logs */}
                            <div className="flex-grow overflow-y-auto p-4 space-y-2 font-mono text-xs">
                                {consoleLogs.length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">
                                        <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
                                        <p>No console output yet</p>
                                        <p className="text-xs mt-1">Run your code to see logs here</p>
                                    </div>
                                ) : (
                                    consoleLogs.map((log, index) => (
                                        <div
                                            key={index}
                                            className={`p-2 rounded border ${
                                                log.type === 'error'
                                                    ? 'bg-red-900/20 border-red-500/30 text-red-300'
                                                    : log.type === 'warn'
                                                    ? 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300'
                                                    : log.type === 'info'
                                                    ? 'bg-blue-900/20 border-blue-500/30 text-blue-300'
                                                    : 'bg-gray-900/20 border-gray-500/30 text-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <span className={`text-xs font-bold uppercase px-1 py-0.5 rounded ${
                                                    log.type === 'error' ? 'bg-red-600 text-white' :
                                                    log.type === 'warn' ? 'bg-yellow-600 text-white' :
                                                    log.type === 'info' ? 'bg-blue-600 text-white' :
                                                    'bg-gray-600 text-white'
                                                }`}>
                                                    {log.type}
                                                </span>
                                                <span className="flex-grow break-words">{log.message}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Settings Modal */}
            <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </div>
    );
};

export default Editor;