import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import Store from 'electron-store';
import { AppSettings, defaultSettings, IPC_CHANNELS } from '../shared/types';
import { FileSystemService } from './services/fileSystem';
import { ThumbnailService } from './services/thumbnail';
import { MetadataService } from './services/metadata';

// In CommonJS, __dirname is already available

// Services
let fileSystemService: FileSystemService;
let thumbnailService: ThumbnailService;
let metadataService: MetadataService;
let store: Store<AppSettings>;

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const isDev = !app.isPackaged;
  const settings = store.store;

  mainWindow = new BrowserWindow({
    width: settings.window.width,
    height: settings.window.height,
    x: settings.window.x,
    y: settings.window.y,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // Allow loading local files
    },
    icon: path.join(__dirname, '../../assets/favicon.ico'),
    show: false,
  });

  if (settings.window.maximized) {
    mainWindow.maximize();
  }

  // Load app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
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
  const userDataPath = app.getPath('userData');

  // Initialize store
  store = new Store<AppSettings>({
    defaults: defaultSettings,
  });

  fileSystemService = new FileSystemService();
  thumbnailService = new ThumbnailService(userDataPath);
  metadataService = new MetadataService();
}

// Register IPC handlers
function registerIpcHandlers() {
  // Dialog handlers
  ipcMain.handle(IPC_CHANNELS.SELECT_FOLDER, async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // File system handlers
  ipcMain.handle(IPC_CHANNELS.READ_DIRECTORY, async (_, dirPath: string) => {
    return fileSystemService.readDirectory(dirPath);
  });

  ipcMain.handle(IPC_CHANNELS.READ_DIRECTORY_TREE, async (_, dirPath: string, depth?: number) => {
    return fileSystemService.readDirectoryTree(dirPath, depth);
  });

  ipcMain.handle(IPC_CHANNELS.CREATE_FOLDER, async (_, parentPath: string, name: string) => {
    return fileSystemService.createFolder(parentPath, name);
  });

  ipcMain.handle(IPC_CHANNELS.RENAME_ITEM, async (_, oldPath: string, newName: string) => {
    return fileSystemService.renameItem(oldPath, newName);
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_ITEM, async (_, itemPath: string) => {
    return fileSystemService.deleteItem(itemPath);
  });

  ipcMain.handle(IPC_CHANNELS.MOVE_ITEM, async (_, sourcePath: string, destFolder: string) => {
    return fileSystemService.moveItem(sourcePath, destFolder);
  });

  ipcMain.handle(IPC_CHANNELS.COPY_FILES, async (_, sourcePaths: string[], destFolder: string) => {
    return fileSystemService.copyFiles(sourcePaths, destFolder);
  });

  // Metadata handlers
  ipcMain.handle(IPC_CHANNELS.READ_METADATA, async (_, folderPath: string) => {
    return metadataService.readMetadata(folderPath);
  });

  ipcMain.handle(IPC_CHANNELS.WRITE_METADATA, async (_, folderPath: string) => {
    return metadataService.writeMetadata(folderPath);
  });

  // Thumbnail handlers
  ipcMain.handle(IPC_CHANNELS.GET_THUMBNAIL, async (_, filePath: string) => {
    return thumbnailService.getThumbnail(filePath);
  });

  ipcMain.handle(IPC_CHANNELS.GET_FOLDER_THUMBNAIL, async (_, folderPath: string) => {
    return fileSystemService.getFolderThumbnail(folderPath);
  });

  ipcMain.handle(IPC_CHANNELS.CLEAR_THUMBNAIL_CACHE, async () => {
    return thumbnailService.clearCache();
  });

  // Settings handlers
  ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, () => {
    return store.store;
  });

  ipcMain.handle(IPC_CHANNELS.SET_SETTINGS, (_, settings: Partial<AppSettings>) => {
    Object.entries(settings).forEach(([key, value]) => {
      store.set(key as keyof AppSettings, value);
    });
    return store.store;
  });

  // Window handlers
  ipcMain.on(IPC_CHANNELS.MINIMIZE_WINDOW, () => {
    mainWindow?.minimize();
  });

  ipcMain.on(IPC_CHANNELS.MAXIMIZE_WINDOW, () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.on(IPC_CHANNELS.CLOSE_WINDOW, () => {
    mainWindow?.close();
  });

  // Shell handlers
  ipcMain.handle(IPC_CHANNELS.OPEN_IN_EXPLORER, async (_, itemPath: string) => {
    shell.showItemInFolder(itemPath);
  });

  ipcMain.handle(IPC_CHANNELS.OPEN_WITH_DEFAULT_APP, async (_, itemPath: string) => {
    shell.openPath(itemPath);
  });

  // Watch directory
  ipcMain.handle(IPC_CHANNELS.WATCH_DIRECTORY, async (_, dirPath: string) => {
    fileSystemService.watchDirectory(dirPath, () => {
      mainWindow?.webContents.send(IPC_CHANNELS.DIRECTORY_CHANGED, dirPath);
    });
  });

  ipcMain.handle(IPC_CHANNELS.UNWATCH_DIRECTORY, async () => {
    fileSystemService.unwatchDirectory();
  });
}

// App lifecycle
app.whenReady().then(() => {
  initializeServices();
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
