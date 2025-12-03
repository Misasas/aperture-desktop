"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const chokidar_1 = __importDefault(require("chokidar"));
const types_1 = require("../../shared/types");
class FileSystemService {
    watcher = null;
    async readDirectory(dirPath) {
        try {
            const entries = await promises_1.default.readdir(dirPath, { withFileTypes: true });
            const items = [];
            for (const entry of entries) {
                // Skip hidden files and .aperture.json
                if (entry.name.startsWith('.'))
                    continue;
                const fullPath = path_1.default.join(dirPath, entry.name);
                try {
                    const stats = await promises_1.default.stat(fullPath);
                    if (entry.isDirectory()) {
                        const folderItem = {
                            name: entry.name,
                            path: fullPath,
                            type: 'folder',
                            modifiedAt: stats.mtime,
                            tags: [],
                        };
                        items.push(folderItem);
                    }
                    else if (entry.isFile()) {
                        const ext = path_1.default.extname(entry.name).toLowerCase();
                        // Only include supported file types
                        if (types_1.supportedExtensions.includes(ext)) {
                            const fileItem = {
                                name: entry.name,
                                path: fullPath,
                                type: 'file',
                                extension: ext,
                                size: stats.size,
                                modifiedAt: stats.mtime,
                                isImage: types_1.imageExtensions.includes(ext),
                                isVideo: types_1.videoExtensions.includes(ext),
                            };
                            items.push(fileItem);
                        }
                    }
                }
                catch {
                    // Skip files we can't access
                    continue;
                }
            }
            return items;
        }
        catch (error) {
            console.error('Error reading directory:', error);
            throw error;
        }
    }
    async readDirectoryTree(dirPath, depth = 10) {
        const items = await this.readDirectory(dirPath);
        if (depth > 0) {
            for (const item of items) {
                if (item.type === 'folder') {
                    try {
                        item.children = await this.readDirectoryTree(item.path, depth - 1);
                    }
                    catch {
                        item.children = [];
                    }
                }
            }
        }
        return items;
    }
    async createFolder(parentPath, name) {
        let folderName = name;
        let folderPath = path_1.default.join(parentPath, folderName);
        let counter = 1;
        // Handle name conflicts
        while (true) {
            try {
                await promises_1.default.access(folderPath);
                folderName = `${name} (${counter})`;
                folderPath = path_1.default.join(parentPath, folderName);
                counter++;
            }
            catch {
                break;
            }
        }
        await promises_1.default.mkdir(folderPath);
        return folderPath;
    }
    async renameItem(oldPath, newName) {
        const dir = path_1.default.dirname(oldPath);
        const newPath = path_1.default.join(dir, newName);
        // Check if target already exists
        try {
            await promises_1.default.access(newPath);
            throw new Error('A file or folder with this name already exists');
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
        await promises_1.default.rename(oldPath, newPath);
        return newPath;
    }
    async deleteItem(itemPath) {
        // Move to trash instead of permanent delete
        await electron_1.shell.trashItem(itemPath);
    }
    async moveItem(sourcePath, destFolder) {
        const fileName = path_1.default.basename(sourcePath);
        let destPath = path_1.default.join(destFolder, fileName);
        let counter = 1;
        // Handle name conflicts
        const ext = path_1.default.extname(fileName);
        const baseName = path_1.default.basename(fileName, ext);
        while (true) {
            try {
                await promises_1.default.access(destPath);
                destPath = path_1.default.join(destFolder, `${baseName} (${counter})${ext}`);
                counter++;
            }
            catch {
                break;
            }
        }
        await promises_1.default.rename(sourcePath, destPath);
        return destPath;
    }
    async copyFiles(sourcePaths, destFolder) {
        const copiedPaths = [];
        for (const sourcePath of sourcePaths) {
            const fileName = path_1.default.basename(sourcePath);
            let destPath = path_1.default.join(destFolder, fileName);
            let counter = 1;
            // Handle name conflicts
            const ext = path_1.default.extname(fileName);
            const baseName = path_1.default.basename(fileName, ext);
            while (true) {
                try {
                    await promises_1.default.access(destPath);
                    destPath = path_1.default.join(destFolder, `${baseName} (${counter})${ext}`);
                    counter++;
                }
                catch {
                    break;
                }
            }
            const stats = await promises_1.default.stat(sourcePath);
            if (stats.isDirectory()) {
                await this.copyDirectory(sourcePath, destPath);
            }
            else {
                await promises_1.default.copyFile(sourcePath, destPath);
            }
            copiedPaths.push(destPath);
        }
        return copiedPaths;
    }
    async copyDirectory(source, dest) {
        await promises_1.default.mkdir(dest, { recursive: true });
        const entries = await promises_1.default.readdir(source, { withFileTypes: true });
        for (const entry of entries) {
            const srcPath = path_1.default.join(source, entry.name);
            const destPath = path_1.default.join(dest, entry.name);
            if (entry.isDirectory()) {
                await this.copyDirectory(srcPath, destPath);
            }
            else {
                await promises_1.default.copyFile(srcPath, destPath);
            }
        }
    }
    watchDirectory(dirPath, callback) {
        this.unwatchDirectory();
        this.watcher = chokidar_1.default.watch(dirPath, {
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
    unwatchDirectory() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
    }
    debounce(fn, delay) {
        let timeoutId = null;
        return ((...args) => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => fn(...args), delay);
        });
    }
}
exports.FileSystemService = FileSystemService;
//# sourceMappingURL=fileSystem.js.map