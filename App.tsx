import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import InputSection from './components/InputSection';
import ProjectDashboard from './components/ProjectDashboard';
import BuildingScreen from './components/BuildingScreen';
import Editor from './components/Editor';
import { ToastProvider, useToast } from './components/Toast';
import SettingsModal from './components/SettingsModal';
import { hasValidApiKey } from './services/gemini';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { ProgressiveEnhancementProvider } from './src/contexts/ProgressiveEnhancementContext';
import { Project } from './types';
import { X, Sparkles, Loader2, Send, AlertTriangle } from 'lucide-react';
import { streamIdeaResponse, streamAppCode } from './services/gemini';

type ViewState = 'home' | 'building' | 'editor';

function App() {
    const { showToast } = useToast();
    const [isLoadingProjects, setIsLoadingProjects] = useState(true);

    // Initialize projects from localStorage
    const [projects, setProjects] = useState<Project[]>(() => {
        try {
            const saved = localStorage.getItem('lovable_projects');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Filter out system templates to ensure a clean dashboard as requested
                return parsed.filter((p: Project) => p.category !== 'template');
            }
        } catch (e) {
            console.error("Error loading projects from storage:", e);
        }
        return [];
    });

    // Simulate loading time for better UX
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoadingProjects(false);
        }, 500); // Minimum loading time for smooth UX

        return () => clearTimeout(timer);
    }, []);

    const [currentView, setCurrentView] = useState<ViewState>('home');
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
    const [buildingStep, setBuildingStep] = useState(0);
    const [buildingCodeSnippet, setBuildingCodeSnippet] = useState(''); // New state for building screen visual

    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [refineText, setRefineText] = useState('');
    const [originalPrompt, setOriginalPrompt] = useState('');

    // Settings Modal State
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [hasKey, setHasKey] = useState(false);

    useEffect(() => {
        setHasKey(hasValidApiKey());
    }, []);

    // Persist projects to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('lovable_projects', JSON.stringify(projects));
    }, [projects]);

    const handleSearch = async (prompt: string, imageBase64?: string, isRefinement = false) => {
        setIsGenerating(true);
        if (!isRefinement) {
            setShowModal(true);
            setAiResponse("");
            setOriginalPrompt(prompt);
        }

        // If refining, append to history (simplified context)
        const effectivePrompt = isRefinement
            ? `Original Request: ${originalPrompt}\n\nCurrent Plan:\n${aiResponse}\n\nUser Feedback: ${prompt}\n\nPlease update the plan based on the feedback.`
            : prompt;

        // If refining, clear response to show generation of new version
        if (isRefinement) setAiResponse("");

        try {
            const stream = streamIdeaResponse(effectivePrompt, imageBase64);

            for await (const chunk of stream) {
                setAiResponse((prev) => (prev || "") + chunk);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setAiResponse(null);
        setRefineText('');
    };

    const handleCreateProject = async () => {
        if (!aiResponse) return;

        // Robust title extraction: handles # Title, **Title**, or just Title
        const titleLine = aiResponse.split('\n').find(line => line.trim().length > 0 && !line.includes('Here is a')) || 'New Project';
        const cleanTitle = titleLine.replace(/^#+\s*/, '').replace(/\*\*/g, '').replace(/:$/, '').trim();
        const finalTitle = cleanTitle.length > 40 ? cleanTitle.substring(0, 40) + '...' : cleanTitle;

        // Start building phase
        setBuildingStep(0);
        setBuildingCodeSnippet('');
        setCurrentView('building');
        setShowModal(false);

        let code = '';
        let step = 0;

        try {
            // Generate Code Streaming
            const stream = streamAppCode(aiResponse);

            for await (const chunk of stream) {
                code += chunk;
                setBuildingCodeSnippet(prev => (prev + chunk).slice(-1000)); // Keep last 1000 chars for visual effect

                // Content-Aware Progress Tracking (Realistic)
                if ((code.includes('<!DOCTYPE') || code.includes('<html')) && step < 1) {
                    step = 1;
                    setBuildingStep(1);
                }
                if ((code.includes('<body') || code.includes('<main')) && step < 2) {
                    step = 2;
                    setBuildingStep(2);
                }
                const classCount = (code.match(/class="/g) || []).length;
                if (classCount > 15 && step < 3) {
                    step = 3;
                    setBuildingStep(3);
                }
            }

            // Clean up markdown
            code = code.replace(/```html/g, '').replace(/```/g, '').trim();

            // Validate code generation
            if (!code || code.length < 100 || code.includes("Error generating code")) {
                throw new Error("Generated code was empty or invalid");
            }

            // Step 4: Assembling (Finished)
            setBuildingStep(4);

            // Small delay to let user see the final checkmark
            await new Promise(resolve => setTimeout(resolve, 800));

            const newProject: Project = {
                id: Date.now().toString(),
                title: finalTitle,
                thumbnailUrl: '',
                viewedAt: 'Just now',
                authorName: 'You',
                authorAvatar: '',
                category: 'mine',
                code: code,
                chatHistory: [] // Initialize empty chat history
            };

            setProjects(prev => [newProject, ...prev]);
            setActiveProject(newProject);

            // Transition to Editor
            setCurrentView('editor');

        } catch (e) {
            console.error("Error creating project:", e);
            setCurrentView('home');
        }
    };

    const handleRefineSubmit = () => {
        if (!refineText.trim()) return;
        handleSearch(refineText, undefined, true);
        setRefineText('');
    };

    const handleEditorBack = () => {
        setCurrentView('home');
        setActiveProject(null);
    };

    const handleOpenProject = (project: Project) => {
        if (project.code) {
            setActiveProject(project);
            setCurrentView('editor');
        } else {
            alert("Project data unavailable.");
        }
    }

    // Called when code is updated inside the editor
    const handleProjectUpdate = (updatedProject: Project) => {
        setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
        setActiveProject(updatedProject);
    };

    const handleDeleteProject = (projectId: string) => {
        if (window.confirm("Are you sure you want to delete this project?")) {
            setProjects(prev => prev.filter(p => p.id !== projectId));
        }
    };

    const handleRenameProject = (projectId: string, newTitle: string) => {
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, title: newTitle } : p));
    };

    const handleStarProject = (projectId: string) => {
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, isStarred: !p.isStarred } : p));
    };

    const handleDuplicateProject = (project: Project) => {
        const duplicatedProject: Project = {
            ...project,
            id: Date.now().toString(),
            title: `${project.title} (Copy)`,
            viewedAt: 'Just now',
            chatHistory: [] // Clear chat history for the duplicate
        };

        setProjects(prev => [duplicatedProject, ...prev]);
        showToast(`Duplicated "${project.title}"`, 'success');
    };

    // Render Logic
    if (currentView === 'building') {
        // Robust title extraction again for the loader screen
        const titleLine = aiResponse?.split('\n').find(line => line.trim().length > 0 && !line.includes('Here is a')) || 'Project';
        const cleanTitle = titleLine.replace(/^#+\s*/, '').replace(/\*\*/g, '').replace(/:$/, '').trim();
        const displayTitle = cleanTitle.length > 30 ? cleanTitle.substring(0, 30) + '...' : cleanTitle;

        return <BuildingScreen projectTitle={displayTitle} currentStep={buildingStep} generatedCodeSnippet={buildingCodeSnippet} />;
    }

    if (currentView === 'editor' && activeProject) {
        return (
            <Editor
                project={activeProject}
                onBack={handleEditorBack}
                onUpdate={handleProjectUpdate}
            />
        );
    }

    // Show loading screen while initializing
    if (isLoadingProjects) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    <span className="text-gray-400 text-sm">Loading your projects...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen-dvh w-full bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--blue-primary)]/30 overflow-hidden font-sans touch-pan-y">

            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[20%] w-[50vw] h-[50vw] bg-[var(--blue-primary)]/10 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-pink-500/10 rounded-full blur-[130px] mix-blend-screen"></div>
                <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-cyan-500/10 rounded-full blur-[100px] mix-blend-screen"></div>
                <div className="absolute bottom-[-20%] right-[10%] w-[50vw] h-[50vw] bg-purple-500/10 rounded-full blur-[120px] mix-blend-screen"></div>
            </div>

            <div className="relative z-10 flex flex-col min-h-[100dvh]">

                {/* Navbar - Mobile optimized */}
                <header className="px-3 xs:px-4 sm:px-4 lg:px-8 py-3 xs:py-4 sm:py-4 lg:py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 xs:gap-3 sm:gap-3 lg:gap-0 bg-[var(--bg-primary)]/80 backdrop-blur-sm border-b border-[var(--border-primary)] min-w-0 touch-pan-x">
                    <div className="text-base xs:text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2 cursor-pointer text-[var(--text-primary)] hover:text-[var(--blue-primary)] transition-all duration-200 active:scale-tap touch-manipulation min-w-0 flex-1" onClick={() => setCurrentView('home')}>
                        <div className="w-3 h-3 bg-[var(--blue-primary)] rounded-full flex-shrink-0"></div>
                        <span className="hidden sm:inline break-words">lovable.dev</span>
                        <span className="sm:hidden break-words">Lovable</span>
                    </div>
                    <div className="flex items-center gap-2 xs:gap-3 sm:gap-4 flex-wrap min-w-0">
                        <button
                            onClick={() => setShowSettingsModal(true)}
                            className="text-xs px-2 xs:px-3 sm:px-3 py-2 xs:py-2.5 rounded-full border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-accent)] transition-all duration-200 active:scale-tap touch-manipulation hidden sm:inline-flex min-w-0 min-h-[40px]"
                        >
                            <span className="break-words">{hasKey ? 'Settings' : 'API Key'}</span>
                        </button>
                        <div className="w-9 h-9 xs:w-10 xs:h-10 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-pink-500 to-blue-500 p-[1px] flex-shrink-0">
                            <div className="w-full h-full rounded-full bg-[var(--bg-primary)] flex items-center justify-center">
                                <span className="text-xs xs:text-sm font-bold text-[var(--text-primary)]">You</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* API Key Warning - Mobile optimized */}
                {!hasKey && (
                    <div className="mx-3 xs:mx-4 sm:mx-8 mb-3 xs:mb-4 p-3 xs:p-4 bg-yellow-500/20 border border-yellow-500/40 rounded-xl flex items-start xs:items-center gap-3 animate-fade-in cursor-pointer hover:bg-yellow-500/25 transition-all duration-200 active:scale-tap touch-manipulation" onClick={() => setShowSettingsModal(true)}>
                        <AlertTriangle size={16} className="text-yellow-600 shrink-0 mt-0.5 xs:mt-0 sm:w-[18px] sm:h-[18px]" />
                        <div className="text-sm xs:text-base flex-1">
                            <span className="text-yellow-800 font-medium block xs:inline">API Key Required:</span>
                            <span className="text-yellow-700 ml-0 xs:ml-1 block xs:inline mt-1 xs:mt-0">
                                Configure your Gemini API key to enable AI features. Tap here to get started.
                            </span>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <main className="flex-grow flex flex-col items-center justify-center pt-4 sm:pt-6 pb-24 sm:pb-20">
                    <InputSection
                        onSubmit={(p, img) => handleSearch(p, img)}
                        isGenerating={isGenerating}
                        selectedTheme={selectedTheme}
                        onThemeChange={setSelectedTheme}
                    />

                    {/* Streaming Response Modal */}
                    {showModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in min-w-0">
                            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl sm:rounded-2xl w-full max-w-2xl h-[90vh] sm:h-[85vh] max-h-[90vh] sm:max-h-[600px] flex flex-col shadow-2xl relative overflow-hidden min-w-0">

                                {/* Modal Header */}
                                <div className="p-3 sm:p-4 border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--bg-tertiary)]">
                                    <div className="flex items-center gap-2 text-[var(--blue-primary)]">
                                        <Sparkles size={16} className="sm:w-[18px] sm:h-[18px]" />
                                        <span className="font-semibold text-sm uppercase tracking-wider">Plan Preview</span>
                                    </div>
                                    <button
                                        onClick={closeModal}
                                        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 hover:bg-[var(--bg-accent)] rounded-md"
                                    >
                                        <X size={18} className="sm:w-[20px] sm:h-[20px]" />
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div className="p-4 sm:p-6 overflow-y-auto flex-grow bg-[var(--bg-primary)]">
                                    {!aiResponse && isGenerating && (
                                        <div className="flex items-center gap-3 text-[var(--text-muted)] italic">
                                            <Loader2 size={18} className="animate-spin text-[var(--blue-primary)] sm:w-[20px] sm:h-[20px]" />
                                            <span className="text-sm sm:text-base">Architecting your idea...</span>
                                        </div>
                                    )}

                                    <div className={`markdown-content prose prose-sm max-w-none leading-relaxed text-sm sm:text-base ${isGenerating ? 'cursor-blink' : ''}`}>
                                        <ReactMarkdown>{aiResponse || ''}</ReactMarkdown>
                                    </div>
                                </div>

                                {/* Refinement Bar */}
                                <div className="p-3 bg-[var(--bg-tertiary)] border-t border-[var(--border-primary)]">
                                    <div className="flex items-center gap-2 bg-[var(--bg-accent)] rounded-lg px-3 py-2 border border-[var(--border-primary)] focus-within:border-[var(--blue-primary)]/50 transition-colors">
                                        <input
                                            type="text"
                                            value={refineText}
                                            onChange={(e) => setRefineText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleRefineSubmit()}
                                            placeholder="Refine this plan..."
                                            className="bg-transparent flex-grow text-sm text-[var(--text-primary)] focus:outline-none placeholder-[var(--text-muted)]"
                                            disabled={isGenerating}
                                        />
                                        <button
                                            onClick={handleRefineSubmit}
                                            disabled={!refineText.trim() || isGenerating}
                                            className="text-[var(--blue-primary)] hover:text-[var(--blue-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Send size={14} className="sm:w-[16px] sm:h-[16px]" />
                                        </button>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="p-3 sm:p-4 border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)] flex justify-end gap-2 sm:gap-3">
                                    <button
                                        onClick={closeModal}
                                        className="px-3 sm:px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        disabled={isGenerating}
                                        onClick={handleCreateProject}
                                        className="px-4 sm:px-5 py-2 bg-[var(--blue-primary)] hover:bg-[var(--blue-secondary)] text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                                    >
                                        Create Project
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                <ProjectDashboard
                    projects={projects}
                    onProjectClick={handleOpenProject}
                    onDeleteProject={handleDeleteProject}
                    onRenameProject={handleRenameProject}
                    onStarProject={handleStarProject}
                    onDuplicateProject={handleDuplicateProject}
                />

            </div>
            {/* Settings Modal (Replaces ApiKeyModal) */}
            <SettingsModal
                isOpen={showSettingsModal}
                onClose={() => {
                    setShowSettingsModal(false);
                    setHasKey(hasValidApiKey()); // Re-check key status on close
                }}
            />

        </div>
    );
}

const AppWrapper = () => (
    <ProgressiveEnhancementProvider>
        <ThemeProvider>
            <ToastProvider>
                <App />
            </ToastProvider>
        </ThemeProvider>
    </ProgressiveEnhancementProvider>
);

export default AppWrapper;