"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPC_CHANNELS = exports.supportedExtensions = exports.videoExtensions = exports.imageExtensions = exports.thumbnailSizes = exports.defaultSettings = void 0;
exports.defaultSettings = {
    version: '1.0.0',
    rootFolder: null,
    theme: 'dark',
    sidebar: {
        width: 250,
        collapsed: false,
    },
    display: {
        thumbnailSize: 'M',
        itemsPerPage: 20,
        sortBy: 'name',
        sortOrder: 'asc',
    },
    cache: {
        maxSize: 1073741824, // 1GB
    },
    window: {
        width: 1280,
        height: 800,
        x: undefined,
        y: undefined,
        maximized: false,
    },
};
// Thumbnail sizes
exports.thumbnailSizes = {
    S: { width: 160, height: 110 },
    M: { width: 200, height: 140 },
    L: { width: 280, height: 190 },
};
// Supported file extensions
exports.imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
exports.videoExtensions = ['.mp4', '.mov', '.mkv', '.webm', '.avi'];
exports.supportedExtensions = [...exports.imageExtensions, ...exports.videoExtensions];
// IPC channel names
exports.IPC_CHANNELS = {
    // Dialog
    SELECT_FOLDER: 'dialog:select-folder',
    // File system
    READ_DIRECTORY: 'fs:read-directory',
    READ_DIRECTORY_TREE: 'fs:read-directory-tree',
    CREATE_FOLDER: 'fs:create-folder',
    RENAME_ITEM: 'fs:rename-item',
    DELETE_ITEM: 'fs:delete-item',
    MOVE_ITEM: 'fs:move-item',
    COPY_FILES: 'fs:copy-files',
    GET_FILE_INFO: 'fs:get-file-info',
    WATCH_DIRECTORY: 'fs:watch-directory',
    UNWATCH_DIRECTORY: 'fs:unwatch-directory',
    // Metadata
    READ_METADATA: 'metadata:read',
    WRITE_METADATA: 'metadata:write',
    // Thumbnails
    GET_THUMBNAIL: 'thumbnail:get',
    CLEAR_THUMBNAIL_CACHE: 'thumbnail:clear-cache',
    // Settings
    GET_SETTINGS: 'settings:get',
    SET_SETTINGS: 'settings:set',
    // Window
    MINIMIZE_WINDOW: 'window:minimize',
    MAXIMIZE_WINDOW: 'window:maximize',
    CLOSE_WINDOW: 'window:close',
    // Shell
    OPEN_IN_EXPLORER: 'shell:open-in-explorer',
    OPEN_WITH_DEFAULT_APP: 'shell:open-with-default-app',
    // Events (main -> renderer)
    DIRECTORY_CHANGED: 'event:directory-changed',
};
//# sourceMappingURL=types.js.map