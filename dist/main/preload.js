"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const types_1 = require("../shared/types");
// Expose API to renderer
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Dialog
    selectFolder: () => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.SELECT_FOLDER),
    // File system
    readDirectory: (dirPath) => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.READ_DIRECTORY, dirPath),
    readDirectoryTree: (dirPath, depth) => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.READ_DIRECTORY_TREE, dirPath, depth),
    createFolder: (parentPath, name) => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.CREATE_FOLDER, parentPath, name),
    renameItem: (oldPath, newName) => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.RENAME_ITEM, oldPath, newName),
    deleteItem: (itemPath) => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.DELETE_ITEM, itemPath),
    moveItem: (sourcePath, destFolder) => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.MOVE_ITEM, sourcePath, destFolder),
    copyFiles: (sourcePaths, destFolder) => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.COPY_FILES, sourcePaths, destFolder),
    // Metadata
    readMetadata: (folderPath) => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.READ_METADATA, folderPath),
    writeMetadata: (folderPath, tags) => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.WRITE_METADATA, folderPath, tags),
    // Thumbnails
    getThumbnail: (filePath) => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.GET_THUMBNAIL, filePath),
    clearThumbnailCache: () => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.CLEAR_THUMBNAIL_CACHE),
    // Settings
    getSettings: () => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.GET_SETTINGS),
    setSettings: (settings) => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.SET_SETTINGS, settings),
    // Window controls
    minimizeWindow: () => electron_1.ipcRenderer.send(types_1.IPC_CHANNELS.MINIMIZE_WINDOW),
    maximizeWindow: () => electron_1.ipcRenderer.send(types_1.IPC_CHANNELS.MAXIMIZE_WINDOW),
    closeWindow: () => electron_1.ipcRenderer.send(types_1.IPC_CHANNELS.CLOSE_WINDOW),
    // Shell
    openInExplorer: (itemPath) => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.OPEN_IN_EXPLORER, itemPath),
    openWithDefaultApp: (itemPath) => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.OPEN_WITH_DEFAULT_APP, itemPath),
    // Watch
    watchDirectory: (dirPath) => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.WATCH_DIRECTORY, dirPath),
    unwatchDirectory: () => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.UNWATCH_DIRECTORY),
    // Events
    onDirectoryChanged: (callback) => {
        const handler = (_, dirPath) => callback(dirPath);
        electron_1.ipcRenderer.on(types_1.IPC_CHANNELS.DIRECTORY_CHANGED, handler);
        return () => electron_1.ipcRenderer.removeListener(types_1.IPC_CHANNELS.DIRECTORY_CHANGED, handler);
    },
});
//# sourceMappingURL=preload.js.map