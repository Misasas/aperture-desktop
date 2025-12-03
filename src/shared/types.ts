// File system item types
export interface FileItem {
  name: string;
  path: string;
  type: 'file';
  extension: string;
  size: number;
  modifiedAt: Date;
  isImage: boolean;
  isVideo: boolean;
}

export interface FolderItem {
  name: string;
  path: string;
  type: 'folder';
  modifiedAt: Date;
  tags: string[];
  children?: (FileItem | FolderItem)[];
  isExpanded?: boolean;
}

export type FileSystemItem = FileItem | FolderItem;

// Folder metadata (stored in .aperture.json)
export interface FolderMetadata {
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Settings
export interface AppSettings {
  version: string;
  rootFolder: string | null;
  theme: 'light' | 'dark' | 'cream';
  sidebar: {
    width: number;
    collapsed: boolean;
  };
  display: {
    thumbnailSize: 'S' | 'M' | 'L';
    itemsPerPage: number;
    sortBy: 'name' | 'modifiedAt';
    sortOrder: 'asc' | 'desc';
  };
  cache: {
    maxSize: number;
  };
  window: {
    width: number;
    height: number;
    x: number | undefined;
    y: number | undefined;
    maximized: boolean;
  };
}

export const defaultSettings: AppSettings = {
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
export const thumbnailSizes = {
  S: { width: 160, height: 110 },
  M: { width: 200, height: 140 },
  L: { width: 280, height: 190 },
} as const;

// Supported file extensions
export const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
export const videoExtensions = ['.mp4', '.mov', '.mkv', '.webm', '.avi'];
export const supportedExtensions = [...imageExtensions, ...videoExtensions];

// IPC channel names
export const IPC_CHANNELS = {
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
} as const;
