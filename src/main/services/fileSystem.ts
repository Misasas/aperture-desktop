import fs from 'fs/promises';
import path from 'path';
import { shell } from 'electron';
import chokidar, { FSWatcher } from 'chokidar';
import {
  FileItem,
  FolderItem,
  FileSystemItem,
  imageExtensions,
  videoExtensions,
  supportedExtensions,
} from '../../shared/types';

export class FileSystemService {
  private watcher: FSWatcher | null = null;

  async readDirectory(dirPath: string): Promise<FileSystemItem[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const items: FileSystemItem[] = [];

      for (const entry of entries) {
        // Skip hidden files and .aperture.json
        if (entry.name.startsWith('.')) continue;

        const fullPath = path.join(dirPath, entry.name);
        
        try {
          const stats = await fs.stat(fullPath);

          if (entry.isDirectory()) {
            const folderItem: FolderItem = {
              name: entry.name,
              path: fullPath,
              type: 'folder',
              modifiedAt: stats.mtime,
              tags: [],
            };
            items.push(folderItem);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            
            // Only include supported file types
            if (supportedExtensions.includes(ext)) {
              const fileItem: FileItem = {
                name: entry.name,
                path: fullPath,
                type: 'file',
                extension: ext,
                size: stats.size,
                modifiedAt: stats.mtime,
                isImage: imageExtensions.includes(ext),
                isVideo: videoExtensions.includes(ext),
              };
              items.push(fileItem);
            }
          }
        } catch {
          // Skip files we can't access
          continue;
        }
      }

      return items;
    } catch (error) {
      console.error('Error reading directory:', error);
      throw error;
    }
  }

  async readDirectoryTree(dirPath: string, depth: number = 10): Promise<FileSystemItem[]> {
    const items = await this.readDirectory(dirPath);
    
    if (depth > 0) {
      for (const item of items) {
        if (item.type === 'folder') {
          try {
            (item as FolderItem).children = await this.readDirectoryTree(item.path, depth - 1);
          } catch {
            (item as FolderItem).children = [];
          }
        }
      }
    }

    return items;
  }

  async createFolder(parentPath: string, name: string): Promise<string> {
    let folderName = name;
    let folderPath = path.join(parentPath, folderName);
    let counter = 1;

    // Handle name conflicts
    while (true) {
      try {
        await fs.access(folderPath);
        folderName = `${name} (${counter})`;
        folderPath = path.join(parentPath, folderName);
        counter++;
      } catch {
        break;
      }
    }

    await fs.mkdir(folderPath);
    return folderPath;
  }

  async renameItem(oldPath: string, newName: string): Promise<string> {
    const dir = path.dirname(oldPath);
    const newPath = path.join(dir, newName);

    // Check if target already exists
    try {
      await fs.access(newPath);
      throw new Error('A file or folder with this name already exists');
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    await fs.rename(oldPath, newPath);
    return newPath;
  }

  async deleteItem(itemPath: string): Promise<void> {
    // Move to trash instead of permanent delete
    await shell.trashItem(itemPath);
  }

  async moveItem(sourcePath: string, destFolder: string): Promise<string> {
    const fileName = path.basename(sourcePath);
    let destPath = path.join(destFolder, fileName);
    let counter = 1;

    // Handle name conflicts
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);
    
    while (true) {
      try {
        await fs.access(destPath);
        destPath = path.join(destFolder, `${baseName} (${counter})${ext}`);
        counter++;
      } catch {
        break;
      }
    }

    await fs.rename(sourcePath, destPath);
    return destPath;
  }

  async copyFiles(sourcePaths: string[], destFolder: string): Promise<string[]> {
    const copiedPaths: string[] = [];

    for (const sourcePath of sourcePaths) {
      const fileName = path.basename(sourcePath);
      let destPath = path.join(destFolder, fileName);
      let counter = 1;

      // Handle name conflicts
      const ext = path.extname(fileName);
      const baseName = path.basename(fileName, ext);
      
      while (true) {
        try {
          await fs.access(destPath);
          destPath = path.join(destFolder, `${baseName} (${counter})${ext}`);
          counter++;
        } catch {
          break;
        }
      }

      const stats = await fs.stat(sourcePath);
      
      if (stats.isDirectory()) {
        await this.copyDirectory(sourcePath, destPath);
      } else {
        await fs.copyFile(sourcePath, destPath);
      }
      
      copiedPaths.push(destPath);
    }

    return copiedPaths;
  }

  private async copyDirectory(source: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(source, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(source, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  watchDirectory(dirPath: string, callback: () => void): void {
    this.unwatchDirectory();

    this.watcher = chokidar.watch(dirPath, {
      ignoreInitial: true,
      depth: 0,
      ignored: /(^|[\/\\])\./,
    });

    const debounce = this.debounce(callback, 500);
    
    this.watcher
      .on('add', debounce)
      .on('addDir', debounce)
      .on('unlink', debounce)
      .on('unlinkDir', debounce)
      .on('change', debounce);
  }

  unwatchDirectory(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  private debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
    let timeoutId: NodeJS.Timeout | null = null;
    
    return ((...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => fn(...args), delay);
    }) as T;
  }
}
