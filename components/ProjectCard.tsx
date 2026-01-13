import React, { useState, useRef, useEffect } from 'react';
import { Project } from '../types';
import { MoreHorizontal, Star, Trash2, Edit, Check, X, Copy } from 'lucide-react';

interface ProjectCardProps {
    project: Project;
    onClick: (project: Project) => void;
    onDelete: (id: string) => void;
    onRename: (id: string, newTitle: string) => void;
    onStar: (id: string) => void;
    onDuplicate?: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, onDelete, onRename, onStar, onDuplicate }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [editTitle, setEditTitle] = useState(project.title);

    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        if (showMenu) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    // Focus input when renaming starts
    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isRenaming]);

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(!showMenu);
    };

    const handleRenameSubmit = (e?: React.MouseEvent | React.KeyboardEvent) => {
        if (e) e.stopPropagation();
        if (editTitle.trim()) {
            onRename(project.id, editTitle);
        } else {
            setEditTitle(project.title); // Revert if empty
        }
        setIsRenaming(false);
    };

    const handleRenameCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditTitle(project.title);
        setIsRenaming(false);
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleRenameSubmit(e);
        if (e.key === 'Escape') {
            setEditTitle(project.title);
            setIsRenaming(false);
        }
    };

    return (
        <div
            onClick={() => !isRenaming && !showMenu && onClick(project)}
            className="group flex flex-col bg-[var(--bg-tertiary)] hover:bg-[var(--bg-accent)] transition-colors rounded-xl overflow-hidden cursor-pointer border border-[var(--border-primary)] hover:border-[var(--border-secondary)] min-w-0 w-full"
        >
            {/* Thumbnail Area */}
            <div className="aspect-[16/10] bg-[var(--bg-accent)] overflow-hidden">
                {project.thumbnailUrl ? (
                    <img
                        src={project.thumbnailUrl}
                        alt={project.title}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] bg-gradient-to-br from-[var(--bg-tertiary)] to-[var(--bg-secondary)]">
                        <span className="text-3xl sm:text-4xl">✨</span>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="p-3 sm:p-4 flex flex-col gap-2 sm:gap-3">
                {/* Header with Title and Star */}
                <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                        {isRenaming ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <input
                                    ref={inputRef}
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="bg-[#09090b] text-white text-sm px-2 py-1 rounded border border-blue-500/50 focus:outline-none w-full"
                                    placeholder="Project title..."
                                />
                                <button onClick={handleRenameSubmit} className="text-green-400 hover:bg-green-400/10 p-1 rounded flex-shrink-0">
                                    <Check size={14} />
                                </button>
                                <button onClick={handleRenameCancel} className="text-red-400 hover:bg-red-400/10 p-1 rounded flex-shrink-0">
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <h3 className="text-[var(--text-primary)] font-medium text-sm break-words">{project.title}</h3>
                        )}
                    </div>

                    {!isRenaming && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onStar(project.id); }}
                            className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                                project.isStarred
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : 'text-[var(--text-muted)] hover:text-yellow-400 hover:bg-yellow-500/10'
                            }`}
                        >
                            <Star size={16} fill={project.isStarred ? 'currentColor' : 'none'} />
                        </button>
                    )}
                </div>

                {/* Author Info */}
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center overflow-hidden border border-black/20 flex-shrink-0">
                        {project.authorAvatar ? (
                            <img src={project.authorAvatar} alt={project.authorName} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-[10px] text-white font-bold">{project.authorName.charAt(0)}</span>
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[var(--text-muted)] text-xs break-words">{project.authorName}</span>
                        <span className="text-[var(--text-muted)] text-xs">Viewed {project.viewedAt}</span>
                    </div>
                </div>

                {/* Actions Row */}
                {!isRenaming && (
                    <div className="flex justify-between items-center pt-1">
                        <div className="flex gap-1 sm:gap-2">
                            {onDuplicate && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDuplicate(project); }}
                                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-accent)] p-1 sm:p-1.5 rounded transition-colors"
                                    title="Duplicate project"
                                >
                                    <Copy size={12} className="sm:w-[14px] sm:h-[14px]" />
                                </button>
                            )}
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsRenaming(true); }}
                                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-accent)] p-1 sm:p-1.5 rounded transition-colors"
                                title="Rename project"
                            >
                                <Edit size={12} className="sm:w-[14px] sm:h-[14px]" />
                            </button>
                        </div>

                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                            className="text-[var(--red-primary)] hover:bg-[var(--red-primary)]/10 p-1 sm:p-1.5 rounded transition-colors"
                            title="Delete project"
                        >
                            <Trash2 size={12} className="sm:w-[14px] sm:h-[14px]" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectCard;