import React from 'react';
import Editor, { OnMount } from "@monaco-editor/react";

interface CodeEditorProps {
    code: string;
    language: string;
    onChange: (value: string | undefined) => void;
    readOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, language, onChange, readOnly = false }) => {
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
    };

    // Map internal languages to Monaco languages
    const getMonacoLanguage = (lang: string) => {
        if (lang === 'html') return 'html';
        if (lang === 'css') return 'css';
        if (lang === 'javascript' || lang === 'js') return 'javascript';
        return 'plaintext';
    };

    return (
        <div className="w-full h-full overflow-hidden bg-[#1e1e1e]">
            <Editor
                height="100%"
                defaultLanguage={getMonacoLanguage(language)}
                language={getMonacoLanguage(language)}
                value={code}
                theme="lovable-dark"
                onChange={onChange}
                onMount={handleEditorDidMount}
                options={{
                    readOnly,
                    wordWrap: 'on',
                }}
                loading={
                    <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                        Loading Editor...
                    </div>
                }
            />
        </div>
    );
};

export default CodeEditor;
