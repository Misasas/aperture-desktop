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
    children?: (FileItem | FolderItem)[];
    isExpanded?: boolean;
    thumbnailPath?: string;
}
export type FileSystemItem = FileItem | FolderItem;
export interface FolderMetadata {
    createdAt: string;
    updatedAt: string;
}
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
export declare const defaultSettings: AppSettings;
export declare const thumbnailSizes: {
    readonly S: {
        readonly width: 160;
        readonly height: 110;
    };
    readonly M: {
        readonly width: 200;
        readonly height: 140;
    };
    readonly L: {
        readonly width: 280;
        readonly height: 190;
    };
};
export declare const imageExtensions: string[];
export declare const videoExtensions: string[];
export declare const supportedExtensions: string[];
export declare const IPC_CHANNELS: {
    readonly SELECT_FOLDER: "dialog:select-folder";
    readonly READ_DIRECTORY: "fs:read-directory";
    readonly READ_DIRECTORY_TREE: "fs:read-directory-tree";
    readonly CREATE_FOLDER: "fs:create-folder";
    readonly RENAME_ITEM: "fs:rename-item";
    readonly DELETE_ITEM: "fs:delete-item";
    readonly MOVE_ITEM: "fs:move-item";
    readonly COPY_FILES: "fs:copy-files";
    readonly GET_FILE_INFO: "fs:get-file-info";
    readonly WATCH_DIRECTORY: "fs:watch-directory";
    readonly UNWATCH_DIRECTORY: "fs:unwatch-directory";
    readonly READ_METADATA: "metadata:read";
    readonly WRITE_METADATA: "metadata:write";
    readonly GET_THUMBNAIL: "thumbnail:get";
    readonly CLEAR_THUMBNAIL_CACHE: "thumbnail:clear-cache";
    readonly GET_SETTINGS: "settings:get";
    readonly SET_SETTINGS: "settings:set";
    readonly MINIMIZE_WINDOW: "window:minimize";
    readonly MAXIMIZE_WINDOW: "window:maximize";
    readonly CLOSE_WINDOW: "window:close";
    readonly OPEN_IN_EXPLORER: "shell:open-in-explorer";
    readonly OPEN_WITH_DEFAULT_APP: "shell:open-with-default-app";
    readonly DIRECTORY_CHANGED: "event:directory-changed";
};
//# sourceMappingURL=types.d.ts.map