export interface Project {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  viewedAt: string;
  authorName: string;
  authorAvatar: string;
  category: 'mine' | 'shared' | 'template';

  // Legacy: Single file HTML storage
  code?: string;

  // Real File System Integration
  files?: FileNode[];

  chatHistory?: ChatMessage[];
  isStarred?: boolean;
}

export type FileType = 'file' | 'folder';

export interface FileNode {
  id: string;
  projectId: string;
  name: string;      // e.g. "App.tsx"
  path: string;      // e.g. "/src/App.tsx"
  type: FileType;
  content: string;   // Content of the file
  language: string;  // e.g. "typescript", "css"
  parentId?: string; // For nested folders
  createdAt: number;
  updatedAt: number;
}

export enum Tab {
  RECENTLY_VIEWED = 'Recently viewed',
  MY_PROJECTS = 'My projects',
  SHARED_WITH_ME = 'Shared with me',
  TEMPLATES = 'Templates'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}