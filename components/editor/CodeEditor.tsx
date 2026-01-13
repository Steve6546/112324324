import React, { useMemo, useCallback, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { OnMount } from '@monaco-editor/react';

// Lazy load Monaco Editor for better performance
const MonacoEditor = React.lazy(() =>
    import("@monaco-editor/react").then(module => ({ default: module.default }))
);

interface CodeEditorProps {
    code: string;
    language: string;
    onChange: (value: string | undefined) => void;
    readOnly?: boolean;
    markers?: any[]; // Monaco editor markers for diagnostics
    onMarkersChange?: (markers: any[]) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, language, onChange, readOnly = false, markers = [], onMarkersChange }) => {
    // Memoize expensive computations
    const monacoLanguage = useMemo(() => {
        if (language === 'html') return 'html';
        if (language === 'css') return 'css';
        if (language === 'javascript' || language === 'js') return 'javascript';
        if (language === 'typescript' || language === 'ts') return 'typescript';
        return 'plaintext';
    }, [language]);

    // Debounced change handler for better performance
    const debouncedOnChange = useCallback((value: string | undefined) => {
        if (value !== undefined) {
            onChange(value);
        }
    }, [onChange]);
    const handleEditorDidMount: OnMount = (editor, monaco) => {
        // Configure editor settings strictly for a clean look
        editor.updateOptions({
            minimap: { enabled: false }, // Hide minimap for cleaner mobile view
            scrollBeyondLastLine: false,
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            lineNumbers: 'on',
            roundedSelection: false,
            padding: { top: 16, bottom: 16 },
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            contextmenu: true,
            formatOnPaste: true,
            automaticLayout: true, // Important for responsive resizing
        });

        // Add custom dark theme if needed, but 'vs-dark' is usually good enough
        monaco.editor.defineTheme('lovable-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#1e1e1e', // Match our app background
                'editor.lineHighlightBackground': '#2a2a2a',
            }
        });
        monaco.editor.setTheme('lovable-dark');

        // Setup diagnostics and error checking
        const setupDiagnostics = () => {
            const model = editor.getModel();
            if (!model) return;

            // Basic syntax validation for JavaScript/TypeScript
            if (language === 'javascript' || language === 'typescript') {
                try {
                    // Try to parse the code to detect basic syntax errors
                    const code = model.getValue();
                    if (language === 'javascript') {
                        // Basic JS syntax check
                        new Function(code);
                    }
                    // For TypeScript, we could add more advanced checking later

                    // Clear any existing markers if no errors
                    monaco.editor.setModelMarkers(model, 'javascript', []);
                    if (onMarkersChange) onMarkersChange([]);
                } catch (error: any) {
                    // Create error marker
                    const errorMarker = {
                        startLineNumber: 1, // Could be improved with better error parsing
                        startColumn: 1,
                        endLineNumber: 1,
                        endColumn: model.getLineLength(1) + 1,
                        message: error.message,
                        severity: monaco.MarkerSeverity.Error
                    };

                    monaco.editor.setModelMarkers(model, 'javascript', [errorMarker]);
                    if (onMarkersChange) onMarkersChange([errorMarker]);
                }
            }

            // HTML validation
            if (language === 'html') {
                const code = model.getValue();
                const markers: any[] = [];

                // Check for unclosed tags (basic)
                const openTags = code.match(/<[^\/][^>]*>/g) || [];
                const closeTags = code.match(/<\/[^>]+>/g) || [];

                if (openTags.length !== closeTags.length) {
                    markers.push({
                        startLineNumber: 1,
                        startColumn: 1,
                        endLineNumber: 1,
                        endColumn: code.length + 1,
                        message: 'Unclosed HTML tags detected',
                        severity: monaco.MarkerSeverity.Warning
                    });
                }

                monaco.editor.setModelMarkers(model, 'html', markers);
                if (onMarkersChange) onMarkersChange(markers);
            }

            // CSS validation
            if (language === 'css') {
                const code = model.getValue();
                const markers: any[] = [];

                // Basic CSS syntax checking (could be enhanced)
                try {
                    // Simple CSS parsing check
                    const style = document.createElement('style');
                    style.textContent = code;
                    document.head.appendChild(style);
                    document.head.removeChild(style);
                } catch (error: any) {
                    markers.push({
                        startLineNumber: 1,
                        startColumn: 1,
                        endLineNumber: 1,
                        endColumn: code.length + 1,
                        message: 'CSS syntax error: ' + error.message,
                        severity: monaco.MarkerSeverity.Error
                    });
                }

                monaco.editor.setModelMarkers(model, 'css', markers);
                if (onMarkersChange) onMarkersChange(markers);
            }
        };

        // Setup diagnostics on content change
        editor.onDidChangeModelContent(() => {
            setupDiagnostics();
        });

        // Initial diagnostics
        setupDiagnostics();

        // Listen for model markers changes and notify parent
        const model = editor.getModel();
        if (model && onMarkersChange) {
            const disposable = monaco.editor.onDidChangeMarkers((e) => {
                const uri = model.uri;
                const hasChangesForModel = e.some((change: any) => {
                    // Monaco may emit Uri[] or { resource: Uri }[] depending on build.
                    const resource = change?.resource ?? change;
                    return resource?.toString() === uri.toString();
                });

                if (hasChangesForModel) {
                    const currentMarkers = monaco.editor.getModelMarkers({ resource: uri });
                    onMarkersChange(currentMarkers);
                }
            });

            // Cleanup on unmount
            return () => disposable.dispose();
        }
    };

    // Language mapping is now memoized above

    return (
        <div className="w-full h-full overflow-hidden bg-[#1e1e1e]">
            <Suspense fallback={
                <div className="flex items-center justify-center h-full text-gray-500">
                    <Loader2 size={24} className="animate-spin mr-2" />
                    <span className="text-sm">Loading Code Editor...</span>
                </div>
            }>
                <MonacoEditor
                    height="100%"
                    defaultLanguage={monacoLanguage}
                    language={monacoLanguage}
                    value={code}
                    theme="lovable-dark"
                    onChange={debouncedOnChange}
                    onMount={handleEditorDidMount}
                    options={{
                        readOnly,
                        wordWrap: 'on',
                        // Performance optimizations
                        renderLineHighlight: 'line',
                        renderWhitespace: 'none',
                        largeFileOptimizations: true,
                        // Memory management
                        maxTokenizationLineLength: 20000,
                        wordBasedSuggestions: 'currentDocument',
                    }}
                    loading={
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <Loader2 size={16} className="animate-spin mr-2" />
                            <span className="text-xs">Initializing Editor...</span>
                        </div>
                    }
                />
            </Suspense>
        </div>
    );
};

export default CodeEditor;
