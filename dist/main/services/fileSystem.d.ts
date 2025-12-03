import { FileSystemItem } from '../../shared/types';
export declare class FileSystemService {
    private watcher;
    readDirectory(dirPath: string): Promise<FileSystemItem[]>;
    readDirectoryTree(dirPath: string, depth?: number): Promise<FileSystemItem[]>;
    createFolder(parentPath: string, name: string): Promise<string>;
    renameItem(oldPath: string, newName: string): Promise<string>;
    deleteItem(itemPath: string): Promise<void>;
    moveItem(sourcePath: string, destFolder: string): Promise<string>;
    copyFiles(sourcePaths: string[], destFolder: string): Promise<string[]>;
    private copyDirectory;
    watchDirectory(dirPath: string, callback: () => void): void;
    unwatchDirectory(): void;
    private debounce;
}
//# sourceMappingURL=fileSystem.d.ts.map