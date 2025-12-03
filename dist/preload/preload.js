"use strict";
const electron = require("electron");
const IPC_CHANNELS = {
  // Dialog
  SELECT_FOLDER: "dialog:select-folder",
  // File system
  READ_DIRECTORY: "fs:read-directory",
  READ_DIRECTORY_TREE: "fs:read-directory-tree",
  CREATE_FOLDER: "fs:create-folder",
  RENAME_ITEM: "fs:rename-item",
  DELETE_ITEM: "fs:delete-item",
  MOVE_ITEM: "fs:move-item",
  COPY_FILES: "fs:copy-files",
  WATCH_DIRECTORY: "fs:watch-directory",
  UNWATCH_DIRECTORY: "fs:unwatch-directory",
  // Metadata
  READ_METADATA: "metadata:read",
  WRITE_METADATA: "metadata:write",
  // Thumbnails
  GET_THUMBNAIL: "thumbnail:get",
  CLEAR_THUMBNAIL_CACHE: "thumbnail:clear-cache",
  // Settings
  GET_SETTINGS: "settings:get",
  SET_SETTINGS: "settings:set",
  // Window
  MINIMIZE_WINDOW: "window:minimize",
  MAXIMIZE_WINDOW: "window:maximize",
  CLOSE_WINDOW: "window:close",
  // Shell
  OPEN_IN_EXPLORER: "shell:open-in-explorer",
  OPEN_WITH_DEFAULT_APP: "shell:open-with-default-app",
  // Events (main -> renderer)
  DIRECTORY_CHANGED: "event:directory-changed"
};
electron.contextBridge.exposeInMainWorld("electronAPI", {
  // Dialog
  selectFolder: () => electron.ipcRenderer.invoke(IPC_CHANNELS.SELECT_FOLDER),
  // File system
  readDirectory: (dirPath) => electron.ipcRenderer.invoke(IPC_CHANNELS.READ_DIRECTORY, dirPath),
  readDirectoryTree: (dirPath, depth) => electron.ipcRenderer.invoke(IPC_CHANNELS.READ_DIRECTORY_TREE, dirPath, depth),
  createFolder: (parentPath, name) => electron.ipcRenderer.invoke(IPC_CHANNELS.CREATE_FOLDER, parentPath, name),
  renameItem: (oldPath, newName) => electron.ipcRenderer.invoke(IPC_CHANNELS.RENAME_ITEM, oldPath, newName),
  deleteItem: (itemPath) => electron.ipcRenderer.invoke(IPC_CHANNELS.DELETE_ITEM, itemPath),
  moveItem: (sourcePath, destFolder) => electron.ipcRenderer.invoke(IPC_CHANNELS.MOVE_ITEM, sourcePath, destFolder),
  copyFiles: (sourcePaths, destFolder) => electron.ipcRenderer.invoke(IPC_CHANNELS.COPY_FILES, sourcePaths, destFolder),
  // Metadata
  readMetadata: (folderPath) => electron.ipcRenderer.invoke(IPC_CHANNELS.READ_METADATA, folderPath),
  writeMetadata: (folderPath, tags) => electron.ipcRenderer.invoke(IPC_CHANNELS.WRITE_METADATA, folderPath, tags),
  // Thumbnails
  getThumbnail: (filePath) => electron.ipcRenderer.invoke(IPC_CHANNELS.GET_THUMBNAIL, filePath),
  clearThumbnailCache: () => electron.ipcRenderer.invoke(IPC_CHANNELS.CLEAR_THUMBNAIL_CACHE),
  // Settings
  getSettings: () => electron.ipcRenderer.invoke(IPC_CHANNELS.GET_SETTINGS),
  setSettings: (settings) => electron.ipcRenderer.invoke(IPC_CHANNELS.SET_SETTINGS, settings),
  // Window controls
  minimizeWindow: () => electron.ipcRenderer.send(IPC_CHANNELS.MINIMIZE_WINDOW),
  maximizeWindow: () => electron.ipcRenderer.send(IPC_CHANNELS.MAXIMIZE_WINDOW),
  closeWindow: () => electron.ipcRenderer.send(IPC_CHANNELS.CLOSE_WINDOW),
  // Shell
  openInExplorer: (itemPath) => electron.ipcRenderer.invoke(IPC_CHANNELS.OPEN_IN_EXPLORER, itemPath),
  openWithDefaultApp: (itemPath) => electron.ipcRenderer.invoke(IPC_CHANNELS.OPEN_WITH_DEFAULT_APP, itemPath),
  // Watch
  watchDirectory: (dirPath) => electron.ipcRenderer.invoke(IPC_CHANNELS.WATCH_DIRECTORY, dirPath),
  unwatchDirectory: () => electron.ipcRenderer.invoke(IPC_CHANNELS.UNWATCH_DIRECTORY),
  // Events
  onDirectoryChanged: (callback) => {
    const handler = (_, dirPath) => callback(dirPath);
    electron.ipcRenderer.on(IPC_CHANNELS.DIRECTORY_CHANGED, handler);
    return () => electron.ipcRenderer.removeListener(IPC_CHANNELS.DIRECTORY_CHANGED, handler);
  }
});
