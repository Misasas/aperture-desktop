import { AppSettings, FileSystemItem, FolderMetadata } from '../shared/types';
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
//# sourceMappingURL=preload.d.ts.map