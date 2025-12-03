import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, AppSettings, FileSystemItem, FolderMetadata } from '../shared/types';

// Expose API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Dialog
  selectFolder: (): Promise<string | null> => 
    ipcRenderer.invoke(IPC_CHANNELS.SELECT_FOLDER),

  // File system
  readDirectory: (dirPath: string): Promise<FileSystemItem[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.READ_DIRECTORY, dirPath),
  
  readDirectoryTree: (dirPath: string, depth?: number): Promise<FileSystemItem[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.READ_DIRECTORY_TREE, dirPath, depth),
  
  createFolder: (parentPath: string, name: string): Promise<string> =>
    ipcRenderer.invoke(IPC_CHANNELS.CREATE_FOLDER, parentPath, name),
  
  renameItem: (oldPath: string, newName: string): Promise<string> =>
    ipcRenderer.invoke(IPC_CHANNELS.RENAME_ITEM, oldPath, newName),
  
  deleteItem: (itemPath: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.DELETE_ITEM, itemPath),
  
  moveItem: (sourcePath: string, destFolder: string): Promise<string> =>
    ipcRenderer.invoke(IPC_CHANNELS.MOVE_ITEM, sourcePath, destFolder),
  
  copyFiles: (sourcePaths: string[], destFolder: string): Promise<string[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.COPY_FILES, sourcePaths, destFolder),

  // Metadata
  readMetadata: (folderPath: string): Promise<FolderMetadata | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.READ_METADATA, folderPath),
  
  writeMetadata: (folderPath: string, tags: string[]): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.WRITE_METADATA, folderPath, tags),

  // Thumbnails
  getThumbnail: (filePath: string): Promise<string | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_THUMBNAIL, filePath),
  
  clearThumbnailCache: (): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.CLEAR_THUMBNAIL_CACHE),

  // Settings
  getSettings: (): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_SETTINGS),
  
  setSettings: (settings: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC_CHANNELS.SET_SETTINGS, settings),

  // Window controls
  minimizeWindow: (): void =>
    ipcRenderer.send(IPC_CHANNELS.MINIMIZE_WINDOW),
  
  maximizeWindow: (): void =>
    ipcRenderer.send(IPC_CHANNELS.MAXIMIZE_WINDOW),
  
  closeWindow: (): void =>
    ipcRenderer.send(IPC_CHANNELS.CLOSE_WINDOW),

  // Shell
  openInExplorer: (itemPath: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.OPEN_IN_EXPLORER, itemPath),
  
  openWithDefaultApp: (itemPath: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.OPEN_WITH_DEFAULT_APP, itemPath),

  // Watch
  watchDirectory: (dirPath: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.WATCH_DIRECTORY, dirPath),
  
  unwatchDirectory: (): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.UNWATCH_DIRECTORY),

  // Events
  onDirectoryChanged: (callback: (dirPath: string) => void) => {
    const handler = (_: Electron.IpcRendererEvent, dirPath: string) => callback(dirPath);
    ipcRenderer.on(IPC_CHANNELS.DIRECTORY_CHANGED, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.DIRECTORY_CHANGED, handler);
  },
});

// Type declaration for renderer
export type ElectronAPI = {
  selectFolder: () => Promise<string | null>;
  readDirectory: (dirPath: string) => Promise<FileSystemItem[]>;
  readDirectoryTree: (dirPath: string, depth?: number) => Promise<FileSystemItem[]>;
  createFolder: (parentPath: string, name: string) => Promise<string>;
  renameItem: (oldPath: string, newName: string) => Promise<string>;
  deleteItem: (itemPath: string) => Promise<void>;
  moveItem: (sourcePath: string, destFolder: string) => Promise<string>;
  copyFiles: (sourcePaths: string[], destFolder: string) => Promise<string[]>;
  readMetadata: (folderPath: string) => Promise<FolderMetadata | null>;
  writeMetadata: (folderPath: string, tags: string[]) => Promise<void>;
  getThumbnail: (filePath: string) => Promise<string | null>;
  clearThumbnailCache: () => Promise<void>;
  getSettings: () => Promise<AppSettings>;
  setSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  openInExplorer: (itemPath: string) => Promise<void>;
  openWithDefaultApp: (itemPath: string) => Promise<void>;
  watchDirectory: (dirPath: string) => Promise<void>;
  unwatchDirectory: () => Promise<void>;
  onDirectoryChanged: (callback: (dirPath: string) => void) => () => void;
};

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
