"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
const electron_store_1 = __importDefault(require("electron-store"));
const types_1 = require("../shared/types");
const fileSystem_1 = require("./services/fileSystem");
const thumbnail_1 = require("./services/thumbnail");
const metadata_1 = require("./services/metadata");
const __dirname = path_1.default.dirname((0, url_1.fileURLToPath)(import.meta.url));
// Initialize store
const store = new electron_store_1.default({
    defaults: types_1.defaultSettings,
});
// Services
let fileSystemService;
let thumbnailService;
let metadataService;
let mainWindow = null;
const isDev = process.env.NODE_ENV === 'development' || !electron_1.app.isPackaged;
function createWindow() {
    const settings = store.store;
    mainWindow = new electron_1.BrowserWindow({
        width: settings.window.width,
        height: settings.window.height,
        x: settings.window.x,
        y: settings.window.y,
        minWidth: 800,
        minHeight: 600,
        frame: false,
        titleBarStyle: 'hidden',
        webPreferences: {
            preload: path_1.default.join(__dirname, '../preload/preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        icon: path_1.default.join(__dirname, '../../assets/icon.png'),
        show: false,
    });
    if (settings.window.maximized) {
        mainWindow.maximize();
    }
    // Load app
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../renderer/index.html'));
    }
    // Show when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });
    // Save window state on close
    mainWindow.on('close', () => {
        if (mainWindow) {
            const bounds = mainWindow.getBounds();
            store.set('window', {
                width: bounds.width,
                height: bounds.height,
                x: bounds.x,
                y: bounds.y,
                maximized: mainWindow.isMaximized(),
            });
        }
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
// Initialize services
function initializeServices() {
    const userDataPath = electron_1.app.getPath('userData');
    fileSystemService = new fileSystem_1.FileSystemService();
    thumbnailService = new thumbnail_1.ThumbnailService(userDataPath);
    metadataService = new metadata_1.MetadataService();
}
// Register IPC handlers
function registerIpcHandlers() {
    // Dialog handlers
    electron_1.ipcMain.handle(types_1.IPC_CHANNELS.SELECT_FOLDER, async () => {
        const result = await electron_1.dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory'],
        });
        return result.canceled ? null : result.filePaths[0];
    });
    // File system handlers
    electron_1.ipcMain.handle(types_1.IPC_CHANNELS.READ_DIRECTORY, async (_, dirPath) => {
        return fileSystemService.readDirectory(dirPath);
    });
    electron_1.ipcMain.handle(types_1.IPC_CHANNELS.READ_DIRECTORY_TREE, async (_, dirPath, depth) => {
        return fileSystemService.readDirectoryTree(dirPath, depth);
    });
    electron_1.ipcMain.handle(types_1.IPC_CHANNELS.CREATE_FOLDER, async (_, parentPath, name) => {
        return fileSystemService.createFolder(parentPath, name);
    });
    electron_1.ipcMain.handle(types_1.IPC_CHANNELS.RENAME_ITEM, async (_, oldPath, newName) => {
        return fileSystemService.renameItem(oldPath, newName);
    });
    electron_1.ipcMain.handle(types_1.IPC_CHANNELS.DELETE_ITEM, async (_, itemPath) => {
        return fileSystemService.deleteItem(itemPath);
    });
    electron_1.ipcMain.handle(types_1.IPC_CHANNELS.MOVE_ITEM, async (_, sourcePath, destFolder) => {
        return fileSystemService.moveItem(sourcePath, destFolder);
    });
    electron_1.ipcMain.handle(types_1.IPC_CHANNELS.COPY_FILES, async (_, sourcePaths, destFolder) => {
        return fileSystemService.copyFiles(sourcePaths, destFolder);
    });
    // Metadata handlers
    electron_1.ipcMain.handle(types_1.IPC_CHANNELS.READ_METADATA, async (_, folderPath) => {
        return metadataService.readMetadata(folderPath);
    });
    electron_1.ipcMain.handle(types_1.IPC_CHANNELS.WRITE_METADATA, async (_, folderPath, tags) => {
        return metadataService.writeMetadata(folderPath, tags);
    });
    // Thumbnail handlers
    electron_1.ipcMain.handle(types_1.IPC_CHANNELS.GET_THUMBNAIL, async (_, filePath) => {
        return thumbnailService.getThumbnail(filePath);
    });
    electron_1.ipcMain.handle(types_1.IPC_CHANNELS.CLEAR_THUMBNAIL_CACHE, async () => {
        return thumbnailService.clearCache();
    });
    // Settings handlers
    electron_1.ipcMain.handle(types_1.IPC_CHANNELS.GET_SETTINGS, () => {
        return store.store;
    });
    electron_1.ipcMain.handle(types_1.IPC_CHANNELS.SET_SETTINGS, (_, settings) => {
        Object.entries(settings).forEach(([key, value]) => {
            store.set(key, value);
        });
        return store.store;
    });
    // Window handlers
    electron_1.ipcMain.on(types_1.IPC_CHANNELS.MINIMIZE_WINDOW, () => {
        mainWindow?.minimize();
    });
    electron_1.ipcMain.on(types_1.IPC_CHANNELS.MAXIMIZE_WINDOW, () => {
        if (mainWindow?.isMaximized()) {
            mainWindow.unmaximize();
        }
        else {
            mainWindow?.maximize();
        }
    });
    electron_1.ipcMain.on(types_1.IPC_CHANNELS.CLOSE_WINDOW, () => {
        mainWindow?.close();
    });
    // Shell handlers
    electron_1.ipcMain.handle(types_1.IPC_CHANNELS.OPEN_IN_EXPLORER, async (_, itemPath) => {
        electron_1.shell.showItemInFolder(itemPath);
    });
    electron_1.ipcMain.handle(types_1.IPC_CHANNELS.OPEN_WITH_DEFAULT_APP, async (_, itemPath) => {
        electron_1.shell.openPath(itemPath);
    });
    // Watch directory
    electron_1.ipcMain.handle(types_1.IPC_CHANNELS.WATCH_DIRECTORY, async (_, dirPath) => {
        fileSystemService.watchDirectory(dirPath, () => {
            mainWindow?.webContents.send(types_1.IPC_CHANNELS.DIRECTORY_CHANGED, dirPath);
        });
    });
    electron_1.ipcMain.handle(types_1.IPC_CHANNELS.UNWATCH_DIRECTORY, async () => {
        fileSystemService.unwatchDirectory();
    });
}
// App lifecycle
electron_1.app.whenReady().then(() => {
    initializeServices();
    registerIpcHandlers();
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
//# sourceMappingURL=main.js.map