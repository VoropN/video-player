import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { setupHandlers } from './handlers';

setupHandlers();

let mainWindow: BrowserWindow;
const appRoot = app.getAppPath();

// Handle Electron's app lifecycle events
app.whenReady().then(() => {
  createWindow();
});

// Quit when all windows are closed (except on macOS where the app stays active)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Recreate window when the app is activated (macOS behavior)
app.on('activate', () => {
  if (mainWindow) {
    return;
  }
  createWindow();
});

function createWindow() {
  const { preload, index } = getWindowConfig();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false, // For security, disable node integration
      contextIsolation: true, // Isolate context for security
      preload, // Preload script
    },
  });

  mainWindow.loadURL(`file://${index}`);
  mainWindow.on('closed', () => {
    mainWindow = null; // Clean up when window is closed
  });
}

function getWindowConfig() {
  if (process.env.NODE_ENV === 'development') {
    return {
      preload: path.join(__dirname, 'preload.js'),
      index: path.join(appRoot, '../frontend/browser/index.html'),
    };
  }

  return {
    preload: path.join(
      process.resourcesPath,
      'app.asar',
      'dist/electron/apps/electron/src',
      'preload.js'
    ),
    index: path.join(
      process.resourcesPath,
      'app.asar/dist/frontend/browser/index.html'
    ),
  };
}
