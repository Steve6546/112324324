import React from 'react';
import { Plus, File, Trash2, AlertCircle, FolderOpen, X } from 'lucide-react';
import { VirtualFile } from '../types';

interface FileExplorerProps {
    files: VirtualFile[];
    activeFileId: string;
    onSelectFile: (id: string) => void;
    onCreateFile: () => void;
    onDeleteFile: (id: string, e: React.MouseEvent) => void;
    problems: string[];
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
    files,
    activeFileId,
    onSelectFile,
    onCreateFile,
    onDeleteFile,
    problems
}) => {
    return (
        <div className="w-60 bg-[#09090b] border-r border-white/10 flex flex-col shrink-0 animate-slide-right h-full">
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Explorer</span>
                <button
                    onClick={onCreateFile}
                    className="text-gray-500 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
                    title="New File"
                >
                    <Plus size={14} />
                </button>
            </div>

            <div className="flex-grow overflow-y-auto p-2 scrollbar-hide">
                {files.map(file => (
                    <div
                        key={file.id}
                        onClick={() => onSelectFile(file.id)}
                        className={`group flex items-center justify-between px-3 py-2 rounded-md text-sm cursor-pointer mb-1 transition-all ${activeFileId === file.id
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                            }`}
                    >
                        <div className="flex items-center gap-2 truncate">
                            <File size={14} className={activeFileId === file.id ? 'text-blue-500' : 'text-gray-500'} />
                            <span className="truncate">{file.name}</span>
                        </div>
                        {files.length > 1 && (
                            <button
                                onClick={(e) => onDeleteFile(file.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-red-500 rounded transition-all"
                                title="Delete File"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Problems Panel (Real Implementation Layout) */}
            <div className="p-3 border-t border-white/5 bg-[#0c0c0e]">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2">
                    <AlertCircle size={12} /> Problems
                </div>
                {problems.length > 0 ? (
                    <div className="max-h-32 overflow-y-auto custom-scrollbar">
                        {problems.map((p, i) => (
                            <div key={i} className="text-[10px] text-yellow-500 truncate mb-1 flex items-start gap-1">
                                <span className="mt-0.5">•</span>
                                <span className="truncate">{p}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-[10px] text-green-600 flex items-center gap-1">
                        <CheckIcon /> No issues detected
                    </div>
                )}
            </div>
        </div>
    );
};

const CheckIcon = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);
