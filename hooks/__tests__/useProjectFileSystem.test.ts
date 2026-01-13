import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useProjectFileSystem } from '../useProjectFileSystem';
import { db } from '../../lib/db';

// Mock the db module
vi.mock('../../lib/db', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    db: {
      hasMigrated: vi.fn(),
      getProjectFiles: vi.fn(),
      setMigrated: vi.fn(),
      createFile: vi.fn(),
      updateFileContent: vi.fn().mockResolvedValue(undefined),
      deleteFile: vi.fn(),
      renameFile: vi.fn(),
      getUniquePath: vi.fn(),
    },
  };
});

const mockDb = db as any;

describe('useProjectFileSystem', () => {
  const mockProject = {
    id: 'test-project-id',
    title: 'Test Project',
    thumbnailUrl: '',
    viewedAt: '2023-01-01',
    authorName: 'Test Author',
    authorAvatar: '',
    category: 'mine' as const,
    code: '<html><body>Hello World</body></html>',
  };

  const mockFile = {
    id: 'file-1',
    projectId: 'test-project-id',
    name: 'index.html',
    path: '/index.html',
    type: 'file' as const,
    content: '<html><body>Hello World</body></html>',
    language: 'html',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns hook interface with correct structure', () => {
    mockDb.getProjectFiles.mockResolvedValue([mockFile]);
    mockDb.hasMigrated.mockResolvedValue(true);

    const { result } = renderHook(() => useProjectFileSystem(mockProject));

    expect(result.current).toHaveProperty('files');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('activeFileId');
    expect(result.current).toHaveProperty('updateFile');
    expect(result.current).toHaveProperty('createFile');
    expect(result.current).toHaveProperty('deleteFile');
    expect(result.current).toHaveProperty('renameFile');
    expect(result.current).toHaveProperty('forceSave');
    expect(result.current).toHaveProperty('flushAll');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('clearError');
  });

  it('initializes with loading state', () => {
    mockDb.getProjectFiles.mockResolvedValue([mockFile]);
    mockDb.hasMigrated.mockResolvedValue(true);

    const { result } = renderHook(() => useProjectFileSystem(mockProject));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.files).toEqual([]);
  });

  it('updateFile function exists and is callable', () => {
    const { result } = renderHook(() => useProjectFileSystem(mockProject));

    expect(typeof result.current.updateFile).toBe('function');

    // Should not throw when called
    expect(() => {
      result.current.updateFile('test-id', 'new content');
    }).not.toThrow();
  });

  it('createFile function exists and is callable', () => {
    const { result } = renderHook(() => useProjectFileSystem(mockProject));

    expect(typeof result.current.createFile).toBe('function');

    // Mock the function to return null for sync test
    mockDb.getUniquePath.mockResolvedValue('/test.js');

    // Should not throw when called
    expect(() => {
      result.current.createFile('test.js');
    }).not.toThrow();
  });

  it('deleteFile function exists and is callable', () => {
    const { result } = renderHook(() => useProjectFileSystem(mockProject));

    expect(typeof result.current.deleteFile).toBe('function');

    // Should not throw when called
    expect(() => {
      result.current.deleteFile('test-id');
    }).not.toThrow();
  });

  it('renameFile function exists and is callable', () => {
    const { result } = renderHook(() => useProjectFileSystem(mockProject));

    expect(typeof result.current.renameFile).toBe('function');

    // Should not throw when called
    expect(() => {
      result.current.renameFile('test-id', 'newname.html');
    }).not.toThrow();
  });

  it('forceSave function exists and is callable', () => {
    const { result } = renderHook(() => useProjectFileSystem(mockProject));

    expect(typeof result.current.forceSave).toBe('function');

    // Should not throw when called
    expect(() => {
      result.current.forceSave('test-id');
    }).not.toThrow();
  });

  it('flushAll function exists and is callable', () => {
    const { result } = renderHook(() => useProjectFileSystem(mockProject));

    expect(typeof result.current.flushAll).toBe('function');

    // Should not throw when called
    expect(() => {
      result.current.flushAll();
    }).not.toThrow();
  });

  it('clearError function exists and is callable', () => {
    const { result } = renderHook(() => useProjectFileSystem(mockProject));

    expect(typeof result.current.clearError).toBe('function');

    // Should not throw when called
    expect(() => {
      result.current.clearError();
    }).not.toThrow();
  });

  it('setActiveFileId function exists and is callable', () => {
    const { result } = renderHook(() => useProjectFileSystem(mockProject));

    expect(typeof result.current.setActiveFileId).toBe('function');

    // Should not throw when called
    expect(() => {
      result.current.setActiveFileId('test-id');
    }).not.toThrow();
  });
});