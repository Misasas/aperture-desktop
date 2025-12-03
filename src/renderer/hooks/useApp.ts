import { useState, useEffect, useCallback } from 'react';
import { AppSettings, FileSystemItem, FolderItem, defaultSettings } from '@shared/types';

// Settings hook
export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.electronAPI.getSettings().then((s) => {
      setSettingsState(s);
      setLoading(false);
    });
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    const updated = await window.electronAPI.setSettings(newSettings);
    setSettingsState(updated);
    return updated;
  }, []);

  return { settings, updateSettings, loading };
}

// File system navigation hook
export function useFileSystem(rootFolder: string | null) {
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [items, setItems] = useState<FileSystemItem[]>([]);
  const [treeItems, setTreeItems] = useState<FileSystemItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load directory tree for sidebar
  const loadTree = useCallback(async () => {
    if (!rootFolder) return;

    try {
      const tree = await window.electronAPI.readDirectoryTree(rootFolder, 10);
      setTreeItems(tree);
    } catch (err) {
      console.error('Error loading tree:', err);
    }
  }, [rootFolder]);

  // Load directory contents
  const loadDirectory = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);

    try {
      const contents = await window.electronAPI.readDirectory(path);
      
      // Load tags for folders
      const itemsWithTags = await Promise.all(
        contents.map(async (item) => {
          if (item.type === 'folder') {
            const metadata = await window.electronAPI.readMetadata(item.path);
            return { ...item, tags: metadata?.tags || [] } as FolderItem;
          }
          return item;
        })
      );

      setItems(itemsWithTags);
      setCurrentPath(path);
    } catch (err: any) {
      setError(err.message || 'Failed to load directory');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Navigate to directory
  const navigate = useCallback((path: string) => {
    loadDirectory(path);
  }, [loadDirectory]);

  // Navigate up one level
  const navigateUp = useCallback(() => {
    if (!currentPath || !rootFolder) return;
    if (currentPath === rootFolder) return;

    const parent = currentPath.split(/[\\/]/).slice(0, -1).join('\\');
    if (parent.length >= rootFolder.length) {
      navigate(parent);
    }
  }, [currentPath, rootFolder, navigate]);

  // Refresh current directory
  const refresh = useCallback(() => {
    if (currentPath) {
      loadDirectory(currentPath);
    }
    loadTree();
  }, [currentPath, loadDirectory, loadTree]);

  // Initialize
  useEffect(() => {
    if (rootFolder) {
      setCurrentPath(rootFolder);
      loadDirectory(rootFolder);
      loadTree();

      // Watch for changes
      window.electronAPI.watchDirectory(rootFolder);

      const unsubscribe = window.electronAPI.onDirectoryChanged(() => {
        refresh();
      });

      return () => {
        unsubscribe();
        window.electronAPI.unwatchDirectory();
      };
    }
  }, [rootFolder]);

  return {
    currentPath,
    items,
    treeItems,
    loading,
    error,
    navigate,
    navigateUp,
    refresh,
    loadTree,
  };
}

// File operations hook
export function useFileOperations(onComplete: () => void) {
  const [operating, setOperating] = useState(false);

  const createFolder = useCallback(async (parentPath: string, name: string = '新しいフォルダ') => {
    setOperating(true);
    try {
      const newPath = await window.electronAPI.createFolder(parentPath, name);
      onComplete();
      return newPath;
    } finally {
      setOperating(false);
    }
  }, [onComplete]);

  const renameItem = useCallback(async (oldPath: string, newName: string) => {
    setOperating(true);
    try {
      const newPath = await window.electronAPI.renameItem(oldPath, newName);
      onComplete();
      return newPath;
    } finally {
      setOperating(false);
    }
  }, [onComplete]);

  const deleteItem = useCallback(async (itemPath: string) => {
    setOperating(true);
    try {
      await window.electronAPI.deleteItem(itemPath);
      onComplete();
    } finally {
      setOperating(false);
    }
  }, [onComplete]);

  const moveItem = useCallback(async (sourcePath: string, destFolder: string) => {
    setOperating(true);
    try {
      const newPath = await window.electronAPI.moveItem(sourcePath, destFolder);
      onComplete();
      return newPath;
    } finally {
      setOperating(false);
    }
  }, [onComplete]);

  const copyFiles = useCallback(async (sourcePaths: string[], destFolder: string) => {
    setOperating(true);
    try {
      const newPaths = await window.electronAPI.copyFiles(sourcePaths, destFolder);
      onComplete();
      return newPaths;
    } finally {
      setOperating(false);
    }
  }, [onComplete]);

  const updateTags = useCallback(async (folderPath: string, tags: string[]) => {
    setOperating(true);
    try {
      await window.electronAPI.writeMetadata(folderPath, tags);
      onComplete();
    } finally {
      setOperating(false);
    }
  }, [onComplete]);

  return {
    operating,
    createFolder,
    renameItem,
    deleteItem,
    moveItem,
    copyFiles,
    updateTags,
  };
}

// Thumbnail loading hook
export function useThumbnail(filePath: string | null) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!filePath) {
      setThumbnail(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    window.electronAPI.getThumbnail(filePath).then((thumb) => {
      if (!cancelled) {
        setThumbnail(thumb);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [filePath]);

  return { thumbnail, loading };
}
